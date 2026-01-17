from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import ChatRole, SkillSuggestionStatus


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None


class ChatSessionOut(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ChatMessageCreate(BaseModel):
    role: ChatRole
    content: str
    skill_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: str
    session_id: str
    role: ChatRole
    content: str
    skill_id: Optional[str] = None
    created_at: datetime


class SkillSuggestionCreate(BaseModel):
    skill_id: str
    message_id: Optional[str] = None


class SkillSuggestionUpdate(BaseModel):
    status: SkillSuggestionStatus


class SkillSuggestionOut(BaseModel):
    id: str
    session_id: str
    skill_id: str
    message_id: Optional[str] = None
    reason: Optional[str] = None
    status: SkillSuggestionStatus
    created_at: datetime


class SkillDraftSuggestionUpdate(BaseModel):
    status: SkillSuggestionStatus


class SkillDraftSuggestionAcceptIn(BaseModel):
    model: Optional[str] = None


class SkillDraftSuggestionOut(BaseModel):
    id: str
    session_id: str
    message_id: Optional[str] = None
    goal: str
    constraints: Optional[str] = None
    reason: Optional[str] = None
    status: SkillSuggestionStatus
    created_skill_id: Optional[str] = None
    created_at: datetime


class SkillDraftSuggestionAcceptOut(BaseModel):
    suggestion_id: str
    skill_id: str
    version: int
    name: str
    description: str
    visibility: str
    warnings: list[str] = []
