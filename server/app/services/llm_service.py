from pydantic.main import BaseModel
import dspy
from app.core.config import settings
from mem0 import MemoryClient
from app.services.vector_service import vector_service
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)


class TimelineOutput(BaseModel):
    event_date: str = dspy.OutputField(
        desc="Date of the event in the format YYYY-MM-DD."
    )
    event: str = dspy.OutputField(
        desc="Description of the event eg major hip surgery in 2023"
    )
    is_major: bool = dspy.OutputField(desc="Whether the event is major")
    citation: str | None = dspy.OutputField(
        desc="Citation or reference to backup the event"
    )


class TrendOutput(BaseModel):
    patient_tip: str = dspy.OutputField(
        desc="""Tip or suggestion to mitigate/manage unhealthy trend patterns
        ...this should be actionable and easy to understand tips for the patients eg drinking atleast 5 liters of water daily,
        regular follow up with medication and checkup, reduce salt intake, exercise regularly etc
        """,
        max_length=500,
    )
    medical_team_tip: str = dspy.OutputField(
        desc="""Tip or suggestion to mitigate/manage unhealthy trend patterns
        ...this should be actionable tips for the medical team
        """,
        max_length=500,
    )
    event_dates: list[str] = dspy.OutputField(
        desc="List of dates of days the trend were observed in the format YYYY-MM-DD"
    )
    trend: str = dspy.OutputField(
        desc="Description of the trend eg increase in blood pressure by 10% over 3 months"
    )
    is_major: bool = dspy.OutputField(desc="Whether the event is major")
    citation: str | None = dspy.OutputField(
        desc="Citation or reference to backup the event"
    )


class TimelineAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision.
    Always cite specific documents when possible.
    Your goal is to find invisible trends and construct a chronological/major health timeline.
    (e.g. Major hip replacement surgery in 2020, New diagnosis of diabetes in 2022)
    """

    record_input: str = dspy.InputField(desc="User's clinical records")
    overall_summary: str = dspy.OutputField(
        desc="Summary of the overall clinical record"
    )
    result: list[TimelineOutput] = dspy.OutputField(
        desc="List of events and their dates"
    )
    timeline_summary: str = dspy.OutputField(
        desc="Summary of the timeline ie  the result", max_length=500
    )


class TrendAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision.
    Always cite specific documents when possible.
    Your goal is to find invisible trends with precision within the clinical records.
    (e.g., "Your iron levels have been dropping by 2% every year for 5 years,
    which your previous doctors missed because each individual test was within the 'normal' range.")
    """

    record_input: str = dspy.InputField(desc="User's clinical records")
    result: list[TrendOutput] = dspy.OutputField(desc="List of events and their dates")
    trend_summary: str = dspy.OutputField(
        desc="Summary of observations from the trend (ie the result)"
    )


