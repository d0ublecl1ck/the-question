from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole


class UserOut(BaseModel):
    id: str
    email: EmailStr
    is_active: bool
    role: UserRole


class UserUpdate(BaseModel):
    email: EmailStr | None = None
