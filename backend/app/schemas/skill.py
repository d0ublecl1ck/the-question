from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.core.config import settings
from app.models.enums import SkillVisibility


class SkillBase(BaseModel):
    name: str
    description: str
    visibility: SkillVisibility = SkillVisibility.PUBLIC
    tags: list[str] = Field(default_factory=list)


class SkillBaseWithAvatar(SkillBase):
    avatar: Optional[str] = None


class SkillCreate(SkillBaseWithAvatar):
    content: str = Field(max_length=settings.SKILL_CONTENT_MAX_LEN)


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[SkillVisibility] = None
    tags: Optional[list[str]] = None
    avatar: Optional[str] = None


class SkillOut(SkillBaseWithAvatar):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted: bool = False
    deleted_at: Optional[datetime] = None


class SkillDetail(SkillOut):
    latest_version: int
    content: str


class SkillVersionCreate(BaseModel):
    content: str = Field(max_length=settings.SKILL_CONTENT_MAX_LEN)
    parent_version_id: Optional[str] = None


class SkillVersionOut(BaseModel):
    id: str
    skill_id: str
    version: int
    content: str
    created_by: Optional[str] = None
    created_at: datetime
    parent_version_id: Optional[str] = None


class SkillVersionNode(BaseModel):
    id: str
    version: int
    parent_version_id: Optional[str] = None


class SkillVersionImport(BaseModel):
    version: Optional[int] = None
    content: str
    created_by: Optional[str] = None
    parent_version_id: Optional[str] = None


class SkillExportSkill(BaseModel):
    id: str
    name: str
    description: str
    visibility: SkillVisibility
    tags: list[str] = Field(default_factory=list)
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted: bool = False
    deleted_at: Optional[datetime] = None


class SkillExport(BaseModel):
    skill: SkillExportSkill
    versions: list[SkillVersionOut]


class SkillImport(BaseModel):
    name: str
    description: str
    visibility: SkillVisibility = SkillVisibility.PUBLIC
    tags: list[str] = Field(default_factory=list)
    content: str = Field(max_length=settings.SKILL_CONTENT_MAX_LEN)
    versions: list[SkillVersionImport] = Field(default_factory=list)
