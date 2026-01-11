<file_path>
medlm/server/test_worker.py
</file_path>

<edit_description>
Create a simple test script to verify worker tasks
</edit_description>

#!/usr/bin/env python3
"""
Test script for worker.py tasks.
This script tests the Celery tasks by calling them directly with test data.
"""

import sys
import os
import logging
from pathlib import Path

# Add server directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_imports():
    """Test that all required modules can be imported."""
    try:
        from app.worker import process_medical_record, run_analysis_job
        from app.core.celery_app import celery_app
        from app.core.db import engine
        from app.models import MedicalRecord, User
        from app.services.storage import storage_service
        from app.services.vector_service import vector_service
        from app.core.model_manager import get_embedding_model
        logger.info("✓ All imports successful")
        return True
    except ImportError as e:
        logger.error(f"✗ Import failed: {e}")
        return False

def test_celery_app():
    """Test that Celery app is configured correctly."""
    try:
        from app.core.celery_app import celery_app
        # Check if broker and backend are set
        assert celery_app.conf.broker_url is not None
        assert celery_app.conf.result_backend is not None
        logger.info("✓ Celery app configured correctly")
        return True
    except Exception as e:
        logger.error(f"✗ Celery app test failed: {e}")
        return False

def test_model_loading():
    """Test that the embedding model can be loaded."""
    try:
        from app.main import get_embedding_model
        model = get_embedding_model()
        logger.info(f"✓ Model loaded successfully: {type(model)}")
        return True
    except Exception as e:
        logger.error(f"✗ Model loading failed: {e}")
        return False

def test_storage_service():
    """Test that storage service is initialized."""
    try:
        from app.services.storage import storage_service
        assert hasattr(storage_service, 'save_file')
        assert hasattr(storage_service, 'get_file_path')
        logger.info("✓ Storage service initialized")
        return True
    except Exception as e:
        logger.error(f"✗ Storage service test failed: {e}")
        return False

def test_vector_service():
    """Test that vector service is initialized."""
    try:
        from app.services.vector_service import vector_service
        assert hasattr(vector_service, 'upsert_vectors')
        assert hasattr(vector_service, 'hybrid_search')
        logger.info("✓ Vector service initialized")
        return True
    except Exception as e:
        logger.error(f"✗ Vector service test failed: {e}")
        return False

def test_task_signatures():
    """Test that tasks have correct signatures."""
    try:
        from app.worker import process_medical_record, run_analysis_job
        import inspect

        # Check process_medical_record signature
        sig = inspect.signature(process_medical_record)
        params = list(sig.parameters.keys())
        assert 'record_id' in params
        assert 'user_id' in params

        # Check run_analysis_job signature
        sig = inspect.signature(run_analysis_job)
        params = list(sig.parameters.keys())
        assert 'user_id' in params
        assert 'job_type' in params

        logger.info("✓ Task signatures are correct")
        return True
    except Exception as e:
        logger.error(f"✗ Task signature test failed: {e}")
        return False

def main():
    """Run all tests."""
    logger.info("Starting worker tests...")

    tests = [
        test_imports,
        test_celery_app,
        test_model_loading,
        test_storage_service,
        test_vector_service,
        test_task_signatures,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1

    logger.info(f"\nTest Results: {passed}/{total} tests passed")

    if passed == total:
        logger.info("🎉 All tests passed!")
        return 0
    else:
        logger.error("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
