from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, RefreshRequest, TokenResponse, LogoutRequest
from app.schemas.user import UserOut
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    create_user,
    revoke_refresh_token,
    store_refresh_token,
    validate_refresh_token,
)

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_session)) -> UserOut:
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already registered')
    user = create_user(session, payload.email, payload.password)
    return UserOut(id=user.id, email=user.email, is_active=user.is_active)


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    user = authenticate_user(session, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    access_token = create_access_token(user.id)
    refresh_token, expires_at = create_refresh_token(user.id)
    store_refresh_token(session, refresh_token, user.id, expires_at)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post('/refresh', response_model=TokenResponse)
def refresh(payload: RefreshRequest, session: Session = Depends(get_session)) -> TokenResponse:
    user_id = validate_refresh_token(session, payload.refresh_token)
    revoke_refresh_token(session, payload.refresh_token)
    access_token = create_access_token(user_id)
    refresh_token, expires_at = create_refresh_token(user_id)
    store_refresh_token(session, refresh_token, user_id, expires_at)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post('/logout')
def logout(payload: LogoutRequest, session: Session = Depends(get_session)) -> dict:
    revoke_refresh_token(session, payload.refresh_token)
    return {'status': 'ok'}
