"""
Get Individual Deal Orchestration

Handles retrieving a complete deal with all associated data including:
- Basic deal information
- File URLs (Excel, T-12, Rent Roll, OM)
- OM Classification data from om_classifications table
- Structured T-12 and Rent Roll data
"""

from typing import Optional, Dict, Any
from uuid import UUID
from app.services.db.service import DatabaseService
from app.orchestration._shared.cached_storage import CachedStorageService
from app.core.supabase_client import get_supabase_client
from app.models.db.deals import Deal


class GetIndividualDealStage:
    """Stage for retrieving complete deal information with all associated data."""

    def __init__(self, storage_service: CachedStorageService, db: DatabaseService, cache_service = None):
        self.db_service = db
        self.storage_service = storage_service
        self.cache_service = cache_service

    async def get_individual_deal(self, deal_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        Get complete deal information with all associated data.

        Args:
            deal_id: UUID of the deal to retrieve
            user_id: UUID of the authenticated user

        Returns:
            Dict containing complete deal information with file URLs and classification data

        Raises:
            Exception: If deal not found or user not authorized
        """
        try:
            # Get the basic deal information
            deal = self.db_service.deals_repo.get_deal_by_id(deal_id)
            if not deal:
                raise Exception("Deal not found")

            # Verify the deal belongs to the current user
            if str(deal.user_id) != str(user_id):
                raise Exception("Access denied: Deal does not belong to user")

            # Get uploads for this deal
            uploads = self.db_service.uploads_repo.get_uploads_by_deal_id(deal_id)
            if not uploads:
                raise Exception("No uploads found for deal")

            upload_id = uploads[0].id  # Assuming one upload per deal

            # Get upload files for this upload
            upload_files = self.db_service.upload_files_repo.get_upload_files_by_upload_id(upload_id)

            # Get OM classification data
            om_classification = None
            try:
                om_classification_record = self.db_service.om_classifications_repo.get_om_classification_by_deal_id(deal_id)
                if om_classification_record:
                    om_classification = om_classification_record.classification
            except Exception as e:
                print(f"Failed to retrieve OM classification: {str(e)}")
                # Continue without classification data

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
            if deal.excel_file_path:
                try:
                    excel_file_url = self.storage_service.get_signed_url(deal.excel_file_path, user_id=str(user_id))
                except Exception as e:
                    print(f"Failed to generate signed URL for Excel file: {str(e)}")

            # Get image URL if it exists
            image_url = None
            if deal.image_path:
                try:
                    image_url = self.storage_service.get_signed_url(deal.image_path, user_id=str(user_id))
                except Exception as e:
                    print(f"Failed to generate signed URL for image: {str(e)}")

            # Prepare the response
            response_data = {
                # Basic deal fields
                "id": str(deal.id),
                "user_id": str(deal.user_id),
                "property_name": deal.property_name,
                "address": deal.address,
                "city": deal.city,
                "state": deal.state,
                "zip_code": deal.zip_code,
                "number_of_units": deal.number_of_units,
                "year_built": deal.year_built,
                "parking_spaces": deal.parking_spaces,
                "gross_square_feet": deal.gross_square_feet,
                "asking_price": float(deal.asking_price) if deal.asking_price else None,
                "revenue": float(deal.revenue) if deal.revenue else None,
                "expenses": float(deal.expenses) if deal.expenses else None,
                "description": deal.description,
                "market_description": deal.market_description,
                "status": deal.status,
                "created_at": deal.created_at.isoformat() if deal.created_at else None,
                "updated_at": deal.updated_at.isoformat() if deal.updated_at else None,

                # File URLs
                "excel_file_url": excel_file_url,
                "t12_file_url": t12_file_url,
                "rent_roll_file_url": rent_roll_file_url,
                "om_file_url": om_file_url,
                "image_url": image_url,

                # Classification and structured data
                "om_classification": om_classification,
                "t12": deal.t12,
                "rent_roll": deal.rent_roll
            }

            return response_data

        except Exception as e:
            raise Exception(f"Failed to retrieve deal: {str(e)}")
