from typing import Optional
import sqlalchemy as sa
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel
from app.models.enums import SkillSuggestionStatus, enum_column


class SkillSuggestion(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_suggestions'
    __table_args__ = (sa.UniqueConstraint('session_id', 'skill_id'),)

    session_id: str = Field(index=True)
    skill_id: str = Field(index=True)
    message_id: Optional[str] = Field(default=None, index=True)
    status: SkillSuggestionStatus = Field(
        default=SkillSuggestionStatus.PENDING,
        sa_column=enum_column(SkillSuggestionStatus, 'skill_suggestion_status'),
    )
