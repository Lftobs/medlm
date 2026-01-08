from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    TextIndexParams,
    TokenizerType,
    PayloadSchemaType,
)
import numpy as np
import re
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorService:
    def __init__(self, url: str = None):
        if url is None:
            url = settings.QDRANT_URL
        self.client = QdrantClient(url=url)
        logger.info(f"Connecting to Qdrant at {url}")
        # self.create_collection("clinical_records", 1024)

    def create_collection(
        self,
        collection_name: str,
        vector_size: int = 1024,
        distance: Distance = Distance.COSINE,
    ):
        """
        Create a collection if it doesn't exist.
        """
        try:
            if not self.client.collection_exists(collection_name):
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=vector_size, distance=distance),
                )
                logger.info(f"Collection '{collection_name}' created.")

                # Create text index for hybrid search
                try:
                    self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name="text",
                        field_schema=PayloadSchemaType.TEXT,
                        text_index_params=TextIndexParams(
                            type="text",
                            tokenizer=TokenizerType.WORD,
                            min_token_len=2,
                            max_token_len=20,
                            lowercase=True,
                        ),
                    )
                    logger.info(f"Text index created for '{collection_name}'")
                except Exception as e:
                    logger.warning(f"Could not create text index: {e}")
            else:
                logger.info(f"Collection '{collection_name}' already exists.")
        except Exception as e:
            logger.error(f"Error creating collection '{collection_name}': {e}")
            raise e

    def upsert_vectors(
        self,
        collection_name: str,
        points: list,
    ):
        """
        Upsert multiple vectors with payload.
        """
        try:
            self.client.upsert(
                collection_name=collection_name,
                points=points,
            )
            logger.info(f"Upserted {len(points)} vectors into '{collection_name}'.")
        except Exception as e:
            logger.error(f"Error upserting vectors into '{collection_name}': {e}")
            raise e

    def search(
        self,
        collection_name: str,
        query_vector: list[float],
        limit: int = 5,
        score_threshold: float = None,
    ):
        """
        Search for similar vectors.
        """
        try:
            results = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                score_threshold=score_threshold,
            )
            return results.points
        except Exception as e:
            logger.error(f"Error searching in '{collection_name}': {e}")
            raise e

    def hybrid_search(
        self,
        collection_name: str,
        query_text: str,
        query_vector: list[float],
        limit: int = 5,
        score_threshold: float = None,
    ):
        """
        Perform hybrid search combining vector similarity and full-text search.
        Uses RRF (Reciprocal Rank Fusion) to merge results.
        """
        try:
            results = self.client.query_points(
                collection_name=collection_name,
                prefetch=[
                    # Vector similarity search
                    {
                        "query": query_vector,
                        "limit": limit * 2,  # Get more candidates for fusion
                    },
                    # Full-text search
                    {
                        "query": {
                            "text": {
                                "text": query_text,
                            }
                        },
                        "using": "text",
                        "limit": limit * 2,
                    },
                ],
                query={
                    "fusion": "rrf"  # Reciprocal Rank Fusion
                },
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
            )
            return results.points
        except Exception as e:
            logger.error(f"Error in hybrid search for '{collection_name}': {e}")
            # Fallback to vector-only search
            logger.info("Falling back to vector-only search")
            return self.search(collection_name, query_vector, limit, score_threshold)


def chunk_text(text, size=512, overlap=50):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + size
        chunks.append(" ".join(words[start:end]))
        start = end - overlap
    return chunks


def semantic_chunk_text(text, model, threshold=0.5, max_chunk_size=1000):
    """
    Chunk text semantically using sentence embeddings.

    Args:
        text (str): The input text.
        model: The SentenceTransformer model.
        threshold (float): Similarity threshold to determine boundaries. Lower = fewer splits.
        max_chunk_size (int): Max tokens/chars (approx) per chunk as hard limit.
    """
    # 1. Split into sentences
    # Simple split by punctuation usually works for medical text, avoiding complex NLTK dep for now
    sentences = re.split(r"(?<=[.!?])\s+", text)
    if not sentences:
        return []

    # 2. Encode sentences
    # model.encode returns numpy array of embeddings
    embeddings = model.encode(sentences, show_progress_bar=False)

    chunks = []
    current_chunk = []
    current_chunk_len = 0

    # 3. Iterate and group
    for i, sentence in enumerate(sentences):
        if not current_chunk:
            current_chunk.append(sentence)
            current_chunk_len += len(sentence)
            continue

        # Hard limit check
        if current_chunk_len + len(sentence) > max_chunk_size:
            chunk_to_add = " ".join(current_chunk)
            if len(chunk_to_add) >= 5:
                chunks.append(chunk_to_add)
            current_chunk = [sentence]
            current_chunk_len = len(sentence)
            continue

        prev_embedding = embeddings[i - 1]
        curr_embedding = embeddings[i]

        sim = np.dot(prev_embedding, curr_embedding) / (
            np.linalg.norm(prev_embedding) * np.linalg.norm(curr_embedding)
        )

        if sim < threshold:
            # Semantic shift detected, split
            chunk_to_add = " ".join(current_chunk)
            if len(chunk_to_add) >= 5:
                chunks.append(chunk_to_add)
            current_chunk = [sentence]
            current_chunk_len = len(sentence)
        else:
            current_chunk.append(sentence)
            current_chunk_len += len(sentence)

    if current_chunk:
        final_chunk = " ".join(current_chunk)
        if len(final_chunk) >= 5:
            chunks.append(final_chunk)

    return chunks


vector_service = VectorService()
