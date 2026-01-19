from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api.deps import get_current_user
from app.core.db import get_session
from app.models import User

router = APIRouter(prefix="/api/analyze", tags=["analysis"])

from app.worker import run_analysis_job
from datetime import datetime, timedelta, UTC
from app.models import HealthTrend, TimelineEvent, HealthVital
from sqlmodel import select, col


@router.post("/trends")
async def analyze_trends(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Trigger background analysis for trends.
    """
    if not current_user.records:
        raise HTTPException(status_code=400, detail="No records found to analyze.")

    stmt = (
        select(HealthTrend)
        .where(HealthTrend.user_id == current_user.id)
        .order_by(col(HealthTrend.created_at).desc())
        .limit(1)
    )
    last_trend = db.exec(stmt).first()

    if last_trend:
        days_since = (datetime.now(UTC) - last_trend.created_at).days
        if days_since < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Trend analysis can only be done once in 30 days. Last analysis was {days_since} days ago.",
            )

    run_analysis_job.delay(str(current_user.id), "trends")

    return {
        "status": "queued",
        "message": "Trend analysis started. Check stream for updates.",
    }


@router.post("/timeline")
async def analyze_timeline(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Trigger background analysis for timeline.
    """
    if not current_user.records:
        raise HTTPException(status_code=400, detail="No records found to analyze.")

    stmt = (
        select(TimelineEvent)
        .where(TimelineEvent.user_id == current_user.id)
        .order_by(col(TimelineEvent.created_at).desc())
        .limit(1)
    )
    last_event = db.exec(stmt).first()

    if last_event:
        days_since = (datetime.now(UTC) - last_event.created_at).days
        if days_since < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Timeline analysis can only be done once in 30 days. Last analysis was {days_since} days ago.",
            )

    run_analysis_job.delay(str(current_user.id), "timeline")

    return {
        "status": "queued",
        "message": "Timeline extraction started. Check stream for updates.",
    }


@router.get("/trends")
async def get_trends(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Get all health trend analyses for the current user.
    Returns trends sorted by creation date (newest first).
    """
    statement = (
        select(HealthTrend)
        .where(HealthTrend.user_id == current_user.id)
        .order_by(col(HealthTrend.created_at).desc())
    )
    trends = db.exec(statement).all()

    return {
        "trends": [
            {
                "id": str(trend.id),
                "trend_summary": trend.trend_summary,
                "analysis_data": trend.analysis_data,
                "created_at": trend.created_at.isoformat(),
                "updated_at": trend.updated_at.isoformat(),
            }
            for trend in trends
        ],
        "count": len(trends),
    }


@router.get("/trends/latest")
async def get_latest_trend(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Get the latest health trend analysis for the current user.
    """
    statement = (
        select(HealthTrend)
        .where(HealthTrend.user_id == current_user.id)
        .order_by(col(HealthTrend.created_at).desc())
        .limit(1)
    )
    trend = db.exec(statement).first()

    if not trend:
        raise HTTPException(
            status_code=404,
            detail="No trend analysis found. Please run analysis first.",
        )

    return {
        "id": str(trend.id),
        "trend_summary": trend.trend_summary,
        "analysis_data": trend.analysis_data,
        "created_at": trend.created_at.isoformat(),
        "updated_at": trend.updated_at.isoformat(),
    }


@router.get("/timeline")
async def get_timeline(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Get all timeline events for the current user.
    Returns timeline events sorted by creation date (newest first).
    """
    statement = (
        select(TimelineEvent)
        .where(TimelineEvent.user_id == current_user.id)
        .order_by(col(TimelineEvent.created_at).desc())
    )
    events = db.exec(statement).all()

    return {
        "timeline_events": [
            {
                "id": str(event.id),
                "analysis_summary": event.analysis_summary,
                "timeline_summary": event.timeline_summary,
                "analysis_data": event.analysis_data,
                "created_at": event.created_at.isoformat(),
                "updated_at": event.updated_at.isoformat(),
            }
            for event in events
        ],
        "count": len(events),
    }


@router.get("/timeline/latest")
async def get_latest_timeline(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Get the latest timeline event for the current user.
    """
    statement = (
        select(TimelineEvent)
        .where(TimelineEvent.user_id == current_user.id)
        .order_by(col(TimelineEvent.created_at).desc())
        .limit(1)
    )
    event = db.exec(statement).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="No timeline events found. Please run analysis first.",
        )

    return {
        "id": str(event.id),
        "analysis_summary": event.analysis_summary,
        "timeline_summary": event.timeline_summary,
        "analysis_data": event.analysis_data,
        "created_at": event.created_at.isoformat(),
        "updated_at": event.updated_at.isoformat(),
    }


@router.post("/vitals")
async def analyze_vitals(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Trigger background analysis for vitals.
    """
    if not current_user.records:
        raise HTTPException(status_code=400, detail="No records found to analyze.")

    stmt = (
        select(HealthVital)
        .where(HealthVital.user_id == current_user.id)
        .order_by(col(HealthVital.created_at).desc())
        .limit(1)
    )
    last_vital = db.exec(stmt).first()

    if last_vital:
        days_since = (datetime.now(UTC) - last_vital.created_at).days
        if days_since < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Vitals analysis can only be done once in 30 days. Last analysis was {days_since} days ago.",
            )

    run_analysis_job.delay(str(current_user.id), "vitals")

    return {
        "status": "queued",
        "message": "Vitals analysis started. Check stream for updates.",
    }


@router.get("/vitals")
async def get_vitals(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Get all vitals analyses for the current user.
    """
    statement = (
        select(HealthVital)
        .where(HealthVital.user_id == current_user.id)
        .order_by(col(HealthVital.created_at).desc())
    )
    vitals = db.exec(statement).all()

    return {
        "vitals": [
            {
                "id": str(vital.id),
                "analysis_data": vital.analysis_data,
                "created_at": vital.created_at.isoformat(),
                "updated_at": vital.updated_at.isoformat(),
            }
            for vital in vitals
        ],
        "count": len(vitals),
    }


@router.get("/vitals/latest")
async def get_latest_vitals(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """
    Get the latest vitals analysis for the current user.
    """
    statement = (
        select(HealthVital)
        .where(HealthVital.user_id == current_user.id)
        .order_by(col(HealthVital.created_at).desc())
        .limit(1)
    )
    vital = db.exec(statement).first()
    print(vital)

    if not vital:
        raise HTTPException(
            status_code=404,
            detail="No vitals analysis found. Please run analysis first.",
        )

    return {
        "id": str(vital.id),
        "analysis_data": vital.analysis_data,
        "created_at": vital.created_at.isoformat(),
        "updated_at": vital.updated_at.isoformat(),
    }
