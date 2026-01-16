from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillSuggestion(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_suggestions'

    session_id: str = Field(index=True)
    skill_id: str = Field(index=True)
    message_id: Optional[str] = Field(default=None, index=True)
    status: str = 'pending'
