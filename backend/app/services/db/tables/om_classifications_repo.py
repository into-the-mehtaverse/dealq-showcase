from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.om_classifications import OMClassification, OMClassificationCreate, OMClassificationUpdate


class OMClassificationsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "om_classifications"

    def create_om_classification(self, om_classification: OMClassificationCreate) -> OMClassification:
        """Create a new OM classification."""
        om_classification_data = om_classification.model_dump(exclude_unset=True)

        # Convert UUIDs to strings for Supabase
        om_classification_data["deal_id"] = str(om_classification_data["deal_id"])
        om_classification_data["om_upload_file_id"] = str(om_classification_data["om_upload_file_id"])

        result = self.client.table(self.table).insert(om_classification_data).execute()
        return OMClassification(**result.data[0])

    def get_om_classification_by_id(self, classification_id: UUID) -> Optional[OMClassification]:
        """Get an OM classification by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(classification_id)).execute()
        if result.data:
            return OMClassification(**result.data[0])
        return None

    def get_om_classification_by_deal_id(self, deal_id: UUID) -> Optional[OMClassification]:
        """Get OM classification by deal ID."""
        result = self.client.table(self.table).select("*").eq("deal_id", str(deal_id)).execute()
        if result.data:
            return OMClassification(**result.data[0])
        return None

    def get_om_classification_by_upload_file_id(self, upload_file_id: UUID) -> Optional[OMClassification]:
        """Get OM classification by upload file ID."""
        result = self.client.table(self.table).select("*").eq("om_upload_file_id", str(upload_file_id)).execute()
        if result.data:
            return OMClassification(**result.data[0])
        return None

    def get_all_om_classifications(self) -> List[OMClassification]:
        """Get all OM classifications."""
        result = self.client.table(self.table).select("*").execute()
        return [OMClassification(**classification) for classification in result.data]

    def update_om_classification(self, classification_id: UUID, classification_update: OMClassificationUpdate) -> Optional[OMClassification]:
        """Update an OM classification by ID."""
        update_data = classification_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_om_classification_by_id(classification_id)

        result = self.client.table(self.table).update(update_data).eq("id", str(classification_id)).execute()
        if result.data:
            return OMClassification(**result.data[0])
        return None

    def delete_om_classification(self, classification_id: UUID) -> bool:
        """Delete an OM classification by ID."""
        result = self.client.table(self.table).delete().eq("id", str(classification_id)).execute()
        return len(result.data) > 0

    def delete_om_classification_by_deal_id(self, deal_id: UUID) -> bool:
        """Delete OM classification by deal ID."""
        result = self.client.table(self.table).delete().eq("deal_id", str(deal_id)).execute()
        return True  # Supabase returns empty array for successful deletes
