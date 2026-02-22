from pydantic.main import BaseModel
import dspy


class TimelineOutput(dspy.Signature):
    event_date: str = dspy.OutputField(
        desc="Date of the event in YYYY-MM-DD format. If exact date is unknown, use YYYY-MM or YYYY."
    )
    event: str = dspy.OutputField(
        desc="Concise description of the significant health event (e.g., 'Major hip replacement surgery', 'Diagnosed with Type 2 Diabetes')."
    )
    is_major: bool = dspy.OutputField(
        desc="True if the event had a significant, lasting impact on the patient's health or treatment plan."
    )
    citation: str | None = dspy.OutputField(
        desc="Direct quote or reference from the source document that validates this event."
    )


class TrendOutput(dspy.Signature):
    patient_tip: str = dspy.OutputField(
        desc="""Actionable, easy-to-understand advice for the patient to manage the observed trend.
        Use simple language. Example: 'Try to drink at least 2 liters of water daily to help with hydration levels.'""",
        max_length=500,
    )
    medical_team_tip: str = dspy.OutputField(
        desc="""Clinical suggestion for the healthcare provider regarding the observed trend.
        Example: 'Monitor renal function more closely due to slight but consistent creatinine increase.'""",
        max_length=500,
    )
    vital_signs_trends: list[str] = dspy.OutputField(
        desc="List of specific trends observed in vital signs or lab results. Example: ['Stable PCV at 20%', 'Resting heart rate decreased by 5 bpm over 6 months']."
    )
    vital_signs_trends_overview: str = dspy.OutputField(
        desc="A brief, high-level summary of the vital signs and lab trends (under 200 characters).",
        max_length=200,
    )
    event_dates: list[str] = dspy.OutputField(
        desc="List of dates (YYYY-MM-DD) corresponding to the data points where this trend was observed."
    )
    trend: str = dspy.OutputField(
        desc="Description of the overall trend pattern. Example: 'Gradual increase in systolic blood pressure by 10% over the last 3 months.'"
    )
    is_major: bool = dspy.OutputField(
        desc="True if this trend indicates a significant health risk or improvement."
    )
    citation: str | None = dspy.OutputField(
        desc="Direct quote or reference from the source document that validates this trend."
    )


class TimelineAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant.
    Your task is to analyze the user's clinical records to construct a precise, chronological timeline of their health history.
    Focus on identifying major medical events, surgeries, diagnoses, and significant changes in treatment.
    Always prioritize accuracy and cite the specific documents where information is found.
    """

    record_input: str = dspy.InputField(
        desc="The raw text content of the user's clinical records (notes, reports, etc.)."
    )
    overall_summary: str = dspy.OutputField(
        desc="A comprehensive narrative summary of the patient's overall clinical history based on the records."
    )
    result: list[TimelineOutput] = dspy.OutputField(
        desc="A structured list of chronological health events."
    )
    timeline_summary: str = dspy.OutputField(
        desc="A concise summary of the timeline findings, highlighting the most critical events.",
        max_length=500,
    )


class TrendAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant.
    Your task is to analyze the user's clinical records to detect subtle, invisible trends over time.
    Look for patterns that might be missed in individual visits, such as gradual declines in iron levels or slow increases in blood pressure.
    Provide actionable insights for both the patient and the medical team.
    """

    record_input: str = dspy.InputField(
        desc="The raw text content of the user's clinical records."
    )
    result: list[TrendOutput] = dspy.OutputField(
        desc="A list of identified trends with detailed analysis."
    )
    trend_summary: str = dspy.OutputField(
        desc="A summary of the most significant trends observed across the records."
    )


