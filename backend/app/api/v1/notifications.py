from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationOut, NotificationUpdate
from app.services.auth_service import get_current_user
from app.services.notification_service import (
    create_notification,
    get_notification,
    list_notifications,
    update_notification,
)

router = APIRouter(prefix='/notifications', tags=['notifications'])


def _ensure_owner(record, user: User) -> None:
    if record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')


@router.post('', response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification_endpoint(
    payload: NotificationCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> NotificationOut:
    record = create_notification(session, user.id, payload)
    return NotificationOut(
        id=record.id,
        type=record.type,
        content=record.content,
        read=record.read,
        created_at=record.created_at,
    )


@router.get('', response_model=list[NotificationOut])
def list_notifications_endpoint(
    unread_only: bool = False,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[NotificationOut]:
    notifications = list_notifications(session, user.id, unread_only=unread_only)
    return [
        NotificationOut(
            id=record.id,
            type=record.type,
            content=record.content,
            read=record.read,
            created_at=record.created_at,
        )
        for record in notifications
    ]


@router.patch('/{notification_id}', response_model=NotificationOut)
def update_notification_endpoint(
    notification_id: str,
    payload: NotificationUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> NotificationOut:
    record = get_notification(session, notification_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')
    _ensure_owner(record, user)
    record = update_notification(session, record, payload)
    return NotificationOut(
        id=record.id,
        type=record.type,
        content=record.content,
        read=record.read,
        created_at=record.created_at,
    )
