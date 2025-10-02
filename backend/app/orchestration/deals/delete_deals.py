"""
Delete Deals Orchestration

Handles the orchestration of deal deletion operations including file cleanup.
"""

from typing import List, Dict, Any
from uuid import UUID
from fastapi import HTTPException, status

from app.models.db.deals import Deal
from app.models.db.users import User
from app.services.storage.storage_service import StorageService
from app.services.db.service import DatabaseService
from app.core.supabase_client import get_supabase_client


class DeleteDealsStage:
    """Pipeline stage for handling deal deletion operations including file cleanup."""

    def __init__(
        self,
        storage_service: StorageService = None,
        db: DatabaseService = None
    ):
        """Initialize the delete deals stage with services."""
        self.storage_service = storage_service or StorageService()
        self.db = db or DatabaseService(get_supabase_client())

    async def delete_files_for_deal(self, deal_id: UUID) -> List[str]:
        """
        Delete all files associated with a deal from storage.

        Args:
            deal_id: UUID of the deal

        Returns:
            List[str]: List of error messages for failed deletions
        """
        errors = []

        try:
            # Get all files associated with the deal
            files = self.db.get_all_files_for_deal(deal_id)

            # Delete each file from storage
            for file in files:
                try:
                    if file.file_url:
                        delete_result = self.storage_service.delete_file(file.file_url)
                        if not delete_result["success"]:
                            errors.append(f"Failed to delete file {file.filename}: {delete_result.get('error', 'Unknown error')}")
                except Exception as e:
                    errors.append(f"Failed to delete file {file.filename}: {str(e)}")

        except Exception as e:
            errors.append(f"Failed to get files for deal: {str(e)}")

        return errors

    async def delete_deal(self, deal_id: UUID, current_user: User) -> Dict[str, Any]:
        """
        Orchestrate the deletion of a single deal.

        Args:
            deal_id: UUID of the deal to delete
            current_user: The authenticated user

        Returns:
            Dict[str, Any]: Result of the deletion operation
        """
        # Get the deal to verify ownership
        deal = self.db.deals_repo.get_deal_by_id(deal_id)

        if not deal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Deal not found"
            )

        # Verify the user owns this deal
        if deal.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own deals"
            )

        # Delete associated files from storage
        file_errors = await self.delete_files_for_deal(deal_id)
        if file_errors:
            # Log file deletion errors but don't fail the entire operation
            print(f"File deletion errors for deal {deal_id}: {file_errors}")

        # Delete the deal
        success = self.db.deals_repo.delete_deal(deal_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete deal"
            )

        message = "Deal deleted successfully"
        if file_errors:
            message += f". Some files could not be deleted: {', '.join(file_errors)}"

        return {"message": message}

    async def delete_multiple_deals(self, deal_ids: List[UUID], current_user: User) -> Dict[str, Any]:
        """
        Orchestrate the deletion of multiple deals.

        Args:
            deal_ids: List of deal IDs to delete
            current_user: The authenticated user

        Returns:
            Dict[str, Any]: Result of the deletion operation
        """
        if not deal_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No deal IDs provided"
            )

        deleted_count = 0
        failed_deals = []
        file_deletion_errors = []

        for deal_id in deal_ids:
            try:
                # Get the deal to verify ownership
                deal = self.db.deals_repo.get_deal_by_id(deal_id)

                if not deal:
                    failed_deals.append(f"Deal {deal_id} not found")
                    continue

                # Verify the user owns this deal
                if deal.user_id != current_user.id:
                    failed_deals.append(f"Deal {deal_id} not authorized")
                    continue

                # Delete associated files from storage
                file_errors = await self.delete_files_for_deal(deal_id)
                if file_errors:
                    file_deletion_errors.extend([f"Deal {deal_id}: {error}" for error in file_errors])

                # Delete the deal
                success = self.db.deals_repo.delete_deal(deal_id)

                if success:
                    deleted_count += 1
                else:
                    failed_deals.append(f"Failed to delete deal {deal_id}")

            except Exception as e:
                failed_deals.append(f"Error deleting deal {deal_id}: {str(e)}")

        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No deals were deleted. Errors: {', '.join(failed_deals)}"
            )

        message = f"Successfully deleted {deleted_count} deal(s)"
        if failed_deals:
            message += f". Failed to delete: {', '.join(failed_deals)}"
        if file_deletion_errors:
            message += f". File deletion errors: {', '.join(file_deletion_errors)}"

        return {
            "message": message,
            "deleted_count": deleted_count,
            "failed_deals": failed_deals,
            "file_deletion_errors": file_deletion_errors
        }
