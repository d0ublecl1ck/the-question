from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillVersion(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_versions'

    skill_id: str = Field(index=True)
    version: int = 1
    content: str
    created_by: str | None = Field(default=None)
