import json
import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.engine import make_url

TEST_PROVIDERS_JSON = json.dumps(
    [
        {
            "host": "openai",
            "base_url": "https://api.openai.com/v1",
            "api_key_env": "OPENAI_API_KEY",
            "models": [{"id": "gpt-5.2-2025-12-11", "name": "GPT-5.2"}],
        }
    ]
)

DEFAULT_TEST_DB_URL = "mysql+pymysql://wendui:wendui@127.0.0.1:3306/wendui_test"
TEST_DB_URL = os.getenv("TEST_DB_URL", DEFAULT_TEST_DB_URL)
os.environ["DB_URL"] = TEST_DB_URL
os.environ.setdefault("OPENAI_API_KEY", "test")

from app.core.config import settings
from app.core.providers import reset_provider_registry
from app.db.init_db import init_db

settings.DB_URL = TEST_DB_URL


def _ensure_mysql_database(url: str) -> None:
    parsed_url = make_url(url)
    if not parsed_url.drivername.startswith("mysql"):
        return
    database = parsed_url.database
    if not database:
        raise RuntimeError("TEST_DB_URL must include a database name.")
    test_engine = create_engine(parsed_url, pool_pre_ping=True)
    try:
        with test_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            return
    except OperationalError as exc:
        if "Unknown database" not in str(exc):
            raise
    finally:
        test_engine.dispose()

    admin_url = os.getenv("TEST_DB_ADMIN_URL")
    if admin_url:
        admin_engine = create_engine(admin_url, pool_pre_ping=True)
    else:
        root_password = os.getenv("MYSQL_ROOT_PASSWORD", "")
        server_url = parsed_url.set(
            username="root" if root_password else parsed_url.username,
            password=root_password or parsed_url.password,
            database="mysql",
        )
        admin_engine = create_engine(server_url, pool_pre_ping=True)
    with admin_engine.connect() as connection:
        connection.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
    admin_engine.dispose()


@pytest.fixture(autouse=True, scope="session")
def _configure_providers():
    previous = settings.PROVIDERS
    settings.PROVIDERS = TEST_PROVIDERS_JSON
    reset_provider_registry()
    try:
        yield
    finally:
        settings.PROVIDERS = previous
        reset_provider_registry()


@pytest.fixture(autouse=True, scope="session")
def _configure_test_database():
    _ensure_mysql_database(TEST_DB_URL)
    init_db(drop_all=True)
    yield
