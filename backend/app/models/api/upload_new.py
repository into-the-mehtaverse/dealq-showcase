# Upload API models for the new v1 upload endpoint

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Union, Dict



class APIUploadRequest(BaseModel):
    """Request model for the new v1 upload endpoint."""
    # This model represents the form data structure sent from frontend
    # The actual files and metadata are handled in the endpoint
    # This is primarily for documentation and validation purposes
    file_count: int = Field(..., description="Total number of files being uploaded")

    # Note: Individual file fields (file_0, file_1, etc.) and their metadata
    # (document_type_0, file_type_0, etc.) are handled directly in the endpoint
    # as they come from FormData


class APIUploadResponse(BaseModel):
    """Response model for the upload API endpoint."""
    success: bool = Field(..., description="Whether the upload was successful")
    message: str = Field(..., description="Response message")
    deal_id: str = Field(..., description="ID of the created deal")
    files: List[Dict[str, str]] = Field(..., description="List of uploaded files with metadata")
    om_file_url: Optional[str] = Field(None, description="Signed URL to the OM PDF file")
    t12_file_url: Optional[str] = Field(None, description="Signed URL to the T12 file (if available)")
    rent_roll_file_url: Optional[str] = Field(None, description="Signed URL to the rent roll file (if available)")
    property_info: Optional[Dict[str, Any]] = Field(None, description="Property information from OM classification")
    structured_t12: Optional[Union[List[Any], Dict[str, Any]]] = Field(None, description="Structured T12 data")
    structured_rent_roll: Optional[Union[List[Any], Dict[str, Any]]] = Field(None, description="Structured rent roll data")
    classification_result: Optional[Dict[str, Any]] = Field(None, description="OM classification result")
    error_code: Optional[str] = Field(None, description="Error code if upload failed")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
