"""
Upload API utilities for parsing and validating multi-file upload requests.
"""

from typing import List, Dict, Any
from fastapi import HTTPException


async def parse_multi_file_request(form_data) -> List[Dict[str, Any]]:
    """
    Parse multi-file upload request from form data.

    Args:
        form_data: FormData object from FastAPI request

    Returns:
        List of dictionaries containing file data and metadata

    Raises:
        HTTPException: If validation fails
    """
    # Extract file count
    file_count_str = form_data.get("file_count")
    if not file_count_str:
        raise HTTPException(status_code=400, detail="file_count is required")

    try:
        file_count = int(file_count_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="file_count must be a valid integer")

    # Validate file count
    if file_count <= 0:
        raise HTTPException(status_code=400, detail="file_count must be greater than 0")

    # Process each file
    files_data = []

    for i in range(file_count):
        # Get file data
        file_key = f"file_{i}"
        file = form_data.get(file_key)

        if not file:
            raise HTTPException(status_code=400, detail=f"File {i} is missing")

        # Get metadata
        document_type_key = f"document_type_{i}"
        file_type_key = f"file_type_{i}"

        document_type = form_data.get(document_type_key)
        file_type = form_data.get(file_type_key)

        if not document_type:
            raise HTTPException(status_code=400, detail=f"document_type_{i} is missing")

        if not file_type:
            raise HTTPException(status_code=400, detail=f"file_type_{i} is missing")

        # Validate document type
        if document_type not in ["OM", "T12", "RR"]:
            raise HTTPException(status_code=400, detail=f"Invalid document_type: {document_type}. Must be OM, T12, or RR")

        # Validate file type
        if file_type not in ["pdf", "excel"]:
            raise HTTPException(status_code=400, detail=f"Invalid file_type: {file_type}. Must be pdf or excel")

        # Read file data
        file_data = await file.read()

        if not file_data:
            raise HTTPException(status_code=400, detail=f"File {i} is empty")

        # Add to files_data list
        files_data.append({
            "file_data": file_data,
            "original_filename": file.filename,
            "document_type": document_type,
            "file_type": file_type
        })

    return files_data
