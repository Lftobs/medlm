from mem0 import MemoryClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class MemoryService:
    _mem = None
    _embedding_model = None

    @classmethod
    def _initialize_memory(cls):
        if cls._mem is None:
            if settings.MEM_API_KEY:
                try:
                    cls._mem = MemoryClient(api_key=settings.MEM_API_KEY)
                    logger.info("mem0 client initialized successfully")
                except Exception as e:
                    logger.error(f"Failed to initialize mem0 client: {e}")
            else:
                logger.warning("MEM_API_KEY not set. Memory features will be disabled.")

    def __init__(self):
        self._initialized = False

    def _ensure_initialized(self):
        """Ensure memory client is initialized before use."""
        if not self._initialized:
            logger.info("Lazy-loading memory service...")
            self._initialize_memory()
            self._initialized = True

    def _get_document_summaries(self, user_id: str):
        self._ensure_initialized()
        if not self._mem:
            logger.warning(
                "Attempted to get document summaries but mem0 is not initialized"
            )
            return []

        try:
            all_doc_memories = self._mem.get_all(
                filters={"user_id": user_id}, limit=100
            )

            if isinstance(all_doc_memories, dict) and "results" in all_doc_memories:
                all_doc_memories = all_doc_memories["results"]

            summaries = []
            for memory in all_doc_memories:
                if isinstance(memory, dict):
                    metadata = memory.get("metadata", {})
                    if metadata.get("source") == "document_analysis":
                        summaries.append(
                            {
                                "file_name": metadata.get("file_name"),
                                "category": metadata.get("category"),
                                "record_id": metadata.get("record_id"),
                                "summary": memory.get("memory", ""),
                            }
                        )

            logger.info(f"Retrieved {len(summaries)} document summaries from mem0")
            return summaries

        except Exception as e:
            logger.error(f"Failed to retrieve document summaries: {e}", exc_info=True)
            return []

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
        combined_results = {"mem0": [], "document_summaries": []}

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
                                "score": 0.5,
                                "metadata": {},
                            }
                        )

            logger.info(f"Found {len(combined_results['mem0'])} results from mem0")

        except Exception as e:
            logger.error(f"mem0 search failed: {e}", exc_info=True)

        try:
            combined_results["document_summaries"] = self._get_document_summaries(
                user_id
            )
        except Exception as e:
            logger.error(f"Document summary retrieval failed: {e}")

        return combined_results

    def _search_memories(self, user_id: str, query: str, limit: int = 5):
        if not self._mem:
            logger.warning("Attempted to search memories but mem0 is not initialized")
            return []
        try:
            try:
                search_result = self._mem.search(
                    query=query, filters={"user_id": user_id}, limit=limit
                )
                if isinstance(search_result, dict) and "results" in search_result:
                    logger.info(
                        f"Found {len(search_result['results'])} memories via semantic search"
                    )
                    return search_result["results"]
                elif isinstance(search_result, list):
                    logger.info(
                        f"Found {len(search_result)} memories via semantic search"
                    )
                    return search_result
            except Exception as search_error:
                logger.warning(
                    f"Semantic search failed, falling back to get_all: {search_error}"
                )

            result = self._mem.get_all(filters={"user_id": user_id}, limit=limit)
            if isinstance(result, dict) and "results" in result:
                logger.info(
                    f"Found {len(result['results'])} memories via get_all fallback"
                )
                return result["results"]
            return result
        except Exception as e:
            logger.error(f"Memory search failed: {e}", exc_info=True)
            return []

    def add_memory(self, msg: dict, user_id: str, metadata: dict | None = None):
        self._ensure_initialized()
        if not self._mem:
            logger.warning(
                "Attempted to add memory but mem0 is not initialized (check MEM_API_KEY)"
            )
            return

        try:
            logger.info(
                f"Adding memory to mem0 for user {user_id}. msg len: {len(msg)}"
            )
            self._mem.add(messages=msg, user_id=user_id, metadata=metadata)
            logger.info(
                "Added conversation memory to mem0 (converted to string format)"
            )
            return

        except Exception as e:
            print(e)
            logger.error(f"Memory add failed in service: {e}", exc_info=True)
            pass

    def update_memory(self, memory_id: str, text: str):
        """Update an existing memory."""
        self._ensure_initialized()
        if not self._mem:
            return
        try:
            self._mem.update(memory_id, text)
        except Exception:
            pass

    def delete_memory(self, memory_id: str):
        """Delete a memory."""
        self._ensure_initialized()
        if not self._mem:
            return
        try:
            self._mem.delete(memory_id)
        except Exception:
            pass


memory_service = MemoryService()
