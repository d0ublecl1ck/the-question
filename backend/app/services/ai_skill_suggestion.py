from __future__ import annotations

import json
import re
from collections.abc import Sequence

from loguru import logger
from pydantic import BaseModel, ConfigDict
from pydantic_ai import Agent
from sqlmodel import Session, select

from app.db.session import engine
from app.models.chat_message import ChatMessage
from app.models.enums import ChatRole, SkillSuggestionStatus, SkillVisibility
from app.models.skill import Skill
from app.services.ai_provider import build_openai_chat_model
from app.services.ai_types import AiDeps
from app.services.chat_service import create_suggestion, has_rejection, list_suggestions
from app.services.skill_service import skill_tags_to_list

_CLARIFY_MARKER = '<!-- Clarification chain -->'
_CLARIFY_RESPONSE_KEY = 'clarify_chain_response'

_SKILL_INTENT_PATTERN = re.compile(
    r'(技能|skill|skill_id|read_skill|generate_skill|create_skill|'
    r'生成技能|创建技能|保存技能|总结成技能|沉淀技能|技能库|技能模板)',
    re.IGNORECASE,
)

_KEYWORD_RULES: list[dict] = [
    {
        'keywords': ['市场规模', 'tam', 'sam', 'som', 'market sizing', 'market-sizing'],
        'name_hints': ['market-sizing'],
        'tag_hints': ['市场规模', 'tam', 'sam', 'som'],
        'reason': '市场规模分析更高效',
    },
    {
        'keywords': ['线索', '潜在客户', 'leads', 'lead', '客户研究', '线索研究'],
        'name_hints': ['lead-research'],
        'tag_hints': ['线索', '客户', 'research', 'leads'],
        'reason': '线索研究流程匹配',
    },
    {
        'keywords': ['论文', 'paper', 'research paper'],
        'name_hints': ['write-paper', 'paper'],
        'tag_hints': ['论文', '写作'],
        'reason': '论文写作场景匹配',
    },
]


class SkillMatchResult(BaseModel):
    model_config = ConfigDict(extra='forbid')

    matched: bool
    skill_id: str | None = None
    reason: str | None = None


_skill_match_agent: Agent[AiDeps] | None = None


def _get_skill_match_agent() -> Agent[AiDeps]:
    global _skill_match_agent
    if _skill_match_agent is not None:
        return _skill_match_agent
    _skill_match_agent = Agent(
        model=None,
        output_type=SkillMatchResult,
        system_prompt=(
            '你是技能匹配器。根据聊天上下文与候选技能摘要判断是否应推荐技能。'
            '仅在匹配度高且有明确用途时推荐。'
            '只能从候选技能 id 中选择，不能臆造。'
            '若没有合适匹配，matched=false 且 skill_id=null。'
            '当 matched=true 时，reason 给出一句简短中文理由（不超过20字）。'
        ),
        defer_model_check=True,
    )
    return _skill_match_agent


def _build_skill_summaries(user_id: str) -> list[dict]:
    with Session(engine) as session:
        statement = select(Skill).where(Skill.deleted.is_(False))
        statement = statement.where(
            (Skill.owner_id == user_id) | (Skill.visibility == SkillVisibility.PUBLIC)
        )
        skills = list(session.exec(statement).all())
    summaries: list[dict] = []
    seen: set[str] = set()
    for skill in skills:
        if skill.id in seen:
            continue
        seen.add(skill.id)
        summaries.append(
            {
                'id': skill.id,
                'name': skill.name,
                'description': skill.description,
                'tags': skill_tags_to_list(skill),
                'visibility': skill.visibility.value if hasattr(skill.visibility, 'value') else skill.visibility,
            }
        )
    return summaries


def _build_context_snippet(history: Sequence[ChatMessage], prompt: str, limit: int = 6) -> str:
    lines = ['对话摘要：']
    recent = list(history)[-limit:] if history else []
    for item in recent:
        role = item.role.value if hasattr(item.role, 'value') else str(item.role)
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
    return '\n'.join(lines).strip()


def _build_skill_instruction(summaries: list[dict]) -> str:
    payload = json.dumps(summaries, ensure_ascii=False)
    return f'候选技能摘要（仅可从这些技能中选择）：\n{payload}'


def _contains_clarify_chain(text: str) -> bool:
    return _CLARIFY_MARKER.lower() in text.lower()


def _is_clarify_response(text: str) -> bool:
    return _CLARIFY_RESPONSE_KEY in text


