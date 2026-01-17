from sqlmodel import Session, select

from app.models.user import User
from app.schemas.user import UserOut, UserUpdate


def to_user_out(user: User) -> UserOut:
    return UserOut(id=user.id, email=user.email, is_active=user.is_active, role=user.role)


def update_user(session: Session, user: User, payload: UserUpdate) -> User:
    data = payload.model_dump(exclude_unset=True)
    email = data.get('email')
    if email is not None and email != user.email:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing and existing.id != user.id:
            raise ValueError('Email already registered')
        user.email = email

    session.add(user)
    session.commit()
    session.refresh(user)
    return user
