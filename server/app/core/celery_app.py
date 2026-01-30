from celery import Celery
from celery.signals import worker_process_shutdown, worker_shutdown
from app.core.config import settings
import logging
import gevent.monkey


logger = logging.getLogger(__name__)

celery_app = Celery(
    "medlm_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker"],
)

# celery_app.conf.task_routes = {
#     "app.worker.process_medical_record": "main-queue",
#     "app.worker.run_analysis_job": "main-queue",
# }

celery_app.conf.worker_pool = "prefork"
celery_app.conf.worker_concurrency = 4


celery_app.conf.update(
    worker_pool="prefork",
    worker_concurrency=4,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)



@worker_shutdown.connect
def cleanup_on_worker_shutdown(sender=None, **kwargs):
    """Clean up resources when Celery worker shuts down."""
    logger.info("Celery worker shutting down, cleaning up resources...")
    try:
        from app.core.utils import cleanup_model

        cleanup_model()
        logger.info("Successfully cleaned up model resources")
    except Exception as e:
        logger.error(f"Error during Celery worker cleanup: {e}")


@worker_process_shutdown.connect
def cleanup_on_process_shutdown(sender=None, **kwargs):
    """Clean up resources when worker process shuts down."""
    logger.info("Celery worker process shutting down...")
    try:
        from app.core.utils import cleanup_model

        cleanup_model()
        logger.info("Successfully cleaned up process resources")
    except Exception as e:
        logger.error(f"Error during process cleanup: {e}")
