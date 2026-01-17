from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class FavoriteCreate(BaseModel):
    skill_id: str


class FavoriteOut(BaseModel):
    id: str
    skill_id: str
    user_id: str
    created_at: datetime


class RatingCreate(BaseModel):
    skill_id: str
    rating: int = Field(ge=1, le=5)


class RatingOut(BaseModel):
    id: str
    skill_id: str
    user_id: str
    rating: int
    created_at: datetime


class RatingSummary(BaseModel):
    skill_id: str
    average: float
    count: int


class MarketStats(BaseModel):
    skill_id: str
    favorites_count: int
    rating: RatingSummary
    comments_count: int


class CommentCreate(BaseModel):
    skill_id: str
    content: str


class CommentOut(BaseModel):
    id: str
    skill_id: str
    user_id: str
    content: str
    created_at: datetime


class CommentReplyCreate(BaseModel):
    content: str


class CommentReplyOut(BaseModel):
    id: str
    comment_id: str
    user_id: str
    content: str
    created_at: datetime


class CommentLikeOut(BaseModel):
    comment_id: str
    user_id: str
    liked: bool


class MarketSkillOut(BaseModel):
    id: str
    name: str
    description: str
    tags: list[str]
    visibility: str
    avatar: Optional[str] = None
    favorites_count: int
    rating: RatingSummary
    comments_count: int
