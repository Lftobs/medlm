from app.core.config import settings
from app.core.utils import get_embedding_model
from .llm.memory_service import memory_service
import logging
import threading
import asyncio

logger = logging.getLogger(__name__)


class LLMService:
    _lm = None
    _timeline_predictor = None
    _trend_predictor = None
    _embedding_model = None
    _chat_predictor = None
    _text_simplification_predictor = None
    _document_classifier_predictor = None
    _vital_signs_predictor = None
    _init_lock = threading.Lock()

    @classmethod
    def _initialize_dspy(cls):
        if cls._lm is None:
            with cls._init_lock:
                if cls._lm is None:
                    import dspy
                    from .llm.signatures import (
                        TimelineAnalysisSignature,
                        TrendAnalysisSignature,
                        ChatMedLm,
                        TextSimplificationSignature,
                        DocumentClassificationSignature,
                        VitalSignsAnalysisSignature,
                    )

                    cls._lm = dspy.LM(
                        model="gemini/gemini-2.5-flash",
                        api_key=settings.GEMINI_API_KEY,
                        temperature=0.3,
                        cache=True,
                    )
                    try:
                        dspy.configure(lm=cls._lm)
                        logger.info("DSPy configured with LM successfully")
                    except RuntimeError as e:
                        logger.debug(f"DSPy already configured: {e}")

                    cls._timeline_predictor = dspy.Predict(TimelineAnalysisSignature)
                    cls._trend_predictor = dspy.Predict(TrendAnalysisSignature)
                    cls._chat_predictor = dspy.ChainOfThought(ChatMedLm)
                    cls._text_simplification_predictor = dspy.Predict(
                        TextSimplificationSignature
                    )
                    cls._document_classifier_predictor = dspy.Predict(
                        DocumentClassificationSignature
                    )
                    cls._vital_signs_predictor = dspy.Predict(
                        VitalSignsAnalysisSignature
                    )

                    if cls._embedding_model is None:
                        cls._embedding_model = get_embedding_model()

    def __init__(self):
        self.memory_service = memory_service
        self._initialized = False

    def _ensure_initialized(self):
        if not self._initialized:
            logger.info("Lazy-loading LLM service...")
            self._initialize_dspy()
            self._initialized = True

    @classmethod
    def cleanup(cls):
        if cls._lm:
            logger.info("Cleaning up LLM service resources...")
            cls._lm = None
            cls._timeline_predictor = None
            cls._trend_predictor = None
            cls._chat_predictor = None
            cls._text_simplification_predictor = None
            cls._document_classifier_predictor = None
            cls._vital_signs_predictor = None

            logger.info("LLM service resources cleaned up")

    async def chat_medlm_async(
        self, user_id: str, message: str, user_context: dict = None
    ):
        """Async wrapper for chat_medlm that yields chunks as an async generator."""
        loop = asyncio.get_event_loop()
        queue = asyncio.Queue()

        def producer():
            try:
                # Iterate over the sync generator
                for chunk in self.chat_medlm(user_id, message, user_context):
                    loop.call_soon_threadsafe(queue.put_nowait, chunk)
                # Signal completion
                loop.call_soon_threadsafe(queue.put_nowait, None)
            except Exception as e:
                logger.error(f"Error in chat_medlm producer: {e}", exc_info=True)
                loop.call_soon_threadsafe(queue.put_nowait, e)

        # Run producer in a separate thread
        threading.Thread(target=producer, daemon=True).start()

        while True:
            # Wait for next chunk
            chunk = await queue.get()

            if chunk is None:
                # Completion sentinel
                break

            if isinstance(chunk, Exception):
                # Re-raise or yield error message
                yield f"I apologize, but I encountered an error: {str(chunk)}"
                break

            yield chunk

    def chat_medlm(self, user_id: str, message: str, user_context: dict = None):
        self._ensure_initialized()
        response_text = ""
        try:
            memory_results = self.memory_service.search_combined_memory(
                user_id, message
            )

            context = {
                "document_summaries": memory_results.get("document_summaries", []),
                "qdrant_results": memory_results.get("qdrant", []),
                "mem0_results": memory_results.get("mem0", []),
                "user_context": user_context or {},
            }

            formatted_context = self._format_context_for_chat(context)

            logger.info(
                f"Chat context prepared with {len(memory_results.get('document_summaries', []))} summaries, "
                f"{len(memory_results.get('qdrant', []))} Qdrant results and "
                f"{len(memory_results.get('mem0', []))} mem0 results"
            )

            import dspy

            with dspy.context(lm=self._lm):
                try:
                    prediction = self._chat_predictor(
                        context=formatted_context, user_input=message
                    )
                    response_text = prediction.response
                    conversation = [
                        {"role": "user", "content": message},
                        {"role": "assistant", "content": response_text},
                    ]
                    
                    logger.info("Chat completed. Attempting to save chat memory...")

                    self.memory_service.add_memory(
                        msg=[
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": response_text},
                        ],
                        user_id=user_id,
                        metadata={
                            "source": "chat_medlm",
                            "has_qdrant_context": len(memory_results.get("qdrant", [])) > 0,
                            "has_mem0_context": len(memory_results.get("mem0", [])) > 0,
                        },
                    )
                    
                    logger.info("Chat memory saved successfully")

                    chunk_size = 20
                    for i in range(0, len(response_text), chunk_size):
                        chunk = response_text[i : i + chunk_size]
                        yield chunk

                except Exception as e:
                    logger.error(f"Chat predictor failed: {e}", exc_info=True)
                    yield f"I apologize, but I encountered an error: {str(e)}"
                    return

            

        except Exception as e:
            logger.error(f"Error in chat_medlm: {e}", exc_info=True)
            yield f"I apologize, but I encountered an error: {str(e)}"

    def _format_context_for_chat(self, context: dict) -> dict:
        formatted = {
            "document_summaries": context.get("document_summaries", []),
            "clinical_records": [],
            "conversation_history": [],
            "additional_context": context.get("user_context", {}),
        }

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
        self._ensure_initialized()
        import dspy

        with dspy.context(lm=self._lm):
            prediction = self._trend_predictor(record_input=record_input)
        return prediction

    def extract_timeline(self, record_input: str):
        self._ensure_initialized()
        import dspy

        with dspy.context(lm=self._lm):
            prediction = self._timeline_predictor(record_input=record_input)
        return prediction

    def simplify_text(self, input_text: str):
        self._ensure_initialized()
        import dspy

        with dspy.context(lm=self._lm):
            prediction = self._text_simplification_predictor(input_text=input_text)
        return prediction

    def classify_and_summarize(self, document_text: str):
        self._ensure_initialized()
        import dspy

        with dspy.context(lm=self._lm):
            prediction = self._document_classifier_predictor(
                document_text=document_text
            )
        return prediction

    def analyze_vitals(self, input_data: str):
        self._ensure_initialized()
        import dspy

        with dspy.context(lm=self._lm):
            prediction = self._vital_signs_predictor(input_data=input_data)
        return prediction


llm_service = LLMService()
