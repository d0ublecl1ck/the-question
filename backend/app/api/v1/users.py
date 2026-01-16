from fastapi import APIRouter, Depends
from app.schemas.user import UserOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me', response_model=UserOut)
def me(user=Depends(get_current_user)) -> UserOut:
    return UserOut(id=user.id, email=user.email, is_active=user.is_active, role=user.role)
