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
uv run celery -A app.core.celery_app worker -l info -P gevent &
CELERY_PID=$!


start_health_pinger() {
    echo "Starting health check pinger..."
    while true; do
        sleep 30
        echo "Pinging health endpoint..."
        curl -s http://localhost:8000/api/health > /dev/null || echo "Health check failed"
    done
}

start_health_pinger &
PINGER_PID=$!

cleanup() {
    echo "Stopping background processes..."
    kill $CELERY_PID 2>/dev/null || true
    kill $PINGER_PID 2>/dev/null || true
    wait $CELERY_PID 2>/dev/null || true
    echo "Cleanup completed."
}

trap cleanup EXIT

echo "Starting FastAPI server..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

echo "Server stopped."
