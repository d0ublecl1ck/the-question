from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryOut, MemoryUpdate
from app.services.auth_service import get_current_user
from app.services.memory_service import get_memory, list_memories, update_memory, upsert_memory

router = APIRouter(prefix='/memory', tags=['memory'])


def _ensure_owner(record, user: User) -> None:
    if record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')


@router.post('', response_model=MemoryOut, status_code=status.HTTP_201_CREATED)
def upsert_memory_endpoint(
    payload: MemoryCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MemoryOut:
    record = upsert_memory(session, user.id, payload)
    return MemoryOut(
        id=record.id,
        key=record.key,
        value=record.value,
        scope=record.scope,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.get('', response_model=list[MemoryOut])
def list_memory_endpoint(
    scope: str | None = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[MemoryOut]:
    memories = list_memories(session, user.id, scope=scope)
    return [
        MemoryOut(
            id=record.id,
            key=record.key,
            value=record.value,
            scope=record.scope,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
        for record in memories
    ]


@router.get('/{memory_id}', response_model=MemoryOut)
def get_memory_endpoint(
    memory_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MemoryOut:
    record = get_memory(session, memory_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Memory not found')
    _ensure_owner(record, user)
    return MemoryOut(
        id=record.id,
        key=record.key,
        value=record.value,
        scope=record.scope,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.patch('/{memory_id}', response_model=MemoryOut)
def update_memory_endpoint(
    memory_id: str,
    payload: MemoryUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MemoryOut:
    record = get_memory(session, memory_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Memory not found')
    _ensure_owner(record, user)
    record = update_memory(session, record, payload)
    return MemoryOut(
        id=record.id,
        key=record.key,
        value=record.value,
        scope=record.scope,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )
