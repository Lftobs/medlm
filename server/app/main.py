import os
import logging
import signal
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.deps import get_current_user
from app.models import User
from app.core.config import settings
from app.api.routes import upload, analysis, stream, chat, simplify
from app.core.utils import cleanup_model
from app.services.llm_service import llm_service


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")

    yield

    logger.info("Shutting down application...")
    cleanup_model()
    llm_service.cleanup()

    logger.info("Cleanup completed")


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(stream.router)
app.include_router(chat.router)
app.include_router(simplify.router)


@app.get("/api/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
