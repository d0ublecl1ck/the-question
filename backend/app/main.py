from contextlib import asynccontextmanager
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.providers import get_provider_registry
from app.db.init_db import init_db

configure_logging(settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_provider_registry()
    init_db()
    yield

app = FastAPI(title=settings.PROJECT_NAME, debug=settings.DEBUG, lifespan=lifespan)

allow_origins = settings.CORS_ORIGINS
allow_credentials = '*' not in allow_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router)


def _get_frontend_dist() -> Path:
    env_path = os.getenv("FRONTEND_DIST")
    if env_path:
        return Path(env_path).expanduser().resolve()
    return Path(__file__).resolve().parents[2] / "dist"


frontend_dist = _get_frontend_dist()
index_file = frontend_dist / "index.html"

if frontend_dist.exists() and index_file.exists():

    @app.get("/", include_in_schema=False)
    def serve_frontend_index():
        return FileResponse(index_file)

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend_assets(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = frontend_dist / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index_file)