class MemoryQA(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision.
    Your role.
    Your goal is to find invisible trends with precision within the clinical records.
    """

    user_input: str = dspy.InputField()
    response: str = dspy.OutputField()


class ChatMedLm(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision.
    Your role.
    Your goal is to find invisible trends with precision within the clinical records.
    """

    context: dict = dspy.InputField(
        desc="Necessary information needed to answer the question"
    )
    user_input: str = dspy.InputField()
    response: str = dspy.OutputField()


class LLMService:
    _lm = None
    _mem = None
    _timeline_predictor = None
    _trend_predictor = None
    _embedding_model = None
    _chat_predictor = None

    @classmethod
    def _initialize_dspy(cls):
        """Initialize DSPy with OpenRouter configuration (lazy initialization)."""
        if cls._lm is None:
            cls._lm = dspy.LM(
                model="gemini/gemini-2.5-flash",
                api_key=settings.GEMINI_API_KEY,
                temperature=0.3,
                cache=True,
            )
            cls._timeline_predictor = dspy.Predict(TimelineAnalysisSignature)
            cls._trend_predictor = dspy.Predict(TrendAnalysisSignature)
            cls._chat_predictor = dspy.ChainOfThought(ChatMedLm)
        if cls._mem is None:
            cls._mem = MemoryClient(api_key=settings.MEM_API_KEY)
        if cls._embedding_model is None:
            cls._embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        dspy.configure(lm=cls._lm)

    def __init__(self):
        self._initialize_dspy()

    def chat_medlm(self, user_id: str, message: str, user_context: dict = None):
        """
        Stream chat responses using DSPy with combined memory context from Qdrant and mem0.

        Args:
            user_id: User identifier
            message: User's chat message
            user_context: Optional additional context (e.g., current page, selected records)

        Yields:
            String chunks of the response
        """
        try:
            # Get combined memories from Qdrant and mem0
            memory_results = self._chat_mem(user_id, message)

            # Build context dictionary
            context = {
                "qdrant_results": memory_results.get("qdrant", []),
                "mem0_results": memory_results.get("mem0", []),
                "user_context": user_context or {},
            }

            # Format context for better readability
            formatted_context = self._format_context_for_chat(context)

            logger.info(
                f"Chat context prepared with {len(memory_results.get('qdrant', []))} Qdrant results and {len(memory_results.get('mem0', []))} mem0 results"
            )

            # Use DSPy streaming prediction
            # Note: DSPy doesn't natively support streaming, so we'll generate the full response
            # and then stream it character by character or in chunks
            prediction = self._chat_predictor(
                context=formatted_context, user_input=message
            )

            print(prediction)

            # Stream the response in chunks
            response_text = prediction.response
            chunk_size = 50  # Characters per chunk

            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i : i + chunk_size]
                yield chunk

            # Store the conversation in memory for future reference
            self._add_memory(
                user_id=user_id,
                text=f"User: {message}\nMedLM: {response_text}",
                metadata={
                    "source": "chat_medlm",
                    "has_qdrant_context": len(memory_results.get("qdrant", [])) > 0,
                    "has_mem0_context": len(memory_results.get("mem0", [])) > 0,
                },
            )

        except Exception as e:
            logger.error(f"Error in chat_medlm: {e}", exc_info=True)
            yield f"I apologize, but I encountered an error: {str(e)}"

    def _chat_mem(self, user_id: str, query: str, limit: int = 5) -> dict:
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
        combined_results = {"qdrant": [], "mem0": []}

        try:
            # Search Qdrant using hybrid search (vector + full-text)
            logger.info(
                f"Searching Qdrant for user {user_id} with query: {query[:50]}..."
            )

            # Generate embedding for the query
            query_embedding = self._embedding_model.encode(query).tolist()

            # Perform hybrid search on Qdrant
            qdrant_results = vector_service.hybrid_search(
                collection_name="clinical_records",
                query_text=query,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=0.5,  # Adjust threshold as needed
            )

            # Format Qdrant results
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
            # Search mem0 for conversation history and insights
            logger.info(f"Searching mem0 for user {user_id}...")

            mem0_results = self._search_memories(user_id, query, limit=limit)

            # Format mem0 results
            if mem0_results:
                for memory in mem0_results:
                    combined_results["mem0"].append(
                        {
                            "memory": memory.get("memory", ""),
                            "score": memory.get("score", 0),
                            "metadata": memory.get("metadata", {}),
                        }
                    )

            logger.info(f"Found {len(combined_results['mem0'])} results from mem0")

        except Exception as e:
            logger.error(f"mem0 search failed: {e}", exc_info=True)

        return combined_results

    def _format_context_for_chat(self, context: dict) -> dict:
        """
        Format the combined context for better readability in chat.

        Args:
            context: Dict with qdrant_results, mem0_results, and user_context

        Returns:
            Formatted context dict
        """
        formatted = {
            "clinical_records": [],
            "conversation_history": [],
            "additional_context": context.get("user_context", {}),
        }

        print(formatted, "[formatted]")

        # Format Qdrant results (clinical records)
        for idx, result in enumerate(context.get("qdrant_results", []), 1):
            formatted["clinical_records"].append(
                {
                    "source": f"Record {idx}",
                    "content": result.get("text", ""),
                    "relevance": f"{result.get('score', 0):.2f}",
                    "file": result.get("metadata", {}).get("file_name", "Unknown"),
                }
            )

        # Format mem0 results (conversation history)
        for idx, memory in enumerate(context.get("mem0_results", []), 1):
            formatted["conversation_history"].append(
                {
                    "memory": memory.get("memory", ""),
                    "relevance": f"{memory.get('score', 0):.2f}",
                }
            )

        return formatted

    def analyze_trends(self, record_input: str):
        """Analyze trends from the clinical records."""
        prediction = self._trend_predictor(record_input=record_input)
        return prediction

    def extract_timeline(self, record_input: str):
        """Extract timeline from the clinical records."""
        prediction = self._timeline_predictor(record_input=record_input)
        return prediction

    def _search_memories(self, user_id: str, query: str, limit: int = 5):
        """Search for relevant memories using mem0."""
        if not self._mem:
            return []
        try:
            return self._mem.search(query, user_id=user_id, limit=limit)
        except Exception as e:
            # logger.error(f"Memory search failed: {e}")
            return []

    def _add_memory(self, user_id: str, text: str, metadata: dict = None):
        """Add a new memory."""
        if not self._mem:
            return
        try:
            self._mem.add(text, user_id=user_id, metadata=metadata)
        except Exception as e:
            # logger.error(f"Memory add failed: {e}")
            pass

    def _update_memory(self, memory_id: str, text: str):
        """Update an existing memory."""
        if not self._mem:
            return
        try:
            self._mem.update(memory_id, text)
        except Exception as e:
            # logger.error(f"Memory update failed: {e}")
            pass

    def _delete_memory(self, memory_id: str):
        """Delete a memory."""
        if not self._mem:
            return
        try:
            self._mem.delete(memory_id)
        except Exception as e:
            # logger.error(f"Memory delete failed: {e}")
            pass


llm_service = LLMService()
