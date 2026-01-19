# WenDui

Ask once, answer with skills. WenDui is a skill-native chat product that turns repeatable work into Skills and invokes them inline.

## Highlights

- Skill-first workflow with structured capture and reuse
- Clean UX for creating, browsing, and applying Skills
- Frontend-only workspace (backend separated)

## Tech Stack

- Frontend: React + Vite + Tailwind
- Runtime: Node.js

## Repositories

- Backend: https://github.com/d0ublecl1ck/the-question-backend

## Local Development

### Frontend

```bash
pnpm install
pnpm exec vite --host localhost --port 5174 --strictPort
```

Open `http://localhost:5174/`

### Docker

```bash
docker build -t wendui:local .
docker run --rm -p 7860:80 wendui:local
```

Open `http://localhost:7860`

## License

MIT
MIT
