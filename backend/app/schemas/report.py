from datetime import datetime
from pydantic import BaseModel


class ReportCreate(BaseModel):
    title: str
    content: str


class ReportUpdate(BaseModel):
    status: str


class ReportOut(BaseModel):
    id: str
    title: str
    content: str
    status: str
    created_at: datetime
