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
        combined_results = {"qdrant": [], "mem0": [], "document_summaries": []}

        try:
            logger.info(
                f"Searching Qdrant for user {user_id} with query: {query[:50]}..."
            )

            query_embedding = encode_texts([query])[0].tolist()

            qdrant_results = vector_service.hybrid_search(
                collection_name="clinical_records",
                query_text=query,
                query_vector=query_embedding,
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

    def add_memory(self, msg: str, user_id: str, metadata: dict | None = None):
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

            if isinstance(msg, list):
                if metadata is not None:
                    self._mem.add(msg, user_id=user_id, metadata=metadata)
                else:
                    self._mem.add(msg, user_id=user_id)
                logger.info("Added conversation memory to mem0")
                return

            if (
                isinstance(msg, str)
                and msg.startswith("User: ")
                and "\nAssistant: " in msg
            ):
                parts = msg.split("\nAssistant: ", 1)
                user_part = parts[0].replace("User: ", "")
                assistant_part = parts[1] if len(parts) > 1 else ""

                user_metadata = (metadata or {}).copy()
                user_metadata["type"] = "user_information"
                self._mem.add(
                    f"User reported: {user_part}",
                    user_id=user_id,
                    metadata=user_metadata,
                )

                if assistant_part:
                    advice_metadata = (metadata or {}).copy()
                    advice_metadata["type"] = "medical_advice"
                    advice_summary = f"Medical advice given: When user reported {user_part[:100]}, assistant advised: {assistant_part[:150]}"
                    self._mem.add(
                        advice_summary, user_id=user_id, metadata=advice_metadata
                    )

                logger.info("Added structured user info and medical advice to mem0")
            else:
                if metadata is not None:
                    self._mem.add(msg, user_id=user_id, metadata=metadata)
                else:
                    self._mem.add(msg, user_id=user_id)

            logger.info("Memory added to mem0 client")

        except Exception as e:
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
