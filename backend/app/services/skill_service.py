import json
from datetime import datetime, timezone
from typing import Iterable
from sqlmodel import Session, select
from app.models.skill import Skill
from app.models.enums import SkillVisibility
from app.models.skill_version import SkillVersion
from app.schemas.skill import SkillCreate, SkillImport, SkillUpdate


def _serialize_tags(tags: list[str] | None) -> str | None:
    if not tags:
        return None
    return json.dumps(tags)


def _deserialize_tags(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return [item.strip() for item in raw.split(',') if item.strip()]
    if isinstance(value, list):
        return [str(item) for item in value]
    return []


def skill_tags_to_list(skill: Skill) -> list[str]:
    return _deserialize_tags(skill.tags)


def create_skill(session: Session, payload: SkillCreate, owner_id: str | None) -> tuple[Skill, SkillVersion]:
    skill = Skill(
        name=payload.name,
        description=payload.description,
        visibility=payload.visibility,
        tags=_serialize_tags(payload.tags),
        owner_id=owner_id,
    )
    session.add(skill)
    session.commit()
    session.refresh(skill)

    version = SkillVersion(
        skill_id=skill.id,
        version=1,
        content=payload.content,
        created_by=owner_id,
        parent_version_id=None,
    )
    session.add(version)
    session.commit()
    session.refresh(version)

    return skill, version


def list_skills(
    session: Session,
    q: str | None = None,
    visibility: SkillVisibility | None = None,
    tags: list[str] | None = None,
    owner_id: str | None = None,
    include_deleted: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[Skill]:
    statement = select(Skill)
    if not include_deleted:
        statement = statement.where(Skill.deleted.is_(False))
    if q:
        like = f"%{q}%"
        statement = statement.where((Skill.name.like(like)) | (Skill.description.like(like)))
    if visibility:
        statement = statement.where(Skill.visibility == visibility)
    if tags:
        for tag in tags:
            statement = statement.where(Skill.tags.like(f"%{tag}%"))
    if owner_id:
        statement = statement.where(Skill.owner_id == owner_id)
    statement = statement.offset(offset).limit(limit)
    return list(session.exec(statement).all())


def get_skill(session: Session, skill_id: str, include_deleted: bool = False) -> Skill | None:
    statement = select(Skill).where(Skill.id == skill_id)
    if not include_deleted:
        statement = statement.where(Skill.deleted.is_(False))
    return session.exec(statement).first()


def update_skill(session: Session, skill: Skill, payload: SkillUpdate) -> Skill:
    data = payload.model_dump(exclude_unset=True)
    if 'tags' in data:
        skill.tags = _serialize_tags(data['tags'])
        data.pop('tags')
    for key, value in data.items():
        setattr(skill, key, value)
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return skill


def soft_delete_skill(session: Session, skill: Skill) -> Skill:
    skill.deleted = True
    skill.deleted_at = datetime.now(timezone.utc)
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return skill


def get_latest_version(session: Session, skill_id: str) -> SkillVersion | None:
    statement = (
        select(SkillVersion)
        .where(SkillVersion.skill_id == skill_id)
        .order_by(SkillVersion.version.desc())
        .limit(1)
    )
    return session.exec(statement).first()


def list_versions(
    session: Session,
    skill_id: str,
    limit: int | None = 50,
    offset: int = 0,
) -> list[SkillVersion]:
    statement = (
        select(SkillVersion)
        .where(SkillVersion.skill_id == skill_id)
        .order_by(SkillVersion.version.asc())
    )
    if offset:
        statement = statement.offset(offset)
    if limit is not None:
        statement = statement.limit(limit)
    return list(session.exec(statement).all())


def get_version(session: Session, skill_id: str, version: int) -> SkillVersion | None:
    statement = select(SkillVersion).where(
        (SkillVersion.skill_id == skill_id) & (SkillVersion.version == version)
    )
    return session.exec(statement).first()


def create_version(
    session: Session,
    skill_id: str,
    content: str,
    created_by: str | None,
    parent_version_id: str | None = None,
) -> SkillVersion:
    latest = get_latest_version(session, skill_id)
    next_version = 1 if latest is None else latest.version + 1
    parent_id = parent_version_id or (latest.id if latest else None)
    version = SkillVersion(
        skill_id=skill_id,
        version=next_version,
        content=content,
        created_by=created_by,
        parent_version_id=parent_id,
    )
    session.add(version)
    session.commit()
    session.refresh(version)
    return version


def export_skill(session: Session, skill_id: str) -> tuple[Skill, list[SkillVersion]] | None:
    skill = get_skill(session, skill_id, include_deleted=True)
    if not skill:
        return None
    versions = list_versions(session, skill_id, limit=None)
    return skill, versions


def _apply_versions(
    session: Session,
    skill_id: str,
    versions: Iterable[SkillVersion],
) -> None:
    for version in versions:
        session.add(version)
    session.commit()


def import_skill(session: Session, payload: SkillImport, owner_id: str | None) -> tuple[Skill, SkillVersion]:
    skill = Skill(
        name=payload.name,
        description=payload.description,
        visibility=payload.visibility,
        tags=_serialize_tags(payload.tags),
        owner_id=owner_id,
    )
    session.add(skill)
    session.commit()
    session.refresh(skill)

    versions_payload = payload.versions
    if not versions_payload:
        version = SkillVersion(
            skill_id=skill.id,
            version=1,
            content=payload.content,
            created_by=owner_id,
            parent_version_id=None,
        )
        session.add(version)
        session.commit()
        session.refresh(version)
        return skill, version

    next_version = 1
    created_versions: list[SkillVersion] = []
    for item in versions_payload:
        version_number = item.version or next_version
        next_version = max(next_version, version_number + 1)
        created_versions.append(
            SkillVersion(
                skill_id=skill.id,
                version=version_number,
                content=item.content,
                created_by=item.created_by or owner_id,
                parent_version_id=item.parent_version_id,
            )
        )
    _apply_versions(session, skill.id, created_versions)
    latest = max(created_versions, key=lambda v: v.version)
    session.refresh(latest)
    return skill, latest


def search_skills(session: Session, q: str, limit: int = 50, offset: int = 0) -> list[Skill]:
    like = f"%{q}%"
    statement = (
        select(Skill)
        .join(SkillVersion, SkillVersion.skill_id == Skill.id, isouter=True)
        .where(Skill.deleted.is_(False))
        .where(
            (Skill.name.like(like))
            | (Skill.description.like(like))
            | (Skill.tags.like(like))
            | (SkillVersion.content.like(like))
        )
        .distinct()
        .offset(offset)
        .limit(limit)
    )
    return list(session.exec(statement).all())
