from celery import Celery
from .config import settings

celery_app = Celery(
    "medlm_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.task_routes = {
    "app.worker.process_medical_record": "main-queue",
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Load tasks from worker module
celery_app.autodiscover_tasks(["app.worker"], force=True)
