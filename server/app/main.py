import os

# Set environment variables early to prevent resource leaks from libraries
# This must be done before importing libraries like torch, numpy, or sentence_transformers
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.deps import get_current_user
from app.models import User
from app.core.db import init_db
from app.core.config import settings
from app.api.routes import upload, analysis, stream, chat, simplify
from app.core.model_manager import model_manager, cleanup_model
from app.services.llm_service import llm_service

from app import worker

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    # Initialize the model manager
    model_manager.initialize_model()
    logger.info("Model loaded successfully")

    yield

    logger.info("Shutting down application...")
    # Clean up model resources to prevent semaphore leaks
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
