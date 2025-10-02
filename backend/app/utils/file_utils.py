# Save/load helpers, file cleanup

import os
import uuid
from pathlib import Path
from typing import Optional
import aiofiles
from fastapi import UploadFile, HTTPException

# Base directories
BASE_DIR = Path(__file__).parent.parent.parent
UPLOADS_DIR = BASE_DIR / "files" / "uploads"
OUTPUTS_DIR = BASE_DIR / "files" / "outputs"
SAMPLES_DIR = BASE_DIR / "files" / "samples"

def get_file_path(filename: str, directory: Path = UPLOADS_DIR) -> Path:
    """Get the full path for a file in the specified directory."""
    return directory / filename

def file_exists(filename: str, directory: Path = UPLOADS_DIR) -> bool:
    """Check if a file exists in the specified directory."""
    return get_file_path(filename, directory).exists()
