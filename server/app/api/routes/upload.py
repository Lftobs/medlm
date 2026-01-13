from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlmodel import Session
from typing import List
from datetime import datetime
import mimetypes
import logging

from app.api.deps import get_current_user
from app.core.db import get_session
from app.models import User, MedicalRecord
from app.services.storage import storage_service
from app.worker import process_medical_record

from sqlmodel import select, func
from app.worker import run_analysis_job

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    "application/pdf",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/dicom",
    "application/octet-stream",
}


def get_file_type(filename: str, mime_type: str) -> str:
    """Determine the file type based on filename and MIME type."""
    if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
        return "pdf"
    elif mime_type == "text/plain" or filename.lower().endswith(".txt"):
        return "text"
    elif mime_type.startswith("image/") and not filename.lower().endswith(".dcm"):
        return "image"
    elif filename.lower().endswith(".dcm") or mime_type == "application/dicom":
        return "dicom"
    else:
        raise ValueError(f"Unsupported file type: {mime_type}")


@router.post("/")
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Upload one or more medical files (PDF, images, DICOM).
    Returns a list of created MedicalRecord IDs.
    """

    uploaded_records = []
    skipped_files = []
    existing_count = db.exec(
        select(func.count(MedicalRecord.id)).where(
            MedicalRecord.user_id == current_user.id
        )
    ).one()
    is_initial_upload = existing_count == 0

    for file in files:
        existing_record = db.exec(
            select(MedicalRecord).where(
                MedicalRecord.user_id == current_user.id,
                MedicalRecord.file_name == file.filename,
            )
        ).first()

        if existing_record:
            skipped_files.append(file.filename)
            logger.info(
                f"Skipping duplicate file {file.filename} for user {current_user.id}"
            )
            continue

        mime_type = (
            file.content_type
            or mimetypes.guess_type(file.filename)[0]
            or "application/octet-stream"
        )

        try:
            file_type = get_file_type(file.filename, mime_type)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        storage_key = storage_service.save_file(
            file.file, file.filename, current_user.id
        )

        record = MedicalRecord(
            user_id=current_user.id,
            file_name=file.filename,
            file_type=file_type,
            s3_key=storage_key,
            mime_type=mime_type,
            processed_at=None,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        try:
            logger.info(f"Triggering worker task for record {record.id}")
            task = process_medical_record.delay(str(record.id), current_user.id)
            logger.info(f"Worker task triggered successfully. Task ID: {task.id}")
        except Exception as e:
            logger.error(f"Failed to trigger worker task for record {record.id}: {e}")

        uploaded_records.append(
            {
                "id": str(record.id),
                "file_name": record.file_name,
                "file_type": record.file_type,
                "created_at": record.created_at.isoformat(),
            }
        )

    if is_initial_upload and uploaded_records:
        logger.info(
            f"Initial upload detected for user {current_user.id}. Triggering auto-analysis."
        )
        try:
            run_analysis_job.delay(str(current_user.id), None)
        except Exception as e:
            logger.error(f"Failed to trigger auto-analysis: {e}")

    msg = f"Successfully uploaded {len(uploaded_records)} file(s)"
    if skipped_files:
        msg += (
            f". Skipped {len(skipped_files)} duplicate(s): {', '.join(skipped_files)}"
        )

    return {"message": msg, "records": uploaded_records, "skipped": skipped_files}


@router.get("/records")
async def list_medical_records(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_session)
):
    """List all medical records for the current user."""
    from sqlmodel import select

    statement = select(MedicalRecord).where(MedicalRecord.user_id == current_user.id)
    records = db.exec(statement).all()

    return {
        "records": [
            {
                "id": str(record.id),
                "file_name": record.file_name,
                "file_type": record.file_type,
                "created_at": record.created_at.isoformat(),
                "processed_at": record.processed_at.isoformat()
                if record.processed_at
                else None,
            }
            for record in records
        ]
    }
