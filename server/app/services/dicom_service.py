import pydicom
from PIL import Image
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DicomService:
    def process_dicom(self, file_path: Path, output_dir: Path) -> Dict[str, Any]:
        """
        Read a DICOM file, extract metadata, and save a representative image.
        
        Args:
            file_path: Path to the .dcm file
            output_dir: Directory to save the extracted image
            
        Returns:
            Dictionary containing metadata and path to the extracted image
        """
        try:
            ds = pydicom.dcmread(file_path)
            
            # Extract basic metadata
            metadata = {
                "patient_id": str(ds.get("PatientID", "unknown")),
                "study_date": str(ds.get("StudyDate", "unknown")),
                "modality": str(ds.get("Modality", "unknown")),
                "description": str(ds.get("StudyDescription", "unknown")),
            }
            
            # Extract image
            pixel_array = ds.pixel_array
            
            # Normalize to 0-255
            if pixel_array.ndim == 2:
                # Grayscale
                image_2d = pixel_array.astype(float)
                image_2d = (np.maximum(image_2d, 0) / image_2d.max()) * 255.0
                image_2d = np.uint8(image_2d)
                img = Image.fromarray(image_2d)
            elif pixel_array.ndim == 3:
                # RGB or multi-frame. Take first frame if multi-frame.
                # Simplified: handling RGB
                if pixel_array.shape[0] < 50: # Likely frames
                     # Take middle frame or first
                    image_2d = pixel_array[0].astype(float)
                else: 
                     image_2d = pixel_array.astype(float)

                image_2d = (np.maximum(image_2d, 0) / image_2d.max()) * 255.0
                image_2d = np.uint8(image_2d)
                img = Image.fromarray(image_2d)
            else:
                 # Fallback
                 return {"metadata": metadata, "error": "Unsupported dimensions"}

            # Save JPEG
            image_name = f"{file_path.stem}.jpg"
            image_save_path = output_dir / image_name
            img.save(image_save_path)
            
            return {
                "metadata": metadata,
                "image_path": str(image_name) # Relative to user storage
            }
            
        except Exception as e:
            logger.error(f"Error processing DICOM {file_path}: {e}")
            raise e

dicom_service = DicomService()
