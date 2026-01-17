# WenDui · 问对（后端）

## 快速开始

```bash
cd /Users/d0ublecl1ck/the-question/.worktrees/backend-fastapi/backend
uv sync
cp .env.example .env
```

`.env` 中 `CORS_ORIGINS` 必须是 JSON 数组，例如：

```
CORS_ORIGINS=["http://localhost:5174","http://127.0.0.1:5174"]
```

启动：

```bash
uv run uvicorn app.main:app --reload
```

访问：`http://127.0.0.1:8000`

## 运行测试

```bash
cd backend
uv run pytest
```

## 数据库迁移

```bash
cd backend
uv run alembic upgrade head
```

生成新迁移：

```bash
cd backend
uv run alembic revision --autogenerate -m "<message>"
```
