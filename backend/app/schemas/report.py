from datetime import datetime
from pydantic import BaseModel
from app.models.enums import ReportStatus


class ReportCreate(BaseModel):
    title: str
    content: str


class ReportUpdate(BaseModel):
    status: ReportStatus


class ReportOut(BaseModel):
    id: str
    title: str
    content: str
    status: ReportStatus
    created_at: datetime
