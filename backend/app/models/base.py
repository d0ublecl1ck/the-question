from datetime import datetime, timezone
from uuid import uuid4
from sqlmodel import Field, SQLModel


def _utc_now():
    return datetime.now(timezone.utc)


class IDModel(SQLModel):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, index=True)


class TimestampModel(SQLModel):
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)
