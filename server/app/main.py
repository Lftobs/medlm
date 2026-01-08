import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from app.api.deps import get_current_user
from app.models import User
from app.core.db import init_db
from app.core.config import settings
from app.api.routes import upload, analysis, stream, chat

from app import worker

logger = logging.getLogger(__name__)

os.environ["TOKENIZERS_PARALLELISM"] = "false"
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model
    logger.info("Loading SentenceTransformer model...")
    _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    logger.info("Model loaded successfully")

    yield
    logger.info("Shutting down...")


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


@app.get("/api/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
