# Market Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐 PRD 中技能市场/详情/搜索/评论/举报阈值相关后端能力，做到可用、可测、可联调。

**Architecture:** 在现有 `market` 与 `skills`/`reports` 基础上扩展：新增市场列表/详情/搜索 API；新增评论回复与点赞；举报引入 target 字段并对 Skill 执行“去重≥3 抑制/下架”。保持现有服务层结构，重用 `skill_service`/`market_service`，新增小型服务模块处理回复/点赞/举报阈值。

**Tech Stack:** FastAPI, SQLModel, pytest

### Task 1: 市场列表/详情（Market Skills）

**Files:**
- Modify: `backend/app/api/v1/market.py`
- Modify: `backend/app/schemas/market.py`
- Modify: `backend/app/services/market_service.py`
- Modify: `backend/tests/test_market.py`

**Step 1: Write the failing test**

在 `backend/tests/test_market.py` 追加：
```python
def test_market_list_and_detail():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        skill_id = _create_skill(client, headers)

        market_list = client.get('/api/v1/market/skills')
        assert market_list.status_code == 200
        assert any(item['id'] == skill_id for item in market_list.json())

        detail = client.get(f"/api/v1/market/skills/{skill_id}")
        assert detail.status_code == 200
        assert detail.json()['id'] == skill_id
        assert 'rating' in detail.json()
        assert 'comments_count' in detail.json()
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_market.py::test_market_list_and_detail -q`
Expected: FAIL (404 routes).

**Step 3: Write minimal implementation**

在 `backend/app/schemas/market.py` 新增：
```python
class MarketSkillOut(BaseModel):
    id: str
    name: str
    description: str
    tags: list[str]
    visibility: str
    favorites_count: int
    rating: RatingSummary
    comments_count: int
```

在 `backend/app/services/market_service.py` 新增：
```python
from app.services.skill_service import list_skills, skill_tags_to_list


def list_market_skills(session: Session, limit: int = 50, offset: int = 0) -> list[Skill]:
    return list_skills(session, visibility=SkillVisibility.PUBLIC, limit=limit, offset=offset)
```

在 `backend/app/api/v1/market.py` 新增两个路由：
```python
@router.get('/skills', response_model=list[MarketSkillOut])
def list_market_skills_endpoint(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[MarketSkillOut]:
    skills = list_market_skills(session, limit=limit, offset=offset)
    items = []
    for skill in skills:
        favorites_count = count_favorites(session, skill.id)
        average, count = get_rating_summary(session, skill.id)
        comments_count = count_comments(session, skill.id)
        items.append(
            MarketSkillOut(
                id=skill.id,
                name=skill.name,
                description=skill.description,
                tags=skill_tags_to_list(skill),
                visibility=skill.visibility,
                favorites_count=favorites_count,
                rating=RatingSummary(skill_id=skill.id, average=average, count=count),
                comments_count=comments_count,
            )
        )
    return items


@router.get('/skills/{skill_id}', response_model=MarketSkillOut)
def get_market_skill_detail(skill_id: str, session: Session = Depends(get_session)) -> MarketSkillOut:
    skill = get_skill(session, skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Skill not found')
    favorites_count = count_favorites(session, skill_id)
    average, count = get_rating_summary(session, skill_id)
    comments_count = count_comments(session, skill_id)
    return MarketSkillOut(
        id=skill.id,
        name=skill.name,
        description=skill.description,
        tags=skill_tags_to_list(skill),
        visibility=skill.visibility,
        favorites_count=favorites_count,
        rating=RatingSummary(skill_id=skill.id, average=average, count=count),
        comments_count=comments_count,
    )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_market.py::test_market_list_and_detail -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/market.py backend/app/schemas/market.py backend/app/services/market_service.py backend/tests/test_market.py
 git commit -m "feat(market): add list and detail endpoints"
```

### Task 2: 搜索 API `/search/skills`（覆盖 name/description/tags/content）

**Files:**
- Create: `backend/app/api/v1/search.py`
- Modify: `backend/app/api/v1/router.py`
- Modify: `backend/app/services/skill_service.py`
- Modify: `backend/tests/test_market.py`

**Step 1: Write the failing test**

在 `backend/tests/test_market.py` 追加：
```python
def test_skill_search_by_content():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        skill_id = _create_skill(client, headers)
        client.post(
            f"/api/v1/skills/{skill_id}/versions",
            json={'content': '## Instructions\nDo XYZ\n## Examples\nExample ABC'},
            headers=headers,
        )

        result = client.get('/api/v1/search/skills', params={'q': 'Example'})
        assert result.status_code == 200
        assert any(item['id'] == skill_id for item in result.json())
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_market.py::test_skill_search_by_content -q`
Expected: FAIL (404 route or not searching content).

**Step 3: Write minimal implementation**

