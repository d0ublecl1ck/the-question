from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.models.user import User
from app.schemas.market import (
    CommentCreate,
    CommentOut,
    FavoriteCreate,
    FavoriteOut,
    MarketStats,
    MarketSkillOut,
    RatingCreate,
    RatingOut,
    RatingSummary,
)
from app.services.auth_service import get_current_user
from app.services.market_service import (
    add_comment,
    add_favorite,
    count_comments,
    count_favorites,
    get_rating_summary,
    get_user_rating,
    list_market_skills,
    list_comments,
    list_favorites,
    remove_favorite,
    upsert_rating,
)
from app.services.skill_service import get_skill, skill_tags_to_list

router = APIRouter(prefix='/market', tags=['market'])


def _ensure_skill(session: Session, skill_id: str) -> None:
    if not get_skill(session, skill_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')


@router.get('/skills', response_model=list[MarketSkillOut])
def list_market_skills_endpoint(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[MarketSkillOut]:
    skills = list_market_skills(session, limit=limit, offset=offset)
    items: list[MarketSkillOut] = []
    for skill in skills:
        favorites_count = count_favorites(session, skill.id)
        average, count = get_rating_summary(session, skill.id)
        comments_count = count_comments(session, skill.id)
        items.append(
            MarketSkillOut(
                id=skill.id,
                name=skill.name,
                description=skill.description,
                tags=skill_tags_to_list(skill),
                visibility=skill.visibility,
                favorites_count=favorites_count,
                rating=RatingSummary(skill_id=skill.id, average=average, count=count),
                comments_count=comments_count,
            )
        )
    return items


@router.get('/skills/{skill_id}', response_model=MarketSkillOut)
def get_market_skill_detail(
    skill_id: str,
    session: Session = Depends(get_session),
) -> MarketSkillOut:
    skill = get_skill(session, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    favorites_count = count_favorites(session, skill_id)
    average, count = get_rating_summary(session, skill_id)
    comments_count = count_comments(session, skill_id)
    return MarketSkillOut(
        id=skill.id,
        name=skill.name,
        description=skill.description,
        tags=skill_tags_to_list(skill),
        visibility=skill.visibility,
        favorites_count=favorites_count,
        rating=RatingSummary(skill_id=skill.id, average=average, count=count),
        comments_count=comments_count,
    )


@router.post('/favorites', response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
def create_favorite(
    payload: FavoriteCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> FavoriteOut:
    _ensure_skill(session, payload.skill_id)
    record = add_favorite(session, user.id, payload.skill_id)
    return FavoriteOut(
        id=record.id,
        skill_id=record.skill_id,
        user_id=record.user_id,
        created_at=record.created_at,
    )


@router.delete('/favorites/{skill_id}')
def delete_favorite(
    skill_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    _ensure_skill(session, skill_id)
    remove_favorite(session, user.id, skill_id)
    return {'status': 'ok'}


@router.get('/favorites', response_model=list[FavoriteOut])
def list_favorites_endpoint(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[FavoriteOut]:
    favorites = list_favorites(session, user.id, limit=limit, offset=offset)
    return [
        FavoriteOut(
            id=favorite.id,
            skill_id=favorite.skill_id,
            user_id=favorite.user_id,
            created_at=favorite.created_at,
        )
        for favorite in favorites
    ]


@router.post('/ratings', response_model=RatingOut)
def rate_skill(
    payload: RatingCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> RatingOut:
    _ensure_skill(session, payload.skill_id)
    record = upsert_rating(session, user.id, payload.skill_id, payload.rating)
    return RatingOut(
        id=record.id,
        skill_id=record.skill_id,
        user_id=record.user_id,
        rating=record.rating,
        created_at=record.created_at,
    )


@router.get('/ratings/{skill_id}', response_model=RatingSummary)
def rating_summary(skill_id: str, session: Session = Depends(get_session)) -> RatingSummary:
    _ensure_skill(session, skill_id)
    average, count = get_rating_summary(session, skill_id)
    return RatingSummary(skill_id=skill_id, average=average, count=count)


@router.get('/ratings/me/{skill_id}', response_model=RatingOut)
def get_my_rating(
    skill_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> RatingOut:
    _ensure_skill(session, skill_id)
    record = get_user_rating(session, user.id, skill_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Rating not found')
    return RatingOut(
        id=record.id,
        skill_id=record.skill_id,
        user_id=record.user_id,
        rating=record.rating,
        created_at=record.created_at,
    )


@router.post('/comments', response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    payload: CommentCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> CommentOut:
    _ensure_skill(session, payload.skill_id)
    record = add_comment(session, user.id, payload.skill_id, payload.content)
    return CommentOut(
        id=record.id,
        skill_id=record.skill_id,
        user_id=record.user_id,
        content=record.content,
        created_at=record.created_at,
    )


@router.get('/comments/{skill_id}', response_model=list[CommentOut])
def list_comments_endpoint(
    skill_id: str,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[CommentOut]:
    _ensure_skill(session, skill_id)
    comments = list_comments(session, skill_id, limit=limit, offset=offset)
    return [
        CommentOut(
            id=comment.id,
            skill_id=comment.skill_id,
            user_id=comment.user_id,
            content=comment.content,
            created_at=comment.created_at,
        )
        for comment in comments
    ]


@router.get('/skills/{skill_id}/stats', response_model=MarketStats)
def skill_market_stats(skill_id: str, session: Session = Depends(get_session)) -> MarketStats:
    _ensure_skill(session, skill_id)
    favorites_count = count_favorites(session, skill_id)
    average, count = get_rating_summary(session, skill_id)
    comments_count = count_comments(session, skill_id)
    return MarketStats(
        skill_id=skill_id,
        favorites_count=favorites_count,
        rating=RatingSummary(skill_id=skill_id, average=average, count=count),
        comments_count=comments_count,
    )
