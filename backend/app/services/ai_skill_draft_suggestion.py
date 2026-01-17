from __future__ import annotations

import re
from collections.abc import Sequence

from loguru import logger
from pydantic import BaseModel, ConfigDict
from pydantic_ai import Agent
from sqlmodel import Session

from app.db.session import engine
from app.models.chat_message import ChatMessage
from app.models.enums import ChatRole, SkillSuggestionStatus
from app.services.ai_provider import build_openai_chat_model
from app.services.ai_types import AiDeps
from app.services.skill_draft_suggestion_service import (
    create_skill_draft_suggestion,
    has_draft_rejection,
    list_skill_draft_suggestions,
)

_CLARIFY_MARKER = '<!-- Clarification chain -->'
_CLARIFY_RESPONSE_KEY = 'clarify_chain_response'

_SKILL_INTENT_PATTERN = re.compile(
    r'(技能|skill|skill_id|read_skill|generate_skill|create_skill|'
    r'生成技能|创建技能|保存技能|总结成技能|沉淀技能|技能库|技能模板)',
    re.IGNORECASE,
)
_FALLBACK_FLOW_PATTERN = re.compile(r'(步骤|流程|清单|计划|方案|第[一二三四五六七八九十]|\\n\\d+\\.|\\n\\d+、)')


class SkillDraftSuggestionResult(BaseModel):
    model_config = ConfigDict(extra='forbid')

    should_suggest: bool
    goal: str | None = None
    constraints: str | None = None
    reason: str | None = None


_skill_draft_agent: Agent[AiDeps] | None = None


def _get_skill_draft_agent() -> Agent[AiDeps]:
    global _skill_draft_agent
    if _skill_draft_agent is not None:
        return _skill_draft_agent
    _skill_draft_agent = Agent(
        model=None,
        output_type=SkillDraftSuggestionResult,
        system_prompt=(
            '你是技能沉淀推荐器。根据对话上下文判断是否存在可复用的流程/方法/清单，'
            '值得沉淀成技能。若值得，should_suggest=true，并给出简短 goal（<=20字）'
            '和关键约束（<=60字，可为空），reason 为一句话理由（<=20字）。'
            '若不值得，should_suggest=false 且 goal=null。'
        ),
        defer_model_check=True,
    )
    return _skill_draft_agent


def _role_value(role) -> str:
    return role.value if hasattr(role, 'value') else str(role)


def _contains_clarify_chain(text: str) -> bool:
    return _CLARIFY_MARKER.lower() in text.lower()


def _is_clarify_response(text: str) -> bool:
    return _CLARIFY_RESPONSE_KEY in text


def _looks_like_skill_intent(text: str) -> bool:
    return bool(_SKILL_INTENT_PATTERN.search(text))


def _fallback_goal(prompt: str) -> str:
    stripped = prompt.strip()
    if not stripped:
        return ''
    short = re.split(r'[，。,；;！？!?]', stripped)[0].strip()
    candidate = short or stripped
    return candidate[:20]


def _fallback_suggestion(prompt: str, assistant_content: str) -> SkillDraftSuggestionResult | None:
    if not _FALLBACK_FLOW_PATTERN.search(assistant_content):
        return None
    if len(prompt.strip()) < 6:
        return None
    goal = _fallback_goal(prompt)
    if not goal:
        return None
    return SkillDraftSuggestionResult(
        should_suggest=True,
        goal=goal,
        constraints=None,
        reason='检测到可复用流程',
    )


def _build_context_snippet(
    history: Sequence[ChatMessage],
    prompt: str,
    assistant_content: str,
    limit: int = 6,
) -> str:
    lines = ['对话摘要：']
    recent = list(history)[-limit:] if history else []
    for item in recent:
        role = _role_value(item.role)
        if role == ChatRole.USER.value:
            speaker = '用户'
        elif role == ChatRole.ASSISTANT.value:
            speaker = '助手'
        else:
            speaker = '系统'
        content = item.content.strip()
        if content:
            lines.append(f'{speaker}: {content}')
    if prompt.strip():
        lines.append(f'当前用户输入: {prompt.strip()}')
    if assistant_content.strip():
        lines.append(f'最新助手回复: {assistant_content.strip()}')
    return '\n'.join(lines).strip()


async def maybe_create_skill_draft_suggestion(
    *,
    deps: AiDeps,
    prompt: str,
    history: Sequence[ChatMessage],
    assistant_message_id: str,
    assistant_content: str,
) -> None:
    if deps.selected_skill_id:
        return
    if not prompt.strip():
        return
    if not assistant_content.strip():
        return
    if _contains_clarify_chain(assistant_content):
        return
    if _is_clarify_response(prompt):
        return
    if _looks_like_skill_intent(prompt) or _looks_like_skill_intent(assistant_content):
        return
    if len(assistant_content.strip()) < 120:
        return

    with Session(engine) as session:
        if has_draft_rejection(session, deps.session_id):
            return
        pending = list_skill_draft_suggestions(session, deps.session_id, status=SkillSuggestionStatus.PENDING)
        if pending:
            return

    model = build_openai_chat_model(deps.model_id)
    agent = _get_skill_draft_agent()
    snippet = _build_context_snippet(history, prompt, assistant_content)
    try:
        result = await agent.run(snippet, model=model, deps=deps)
    except Exception as exc:  # noqa: BLE001
        logger.warning('ai.skill_draft.match_failed', error=str(exc))
        return

    payload = result.output
    if not payload.should_suggest or not payload.goal:
        payload = _fallback_suggestion(prompt, assistant_content)
    if not payload or not payload.should_suggest or not payload.goal:
        return

    goal = payload.goal.strip()
    if not goal:
        return
    constraints = payload.constraints.strip() if payload.constraints else None
    reason = payload.reason.strip() if payload.reason else None

    with Session(engine) as session:
        record = create_skill_draft_suggestion(
            session,
            deps.session_id,
            assistant_message_id,
            goal=goal,
            constraints=constraints,
            reason=reason,
        )
        logger.info(
            'ai.skill_draft.suggested',
            session_id=deps.session_id,
            user_id=deps.user.id,
            suggestion_id=record.id,
        )
