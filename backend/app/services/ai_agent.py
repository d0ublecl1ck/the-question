from __future__ import annotations

import json
import re
from collections.abc import AsyncIterator, Sequence
from pathlib import Path
from time import perf_counter

from loguru import logger
from pydantic import BaseModel
from pydantic_ai import Agent

from app.models.chat_message import ChatMessage
from app.models.enums import ChatRole
from app.services.ai_prompts import read_prompt_file
from app.services.ai_provider import build_openai_chat_model
from app.services.ai_tools import create_skill, generate_skill, read_skill
from app.services.ai_types import AiDeps

_CLARIFY_MARKER = '<!-- Clarification chain -->'
_CLARIFY_RESPONSE_KEY = 'clarify_chain_response'

_GREETING_PATTERN = re.compile(
    r'^(hi|hello|你好|您好|在吗|早上好|下午好|晚上好|嗨|哈喽)[!！。,.]*$',
    re.IGNORECASE,
)
_SKILL_INTENT_PATTERN = re.compile(
    r'(技能|skill|skill_id|read_skill|generate_skill|create_skill|'
    r'生成技能|创建技能|保存技能|总结成技能|沉淀技能|技能库|技能模板)',
    re.IGNORECASE,
)
_CLARIFY_FORCE_PATTERNS = [
    re.compile(r'^我想选.+$'),
    re.compile(r'^(帮(我|忙)?)(写|做|画|设计).{0,6}$'),
    re.compile(r'^(写|做|画|设计).{0,6}$'),
    re.compile(r'^(优化|改进|调整|修复)(一下)?$'),
    re.compile(r'.*(怎么弄|怎么做|如何做|咋弄|怎么搞)$'),
]

_GENERAL_SYSTEM_PROMPT = """
你是 WenDui 的通用 AI Agent。必须遵守以下规则：
1) 始终使用中文回复用户。
2) 不要向用户暴露任何工具调用细节。
3) 默认直接给出可执行答案，不要输出澄清链。
""".strip()

_SKILL_SYSTEM_PROMPT = """
你是 WenDui 的 Skill Agent，专门处理技能相关任务。必须遵守以下规则：
1) 始终使用中文回复用户。
2) 当用户选择了技能时，必须先调用 read_skill 获取完整 SKILL.md，并严格遵循 Instructions。
3) 当用户希望创建新技能或总结流程为技能时，先调用 generate_skill 获得完整 SKILL.md；
   若用户明确要求保存技能，则调用 create_skill 保存到个人技能库。
4) 当用户明确要求保存技能时，调用 create_skill。
5) 不要向用户暴露任何工具调用细节。
6) 不要输出澄清链，澄清由 Clarify Agent 处理。
""".strip()


class ClarifyDecision(BaseModel):
    should_clarify: bool
    reason: str | None = None


_general_agent: Agent[AiDeps] | None = None
_skill_agent: Agent[AiDeps] | None = None
_clarify_agent: Agent[AiDeps] | None = None
_clarify_decider: Agent[AiDeps] | None = None
_clarify_rules: str | None = None


def _chat_clarify_rules_path() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / 'skills' / 'system' / 'chat-clarify-chain.md'


def _load_clarify_rules() -> str:
    global _clarify_rules
    if _clarify_rules is None:
        _clarify_rules = read_prompt_file(_chat_clarify_rules_path())
    return _clarify_rules


def _build_clarify_system_prompt() -> str:
    rules = _load_clarify_rules()
    parts = [
        '你是对话澄清链生成器。',
        '输出要求：',
        f'- 第一行必须是 `{_CLARIFY_MARKER}`。',
        '- 仅输出 JSON 澄清链，不要添加额外文字或代码块。',
        '- 至少输出 1 个问题，根据缺失信息选择类型（单选/排序/补充说明可按需省略）。',
        '',
    ]
    if rules:
        parts.append(rules)
    return '\n'.join(parts).strip()


def _build_clarify_decider_prompt() -> str:
    rules = _load_clarify_rules()
    parts = [
        '你是对话澄清决策器。',
        '根据对话历史与用户最新输入判断是否需要触发澄清链。',
        '当用户意图不清晰、关键约束缺失、无法直接执行时，should_clarify=true。',
        '当用户意图足够清晰、可以直接给出合理回答时，should_clarify=false。',
        '只输出结构化字段，不要添加任何解释。',
        '',
    ]
    if rules:
        parts.append(rules)
    return '\n'.join(parts).strip()


