from __future__ import annotations

from pathlib import Path
from typing import Optional

import anyio
from loguru import logger
from pydantic import BaseModel, ConfigDict, Field
from pydantic_ai import Agent, RunContext
from sqlmodel import Session

from app.db.session import engine
from app.models.enums import SkillVisibility
from app.schemas.skill import SkillCreate
from app.services.ai_prompts import read_prompt_file
from app.services.ai_provider import build_openai_chat_model
from app.services.ai_types import AiDeps
from app.services.skill_service import (
    create_skill as create_skill_record,
    get_latest_version,
    get_skill,
    get_version,
    skill_tags_to_list,
)

from app.services.skill_utils import clean_tags, ensure_skill_content, ensure_skill_name, ensure_visibility


def _skill_creator_path() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / 'skills' / 'system' / 'skill-creator.md'


def _skill_template_path() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / 'skills' / 'system' / 'skill-creator-template.md'


class GeneratedSkill(BaseModel):
    model_config = ConfigDict(extra='forbid')

    name: str
    description: str
    tags: list[str] = Field(default_factory=list)
    visibility: SkillVisibility = SkillVisibility.PRIVATE
    content: str


def _load_skill_creator_context() -> str:
    return read_prompt_file(_skill_creator_path())


def _load_skill_template() -> str:
    return read_prompt_file(_skill_template_path())


def _build_skill_prompt(goal: str, constraints: Optional[str], examples: Optional[list[str]], max_len: int) -> str:
    skill_creator_context = _load_skill_creator_context()
    skill_template = _load_skill_template()
    parts = [
        '你是 Skill 生成器，请生成符合规范的 SKILL.md，并输出结构化字段。',
        f'- name 必须只包含小写字母、数字、连字符',
        f'- description 需要包含“做什么 + 何时用”',
        '- tags 3~6 个短标签',
        '- content 必须是完整 SKILL.md，包含 frontmatter + ## Instructions + ## Examples',
        f'- content 总长度不超过 {max_len} 字符',
        '如有 skill-creator 规范，请严格遵守。',
        '',
    ]
    if skill_creator_context:
        parts.append('【skill-creator 规范】')
        parts.append(skill_creator_context)
        parts.append('')
    if skill_template:
        parts.append('【SKILL 模板】')
        parts.append(skill_template)
        parts.append('')
    parts.append(f'目标：{goal}')
    if constraints:
        parts.append(f'约束：{constraints}')
    if examples:
        parts.append('参考示例：')
        for item in examples:
            parts.append(f'- {item}')
    return '\n'.join(parts)


_skill_generator_agent: Agent[None] | None = None


def _get_skill_generator_agent() -> Agent[None]:
    global _skill_generator_agent
    if _skill_generator_agent is not None:
        return _skill_generator_agent
    _skill_generator_agent = Agent(
        model=None,
        output_type=GeneratedSkill,
        system_prompt='你是严格的 Skill 生成器，只输出结构化字段，不要输出多余解释。',
        defer_model_check=True,
    )
    return _skill_generator_agent


async def generate_skill_data(
    deps: AiDeps,
    *,
    goal: str,
    constraints: Optional[str] = None,
    examples: Optional[list[str]] = None,
) -> dict:
    prompt = _build_skill_prompt(goal, constraints, examples, deps.skill_content_max_len)
    model = build_openai_chat_model(deps.model_id)
    agent = _get_skill_generator_agent()
    result = await agent.run(prompt, model=model)
    payload: GeneratedSkill | None = getattr(result, 'output', None) or getattr(result, 'data', None)
    if payload is None:
        raise AttributeError('skill generator result missing output')

    name_result = ensure_skill_name(payload.name)
    tags = clean_tags(payload.tags)[:6]
    visibility = ensure_visibility(payload.visibility)
    content = ensure_skill_content(
        payload.content,
        name=name_result.name,
        description=payload.description.strip(),
        max_len=deps.skill_content_max_len,
    )

    warnings: list[str] = []
    if name_result.normalized:
        warnings.append('name_normalized')
    if len(tags) < 3:
        warnings.append('tags_insufficient')

    return {
        'name': name_result.name,
        'description': payload.description.strip(),
        'tags': tags,
        'visibility': visibility.value,
        'content': content,
        'warnings': warnings,
    }


