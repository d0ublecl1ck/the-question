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


def test_ai_models():
    init_db(drop_all=True)
    with TestClient(app) as client:
        response = client.get('/api/v1/ai/models')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert data
        assert data[0]['id']
