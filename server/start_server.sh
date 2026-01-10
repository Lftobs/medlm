#!/bin/bash

set -e

echo "Starting MedLM backend server..."

if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed. Please install uv first."
    echo "Visit: https://github.com/astral-sh/uv"
    exit 1
fi

cd server

if [ ! -f "app/main.py" ]; then
    echo "Error: app/main.py not found. Please ensure you're running from the project root."
    exit 1
fi

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting Celery worker..."
uv run celery -A app.core.celery_app worker --loglevel=info &
CELERY_PID=$!

cleanup() {
    echo "Stopping Celery worker..."
    kill $CELERY_PID 2>/dev/null || true
    wait $CELERY_PID 2>/dev/null || true
    echo "Cleanup completed."
}

trap cleanup EXIT

echo "Starting FastAPI server..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo "Server stopped."
