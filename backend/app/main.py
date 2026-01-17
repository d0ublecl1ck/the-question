from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
