
import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Add server directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.llm.tool_read_record import ReadMedicalRecord
from app.models import MedicalRecord

class TestReadMedicalRecord(unittest.TestCase):
    def setUp(self):
        self.user_id = "test_user_123"
        self.tool = ReadMedicalRecord(user_id=self.user_id)

    @patch("app.services.llm.tool_read_record.Session")
    @patch("app.services.llm.tool_read_record.engine")
    @patch("app.services.llm.tool_read_record.storage_service")
    @patch("app.services.llm.tool_read_record.TextExtractionService")
    def test_call_success(self, MockTextExtract, MockStorage, MockEngine, MockSession):
        # Setup Mocks
        mock_db = MagicMock()
        MockSession.return_value.__enter__.return_value = mock_db
        
        # Mock DB finding a record
        mock_record = MagicMock(spec=MedicalRecord)
        mock_record.id = "record_123"
        mock_record.file_name = "test_report.pdf"
        mock_record.s3_key = "some/key/test.pdf"
        
        # Configure exec().first() to return our record
        # Note: sqlmodel's Session.exec() returns a Result, on which we call .first()
        mock_result = MagicMock()
        mock_result.first.return_value = mock_record
        mock_db.exec.return_value = mock_result

        # Mock Storage and Extraction
        MockStorage.get_file_path.return_value = Path("/tmp/fake_path")
        MockTextExtract.extract_text.return_value = "This is the content of the medical report."

        # Execute Tool
        result = self.tool("test_report.pdf")

        # Assertions
        self.assertIn("Content of test_report.pdf", result)
        self.assertIn("This is the content of the medical report", result)
        
        # Verify DB query was attempted (rough check)
        mock_db.exec.assert_called()
        MockStorage.get_file_path.assert_called_with("some/key/test.pdf")
        MockTextExtract.extract_text.assert_called_with(Path("/tmp/fake_path"))

    @patch("app.services.llm.tool_read_record.Session")
    @patch("app.services.llm.tool_read_record.engine")
    def test_record_not_found(self, MockEngine, MockSession):
        mock_db = MagicMock()
        MockSession.return_value.__enter__.return_value = mock_db
        
        # Mock DB returning None
        mock_result = MagicMock()
        mock_result.first.return_value = None
        mock_db.exec.return_value = mock_result

        # Execute Tool
        result = self.tool("nonexistent.pdf")

        # Assertions
        self.assertIn("Error: Could not find a medical record", result)

if __name__ == "__main__":
    unittest.main()
