from pydantic.main import BaseModel
import dspy
from app.core.config import settings
from mem0 import MemoryClient


class TimelineOutput(BaseModel):
    date: str = dspy.OutputField(
        desc="Date the event analysis was conducted in the format YYYY-MM-DD"
    )
    event_date: str = dspy.OutputField(
        desc="Date of the event in the format YYYY-MM-DD."
    )
    event: str = dspy.OutputField(desc="Description of the event")
    is_major: bool = dspy.OutputField(desc="Whether the event is major")
    citation: str = dspy.OutputField(desc="Citation or reference to backup the event")


class TrendOutput(BaseModel):
    date: str = dspy.OutputField(
        desc="Date the trend analysis was conducted in the format YYYY-MM-DD"
    )
    event_date: list[str] = dspy.OutputField(
        desc="Dates of days the trend were observed in the format YYYY-MM-DD"
    )
    trend: str = dspy.OutputField(desc="Description of the trend")
    is_major: bool = dspy.OutputField(desc="Whether the event is major")
    citation: str = dspy.OutputField(desc="Citation or reference to backup the event")


class TimelineAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision.
    Always cite specific documents when possible.
    Your goal is to find invisible trends and construct a chronological/major health timeline.
    """

    record_input: str = dspy.InputField(desc="User's clinical records")
    result: list[TimelineOutput] = dspy.OutputField(
        desc="List of events and their dates"
    )


class TrendAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision.
    Always cite specific documents when possible.
    Your goal is to find invisible trends with precision within the clinical records.
    """

    record_input: str = dspy.InputField(desc="User's clinical records")
    result: list[TimelineOutput] = dspy.OutputField(
        desc="List of events and their dates"
    )


class MemoryQA(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision.
    Your role.
    Your goal is to find invisible trends with precision within the clinical records.
    """

    user_input: str = dspy.InputField()
    response: str = dspy.OutputField()


class LLMService:
    _lm = None
    _mem = None
    _timeline_predictor = None
    _trend_predictor = None

    @classmethod
    def _initialize_dspy(cls):
        """Initialize DSPy with OpenRouter configuration (lazy initialization)."""
        if cls._lm is None:
            cls._lm = dspy.LM(
                model="openrouter/z-ai/glm-4.5-air:free",
                api_key=settings.GEMINI_API_KEY,
                api_base="https://openrouter.ai/api/v1",
                extra_headers={
                    "HTTP-Referer": "https://sitelytics.app",
                    "X-Title": "Sitelytics",
                },
                temperature=0.3,
            )
            cls._timeline_predictor = dspy.Predict(TimelineAnalysisSignature)
            cls._trend_predictor = dspy.Predict(TrendAnalysisSignature)
        if cls._mem is None:
            cls._mem = MemoryClient(api_key=settings.MEM_API_KEY)

    def __init__(self):
        self._initialize_dspy()

    def _chat_mem_mgmt(self, message: str) -> str:
        return self._lm.chat(message)
