import logging
from app.core.config import settings
from sentence_transformers import SentenceTransformer


logger = logging.getLogger(__name__)
_embedding_model = None


def get_embedding_model():
    """Lazy load the embedding model on first access."""
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading embedding model...")
        _embedding_model = SentenceTransformer(
            settings.EMBEDDING_MODEL,
            trust_remote_code=True,
            device="cpu",
        )
        logger.info("Embedding model loaded successfully")
    return _embedding_model


def encode_texts(texts, **kwargs):
    """Encode texts using the lazy-loaded model."""
    model = get_embedding_model()
    safe_kwargs = {
        "show_progress_bar": False,
        "batch_size": 1,
        "normalize_embeddings": True,
        "convert_to_numpy": True,
        **kwargs,
    }
    return model.encode(texts, **safe_kwargs)


def cleanup_model():
    """Clean up the lazy-loaded model."""
    global _embedding_model
    if _embedding_model is not None:
        _embedding_model = None
        logger.info("Embedding model cleaned up")
