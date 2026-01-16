from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel


class User(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'users'

    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_active: bool = True