class MemoryQA(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant.
    Your task is to answer questions based strictly on the provided memory/history context.
    Maintain a professional yet empathetic tone.
    """

    user_input: str = dspy.InputField(desc="The question or query from the user.")
    response: str = dspy.OutputField(
        desc="A direct and accurate answer based on the context."
    )


class ChatMedLm(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant.
    Your task is to engage in a helpful conversation with the user about their health.

    IMPORTANT - Tool Usage Instructions:
    1. You have access to the ReadMedicalRecord tool which can read the FULL content of any medical document.
    2. The context contains document summaries and an 'available_files' list showing files you can read.
    3. When the user asks about specific medical information (medications, diagnoses, test results, etc.):
       - First check if any document summaries mention relevant information
       - If summaries suggest a document contains the answer, USE the ReadMedicalRecord tool to read that file
       - ALWAYS use the tool to get detailed information before saying "I don't have that information"
    4. NEVER say you don't have information about medications, diagnoses, or other medical details
       without first attempting to read the relevant documents using ReadMedicalRecord.
    5. When reading a file, use either the file_name (e.g., "clinical-note.pdf") or record_id from available_files.

    If users ask for meaning of some medical terms please provide them with the meanings and easy to understand explanations.
    Do not make up medical facts. Keep responses personalized, clear, and free of markdown formatting unless necessary for lists.
    """

    context: dict = dspy.InputField(
        desc="Structured context containing document summaries, available_files list, clinical records, and conversation history."
    )
    user_input: str = dspy.InputField(desc="The user's current message or question.")
    response: str = dspy.OutputField(
        desc="A personalized, medically accurate response to the user, based on tool results and context."
    )


class TextSimplificationSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant.
    Your task is to rewrite complex medical text into simple, plain English that a non-medical person can easily understand.
    Retain the core meaning and accuracy, but remove jargon and explain difficult concepts.
    """

    input_text: str = dspy.InputField(desc="The complex medical text to be simplified.")
    simplified: str = dspy.OutputField(
        desc="The simplified version of the text, suitable for a layperson."
    )


class VitalSignValue(dspy.Signature):
    date: str = dspy.OutputField(desc="Date the value was recorded (YYYY-MM-DD).")
    value: float = dspy.OutputField(
        desc="The numeric value of the vital sign or test result (up to 2 decimal places)."
    )


class VitalSignsAnalysis(dspy.Signature):
    """
    Structure for a single type of vital sign or lab test analysis.
    """

    test_name: str = dspy.OutputField(
        desc="Standardized name of the test or vital sign (e.g., 'Hemoglobin', 'Blood Pressure (Systolic)')."
    )
    data: list[dict] = dspy.OutputField(
        desc="A list of dictionaries containing 'date' and 'value' for this test. 'value' MUST be a number ONLY. Do not include units (e.g., use 120, not '120 mmHg')."
    )
    units: str = dspy.OutputField(
        desc="The units of measurement for this test base on the records (e.g., 'mg/dL', 'mmHg'). if the units are different in the records, use the most common unit ie(convert uncommon units to common units)."
    )
    observations: str = dspy.OutputField(
        desc="A concise, plain-English summary of the trends and clinical significance of these results, suitable for a layperson."
    )
    tips: str = dspy.OutputField(
        desc="A concise tip on how to improve the test result if it is not normal or if it is not in the normal range. (compare to the normal range from standard online sources if possible)"
    )


class VitalSignsAnalysisSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant.
    Your task is to extract quantitative vital signs and lab test results from the clinical text.
    Organize the data by test type and date to facilitate tracking over time.
    """

    input_data: str = dspy.InputField(
        desc="Raw text from patient clinical notes and lab reports containing vital signs data."
    )
    date: str = dspy.OutputField(
        desc="The date this analysis is being performed (YYYY-MM-DD)."
    )
    analysis: list[VitalSignsAnalysis] = dspy.OutputField(
        desc="A structured list of analyzed vital signs, grouped by test name."
    )


class DocumentClassificationSignature(dspy.Signature):
    """
    You are MedLM, an expert medical AI assistant.
    Your task is to analyze a medical document and classify it into a specific category.
    Also, provide a concise, high-quality summary of its contents.
    """

    document_text: str = dspy.InputField(
        desc="The extracted text content of the medical document."
    )
    category: str = dspy.OutputField(
        desc="The category of the document. Options: 'Lab Report', 'Clinical Note', 'Imaging Report', 'Prescription', 'Other'."
    )
    summary: str = dspy.OutputField(
        desc="A concise summary of the document's key information (diagnoses, results, plans), max 500 characters.",
        max_length=500,
    )
