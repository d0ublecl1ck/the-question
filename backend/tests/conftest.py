import json
import os
from pathlib import Path

import pytest

from app.core.config import settings
from app.core.providers import reset_provider_registry

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

TEST_DB_PATH = (Path(__file__).resolve().parents[1] / "test.db").resolve()
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

os.environ["DB_URL"] = TEST_DB_URL
settings.DB_URL = TEST_DB_URL


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
