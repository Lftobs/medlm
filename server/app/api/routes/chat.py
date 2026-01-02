from fastapi import APIRouter, Depends, Body
from sse_starlette.sse import EventSourceResponse
from ..deps import get_current_user
from ...core.db import get_session
from sqlmodel import Session
from ...models import User
from ...services.gemini_service import gemini_service
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    cache_id: str

@router.post("")
async def chat_with_context(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session) # Need DB for recreating cache if needed
):
    """
    Stream a chat response using a specific context cache.
    If cache_id is missing, creates a fresh cache from user's medical records.
    """
    logger.info(f"Chat request for user {current_user.id}, incoming cache_id: '{request.cache_id}'")
    
    cache_id = request.cache_id
    
    # Simplified logic: If no cache_id provided, always create fresh
    if not cache_id:
        logger.info("No cache_id provided. Will create fresh cache from user records.")
        from ...services.storage import storage_service
        
        if not current_user.records:
            logger.warning(f"User {current_user.id} has no medical records to analyze")
            return EventSourceResponse(iter([{"event": "error", "data": "No medical records found. Please upload files first."}]))
        
        # Gather file paths
        file_paths = []
        for r in current_user.records:
            if r.file_type == "dicom" and r.extracted_images:
                file_paths.append(storage_service.get_file_path(r.extracted_images[0]))
            else:
                file_paths.append(storage_service.get_file_path(r.s3_key))
        
        logger.info(f"Gathered {len(file_paths)} files for cache creation")
        
        # Create new cache
        try:
            cache_id = gemini_service.create_context_cache(file_paths, str(current_user.id))
            logger.info(f"Successfully created cache: {cache_id}")
        except Exception as e:
            logger.error(f"Cache creation failed: {e}", exc_info=True)
            return EventSourceResponse(iter([{"event": "error", "data": f"Failed to create context cache: {str(e)}"}]))
    else:
        logger.info(f"Using provided cache_id: {cache_id}")

    async def event_generator():
        if not cache_id:
            logger.error("Cache ID is None after resolution logic")
            yield {"event": "error", "data": "Could not create or find a valid context cache from your records."}
            return

        logger.info(f"Starting streaming with cache_id: {cache_id}")
        # Stream from Gemini
        iterator = gemini_service.generate_content_stream(cache_id, request.message)
        
        try:
            chunk_count = 0
            for chunk in iterator:
                chunk_count += 1
                if chunk_count == 1:
                    logger.info("Received first chunk from Gemini")
                yield {"data": chunk}
            logger.info(f"Streaming complete. Sent {chunk_count} chunks")
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())
