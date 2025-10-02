"""
Request Upload Stage

Handles the initial upload request phase where:
1. User submits file metadata
2. Backend generates pre-signed upload URLs
3. Creates deal record with status 'pending'
4. Creates upload record with status 'pending'
5. Creates upload_file records for each file with status 'pending'
6. Returns URLs and deal ID for frontend direct upload
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from app.services.db.service import DatabaseService
from app.services.storage.storage_service import StorageService
from app.core.supabase_client import get_supabase_client
from app.models.db.deals import DealCreate
from app.models.db.uploads import UploadCreate
from app.models.db.upload_files import UploadFileCreate


class FileMetadata(BaseModel):
    """File metadata from frontend request."""

    document_type: str = Field(..., description="Type of document (OM, T12, RR)")
    file_type: str = Field(..., description="File type (pdf, excel, etc.)")
    original_filename: str = Field(..., description="Original filename from user")


class RequestUploadInput(BaseModel):
    """Input for the request upload stage."""

    files: List[FileMetadata] = Field(..., description="List of files to be uploaded")
    user_id: str = Field(..., description="ID of the authenticated user")


class PresignedUploadInfo(BaseModel):
    """Information about a pre-signed upload URL."""

    document_type: str = Field(..., description="Type of document")
    file_type: str = Field(..., description="File type")
    original_filename: str = Field(..., description="Original filename")
    upload_url: str = Field(..., description="Pre-signed upload URL")
    file_path: str = Field(..., description="Target file path in storage")
    unique_filename: str = Field(..., description="Generated unique filename")


class RequestUploadOutput(BaseModel):
    """Output from the request upload stage."""

    deal_id: str = Field(..., description="ID of the created deal")
    upload_id: str = Field(..., description="ID of the created upload")
    upload_info: List[PresignedUploadInfo] = Field(..., description="Upload information for each file")
    message: str = Field(..., description="Success message")


class RequestUploadStage:
    """Stage for handling upload requests and generating pre-signed URLs."""

    def __init__(self):
        self.storage_service = StorageService()
        self.db_service = DatabaseService(get_supabase_client())

    async def process_request_upload(self, input_data: RequestUploadInput) -> RequestUploadOutput:
        """
        Process the upload request and generate pre-signed URLs.

        Args:
            input_data: File metadata and user information

        Returns:
            RequestUploadOutput: Deal ID, upload ID, and upload information
        """
        try:
            # Create deal record in database with status 'pending'
            deal_create = DealCreate(
                user_id=input_data.user_id,
                status="pending"  # Status while waiting for files to be uploaded
            )
            deal_record = self.db_service.deals_repo.create_deal(deal_create)
            deal_id = str(deal_record.id)

            # Create upload record in database with status 'pending'
            upload_create = UploadCreate(
                deal_id=deal_record.id,
                upload_name=f"Multi-file upload ({len(input_data.files)} files)",
                status="pending"  # Status while waiting for files to be uploaded
            )
            upload_record = self.db_service.uploads_repo.create_upload(upload_create)
            upload_id = str(upload_record.id)

            # Generate pre-signed upload URLs for each file
            upload_info_list = []

            for file_metadata in input_data.files:
                # Generate pre-signed upload URL
                presigned_result = self.storage_service.generate_presigned_upload_url(
                    document_type=file_metadata.document_type,
                    original_filename=file_metadata.original_filename,
                    file_type=file_metadata.file_type,
                    deal_id=deal_id
                )

                if not presigned_result["success"]:
                    raise Exception(f"Failed to generate presigned URL for {file_metadata.original_filename}: {presigned_result['error']}")

                # Create upload_file record in database with status 'pending'
                upload_file_create = UploadFileCreate(
                    upload_id=upload_record.id,
                    file_type=file_metadata.file_type,
                    filename=file_metadata.original_filename,
                    file_path=presigned_result["file_path"],  # Store the target file path
                    doc_type=file_metadata.document_type
                )
                self.db_service.upload_files_repo.create_upload_file(upload_file_create)

                # Create upload info for response
                upload_info = PresignedUploadInfo(
                    document_type=file_metadata.document_type,
                    file_type=file_metadata.file_type,
                    original_filename=file_metadata.original_filename,
                    upload_url=presigned_result["upload_url"],
                    file_path=presigned_result["file_path"],
                    unique_filename=presigned_result["unique_filename"]
                )

                upload_info_list.append(upload_info)

            return RequestUploadOutput(
                deal_id=deal_id,
                upload_id=upload_id,
                upload_info=upload_info_list,
                message="Upload URLs generated successfully. Upload files directly to storage using the provided URLs."
            )

        except Exception as e:
            raise Exception(f"Request upload failed: {str(e)}")


# Create singleton instance
request_upload_stage = RequestUploadStage()
