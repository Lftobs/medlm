from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "medlm_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker"],  # Explicitly include worker module with tasks
)

# celery_app.conf.task_routes = {
#     "app.worker.process_medical_record": "main-queue",
#     "app.worker.run_analysis_job": "main-queue",
# }

celery_app.conf.worker_pool = "solo"

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
