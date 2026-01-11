from app.core.config import settings
from app.core.utils import get_embedding_model
from .llm.memory_service import memory_service
import logging
import threading

logger = logging.getLogger(__name__)


class LLMService:
    _lm = None
    _timeline_predictor = None
    _trend_predictor = None
    _embedding_model = None
    _chat_predictor = None
    _text_simplification_predictor = None
    _init_lock = threading.Lock()
    _dspy_configured = False

    @classmethod
    def _initialize_dspy(cls):
        """Initialize DSPy with OpenRouter configuration (lazy initialization)."""
        with cls._init_lock:
            if cls._lm is None:
                import dspy
                from .llm.signatures import (
                    TimelineAnalysisSignature,
                    TrendAnalysisSignature,
                    ChatMedLm,
                    TextSimplificationSignature,
                )

                cls._lm = dspy.LM(
                    model="gemini/gemini-2.5-flash",
                    api_key=settings.GEMINI_API_KEY,
                    temperature=0.3,
                    cache=True,
                )
                cls._timeline_predictor = dspy.Predict(TimelineAnalysisSignature)
                cls._trend_predictor = dspy.Predict(TrendAnalysisSignature)
                cls._chat_predictor = dspy.ChainOfThought(ChatMedLm)
                cls._text_simplification_predictor = dspy.ChainOfThought(
                    TextSimplificationSignature
                )
            if cls._embedding_model is None:
                cls._embedding_model = get_embedding_model()

            if not cls._dspy_configured:
                try:
                    import dspy

                    dspy.configure(lm=cls._lm)
                    cls._dspy_configured = True
                except RuntimeError:
                    logger.debug("DSPy already configured by another thread")
                    cls._dspy_configured = True

    def __init__(self):
        self.memory_service = memory_service
        self._initialized = False

    def _ensure_initialized(self):
        """Ensure DSPy is initialized before use."""
        if not self._initialized:
            logger.info("Lazy-loading LLM service...")
            self._initialize_dspy()
            self._initialized = True

    @classmethod
    def cleanup(cls):
        """Cleanup resources to prevent event loop errors on shutdown."""
        if cls._lm:
            logger.info("Cleaning up LLM service resources...")
            cls._lm = None
            cls._timeline_predictor = None
            cls._trend_predictor = None
            cls._chat_predictor = None
            cls._text_simplification_predictor = None

            logger.info("LLM service resources cleaned up")

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
        self._ensure_initialized()
        try:
            memory_results = self.memory_service.search_combined_memory(
                user_id, message
            )

            context = {
                "qdrant_results": memory_results.get("qdrant", []),
                "mem0_results": memory_results.get("mem0", []),
                "user_context": user_context or {},
            }

            formatted_context = self._format_context_for_chat(context)

            print(formatted_context, "formatted")

            logger.info(
                f"Chat context prepared with {len(memory_results.get('qdrant', []))} Qdrant results and {len(memory_results.get('mem0', []))} mem0 results"
            )

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

            # Convert conversation to string format for mem0
            conversation_text = f"User: {message}\nAssistant: {response_text}"
            self.memory_service.add_memory(
                msg=conversation_text,
                user_id=user_id,
                metadata={
                    "source": "chat_medlm",
                    "has_qdrant_context": len(memory_results.get("qdrant", [])) > 0,
                    "has_mem0_context": len(memory_results.get("mem0", [])) > 0,
                },
            )

        except Exception as e:
            logger.error(f"Error in chat_medlm: {e}", exc_info=True)
            yield f"I apologize, but I encountered an error: {str(e)}"

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

        for idx, result in enumerate(context.get("qdrant_results", []), 1):
            formatted["clinical_records"].append(
                {
                    "source": f"Record {idx}",
                    "content": result.get("text", ""),
                    "relevance": f"{result.get('score', 0):.2f}",
                    "file": result.get("metadata", {}).get("file_name", "Unknown"),
                }
            )

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
        self._ensure_initialized()
        prediction = self._trend_predictor(record_input=record_input)
        return prediction

    def extract_timeline(self, record_input: str):
        """Extract timeline from the clinical records."""
        self._ensure_initialized()
        prediction = self._timeline_predictor(record_input=record_input)
        return prediction

    def simplify_text(self, input_text: str):
        """Simplify complex medical text for layman understanding."""
        self._ensure_initialized()
        prediction = self._text_simplification_predictor(input_text=input_text)
        return prediction


llm_service = LLMService()