def _looks_like_skill_intent(text: str) -> bool:
    return bool(_SKILL_INTENT_PATTERN.search(text))


def _role_value(role) -> str:
    return role.value if hasattr(role, 'value') else str(role)


def _normalize_text(text: str) -> tuple[str, str]:
    lowered = text.lower()
    compact = re.sub(r'\s+', '', lowered)
    return lowered, compact


def _find_skill_by_hints(
    summaries: list[dict],
    *,
    name_hints: list[str],
    tag_hints: list[str],
) -> str | None:
    name_hints_lower = [item.lower() for item in name_hints]
    tag_hints_lower = [item.lower() for item in tag_hints]
    for item in summaries:
        name = str(item.get('name', '')).lower()
        tags = [str(tag).lower() for tag in item.get('tags', [])]
        if any(hint in name for hint in name_hints_lower):
            return item.get('id')
        if tag_hints_lower and any(hint in tag for hint in tag_hints_lower for tag in tags):
            return item.get('id')
    return None


def _fallback_match(prompt: str, history: Sequence[ChatMessage], summaries: list[dict]) -> SkillMatchResult | None:
    recent_user = ' '.join(
        item.content for item in history if _role_value(item.role) == ChatRole.USER.value
    )
    text = f"{prompt} {recent_user}".strip()
    if not text:
        return None
    lowered, compact = _normalize_text(text)
    for rule in _KEYWORD_RULES:
        if any(keyword in lowered or keyword in compact for keyword in rule['keywords']):
            skill_id = _find_skill_by_hints(
                summaries,
                name_hints=rule['name_hints'],
                tag_hints=rule['tag_hints'],
            )
            if skill_id:
                return SkillMatchResult(matched=True, skill_id=skill_id, reason=rule['reason'])

    best_id: str | None = None
    best_score = 0
    for item in summaries:
        name = str(item.get('name', '')).lower()
        description = str(item.get('description', '')).lower()
        tags = [str(tag).lower() for tag in item.get('tags', [])]
        tokens = set(name.replace('_', '-').split('-')) | set(tags)
        score = 0
        if name and name in lowered:
            score += 3
        if description and description in lowered:
            score += 1
        for token in tokens:
            if len(token) < 2:
                continue
            if token in lowered or token in compact:
                score += 1
        if score > best_score:
            best_score = score
            best_id = item.get('id')
    if best_id and best_score >= 2:
        return SkillMatchResult(matched=True, skill_id=best_id, reason='可能有合适的技能可用')
    return None


async def _match_skill(
    deps: AiDeps,
    *,
    prompt: str,
    history: Sequence[ChatMessage],
    summaries: list[dict],
) -> SkillMatchResult | None:
    if not summaries:
        return None
    model = build_openai_chat_model(deps.model_id)
    agent = _get_skill_match_agent()
    instruction = _build_skill_instruction(summaries)
    snippet = _build_context_snippet(history, prompt)
    try:
        result = await agent.run(snippet, model=model, deps=deps, instructions=[instruction])
    except Exception as exc:  # noqa: BLE001
        logger.warning('ai.skill.match_failed', error=str(exc))
        return None
    return result.output


async def maybe_create_skill_suggestion(
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
    if _contains_clarify_chain(assistant_content):
        return
    if _is_clarify_response(prompt):
        return
    if _looks_like_skill_intent(prompt):
        return

    summaries = _build_skill_summaries(deps.user.id)
    if not summaries:
        return
    candidate_ids = {item['id'] for item in summaries}

    with Session(engine) as session:
        if has_rejection(session, deps.session_id):
            return
        pending = list_suggestions(session, deps.session_id, status=SkillSuggestionStatus.PENDING)
        if pending:
            return

    match = await _match_skill(deps, prompt=prompt, history=history, summaries=summaries)
    if not match or not match.matched or not match.skill_id:
        match = _fallback_match(prompt, history, summaries)
    if not match or not match.matched or not match.skill_id:
        return
    if match.skill_id not in candidate_ids:
        logger.warning('ai.skill.match_invalid', skill_id=match.skill_id, session_id=deps.session_id)
        return

    with Session(engine) as session:
        record = create_suggestion(
            session,
            deps.session_id,
            match.skill_id,
            assistant_message_id,
            reason=match.reason,
        )
        logger.info(
            'ai.skill.suggested',
            session_id=deps.session_id,
            user_id=deps.user.id,
            skill_id=record.skill_id,
        )
