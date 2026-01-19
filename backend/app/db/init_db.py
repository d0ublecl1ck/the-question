from sqlmodel import SQLModel
from app.db.session import engine
from app.core.config import settings
from app.models import (  # noqa: F401
    user,
    skill,
    skill_version,
    refresh_token,
    skill_favorite,
    skill_rating,
    skill_comment,
    chat_session,
    chat_message,
    skill_suggestion,
    skill_draft_suggestion,
    memory_item,
    notification,
    report,
)


def init_db(drop_all: bool = False) -> None:
    if drop_all:
        SQLModel.metadata.drop_all(engine)
    if settings.DB_URL.startswith('sqlite') or settings.ENV != 'production':
        SQLModel.metadata.create_all(engine)
