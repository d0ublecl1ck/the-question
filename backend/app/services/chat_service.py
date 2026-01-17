from typing import Optional
from sqlmodel import Session, select
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.skill_suggestion import SkillSuggestion
from app.models.enums import SkillSuggestionStatus


def create_session(session: Session, user_id: str, title:Optional[str]) -> ChatSession:
    record = ChatSession(user_id=user_id, title=title)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_sessions(
    session: Session,
    user_id: str,
    limit:Optional[int] = 50,
    offset: int = 0,
) -> list[ChatSession]:
    statement = select(ChatSession).where(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc())
    if offset:
        statement = statement.offset(offset)
    if limit is not None:
        statement = statement.limit(limit)
    return list(session.exec(statement).all())


def get_session(session: Session, session_id: str) ->Optional[ChatSession]:
    return session.exec(select(ChatSession).where(ChatSession.id == session_id)).first()


def update_session_title(session: Session, record: ChatSession, title:Optional[str]) -> ChatSession:
    record.title = title
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def delete_session(session: Session, record: ChatSession) -> None:
    messages = session.exec(select(ChatMessage).where(ChatMessage.session_id == record.id)).all()
    suggestions = session.exec(select(SkillSuggestion).where(SkillSuggestion.session_id == record.id)).all()
    for message in messages:
        session.delete(message)
    for suggestion in suggestions:
        session.delete(suggestion)
    session.delete(record)
    session.commit()


def create_message(
    session: Session,
    session_id: str,
    role: str,
    content: str,
    skill_id:Optional[str],
) -> ChatMessage:
    record = ChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        skill_id=skill_id,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_messages(
    session: Session,
    session_id: str,
    limit:Optional[int] = 50,
    offset: int = 0,
) -> list[ChatMessage]:
    statement = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    if offset:
        statement = statement.offset(offset)
    if limit is not None:
        statement = statement.limit(limit)
    return list(session.exec(statement).all())


def get_message(session: Session, message_id: str) -> Optional[ChatMessage]:
    return session.exec(select(ChatMessage).where(ChatMessage.id == message_id)).first()


def update_message_content(session: Session, record: ChatMessage, content: str) -> ChatMessage:
    record.content = content
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_suggestions(
    session: Session,
    session_id: str,
    status:Optional[SkillSuggestionStatus] = None,
) -> list[SkillSuggestion]:
    statement = select(SkillSuggestion).where(SkillSuggestion.session_id == session_id)
    if status is not None:
        statement = statement.where(SkillSuggestion.status == status)
    statement = statement.order_by(SkillSuggestion.created_at.asc())
    return list(session.exec(statement).all())


def has_rejection(session: Session, session_id: str) -> bool:
    record = session.exec(
        select(SkillSuggestion).where(
            (SkillSuggestion.session_id == session_id)
            & (SkillSuggestion.status == SkillSuggestionStatus.REJECTED)
        )
    ).first()
    return record is not None


def create_suggestion(
    session: Session,
    session_id: str,
    skill_id: str,
    message_id:Optional[str],
) -> SkillSuggestion:
    existing = session.exec(
        select(SkillSuggestion).where(
            (SkillSuggestion.session_id == session_id) & (SkillSuggestion.skill_id == skill_id)
        )
    ).first()
    if existing:
        return existing
    record = SkillSuggestion(
        session_id=session_id,
        skill_id=skill_id,
        message_id=message_id,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def get_suggestion(session: Session, suggestion_id: str) ->Optional[SkillSuggestion]:
    return session.exec(select(SkillSuggestion).where(SkillSuggestion.id == suggestion_id)).first()


def update_suggestion(session: Session, suggestion: SkillSuggestion, status: str) -> SkillSuggestion:
    suggestion.status = status
    session.add(suggestion)
    session.commit()
    session.refresh(suggestion)
    return suggestion
