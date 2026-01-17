from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class ChatSession(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'chat_sessions'

    user_id: str = Field(index=True)
    title: Optional[str] = None
