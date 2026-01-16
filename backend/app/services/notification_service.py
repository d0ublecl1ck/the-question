from sqlmodel import Session, select
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate


def create_notification(session: Session, user_id: str, payload: NotificationCreate) -> Notification:
    record = Notification(user_id=user_id, type=payload.type, content=payload.content)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_notifications(session: Session, user_id: str, unread_only: bool = False) -> list[Notification]:
    statement = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        statement = statement.where(Notification.read.is_(False))
    return list(session.exec(statement).all())


def get_notification(session: Session, notification_id: str) -> Notification | None:
    return session.exec(select(Notification).where(Notification.id == notification_id)).first()


def update_notification(session: Session, record: Notification, payload: NotificationUpdate) -> Notification:
    record.read = payload.read
    session.add(record)
    session.commit()
    session.refresh(record)
    return record
