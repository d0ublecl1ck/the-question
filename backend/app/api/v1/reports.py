from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.models.user import User
from app.schemas.report import ReportCreate, ReportOut, ReportUpdate
from app.models.enums import ReportStatus
from app.services.auth_service import get_current_user
from app.services.report_service import create_report, delete_report, get_report, list_reports, update_report

router = APIRouter(prefix='/reports', tags=['reports'])


def _ensure_owner(record, user: User) -> None:
    if record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not allowed')


@router.post('', response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report_endpoint(
    payload: ReportCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ReportOut:
    record = create_report(session, user.id, payload)
    return ReportOut(
        id=record.id,
        title=record.title,
        content=record.content,
        status=record.status,
        created_at=record.created_at,
    )


@router.get('', response_model=list[ReportOut])
def list_reports_endpoint(
    status: ReportStatus | None = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[ReportOut]:
    reports = list_reports(session, user.id, status=status, limit=limit, offset=offset)
    return [
        ReportOut(
            id=record.id,
            title=record.title,
            content=record.content,
            status=record.status,
            created_at=record.created_at,
        )
        for record in reports
    ]


@router.patch('/{report_id}', response_model=ReportOut)
def update_report_endpoint(
    report_id: str,
    payload: ReportUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ReportOut:
    record = get_report(session, report_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report not found')
    _ensure_owner(record, user)
    record = update_report(session, record, payload)
    return ReportOut(
        id=record.id,
        title=record.title,
        content=record.content,
        status=record.status,
        created_at=record.created_at,
    )


@router.delete('/{report_id}')
def delete_report_endpoint(
    report_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    record = get_report(session, report_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report not found')
    _ensure_owner(record, user)
    delete_report(session, record)
    return {'status': 'ok'}
