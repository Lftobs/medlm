from fastapi import Request, HTTPException, Depends
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.config import settings
from app.models import User, Session as AuthSession
from datetime import datetime, UTC


async def get_current_user(
    request: Request, db: Session = Depends(get_session)
) -> User:
    session_token = request.cookies.get("__Secure-medlm.session_token")
    session_token = request.cookies.get("medlm.session_token")
    # print(session_token, "ses")

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
