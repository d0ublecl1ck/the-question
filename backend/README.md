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

请确保本地或 Docker 内的 MySQL 已启动，并将 `.env` 中的 `DB_URL` 指向 MySQL。

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

## 市场预设技能（种子脚本）

写入预设技能到市场（含 system 用户归属）：

```bash
cd backend
PYTHONPATH=. uv run scripts/seed_market_skills.py --path skills/market-presets.json
```

仅校验（不写入 DB）：

```bash
cd backend
PYTHONPATH=. uv run scripts/seed_market_skills.py --path skills/market-presets.json --dry-run
```
