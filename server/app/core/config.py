from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    DATABASE_URL: str

    PROJECT_NAME: str = "MedLM API"

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    STORAGE_DIR: str = "./storage/uploads"
    EMBEDDING_MODEL: str = "Qwen/Qwen3-Embedding-0.6B"
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_KEY: str = ""

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    GEMINI_API_KEY: str | None = None
    MEM_API_KEY: str | None = None

    DEBUG: bool = False


settings = Settings()
