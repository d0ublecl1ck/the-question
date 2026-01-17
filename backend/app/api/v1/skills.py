from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.models.user import User
from app.schemas.skill import (
    SkillCreate,
    SkillDetail,
    SkillExport,
    SkillImport,
    SkillOut,
    SkillUpdate,
    SkillVersionCreate,
    SkillVersionNode,
    SkillVersionOut,
)
from app.models.enums import SkillVisibility
from app.services.auth_service import get_current_user
from app.services.skill_service import (
    create_skill,
    create_version,
    export_skill,
    get_latest_version,
    get_skill,
    get_version,
    import_skill,
    list_skills,
    list_versions,
    soft_delete_skill,
    skill_tags_to_list,
    update_skill,
)

router = APIRouter(prefix='/skills', tags=['skills'])


def _to_skill_out(skill) -> SkillOut:
    return SkillOut(
        id=skill.id,
        name=skill.name,
        description=skill.description,
        visibility=skill.visibility,
        tags=skill_tags_to_list(skill),
        owner_id=skill.owner_id,
        created_at=skill.created_at,
        updated_at=skill.updated_at,
        deleted=skill.deleted,
        deleted_at=skill.deleted_at,
    )


def _to_detail(skill, version) -> SkillDetail:
    return SkillDetail(
        **_to_skill_out(skill).model_dump(),
        latest_version=version.version,
        content=version.content,
    )


@router.post('', response_model=SkillDetail, status_code=status.HTTP_201_CREATED)
def create_skill_endpoint(
    payload: SkillCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillDetail:
    skill, version = create_skill(session, payload, user.id)
    return _to_detail(skill, version)


@router.get('', response_model=list[SkillOut])
def list_skills_endpoint(
    q: str | None = None,
    visibility: SkillVisibility | None = None,
    tags: str | None = None,
    owner_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[SkillOut]:
    tag_list = [item.strip() for item in tags.split(',')] if tags else None
    skills = list_skills(
        session,
        q=q,
        visibility=visibility,
        tags=tag_list,
        owner_id=owner_id,
        limit=limit,
        offset=offset,
    )
    return [_to_skill_out(skill) for skill in skills]


@router.get('/{skill_id}', response_model=SkillDetail)
def get_skill_endpoint(skill_id: str, session: Session = Depends(get_session)) -> SkillDetail:
    skill = get_skill(session, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    version = get_latest_version(session, skill_id)
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill version not found')
    return _to_detail(skill, version)


@router.patch('/{skill_id}', response_model=SkillOut)
def update_skill_endpoint(
    skill_id: str,
    payload: SkillUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillOut:
    skill = get_skill(session, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    if skill.owner_id and skill.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    skill = update_skill(session, skill, payload)
    return _to_skill_out(skill)


@router.delete('/{skill_id}')
def delete_skill_endpoint(
    skill_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    skill = get_skill(session, skill_id, include_deleted=True)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    if skill.owner_id and skill.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    if not skill.deleted:
        skill = soft_delete_skill(session, skill)
    return {'status': 'ok', 'deleted_at': skill.deleted_at}


@router.post('/{skill_id}/versions', response_model=SkillVersionOut, status_code=status.HTTP_201_CREATED)
def create_version_endpoint(
    skill_id: str,
    payload: SkillVersionCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillVersionOut:
    skill = get_skill(session, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    if skill.owner_id and skill.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    version = create_version(session, skill_id, payload.content, user.id, payload.parent_version_id)
    return SkillVersionOut(
        id=version.id,
        skill_id=version.skill_id,
        version=version.version,
        content=version.content,
        created_by=version.created_by,
        created_at=version.created_at,
        parent_version_id=version.parent_version_id,
    )


@router.get('/{skill_id}/versions', response_model=list[SkillVersionOut])
def list_versions_endpoint(
    skill_id: str,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[SkillVersionOut]:
    skill = get_skill(session, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    versions = list_versions(session, skill_id, limit=limit, offset=offset)
    return [
        SkillVersionOut(
            id=version.id,
            skill_id=version.skill_id,
            version=version.version,
            content=version.content,
            created_by=version.created_by,
            created_at=version.created_at,
            parent_version_id=version.parent_version_id,
        )
        for version in versions
    ]


@router.get('/{skill_id}/versions/tree', response_model=list[SkillVersionNode])
def list_version_tree(skill_id: str, session: Session = Depends(get_session)) -> list[SkillVersionNode]:
    skill = get_skill(session, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    versions = list_versions(session, skill_id, limit=None)
    return [
        SkillVersionNode(
            id=version.id,
            version=version.version,
            parent_version_id=version.parent_version_id,
        )
        for version in versions
    ]


@router.get('/{skill_id}/versions/{version}', response_model=SkillVersionOut)
def get_version_endpoint(skill_id: str, version: int, session: Session = Depends(get_session)) -> SkillVersionOut:
    record = get_version(session, skill_id, version)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill version not found')
    return SkillVersionOut(
        id=record.id,
        skill_id=record.skill_id,
        version=record.version,
        content=record.content,
        created_by=record.created_by,
        created_at=record.created_at,
        parent_version_id=record.parent_version_id,
    )


@router.get('/{skill_id}/export', response_model=SkillExport)
def export_skill_endpoint(skill_id: str, session: Session = Depends(get_session)) -> SkillExport:
    result = export_skill(session, skill_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    skill, versions = result
    return SkillExport(
        skill=_to_skill_out(skill),
        versions=[
            SkillVersionOut(
                id=version.id,
                skill_id=version.skill_id,
                version=version.version,
                content=version.content,
                created_by=version.created_by,
                created_at=version.created_at,
                parent_version_id=version.parent_version_id,
            )
            for version in versions
        ],
    )


@router.post('/import', response_model=SkillDetail, status_code=status.HTTP_201_CREATED)
def import_skill_endpoint(
    payload: SkillImport,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillDetail:
    skill, latest = import_skill(session, payload, user.id)
    return _to_detail(skill, latest)
