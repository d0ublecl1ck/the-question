from fastapi import APIRouter
from app.api.v1 import health, auth, users, skills, market, chats, memory, notifications, reports
from app.core.config import settings

api_router = APIRouter(prefix=settings.API_V1_PREFIX)

api_router.include_router(health.router, tags=['health'])
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(skills.router)
api_router.include_router(market.router)
api_router.include_router(chats.router)
api_router.include_router(memory.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.router)
