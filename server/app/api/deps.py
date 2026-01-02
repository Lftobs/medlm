from fastapi import Request, HTTPException, Depends
from sqlmodel import Session, select
from ..core.db import get_session
from ..models import User, Session as AuthSession
from datetime import datetime

async def get_current_user(request: Request, db: Session = Depends(get_session)) -> User:
    # --- BYPASS AUTH FOR TESTING ---
    # Return the first user in DB or create a test user
    user = db.exec(select(User)).first()
    if not user:
        user = User(
            id="test-user-id",
            email="test@example.com",
            name="Test User",
            emailVerified=True,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
    
    # Original logic (commented out)
    # session_token = request.cookies.get("better-auth.session_token")
    # if not session_token:
    #    raise HTTPException(status_code=401, detail="Not authenticated")
    # ...
