from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db


def _auth_headers(client: TestClient) -> dict:
    email = f"{uuid4()}@b.com"
    client.post('/api/v1/auth/register', json={'email': email, 'password': 'secret123'})
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'secret123'})
    token = login.json()['access_token']
    return {'Authorization': f"Bearer {token}"}


def _create_skill(client: TestClient, headers: dict) -> str:
    payload = {
        'name': 'chat-skill',
        'description': 'desc',
        'visibility': 'public',
        'tags': ['chat'],
        'content': 'v1',
    }
    created = client.post('/api/v1/skills', json=payload, headers=headers)
    return created.json()['id']


def test_chat_flow():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        skill_id = _create_skill(client, headers)

        session = client.post('/api/v1/chats', json={'title': 'hello'}, headers=headers)
        assert session.status_code == 201
        session_id = session.json()['id']

        message = client.post(
            f"/api/v1/chats/{session_id}/messages",
            json={'role': 'user', 'content': 'hi'},
            headers=headers,
        )
        assert message.status_code == 201

        messages = client.get(f"/api/v1/chats/{session_id}/messages", headers=headers)
        assert messages.status_code == 200
        assert len(messages.json()) == 1

        suggestion = client.post(
            f"/api/v1/chats/{session_id}/suggestions",
            json={'skill_id': skill_id},
            headers=headers,
        )
        assert suggestion.status_code == 201
        suggestion_id = suggestion.json()['id']

        rejected = client.patch(
            f"/api/v1/chats/{session_id}/suggestions/{suggestion_id}",
            json={'status': 'rejected'},
            headers=headers,
        )
        assert rejected.status_code == 200
        assert rejected.json()['status'] == 'rejected'

        suppressed = client.post(
            f"/api/v1/chats/{session_id}/suggestions",
            json={'skill_id': skill_id},
            headers=headers,
        )
        assert suppressed.status_code == 409
