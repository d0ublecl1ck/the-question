from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class Report(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'reports'

    user_id: str = Field(index=True)
    title: str
    content: str
    status: str = 'open'
