from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class Notification(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'notifications'

    user_id: str = Field(index=True)
    type: str
    content: str
    read: bool = False
