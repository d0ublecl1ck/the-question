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

## License

MIT
