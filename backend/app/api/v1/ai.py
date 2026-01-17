import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.core.providers import available_models, is_model_available
from app.db.session import get_session
from app.models.enums import ChatRole
from app.models.user import User
from app.schemas.ai import AiChatStreamRequest, AiModelOut
from app.services.auth_service import get_current_user
from app.services.chat_service import create_message, get_session as get_chat_session, list_messages
from app.services.llm_gateway import stream_chat_completion

router = APIRouter(prefix='/ai', tags=['ai'])


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

    async def event_stream():
        chunks: list[str] = []
        try:
            async for delta in stream_chat_completion(model=payload.model, messages=messages):
                chunks.append(delta)
                yield f"data: {json.dumps({'type': 'delta', 'content': delta}, ensure_ascii=False)}\n\n"
        except Exception as error:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'message': str(error)}, ensure_ascii=False)}\n\n"
        finally:
            if chunks:
                create_message(session, payload.session_id, ChatRole.ASSISTANT, ''.join(chunks), None)
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type='text/event-stream')
