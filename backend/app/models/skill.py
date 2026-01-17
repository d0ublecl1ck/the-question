from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel
from app.models.enums import SkillVisibility, enum_column


class Skill(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skills'

    name: str
    description: str
    owner_id: Optional[str] = Field(default=None, index=True)
    tags: Optional[str] = Field(default=None)
    visibility: SkillVisibility = Field(
        default=SkillVisibility.PUBLIC,
        sa_column=enum_column(SkillVisibility, 'skill_visibility'),
    )
    deleted: bool = False
    deleted_at: Optional[datetime] = None
