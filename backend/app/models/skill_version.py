import sqlalchemy as sa
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillVersion(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_versions'
    __table_args__ = (sa.UniqueConstraint('skill_id', 'version'),)

    skill_id: str = Field(index=True)
    version: int = 1
    content: str
    created_by: str | None = Field(default=None)
    parent_version_id: str | None = Field(default=None, index=True)
