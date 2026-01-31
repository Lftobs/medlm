import uuid
from qdrant_client.models import PointStruct
import threading


from app.core.celery_app import celery_app
from app.core.db import engine
from app.models import MedicalRecord, User, HealthTrend, TimelineEvent, HealthVital
from app.services.dicom_service import dicom_service
from app.services.extraction_service import TextExtractionService
from sqlmodel import Session
from datetime import datetime, UTC
from app.services.llm_service import llm_service
from app.services.storage import storage_service
from app.services.stream_service import stream_service
import logging
from pathlib import Path


logger = logging.getLogger(__name__)

def analyze_and_store_document_content(text: str, record_id: str, user_id: str):
    logger.info("Analyzing document content (summary and classification)...")

    stream_service.publish_sync(
        f"user:{user_id}:status",
        {
            "type": "file-operation",
            "status": "in_progress",
            "message": "Analyzing document content...",
        },
    )

    try:
        prediction = llm_service.classify_and_summarize(text)
        summary = prediction.summary
        category = prediction.category

        logger.info(
            f"Document classified as {category}. Summary length: {len(summary)}"
        )

        with Session(engine) as db:
            record = db.get(MedicalRecord, record_id)
            if record:
                file_name = record.file_name
                record.summary = summary
                record.category = category
                db.add(record)
                db.commit()

                try:
                    memory_msg = f"{summary}"
                    llm_service.memory_service.add_memory(
                        msg=memory_msg,
                        user_id=user_id,
                        metadata={
                            "source": "document_analysis",
                            "record_id": record_id,
                            "file_name": file_name,
                            "category": category,
                        },
                    )
                    logger.info(f"Added document analysis to memory for user {user_id}")
                except Exception as mem_err:
                    logger.error(f"Failed to add memory: {mem_err}")

        stream_service.publish_sync(
            f"user:{user_id}:status",
            {
                "type": "file-operation",
                "status": "in_progress",
                "message": "Document analysis complete.",
            },
        )

    except Exception as e:
        logger.error(f"Failed to analyze document: {e}")
        stream_service.publish_sync(
            f"user:{user_id}:status",
            {
                "type": "file-operation",
                "status": "error",
                "message": "Error analyzing document content",
            },
        )
        raise e


@celery_app.task(name="app.worker.process_medical_record")
def process_medical_record(record_id: str, user_id: str):
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

            stream_service.publish_sync(
                f"user:{user_id}:status",
                {
                    "type": "file-operation",
                    "status": "started",
                    "message": f"Processing record {record.file_name} ...",
                },
            )

            if record.file_type == "dicom":
                output_dir = file_path.parent
                result = dicom_service.process_dicom(file_path, output_dir)
                image_rel_path = str(Path(record.s3_key).parent / result["image_path"])

                image_key = str(Path(record.s3_key).parent / result["image_path"])

                record.extracted_images = [image_key]
                record.processed_at = datetime.now(UTC)

            elif record.file_type in ["pdf", "text", "docx", "doc", "txt"]:
                logger.info(
                    f"Processing text file: {record.file_name} (type: {record.file_type})"
                )

                text = TextExtractionService.extract_text(file_path)
                logger.info(
                    f"Text extracted: {len(text)} characters, preview: {text[:100]}"
                )

                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "type": "file-operation",
                        "status": "in_progress",
                        "message": f"Extracted text from {record.file_name}...",
                    },
                )

                # generate_and_store_embeddings(
                #     text, user_id, record.file_name, str(record.id)
                # )

                analyze_and_store_document_content(text, str(record.id), user_id)
                db.refresh(record)

                record.processed_at = datetime.now(UTC)
            else:
                record.processed_at = datetime.now(UTC)

            db.add(record)
            db.commit()
            logger.info(f"Successfully processed record {record_id}")

        except Exception as e:
            logger.error(f"Error processing record {record_id}: {e}")
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {
                    "type": "file-operation",
                    "status": "error",
                    "message": f"Error processing {record.id}",
                },
            )


