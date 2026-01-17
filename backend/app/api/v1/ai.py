import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from loguru import logger

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.core.config import settings
from app.core.providers import available_models, is_model_available
from app.db.session import engine, get_session
from app.models.enums import ChatRole
from app.models.user import User
from app.schemas.ai import AiChatStreamRequest, AiModelOut
from app.services.auth_service import get_current_user
from app.services.chat_service import (
    create_message,
    get_message,
    get_session as get_chat_session,
    list_messages,
    update_message_content,
)
from app.services.ai_agent import stream_agent_text
from app.services.ai_history import build_message_history, trim_latest_user_message
from app.services.ai_stream_registry import stream_registry
from app.services.ai_types import AiDeps
from app.services.ai_skill_suggestion import maybe_create_skill_suggestion
from app.services.ai_skill_draft_suggestion import maybe_create_skill_draft_suggestion

router = APIRouter(prefix='/ai', tags=['ai'])


def _resolve_debug_log_path() -> Path:
    configured = Path(settings.AI_DEBUG_LOG_PATH)
    if configured.is_absolute():
        return configured
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / configured


def _append_ai_debug_record(record: dict) -> None:
    path = _resolve_debug_log_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('a', encoding='utf-8') as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + '\n')
    except OSError:
        logger.warning('ai_debug_log_write_failed', path=str(path))


def _ensure_session(session: Session, session_id: str, user: User):
    record = get_chat_session(session, session_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Chat session not found')
    if record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')
    return record


def _allowed_model(model: str) -> bool:
    return is_model_available(model)


@router.get('/models', response_model=list[AiModelOut])
def list_models() -> list[AiModelOut]:
    return [AiModelOut(**item) for item in available_models()]


@router.post('/chat/stream')
async def stream_chat(
    payload: AiChatStreamRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if not _allowed_model(payload.model):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Model not available')

    _ensure_session(session, payload.session_id, user)

    create_message(session, payload.session_id, ChatRole.USER, payload.content, payload.skill_id)
    history = list_messages(session, payload.session_id, limit=200, offset=0)
    messages = [
        {
            'role': message.role.value if hasattr(message.role, 'value') else message.role,
            'content': message.content,
        }
        for message in history
    ]

    assistant_record = create_message(session, payload.session_id, ChatRole.ASSISTANT, '', None)

    logger.info(
        json.dumps(
            {
                'event': 'ai.chat.request',
                'session_id': payload.session_id,
                'user_id': user.id,
                'model': payload.model,
                'messages': messages,
            },
            ensure_ascii=False,
        )
    )
    _append_ai_debug_record(
        {
            'event': 'ai.chat.request',
            'session_id': payload.session_id,
            'user_id': user.id,
            'model': payload.model,
            'messages': messages,
            'chat_messages': [
                {
                    'id': message.id,
                    'role': message.role.value if hasattr(message.role, 'value') else message.role,
                    'content': message.content,
                    'skill_id': message.skill_id,
                    'created_at': message.created_at.isoformat() if hasattr(message, 'created_at') else None,
                }
                for message in history
            ],
            'created_at': datetime.now(timezone.utc).isoformat(),
        }
    )

    trimmed_history = trim_latest_user_message(
        history,
        latest_content=payload.content,
        latest_skill_id=payload.skill_id,
    )
    message_history = build_message_history(trimmed_history)

    async def event_stream():
        state = await stream_registry.start(payload.session_id, assistant_record.id)
        queue: asyncio.Queue[dict[str, str] | None] = asyncio.Queue()

        async def run_stream() -> None:
            chunks: list[str] = []
            deps = AiDeps(
                user=user,
                session_id=payload.session_id,
                model_id=payload.model,
                selected_skill_id=payload.skill_id,
                skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
            )
            logger.info(
                'ai.chat.stream.start',
                session_id=payload.session_id,
                user_id=user.id,
                model=payload.model,
                message_id=assistant_record.id,
            )
            try:
                async for delta in stream_agent_text(
                    deps=deps,
                    prompt=payload.content,
                    message_history=message_history,
                    raw_history=trimmed_history,
                ):
                    chunks.append(delta)
                    await stream_registry.append(payload.session_id, delta)
            except Exception as error:  # noqa: BLE001
                await stream_registry.error(payload.session_id, str(error))
            finally:
                if chunks:
                    content = ''.join(chunks)
                    with Session(engine) as background_session:
                        record = get_message(background_session, assistant_record.id)
                        if record:
                            update_message_content(background_session, record, content)
                    _append_ai_debug_record(
                        {
                            'event': 'ai.chat.response',
                            'session_id': payload.session_id,
                            'user_id': user.id,
                            'model': payload.model,
                            'message_id': assistant_record.id,
                            'content': content,
                            'created_at': datetime.now(timezone.utc).isoformat(),
                        }
                    )
                    suggestion_task = asyncio.create_task(
                        maybe_create_skill_suggestion(
                            deps=deps,
                            prompt=payload.content,
                            history=history,
                            assistant_message_id=assistant_record.id,
                            assistant_content=content,
                        )
                    )
                    suggestion_task.add_done_callback(_log_task_error)
                    draft_task = asyncio.create_task(
                        maybe_create_skill_draft_suggestion(
                            deps=deps,
                            prompt=payload.content,
                            history=history,
                            assistant_message_id=assistant_record.id,
                            assistant_content=content,
                        )
                    )
                    draft_task.add_done_callback(_log_task_error)
                    logger.info(
                        'ai.chat.stream.done',
                        session_id=payload.session_id,
                        user_id=user.id,
                        model=payload.model,
                        message_id=assistant_record.id,
                        chunks=len(chunks),
                        content_len=len(content),
                    )
                else:
                    logger.warning(
                        'ai.chat.stream.empty',
                        session_id=payload.session_id,
                        user_id=user.id,
                        model=payload.model,
                        message_id=assistant_record.id,
                    )
                await stream_registry.finish(payload.session_id)

        task = asyncio.create_task(run_stream())

        def _log_task_error(done_task: asyncio.Task[None]) -> None:
            if done_task.cancelled():
                return
            error = done_task.exception()
            if error:
                logger.exception(error)

        task.add_done_callback(_log_task_error)

        state.subscribers.add(queue)
        try:
            yield f"data: {json.dumps({'type': 'start', 'message_id': state.message_id}, ensure_ascii=False)}\n\n"
            while True:
                item = await queue.get()
                if item is None:
                    yield "data: [DONE]\n\n"
                    break
                yield f"data: {json.dumps(item, ensure_ascii=False)}\n\n"
        finally:
            await stream_registry.unsubscribe(state, queue)

    return StreamingResponse(event_stream(), media_type='text/event-stream')


@router.get('/chat/stream/watch')
async def watch_chat_stream(
    session_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    _ensure_session(session, session_id, user)

    async def event_stream():
        subscription = await stream_registry.subscribe(session_id)
        if not subscription:
            yield "data: [DONE]\n\n"
            return
        state, queue, snapshot = subscription
        try:
            yield f"data: {json.dumps({'type': 'snapshot', 'message_id': state.message_id, 'content': snapshot}, ensure_ascii=False)}\n\n"
            while True:
                item = await queue.get()
                if item is None:
                    yield "data: [DONE]\n\n"
                    break
                yield f"data: {json.dumps(item, ensure_ascii=False)}\n\n"
        finally:
            await stream_registry.unsubscribe(state, queue)

    return StreamingResponse(event_stream(), media_type='text/event-stream')
