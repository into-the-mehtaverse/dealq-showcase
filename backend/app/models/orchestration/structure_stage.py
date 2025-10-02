"""
Pydantic models for the Structure Stage.

Defines the expected input and output data structures for the structure stage.
"""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

from app.models.domain.rr_classification import PDFRentRollPrecisionExtract, ExcelRentRollPrecisionExtract


class StructureStageInput(BaseModel):
    """Input for the structure stage."""

    rr_extraction: Optional[Union[PDFRentRollPrecisionExtract, ExcelRentRollPrecisionExtract]] = Field(
        None, description="RR precision extraction result"
    )
    t12_plain_text: Optional[str] = Field(None, description="T12 plain text for structuring")
    om_classification: Optional[Dict[str, Any]] = Field(None, description="OM classification result if available")


class StructureStageOutput(BaseModel):
    """Output from the structure stage."""

    structured_rent_roll: Optional[List[Dict[str, Any]]] = Field(None, description="Structured rent roll units")
    structured_t12: Optional[List[Dict[str, Any]]] = Field(None, description="Structured T12 data")
    structure_success: bool = Field(..., description="Whether structuring was successful")
    error_message: Optional[str] = Field(None, description="Error message if structuring failed")
