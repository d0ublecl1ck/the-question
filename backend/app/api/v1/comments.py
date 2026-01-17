from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.session import get_session
from app.models.user import User
from app.schemas.market import CommentLikeOut, CommentReplyCreate, CommentReplyOut
from app.services.auth_service import get_current_user
from app.services.market_service import add_comment_reply, get_comment, toggle_comment_like

router = APIRouter(prefix='/comments', tags=['comments'])


def _ensure_comment(session: Session, comment_id: str) -> None:
    record = get_comment(session, comment_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Comment not found')


@router.post('/{comment_id}/replies', response_model=CommentReplyOut, status_code=status.HTTP_201_CREATED)
def create_comment_reply(
    comment_id: str,
    payload: CommentReplyCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> CommentReplyOut:
    _ensure_comment(session, comment_id)
    record = add_comment_reply(session, user.id, comment_id, payload.content)
    return CommentReplyOut(
        id=record.id,
        comment_id=record.comment_id,
        user_id=record.user_id,
        content=record.content,
        created_at=record.created_at,
    )


@router.post('/{comment_id}/like', response_model=CommentLikeOut)
def toggle_comment_like_endpoint(
    comment_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> CommentLikeOut:
    _ensure_comment(session, comment_id)
    record, liked = toggle_comment_like(session, user.id, comment_id)
    return CommentLikeOut(comment_id=comment_id, user_id=user.id, liked=liked)
