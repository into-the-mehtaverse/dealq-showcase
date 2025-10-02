"""
Pydantic models for the RR Extract Stage.

Defines the expected input and output data structures for the RR extract stage.
"""

from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field

from app.models.domain.rr_classification import PDFRentRollPrecisionExtract, ExcelRentRollPrecisionExtract


class RRExtractStageInput(BaseModel):
    """Input for the RR extract stage."""
    rr_file_path: Optional[str] = Field(None, description="Private file path of the rent roll file")
    om_classification: Optional[Dict[str, Any]] = Field(None, description="OM classification result if available")


class RRExtractStageOutput(BaseModel):
    """Output from the RR extract stage."""

    rr_extraction: Optional[Union[PDFRentRollPrecisionExtract, ExcelRentRollPrecisionExtract]] = Field(
        None,
        description="Precision extraction result for rent roll data"
    )
    file_type: Optional[str] = Field(None, description="File type (pdf or excel)")
    extraction_success: bool = Field(..., description="Whether extraction was successful")
    error_message: Optional[str] = Field(None, description="Error message if extraction failed")
