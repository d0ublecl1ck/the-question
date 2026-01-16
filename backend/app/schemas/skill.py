from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SkillBase(BaseModel):
    name: str
    description: str
    visibility: str = 'public'
    tags: list[str] = Field(default_factory=list)


class SkillCreate(SkillBase):
    content: str


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None
    tags: Optional[list[str]] = None


class SkillOut(SkillBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SkillDetail(SkillOut):
    latest_version: int
    content: str


class SkillVersionCreate(BaseModel):
    content: str


class SkillVersionOut(BaseModel):
    id: str
    skill_id: str
    version: int
    content: str
    created_by: Optional[str] = None
    created_at: datetime


class SkillVersionImport(BaseModel):
    version: Optional[int] = None
    content: str
    created_by: Optional[str] = None


class SkillExport(BaseModel):
    skill: SkillOut
    versions: list[SkillVersionOut]


class SkillImport(BaseModel):
    name: str
    description: str
    visibility: str = 'public'
    tags: list[str] = Field(default_factory=list)
    content: str
    versions: list[SkillVersionImport] = Field(default_factory=list)
