from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillRating(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_ratings'

    user_id: str = Field(index=True)
    skill_id: str = Field(index=True)
    rating: int
