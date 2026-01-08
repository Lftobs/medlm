from fastapi import APIRouter, Depends, Body
from sse_starlette.sse import EventSourceResponse
from app.api.deps import get_current_user
from app.core.db import get_session
from sqlmodel import Session
from app.models import User
from app.services.gemini_service import gemini_service
from app.services.llm_service import llm_service
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    context: dict = None


class ChatMedLMRequest(BaseModel):
    message: str
    context: dict = None


@router.post("")
async def chat_with_context(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Stream chat responses using LLM service.
    """
    logger.info(f"Chat request from user {current_user.id}: {request.message[:50]}...")

    async def event_generator():
        try:
            # Stream response from chat_medlm
            full_response = ""
            chunk_count = 0

            for chunk in llm_service.chat_medlm(
                user_id=str(current_user.id),
                message=request.message,
                user_context=request.context,
            ):
                chunk_count += 1
                if chunk_count == 1:
                    logger.info("Started streaming LLM response")

                full_response += chunk
                yield {"data": chunk}

            logger.info(
                f"Streaming complete. Sent {chunk_count} chunks, {len(full_response)} chars total"
            )

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())


@router.post("/medlm")
async def chat_medlm_stream(
    request: ChatMedLMRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Stream chat responses using MedLM with combined Qdrant and mem0 memory search.
    This provides a more comprehensive context by searching both vector store and conversation history.
    """
    logger.info(
        f"MedLM chat request from user {current_user.id}: {request.message[:50]}..."
    )

    async def event_generator():
        try:
            # Stream response from chat_medlm
            full_response = ""
            chunk_count = 0

            for chunk in llm_service.chat_medlm(
                user_id=str(current_user.id),
                message=request.message,
                user_context=request.context,
            ):
                chunk_count += 1
                if chunk_count == 1:
                    logger.info("Started streaming MedLM response")

                full_response += chunk
                yield {"data": chunk}

            logger.info(
                f"MedLM streaming complete. Sent {chunk_count} chunks, {len(full_response)} chars total"
            )

        except Exception as e:
            logger.error(f"MedLM streaming error: {e}", exc_info=True)
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())