在 `backend/app/services/skill_service.py` 新增搜索函数：
```python
from sqlmodel import select
from app.models.skill_version import SkillVersion


def search_skills(session: Session, q: str, limit: int = 50, offset: int = 0) -> list[Skill]:
    like = f"%{q}%"
    statement = (
        select(Skill)
        .join(SkillVersion, SkillVersion.skill_id == Skill.id, isouter=True)
        .where(Skill.deleted.is_(False))
        .where(
            (Skill.name.like(like))
            | (Skill.description.like(like))
            | (Skill.tags.like(like))
            | (SkillVersion.content.like(like))
        )
        .offset(offset)
        .limit(limit)
    )
    return list(session.exec(statement).all())
```

新增 `backend/app/api/v1/search.py`：
```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.skill import SkillOut
from app.services.skill_service import search_skills, skill_tags_to_list

router = APIRouter(prefix='/search', tags=['search'])

@router.get('/skills', response_model=list[SkillOut])
def search_skills_endpoint(
    q: str,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[SkillOut]:
    skills = search_skills(session, q, limit=limit, offset=offset)
    return [
        SkillOut(
            id=skill.id,
            name=skill.name,
            description=skill.description,
            visibility=skill.visibility,
            tags=skill_tags_to_list(skill),
            owner_id=skill.owner_id,
            created_at=skill.created_at,
            updated_at=skill.updated_at,
            deleted=skill.deleted,
            deleted_at=skill.deleted_at,
        )
        for skill in skills
    ]
```

在 `backend/app/api/v1/router.py` 注册：
```python
from app.api.v1 import search
api_router.include_router(search.router)
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_market.py::test_skill_search_by_content -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/search.py backend/app/api/v1/router.py backend/app/services/skill_service.py backend/tests/test_market.py
 git commit -m "feat(search): add skill search endpoint"
```

### Task 3: 评论回复 + 点赞

**Files:**
- Create: `backend/app/models/skill_comment_reply.py`
- Create: `backend/app/models/skill_comment_like.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/schemas/market.py`
- Modify: `backend/app/services/market_service.py`
- Modify: `backend/app/api/v1/market.py`
- Modify: `backend/tests/test_market.py`

**Step 1: Write the failing test**

在 `backend/tests/test_market.py` 追加：
```python
def test_comment_reply_and_like():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers = _auth_headers(client)
        skill_id = _create_skill(client, headers)
        comment = client.post(
            '/api/v1/market/comments',
            json={'skill_id': skill_id, 'content': 'nice'},
            headers=headers,
        )
        comment_id = comment.json()['id']

        reply = client.post(
            f"/api/v1/comments/{comment_id}/replies",
            json={'content': 'agree'},
            headers=headers,
        )
        assert reply.status_code == 201

        liked = client.post(
            f"/api/v1/comments/{comment_id}/like",
            headers=headers,
        )
        assert liked.status_code == 200
        assert liked.json()['liked'] is True
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_market.py::test_comment_reply_and_like -q`
Expected: FAIL (404 routes/models not found).

**Step 3: Write minimal implementation**

新增模型：
`backend/app/models/skill_comment_reply.py`
```python
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel

class SkillCommentReply(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_comment_replies'

    comment_id: str = Field(index=True)
    user_id: str = Field(index=True)
    content: str
```

`backend/app/models/skill_comment_like.py`
```python
from sqlmodel import Field, SQLModel
from app.models.base import IDModel, TimestampModel

class SkillCommentLike(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'skill_comment_likes'

    comment_id: str = Field(index=True)
    user_id: str = Field(index=True)
```

更新 `backend/app/models/__init__.py`：
```python
from app.models.skill_comment_reply import SkillCommentReply
from app.models.skill_comment_like import SkillCommentLike
__all__ += ['SkillCommentReply', 'SkillCommentLike']
```

更新 schema `backend/app/schemas/market.py`：
```python
class CommentReplyCreate(BaseModel):
    content: str

class CommentReplyOut(BaseModel):
    id: str
    comment_id: str
    user_id: str
    content: str
    created_at: datetime

class CommentLikeOut(BaseModel):
    comment_id: str
    user_id: str
    liked: bool
```

更新 service `backend/app/services/market_service.py`：
```python
from app.models.skill_comment_reply import SkillCommentReply
from app.models.skill_comment_like import SkillCommentLike


def add_comment_reply(session: Session, user_id: str, comment_id: str, content: str) -> SkillCommentReply:
    record = SkillCommentReply(user_id=user_id, comment_id=comment_id, content=content)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def toggle_comment_like(session: Session, user_id: str, comment_id: str) -> tuple[SkillCommentLike | None, bool]:
    existing = session.exec(
        select(SkillCommentLike).where(
            (SkillCommentLike.user_id == user_id) & (SkillCommentLike.comment_id == comment_id)
        )
    ).first()
    if existing:
        session.delete(existing)
        session.commit()
        return None, False
    record = SkillCommentLike(user_id=user_id, comment_id=comment_id)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record, True
```

