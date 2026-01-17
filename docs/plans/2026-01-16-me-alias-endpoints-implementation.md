# Me Alias Endpoints Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `/api/v1/me` and `/api/v1/me/memory` aliases that mirror `/users/me` and memory read/write behavior.

**Architecture:** Extend the users API with a PATCH handler to update the current user's email, then add a dedicated `me` router that delegates to the existing auth + memory services. Keep the alias endpoints thin and reuse service logic.

**Tech Stack:** FastAPI, SQLModel, Pydantic v2, pytest.

### Task 1: User update support for `/users/me`

**Files:**
- Create: `backend/app/services/user_service.py`
- Modify: `backend/app/schemas/user.py`
- Modify: `backend/app/api/v1/users.py`
- Test: `backend/tests/test_me_aliases.py`

**Step 1: Write the failing test**

```python
def test_patch_users_me_updates_email(client, headers):
    updated = client.patch('/api/v1/users/me', json={'email': 'new@example.com'}, headers=headers)
    assert updated.status_code == 200
    assert updated.json()['email'] == 'new@example.com'
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_me_aliases.py::test_patch_users_me_updates_email -v`
Expected: FAIL with 405/404 because PATCH /users/me does not exist.

**Step 3: Write minimal implementation**

```python
class UserUpdate(BaseModel):
    email: EmailStr | None = None


def update_user(session: Session, user: User, payload: UserUpdate) -> User:
    if payload.email and payload.email != user.email:
        if session.exec(select(User).where(User.email == payload.email)).first():
            raise ValueError('Email already registered')
        user.email = payload.email
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_me_aliases.py::test_patch_users_me_updates_email -v`
Expected: PASS.

**Step 5: Commit**

```bash
# Defer commits; final commit will use git-commit-all after full test pass per repo instructions.
```

### Task 2: `/me` + `/me/memory` aliases

**Files:**
- Create: `backend/app/api/v1/me.py`
- Modify: `backend/app/api/v1/router.py`
- Test: `backend/tests/test_me_aliases.py`

**Step 1: Write the failing tests**

```python
def test_me_aliases(client, headers):
    me = client.get('/api/v1/me', headers=headers)
    assert me.status_code == 200

    updated = client.patch('/api/v1/me', json={'email': 'alias@example.com'}, headers=headers)
    assert updated.status_code == 200


def test_me_memory_aliases(client, headers):
    memory = client.patch('/api/v1/me/memory', json={'key': 'tone', 'value': 'concise'}, headers=headers)
    assert memory.status_code == 200

    memories = client.get('/api/v1/me/memory', headers=headers)
    assert memories.status_code == 200
    assert len(memories.json()) == 1
```

**Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_me_aliases.py::test_me_aliases backend/tests/test_me_aliases.py::test_me_memory_aliases -v`
Expected: FAIL with 404 because `/me` routes do not exist.

**Step 3: Write minimal implementation**

```python
router = APIRouter(prefix='/me', tags=['me'])

@router.get('', response_model=UserOut)
def get_me(user: User = Depends(get_current_user)) -> UserOut:
    ...

@router.patch('', response_model=UserOut)
def patch_me(payload: UserUpdate, session: Session = Depends(get_session), user: User = Depends(get_current_user)) -> UserOut:
    ...

@router.get('/memory', response_model=list[MemoryOut])
def get_my_memory(...):
    ...

@router.patch('/memory', response_model=MemoryOut)
def patch_my_memory(payload: MemoryCreate, ...):
    ...
```

**Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_me_aliases.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
# Defer commits; final commit will use git-commit-all after full test pass per repo instructions.
```

### Task 3: Full backend test run

**Files:**
- Test: `backend/tests`

**Step 1: Run test suite**

Run: `pytest backend/tests -v`
Expected: PASS.

**Step 2: Commit (if needed)**

```bash
# Defer commits; final commit will use git-commit-all after full test pass per repo instructions.
```
