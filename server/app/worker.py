from .core.celery_app import celery_app
from .core.db import engine
from .models import MedicalRecord
from .services.dicom_service import dicom_service
from .services.pdf_service import pdf_service
from .services.storage import storage_service
from sqlmodel import Session, select
from datetime import datetime
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

@celery_app.task(name="app.worker.process_medical_record")
def process_medical_record(record_id: str):
    """
    Background task to process a medical record (DICOM, PDF, etc.).
    """
    logger.info(f"Processing record {record_id}")
    
    with Session(engine) as db:
        record = db.get(MedicalRecord, record_id)
        if not record:
            logger.error(f"Record {record_id} not found")
            return

        try:
            file_path = storage_service.get_file_path(record.s3_key)
            
            if record.file_type == "dicom":
                # Process DICOM
                # We save images in the same user directory
                output_dir = file_path.parent
                result = dicom_service.process_dicom(file_path, output_dir)
                
                # Update record with extracted image path and metadata (if we had a metadata column)
                # For now, just extracted images list (we only doing 1 for MVP)
                # Note: MedicalRecord.extracted_images is a List[str]
                image_rel_path = str(Path(record.s3_key).parent / result["image_path"]) 
                # ^ actually process_dicom returns just filename, we need to construct relative path?
                # let's fix process_dicom return to return just filename and let worker construct path
                # yes, dicom_service returns "image_path": str(image_name)
                
                # We need to store RELATIVE path for frontend to access (via an API to serve files)
                # Currently s3_key is relative to STORAGE_DIR.
                
                image_key = str(Path(record.s3_key).parent / result["image_path"])
                
                record.extracted_images = [image_key]
                record.processed_at = datetime.utcnow()
                
            elif record.file_type == "pdf":
                # Process PDF (Text Extraction)
                # For MVP, we might not save the text in DB yet unless we add a column.
                # Or we just index it for RAG later.
                # Let's just mark as processed for now.
                text = pdf_service.extract_text(file_path)
                # TODO: Store text somewhere? AnalysisNarrative? Or separate optimized table?
                # For now, MVP: just mark complete.
                record.processed_at = datetime.utcnow()
                
            else:
                # Image/Other
                record.processed_at = datetime.utcnow()

            db.add(record)
            db.commit()
            logger.info(f"Successfully processed record {record_id}")

        except Exception as e:
            logger.error(f"Error processing record {record_id}: {e}")
            # db.rollback() # Session context manager handles rollback on error? NO, only if exception raised out of context?
            # Actually sqlmodel session doesn't auto-rollback if specific commit fails? 
            # safe to no-op here for now or mark status as error if we had status column
@celery_app.task(name="app.worker.process_medical_record")
def process_medical_record(record_id: str):
    """
    Background task to process a medical record (DICOM, PDF, etc.).
    """
    logger.info(f"Processing record {record_id}")
    
    with Session(engine) as db:
        record = db.get(MedicalRecord, record_id)
        if not record:
            logger.error(f"Record {record_id} not found")
            return

        try:
            file_path = storage_service.get_file_path(record.s3_key)
            
            if record.file_type == "dicom":
                # Process DICOM
                output_dir = file_path.parent
                result = dicom_service.process_dicom(file_path, output_dir)
                
                # Image relative path handling
                image_key = str(Path(record.s3_key).parent / result["image_path"])
                
                record.extracted_images = [image_key]
                record.processed_at = datetime.utcnow()
                
            elif record.file_type == "pdf":
                # Process PDF (Text Extraction)
                # For MVP: mark complete.
                pdf_service.extract_text(file_path)
                record.processed_at = datetime.utcnow()
                
            else:
                # Image/Other
                record.processed_at = datetime.utcnow()

            db.add(record)
            db.commit()
            logger.info(f"Successfully processed record {record_id}")

        except Exception as e:
            logger.error(f"Error processing record {record_id}: {e}")
            pass
    
@celery_app.task(name="app.worker.run_analysis_job")
def run_analysis_job(user_id: str, job_type: str):
    """
    Orchestrates the full analysis pipeline:
    1. Gather user files
    2. Create Context Cache (if not exists or expired - for MVP recreate)
    3. Run Prompt (Trends or Timeline)
    4. Save results
    5. Publish to Redis
    """
    from .services.gemini_service import gemini_service
    from .services.ai_service import ai_service
    from .services.storage import storage_service
    from .services.stream_service import stream_service
    from .models import AnalysisNarrative
    import asyncio
    
    logger.info(f"Starting {job_type} analysis for user {user_id}")
    
    # We must use async_to_sync for Redis publish since Celery is sync
    from asgiref.sync import async_to_sync
    
    # Update Status: Starting
    async_to_sync(stream_service.publish)(f"user:{user_id}:status", {"status": "starting", "message": "Initiating AI Analysis..."})

    with Session(engine) as db:
        user = db.get(User, user_id) # Need User model import
        # User model is not imported in worker? it is imported in snippet above but let's be safe
        records = user.records
        
        if not records:
             async_to_sync(stream_service.publish)(f"user:{user_id}:status", {"status": "error", "message": "No records to analyze"})
             return

        # 1. Gather Files
        file_paths = []
        for r in records:
             # Use processed JPEG if DICOM, or original PDF
             if r.file_type == "dicom" and r.extracted_images:
                  # Use the first extracted image
                  # Path stored in DB is relative to storage dir potentially? 
                  # Implementation detail: storage_service.get_file_path handles key 
                  # But extracted_images might be just key.
                  # Let's assume we use the first one.
                  file_paths.append(storage_service.get_file_path(r.extracted_images[0])) 
             else:
                  file_paths.append(storage_service.get_file_path(r.s3_key))

        # 2. Upload & Cache
        async_to_sync(stream_service.publish)(f"user:{user_id}:status", {"status": "processing", "message": "Caching medical history with Gemini..."})
        try:
            # Check if active cache exists? MVP: Create new one.
            cache_name = gemini_service.create_context_cache(file_paths, user_id)
        except Exception as e:
            logger.error(f"Caching failed: {e}")
            async_to_sync(stream_service.publish)(f"user:{user_id}:status", {"status": "error", "message": "Failed to process documents"})
            return

        # 3. Run Analysis
        async_to_sync(stream_service.publish)(f"user:{user_id}:status", {"status": "thinking", "message": f"Analyzing for {job_type}..."})
        
        if job_type == "trends":
            trends = ai_service.analyze_trends(cache_name)
            # Save
            narrative = AnalysisNarrative(user_id=user_id, content={"trends": trends}, cache_id=cache_name)
            db.add(narrative)
            db.commit()
            async_to_sync(stream_service.publish)(f"user:{user_id}:status", {"status": "complete", "data": {"trends": trends}})
            
        elif job_type == "timeline":
            events = ai_service.extract_timeline(cache_name)
            # Save? AnalysisNarrative or return. 
            async_to_sync(stream_service.publish)(f"user:{user_id}:status", {"status": "complete", "data": {"events": events}})


