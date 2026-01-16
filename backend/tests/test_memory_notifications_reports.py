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


def test_memory_notifications_reports_flow():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)

        memory = client.post(
            '/api/v1/memory',
            json={'key': 'preferred-tone', 'value': 'concise', 'scope': 'global'},
            headers=headers,
        )
        assert memory.status_code == 201
        memory_id = memory.json()['id']

        memories = client.get('/api/v1/memory', headers=headers)
        assert memories.status_code == 200
        assert len(memories.json()) == 1

        updated = client.patch(
            f"/api/v1/memory/{memory_id}",
            json={'value': 'detailed', 'scope': 'global'},
            headers=headers,
        )
        assert updated.status_code == 200
        assert updated.json()['value'] == 'detailed'

        notification = client.post(
            '/api/v1/notifications',
            json={'type': 'system', 'content': 'hello'},
            headers=headers,
        )
        assert notification.status_code == 201
        notification_id = notification.json()['id']

        notifications = client.get('/api/v1/notifications', headers=headers)
        assert notifications.status_code == 200
        assert len(notifications.json()) == 1

        marked = client.patch(
            f"/api/v1/notifications/{notification_id}",
            json={'read': True},
            headers=headers,
        )
        assert marked.status_code == 200
        assert marked.json()['read'] is True

        report = client.post(
            '/api/v1/reports',
            json={'title': 'Bug', 'content': 'Something broke'},
            headers=headers,
        )
        assert report.status_code == 201
        report_id = report.json()['id']

        reports = client.get('/api/v1/reports', headers=headers)
        assert reports.status_code == 200
        assert len(reports.json()) == 1

        resolved = client.patch(
            f"/api/v1/reports/{report_id}",
            json={'status': 'resolved'},
            headers=headers,
        )
        assert resolved.status_code == 200
        assert resolved.json()['status'] == 'resolved'
