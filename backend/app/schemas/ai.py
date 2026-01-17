from typing import Optional
from pydantic import BaseModel, Field


class AiModelOut(BaseModel):
    id: str
    name: str
    host: str


class AiChatStreamRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    skill_id: Optional[str] = None
