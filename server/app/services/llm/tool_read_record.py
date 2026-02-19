import dspy
import logging
from uuid import UUID
from sqlmodel import Session, select
from app.core.db import engine
from app.models import MedicalRecord
from app.services.storage import storage_service
from app.services.extraction_service import TextExtractionService

logger = logging.getLogger(__name__)
class ReadMedicalRecord:
    """
    Tool to read the full content of a specific medical record file to answer detailed questions.
    Use this tool when you need to know exactly what a specific document says.
    """
    user_id: str

    def __init__(self, user_id: str):
        self.user_id = user_id

    def __call__(self, file_name_or_id: str) -> str:
        """
        Reads the full content of a specific medical record file to answer detailed questions.
        Use this tool when you need to know exactly what a specific document says.
        Args:
            file_name_or_id: The name of the file (e.g., "blood_test.pdf") or its record ID.
        """
        logger.info(f"Tool ReadMedicalRecord called for: {file_name_or_id}")
        
        record = None
        with Session(engine) as db:
            try:
                UUID(str(file_name_or_id))
                record = db.exec(
                    select(MedicalRecord).where(
                        MedicalRecord.id == file_name_or_id,
                        MedicalRecord.user_id == self.user_id
                    )
                ).first()
            except (ValueError, TypeError):
                pass
            if not record:
                record = db.exec(
                    select(MedicalRecord).where(
                        MedicalRecord.file_name.ilike(f"%{file_name_or_id}%"),
                        MedicalRecord.user_id == self.user_id
                    )
                ).first()
            
            if not record:
                return f"Error: Could not find a medical record matching '{file_name_or_id}' for this user."

            try:
                file_path = storage_service.get_file_path(record.s3_key)
                text = TextExtractionService.extract_text(file_path) # TODO: Change to use Attachment 
                
                if not text:
                    return "The document was found but contains no extractable text."
                
                return f"--- Content of {record.file_name} ---\n{text}"
            except Exception as e:
                logger.error(f"Error reading record in tool: {e}")
                return f"Error reading document content: {str(e)}"
