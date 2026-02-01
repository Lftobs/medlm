import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.deps import get_current_user
from app.models import User
from app.core.config import settings
from app.api.routes import upload, analysis, stream, chat, simplify, demo_auth
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
    allow_origins=settings.BACKEND_CORS_ORIGINS
    if isinstance(settings.BACKEND_CORS_ORIGINS, list)
    else [settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Cookie", "Set-Cookie", "*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    max_age=3600,
)


@app.exception_handler(Exception)
async def cors_exception_handler(request: Request, exc: Exception):
    """Handle exceptions and ensure CORS headers are present."""
    origin = request.headers.get("origin")

    response = JSONResponse(
        status_code=500, content={"detail": str(exc), "error": "Internal server error"}
    )

    if origin:
        allowed_origins = (
            settings.BACKEND_CORS_ORIGINS
            if isinstance(settings.BACKEND_CORS_ORIGINS, list)
            else [settings.BACKEND_CORS_ORIGINS]
        )

        if "*" in allowed_origins or origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
    print(settings.BACKEND_CORS_ORIGINS, "----->", allowed_origins)
    return response


app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(stream.router)
app.include_router(chat.router)
app.include_router(simplify.router)
app.include_router(demo_auth.router)


@app.get("/api/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/cors-check")
async def cors_check(request: Request):
    """Debug endpoint to verify CORS configuration"""
    return {
        "cors_origins": settings.BACKEND_CORS_ORIGINS,
        "request_origin": request.headers.get("origin"),
        "request_headers": dict(request.headers),
        "cors_configured": True,
    }
