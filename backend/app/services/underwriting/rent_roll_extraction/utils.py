"""
Extraction Service Utilities

Helper functions for the extraction service including file validation,
path management, and data processing utilities.
"""

import os
import mimetypes
import logging
from typing import Dict, Any, List, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def validate_file_path(file_path: str) -> bool:
    """
    Validate that a file path exists and is accessible.
    Args:
        file_path: Path to the file to validate
    Returns:
        True if file exists and is accessible
    Raises:
        HTTPException: If file doesn't exist or is not accessible
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail=f"Path is not a file: {file_path}")

    if not os.access(file_path, os.R_OK):
        raise HTTPException(status_code=403, detail=f"File not readable: {file_path}")

    return True


def get_file_type(file_path: str) -> str:
    """
    Determine the file type based on file extension.
    Args:
        file_path: Path to the file
    Returns:
        File type ('pdf', 'excel', or 'unknown')
    """
    _, ext = os.path.splitext(file_path.lower())

    if ext in ['.pdf']:
        return 'pdf'
    elif ext in ['.xlsx', '.xls', '.xlsm']:
        return 'excel'
    else:
        return 'unknown'


def validate_file_type(file_path: str, expected_type: str) -> bool:
    """
    Validate that a file is of the expected type.
    Args:
        file_path: Path to the file
        expected_type: Expected file type ('pdf' or 'excel')
    Returns:
        True if file is of expected type
    Raises:
        HTTPException: If file type doesn't match expected type
    """
    actual_type = get_file_type(file_path)

    if actual_type != expected_type:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {expected_type} file, got {actual_type}: {file_path}"
        )

    return True


def clean_excel_data(sheet_data: List[List[Any]]) -> List[List[Any]]:
    """
    Clean Excel data by removing empty rows and normalizing cell values.
    Args:
        sheet_data: Raw sheet data from Excel
    Returns:
        Cleaned sheet data
    """
    cleaned_data = []

    for row in sheet_data:
        # Check if row has any non-empty, non-None values
        if any(cell is not None and str(cell).strip() for cell in row):
            # Clean each cell value
            cleaned_row = []
            for cell in row:
                if cell is None:
                    cleaned_row.append("")
                else:
                    # Convert to string and strip whitespace
                    cleaned_row.append(str(cell).strip())
            cleaned_data.append(cleaned_row)

    return cleaned_data


def extract_text_from_pdf_page(page) -> str:
    """
    Extract text from a PDF page with basic cleaning.
    Args:
        page: PyMuPDF page object
    Returns:
        Cleaned text from the page
    """
    text = page.get_text()

    # Basic text cleaning
    if text:
        # Remove excessive whitespace
        text = ' '.join(text.split())
        # Remove null characters
        text = text.replace('\x00', '')

    return text


def get_file_size_mb(file_path: str) -> float:
    """
    Get file size in megabytes.
    Args:
        file_path: Path to the file
    Returns:
        File size in MB
    """
    size_bytes = os.path.getsize(file_path)
    return size_bytes / (1024 * 1024)


def validate_file_size(file_path: str, max_size_mb: float = 50.0) -> bool:
    """
    Validate that a file is within size limits.
    Args:
        file_path: Path to the file
        max_size_mb: Maximum file size in MB
    Returns:
        True if file is within size limit
    Raises:
        HTTPException: If file is too large
    """
    file_size_mb = get_file_size_mb(file_path)

    if file_size_mb > max_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {file_size_mb:.2f}MB (max {max_size_mb}MB)"
        )

    return True


def create_extraction_metadata(file_path: str, document_type: str) -> Dict[str, Any]:
    """
    Create metadata for extraction results.
    Args:
        file_path: Path to the extracted file
        document_type: Type of document ('t12' or 'rent_roll')
    Returns:
        Dictionary containing extraction metadata
    """
    file_name = os.path.basename(file_path)
    file_size_mb = get_file_size_mb(file_path)
    file_type = get_file_type(file_path)

    return {
        "file_name": file_name,
        "file_path": file_path,
        "file_size_mb": file_size_mb,
        "file_type": file_type,
        "document_type": document_type,
        "extraction_timestamp": None  # Will be set by caller
    }


def convert_excel_data_to_enumerated_text(sheets_data: List[Dict[str, Any]]) -> str:
    """
    Convert Excel sheet data to text format with row numbers for LLM analysis.
    Args:
        sheets_data: List of sheet dictionaries with 'sheet_name' and 'data' keys
    Returns:
        Formatted text string with row numbers
    """
    text_parts = []

    for sheet in sheets_data:
        sheet_name = sheet.get("sheet_name", "")
        data = sheet.get("data", [])

        if data:
            text_parts.append(f"Sheet: {sheet_name}")
            # Add row numbers to help LLM track boundaries
            for row_index, row in enumerate(data, start=1):
                row_text = "\t".join(str(cell) for cell in row)
                text_parts.append(f"Row {row_index}: {row_text}")

    return "\n".join(text_parts)


def is_xml_security_error(error: Exception) -> bool:
    """
    Check if an exception indicates a potential XML security issue.
    Args:
        error: The exception that occurred during Excel parsing
    Returns:
        True if the error suggests XML security concerns
    """
    error_str = str(error).lower()

    # Common XML security indicators
    xml_security_indicators = [
        'xml', 'bomb', 'external', 'entity', 'dtd', 'doctype',
        'xxe', 'xml external entity', 'billion laughs', 'quadratic blowup'
    ]

    return any(indicator in error_str for indicator in xml_security_indicators)


def log_file_safety_status(file_path: str, is_safe: bool, error: Optional[Exception] = None) -> None:
    """
    Log the safety status of a file being processed.
    Args:
        file_path: Path to the file being processed
        is_safe: Whether the file is considered safe
        error: Optional error that occurred during processing
    """
    if is_safe:
        logger.info(f"Excel file parsed successfully - File is SAFE: {file_path}")
    else:
        error_msg = f" - Error: {error}" if error else ""
        logger.warning(f"Excel file may be UNSAFE: {file_path}{error_msg}")


def iter_rows_efficiently(sheet, max_consecutive_empty_rows: int = 20) -> List[List[Any]]:
    """
    Iterate through Excel sheet rows efficiently, stopping when hitting consecutive empty rows.
    Prevents memory bloat from files with bloated used ranges.

    Args:
        sheet: OpenPyXL sheet object
        max_consecutive_empty_rows: Maximum consecutive empty rows before stopping

    Returns:
        List of row data (excluding trailing empty rows)
    """
    rows_data = []
    consecutive_empty_count = 0

    for row in sheet.iter_rows(values_only=True):
        # Check if row is empty (all cells are None or empty strings)
        is_empty = all(cell is None or (isinstance(cell, str) and not cell.strip()) for cell in row)

        if is_empty:
            consecutive_empty_count += 1
            # Stop if we've hit too many consecutive empty rows
            if consecutive_empty_count >= max_consecutive_empty_rows:
                break
        else:
            # Reset counter when we find a non-empty row
            consecutive_empty_count = 0
            rows_data.append(row)

    return rows_data


def iter_columns_efficiently(sheet, max_consecutive_empty_cols: int = 10) -> List[List[Any]]:
    """
    Iterate through Excel sheet columns efficiently, stopping when hitting consecutive empty columns.
    Prevents memory bloat from files with bloated used ranges.

    Args:
        sheet: OpenPyXL sheet object
        max_consecutive_empty_cols: Maximum consecutive empty columns before stopping

    Returns:
        List of column data (excluding trailing empty columns)
    """
    # Get the maximum row and column dimensions
    max_row = sheet.max_row
    max_col = sheet.max_column

    columns_data = []
    consecutive_empty_count = 0

    for col_idx in range(1, max_col + 1):
        col_data = []
        has_data = False

        # Check each cell in the column
        for row_idx in range(1, max_row + 1):
            cell_value = sheet.cell(row=row_idx, column=col_idx).value
            if cell_value is not None and (not isinstance(cell_value, str) or cell_value.strip()):
                has_data = True
            col_data.append(cell_value)

        if has_data:
            consecutive_empty_count = 0
            columns_data.append(col_data)
        else:
            consecutive_empty_count += 1
            # Stop if we've hit too many consecutive empty columns
            if consecutive_empty_count >= max_consecutive_empty_cols:
                break

    return columns_data


def get_actual_data_bounds(sheet, max_consecutive_empty: int = 20) -> Dict[str, int]:
    """
    Determine the actual data boundaries of an Excel sheet, avoiding bloated used ranges.

    Args:
        sheet: OpenPyXL sheet object
        max_consecutive_empty: Maximum consecutive empty rows/columns before considering end of data

    Returns:
        Dictionary with actual data boundaries
    """
    rows_data = iter_rows_efficiently(sheet, max_consecutive_empty)
    cols_data = iter_columns_efficiently(sheet, max_consecutive_empty // 2)  # More lenient for columns

    return {
        "actual_rows": len(rows_data),
        "actual_columns": len(cols_data),
        "claimed_rows": sheet.max_row,
        "claimed_columns": sheet.max_column,
        "memory_saved": (sheet.max_row * sheet.max_column) - (len(rows_data) * len(cols_data))
    }
