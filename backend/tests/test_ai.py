import json
import os
from contextlib import contextmanager
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.providers import get_provider_registry, reset_provider_registry
from app.db.init_db import init_db
from app.main import app
from app.api.v1 import ai as ai_module

PROVIDERS_JSON = json.dumps(
    [
        {
            "host": "openai",
            "base_url": "https://api.openai.com/v1",
            "api_key_env": "OPENAI_API_KEY",
            "models": [{"id": "gpt-5.2-2025-12-11", "name": "GPT-5.2"}],
        },
        {
            "host": "minimax",
            "base_url": "https://api.minimaxi.com/v1",
            "api_key_env": "MINIMAX_API_KEY",
            "models": [{"id": "MiniMax-M2.1-lightning", "name": "MiniMax M2.1 Lightning"}],
        },
    ]
)


@contextmanager
def _temp_providers(value: str):
    previous = settings.PROVIDERS
    settings.PROVIDERS = value
    reset_provider_registry()
    try:
        yield
    finally:
        settings.PROVIDERS = previous
        reset_provider_registry()


@contextmanager
def _temp_env(key: str, value: str | None):
    previous = os.environ.get(key)
    if value is None:
        os.environ[key] = ''
    else:
        os.environ[key] = value
    try:
        yield
    finally:
        if previous is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = previous


def _auth_headers(client: TestClient) -> dict:
    email = f"{uuid4()}@b.com"
    client.post('/api/v1/auth/register', json={'email': email, 'password': 'secret123'})
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'secret123'})
    token = login.json()['access_token']
    return {'Authorization': f"Bearer {token}"}


def test_ai_models():
    init_db(drop_all=True)
    with _temp_providers(PROVIDERS_JSON):
        with TestClient(app) as client:
            response = client.get('/api/v1/ai/models')
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert data
            assert data[0]['id']
            assert data[0]['name']
            assert data[0]['host']


def test_ai_stream_missing_key_returns_error():
    init_db(drop_all=True)
    try:
        with _temp_providers(PROVIDERS_JSON), _temp_env('OPENAI_API_KEY', None):
            with TestClient(app) as client:
                headers = _auth_headers(client)
                session = client.post('/api/v1/chats', json={'title': 'test'}, headers=headers)
                assert session.status_code == 201
                model = client.get('/api/v1/ai/models').json()[0]['id']
                response = client.post(
                    '/api/v1/ai/chat/stream',
                    json={'session_id': session.json()['id'], 'content': 'hello', 'model': model},
                    headers=headers,
                )
                assert response.status_code == 200
                assert '"type": "error"' in response.text
    finally:
        pass


def test_ai_stream_persists_message(monkeypatch: pytest.MonkeyPatch):
    init_db(drop_all=True)

    async def fake_stream_agent_text(*args, **kwargs):
        del args, kwargs
        for chunk in ("hello", " ", "world"):
            yield chunk

    with _temp_providers(PROVIDERS_JSON), _temp_env('OPENAI_API_KEY', 'test'):
        monkeypatch.setattr(ai_module, 'stream_agent_text', fake_stream_agent_text)
        with TestClient(app) as client:
            headers = _auth_headers(client)
            session = client.post('/api/v1/chats', json={'title': 'test'}, headers=headers)
            assert session.status_code == 201
            session_id = session.json()['id']
            response = client.post(
                '/api/v1/ai/chat/stream',
                json={
                    'session_id': session_id,
                    'content': 'hello',
                    'model': 'gpt-5.2-2025-12-11',
                },
                headers=headers,
            )
            assert response.status_code == 200
            assert '"type": "delta"' in response.text
            messages = client.get(f"/api/v1/chats/{session_id}/messages", headers=headers).json()
            assert len(messages) == 2
            assert messages[-1]['role'] == 'assistant'
            assert messages[-1]['content'] == 'hello world'


def test_provider_registry_rejects_duplicate_models():
    payload = json.dumps(
        [
            {
                "host": "openai",
                "base_url": "https://api.openai.com/v1",
                "api_key_env": "OPENAI_API_KEY",
                "models": [
                    {"id": "gpt-5.2-2025-12-11", "name": "GPT-5.2"},
                    {"id": "gpt-5.2-2025-12-11", "name": "GPT-5.2-Duplicate"},
                ],
            }
        ]
    )
    with _temp_providers(payload):
        with pytest.raises(RuntimeError, match="Duplicate model id"):
            get_provider_registry()


def test_provider_registry_requires_json_array():
    payload = json.dumps({"host": "openai"})
    with _temp_providers(payload):
        with pytest.raises(RuntimeError, match="JSON array"):
            get_provider_registry()
