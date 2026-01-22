from app.services.gemini_service import gemini_service
import logging
import json

logger = logging.getLogger(__name__)


class AIService:
    def analyze_trends(self, context_cache_name: str) -> list[str]:
        """
        Identify invisible trends using the cached context.
        """
        prompt = """
        Analyze the patient's entire medical history context.
        Identify specific, long-term, "invisible" trends that a doctor viewing single visits might miss.
        Focus on gradual changes in biomarkers, vital signs, or symptom recurrence over years.

        Return a simple list of trends. One trend per line.
        """

        try:
            result = gemini_service.generate_content(context_cache_name, prompt)
            trends = [
                line.strip()
                for line in result.split("\n")
                if line.strip() and not line.strip().startswith("Here")
            ]
            return trends
        except Exception as e:
            logger.error(f"AI Trend Analysis Failed: {e}")
            return ["Analysis could not be completed."]

    def extract_timeline(self, context_cache_name: str) -> list[dict]:
        """
        Extract structured timeline using the cached context.
        """
        prompt = """
        Extract a chronological timeline of ALL significant medical events from the history.
        Include Lab Results, Imaging Scans, Doctor Visits, and Procedures.

        Return valid JSON only. The output should be a list of objects with this schema:
        [
          {
            "date": "YYYY-MM-DD",
            "title": "Short generic title (e.g. Chest X-Ray)",
            "description": "Key findings or summary",
            "category": "Lab" | "Imaging" | "Visit" | "Procedure" | "Other"
          }
        ]
        Do not include markdown formatting like ```json. Just raw JSON.
        """

        try:
            result = gemini_service.generate_content(context_cache_name, prompt)
            cleaned_result = result.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_result)
        except Exception as e:
            logger.error(f"Timeline Extraction Failed: {e}")
            return []


ai_service = AIService()
