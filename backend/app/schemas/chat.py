from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None


class ChatSessionOut(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ChatMessageCreate(BaseModel):
    role: str
    content: str
    skill_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    skill_id: Optional[str] = None
    created_at: datetime


class SkillSuggestionCreate(BaseModel):
    skill_id: str
    message_id: Optional[str] = None


class SkillSuggestionUpdate(BaseModel):
    status: str


class SkillSuggestionOut(BaseModel):
    id: str
    session_id: str
    skill_id: str
    message_id: Optional[str] = None
    status: str
    created_at: datetime
