from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.skill import SkillOut
from app.services.skill_service import search_skills, skill_tags_to_list

router = APIRouter(prefix='/search', tags=['search'])


@router.get('/skills', response_model=list[SkillOut])
def search_skills_endpoint(
    q: str,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[SkillOut]:
    skills = search_skills(session, q, limit=limit, offset=offset)
    return [
        SkillOut(
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
        for skill in skills
    ]
