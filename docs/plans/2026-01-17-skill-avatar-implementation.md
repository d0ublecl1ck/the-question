# Skill Avatar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an optional data URL `avatar` field to Skill, return it in list/search/market/detail responses, and exclude it from skill import/export payloads.

**Architecture:** Add a nullable `skills.avatar` column. Propagate through SQLModel and Pydantic schemas. Update API mappers and market/search outputs. Introduce an export-only schema without avatar. Frontend types gain an optional `avatar` field; no UI rendering required.

**Tech Stack:** FastAPI, SQLModel, Alembic, Pydantic v2, Vitest/TypeScript

### Task 1: Add failing tests for skill avatar update/clear and export exclusion

**Files:**
- Modify: `backend/tests/test_skills.py`

**Step 1: Write the failing test**

Append a new test and extend existing assertions:

```python
def test_skill_avatar_update_and_clear():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        payload = {
            'name': 'skill-a',
            'description': 'desc',
            'visibility': 'public',
            'tags': ['tag1'],
            'content': 'v1 content',
        }
        created = client.post('/api/v1/skills', json=payload, headers=headers)
        skill_id = created.json()['id']

        updated = client.patch(
            f"/api/v1/skills/{skill_id}",
            json={'avatar': 'data:image/png;base64,AAAA'},
            headers=headers,
        )
        assert updated.status_code == 200
        assert updated.json()['avatar'] == 'data:image/png;base64,AAAA'

        cleared = client.patch(
            f"/api/v1/skills/{skill_id}",
            json={'avatar': None},
            headers=headers,
        )
        assert cleared.status_code == 200
        assert cleared.json()['avatar'] is None
```

In `test_skill_flow`, assert list output includes `avatar` and export excludes it:

```python
skill_item = next(item for item in listed.json() if item['id'] == skill_id)
assert 'avatar' in skill_item
...
exported = client.get(f"/api/v1/skills/{skill_id}/export")
assert exported.status_code == 200
assert 'avatar' not in exported.json()['skill']
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_skills.py::test_skill_avatar_update_and_clear -q`
Expected: FAIL (422 on update because `avatar` not in schema).

### Task 2: Add failing tests for search/market avatar output

**Files:**
- Modify: `backend/tests/test_market.py`

**Step 1: Write the failing test**

Add avatar assertions:

```python
market_list = client.get('/api/v1/market/skills')
...
item = next(item for item in market_list.json() if item['id'] == skill_id)
assert 'avatar' in item

...detail = client.get(f"/api/v1/market/skills/{skill_id}")
assert 'avatar' in detail.json()
```

In `test_skill_search_by_content`:

```python
item = next(item for item in result.json() if item['id'] == skill_id)
assert 'avatar' in item
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_market.py::test_market_list_and_detail -q`
Expected: FAIL (missing `avatar` in response).

### Task 3: Implement backend avatar field + export schema + migration

**Files:**
- Modify: `backend/app/models/skill.py`
- Modify: `backend/app/schemas/skill.py`
- Modify: `backend/app/schemas/market.py`
- Modify: `backend/app/services/skill_service.py`
- Modify: `backend/app/api/v1/skills.py`
- Modify: `backend/app/api/v1/search.py`
- Modify: `backend/app/api/v1/market.py`
- Create: `backend/alembic/versions/<new>_add_skill_avatar.py`

**Step 1: Write minimal implementation**

`backend/app/models/skill.py`:
```python
import sqlalchemy as sa
...
class Skill(...):
    ...
    avatar: Optional[str] = Field(default=None, sa_column=sa.Column(sa.Text()))
```

`backend/app/schemas/skill.py` (introduce base with avatar and export-only schema):
```python
class SkillBase(BaseModel):
    name: str
    description: str
    visibility: SkillVisibility = SkillVisibility.PUBLIC
    tags: list[str] = Field(default_factory=list)

class SkillBaseWithAvatar(SkillBase):
    avatar: Optional[str] = None

class SkillCreate(SkillBaseWithAvatar):
    content: str = Field(max_length=settings.SKILL_CONTENT_MAX_LEN)

class SkillUpdate(BaseModel):
    ...
    avatar: Optional[str] = None

class SkillOut(SkillBaseWithAvatar):
    id: str
    ...

class SkillExportSkill(BaseModel):
    id: str
    name: str
    description: str
    visibility: SkillVisibility
    tags: list[str] = Field(default_factory=list)
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted: bool = False
    deleted_at: Optional[datetime] = None

class SkillExport(BaseModel):
    skill: SkillExportSkill
    versions: list[SkillVersionOut]
```

`backend/app/services/skill_service.py`:
```python
skill = Skill(
    ...,
    avatar=payload.avatar,
)
```

`backend/app/api/v1/skills.py` (_to_skill_out):
```python
return SkillOut(
    ...,
    avatar=skill.avatar,
)
```

`backend/app/api/v1/search.py` + `backend/app/api/v1/market.py`: add `avatar=skill.avatar` to output.

`backend/app/schemas/market.py`:
```python
class MarketSkillOut(BaseModel):
    ...
    avatar: Optional[str] = None
```

**Migration** `backend/alembic/versions/<new>_add_skill_avatar.py`:
```python
op.add_column('skills', sa.Column('avatar', sa.Text(), nullable=True))
```

**Step 2: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_skills.py::test_skill_avatar_update_and_clear -q`
Run: `cd backend && uv run pytest tests/test_market.py::test_market_list_and_detail -q`
Run: `cd backend && uv run pytest -q`
Expected: PASS

**Step 3: Commit**

```bash
git add backend/app/models/skill.py backend/app/schemas/skill.py backend/app/schemas/market.py \
  backend/app/services/skill_service.py backend/app/api/v1/skills.py backend/app/api/v1/search.py \
  backend/app/api/v1/market.py backend/alembic/versions/<new>_add_skill_avatar.py \
  backend/tests/test_skills.py backend/tests/test_market.py

git commit -m "feat(skill): add optional avatar field to skill"
```

### Task 4: Update frontend skill types

**Files:**
- Modify: `src/pages/ChatPage.tsx`
- Modify: `src/pages/MarketPage.tsx`
- Modify: `src/pages/SearchPage.tsx`

**Step 1: Update types**

```ts
export type SkillItem = { ...; avatar?: string | null }
export type MarketSkill = { ...; avatar?: string | null }
export type SearchSkill = { ...; avatar?: string | null }
```

**Step 2: Run tests**

Run: `pnpm test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/ChatPage.tsx src/pages/MarketPage.tsx src/pages/SearchPage.tsx

git commit -m "chore(ui): include skill avatar in types"
```
