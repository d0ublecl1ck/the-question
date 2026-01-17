# Chat Alias API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add PRD-aligned alias routes `/api/v1/chat/sessions...` and `POST /api/v1/skill-suggestions` while reusing existing `/chats` logic and keeping rejection suppression.

**Architecture:** Create a new alias router that maps to existing chat services. Keep `/skill-suggestions` as POST-only to avoid overlapping semantics with existing `/chats/{session}/suggestions` list/update APIs. Add focused tests and cURL verification.

**Tech Stack:** FastAPI, SQLModel, pytest

### Task 1: Add alias router and request schema

**Files:**
- Create: `backend/app/api/v1/chat_aliases.py`
- Create: `backend/app/schemas/chat_alias.py`
- Modify: `backend/app/api/v1/router.py`

**Step 1: Write the failing test**

Create `backend/tests/test_chat_aliases.py`:
```python
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
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_chat_aliases.py::test_chat_alias_flow -q`
Expected: FAIL (route not found).

**Step 3: Write minimal implementation**

Create `backend/app/schemas/chat_alias.py`:
```python
from pydantic import BaseModel
from typing import Optional

class SkillSuggestionAliasCreate(BaseModel):
    session_id: str
    skill_id: str
    message_id: Optional[str] = None
```

Create `backend/app/api/v1/chat_aliases.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_session
from app.models.user import User
from app.schemas.chat import ChatSessionCreate, ChatSessionOut, ChatMessageCreate, ChatMessageOut, SkillSuggestionOut
from app.schemas.chat_alias import SkillSuggestionAliasCreate
from app.services.auth_service import get_current_user
from app.services.chat_service import create_message, create_session, create_suggestion, get_session as get_chat_session, has_rejection
from app.services.skill_service import get_skill

router = APIRouter(prefix='/chat', tags=['chat-alias'])

@router.post('/sessions', response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_alias_session(
    payload: ChatSessionCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ChatSessionOut:
    record = create_session(session, user.id, payload.title)
    return ChatSessionOut(
        id=record.id,
        title=record.title,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )

@router.post('/sessions/{session_id}/messages', response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def create_alias_message(
    session_id: str,
    payload: ChatMessageCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ChatMessageOut:
    record = get_chat_session(session, session_id)
    if not record or record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Chat session not found')
    if payload.skill_id and not get_skill(session, payload.skill_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    message = create_message(session, session_id, payload.role, payload.content, payload.skill_id)
    return ChatMessageOut(
        id=message.id,
        session_id=message.session_id,
        role=message.role,
        content=message.content,
        skill_id=message.skill_id,
        created_at=message.created_at,
    )

@router.post('/skill-suggestions', response_model=SkillSuggestionOut, status_code=status.HTTP_201_CREATED)
def create_alias_suggestion(
    payload: SkillSuggestionAliasCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SkillSuggestionOut:
    record = get_chat_session(session, payload.session_id)
    if not record or record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Chat session not found')
    if not get_skill(session, payload.skill_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    if has_rejection(session, payload.session_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Suggestions suppressed for session')
    suggestion = create_suggestion(session, payload.session_id, payload.skill_id, payload.message_id)
    return SkillSuggestionOut(
        id=suggestion.id,
        session_id=suggestion.session_id,
        skill_id=suggestion.skill_id,
        message_id=suggestion.message_id,
        status=suggestion.status,
        created_at=suggestion.created_at,
    )
```

Modify `backend/app/api/v1/router.py` to include new router:
```python
from app.api.v1 import chat_aliases
api_router.include_router(chat_aliases.router)
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_chat_aliases.py::test_chat_alias_flow -q`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/chat_aliases.py backend/app/schemas/chat_alias.py backend/app/api/v1/router.py backend/tests/test_chat_aliases.py
 git commit -m "feat(api): add chat alias routes"
```

### Task 2: cURL 验证脚本

**Files:**
- Create: `scripts/ralph/curl/chat-alias-check.sh`

**Step 1: Write the failing test**

N/A (shell script).

**Step 2: Implement script**

Create `scripts/ralph/curl/chat-alias-check.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${BASE_URL:-http://127.0.0.1:8000}
EMAIL="alias-$(uuidgen)@b.com"

TOKEN=$(curl -sS -X POST "$BASE_URL/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" | jq -r '.id' >/dev/null; \
  curl -sS -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}" | jq -r '.access_token')

AUTH="Authorization: Bearer $TOKEN"

SKILL_ID=$(curl -sS -X POST "$BASE_URL/api/v1/skills" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"alias-skill","description":"desc","visibility":"public","tags":["alias"],"content":"v1"}' | jq -r '.id')

SESSION_ID=$(curl -sS -X POST "$BASE_URL/api/v1/chat/sessions" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"title":"alias"}' | jq -r '.id')

curl -sS -X POST "$BASE_URL/api/v1/chat/sessions/$SESSION_ID/messages" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"role":"user","content":"hi"}' | jq -e '.id' >/dev/null

SUGGESTION_ID=$(curl -sS -X POST "$BASE_URL/api/v1/skill-suggestions" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"session_id\":\"$SESSION_ID\",\"skill_id\":\"$SKILL_ID\"}" | jq -r '.id')

curl -sS -X PATCH "$BASE_URL/api/v1/chats/$SESSION_ID/suggestions/$SUGGESTION_ID" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"status":"rejected"}' | jq -e '.status' >/dev/null

STATUS=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/skill-suggestions" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d "{\"session_id\":\"$SESSION_ID\",\"skill_id\":\"$SKILL_ID\"}")

if [ "$STATUS" -ne 409 ]; then
  echo "Expected 409, got $STATUS" >&2
  exit 1
fi

echo "chat alias check ok"
```

**Step 3: Run script**

Run: `BASE_URL=http://127.0.0.1:8000 ./scripts/ralph/curl/chat-alias-check.sh`
Expected: `chat alias check ok`

**Step 4: Commit**

```bash
git add scripts/ralph/curl/chat-alias-check.sh
 git commit -m "test(curl): add chat alias check"
```

---

Plan complete and saved to `docs/plans/2026-01-17-chat-alias-api-plan.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
