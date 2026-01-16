from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class MemoryItem(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'memories'

    user_id: str = Field(index=True)
    key: str = Field(index=True)
    value: str
    scope: Optional[str] = Field(default=None, index=True)
