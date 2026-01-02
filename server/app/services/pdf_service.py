import fitz  # PyMuPDF
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class PDFService:
    def extract_text(self, file_path: Path) -> str:
        """
        Extract text from a PDF file.
        """
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {e}")
            raise e

pdf_service = PDFService()
