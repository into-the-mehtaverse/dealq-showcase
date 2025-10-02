"""Storage service for handling file operations with Supabase storage."""

import os
import uuid
import json
import tempfile
from typing import Optional, BinaryIO, Dict, Any, Tuple
from pathlib import Path
from supabase import Client
from fastapi import HTTPException

from app.core.supabase_client import get_supabase_client, get_storage_config


class StorageService:
    """Service for handling file uploads and downloads to/from Supabase storage."""

    def __init__(self):
        self.client: Client = get_supabase_client()
        self.config = get_storage_config()
        self.bucket_name = self.config["bucket_name"]
        self.storage_url = self.config["storage_url"]

    def upload_file(
        self,
        file_data: bytes,
        folder: str,
        filename: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> dict:
        """
        Upload a file to Supabase storage.

        Args:
            file_data: Binary file data to upload
            folder: Folder within the bucket (oms, rent_rolls, t12s, model_outputs)
            filename: Optional filename. If not provided, generates a unique name
            content_type: Optional content type for the file

        Returns:
            dict: Upload result with file path and signed URL

        Raises:
            Exception: If upload fails
        """
        try:
            # Generate unique filename if not provided
            if not filename:
                filename = str(uuid.uuid4())

            # Construct the file path within the bucket
            file_path = f"{folder}/{filename}"

            # Upload the file
            response = self.client.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_data,
                file_options={
                    "content-type": content_type or "application/octet-stream",
                    "cache-control": "31536000"
                }
            )

            # Generate signed URL for frontend access
            signed_url = self.get_signed_url(file_path)

            return {
                "success": True,
                "file_path": file_path,
                "signed_url": signed_url,
                "filename": filename
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get_signed_url(self, file_path: str, expires_in: int = 186400) -> str:
        """
        Generate a signed URL for a file in the private bucket.

        Args:
            file_path: Path to the file within the bucket
            expires_in: Expiration time in seconds (default: 1 hour)

        Returns:
            str: Signed URL for the file
        """
        try:
            response = self.client.storage.from_(self.bucket_name).create_signed_url(
                path=file_path,
                expires_in=expires_in
            )

            # Handle different response formats from Supabase
            if isinstance(response, dict):
                # If response is a dictionary, extract the signedURL
                if 'signedURL' in response:
                    return response['signedURL']
                elif 'url' in response:
                    return response['url']
                else:
                    raise Exception(f"Unexpected response format from Supabase: {response}")
            elif isinstance(response, str):
                # If response is already a string, return it directly
                return response
            else:
                raise Exception(f"Unexpected response type from Supabase: {type(response)}")

        except Exception as e:
            raise Exception(f"Failed to generate signed URL for {file_path}: {str(e)}")

    def download_file(self, file_path: str) -> dict:
        """
        Download a file from Supabase storage using its private bucket path.

        Args:
            file_path: Private bucket path of the file to download (e.g., "oms/filename.pdf")

        Returns:
            dict: Download result with file data or error
        """
        try:
            response = self.client.storage.from_(self.bucket_name).download(file_path)

            return {
                "success": True,
                "data": response,
                "file_path": file_path
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def delete_file(self, file_path: str) -> dict:
        """
        Delete a file from Supabase storage.

        Args:
            file_path: Path to the file within the bucket

        Returns:
            dict: Deletion result
        """
        try:
            response = self.client.storage.from_(self.bucket_name).remove([file_path])

            return {
                "success": True,
                "message": "File deleted successfully"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def list_files(self, folder: str = "", limit: int = 100) -> dict:
        """
        List files in a folder within the bucket.

        Args:
            folder: Folder path within the bucket
            limit: Maximum number of files to return

        Returns:
            dict: List of files or error
        """
        try:
            response = self.client.storage.from_(self.bucket_name).list(
                path=folder,
                limit=limit
            )

            return {
                "success": True,
                "files": response
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def file_exists(self, file_path: str) -> bool:
        """
        Check if a file exists in storage.

        Args:
            file_path: Path to the file within the bucket

        Returns:
            bool: True if file exists, False otherwise
        """
        try:
            # Try to get file info
            folder_path = str(Path(file_path).parent)
            filename = Path(file_path).name

            files_response = self.list_files(folder_path)

            if files_response["success"]:
                for file_info in files_response["files"]:
                    if file_info.get("name") == filename:
                        return True

            return False

        except Exception:
            return False

    # Excel-specific storage methods

    def upload_excel_file(self, local_file_path: str) -> dict:
        """
        Upload the generated Excel file to Supabase storage.

        Args:
            local_file_path: Path to the local Excel file

        Returns:
            dict: Upload result with signed URL and file path

        Raises:
            HTTPException: If upload fails
        """
        try:
            # Read the file
            with open(local_file_path, 'rb') as file:
                file_data = file.read()

            # Generate unique filename
            unique_filename = f"dealq-{str(uuid.uuid4())}.xlsm"

            # Upload to Supabase storage
            upload_result = self.upload_file(
                file_data=file_data,
                folder="model_outputs",
                filename=unique_filename,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )

            if not upload_result["success"]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to upload to Supabase: {upload_result['error']}"
                )

            return {
                "signed_url": upload_result["signed_url"],
                "file_path": upload_result["file_path"]
            }

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload Excel to Supabase: {str(e)}"
            )

    def cleanup_temp_file(self, file_path: str) -> None:
        """
        Safely remove a temporary file.

        Args:
            file_path: Path to the file to remove
        """
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass  # Ignore cleanup errors

    def generate_presigned_upload_url(
        self,
        document_type: str,
        original_filename: str,
        file_type: str,
        deal_id: str
    ) -> dict:
        """
        Generate a pre-signed upload URL for direct frontend uploads.

        Args:
            document_type: Type of document (OM, T12, RR)
            original_filename: Original filename from user
            file_type: File type (pdf, excel, etc.)
            deal_id: ID of the deal for organizing files

        Returns:
            dict: Upload URL and file path information
        """
        try:
            # Map document types to storage folders
            folder_mapping = {
                "OM": "oms",
                "T12": "t12s",
                "RR": "rent_rolls"
            }

            if document_type not in folder_mapping:
                raise Exception(f"Invalid document type: {document_type}")

            folder = folder_mapping[document_type]

            # Generate unique filename to avoid conflicts
            file_extension = Path(original_filename).suffix
            unique_filename = f"{deal_id}_{document_type}_{str(uuid.uuid4())}{file_extension}"

            # Construct the file path
            file_path = f"{folder}/{unique_filename}"

            # Generate pre-signed upload URL
            # Note: This creates a URL that allows PUT operations for uploads
            response = self.client.storage.from_(self.bucket_name).create_signed_upload_url(file_path)

            # Extract upload URL from Supabase response
            if isinstance(response, dict) and 'signed_url' in response:
                upload_url = response['signed_url']
            else:
                raise Exception(f"Unexpected response format from create_signed_upload_url: {response}")

            return {
                "success": True,
                "upload_url": upload_url,
                "file_path": file_path,
                "unique_filename": unique_filename,
                "folder": folder
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
