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

echo "Starting blue-green frontend deployment..."

CURRENT_COLOR=$(sudo systemctl show medlm.service -p Environment | grep -oP 'ACTIVE_COLOR=\K\w+' || echo "blue")
echo "Current active color: $CURRENT_COLOR"

if [ "$CURRENT_COLOR" = "blue" ]; then
    NEXT_COLOR="green"
else
    NEXT_COLOR="blue"
fi

echo "Building next color: $NEXT_COLOR"

docker build --build-arg VITE_SERVER_URL=https://api.medlm.intrep.xyz -t medlm_client:$NEXT_COLOR ./client

sudo systemctl set-environment ACTIVE_COLOR=$NEXT_COLOR
sudo systemctl daemon-reload

echo "Switching to $NEXT_COLOR..."
sudo systemctl restart medlm.service

sleep 10

if sudo systemctl is-active --quiet medlm.service; then
    echo "✓ Frontend switched to $NEXT_COLOR successfully"

    if [ "$CURRENT_COLOR" != "$NEXT_COLOR" ]; then
        echo "Cleaning up old image: medlm_client:$CURRENT_COLOR"
        docker rmi medlm_client:$CURRENT_COLOR 2>/dev/null || true
    fi

    echo "✓ Deployment completed successfully"
else
    echo "❌ Frontend failed to start with $NEXT_COLOR, rolling back..."

    sudo systemctl set-environment medlm.service ACTIVE_COLOR=$CURRENT_COLOR
    sudo systemctl daemon-reload
    sudo systemctl restart medlm.service
    exit 1
fi
