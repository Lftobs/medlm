from mem0 import MemoryClient
from app.core.config import settings
from app.services.vector_service import vector_service
from app.core.utils import encode_texts
import logging

logger = logging.getLogger(__name__)


class MemoryService:
    _mem = None
    _embedding_model = None

    @classmethod
    def _initialize_memory(cls):
        """Initialize memory client and embedding model (lazy initialization)."""
        if cls._mem is None:
            cls._mem = MemoryClient(api_key=settings.MEM_API_KEY)

    def __init__(self):
        self._initialized = False

    def _ensure_initialized(self):
        """Ensure memory client is initialized before use."""
        if not self._initialized:
            logger.info("Lazy-loading memory service...")
            self._initialize_memory()
            self._initialized = True

    def search_combined_memory(self, user_id: str, query: str, limit: int = 5) -> dict:
        """
        Search both Qdrant vector store and mem0 for relevant context.
        Returns combined results from both sources.

        Args:
            user_id: User identifier for filtering results
            query: Search query text
            limit: Maximum number of results from each source

        Returns:
            dict: Combined results with keys 'qdrant' and 'mem0'
        """
        self._ensure_initialized()
        combined_results = {"qdrant": [], "mem0": []}

        try:
            logger.info(
                f"Searching Qdrant for user {user_id} with query: {query[:50]}..."
            )

            query_embedding = encode_texts([query])[0].tolist()

            qdrant_results = vector_service.hybrid_search(
                collection_name="clinical_records",
                query_text=query,
                query_vector=query_embedding,
                # limit=limit,
            )

            for result in qdrant_results:
                combined_results["qdrant"].append(
                    {
                        "text": result.payload.get("text", ""),
                        "score": result.score,
                        "metadata": {
                            "record_id": result.payload.get("record_id"),
                            "user_id": result.payload.get("user_id"),
                            "chunk_index": result.payload.get("chunk_index"),
                            "file_name": result.payload.get("file_name"),
                        },
                    }
                )

            logger.info(f"Found {len(combined_results['qdrant'])} results from Qdrant")

        except Exception as e:
            logger.error(f"Qdrant search failed: {e}", exc_info=True)

        try:
            logger.info(f"Searching mem0 for user {user_id}...")

            mem0_results = self._search_memories(user_id, query, limit=limit)

            if mem0_results:
                for memory in mem0_results:
                    if isinstance(memory, dict):
                        combined_results["mem0"].append(
                            {
                                "memory": memory.get("memory", ""),
                                "score": memory.get("score", 0),
                                "metadata": memory.get("metadata", {}),
                            }
                        )
                    elif isinstance(memory, str):
                        combined_results["mem0"].append(
                            {
                                "memory": memory,
                                "score": 0.5,  # Default score for string memories
                                "metadata": {},
                            }
                        )

            logger.info(f"Found {len(combined_results['mem0'])} results from mem0")

        except Exception as e:
            logger.error(f"mem0 search failed: {e}", exc_info=True)

        return combined_results

    def _search_memories(self, user_id: str, query: str, limit: int = 5):
        """Get all memories for the user (not filtered by query)."""
        if not self._mem:
            return []
        try:
            if hasattr(self._mem, "get_all"):
                # Try get_all method if available
                return self._mem.get_all(user_id=user_id, limit=limit)
            elif hasattr(self._mem, "list"):
                # Try list method if available
                return self._mem.list(user_id=user_id, limit=limit)
            else:
                # Try search with different filter formats
                try:
                    # Try with user_id in filters
                    return self._mem.search(
                        "", filters={"user_id": user_id}, limit=limit
                    )
                except Exception:
                    try:
                        # Try with different filter format
                        return self._mem.search("", user_id=user_id, limit=limit)
                    except Exception:
                        try:
                            # Try without filters but with user_id parameter
                            return self._mem.search("", user_id=user_id, limit=limit)
                        except Exception:
                            # Last resort: try empty search without filters
                            return self._mem.search("", limit=limit)
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            return []

    def add_memory(self, msg: str, user_id: str, metadata: dict = None):
        """Add a new memory."""
        self._ensure_initialized()
        if not self._mem:
            return
        try:
            # mem0 expects: add(messages, user_id, metadata=None, **kwargs)
            # Convert metadata to proper format if needed
            if metadata:
                self._mem.add(msg, user_id=user_id, metadata=metadata)
            else:
                self._mem.add(msg, user_id=user_id)
        except Exception as e:
            logger.error(f"Memory add failed: {e}")
            # Don't re-raise to avoid breaking chat flow
            pass

    def update_memory(self, memory_id: str, text: str):
        """Update an existing memory."""
        self._ensure_initialized()
        if not self._mem:
            return
        try:
            self._mem.update(memory_id, text)
        except Exception:
            # logger.error(f"Memory update failed: {e}")
            pass

    def delete_memory(self, memory_id: str):
        """Delete a memory."""
        self._ensure_initialized()
        if not self._mem:
            return
        try:
            self._mem.delete(memory_id)
        except Exception:
            # logger.error(f"Memory delete failed: {e}")
            pass


memory_service = MemoryService()
