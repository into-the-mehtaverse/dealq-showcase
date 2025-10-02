from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class PDFRentRollClassification(BaseModel):
    """Classification result for PDF rent roll boundary analysis."""

    # Page-level boundaries
    data_start_page: int
    data_end_page: int

    # Content-level boundaries (for precision extraction)
    data_start_marker: Optional[str] = None  # e.g., "Unit 101", "Apt 1A"
    data_end_marker: Optional[str] = None    # e.g., "Unit Mix Summary", "Total Units"

    # Exclusion patterns to avoid
    exclude_patterns: List[str] = []  # e.g., ["Unit Mix", "Summary", "Total"]

    # Estimated unit count for validation
    estimated_units: Optional[int] = None

    # Confidence level
    confidence: str = "medium"  # "high", "medium", "low"

    # Column headers identified in the rent roll data
    column_headers: List[str] = []  # e.g., ["Unit", "Type", "Status", "Rent", "Lease Expiration"]


class ExcelRentRollClassification(BaseModel):
    """Classification result for Excel rent roll boundary analysis."""

    # Sheet-level boundaries
    data_sheet_name: str

    # Row-level boundaries
    data_start_row: int  # Skip headers
    data_end_row: int    # Stop before summaries

    # Column boundaries (if needed)
    data_start_column: Optional[str] = None
    data_end_column: Optional[str] = None

    # Exclusion patterns
    exclude_patterns: List[str] = []

    # Estimated unit count
    estimated_units: Optional[int] = None

    # Confidence level
    confidence: str = "medium"

    # Column headers identified in the rent roll data
    column_headers: List[str] = []  # e.g., ["Unit", "Type", "Status", "Size (SF)", "Rent", "Lease Expiration"]


class PDFRentRollPrecisionExtract(BaseModel):
    """Precision extraction result for PDF rent roll data."""

    file_type: str = "pdf"
    document_type: str = "rent_roll"
    total_pages: int
    relevant_data: List[List[str]]  # List of pages, each page is a list of lines
    boundaries: Dict[str, Any] = {
        "start_page": int,
        "end_page": int,
        "start_marker": Optional[str],
        "end_marker": Optional[str]
    }


class ExcelRentRollPrecisionExtract(BaseModel):
    """Precision extraction result for Excel rent roll data."""

    file_type: str = "excel"
    document_type: str = "rent_roll"
    sheets: List[Dict[str, Any]]  # List of relevant sheets with data
    total_sheets: int
    enumerated_text: str  # Converted text for LLM processing
    boundaries: Dict[str, Any] = {
        "sheet_name": str,
        "start_row": int,
        "end_row": int,
        "start_column": Optional[str],
        "end_column": Optional[str]
    }
