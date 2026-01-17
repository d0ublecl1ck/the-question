from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class SkillCommentReply(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_comment_replies'

    comment_id: str = Field(index=True)
    user_id: str = Field(index=True)
    content: str
