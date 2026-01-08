import redis.asyncio as redis
import redis as redis_sync
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)


class StreamService:
    def __init__(self):
        self.redis = redis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)
        # Synchronous Redis client for use in Celery workers
        self.redis_sync = redis_sync.from_url(
            settings.CELERY_BROKER_URL, decode_responses=True
        )

    async def publish(self, channel: str, message: dict):
        """Publish a JSON message to a Redis channel (async)."""
        try:
            await self.redis.publish(channel, json.dumps(message))
        except Exception as e:
            logger.error(f"Error publishing to SSE: {e}")

    def publish_sync(self, channel: str, message: dict):
        """Publish a JSON message to a Redis channel (sync).

        Use this method in Celery workers to avoid event loop issues.
        """
        try:
            self.redis_sync.publish(channel, json.dumps(message))
        except Exception as e:
            logger.error(f"Error publishing to SSE: {e}")

    async def subscribe(self, channel: str):
        """Yield messages from a Redis channel."""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(channel)
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()


stream_service = StreamService()
