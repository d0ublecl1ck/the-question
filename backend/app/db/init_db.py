from sqlmodel import SQLModel
from app.db.session import engine
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
    memory_item,
    notification,
    report,
)


def init_db(drop_all: bool = False) -> None:
    if drop_all:
        SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
