from datetime import datetime
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class RefreshToken(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'refresh_tokens'

    token: str = Field(index=True, unique=True)
    user_id: str = Field(index=True)
    expires_at: datetime
    revoked: bool = False
