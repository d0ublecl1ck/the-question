from sqlalchemy import func
from sqlmodel import Session, select
from app.models.report import Report
from app.models.enums import ReportStatus
from app.schemas.report import ReportCreate, ReportUpdate
from app.services.skill_service import get_skill, soft_delete_skill


def create_report(session: Session, user_id: str, payload: ReportCreate) -> Report:
    record = Report(
        user_id=user_id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        title=payload.title,
        content=payload.content,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    unique_count = count_unique_reports(session, payload.target_type, payload.target_id)
    if payload.target_type == 'skill' and unique_count >= 3:
        skill = get_skill(session, payload.target_id, include_deleted=True)
        if skill and not skill.deleted:
            soft_delete_skill(session, skill)
    return record


def list_reports(
    session: Session,
    user_id: str,
    status: ReportStatus | None = None,
    limit: int | None = 50,
    offset: int = 0,
) -> list[Report]:
    statement = select(Report).where(Report.user_id == user_id)
    if status is not None:
        statement = statement.where(Report.status == status)
    if offset:
        statement = statement.offset(offset)
    if limit is not None:
        statement = statement.limit(limit)
    return list(session.exec(statement).all())


def get_report(session: Session, report_id: str) -> Report | None:
    return session.exec(select(Report).where(Report.id == report_id)).first()


def update_report(session: Session, record: Report, payload: ReportUpdate) -> Report:
    record.status = payload.status
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def delete_report(session: Session, record: Report) -> None:
    session.delete(record)
    session.commit()


def count_unique_reports(session: Session, target_type: str, target_id: str) -> int:
    statement = select(func.count(func.distinct(Report.user_id))).where(
        (Report.target_type == target_type) & (Report.target_id == target_id)
    )
    result = session.exec(statement).one()
    return int(result or 0)
