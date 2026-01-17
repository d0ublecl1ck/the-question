from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel
from app.models.enums import ChatRole, enum_column


class ChatMessage(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'chat_messages'

    session_id: str = Field(index=True)
    role: ChatRole = Field(sa_column=enum_column(ChatRole, 'chat_role'))
    content: str
    skill_id: Optional[str] = Field(default=None, index=True)
