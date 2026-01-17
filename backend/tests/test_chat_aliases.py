from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.init_db import init_db
from app.main import app


def _auth_headers(client: TestClient) -> dict:
    email = f"{uuid4()}@b.com"
    client.post('/api/v1/auth/register', json={'email': email, 'password': 'secret123'})
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'secret123'})
    token = login.json()['access_token']
    return {'Authorization': f"Bearer {token}"}


def _create_skill(client: TestClient, headers: dict) -> str:
    payload = {
        'name': 'alias-skill',
        'description': 'desc',
        'visibility': 'public',
        'tags': ['alias'],
        'content': 'v1',
    }
    created = client.post('/api/v1/skills', json=payload, headers=headers)
    return created.json()['id']


def test_chat_alias_flow():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        skill_id = _create_skill(client, headers)

        session = client.post('/api/v1/chat/sessions', json={'title': 'alias'}, headers=headers)
        assert session.status_code == 201
        session_id = session.json()['id']

        message = client.post(
            f"/api/v1/chat/sessions/{session_id}/messages",
            json={'role': 'user', 'content': 'hi'},
            headers=headers,
        )
        assert message.status_code == 201

        suggestion = client.post(
            '/api/v1/skill-suggestions',
            json={'session_id': session_id, 'skill_id': skill_id},
            headers=headers,
        )
        assert suggestion.status_code == 201

        rejected = client.patch(
            f"/api/v1/chats/{session_id}/suggestions/{suggestion.json()['id']}",
            json={'status': 'rejected'},
            headers=headers,
        )
        assert rejected.status_code == 200

        suppressed = client.post(
            '/api/v1/skill-suggestions',
            json={'session_id': session_id, 'skill_id': skill_id},
            headers=headers,
        )
        assert suppressed.status_code == 409
