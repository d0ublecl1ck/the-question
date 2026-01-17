from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.init_db import init_db
from app.main import app


def _create_user(client: TestClient) -> tuple[str, dict]:
    email = f"{uuid4()}@b.com"
    client.post('/api/v1/auth/register', json={'email': email, 'password': 'secret123'})
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'secret123'})
    token = login.json()['access_token']
    return email, {'Authorization': f"Bearer {token}"}


def test_patch_users_me_updates_email():
    init_db(drop_all=True)
    with TestClient(app) as client:
        _, headers = _create_user(client)

        updated = client.patch(
            '/api/v1/users/me',
            json={'email': 'new@example.com'},
            headers=headers,
        )

        assert updated.status_code == 200
        assert updated.json()['email'] == 'new@example.com'


def test_me_get_returns_user():
    init_db(drop_all=True)
    with TestClient(app) as client:
        email, headers = _create_user(client)

        me = client.get('/api/v1/me', headers=headers)

        assert me.status_code == 200
        assert me.json()['email'] == email


def test_me_patch_updates_email():
    init_db(drop_all=True)
    with TestClient(app) as client:
        _, headers = _create_user(client)

        updated = client.patch(
            '/api/v1/me',
            json={'email': 'alias@example.com'},
            headers=headers,
        )

        assert updated.status_code == 200
        assert updated.json()['email'] == 'alias@example.com'


def test_me_memory_patch_upserts():
    init_db(drop_all=True)
    with TestClient(app) as client:
        _, headers = _create_user(client)

        memory = client.patch(
            '/api/v1/me/memory',
            json={'key': 'tone', 'value': 'concise', 'scope': 'global'},
            headers=headers,
        )

        assert memory.status_code == 200
        assert memory.json()['key'] == 'tone'


def test_me_memory_get_lists():
    init_db(drop_all=True)
    with TestClient(app) as client:
        _, headers = _create_user(client)
        client.patch(
            '/api/v1/me/memory',
            json={'key': 'tone', 'value': 'concise', 'scope': 'global'},
            headers=headers,
        )

        memories = client.get('/api/v1/me/memory', headers=headers)

        assert memories.status_code == 200
        assert len(memories.json()) == 1
