"""
Upload Stage

Handles file uploads to storage and creation of database records.
Returns deal ID and file URLs for further processing.
"""

import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

from app.models.db.deals import DealCreate
from app.models.db.uploads import UploadCreate
from app.models.db.upload_files import UploadFileCreate
from app.services.storage.storage_service import StorageService
from app.services.db.service import DatabaseService
from app.models.orchestration.upload_stage import UploadStageInput, UploadStageOutput, UploadFileData, UploadedFileInfo
from app.core.supabase_client import get_supabase_client
from app.orchestration._shared.file_utils import validate_document_type, validate_file_type, get_content_type
from app.orchestration._shared.error_utils import create_validation_error, create_file_upload_error, create_processing_error


class UploadStage:
    """Pipeline stage for handling file uploads and storage operations."""

    def __init__(
        self,
        storage_service: StorageService = None,
        db: DatabaseService = None,
        cache_service = None
    ):
        """Initialize the upload stage with services."""
        self.storage_service = storage_service or StorageService()
        self.db = db or DatabaseService(get_supabase_client())
        self.cache_service = cache_service

    def _get_folder_for_document_type(self, document_type: str) -> str:
        """
        Get the appropriate folder for a document type.

        Args:
            document_type: Type of document (OM, T12, RR)

        Returns:
            str: Folder name for the document type
        """
        folder_mapping = {
            "OM": "oms",
            "T12": "t12s",
            "RR": "rent_rolls"
        }
        return folder_mapping.get(document_type, "uploads")

    async def process_upload(
        self,
        input_data: UploadStageInput
    ) -> UploadStageOutput:
        """
        Process multi-file upload and storage.

        Args:
            input_data: UploadStageInput containing files_data and user_id

        Returns:
            UploadStageOutput containing deal_id and file URLs
        """
        try:
            # Validate input
            if not input_data.files_data or len(input_data.files_data) == 0:
                raise create_validation_error("files", "empty", ["at least one file"])

            # Create empty deal record
            deal_create = DealCreate(
                user_id=uuid.UUID(input_data.user_id),
                status="processing"
            )
            deal_record = self.db.deals_repo.create_deal(deal_create)

            # Create upload record
            upload_create = UploadCreate(
                deal_id=deal_record.id,
                upload_name=f"Multi-file upload ({len(input_data.files_data)} files)",
                status="processing"
            )
            upload_record = self.db.uploads_repo.create_upload(upload_create)

            uploaded_files = []
            om_file_path = None
            t12_file_path = None
            rent_roll_file_path = None

            # Process each file
            for file_data in input_data.files_data:
                # Validate document type
                if not validate_document_type(file_data.document_type):
                    raise create_validation_error("document_type", file_data.document_type, ["OM", "T12", "RR"])

                # Validate file type
                if not validate_file_type(file_data.file_type):
                    raise create_validation_error("file_type", file_data.file_type, ["pdf", "excel"])

                # Generate unique filename
                file_extension = os.path.splitext(file_data.original_filename)[1]
                unique_filename = f"{str(uuid.uuid4())}{file_extension}"

                # Determine content type based on file type
                content_type = get_content_type(file_data.file_type)

                # Get appropriate folder for document type
                folder = self._get_folder_for_document_type(file_data.document_type)

                # Upload to Supabase storage
                upload_result = self.storage_service.upload_file(
                    file_data=file_data.file_data,
                    folder=folder,
                    filename=unique_filename,
                    content_type=content_type
                )

                if not upload_result["success"]:
                    raise create_file_upload_error(file_data.original_filename, upload_result['error'])

                # Create upload file record
                upload_file_create = UploadFileCreate(
                    upload_id=upload_record.id,
                    file_type=file_data.file_type,
                    filename=file_data.original_filename,
                    file_path=upload_result["file_path"],  # Store private file path
                    doc_type=file_data.document_type
                )
                upload_file_record = self.db.upload_files_repo.create_upload_file(upload_file_create)

                # Add to uploaded files list
                uploaded_files.append(UploadedFileInfo(
                    filename=file_data.original_filename,
                    document_type=file_data.document_type,
                    file_type=file_data.file_type,
                    file_url=upload_result["signed_url"]  # Return signed URL for frontend
                ))

                # Track file paths for different document types
                if file_data.document_type == "OM" and file_data.file_type == "pdf":
                    om_file_path = upload_result["file_path"]
                elif file_data.document_type == "T12":
                    t12_file_path = upload_result["file_path"]
                elif file_data.document_type == "RR":
                    rent_roll_file_path = upload_result["file_path"]

            # Return UploadStageOutput
            return UploadStageOutput(
                deal_id=str(deal_record.id),
                files=uploaded_files,
                om_file_url=om_file_path,  # Store private file path for processing
                t12_file_url=t12_file_path,  # Store private file path for processing
                rent_roll_file_url=rent_roll_file_path  # Store private file path for processing
            )

        except HTTPException:
            raise
        except Exception as e:
            raise create_processing_error("Upload", e)
