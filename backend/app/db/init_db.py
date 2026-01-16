from sqlmodel import SQLModel
from app.db.session import engine
from app.models import user, skill, skill_version, refresh_token  # noqa: F401


def init_db(drop_all: bool = False) -> None:
    if drop_all:
        SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
