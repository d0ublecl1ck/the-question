# WenDui

Ask once, answer with skills. WenDui is a skill-native chat product that turns repeatable work into Skills and invokes them inline.

## Highlights

- Skill-first workflow with structured capture and reuse
- Clean UX for creating, browsing, and applying Skills
- Frontend + backend split with Docker support

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: FastAPI
- Runtime: Node.js, Python (uv)

## Local Development

### Frontend

```bash
pnpm install
pnpm exec vite --host localhost --port 5174 --strictPort
```

Open `http://localhost:5174/`

### Backend

```bash
cd backend
uv sync
cp .env.example .env
```

Set `CORS_ORIGINS` in `.env` as a JSON array, e.g.

```
CORS_ORIGINS=["http://localhost:5174","http://127.0.0.1:5174"]
```

Start the server:

```bash
uv run uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`

### Docker

```bash
docker compose up --build
```

Open `http://localhost:7860`

## Deployment Notes

- 默认使用 MySQL（Docker Compose 会启动 `mysql` 服务），数据保存在 `mysql-data` 卷中。
- 如需调用模型能力，请通过环境变量提供 `PROVIDERS` 与对应的 API Key（例如 `OPENAI_API_KEY`、`MINIMAX_API_KEY`）。
- 生产环境请务必覆盖 `SECRET_KEY`。

单次构建/运行：

```bash
docker run --name wendui-mysql -d \
  -e MYSQL_DATABASE=wendui \
  -e MYSQL_USER=wendui \
  -e MYSQL_PASSWORD=wendui \
  -e MYSQL_ROOT_PASSWORD=wendui_root \
  -p 3306:3306 \
  mysql:8.4

docker build -t wendui:local .
docker run --rm -p 7860:7860 \
  -e SECRET_KEY=change-me \
  -e CORS_ORIGINS='["*"]' \
  -e DB_URL='mysql+pymysql://wendui:wendui@host.docker.internal:3306/wendui' \
  -e OPENAI_API_KEY= \
  -e MINIMAX_API_KEY= \
  wendui:local
```

## License

MIT
MIT
