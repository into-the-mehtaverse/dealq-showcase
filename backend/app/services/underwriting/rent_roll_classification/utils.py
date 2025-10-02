"""
Utility functions for rent roll classification boundary validation.
"""

from typing import List, Tuple, Dict, Any, Optional
import re


def extract_excel_boundary_context(
    text: str,
    start_row: int,
    end_row: int,
    context_rows: int = 5
) -> Dict[str, str]:
    """
    Extract boundary context for Excel files to validate classification results.

    Args:
        text: Raw text data from extraction service
        start_row: Claimed start row from first classification
        end_row: Claimed end row from first classification
        context_rows: Number of rows to include for context (default: 5)

    Returns:
        Dictionary with 'start_context' and 'end_context' for validation
    """
    if not text.strip():
        return {"start_context": "", "end_context": ""}

    # Split text into lines
    lines = text.split('\n')

    # Extract start boundary context (everything before and including start_row + context)
    start_end_idx = min(start_row + context_rows - 1, len(lines) - 1)
    start_context_lines = lines[:start_end_idx + 1]
    start_context = "\n".join(start_context_lines)

    # Extract end boundary context (end_row - context through everything after)
    end_start_idx = max(0, end_row - context_rows)
    end_context_lines = lines[end_start_idx:]
    end_context = "\n".join(end_context_lines)

    return {
        "start_context": start_context,
        "end_context": end_context
    }


def extract_pdf_boundary_context(
    text: str,
    start_offset: int,
    end_offset: int,
    context_chars: int = 500
) -> Dict[str, str]:
    """
    Extract boundary context for PDF files to validate classification results.

    Args:
        text: Raw text data from extraction service
        start_offset: Claimed start character offset from first classification
        end_offset: Claimed end character offset from first classification
        context_chars: Number of characters to include for context (default: 500)

    Returns:
        Dictionary with 'start_context' and 'end_context' for validation
    """
    if not text.strip():
        return {"start_context": "", "end_context": ""}

    text_length = len(text)

    # Extract start boundary context (everything before and including start_offset + context)
    start_end_idx = min(start_offset + context_chars, text_length)
    start_context = text[:start_end_idx]

    # Extract end boundary context (end_offset - context through everything after)
    end_start_idx = max(0, end_offset - context_chars)
    end_context = text[end_start_idx:]

    return {
        "start_context": start_context,
        "end_context": end_context
    }


def extract_full_boundary_context(
    text: str,
    boundaries: Dict[str, Any],
    file_type: str,
    context_rows: int = 5,
    context_chars: int = 500
) -> Dict[str, str]:
    """
    Extract full boundary context for comprehensive validation.

    Args:
        text: Raw text data from extraction service
        boundaries: Classification result from first pass
        file_type: Type of file ("pdf" or "excel")
        context_rows: Number of rows for Excel context (default: 5)
        context_chars: Number of characters for PDF context (default: 500)

    Returns:
        Dictionary with boundary context for validation
    """
    if file_type.lower() == "excel":
        start_row = boundaries.get("data_start_row", 1)
        end_row = boundaries.get("data_end_row", 1)
        return extract_excel_boundary_context(text, start_row, end_row, context_rows)

    elif file_type.lower() == "pdf":
        start_offset = boundaries.get("data_start_page", 1)  # We'll need to convert page to char offset
        end_offset = boundaries.get("data_end_page", 1)     # We'll need to convert page to char offset
        return extract_pdf_boundary_context(text, start_offset, end_offset, context_chars)

    else:
        raise ValueError(f"Unsupported file type: {file_type}")
