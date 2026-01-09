import os
import logging
import threading
from typing import Optional
from sentence_transformers import SentenceTransformer
from app.core.config import settings

logger = logging.getLogger(__name__)


class ModelManager:
    """
    Singleton model manager to handle SentenceTransformer lifecycle properly.
    Ensures proper cleanup of parallel processing resources.
    """

    _instance: Optional["ModelManager"] = None
    _lock = threading.Lock()

    def __init__(self):
        self._model: Optional[SentenceTransformer] = None
        self._model_lock = threading.Lock()
        self._is_initialized = False

    @classmethod
    def get_instance(cls) -> "ModelManager":
        """Get singleton instance of ModelManager."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def initialize_model(self) -> None:
        """Initialize the SentenceTransformer model with proper settings."""
        if self._is_initialized:
            return

        with self._model_lock:
            if self._is_initialized:
                return

            logger.info(
                f"Loading SentenceTransformer model: {settings.EMBEDDING_MODEL}"
            )

            # Set environment variables to prevent parallel processing issues and resource leaks
            os.environ["TOKENIZERS_PARALLELISM"] = "false"
            os.environ["OMP_NUM_THREADS"] = "1"
            os.environ["OPENBLAS_NUM_THREADS"] = "1"
            os.environ["MKL_NUM_THREADS"] = "1"
            os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
            os.environ["NUMEXPR_NUM_THREADS"] = "1"
            os.environ["JOBLIB_MMAP_MODE"] = "r"
            os.environ["OMP_THREAD_LIMIT"] = "1"
            os.environ["MKL_THREADING_LAYER"] = "SEQUENTIAL"
            os.environ["PYTHONWARNINGS"] = "ignore::UserWarning"

            try:
                self._model = SentenceTransformer(
                    settings.EMBEDDING_MODEL,
                    trust_remote_code=True,
                    device="cpu",
                )

                # Warm up the model with a dummy encoding to initialize all resources
                _ = self._model.encode(["warmup text"], show_progress_bar=False)

                self._is_initialized = True
                logger.info("SentenceTransformer model loaded successfully")

            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer model: {e}")
                raise

    def get_model(self) -> SentenceTransformer:
        """Get the initialized model instance."""
        if not self._is_initialized:
            self.initialize_model()

        if self._model is None:
            raise RuntimeError("Model not initialized")

        return self._model

    def encode(self, texts, **kwargs) -> list:
        """
        Encode texts using the model with proper resource management.

        Args:
            texts: List of texts or single text to encode
            **kwargs: Additional arguments for model.encode()

        Returns:
            Encoded embeddings
        """
        model = self.get_model()

        # Set safe defaults to prevent resource leaks
        safe_kwargs = {
            "show_progress_bar": False,
            "batch_size": 1,  # Single batch to avoid parallel processing
            "normalize_embeddings": True,
            "convert_to_numpy": True,
            **kwargs,
        }

        try:
            embeddings = model.encode(texts, **safe_kwargs)
            return embeddings
        except Exception as e:
            logger.error(f"Error during encoding: {e}")
            raise

    def cleanup(self) -> None:
        """Clean up model resources and parallel processing pools."""
        if not self._is_initialized:
            return

        with self._model_lock:
            if self._model is not None:
                logger.info("Cleaning up SentenceTransformer resources...")

                # Release model reference first to allow GC to work effectively
                self._model = None
                self._is_initialized = False

                try:
                    # Force cleanup of multiprocessing resources
                    import multiprocessing as mp
                    import gc

                    # Clean up any remaining multiprocessing resources
                    try:
                        # Force cleanup of loky/joblib resources
                        loky_modules = []
                        try:
                            import loky

                            loky_modules.append(loky)
                        except ImportError:
                            pass

                        try:
                            from joblib.externals import loky as joblib_loky

                            loky_modules.append(joblib_loky)
                        except ImportError:
                            pass

                        for loky_mod in loky_modules:
                            try:
                                if hasattr(loky_mod, "get_reusable_executor"):
                                    executor = loky_mod.get_reusable_executor()
                                    if executor is not None:
                                        executor.shutdown(wait=True)
                            except Exception:
                                pass

                    except Exception:
                        pass

                    # Clean up joblib backends
                    try:
                        import joblib

                        # Try to terminate any active backends
                        if hasattr(joblib, "parallel"):
                            # Force cleanup of parallel execution contexts
                            if hasattr(joblib.parallel, "Parallel") and hasattr(
                                joblib.parallel.Parallel, "_backend"
                            ):
                                backend = joblib.parallel.Parallel._backend
                                if backend and hasattr(backend, "terminate"):
                                    backend.terminate()
                                joblib.parallel.Parallel._backend = None
                    except (ImportError, Exception):
                        pass

                    # Clean up any remaining semaphore objects
                    try:
                        # Force garbage collection to clean up leaked resources
                        gc.collect()

                        # Additional cleanup for multiprocessing trackers
                        if hasattr(mp, "resource_tracker"):
                            # Clear any tracked resources
                            if hasattr(mp.resource_tracker, "_resource_tracker"):
                                tracker = mp.resource_tracker._resource_tracker
                                if hasattr(tracker, "_registry"):
                                    # Clear registry to avoid false positives
                                    tracker._registry.clear()
                    except Exception:
                        pass

                except Exception as e:
                    logger.debug(f"Resource cleanup failed: {e}")

                try:
                    # Clean up any torch multiprocessing if available
                    import torch.multiprocessing as mp

                    if hasattr(mp, "get_context"):
                        ctx = mp.get_context()
                        if hasattr(ctx, "Pool"):
                            # Force cleanup of any remaining pools
                            pass
                except (ImportError, Exception) as e:
                    logger.debug(f"Torch multiprocessing cleanup not available: {e}")

                # Final garbage collection
                try:
                    gc.collect()
                except Exception:
                    pass

                logger.info("Model resources cleaned up successfully")

    def __del__(self):
        """Destructor to ensure cleanup happens."""
        try:
            self.cleanup()
        except Exception as e:
            logger.debug(f"Error during model manager cleanup: {e}")


# Global instance
model_manager = ModelManager()


def get_embedding_model() -> SentenceTransformer:
    """Get the global embedding model instance."""
    return model_manager.get_model()


def encode_texts(texts, **kwargs):
    """Encode texts using the global model manager."""
    return model_manager.encode(texts, **kwargs)


def cleanup_model():
    """Clean up the global model resources."""
    model_manager.cleanup()


class ModelContext:
    """Context manager for safe model usage in worker tasks."""

    def __init__(self):
        self.model = None

    def __enter__(self):
        """Enter context and get model instance."""
        try:
            self.model = get_embedding_model()
            return self.model
        except Exception as e:
            logger.error(f"Failed to get model in context: {e}")
            raise

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context and ensure cleanup."""
        try:
            # Force garbage collection of any temporary objects
            import gc

            gc.collect()

            if exc_type is not None:
                logger.error(
                    f"Exception in model context: {exc_type.__name__}: {exc_val}"
                )

        except Exception as e:
            logger.debug(f"Error during context cleanup: {e}")


def get_model_context():
    """Get a context manager for safe model usage."""
    return ModelContext()
