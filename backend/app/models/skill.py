from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class Skill(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skills'

    name: str
    description: str
    owner_id: Optional[str] = Field(default=None, index=True)
    tags: Optional[str] = Field(default=None)
    visibility: str = 'public'
