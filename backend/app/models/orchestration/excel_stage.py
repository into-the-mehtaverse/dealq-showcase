"""
Pydantic models for the Excel Stage.

Defines the expected input and output data structures for the Excel generation stage.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ExcelStageInput(BaseModel):
    """Input for the Excel generation stage (called from get_model endpoint)."""

    # Property information (user-verified from frontend)
    property_name: Optional[str] = Field(None, description="Property name")
    address: Optional[str] = Field(None, description="Property address")
    zip_code: Optional[str] = Field(None, description="Property zip code")
    number_of_units: Optional[int] = Field(None, description="Number of units")
    year_built: Optional[int] = Field(None, description="Year built")
    parking_spaces: Optional[int] = Field(None, description="Parking spaces")
    gross_square_feet: Optional[int] = Field(None, description="Gross square feet")
    asking_price: Optional[int] = Field(None, description="Asking price")

    # Financial data (user-verified from frontend)
    revenue: Optional[float] = Field(None, description="Property revenue")
    expenses: Optional[float] = Field(None, description="Property expenses")

    # Structured data (user-verified from frontend)
    structured_t12: Optional[List[Dict[str, Any]]] = Field(None, description="Structured T12 data")
    structured_rent_roll: Optional[List[Dict[str, Any]]] = Field(None, description="Structured rent roll data")

    # Deal information
    deal_id: str = Field(..., description="ID of the deal to update")


class ExcelStageOutput(BaseModel):
    """Output from the Excel generation stage."""

    success: bool = Field(..., description="Whether Excel generation was successful")
    excel_file_url: Optional[str] = Field(None, description="URL to the generated Excel file")
    deal_id: str = Field(..., description="ID of the updated deal")
    error_message: Optional[str] = Field(None, description="Error message if generation failed")