def get_general_agent() -> Agent[AiDeps]:
    global _general_agent
    if _general_agent is not None:
        return _general_agent
    _general_agent = Agent(
        model=None,
        output_type=str,
        system_prompt=_GENERAL_SYSTEM_PROMPT,
        defer_model_check=True,
    )
    return _general_agent


def get_skill_agent() -> Agent[AiDeps]:
    global _skill_agent
    if _skill_agent is not None:
        return _skill_agent
    _skill_agent = Agent(
        model=None,
        output_type=str,
        system_prompt=_SKILL_SYSTEM_PROMPT,
        tools=[read_skill, generate_skill, create_skill],
        defer_model_check=True,
    )
    return _skill_agent


def get_clarify_agent() -> Agent[AiDeps]:
    global _clarify_agent
    if _clarify_agent is not None:
        return _clarify_agent
    _clarify_agent = Agent(
        model=None,
        output_type=str,
        system_prompt=_build_clarify_system_prompt(),
        defer_model_check=True,
    )
    return _clarify_agent


def get_clarify_decider() -> Agent[AiDeps]:
    global _clarify_decider
    if _clarify_decider is not None:
        return _clarify_decider
    _clarify_decider = Agent(
        model=None,
        output_type=ClarifyDecision,
        system_prompt=_build_clarify_decider_prompt(),
        defer_model_check=True,
    )
    return _clarify_decider


def _role_value(role) -> str:
    return role.value if hasattr(role, 'value') else str(role)


def _is_greeting(text: str) -> bool:
    return bool(_GREETING_PATTERN.match(text.strip()))


def _is_clarify_response(text: str) -> bool:
    return _CLARIFY_RESPONSE_KEY in text


def _looks_like_skill_request(text: str) -> bool:
    return bool(_SKILL_INTENT_PATTERN.search(text))


