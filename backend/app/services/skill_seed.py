from __future__ import annotations

import json
import secrets
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from sqlmodel import Session, select

from app.core.config import settings
from app.models.enums import SkillVisibility, UserRole
from app.models.skill import Skill
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillUpdate
from app.services.auth_service import create_user
from app.services.skill_service import create_skill, create_version, get_latest_version, update_skill
from app.services.skill_utils import clean_tags, ensure_skill_content, ensure_skill_name


SYSTEM_SKILL_EMAIL = 'system@wendui.ai'


@dataclass(frozen=True)
class PresetSkill:
    name: str
    description: str
    tags: list[str]
    content: str
    visibility: SkillVisibility = SkillVisibility.PUBLIC
    avatar: str | None = None


@dataclass(frozen=True)
class SeedSummary:
    created: int
    updated: int
    skipped: int


def _ensure_system_user(session: Session, email: str) -> User:
    record = session.exec(select(User).where(User.email == email)).first()
    if record:
        if record.role != UserRole.ADMIN:
            record.role = UserRole.ADMIN
            session.add(record)
            session.commit()
            session.refresh(record)
        return record
    password = secrets.token_urlsafe(24)
    record = create_user(session, email, password)
    record.role = UserRole.ADMIN
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def _parse_payload(raw: Any) -> list[PresetSkill]:
    if isinstance(raw, dict):
        items = raw.get('skills', [])
    else:
        items = raw
    if not isinstance(items, list):
        raise ValueError('preset skills must be a list or {skills: []}')
    presets: list[PresetSkill] = []
    for item in items:
        if not isinstance(item, dict):
            raise ValueError('each preset skill must be an object')
        name = str(item.get('name', '')).strip()
        description = str(item.get('description', '')).strip()
        tags = item.get('tags') or []
        content = str(item.get('content', '')).strip()
        visibility = item.get('visibility') or SkillVisibility.PUBLIC
        avatar = item.get('avatar')
        if not name or not description or not content:
            raise ValueError('preset skill requires name, description, and content')
        presets.append(
            PresetSkill(
                name=name,
                description=description,
                tags=[str(tag) for tag in tags],
                content=content,
                visibility=SkillVisibility(visibility),
                avatar=avatar if avatar else None,
            )
        )
    return presets


def load_presets(path: Path) -> list[PresetSkill]:
    raw = path.read_text(encoding='utf-8')
    payload = json.loads(raw)
    return _parse_payload(payload)


def seed_market_skills(
    session: Session,
    presets: Iterable[PresetSkill],
    *,
    system_email: str = SYSTEM_SKILL_EMAIL,
) -> SeedSummary:
    system_user = _ensure_system_user(session, system_email)
    created = 0
    updated = 0
    skipped = 0
    for preset in presets:
        visibility = SkillVisibility.PUBLIC
        name_result = ensure_skill_name(preset.name)
        tags = clean_tags(preset.tags)
        content = ensure_skill_content(
            preset.content,
            name=name_result.name,
            description=preset.description,
            max_len=settings.SKILL_CONTENT_MAX_LEN,
        )
        statement = select(Skill).where(
            (Skill.name == name_result.name)
            & (Skill.owner_id == system_user.id)
            & (Skill.deleted.is_(False))
        )
        existing = session.exec(statement).first()
        if not existing:
            create_skill(
                session,
                SkillCreate(
                    name=name_result.name,
                    description=preset.description,
                    visibility=visibility,
                    tags=tags,
                    avatar=preset.avatar,
                    content=content,
                ),
                system_user.id,
            )
            created += 1
            continue

        updated_skill = update_skill(
            session,
            existing,
            SkillUpdate(
                name=name_result.name,
                description=preset.description,
                visibility=visibility,
                tags=tags,
                avatar=preset.avatar,
            ),
        )
        latest_version = get_latest_version(session, updated_skill.id)
        if latest_version and latest_version.content == content:
            skipped += 1
            continue
        create_version(session, updated_skill.id, content, system_user.id)
        updated += 1

    return SeedSummary(created=created, updated=updated, skipped=skipped)
