from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillFavorite(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_favorites'

    user_id: str = Field(index=True)
    skill_id: str = Field(index=True)
