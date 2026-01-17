from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillCommentLike(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_comment_likes'

    comment_id: str = Field(index=True)
    user_id: str = Field(index=True)
