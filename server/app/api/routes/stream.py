from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse
from ..deps import get_current_user
from ...services.stream_service import stream_service
from ...models import User

router = APIRouter(tags=["stream"])

@router.get("/api/stream")
async def stream_events(current_user: User = Depends(get_current_user)):
    """
    SSE Endpoint for real-time updates.
    Listens to a user-specific Redis channel.
    """
    channel = f"user:{current_user.id}:status"
    
    async def event_generator():
        yield {"event": "connected", "data": "connected"}
        async for message in stream_service.subscribe(channel):
            yield {"data": message}

    return EventSourceResponse(event_generator())