@celery_app.task(name="app.worker.run_analysis_job")
def run_analysis_job(user_id: str, job_type: str | None = None):
    """
    Orchestrates the full analysis pipeline:
    1. Gather user files
    2. Create Context Cache (if not exists or expired - for MVP recreate)
    3. Run Prompt (Trends or Timeline)
    4. Save results
    5. Publish to Redis
    """

    logger.info(f"Starting {job_type or 'full'} analysis for user {user_id}")

    start_type = (
        job_type if job_type in ["timeline", "trends", "vitals"] else "timeline"
    )
    if start_type == "trends":
        start_type = "trend"

    stream_service.publish_sync(
        f"user:{user_id}:status",
        {
            "type": start_type,
            "status": "started",
            "message": "Initiating AI Analysis...",
        },
    )

    with Session(engine) as db:
        user = db.get(User, user_id)
        records = user.records

        if not records:
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {
                    "type": "timeline",
                    "status": "error",
                    "message": "No records to analyze",
                },
            )
            return

        full_text = ""
        for r in records:
            try:
                if r.file_type in ["pdf", "text", "docx", "doc", "txt"]:
                    file_path = storage_service.get_file_path(r.s3_key)
                    text = TextExtractionService.extract_text(file_path)
                    full_text += f"\n--- Record: {r.file_name} ---\n{text}\n"
            except Exception as e:
                logger.error(f"Failed to extract text from {r.id}: {e}")

        if not full_text.strip():
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {
                    "type": "timeline",
                    "status": "error",
                    "message": "No text content found in records",
                },
            )
            return

        def run_trends():
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {
                    "type": "trend",
                    "status": "in_progress",
                    "message": "Analyzing trends...",
                },
            )
            try:
                record_ids = [str(r.id) for r in records]
                prediction = llm_service.analyze_trends(full_text)
                trends = prediction.result
                trend_summary = prediction.trend_summary

                analysis_data = []
                if trends:
                    for trend in trends:
                        t_dict = trend.model_dump()
                        t_dict["record_ids"] = record_ids
                        analysis_data.append(t_dict)

                with Session(engine) as db_session:
                    health_trend = HealthTrend(
                        user_id=user_id,
                        trend_summary=trend_summary,
                        analysis_data=analysis_data,
                    )
                    db_session.add(health_trend)
                    db_session.commit()

                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "type": "trend",
                        "status": "success",
                        "message": "Trend analysis complete",
                    },
                )
            except Exception as e:
                logger.error(f"Trend analysis failed: {e}", exc_info=True)
                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "type": "trend",
                        "status": "error",
                        "message": f"Trend analysis failed: {str(e)}",
                    },
                )

        def run_timeline():
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {
                    "type": "timeline",
                    "status": "in_progress",
                    "message": "Analyzing timeline...",
                },
            )
            try:
                record_ids = [str(r.id) for r in records]
                prediction = llm_service.extract_timeline(full_text)
                events = prediction.result
                overall_summary = prediction.overall_summary
                timeline_summary = prediction.timeline_summary

                analysis_data = []
                if events:
                    for event in events:
                        e_dict = event.model_dump()
                        e_dict["record_ids"] = record_ids
                        analysis_data.append(e_dict)

                with Session(engine) as db_session:
                    timeline_event = TimelineEvent(
                        user_id=user_id,
                        analysis_summary=overall_summary,
                        timeline_summary=timeline_summary,
                        analysis_data=analysis_data,
                    )
                    db_session.add(timeline_event)
                    db_session.commit()

                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "type": "timeline",
                        "status": "success",
                        "message": "Timeline analysis complete",
                    },
                )

                try:
                    logger.info(
                        f"Analysis Complete: Sending notification email to user {user_id}"
                    )

                except Exception as ex:
                    logger.error(f"Failed to send email notification: {ex}")
            except Exception as e:
                logger.error(f"Timeline extraction failed: {e}", exc_info=True)
                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "type": "timeline",
                        "status": "error",
                        "message": f"Timeline extraction failed: {str(e)}",
                    },
                )

        def run_vitals():
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {
                    "type": "vitals",
                    "status": "in_progress",
                    "message": "Analyzing vital signs...",
                },
            )
            try:
                prediction = llm_service.analyze_vitals(full_text)
                vitals_analysis = prediction.analysis

                analysis_data = []
                if vitals_analysis:
                    for vital in vitals_analysis:
                        v_dict = vital.model_dump()
                        analysis_data.append(v_dict)

                with Session(engine) as db_session:
                    health_vital = HealthVital(
                        user_id=user_id,
                        analysis_data=analysis_data,
                    )
                    db_session.add(health_vital)
                    db_session.commit()

                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "type": "vitals",
                        "status": "success",
                        "message": "Vital signs analysis complete",
                    },
                )
            except Exception as e:
                logger.error(f"Vital signs analysis failed: {e}", exc_info=True)
                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "type": "vitals",
                        "status": "error",
                        "message": f"Vital signs analysis failed: {str(e)}",
                    },
                )

        if job_type == "trends":
            run_trends()
        elif job_type == "timeline":
            run_timeline()
        elif job_type == "vitals":
            run_vitals()
        else:
            logger.info(
                "Running full analysis pipeline sequentially to prevent memory exhaustion"
            )
            run_timeline()
            run_trends()
            run_vitals()
