from uuid import uuid4
from fastapi.testclient import TestClient
from app.db.init_db import init_db
from app.main import app


def test_register_login_refresh():
    init_db(drop_all=True)
    with TestClient(app) as client:
        email = f"{uuid4()}@b.com"
        r = client.post('/api/v1/auth/register', json={'email': email, 'password': 'secret123'})
        assert r.status_code == 201
        assert r.json()['role'] == 'user'

        login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'secret123'})
        assert login.status_code == 200
        refresh_token = login.json()['refresh_token']

        refresh = client.post('/api/v1/auth/refresh', json={'refresh_token': refresh_token})
        assert refresh.status_code == 200
