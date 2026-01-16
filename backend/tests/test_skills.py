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


def test_skill_flow():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        payload = {
            'name': 'skill-a',
            'description': 'desc',
            'visibility': 'public',
            'tags': ['tag1', 'tag2'],
            'content': 'v1 content',
        }
        created = client.post('/api/v1/skills', json=payload, headers=headers)
        assert created.status_code == 201
        skill = created.json()
        assert skill['latest_version'] == 1
        assert skill['content'] == 'v1 content'
        skill_id = skill['id']

        listed = client.get('/api/v1/skills')
        assert listed.status_code == 200
        assert any(item['id'] == skill_id for item in listed.json())

        tagged = client.get('/api/v1/skills?tags=tag1')
        assert tagged.status_code == 200
        assert any(item['id'] == skill_id for item in tagged.json())

        versions = client.get(f"/api/v1/skills/{skill_id}/versions")
        assert versions.status_code == 200
        v1_id = versions.json()[0]['id']

        v2 = client.post(
            f"/api/v1/skills/{skill_id}/versions",
            json={'content': 'v2 content', 'parent_version_id': v1_id},
            headers=headers,
        )
        assert v2.status_code == 201
        assert v2.json()['version'] == 2
        assert v2.json()['parent_version_id'] == v1_id

        detail = client.get(f"/api/v1/skills/{skill_id}")
        assert detail.status_code == 200
        assert detail.json()['latest_version'] == 2
        assert detail.json()['content'] == 'v2 content'

        versions = client.get(f"/api/v1/skills/{skill_id}/versions")
        assert versions.status_code == 200
        assert len(versions.json()) == 2

        tree = client.get(f"/api/v1/skills/{skill_id}/versions/tree")
        assert tree.status_code == 200
        assert len(tree.json()) == 2

        exported = client.get(f"/api/v1/skills/{skill_id}/export")
        assert exported.status_code == 200
        assert len(exported.json()['versions']) == 2

        import_payload = {
            'name': 'imported-skill',
            'description': 'imported',
            'visibility': 'public',
            'tags': ['import'],
            'content': 'import v1',
            'versions': [{'version': 1, 'content': 'import v1'}],
        }
        imported = client.post('/api/v1/skills/import', json=import_payload, headers=headers)
        assert imported.status_code == 201
        assert imported.json()['latest_version'] == 1

        deleted = client.delete(f"/api/v1/skills/{skill_id}", headers=headers)
        assert deleted.status_code == 200
        missing = client.get(f"/api/v1/skills/{skill_id}")
        assert missing.status_code == 404
