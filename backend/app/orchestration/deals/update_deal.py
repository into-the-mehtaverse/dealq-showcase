"""
Update Deal Orchestration

Handles updating deal information including:
- Basic deal properties (property_name, address, city, state, zip_code, etc.)
- Financial data (asking_price, revenue, expenses)
- Property details (number_of_units, year_built, parking_spaces, gross_square_feet)
- Descriptions and metadata
- T-12 and Rent Roll data
"""

from typing import Optional, Dict, Any
from uuid import UUID
from app.services.db.service import DatabaseService
from app.orchestration._shared.cached_storage import CachedStorageService
from app.models.db.deals import Deal, DealUpdate


class UpdateDealStage:
    """Stage for updating deal information."""

    def __init__(self, storage_service: CachedStorageService, db: DatabaseService, cache_service = None):
        self.db_service = db
        self.storage_service = storage_service
        self.cache_service = cache_service

    async def update_deal(self, deal_id: UUID, deal_update: DealUpdate, user_id: UUID) -> Dict[str, Any]:
        """
        Update deal information.

        Args:
            deal_id: UUID of the deal to update
            deal_update: DealUpdate model containing fields to update
            user_id: UUID of the authenticated user

        Returns:
            Dict containing updated deal information

        Raises:
            Exception: If deal not found, user not authorized, or update fails
        """
        try:
            # Get the existing deal to verify ownership
            existing_deal = self.db_service.deals_repo.get_deal_by_id(deal_id)
            if not existing_deal:
                raise Exception("Deal not found")

            # Verify the deal belongs to the current user
            if str(existing_deal.user_id) != str(user_id):
                raise Exception("Access denied: Deal does not belong to user")

            # Remove user_id from update data to prevent ownership change
            update_data = deal_update.model_dump(exclude_unset=True, exclude_none=True)
            if "user_id" in update_data:
                del update_data["user_id"]

            # Update the deal in the database
            updated_deal = self.db_service.deals_repo.update_deal(deal_id, deal_update)
            if not updated_deal:
                raise Exception("Failed to update deal")

            # Get uploads for this deal to generate file URLs
            uploads = self.db_service.uploads_repo.get_uploads_by_deal_id(deal_id)
            upload_id = uploads[0].id if uploads else None

            # Get upload files for this upload
            upload_files = []
            if upload_id:
                upload_files = self.db_service.upload_files_repo.get_upload_files_by_upload_id(upload_id)

            # Get OM classification data
            om_classification = None
            try:
                om_classification_record = self.db_service.om_classifications_repo.get_om_classification_by_deal_id(deal_id)
                if om_classification_record:
                    om_classification = om_classification_record.classification
            except Exception as e:
                print(f"Failed to retrieve OM classification: {str(e)}")

            # Generate signed URLs for files
            file_urls = {}
            for upload_file in upload_files:
                try:
                    signed_url = self.storage_service.get_signed_url(upload_file.file_path, user_id=str(user_id))
                    file_urls[upload_file.id] = signed_url
                except Exception as e:
                    print(f"Failed to generate signed URL for {upload_file.file_path}: {str(e)}")

            # Map file types to their URLs
            excel_file_url = None
            t12_file_url = None
            rent_roll_file_url = None
            om_file_url = None

            for upload_file in upload_files:
                file_url = file_urls.get(upload_file.id)
                if file_url:
                    if upload_file.doc_type == "OM":
                        om_file_url = file_url
                    elif upload_file.doc_type == "T12":
                        t12_file_url = file_url
                    elif upload_file.doc_type == "RR":
                        rent_roll_file_url = file_url

            # Get Excel file URL if it exists
            if updated_deal.excel_file_path:
                try:
                    excel_file_url = self.storage_service.get_signed_url(updated_deal.excel_file_path, user_id=str(user_id))
                except Exception as e:
                    print(f"Failed to generate signed URL for Excel file: {str(e)}")

            # Get image URL if it exists
            image_url = None
            if updated_deal.image_path:
                try:
                    image_url = self.storage_service.get_signed_url(updated_deal.image_path, user_id=str(user_id))
                except Exception as e:
                    print(f"Failed to generate signed URL for image: {str(e)}")

            # Prepare the complete response with file URLs
            response_data = {
                # Basic deal fields
                "id": str(updated_deal.id),
                "user_id": str(updated_deal.user_id),
                "property_name": updated_deal.property_name,
                "address": updated_deal.address,
                "city": updated_deal.city,
                "state": updated_deal.state,
                "zip_code": updated_deal.zip_code,
                "number_of_units": updated_deal.number_of_units,
                "year_built": updated_deal.year_built,
                "parking_spaces": updated_deal.parking_spaces,
                "gross_square_feet": updated_deal.gross_square_feet,
                "asking_price": float(updated_deal.asking_price) if updated_deal.asking_price else None,
                "revenue": float(updated_deal.revenue) if updated_deal.revenue else None,
                "expenses": float(updated_deal.expenses) if updated_deal.expenses else None,
                "description": updated_deal.description,
                "market_description": updated_deal.market_description,
                "status": updated_deal.status,
                "created_at": updated_deal.created_at.isoformat() if updated_deal.created_at else None,
                "updated_at": updated_deal.updated_at.isoformat() if updated_deal.updated_at else None,

                # File URLs
                "excel_file_url": excel_file_url,
                "t12_file_url": t12_file_url,
                "rent_roll_file_url": rent_roll_file_url,
                "om_file_url": om_file_url,
                "image_url": image_url,

                # Classification and structured data
                "om_classification": om_classification,
                "t12": updated_deal.t12,
                "rent_roll": updated_deal.rent_roll
            }

            return response_data

        except Exception as e:
            raise Exception(f"Failed to update deal: {str(e)}")