新增路由到 `backend/app/api/v1/market.py`：
```python
from app.schemas.market import CommentReplyCreate, CommentReplyOut, CommentLikeOut
from app.services.market_service import add_comment_reply, toggle_comment_like

@router.post('/comments/{comment_id}/replies', response_model=CommentReplyOut, status_code=status.HTTP_201_CREATED)
def create_comment_reply(comment_id: str, payload: CommentReplyCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)) -> CommentReplyOut:
    record = add_comment_reply(session, user.id, comment_id, payload.content)
    return CommentReplyOut(
        id=record.id,
        comment_id=record.comment_id,
        user_id=record.user_id,
        content=record.content,
        created_at=record.created_at,
    )

@router.post('/comments/{comment_id}/like', response_model=CommentLikeOut)
def toggle_comment_like_endpoint(comment_id: str, session: Session = Depends(get_session), user: User = Depends(get_current_user)) -> CommentLikeOut:
    record, liked = toggle_comment_like(session, user.id, comment_id)
    return CommentLikeOut(comment_id=comment_id, user_id=user.id, liked=liked)
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_market.py::test_comment_reply_and_like -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/models/skill_comment_reply.py backend/app/models/skill_comment_like.py backend/app/models/__init__.py backend/app/schemas/market.py backend/app/services/market_service.py backend/app/api/v1/market.py backend/tests/test_market.py
 git commit -m "feat(market): add comment replies and likes"
```

### Task 4: 举报阈值（去重用户 ≥ 3 触发 Skill 下架）

**Files:**
- Modify: `backend/app/models/report.py`
- Modify: `backend/app/schemas/report.py`
- Modify: `backend/app/services/report_service.py`
- Modify: `backend/app/api/v1/reports.py`
- Modify: `backend/tests/test_market.py`

**Step 1: Write the failing test**

在 `backend/tests/test_market.py` 追加：
```python
def test_report_threshold_soft_delete_skill():
    init_db(drop_all=True)
    with TestClient(app) as client:
        headers1 = _auth_headers(client)
        headers2 = _auth_headers(client)
        headers3 = _auth_headers(client)
        skill_id = _create_skill(client, headers1)

        for headers in [headers1, headers2, headers3]:
            report = client.post(
                '/api/v1/reports',
                json={'target_type': 'skill', 'target_id': skill_id, 'title': 'bad', 'content': 'bad content'},
                headers=headers,
            )
            assert report.status_code == 201

        detail = client.get(f"/api/v1/market/skills/{skill_id}")
        assert detail.status_code == 404
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_market.py::test_report_threshold_soft_delete_skill -q`
Expected: FAIL (schema lacks fields, threshold not enforced).

**Step 3: Write minimal implementation**

更新 `backend/app/models/report.py`：
```python
class Report(IDModel, TimestampModel, SQLModel, table=True):
    __tablename__ = 'reports'

    user_id: str = Field(index=True)
    target_type: str = Field(index=True)
    target_id: str = Field(index=True)
    title: str
    content: str
    ...
```

更新 `backend/app/schemas/report.py`：
```python
class ReportCreate(BaseModel):
    target_type: str
    target_id: str
    title: str
    content: str

class ReportOut(BaseModel):
    id: str
    target_type: str
    target_id: str
    title: str
    content: str
    status: ReportStatus
    created_at: datetime
```

更新 `backend/app/services/report_service.py`：
```python
from sqlalchemy import func
from app.services.skill_service import get_skill, soft_delete_skill


def count_unique_reports(session: Session, target_type: str, target_id: str) -> int:
    statement = select(func.count(func.distinct(Report.user_id))).where(
        (Report.target_type == target_type) & (Report.target_id == target_id)
    )
    result = session.exec(statement).one()
    return int(result or 0)
```

在 `create_report` 中增加阈值处理：
```python
record = Report(...)
...
unique_count = count_unique_reports(session, payload.target_type, payload.target_id)
if payload.target_type == 'skill' and unique_count >= 3:
    skill = get_skill(session, payload.target_id, include_deleted=True)
    if skill and not skill.deleted:
        soft_delete_skill(session, skill)
```

更新 `backend/app/api/v1/reports.py` 返回结构字段。

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_market.py::test_report_threshold_soft_delete_skill -q`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/models/report.py backend/app/schemas/report.py backend/app/services/report_service.py backend/app/api/v1/reports.py backend/tests/test_market.py
 git commit -m "feat(reports): enforce report threshold takedown"
```

---

Plan complete and saved to `docs/plans/2026-01-17-market-backend-implementation.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration

2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
