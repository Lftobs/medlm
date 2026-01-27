#!/bin/bash

set -e
export PATH="$HOME/.local/bin:$PATH"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Target directory $TARGET_DIR does not exist."
    exit 1
fi

cd $TARGET_DIR

git pull origin main


echo "Detected changes in server dependencies. Running uv sync..."
cd server && uv sync


echo "Running database migrations..."
uv run alembic upgrade head

cd ..
echo "Starting MedLM services..."

sudo systemctl restart medlm-server
sudo systemctl restart medlm-worker
docker-compose up --build client
sudo systemctl status medlm-server
sudo systemctl status medlm-worker

