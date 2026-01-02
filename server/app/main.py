from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .api.deps import get_current_user
from .models import User
from .core.db import init_db
from .core.config import settings
from .api.routes import upload, analysis, stream, chat

app = FastAPI(title=settings.PROJECT_NAME)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(stream.router)
app.include_router(chat.router)

@app.get("/api/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
