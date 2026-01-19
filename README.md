# 问对 · WenDui

问对（WenDui）是一个将 Skill 技术与传统聊天融合的应用，帮助用户把可复用流程沉淀为 Skill，并在对话中智能调用。

## 启动方式（正确流程）

前端启动：

```bash
cd /Users/d0ublecl1ck/the-question
pnpm install
pnpm exec vite --host localhost --port 5174 --strictPort
```

前端访问：`http://localhost:5174/`

后端启动：

```bash
cd /Users/d0ublecl1ck/the-question/backend
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

后端访问：`http://127.0.0.1:8000`

## Docker 部署

使用 Docker Compose（推荐）：

```bash
docker compose up --build
```

服务启动后访问：`http://localhost:7860`

注意事项：

- 默认使用 SQLite，并把数据库写入容器内的 `/app/backend/data/app.db`，数据会保存在 `wendui-data` 卷中。
- 如需调用模型能力，请通过环境变量提供 `PROVIDERS` 与对应的 API Key（例如 `OPENAI_API_KEY`、`MINIMAX_API_KEY`）。
- 生产环境请务必覆盖 `SECRET_KEY`。

单次构建/运行：

```bash
docker build -t wendui:local .
docker run --rm -p 7860:7860 \\
  -e SECRET_KEY=change-me \\
  -e CORS_ORIGINS='*' \\
  -e DB_URL='sqlite:///./data/app.db' \\
  -e OPENAI_API_KEY= \\
  -e MINIMAX_API_KEY= \\
  wendui:local
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
