"""File storage service for managing uploaded medical files."""

import os
import uuid
from pathlib import Path
from typing import BinaryIO
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Service for managing file storage on the local filesystem."""

    def __init__(self, storage_dir: str = None):
        """
        Initialize the storage service.

        Args:
            storage_dir: Directory where files will be stored.
                        Defaults to settings.STORAGE_DIR
        """
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Storage service initialized with directory: {self.storage_dir}")

    def save_file(self, file: BinaryIO, filename: str, user_id: str) -> str:
        """
        Save a file to the storage directory.

        Args:
            file: File-like object to save
            filename: Original filename
            user_id: ID of the user uploading the file

        Returns:
            str: Storage key (path) where the file was saved
        """
        user_dir = self.storage_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        file_extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = user_dir / unique_filename

        with open(file_path, "wb") as f:
            content = file.read()
            f.write(content)

        storage_key = str(Path(str(user_id)) / unique_filename)
        logger.info(f"Saved file {filename} as {storage_key}")
        return storage_key

    def get_file_path(self, storage_key: str) -> Path:
        """
        Get the full file path from a storage key.

        Args:
            storage_key: The storage key returned by save_file

        Returns:
            Path: Full path to the file
        """
        file_path = self.storage_dir / storage_key
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            raise FileNotFoundError(f"File not found: {storage_key}")
        return file_path

    def delete_file(self, storage_key: str) -> bool:
        """
        Delete a file from storage.

        Args:
            storage_key: The storage key of the file to delete

        Returns:
            bool: True if file was deleted, False if it didn't exist
        """
        try:
            file_path = self.storage_dir / storage_key
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file: {storage_key}")
                return True
            else:
                logger.warning(f"File not found for deletion: {storage_key}")
                return False
        except Exception as e:
            logger.error(f"Error deleting file {storage_key}: {e}")
            raise


storage_service = StorageService()
