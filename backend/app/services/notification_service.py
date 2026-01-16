from sqlmodel import Session, select
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate


def create_notification(session: Session, user_id: str, payload: NotificationCreate) -> Notification:
    record = Notification(user_id=user_id, type=payload.type, content=payload.content)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_notifications(
    session: Session,
    user_id: str,
    unread_only: bool = False,
    limit: int | None = 50,
    offset: int = 0,
) -> list[Notification]:
    statement = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        statement = statement.where(Notification.read.is_(False))
    if offset:
        statement = statement.offset(offset)
    if limit is not None:
        statement = statement.limit(limit)
    return list(session.exec(statement).all())


def get_notification(session: Session, notification_id: str) -> Notification | None:
    return session.exec(select(Notification).where(Notification.id == notification_id)).first()


def update_notification(session: Session, record: Notification, payload: NotificationUpdate) -> Notification:
    record.read = payload.read
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def mark_all_read(session: Session, user_id: str) -> int:
    notifications = session.exec(
        select(Notification).where((Notification.user_id == user_id) & (Notification.read.is_(False)))
    ).all()
    for record in notifications:
        record.read = True
        session.add(record)
    session.commit()
    return len(notifications)


def delete_notification(session: Session, record: Notification) -> None:
    session.delete(record)
    session.commit()
