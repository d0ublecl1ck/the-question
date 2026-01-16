from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select
from app.core.config import settings
from app.db.session import get_session
from app.models.user import User
from app.models.refresh_token import RefreshToken

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': subject,
        'type': token_type,
        'iat': now,
        'exp': now + expires_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def create_access_token(user_id: str) -> str:
    return _create_token(
        user_id,
        'access',
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str) -> tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    token = _create_token(user_id, 'refresh', expires - now)
    return token, expires


def create_user(session: Session, email: str, password: str) -> User:
    user = User(email=email, hashed_password=hash_password(password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, email: str, password: str) -> User | None:
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def store_refresh_token(session: Session, token: str, user_id: str, expires_at: datetime) -> None:
    session.add(RefreshToken(token=token, user_id=user_id, expires_at=expires_at))
    session.commit()


def revoke_refresh_token(session: Session, token: str) -> None:
    record = session.exec(select(RefreshToken).where(RefreshToken.token == token)).first()
    if record:
        session.delete(record)
        session.commit()


def validate_refresh_token(session: Session, token: str) -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

    if payload.get('type') != 'refresh':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token type')

    record = session.exec(select(RefreshToken).where(RefreshToken.token == token)).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token revoked')
    expires_at = _ensure_utc(record.expires_at)
    if expires_at < datetime.now(timezone.utc):
        session.delete(record)
        session.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token expired')

    return payload.get('sub')


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

    if payload.get('type') != 'access':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token type')

    user_id = payload.get('sub')
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    return user
