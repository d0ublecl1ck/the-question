from typing import Optional
import sqlalchemy as sa
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class MemoryItem(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'memories'
    __table_args__ = (sa.UniqueConstraint('user_id', 'key', 'scope'),)

    user_id: str = Field(index=True)
    key: str = Field(index=True)
    value: str
    scope: Optional[str] = Field(default=None, index=True)
