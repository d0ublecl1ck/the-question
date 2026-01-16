from sqlalchemy import func
from sqlmodel import Session, select
from app.models.skill_favorite import SkillFavorite
from app.models.skill_rating import SkillRating
from app.models.skill_comment import SkillComment


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


def list_favorites(session: Session, user_id: str) -> list[SkillFavorite]:
    statement = select(SkillFavorite).where(SkillFavorite.user_id == user_id)
    return list(session.exec(statement).all())


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


def list_comments(session: Session, skill_id: str) -> list[SkillComment]:
    statement = select(SkillComment).where(SkillComment.skill_id == skill_id).order_by(
        SkillComment.created_at.desc()
    )
    return list(session.exec(statement).all())
