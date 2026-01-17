from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.session import get_session
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageOut,
    ChatSessionCreate,
    ChatSessionOut,
    SkillSuggestionOut,
)
from app.schemas.chat_alias import SkillSuggestionAliasCreate
from app.services.auth_service import get_current_user
from app.services.chat_service import (
    create_message,
    create_session,
    create_suggestion,
    get_session as get_chat_session,
    has_rejection,
)
from app.services.skill_service import get_skill

router = APIRouter(tags=['chat-alias'])


def _ensure_session(session: Session, session_id: str, user: User):
    record = get_chat_session(session, session_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Chat session not found')
    if record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    return record


def _ensure_skill(session: Session, skill_id: str) -> None:
    if not get_skill(session, skill_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')


@router.post('/chat/sessions', response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_alias_session(
    payload: ChatSessionCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ChatSessionOut:
    record = create_session(session, user.id, payload.title)
    return ChatSessionOut(
        id=record.id,
        title=record.title,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.post('/chat/sessions/{session_id}/messages', response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def create_alias_message(
    session_id: str,
    payload: ChatMessageCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ChatMessageOut:
    _ensure_session(session, session_id, user)
    if payload.skill_id:
        _ensure_skill(session, payload.skill_id)
    record = create_message(session, session_id, payload.role, payload.content, payload.skill_id)
    return ChatMessageOut(
        id=record.id,
        session_id=record.session_id,
        role=record.role,
        content=record.content,
        skill_id=record.skill_id,
        created_at=record.created_at,
    )


@router.post('/skill-suggestions', response_model=SkillSuggestionOut, status_code=status.HTTP_201_CREATED)
def create_alias_suggestion(
    payload: SkillSuggestionAliasCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillSuggestionOut:
    _ensure_session(session, payload.session_id, user)
    _ensure_skill(session, payload.skill_id)
    if has_rejection(session, payload.session_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Suggestions suppressed for session')
    record = create_suggestion(session, payload.session_id, payload.skill_id, payload.message_id)
    return SkillSuggestionOut(
        id=record.id,
        session_id=record.session_id,
        skill_id=record.skill_id,
        message_id=record.message_id,
        status=record.status,
        created_at=record.created_at,
    )
