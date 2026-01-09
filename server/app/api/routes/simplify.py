from fastapi import APIRouter, Depends, Body
from app.api.deps import get_current_user
from app.models import User
from app.services.llm_service import llm_service
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/simplify", tags=["simplify"])


class SimplifyRequest(BaseModel):
    input_text: str


@router.post("")
async def simplify_text(
    request: SimplifyRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Simplify complex medical text for layman understanding.
    """
    logger.info(
        f"Text simplification request from user {current_user.id}: {request.input_text[:50]}..."
    )

    try:
        prediction = llm_service.simplify_text(input_text=request.input_text)
        simplified_text = prediction.simplified

        logger.info(f"Text simplification completed for user {current_user.id}")

        return {
            "simplified": simplified_text,
            "original_length": len(request.input_text),
            "simplified_length": len(simplified_text),
        }

    except Exception as e:
        logger.error(f"Text simplification error: {e}", exc_info=True)
        return {
            "error": f"I apologize, but I encountered an error while simplifying the text: {str(e)}"
        }
