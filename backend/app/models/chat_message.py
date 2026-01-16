from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class ChatMessage(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'chat_messages'

    session_id: str = Field(index=True)
    role: str
    content: str
    skill_id: Optional[str] = Field(default=None, index=True)
