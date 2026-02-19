from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    DATABASE_URL: str
    ENCRYPTION_KEY: str #32 chars for AES-256

    PROJECT_NAME: str = "MedLM API"

    BACKEND_CORS_ORIGINS: list[str] | str

    STORAGE_DIR: str = "./storage/uploads"
    EMBEDDING_MODEL: str = "Qwen/Qwen3-Embedding-0.6B"
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_KEY: str = ""

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    GEMINI_API_KEY: str | None = None
    MEM_API_KEY: str | None = None

    DEBUG: bool = False

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string to list."""
        if isinstance(v, str):
            origins = [
                origin.strip()
                for origin in v.replace(" ", ",").split(",")
                if origin.strip()
            ]
            if "*" in origins or "http://*" in origins or "https://*" in origins:
                return ["*"]
            return origins
        return v


settings = Settings()
