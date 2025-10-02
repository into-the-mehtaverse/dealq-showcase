"""
Pydantic models for the Upload Stage.

Defines the expected input and output data structures for the upload stage.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class UploadFileData(BaseModel):
    """Input file data for upload stage."""

    file_data: bytes = Field(..., description="Raw file data")
    original_filename: str = Field(..., description="Original filename")
    document_type: str = Field(..., description="Document type (OM, T12, RR)")
    file_type: str = Field(..., description="File type (pdf, excel)")


class UploadedFileInfo(BaseModel):
    """Information about an uploaded file."""

    filename: str = Field(..., description="Original filename")
    document_type: str = Field(..., description="Type of document (OM, T12, RR)")
    file_type: str = Field(..., description="File type (pdf, excel)")
    file_url: str = Field(..., description="Signed URL of uploaded file")


class UploadStageInput(BaseModel):
    """Input for the upload stage."""

    files_data: List[UploadFileData] = Field(..., description="List of files to upload")
    user_id: str = Field(..., description="ID of the authenticated user")


class UploadStageOutput(BaseModel):
    """Output from the upload stage."""

    deal_id: str = Field(..., description="ID of the created deal")
    files: List[UploadedFileInfo] = Field(..., description="List of uploaded files")
    om_file_url: Optional[str] = Field(None, description="Private file path of OM file if uploaded")
    t12_file_url: Optional[str] = Field(None, description="Private file path of T12 file if uploaded")
    rent_roll_file_url: Optional[str] = Field(None, description="Private file path of rent roll file if uploaded")
