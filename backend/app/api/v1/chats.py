from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageOut,
    ChatSessionCreate,
    ChatSessionOut,
    SkillSuggestionCreate,
    SkillSuggestionOut,
    SkillSuggestionUpdate,
)
from app.services.auth_service import get_current_user
from app.services.chat_service import (
    create_message,
    create_session,
    create_suggestion,
    get_session as get_chat_session,
    get_suggestion,
    has_rejection,
    list_messages,
    list_sessions,
    list_suggestions,
    update_suggestion,
)
from app.services.skill_service import get_skill

router = APIRouter(prefix='/chats', tags=['chats'])


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


@router.post('', response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_chat_session(
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


@router.get('', response_model=list[ChatSessionOut])
def list_chat_sessions(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[ChatSessionOut]:
    sessions = list_sessions(session, user.id)
    return [
        ChatSessionOut(
            id=record.id,
            title=record.title,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
        for record in sessions
    ]


@router.post('/{session_id}/messages', response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def create_chat_message(
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


@router.get('/{session_id}/messages', response_model=list[ChatMessageOut])
def list_chat_messages(
    session_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[ChatMessageOut]:
    _ensure_session(session, session_id, user)
    messages = list_messages(session, session_id)
    return [
        ChatMessageOut(
            id=record.id,
            session_id=record.session_id,
            role=record.role,
            content=record.content,
            skill_id=record.skill_id,
            created_at=record.created_at,
        )
        for record in messages
    ]


@router.post('/{session_id}/suggestions', response_model=SkillSuggestionOut, status_code=status.HTTP_201_CREATED)
def create_skill_suggestion(
    session_id: str,
    payload: SkillSuggestionCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillSuggestionOut:
    _ensure_session(session, session_id, user)
    _ensure_skill(session, payload.skill_id)
    if has_rejection(session, session_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Suggestions suppressed for session')
    record = create_suggestion(session, session_id, payload.skill_id, payload.message_id)
    return SkillSuggestionOut(
        id=record.id,
        session_id=record.session_id,
        skill_id=record.skill_id,
        message_id=record.message_id,
        status=record.status,
        created_at=record.created_at,
    )


@router.get('/{session_id}/suggestions', response_model=list[SkillSuggestionOut])
def list_skill_suggestions(
    session_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[SkillSuggestionOut]:
    _ensure_session(session, session_id, user)
    suggestions = list_suggestions(session, session_id)
    return [
        SkillSuggestionOut(
            id=record.id,
            session_id=record.session_id,
            skill_id=record.skill_id,
            message_id=record.message_id,
            status=record.status,
            created_at=record.created_at,
        )
        for record in suggestions
    ]


@router.patch('/{session_id}/suggestions/{suggestion_id}', response_model=SkillSuggestionOut)
def update_skill_suggestion(
    session_id: str,
    suggestion_id: str,
    payload: SkillSuggestionUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillSuggestionOut:
    _ensure_session(session, session_id, user)
    record = get_suggestion(session, suggestion_id)
    if not record or record.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Suggestion not found')
    record = update_suggestion(session, record, payload.status)
    return SkillSuggestionOut(
        id=record.id,
        session_id=record.session_id,
        skill_id=record.skill_id,
        message_id=record.message_id,
        status=record.status,
        created_at=record.created_at,
    )
