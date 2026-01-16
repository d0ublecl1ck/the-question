from sqlmodel import SQLModel
from app.db.session import engine
from app.models import user, skill, skill_version, refresh_token  # noqa: F401


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
