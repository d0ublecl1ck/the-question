from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillComment(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_comments'

    user_id: str = Field(index=True)
    skill_id: str = Field(index=True)
    content: str
