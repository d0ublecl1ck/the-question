from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.session import get_session
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryOut
from app.schemas.user import UserOut, UserUpdate
from app.services.auth_service import get_current_user
from app.services.memory_service import list_memories, upsert_memory
from app.services.user_service import to_user_out, update_user

router = APIRouter(prefix='/me', tags=['me'])


def _to_memory_out(record) -> MemoryOut:
    return MemoryOut(
        id=record.id,
        key=record.key,
        value=record.value,
        scope=record.scope,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.get('', response_model=UserOut)
def get_me(user: User = Depends(get_current_user)) -> UserOut:
    return to_user_out(user)


@router.patch('', response_model=UserOut)
def update_me(
    payload: UserUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> UserOut:
    try:
        record = update_user(session, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return to_user_out(record)


@router.get('/memory', response_model=list[MemoryOut])
def list_me_memory(
    scope: str | None = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[MemoryOut]:
    memories = list_memories(session, user.id, scope=scope, limit=limit, offset=offset)
    return [_to_memory_out(record) for record in memories]


@router.patch('/memory', response_model=MemoryOut)
def upsert_me_memory(
    payload: MemoryCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MemoryOut:
    record = upsert_memory(session, user.id, payload)
    return _to_memory_out(record)
