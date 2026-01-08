from typing_extensions import Text
import fitz  # PyMuPDF
from pathlib import Path
import logging
from docx import Document

logger = logging.getLogger(__name__)


class TextExtractionService:
    @staticmethod
    def extract_text(file_path: Path) -> str:
        """
        Extract text from a PDF, TXT, or DOCX file.
        """
        suffix = file_path.suffix.lower()

        try:
            if suffix == ".pdf":
                return TextExtractionService._extract_from_pdf(file_path)
            elif suffix == ".txt":
                return TextExtractionService._extract_from_txt(file_path)
            elif suffix == ".docx":
                return TextExtractionService._extract_from_docx(file_path)
            else:
                raise ValueError(f"Unsupported file type: {suffix}")
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            raise e

    @staticmethod
    def _extract_from_pdf(file_path: Path) -> str:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    @staticmethod
    def _extract_from_txt(file_path: Path) -> str:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def _extract_from_docx(file_path: Path) -> str:
        doc = Document(file_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text


pdf_service = TextExtractionService()
