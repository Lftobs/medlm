from this import d
from pydantic.main import BaseModel
import dspy


class TimelineOutput(dspy.Signature):
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


class TrendOutput(dspy.Signature):
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
    vital_signs_trends: list[str] = dspy.OutputField(
        desc="List of vital signs and lab tests/reports trends observed. eg stable pvc of 20%, bpm dropped by 2%"
    )
    vital_signs_trends_overview: str = dspy.OutputField(
        desc="Overview of vital signs and lab tests/results trends observed (less than 100 characters)",
        max_length=200,
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
    response: str = dspy.OutputField(
        desc="Clean personalized response with no markdown content."
    )


class TextSimplificationSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Your task is to simplify complex medical text
    so that it can be easily understood by laypeople (non-medical professionals).
    Use simple language, avoid medical jargon, explain terms when necessary, and maintain accuracy.
    """

    input_text: str = dspy.InputField(desc="The complex medical text to simplify")
    simplified: str = dspy.OutputField(
        desc="Simplified version of the text so a layman can understand"
    )


class record(dspy.Signature):
    date: str = dspy.OutputField(
        desc="Date of the the record value was taken in yyyy-mm-dd. it should be gotten from the patient's medical record."
    )
    value: float = dspy.OutputField(desc="Value of the record in 2 decimal places")


class VitalSignsAnalysis(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Your task is to analyze vital signs data.
    """

    test_name: str = dspy.OutputField(
        desc="Name of the test analyzed eg PCV, Blood pressure, Cholesterol levels etc"
    )
    data: list[dict] = dspy.OutputField(
        desc="a list of dict of date and the value from labs/notes"
    )


class VitalSignsAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant. Your task is to analyze vital signs data.
    """

    input_data: dict = dspy.InputField(
        desc="Vital signs data from patient clinical notes and lab reports"
    )
    date: str = dspy.OutputField(
        desc="Date the analysis was done in yyyy-mm-dd ie the day you analyze this data"
    )
    analysis: list[VitalSignsAnalysis] = dspy.OutputField(
        desc="Analysis of the vital signs data"
    )
