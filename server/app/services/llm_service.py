import asyncio
import logging
import threading

from datetime import datetime
from app.core.config import settings
from .llm.memory_service import memory_service

logger = logging.getLogger(__name__)


class LLMService:
    _lm = None
    _timeline_predictor = None
    _trend_predictor = None
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
                        model="gemini/gemini-3-flash-preview",
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
    
        """
        Async generator for chat responses.
        """
        self._ensure_initialized()
        response_text = ""

        try:
            memory_results = await asyncio.to_thread(
                self.memory_service.search_combined_memory, user_id, message
            )

            context = {
                "document_summaries": memory_results.get("document_summaries", []),
                "mem0_results": memory_results.get("mem0", []),
                "user_context": user_context or {},
            }

            formatted_context = self._format_context_for_chat(context)

            logger.info(
                f"Chat context prepared with {len(memory_results.get('document_summaries', []))} summaries, "
            )

            from .llm.tool_read_record import ReadMedicalRecord
            from .llm.signatures import ChatMedLm
            import dspy

            read_tool = ReadMedicalRecord(user_id=user_id)

            react_agent = dspy.ReAct(ChatMedLm, tools=[read_tool])

            def run_agent():
                with dspy.context(lm=self._lm):
                    return react_agent(context=formatted_context, user_input=message)

            try:
                prediction = await asyncio.to_thread(run_agent)
                response_text = prediction.response
                msg = [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": response_text},
                ]
                metadata = {
                    "source": "chat_medlm",
                    "timestamp": datetime.now().isoformat(),
                }
                self.memory_service.add_memory(msg, user_id, metadata)
            except Exception as e:
                logger.error(f"Chat ReAct agent failed: {e}", exc_info=True)
                response_text = (
                    f"I apologize, but I encountered an error. Please try again"
                )
            yield response_text

        except Exception as e:
            logger.error(f"Error in chat_medlm_async: {e}", exc_info=True)
            yield f"I apologize, but I encountered an error: {str(e)}"

    def _format_context_for_chat(self, context: dict) -> dict:
        formatted = {
            "document_summaries": context.get("document_summaries", []),
            "available_files": [],
            "clinical_records": [],
            "conversation_history": [],
            "additional_context": context.get("user_context", {}),
        }

        for summary in context.get("document_summaries", []):
            formatted["available_files"].append(
                {
                    "file_name": summary.get("file_name", "Unknown"),
                    "record_id": summary.get("record_id", ""),
                    "category": summary.get("category", "Unknown"),
                    "summary_preview": summary.get("summary", "")[:200] + "..."
                    if len(summary.get("summary", "")) > 200
                    else summary.get("summary", ""),
                    "hint": "Use ReadMedicalRecord tool with file_name or record_id to read full content",
                }
            )

        for idx, memory in enumerate(context.get("mem0_results", []), 1):
            formatted["conversation_history"].append(
                {
                    "memory": memory.get("memory", ""),
                    "relevance": f"{memory.get('score', 0):.2f}",
                }
            )
        if formatted["available_files"] and not formatted["clinical_records"]:
            formatted["tool_usage_hint"] = (
                "NOTE: No clinical records were retrieved from vector search. "
                "However, document summaries and files are available. "
                "Use the ReadMedicalRecord tool to read any file listed in available_files "
                "to answer the user's question."
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
