from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlmodel import Session
from typing import List
from datetime import datetime
import mimetypes

from ..deps import get_current_user
from ...core.db import get_session
from ...models import User, MedicalRecord
from ...services.storage import storage_service

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {
    "application/pdf",
    "text/plain"
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/dicom",  # DICOM files
    "application/octet-stream"  # For .dcm files without proper MIME
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
    db: Session = Depends(get_session)
):
    """
    Upload one or more medical files (PDF, images, DICOM).
    Returns a list of created MedicalRecord IDs.
    """
    uploaded_records = []
    
    for file in files:
        # Validate file type
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        
        try:
            file_type = get_file_type(file.filename, mime_type)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Save file to storage
        storage_key = storage_service.save_file(
            file.file,
            file.filename,
            current_user.id
        )
        
        # Create database record
        record = MedicalRecord(
            user_id=current_user.id,
            file_name=file.filename,
            file_type=file_type,
            s3_key=storage_key,  # Using local storage for now
            mime_type=mime_type,
            processed_at=None  # Will be set after preprocessing
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # Trigger background processing
        from ...worker import process_medical_record
        process_medical_record.delay(str(record.id))
        
        uploaded_records.append({
            "id": str(record.id),
            "file_name": record.file_name,
            "file_type": record.file_type,
            "created_at": record.created_at.isoformat()
        })
    
    return {
        "message": f"Successfully uploaded {len(files)} file(s)",
        "records": uploaded_records
    }

@router.get("/records")
async def list_medical_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
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
                "processed_at": record.processed_at.isoformat() if record.processed_at else None
            }
            for record in records
        ]
    }
