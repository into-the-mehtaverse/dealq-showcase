"""
Shared file utilities for orchestration stages.

This module contains common file handling operations used across multiple
orchestration stages including file downloads, cleanup, and type detection.
"""

import os
import tempfile
from typing import Optional
from app.services.storage.storage_service import StorageService


async def download_file_from_storage(file_path: str, storage_service: StorageService) -> Optional[str]:
    """
    Download a file from storage to a temporary local path.

    Args:
        file_path: Private bucket path of the file in storage (e.g., "oms/filename.pdf")
        storage_service: Storage service instance

    Returns:
        Local file path if successful, None if failed
    """
    try:
        # Create temporary file with appropriate extension
        file_extension = get_file_extension(file_path)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        temp_file_path = temp_file.name
        temp_file.close()

        # Download file from storage using private bucket path
        download_result = storage_service.download_file(file_path)

        if download_result.get("success"):
            # Write the downloaded data to the temporary file
            with open(temp_file_path, 'wb') as f:
                f.write(download_result["data"])
            print(f"Downloaded {len(download_result['data'])} bytes")
            return temp_file_path
        else:
            print(f"Download failed: {download_result.get('error', 'Unknown error')}")
            return None

    except Exception as e:
        print(f"Download error: {str(e)}")
        return None


def cleanup_temp_file(file_path: str) -> None:
    """
    Clean up a temporary file safely.

    Args:
        file_path: Path to the temporary file to remove
    """
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Failed to cleanup temp file {file_path}: {str(e)}")
            # Ignore cleanup errors - they're not critical


def get_file_extension(file_path: str) -> str:
    """
    Extract file extension from a file path or URL.

    Args:
        file_path: File path or URL

    Returns:
        File extension including the dot (e.g., '.pdf', '.xlsx')
    """
    return os.path.splitext(file_path)[1]


def determine_file_type_from_extension(file_path: str) -> str:
    """
    Determine file type from file extension.

    Args:
        file_path: File path or URL

    Returns:
        File type ('pdf' or 'excel')

    Raises:
        ValueError: If file type is not supported
    """
    file_extension = get_file_extension(file_path).lower()

    if file_extension in ['.pdf']:
        return "pdf"
    elif file_extension in ['.xlsx', '.xls', '.xlsm']:
        return "excel"
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")


def get_content_type(file_type: str) -> str:
    """
    Get content type for a given file type.

    Args:
        file_type: File type ('pdf' or 'excel')

    Returns:
        Content type string
    """
    if file_type == "pdf":
        return "application/pdf"
    elif file_type == "excel":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def validate_file_type(file_type: str) -> bool:
    """
    Validate if a file type is supported.

    Args:
        file_type: File type to validate

    Returns:
        True if supported, False otherwise
    """
    return file_type in ["pdf", "excel"]


def validate_document_type(document_type: str) -> bool:
    """
    Validate if a document type is supported.

    Args:
        document_type: Document type to validate

    Returns:
        True if supported, False otherwise
    """
    return document_type in ["OM", "T12", "RR"]
