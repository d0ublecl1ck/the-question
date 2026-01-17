from sqlmodel import Session, create_engine
from app.core.config import settings

connect_args = {}
if settings.DB_URL.startswith('sqlite'):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DB_URL, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session
