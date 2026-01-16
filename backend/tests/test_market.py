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
        'name': 'market-skill',
        'description': 'desc',
        'visibility': 'public',
        'tags': ['market'],
        'content': 'v1',
    }
    created = client.post('/api/v1/skills', json=payload, headers=headers)
    return created.json()['id']


def test_market_flow():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        skill_id = _create_skill(client, headers)

        favorite = client.post('/api/v1/market/favorites', json={'skill_id': skill_id}, headers=headers)
        assert favorite.status_code == 201

        favorites = client.get('/api/v1/market/favorites', headers=headers)
        assert favorites.status_code == 200
        assert len(favorites.json()) == 1

        removed = client.delete(f"/api/v1/market/favorites/{skill_id}", headers=headers)
        assert removed.status_code == 200

        rating = client.post(
            '/api/v1/market/ratings',
            json={'skill_id': skill_id, 'rating': 4},
            headers=headers,
        )
        assert rating.status_code == 200

        my_rating = client.get(f"/api/v1/market/ratings/me/{skill_id}", headers=headers)
        assert my_rating.status_code == 200
        assert my_rating.json()['rating'] == 4

        summary = client.get(f"/api/v1/market/ratings/{skill_id}")
        assert summary.status_code == 200
        assert summary.json()['average'] == 4.0
        assert summary.json()['count'] == 1

        comment = client.post(
            '/api/v1/market/comments',
            json={'skill_id': skill_id, 'content': 'nice'},
            headers=headers,
        )
        assert comment.status_code == 201

        comments = client.get(f"/api/v1/market/comments/{skill_id}")
        assert comments.status_code == 200
        assert len(comments.json()) == 1

        stats = client.get(f"/api/v1/market/skills/{skill_id}/stats")
        assert stats.status_code == 200
        assert stats.json()['favorites_count'] == 0
        assert stats.json()['comments_count'] == 1
