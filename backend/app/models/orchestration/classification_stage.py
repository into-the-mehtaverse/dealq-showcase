"""
Pydantic models for the Classification Stage.

Defines the expected input and output data structures for the classification stage.
"""

from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID

from app.models.domain.underwriting import EnhancedClassificationResult


class ClassificationStageInput(BaseModel):
    """Input for the classification stage."""
    om_file_path: Optional[str] = Field(None, description="Private file path of the OM file, or None if no OM file")
    upload_id: Optional[UUID] = Field(None, description="ID of the upload record to associate generated files with")
    deal_id: Optional[UUID] = Field(None, description="ID of the deal to associate the classification with")
    om_upload_file_id: Optional[UUID] = Field(None, description="ID of the OM upload file record to associate the classification with")


class ClassificationStageOutput(BaseModel):
    """Output from the classification stage."""

    classification_result: Optional[EnhancedClassificationResult] = Field(None, description="Classification result or None if no OM file")
    description: Optional[str] = Field(None, description="Description of the property")
    market_description: Optional[str] = Field(None, description="Description of the market the property is in")
    image_path: Optional[str] = Field(None, description="Storage path to the extracted OM first page image, or None if no image was extracted")
