from fastapi import Request, HTTPException, Depends
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.config import settings
from app.models import User, Session as AuthSession
from datetime import datetime, UTC


async def get_current_user(
    request: Request, db: Session = Depends(get_session)
) -> User:
    if settings.DEBUG:
        user = db.exec(select(User)).first()
        if not user:
            user = User(
                id="test-user-id",
                email="test@example.com",
                name="Test User",
                emailVerified=True,
                createdAt=datetime.now(UTC),
                updatedAt=datetime.now(UTC),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    session_token = request.cookies.get("better-auth.session_token")
    print(session_token, "ses")

    if session_token:
        session_token = session_token.split(".")[0]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = db.exec(
        select(AuthSession).where(
            AuthSession.token == session_token,
            AuthSession.expiresAt > datetime.now(UTC),
        )
    ).first()

    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = db.get(User, session.userId)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
