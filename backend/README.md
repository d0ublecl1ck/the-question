# Skill Chatbot Backend

## 快速开始

```bash
cd backend
uv sync
cp .env.example .env
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
