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

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
