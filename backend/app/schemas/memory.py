from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class MemoryCreate(BaseModel):
    key: str
    value: str
    scope: Optional[str] = None


class MemoryUpdate(BaseModel):
    value: str
    scope: Optional[str] = None


class MemoryOut(BaseModel):
    id: str
    key: str
    value: str
    scope: Optional[str] = None
    created_at: datetime
    updated_at: datetime
