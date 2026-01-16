from datetime import datetime
from typing import Optional
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


class CommentCreate(BaseModel):
    skill_id: str
    content: str


class CommentOut(BaseModel):
    id: str
    skill_id: str
    user_id: str
    content: str
    created_at: datetime