async def read_skill_data(deps: AiDeps, *, skill_id: str, version: Optional[int] = None) -> dict:
    def _fetch() -> dict:
        with Session(engine) as session:
            skill = get_skill(session, skill_id)
            if not skill:
                raise ValueError('skill not found')
            if skill.visibility == SkillVisibility.PRIVATE and skill.owner_id != deps.user.id:
                raise ValueError('skill not accessible')
            if version is not None:
                skill_version = get_version(session, skill_id, version)
            else:
                skill_version = get_latest_version(session, skill_id)
            if not skill_version:
                raise ValueError('skill version not found')
            return {
                'id': skill.id,
                'name': skill.name,
                'description': skill.description,
                'tags': skill_tags_to_list(skill),
                'visibility': skill.visibility.value if hasattr(skill.visibility, 'value') else skill.visibility,
                'version': skill_version.version,
                'content': skill_version.content,
            }

    return await anyio.to_thread.run_sync(_fetch)


async def create_skill_data(
    deps: AiDeps,
    *,
    name: str,
    description: str,
    tags: list[str],
    content: str,
    visibility: SkillVisibility | None = None,
    avatar: Optional[str] = None,
) -> dict:
    name_result = ensure_skill_name(name)
    cleaned_tags = clean_tags(tags)
    visibility_value = ensure_visibility(visibility)
    content_value = ensure_skill_content(
        content,
        name=name_result.name,
        description=description.strip(),
        max_len=deps.skill_content_max_len,
    )

    def _create() -> tuple[str, int]:
        with Session(engine) as session:
            skill, version = create_skill_record(
                session,
                SkillCreate(
                    name=name_result.name,
                    description=description.strip(),
                    visibility=visibility_value,
                    tags=cleaned_tags,
                    avatar=avatar,
                    content=content_value,
                ),
                deps.user.id,
            )
            return skill.id, version.version

    skill_id, version_number = await anyio.to_thread.run_sync(_create)
    warnings: list[str] = []
    if name_result.normalized:
        warnings.append('name_normalized')
    if len(cleaned_tags) < 3:
        warnings.append('tags_insufficient')

    logger.info(
        'ai.skill.created',
        skill_id=skill_id,
        user_id=deps.user.id,
        visibility=visibility_value.value,
    )
    return {
        'skill_id': skill_id,
        'version': version_number,
        'visibility': visibility_value.value,
        'warnings': warnings,
    }


async def read_skill(ctx: RunContext[AiDeps], skill_id: str, version: Optional[int] = None) -> dict:
    """读取指定技能的最新版本或某个版本的 SKILL.md 内容。"""
    return await read_skill_data(ctx.deps, skill_id=skill_id, version=version)


async def generate_skill(
    ctx: RunContext[AiDeps],
    goal: str,
    constraints: Optional[str] = None,
    examples: Optional[list[str]] = None,
) -> dict:
    """根据目标生成结构化技能信息与完整 SKILL.md。"""
    return await generate_skill_data(ctx.deps, goal=goal, constraints=constraints, examples=examples)


async def create_skill(
    ctx: RunContext[AiDeps],
    name: str,
    description: str,
    tags: list[str],
    content: str,
    visibility: SkillVisibility | None = None,
    avatar: Optional[str] = None,
) -> dict:
    """将 SKILL.md 保存为当前用户的个人技能。"""
    return await create_skill_data(
        ctx.deps,
        name=name,
        description=description,
        tags=tags,
        content=content,
        visibility=visibility,
        avatar=avatar,
    )
