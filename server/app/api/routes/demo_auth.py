import secrets
from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, Depends, Response
from sqlmodel import Session, select
from app.core.db import get_session
from app.models import User, Session as AuthSession

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_USER_EMAIL = "demo@medlm.app"

@router.post("/demo")
async def demo_login(
    response: Response,
    db: Session = Depends(get_session)
):
    """
    Demo login endpoint.
    Automatically logs in as the demo user, creating the account if it doesn't exist.
    """
    # Try to find the specific demo user first
    user = db.exec(select(User).where(User.email == DEMO_USER_EMAIL)).first()
    
    # If not found, check if ANY user exists (fallback to first user)
    if not user:
        user = db.exec(select(User).limit(1)).first()
    
    # If still no user, create the dedicated demo user
    if not user:
        user = User(
            id=secrets.token_urlsafe(16),
            email=DEMO_USER_EMAIL,
            name="Demo User",
            emailVerified=True,
            createdAt=datetime.now(UTC),
            updatedAt=datetime.now(UTC)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create a new session
    session_id = secrets.token_urlsafe(32)
    session_token = secrets.token_urlsafe(32)
    
    expires_at = datetime.now(UTC) + timedelta(days=31)
    
    new_session = AuthSession(
        id=session_id,
        userId=user.id,
        token=session_token,
        expiresAt=expires_at,
        createdAt=datetime.now(UTC),
        updatedAt=datetime.now(UTC)
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Set the cookie
    # Aligning with what deps.py expect
    cookie_name = "medlm.session_token"
    
    response.set_cookie(
        key=cookie_name,
        value=f"{session_token}.nothing",
        httponly=True,
        secure=False, # Set to False for local development
        samesite="lax",
        expires=expires_at,
        path="/"
    )
    
    return {
        "message": "Logged in as demo user",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }
