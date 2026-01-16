from fastapi import APIRouter
from app.api.v1 import health, auth, users
from app.core.config import settings

api_router = APIRouter(prefix=settings.API_V1_PREFIX)

api_router.include_router(health.router, tags=['health'])
api_router.include_router(auth.router)
api_router.include_router(users.router)
