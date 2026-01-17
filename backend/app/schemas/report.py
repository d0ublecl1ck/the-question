from datetime import datetime
from pydantic import BaseModel
from app.models.enums import ReportStatus


class ReportCreate(BaseModel):
    target_type: str
    target_id: str
    title: str
    content: str


class ReportUpdate(BaseModel):
    status: ReportStatus


class ReportOut(BaseModel):
    id: str
    target_type: str
    target_id: str
    title: str
    content: str
    status: ReportStatus
    created_at: datetime
