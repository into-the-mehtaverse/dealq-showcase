"""
Rent roll structuring repository for chunking and concurrent LLM processing.
"""

from typing import Dict, Any, List, Optional, Union
from app.models.domain.rr_classification import (
    PDFRentRollClassification,
    ExcelRentRollClassification,
    PDFRentRollPrecisionExtract,
    ExcelRentRollPrecisionExtract
)


def chunk_rent_roll_data(
    precision_extraction: Union[PDFRentRollPrecisionExtract, ExcelRentRollPrecisionExtract],
    chunk_size: int = 5000,
    chunk_overlap: int = 500
) -> List[Dict[str, Any]]:
    """
    Chunk rent roll data for concurrent LLM processing.

    Args:
        precision_extraction: Data from precision extraction (Pydantic model)
        chunk_size: Maximum characters per chunk
        chunk_overlap: Character overlap between chunks

    Returns:
        List of chunks with metadata
    """
    if isinstance(precision_extraction, PDFRentRollPrecisionExtract):
        return _chunk_pdf_rent_roll_data(precision_extraction, chunk_size, chunk_overlap)
    elif isinstance(precision_extraction, ExcelRentRollPrecisionExtract):
        return _chunk_excel_rent_roll_data(precision_extraction, chunk_size, chunk_overlap)
    else:
        raise ValueError(f"Unsupported precision extraction type: {type(precision_extraction)}")


def _chunk_pdf_rent_roll_data(
    precision_extraction: PDFRentRollPrecisionExtract,
    chunk_size: int,
    chunk_overlap: int
) -> List[Dict[str, Any]]:
    """Chunk PDF rent roll data with page awareness and headers."""

    relevant_data = precision_extraction.relevant_data
    boundaries = precision_extraction.boundaries

    if not relevant_data:
        return []

    # Extract column headers from boundaries if available
    column_headers = boundaries.get("column_headers", [])
    header_context = f"COLUMN HEADERS: {' | '.join(column_headers)}\n\n" if column_headers else ""

    chunks = []
    current_chunk = []
    current_chunk_size = 0
    chunk_id = 0

    for page_index, page_content in enumerate(relevant_data):
        # Convert page content to text
        page_text = "\n".join(page_content)
        page_size = len(page_text)

        # Check if adding this page would exceed chunk size
        if current_chunk and (current_chunk_size + page_size) > chunk_size:
            # Finish current chunk with headers
            if current_chunk:
                chunk_content = header_context + '\n'.join(current_chunk)
                chunks.append({
                    "chunk_id": chunk_id,
                    "content": chunk_content,
                    "char_count": len(chunk_content),
                    "pages": [i + boundaries.get("start_page", 1) for i in range(len(current_chunk))],
                    "file_type": "pdf",
                    "column_headers": column_headers
                })
                chunk_id += 1

            # Start new chunk with current page
            current_chunk = [page_text]
            current_chunk_size = page_size
        else:
            # Add page to current chunk
            current_chunk.append(page_text)
            current_chunk_size += page_size

    # Add final chunk
    if current_chunk:
        chunk_content = header_context + '\n'.join(current_chunk)
        chunks.append({
            "chunk_id": chunk_id,
            "content": chunk_content,
            "char_count": len(chunk_content),
            "pages": [i + boundaries.get("start_page", 1) for i in range(len(current_chunk))],
            "file_type": "pdf",
            "column_headers": column_headers
        })

    return chunks


def _chunk_excel_rent_roll_data(
    precision_extraction: ExcelRentRollPrecisionExtract,
    chunk_size: int,
    chunk_overlap: int
) -> List[Dict[str, Any]]:
    """Chunk Excel rent roll data with row awareness and headers."""

    sheets = precision_extraction.sheets
    boundaries = precision_extraction.boundaries
    enumerated_text = precision_extraction.enumerated_text

    if not sheets or not enumerated_text:
        return []

    # Extract column headers from boundaries if available
    column_headers = boundaries.get("column_headers", [])
    header_context = f"COLUMN HEADERS: {' | '.join(column_headers)}\n\n" if column_headers else ""

    # Split text into lines to respect row boundaries
    lines = enumerated_text.split('\n')

    if not lines:
        return []

    chunks = []
    current_chunk_lines = []
    current_chunk_size = 0
    chunk_id = 0

    for line in lines:
        line_size = len(line) + 1  # +1 for newline character

        # Check if adding this line would exceed chunk size
        if current_chunk_lines and (current_chunk_size + line_size) > chunk_size:
            # Finish current chunk with headers
            if current_chunk_lines:
                chunk_content = header_context + '\n'.join(current_chunk_lines)
                chunks.append({
                    "chunk_id": chunk_id,
                    "content": chunk_content,
                    "char_count": len(chunk_content),
                    "sheets": [sheet.get("sheet_name", "Unknown") for sheet in sheets],
                    "file_type": "excel",
                    "column_headers": column_headers
                })
                chunk_id += 1

            # Start new chunk with current line
            current_chunk_lines = [line]
            current_chunk_size = line_size
        else:
            # Add line to current chunk
            current_chunk_lines.append(line)
            current_chunk_size += line_size

    # Add final chunk
    if current_chunk_lines:
        chunk_content = header_context + '\n'.join(current_chunk_lines)
        chunks.append({
            "chunk_id": chunk_id,
            "content": chunk_content,
            "char_count": len(chunk_content),
            "sheets": [sheet.get("sheet_name", "Unknown") for sheet in sheets],
            "file_type": "excel",
            "column_headers": column_headers
        })

    return chunks


def validate_chunks(chunks: List[Dict[str, Any]]) -> bool:
    """
    Validate that chunks are properly formed with headers.

    Args:
        chunks: List of chunks to validate

    Returns:
        True if chunks are valid, False otherwise
    """
    if not chunks:
        return False

    for chunk in chunks:
        required_keys = ["chunk_id", "content", "char_count", "file_type", "column_headers"]
        if not all(key in chunk for key in required_keys):
            return False

        if chunk["char_count"] <= 0:
            return False

        if chunk["file_type"] not in ["pdf", "excel"]:
            return False

        # Validate column_headers format
        if not isinstance(chunk["column_headers"], list):
            return False

    return True


def get_chunk_summary(chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Get summary statistics for chunks.

    Args:
        chunks: List of chunks

    Returns:
        Dictionary with chunk statistics
    """
    if not chunks:
        return {"total_chunks": 0, "total_chars": 0, "avg_chunk_size": 0}

    total_chars = sum(chunk["char_count"] for chunk in chunks)
    avg_chunk_size = total_chars / len(chunks)

    return {
        "total_chunks": len(chunks),
        "total_chars": total_chars,
        "avg_chunk_size": round(avg_chunk_size, 2),
        "min_chunk_size": min(chunk["char_count"] for chunk in chunks),
        "max_chunk_size": max(chunk["char_count"] for chunk in chunks)
    }
