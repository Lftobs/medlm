#!/bin/bash

set -e

echo "Starting MedLM backend server..."

if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed. Please install uv first."
    echo "Visit: https://github.com/astral-sh/uv"
    exit 1
fi

if [ ! -f "app/main.py" ]; then
    echo "Error: app/main.py not found. Please run this script from the server/ directory."
    exit 1
fi

export PYTHONPATH=.

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
