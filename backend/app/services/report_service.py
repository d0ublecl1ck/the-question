from sqlmodel import Session, select
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportUpdate


def create_report(session: Session, user_id: str, payload: ReportCreate) -> Report:
    record = Report(user_id=user_id, title=payload.title, content=payload.content)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_reports(session: Session, user_id: str) -> list[Report]:
    statement = select(Report).where(Report.user_id == user_id)
    return list(session.exec(statement).all())


def get_report(session: Session, report_id: str) -> Report | None:
    return session.exec(select(Report).where(Report.id == report_id)).first()


def update_report(session: Session, record: Report, payload: ReportUpdate) -> Report:
    record.status = payload.status
    session.add(record)
    session.commit()
    session.refresh(record)
    return record
