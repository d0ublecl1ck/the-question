from typing import Optional

from sqlmodel import Session, select

from app.models.enums import SkillSuggestionStatus
from app.models.skill_draft_suggestion import SkillDraftSuggestion


def list_skill_draft_suggestions(
    session: Session,
    session_id: str,
    status: Optional[SkillSuggestionStatus] = None,
) -> list[SkillDraftSuggestion]:
    statement = select(SkillDraftSuggestion).where(SkillDraftSuggestion.session_id == session_id)
    if status is not None:
        statement = statement.where(SkillDraftSuggestion.status == status)
    statement = statement.order_by(SkillDraftSuggestion.created_at.asc())
    return list(session.exec(statement).all())


def get_skill_draft_suggestion(session: Session, suggestion_id: str) -> Optional[SkillDraftSuggestion]:
    return session.exec(select(SkillDraftSuggestion).where(SkillDraftSuggestion.id == suggestion_id)).first()


def has_draft_rejection(session: Session, session_id: str) -> bool:
    record = session.exec(
        select(SkillDraftSuggestion).where(
            (SkillDraftSuggestion.session_id == session_id)
            & (SkillDraftSuggestion.status == SkillSuggestionStatus.REJECTED)
        )
    ).first()
    return record is not None


def create_skill_draft_suggestion(
    session: Session,
    session_id: str,
    message_id: Optional[str],
    goal: str,
    constraints: Optional[str] = None,
    reason: Optional[str] = None,
) -> SkillDraftSuggestion:
    existing = None
    if message_id:
        existing = session.exec(
            select(SkillDraftSuggestion).where(
                (SkillDraftSuggestion.session_id == session_id)
                & (SkillDraftSuggestion.message_id == message_id)
            )
        ).first()
    if existing:
        if reason and not existing.reason:
            existing.reason = reason
            session.add(existing)
            session.commit()
            session.refresh(existing)
        return existing
    record = SkillDraftSuggestion(
        session_id=session_id,
        message_id=message_id,
        goal=goal,
        constraints=constraints,
        reason=reason,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def update_skill_draft_suggestion(
    session: Session,
    suggestion: SkillDraftSuggestion,
    status: SkillSuggestionStatus,
    created_skill_id: Optional[str] = None,
) -> SkillDraftSuggestion:
    suggestion.status = status
    if created_skill_id:
        suggestion.created_skill_id = created_skill_id
    session.add(suggestion)
    session.commit()
    session.refresh(suggestion)
    return suggestion
