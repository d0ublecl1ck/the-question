from sqlmodel import Session, select
from app.models.memory_item import MemoryItem
from app.schemas.memory import MemoryCreate, MemoryUpdate


def upsert_memory(session: Session, user_id: str, payload: MemoryCreate) -> MemoryItem:
    record = session.exec(
        select(MemoryItem).where(
            (MemoryItem.user_id == user_id)
            & (MemoryItem.key == payload.key)
            & (MemoryItem.scope == payload.scope)
        )
    ).first()
    if record:
        record.value = payload.value
        session.add(record)
        session.commit()
        session.refresh(record)
        return record
    record = MemoryItem(
        user_id=user_id,
        key=payload.key,
        value=payload.value,
        scope=payload.scope,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_memories(session: Session, user_id: str, scope: str | None = None) -> list[MemoryItem]:
    statement = select(MemoryItem).where(MemoryItem.user_id == user_id)
    if scope is not None:
        statement = statement.where(MemoryItem.scope == scope)
    return list(session.exec(statement).all())


def get_memory(session: Session, memory_id: str) -> MemoryItem | None:
    return session.exec(select(MemoryItem).where(MemoryItem.id == memory_id)).first()


def update_memory(session: Session, record: MemoryItem, payload: MemoryUpdate) -> MemoryItem:
    record.value = payload.value
    record.scope = payload.scope
    session.add(record)
    session.commit()
    session.refresh(record)
    return record
