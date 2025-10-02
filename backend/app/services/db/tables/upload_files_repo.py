from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.upload_files import UploadFile, UploadFileCreate, UploadFileUpdate


class UploadFilesRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "upload_files"

    def create_upload_file(self, upload_file: UploadFileCreate) -> UploadFile:
        """Create a new upload file."""
        upload_file_data = upload_file.model_dump(exclude_unset=True)
        # Convert UUID to string for Supabase
        upload_file_data["upload_id"] = str(upload_file_data["upload_id"])
        result = self.client.table(self.table).insert(upload_file_data).execute()
        return UploadFile(**result.data[0])

    def get_upload_file_by_id(self, upload_file_id: UUID) -> Optional[UploadFile]:
        """Get an upload file by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(upload_file_id)).execute()
        if result.data:
            return UploadFile(**result.data[0])
        return None

    def get_upload_files_by_upload_id(self, upload_id: UUID) -> List[UploadFile]:
        """Get all upload files for a specific upload."""
        result = self.client.table(self.table).select("*").eq("upload_id", str(upload_id)).execute()
        return [UploadFile(**upload_file) for upload_file in result.data]

    def get_upload_files_by_type(self, upload_id: UUID, file_type: str) -> List[UploadFile]:
        """Get upload files by upload ID and file type."""
        result = (self.client.table(self.table)
                 .select("*")
                 .eq("upload_id", str(upload_id))
                 .eq("file_type", file_type)
                 .execute())
        return [UploadFile(**upload_file) for upload_file in result.data]

    def get_all_upload_files(self) -> List[UploadFile]:
        """Get all upload files."""
        result = self.client.table(self.table).select("*").execute()
        return [UploadFile(**upload_file) for upload_file in result.data]

    def update_upload_file(self, upload_file_id: UUID, upload_file_update: UploadFileUpdate) -> Optional[UploadFile]:
        """Update an upload file by ID."""
        update_data = upload_file_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_upload_file_by_id(upload_file_id)

        result = self.client.table(self.table).update(update_data).eq("id", str(upload_file_id)).execute()
        if result.data:
            return UploadFile(**result.data[0])
        return None

    def delete_upload_file(self, upload_file_id: UUID) -> bool:
        """Delete an upload file by ID."""
        result = self.client.table(self.table).delete().eq("id", str(upload_file_id)).execute()
        return len(result.data) > 0

    def delete_upload_files_by_upload_id(self, upload_id: UUID) -> bool:
        """Delete all upload files for a specific upload."""
        result = self.client.table(self.table).delete().eq("upload_id", str(upload_id)).execute()
        return True  # Supabase returns empty array for successful bulk deletes
