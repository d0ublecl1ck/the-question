from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.core.ai_models import _parse_models
from app.db.init_db import init_db


def _auth_headers(client: TestClient) -> dict:
    email = f"{uuid4()}@b.com"
    client.post('/api/v1/auth/register', json={'email': email, 'password': 'secret123'})
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'secret123'})
    token = login.json()['access_token']
    return {'Authorization': f"Bearer {token}"}


def test_ai_models():
    init_db(drop_all=True)
    with TestClient(app) as client:
        response = client.get('/api/v1/ai/models')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert data
        assert data[0]['id']
        assert data[0]['name']


def test_ai_stream_missing_key_returns_error():
    init_db(drop_all=True)
    previous_key = settings.OPENAI_API_KEY
    settings.OPENAI_API_KEY = ''
    try:
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
        settings.OPENAI_API_KEY = previous_key


def test_parse_models_supports_name_and_code():
    models = _parse_models('GPT-5.2|gpt-5.2-2025-12-11')
    assert models == [
        {'id': 'gpt-5.2-2025-12-11', 'name': 'GPT-5.2'},
    ]


def test_parse_models_skips_invalid_entries():
    models = _parse_models('gpt-5.2-2025-12-11, |gpt-5.2-2025-12-11, GPT-5.2|')
    assert models == []
