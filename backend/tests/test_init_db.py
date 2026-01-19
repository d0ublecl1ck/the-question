from sqlalchemy import create_engine, inspect

from app.core import config as config_module
from app.db import init_db as init_module


def test_init_db_creates_tables_for_sqlite_in_production(monkeypatch):
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    monkeypatch.setattr(init_module, "engine", engine)
    monkeypatch.setattr(config_module.settings, "ENV", "production")
    monkeypatch.setattr(config_module.settings, "DB_URL", "sqlite:///:memory:")

    init_module.init_db(drop_all=True)

    inspector = inspect(engine)
    assert "users" in inspector.get_table_names()
