from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel
from app.models.enums import UserRole, enum_column


class User(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'users'

    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_active: bool = True
    role: UserRole = Field(default=UserRole.USER, sa_column=enum_column(UserRole, 'user_role'))
