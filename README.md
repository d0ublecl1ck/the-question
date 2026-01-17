# 问对 · WenDui

问对（WenDui）是一个将 Skill 技术与传统聊天融合的应用，帮助用户把可复用流程沉淀为 Skill，并在对话中智能调用。

## 启动方式（正确流程）

```bash
cd /Users/d0ublecl1ck/the-question/.worktrees/backend-fastapi
pnpm install
pnpm dev -- --host localhost --port 5174 --strictPort
```

前端访问：`http://localhost:5174/`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
