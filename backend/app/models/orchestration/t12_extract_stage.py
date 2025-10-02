"""
Pydantic models for the T12 Extract Stage.

Defines the expected input and output data structures for the T12 extract stage.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class T12PageData(BaseModel):
    """Data for a single page in T12 PDF extraction."""

    page_number: int = Field(..., description="Page number (1-indexed)")
    text: str = Field(..., description="Extracted text from the page")
    text_length: int = Field(..., description="Length of extracted text")


class T12SheetData(BaseModel):
    """Data for a single sheet in T12 Excel extraction."""

    sheet_name: str = Field(..., description="Name of the Excel sheet")
    data: List[List[Any]] = Field(..., description="Extracted data from the sheet")
    rows: int = Field(..., description="Number of rows in the sheet")
    columns: int = Field(..., description="Number of columns in the sheet")


class T12ExtractionResult(BaseModel):
    """Result of T12 extraction with proper type safety."""

    file_type: str = Field(..., description="File type (pdf or excel)")
    document_type: str = Field(..., description="Document type (t12)")
    total_pages: Optional[int] = Field(None, description="Total pages (for PDF)")
    total_sheets: Optional[int] = Field(None, description="Total sheets (for Excel)")
    extracted_text: Optional[List[str]] = Field(None, description="Extracted text from each page (for PDF)")
    page_data: Optional[List[T12PageData]] = Field(None, description="Page metadata (for PDF)")
    sheets: Optional[List[T12SheetData]] = Field(None, description="Sheet data (for Excel)")
    plain_text: str = Field(..., description="Plain text version for structuring service")


class T12ExtractStageInput(BaseModel):
    """Input for the T12 extract stage."""
    t12_file_path: Optional[str] = Field(None, description="Private file path of the T12 file")
    om_classification: Optional[Dict[str, Any]] = Field(None, description="OM classification result if available")


class T12ExtractStageOutput(BaseModel):
    """Output from the T12 extract stage."""

    t12_extraction: Optional[T12ExtractionResult] = Field(None, description="Extracted T12 data")
    file_type: Optional[str] = Field(None, description="File type (pdf or excel)")
    extraction_success: bool = Field(..., description="Whether extraction was successful")
    error_message: Optional[str] = Field(None, description="Error message if extraction failed")
