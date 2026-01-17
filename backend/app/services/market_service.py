from typing import Optional, Tuple
from sqlalchemy import func
from sqlmodel import Session, select
from app.models.skill_favorite import SkillFavorite
from app.models.skill_rating import SkillRating
from app.models.skill_comment import SkillComment
from app.models.skill_comment_reply import SkillCommentReply
from app.models.skill_comment_like import SkillCommentLike
from app.models.skill import Skill
from app.models.enums import SkillVisibility
from app.services.skill_service import list_skills


def add_favorite(session: Session, user_id: str, skill_id: str) -> SkillFavorite:
    existing = session.exec(
        select(SkillFavorite).where(
            (SkillFavorite.user_id == user_id) & (SkillFavorite.skill_id == skill_id)
        )
    ).first()
    if existing:
        return existing
    record = SkillFavorite(user_id=user_id, skill_id=skill_id)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def remove_favorite(session: Session, user_id: str, skill_id: str) -> None:
    record = session.exec(
        select(SkillFavorite).where(
            (SkillFavorite.user_id == user_id) & (SkillFavorite.skill_id == skill_id)
        )
    ).first()
    if record:
        session.delete(record)
        session.commit()


def list_favorites(session: Session, user_id: str, limit:Optional[int] = 50, offset: int = 0) -> list[SkillFavorite]:
    statement = select(SkillFavorite).where(SkillFavorite.user_id == user_id)
    if offset:
        statement = statement.offset(offset)
    if limit is not None:
        statement = statement.limit(limit)
    return list(session.exec(statement).all())


def count_favorites(session: Session, skill_id: str) -> int:
    statement = select(func.count(SkillFavorite.id)).where(SkillFavorite.skill_id == skill_id)
    result = session.exec(statement).one()
    return int(result or 0)


def upsert_rating(session: Session, user_id: str, skill_id: str, rating: int) -> SkillRating:
    record = session.exec(
        select(SkillRating).where(
            (SkillRating.user_id == user_id) & (SkillRating.skill_id == skill_id)
        )
    ).first()
    if record:
        record.rating = rating
        session.add(record)
        session.commit()
        session.refresh(record)
        return record
    record = SkillRating(user_id=user_id, skill_id=skill_id, rating=rating)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def get_user_rating(session: Session, user_id: str, skill_id: str) ->Optional[SkillRating]:
    return session.exec(
        select(SkillRating).where(
            (SkillRating.user_id == user_id) & (SkillRating.skill_id == skill_id)
        )
    ).first()


def get_rating_summary(session: Session, skill_id: str) -> tuple[float, int]:
    statement = select(func.avg(SkillRating.rating), func.count(SkillRating.id)).where(
        SkillRating.skill_id == skill_id
    )
    avg, count = session.exec(statement).one()
    average_value = float(avg or 0)
    return average_value, int(count or 0)


def add_comment(session: Session, user_id: str, skill_id: str, content: str) -> SkillComment:
    record = SkillComment(user_id=user_id, skill_id=skill_id, content=content)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def count_comments(session: Session, skill_id: str) -> int:
    statement = select(func.count(SkillComment.id)).where(SkillComment.skill_id == skill_id)
    result = session.exec(statement).one()
    return int(result or 0)


def list_comments(
    session: Session,
    skill_id: str,
    limit:Optional[int] = 50,
    offset: int = 0,
) -> list[SkillComment]:
    statement = (
        select(SkillComment)
        .where(SkillComment.skill_id == skill_id)
        .order_by(SkillComment.created_at.desc())
    )
    if offset:
        statement = statement.offset(offset)
    if limit is not None:
        statement = statement.limit(limit)
    return list(session.exec(statement).all())


def get_comment(session: Session, comment_id: str) ->Optional[SkillComment]:
    return session.exec(select(SkillComment).where(SkillComment.id == comment_id)).first()


def list_market_skills(session: Session, limit: int = 50, offset: int = 0) -> list[Skill]:
    return list_skills(session, visibility=SkillVisibility.PUBLIC, limit=limit, offset=offset)


def add_comment_reply(
    session: Session,
    user_id: str,
    comment_id: str,
    content: str,
) -> SkillCommentReply:
    record = SkillCommentReply(user_id=user_id, comment_id=comment_id, content=content)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def toggle_comment_like(
    session: Session,
    user_id: str,
    comment_id: str,
) -> Tuple[Optional[SkillCommentLike], bool]:
    existing = session.exec(
        select(SkillCommentLike).where(
            (SkillCommentLike.user_id == user_id) & (SkillCommentLike.comment_id == comment_id)
        )
    ).first()
    if existing:
        session.delete(existing)
        session.commit()
        return None, False
    record = SkillCommentLike(user_id=user_id, comment_id=comment_id)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record, True