def _force_clarify(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return False
    if _is_greeting(stripped):
        return False
    return any(pattern.search(stripped) for pattern in _CLARIFY_FORCE_PATTERNS)


def _last_user_message_without_clarify(history: Sequence[ChatMessage]) -> ChatMessage | None:
    for message in reversed(history):
        if _role_value(message.role) != ChatRole.USER.value:
            continue
        if _is_clarify_response(message.content):
            continue
        return message
    return None


def _build_skill_instructions(selected_skill_id: str | None) -> list[str]:
    if not selected_skill_id:
        return []
    return [
        f"当前用户已选择 skill_id: {selected_skill_id}。在回答前必须先调用 read_skill 获取该技能内容并遵循其指令。"
    ]


def _preview(text: str, max_len: int = 80) -> str:
    trimmed = text.replace('\n', ' ').strip()
    if len(trimmed) <= max_len:
        return trimmed
    return f"{trimmed[:max_len]}..."


def should_use_skill_agent(
    *,
    prompt: str,
    history: Sequence[ChatMessage],
    selected_skill_id: str | None,
) -> bool:
    if selected_skill_id:
        return True
    if _looks_like_skill_request(prompt):
        return True
    if _is_clarify_response(prompt):
        last_user = _last_user_message_without_clarify(history)
        if last_user and _looks_like_skill_request(last_user.content):
            return True
    for message in reversed(history):
        if _role_value(message.role) != ChatRole.USER.value:
            continue
        if _looks_like_skill_request(message.content):
            return True
    return False


def _default_clarify_payload() -> str:
    payload = {
        'clarify_chain': [
            {
                'type': 'single_choice',
                'question': '你的需求是否已经包含必要的目标与约束？',
                'choices': ['是', '否', '其他'],
            },
            {
                'type': 'ranking',
                'question': '请按重要性排序：',
                'options': ['目标/结果', '约束/范围', '输出格式'],
            },
            {
                'type': 'free_text',
                'question': '补充说明（最重要的缺失信息）？',
            },
        ]
    }
    return f"{_CLARIFY_MARKER}\n{json.dumps(payload, ensure_ascii=False)}"


def _ensure_clarify_marker(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return _default_clarify_payload()
    if stripped.lower().startswith(_CLARIFY_MARKER.lower()):
        return stripped
    return f"{_CLARIFY_MARKER}\n{stripped}"


async def _should_trigger_clarify(
    *,
    deps: AiDeps,
    prompt: str,
    message_history: Sequence,
    model,
) -> ClarifyDecision | None:
    agent = get_clarify_decider()
    try:
        result = await agent.run(
            prompt,
            model=model,
            deps=deps,
            message_history=message_history,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning('ai.clarify.decider_failed', error=str(exc))
        return None
    return result.output


async def stream_agent_text(
    *,
    deps: AiDeps,
    prompt: str,
    message_history: Sequence,
    raw_history: Sequence[ChatMessage],
) -> AsyncIterator[str]:
    model = build_openai_chat_model(deps.model_id)
    prompt_preview = _preview(prompt)
    clarify_reason = None
    if _force_clarify(prompt):
        should_clarify = True
        clarify_reason = 'heuristic'
        logger.info(
            'ai.clarify.force',
            session_id=deps.session_id,
            user_id=deps.user.id,
            model=deps.model_id,
            prompt_len=len(prompt),
            prompt_preview=prompt_preview,
        )
    else:
        decision = await _should_trigger_clarify(
            deps=deps,
            prompt=prompt,
            message_history=message_history,
            model=model,
        )
        should_clarify = bool(decision and decision.should_clarify)
        clarify_reason = decision.reason if decision else 'decider_unavailable'
        logger.info(
            'ai.clarify.decision',
            session_id=deps.session_id,
            user_id=deps.user.id,
            model=deps.model_id,
            should_clarify=should_clarify,
            reason=clarify_reason,
            prompt_len=len(prompt),
            prompt_preview=prompt_preview,
        )

    if should_clarify:
        logger.info(
            'ai.agent.route',
            session_id=deps.session_id,
            user_id=deps.user.id,
            model=deps.model_id,
            route='clarify',
            reason=clarify_reason,
            selected_skill_id=deps.selected_skill_id,
        )
        agent = get_clarify_agent()
        logger.info(
            'ai.clarify.run',
            session_id=deps.session_id,
            user_id=deps.user.id,
            model=deps.model_id,
        )
        result = await agent.run(
            prompt,
            model=model,
            deps=deps,
            message_history=message_history,
        )
        output_text = str(result.output or '')
        logger.info(
            'ai.clarify.result',
            session_id=deps.session_id,
            user_id=deps.user.id,
            model=deps.model_id,
            output_len=len(output_text),
        )
        yield _ensure_clarify_marker(output_text)
        return

    use_skill_agent = should_use_skill_agent(
        prompt=prompt,
        history=raw_history,
        selected_skill_id=deps.selected_skill_id,
    )
    agent = get_skill_agent() if use_skill_agent else get_general_agent()
    instructions = _build_skill_instructions(deps.selected_skill_id) if use_skill_agent else []
    route = 'skill' if use_skill_agent else 'general'
    logger.info(
        'ai.agent.route',
        session_id=deps.session_id,
        user_id=deps.user.id,
        model=deps.model_id,
        route=route,
        selected_skill_id=deps.selected_skill_id,
    )
    start_ts = perf_counter()
    delta_count = 0
    char_count = 0
    fallback_len = 0
    async with agent.run_stream(
        prompt,
        model=model,
        deps=deps,
        message_history=message_history,
        instructions=instructions or None,
    ) as stream:
        async for delta in stream.stream_text(delta=True, debounce_by=None):
            if not delta:
                continue
            delta_count += 1
            char_count += len(delta)
            yield delta
        if delta_count == 0:
            try:
                fallback_output = await stream.get_output()
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    'ai.agent.stream.fallback_failed',
                    session_id=deps.session_id,
                    user_id=deps.user.id,
                    model=deps.model_id,
                    route=route,
                    error=str(exc),
                )
            else:
                if isinstance(fallback_output, str) and fallback_output:
                    fallback_len = len(fallback_output)
                    logger.warning(
                        'ai.agent.stream.fallback',
                        session_id=deps.session_id,
                        user_id=deps.user.id,
                        model=deps.model_id,
                        route=route,
                        output_len=fallback_len,
                    )
                    yield fallback_output
                else:
                    logger.warning(
                        'ai.agent.stream.empty_output',
                        session_id=deps.session_id,
                        user_id=deps.user.id,
                        model=deps.model_id,
                        route=route,
                        output_type=type(fallback_output).__name__,
                    )
    duration_ms = int((perf_counter() - start_ts) * 1000)
    logger.info(
        'ai.agent.stream.done',
        session_id=deps.session_id,
        user_id=deps.user.id,
        model=deps.model_id,
        route=route,
        delta_count=delta_count,
        char_count=char_count,
        fallback_len=fallback_len,
        duration_ms=duration_ms,
    )
