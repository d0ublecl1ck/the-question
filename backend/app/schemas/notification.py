from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    type: str
    content: str


class NotificationUpdate(BaseModel):
    read: bool


class NotificationOut(BaseModel):
    id: str
    type: str
    content: str
    read: bool
    created_at: datetime
