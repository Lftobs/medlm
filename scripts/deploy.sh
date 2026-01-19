#!/bin/bash

set -e

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Target directory $TARGET_DIR does not exist."
    exit 1
fi

cd $TARGET_DIR

git pull origin main

if ! git diff --quiet ORIG_HEAD HEAD -- client/package.json client/bun.lockb; then
    echo "Detected changes in client dependencies. Running bun install..."
    (cd client && bun install)
fi


if ! git diff --quiet ORIG_HEAD HEAD -- server/pyproject.toml server/uv.lock; then
    echo "Detected changes in server dependencies. Running uv sync..."
    cd server && uv sync
fi

echo "Running database migrations..."
uv run alembic upgrade head


echo "Starting MedLM services..."
sudo systemctl restart medlm-server
sudo systemctl restart medlm-worker
sudo systemctl restart medlm
sudo systemctl status medlm
sudo systemctl status medlm-server
sudo systemctl status medlm-worker

