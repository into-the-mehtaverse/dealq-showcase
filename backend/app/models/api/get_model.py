"""
API models for the get_model endpoint.

Defines the request and response models for the get_model endpoint that handles
user-verified data and returns Excel generation results.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class GetModelRequest(BaseModel):
    """Request model for the get_model endpoint."""

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


class GetModelResponse(BaseModel):
    """Response model for the get_model endpoint."""

    success: bool = Field(..., description="Whether Excel generation was successful")
    message: str = Field(..., description="Response message")
    excel_file_url: Optional[str] = Field(None, description="URL to the generated Excel file")
    deal_id: str = Field(..., description="ID of the updated deal")
    error_code: Optional[str] = Field(None, description="Error code if generation failed")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
