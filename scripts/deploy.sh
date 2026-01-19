#!/bin/bash

set -e

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Target directory $TARGET_DIR does not exist."
    exit 1
fi

cd $TARGET_DIR

git pull origin main

cd client
bun install

cd server 
uv sync

echo "Running database migrations..."
uv run alembic upgrade head


echo "Starting MedLM services..."
sudo systemctl restart medlm-server
sudo systemctl restart medlm-worker
sudo systemctl restart medlm
sudo systemctl status medlm
sudo systemctl status medlm-server
sudo systemctl status medlm-worker

