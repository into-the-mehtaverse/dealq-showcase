"""
Confirm Upload Stage

Handles the confirmation phase where:
1. Frontend confirms files have been uploaded successfully
2. Backend updates upload status to 'uploaded'
3. Returns confirmation result
"""

from typing import Optional
from pydantic import BaseModel, Field
from app.services.db.service import DatabaseService
from app.core.supabase_client import get_supabase_client


class ConfirmUploadInput(BaseModel):
    """Input for the confirm upload stage."""

    upload_id: str = Field(..., description="ID of the upload to confirm")
    deal_id: str = Field(..., description="ID of the deal associated with the upload")
    uploaded_successfully: bool = Field(..., description="Whether files were uploaded successfully")


class ConfirmUploadOutput(BaseModel):
    """Output from the confirm upload stage."""

    success: bool = Field(..., description="Whether the confirmation was successful")
    upload_id: str = Field(..., description="ID of the confirmed upload")
    message: str = Field(..., description="Confirmation message")


class ConfirmUploadStage:
    """Stage for confirming successful file uploads."""

    def __init__(self):
        self.db_service = DatabaseService(get_supabase_client())

    async def process_confirm_upload(self, input_data: ConfirmUploadInput) -> ConfirmUploadOutput:
        """
        Process the upload confirmation and update status.

        Args:
            input_data: Upload ID and confirmation status

        Returns:
            ConfirmUploadOutput: Confirmation result
        """
        try:
            # Update upload status to 'uploaded'

            if not input_data.uploaded_successfully:
                raise Exception("Upload failed. Please try again.")

            updated_upload = self.db_service.uploads_repo.update_upload_status(
                upload_id=input_data.upload_id,
                status="uploaded"
            )

            if not updated_upload:
                raise Exception(f"Failed to update upload {input_data.upload_id}")

            return ConfirmUploadOutput(
                success=True,
                upload_id=input_data.upload_id,
                message="Upload confirmed successfully. Files are ready for processing."
            )

        except Exception as e:
            raise Exception(f"Confirm upload failed: {str(e)}")


# Create singleton instance
confirm_upload_stage = ConfirmUploadStage()
