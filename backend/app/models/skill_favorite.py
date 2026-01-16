import sqlalchemy as sa
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillFavorite(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_favorites'
    __table_args__ = (sa.UniqueConstraint('user_id', 'skill_id'),)

    user_id: str = Field(index=True)
    skill_id: str = Field(index=True)
