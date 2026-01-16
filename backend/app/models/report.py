from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel
from app.models.enums import ReportStatus, enum_column


class Report(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'reports'

    user_id: str = Field(index=True)
    title: str
    content: str
    status: ReportStatus = Field(
        default=ReportStatus.OPEN,
        sa_column=enum_column(ReportStatus, 'report_status'),
    )
