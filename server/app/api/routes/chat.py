from fastapi import APIRouter, Depends, Body, HTTPException
from datetime import datetime, UTC
from sse_starlette.sse import EventSourceResponse
from app.api.deps import get_current_user
from app.core.db import get_session
from sqlmodel import Session
from app.models import User
from app.services.gemini_service import gemini_service
from app.services.llm_service import llm_service
from app.core.crypto import encrypt_content, decrypt_content
import logging
from pydantic import BaseModel
import asyncio
from uuid import UUID, uuid4
from sqlmodel import select
from app.models import User, ChatSession, ChatMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    context: dict = None
    session_id: UUID | None = None


class ChatMedLMRequest(BaseModel):
    message: str
    context: dict = None
    session_id: UUID | None = None


@router.post("")
async def chat_with_context(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Stream chat responses using LLM service and persist history.
    """
    logger.info(f"Chat request from user {current_user.id}: {request.message[:50]}...")

    # Ensure session exists or create one
    if request.session_id:
        chat_session = db.exec(
            select(ChatSession).where(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id
            )
        ).first()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        chat_session = ChatSession(
            user_id=current_user.id,
            title=encrypt_content(request.message[:50]),  # Encrypt title
        )
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)

    # Save user message
    user_message = ChatMessage(
        session_id=chat_session.id,
        user_id=current_user.id,
        role="user",
        content=encrypt_content(request.message), # Encrypt content
    )
    db.add(user_message)
    db.commit()

    async def event_generator():
        try:
            full_response = ""
            chunk_count = 0

            async for chunk in llm_service.chat_medlm_async(
                user_id=str(current_user.id),
                message=request.message,
                user_context=request.context,
            ):
                chunk_count += 1
                if chunk_count == 1:
                    logger.info("Started streaming LLM response")

                # If the chunk is a status update, send it but don't add to full_response
                if chunk.startswith("Thinking..."):
                    yield {"event": "status", "data": chunk}
                    continue

                full_response += chunk
                yield {"data": chunk}

            # Save AI response after stream completes
            ai_message = ChatMessage(
                session_id=chat_session.id,
                user_id=current_user.id,
                role="ai",
                content=encrypt_content(full_response), # Encrypt content
            )
            # Need a new session for the generator because the parent one might be closed
            with Session(db.bind) as new_db:
                new_db.add(ai_message)
                # Update session timestamp
                session_to_update = new_db.get(ChatSession, chat_session.id)
                if session_to_update:
                    session_to_update.updated_at = datetime.now(UTC)
                    new_db.add(session_to_update)
                new_db.commit()

            logger.info(
                f"Streaming complete. Sent {chunk_count} chunks, {len(full_response)} chars total"
            )

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(
        event_generator(),
        headers={"X-Chat-Session-ID": str(chat_session.id)}
    )


@router.get("/sessions")
async def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """List all chat sessions for the current user."""
    sessions = db.exec(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    ).all()
    
    # Decrypt titles for response
    for s in sessions:
        s.title = decrypt_content(s.title)
        
    return sessions


@router.get("/sessions/{session_id}/messages")
async def get_chat_messages(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Get all messages for a specific session."""
    session = db.exec(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    messages = db.exec(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()
    
    # Decrypt content for response
    for m in messages:
        m.content = decrypt_content(m.content)
        
    return messages


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """Delete a chat session."""
    session = db.exec(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted"}
