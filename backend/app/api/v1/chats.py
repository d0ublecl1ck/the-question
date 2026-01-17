from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.core.config import settings
from app.core.providers import available_models, is_model_available
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
    SkillDraftSuggestionOut,
    SkillDraftSuggestionUpdate,
    SkillDraftSuggestionAcceptIn,
    SkillDraftSuggestionAcceptOut,
)
from app.services.auth_service import get_current_user
from app.services.chat_service import (
    create_message,
    create_session,
    create_suggestion,
    delete_session,
    get_session as get_chat_session,
    get_suggestion,
    has_rejection,
    list_messages,
    list_sessions,
    list_suggestions,
    update_session_title,
    update_suggestion,
)
from app.models.enums import SkillSuggestionStatus, SkillVisibility
from app.services.ai_tools import create_skill_data, generate_skill_data
from app.services.ai_types import AiDeps
from app.services.skill_draft_suggestion_service import (
    get_skill_draft_suggestion,
    list_skill_draft_suggestions,
    update_skill_draft_suggestion,
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


def _resolve_model_id(model_id: Optional[str]) -> str:
    if model_id:
        if not is_model_available(model_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Model not available')
        return model_id
    models = available_models()
    if not models:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Model not available')
    return models[0]['id']


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
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[ChatSessionOut]:
    sessions = list_sessions(session, user.id, limit=limit, offset=offset)
    return [
        ChatSessionOut(
            id=record.id,
            title=record.title,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
        for record in sessions
    ]


@router.patch('/{session_id}', response_model=ChatSessionOut)
def update_chat_session(
    session_id: str,
    payload: ChatSessionCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ChatSessionOut:
    record = _ensure_session(session, session_id, user)
    record = update_session_title(session, record, payload.title)
    return ChatSessionOut(
        id=record.id,
        title=record.title,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete('/{session_id}')
def delete_chat_session(
    session_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    record = _ensure_session(session, session_id, user)
    delete_session(session, record)
    return {'status': 'ok'}


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
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[ChatMessageOut]:
    _ensure_session(session, session_id, user)
    messages = list_messages(session, session_id, limit=limit, offset=offset)
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
        reason=record.reason,
        status=record.status,
        created_at=record.created_at,
    )


@router.get('/{session_id}/suggestions', response_model=list[SkillSuggestionOut])
def list_skill_suggestions(
    session_id: str,
    status:Optional[SkillSuggestionStatus] = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[SkillSuggestionOut]:
    _ensure_session(session, session_id, user)
    suggestions = list_suggestions(session, session_id, status=status)
    return [
        SkillSuggestionOut(
            id=record.id,
            session_id=record.session_id,
            skill_id=record.skill_id,
            message_id=record.message_id,
            reason=record.reason,
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
        reason=record.reason,
        status=record.status,
        created_at=record.created_at,
    )


@router.get('/{session_id}/draft-suggestions', response_model=list[SkillDraftSuggestionOut])
def list_skill_draft_suggestions_endpoint(
    session_id: str,
    status: Optional[SkillSuggestionStatus] = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[SkillDraftSuggestionOut]:
    _ensure_session(session, session_id, user)
    suggestions = list_skill_draft_suggestions(session, session_id, status=status)
    return [
        SkillDraftSuggestionOut(
            id=record.id,
            session_id=record.session_id,
            message_id=record.message_id,
            goal=record.goal,
            constraints=record.constraints,
            reason=record.reason,
            status=record.status,
            created_skill_id=record.created_skill_id,
            created_at=record.created_at,
        )
        for record in suggestions
    ]


@router.patch('/{session_id}/draft-suggestions/{suggestion_id}', response_model=SkillDraftSuggestionOut)
def update_skill_draft_suggestion_endpoint(
    session_id: str,
    suggestion_id: str,
    payload: SkillDraftSuggestionUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillDraftSuggestionOut:
    _ensure_session(session, session_id, user)
    record = get_skill_draft_suggestion(session, suggestion_id)
    if not record or record.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Suggestion not found')
    record = update_skill_draft_suggestion(session, record, payload.status)
    return SkillDraftSuggestionOut(
        id=record.id,
        session_id=record.session_id,
        message_id=record.message_id,
        goal=record.goal,
        constraints=record.constraints,
        reason=record.reason,
        status=record.status,
        created_skill_id=record.created_skill_id,
        created_at=record.created_at,
    )


@router.post(
    '/{session_id}/draft-suggestions/{suggestion_id}/accept',
    response_model=SkillDraftSuggestionAcceptOut,
    status_code=status.HTTP_201_CREATED,
)
async def accept_skill_draft_suggestion_endpoint(
    session_id: str,
    suggestion_id: str,
    payload: SkillDraftSuggestionAcceptIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillDraftSuggestionAcceptOut:
    _ensure_session(session, session_id, user)
    record = get_skill_draft_suggestion(session, suggestion_id)
    if not record or record.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Suggestion not found')
    if record.status != SkillSuggestionStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Suggestion already processed')
    model_id = _resolve_model_id(payload.model)
    deps = AiDeps(
        user=user,
        session_id=session_id,
        model_id=model_id,
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )
    generated = await generate_skill_data(deps, goal=record.goal, constraints=record.constraints)
    create_result = await create_skill_data(
        deps,
        name=generated['name'],
        description=generated['description'],
        tags=generated['tags'],
        content=generated['content'],
        visibility=SkillVisibility.PRIVATE,
    )
    record = update_skill_draft_suggestion(
        session,
        record,
        SkillSuggestionStatus.ACCEPTED,
        created_skill_id=create_result['skill_id'],
    )
    return SkillDraftSuggestionAcceptOut(
        suggestion_id=record.id,
        skill_id=create_result['skill_id'],
        version=create_result['version'],
        name=generated['name'],
        description=generated['description'],
        visibility=create_result['visibility'],
        warnings=create_result['warnings'],
    )
