from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..deps import get_current_user
from ...core.db import get_session
from ...models import User, AnalysisNarrative
from ...services.ai_service import ai_service
from ...services.storage import storage_service
from ...services.pdf_service import pdf_service
from typing import List

router = APIRouter(prefix="/api/analyze", tags=["analysis"])

from ...worker import run_analysis_job

@router.post("/trends")
async def analyze_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Trigger background analysis for trends.
    """
    if not current_user.records:
         raise HTTPException(status_code=400, detail="No records found to analyze.")

    # Trigger Task
    run_analysis_job.delay(str(current_user.id), "trends")
    
    return {"status": "queued", "message": "Trend analysis started. Check stream for updates."}

@router.post("/timeline")
async def analyze_timeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    """
    Trigger background analysis for timeline.
    """
    if not current_user.records:
         raise HTTPException(status_code=400, detail="No records found to analyze.")

    run_analysis_job.delay(str(current_user.id), "timeline")
    
    return {"status": "queued", "message": "Timeline extraction started. Check stream for updates."}
