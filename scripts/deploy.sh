#!/bin/bash

set -e
export PATH=$PATH:/usr/local/bin:$HOME/.local/bin

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
echo "✓ MedLM server restarted"
sudo systemctl restart medlm-worker
echo "✓ MedLM worker restarted"

echo "Building frontend docker image"
docker build -t medlm_client ./client

echo "Starting MedLM client..."
sudo systemctl restart medlm-service

echo "✓ Deployment completed."
