import uuid
from qdrant_client.models import PointStruct
import threading
from typing import Optional

from app.services.vector_service import chunk_text, semantic_chunk_text, vector_service
from celery.signals import worker_process_shutdown, worker_shutdown

from app.core.celery_app import celery_app
from app.core.db import engine
from app.models import MedicalRecord, User, HealthTrend, TimelineEvent
from app.services.dicom_service import dicom_service
from app.services.extraction_service import TextExtractionService
from sqlmodel import Session, select
from datetime import datetime, UTC
from app.services.llm_service import llm_service
from app.services.storage import storage_service
from app.services.stream_service import stream_service
import asyncio
import logging
from pathlib import Path
from sentence_transformers import SentenceTransformer
from app.core.config import settings
import os

logger = logging.getLogger(__name__)


@worker_process_shutdown.connect
def cleanup_model_on_shutdown(**kwargs):
    """Clean up model resources when worker process shuts down."""
    logger.info("App shutting down, keeping model in memory until process exit")
    pass


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

            if record.file_type == "dicom":
                output_dir = file_path.parent
                result = dicom_service.process_dicom(file_path, output_dir)
                image_rel_path = str(Path(record.s3_key).parent / result["image_path"])

                image_key = str(
                    Path(record.s3_key).parent / result["image_path"]
                )  # TODO: switch to an actual storage cloud

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

                logger.info("Chunking text semantically...")
                chunks = semantic_chunk_text(text, _model)
                logger.info(f"Text chunked into {len(chunks)} chunks")
                logger.info("Encoding chunks to embeddings...")

                docs_emb = _model.encode(
                    chunks,
                    show_progress_bar=False,
                    batch_size=32,
                    normalize_embeddings=True,
                )

                logger.info(f"Embeddings generated: shape={docs_emb.shape}")

                doc_id = record.file_name
                points = [
                    PointStruct(
                        id=uuid.uuid4().hex,
                        vector=embedding.tolist(),
                        payload={
                            "user_id": user_id,
                            "doc_id": doc_id,
                            "chunk_id": chunk_id,
                            "text": chunks[chunk_id],
                            "record_id": str(record.id),
                        },
                    )
                    for chunk_id, embedding in enumerate(docs_emb)
                ]

                logger.info(
                    f"Created {len(points)} vector points, upserting to Qdrant..."
                )

                try:
                    vector_service.upsert_vectors("clinical_records", points)
                    logger.info(
                        f"Successfully upserted {len(points)} vectors to Qdrant"
                    )
                except Exception as e:
                    logger.error(
                        f"Failed to upsert vectors to Qdrant: {e}", exc_info=True
                    )
                    raise

                record.processed_at = datetime.now(UTC)
                logger.info(f"Record {record.id} processed successfully")

            else:
                record.processed_at = datetime.now(UTC)

            db.add(record)
            db.commit()
            logger.info(f"Successfully processed record {record_id}")

        except Exception as e:
            logger.error(f"Error processing record {record_id}: {e}")


@celery_app.task(name="app.worker.run_analysis_job")
def run_analysis_job(user_id: str, job_type: Optional[str] = None):
    """
    Orchestrates the full analysis pipeline:
    1. Gather user files
    2. Create Context Cache (if not exists or expired - for MVP recreate)
    3. Run Prompt (Trends or Timeline)
    4. Save results
    5. Publish to Redis
    """

    logger.info(f"Starting {job_type or 'both'} analysis for user {user_id}")

    stream_service.publish_sync(
        f"user:{user_id}:status",
        {"status": "starting", "message": "Initiating AI Analysis..."},
    )

    with Session(engine) as db:
        user = db.get(User, user_id)
        records = user.records

        if not records:
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {"status": "error", "message": "No records to analyze"},
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
                {"status": "error", "message": "No text content found in records"},
            )
            return

        def run_trends():
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {"status": "trends_started", "message": "Analyzing trends..."},
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
                        "status": "trend_complete",
                        "message": "Trend analysis complete",
                        "data": {
                            "trends": analysis_data,
                            "trend_summary": trend_summary,
                        },
                    },
                )
            except Exception as e:
                logger.error(f"Trend analysis failed: {e}", exc_info=True)
                stream_service.publish_sync(
                    f"user:{user_id}:status",
                    {
                        "status": "trend_failed",
                        "message": f"Trend analysis failed: {str(e)}",
                    },
                )

        def run_timeline():
            stream_service.publish_sync(
                f"user:{user_id}:status",
                {"status": "timeline_started", "message": "Analyzing timeline..."},
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
                        "status": "timeline_complete",
                        "message": "Timeline analysis complete",
                        "data": {
                            "events": analysis_data,
                            "timeline_summary": timeline_summary,
                            "overall_summary": overall_summary,
                        },
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
                        "status": "timeline_failed",
                        "message": f"Timeline extraction failed: {str(e)}",
                    },
                )

        if job_type == "trends":
            run_trends()
        elif job_type == "timeline":
            run_timeline()
        else:
            thread_trends = threading.Thread(target=run_trends)
            thread_timeline = threading.Thread(target=run_timeline)
            thread_trends.start()
            thread_timeline.start()
            thread_trends.join()
            thread_timeline.join()
