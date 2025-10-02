from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.uploads import Upload, UploadCreate, UploadUpdate


class UploadsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "uploads"

    def create_upload(self, upload: UploadCreate) -> Upload:
        """Create a new upload."""
        upload_data = upload.model_dump(exclude_unset=True)
        # Convert UUID to string for Supabase
        upload_data["deal_id"] = str(upload_data["deal_id"])
        result = self.client.table(self.table).insert(upload_data).execute()
        return Upload(**result.data[0])

    def get_upload_by_id(self, upload_id: UUID) -> Optional[Upload]:
        """Get an upload by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(upload_id)).execute()
        if result.data:
            return Upload(**result.data[0])
        return None

    def get_uploads_by_deal_id(self, deal_id: UUID) -> List[Upload]:
        """Get all uploads for a specific deal."""
        result = self.client.table(self.table).select("*").eq("deal_id", str(deal_id)).execute()
        return [Upload(**upload) for upload in result.data]

    def update_upload(self, upload_id: UUID, upload_update: UploadUpdate) -> Optional[Upload]:
        """Update an upload by ID."""
        update_data = upload_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_upload_by_id(upload_id)

        result = self.client.table(self.table).update(update_data).eq("id", str(upload_id)).execute()
        if result.data:
            return Upload(**result.data[0])
        return None

    def delete_upload(self, upload_id: UUID) -> bool:
        """Delete an upload by ID."""
        result = self.client.table(self.table).delete().eq("id", str(upload_id)).execute()
        return len(result.data) > 0

    def update_upload_status(self, upload_id: UUID, status: str) -> Optional[Upload]:
        """Update upload status."""
        return self.update_upload(upload_id, UploadUpdate(status=status))
