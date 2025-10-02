"""
Bulk Update Deal Status Orchestration

Handles the orchestration of bulk deal status update operations.
"""

from typing import List, Dict, Any
from uuid import UUID
from fastapi import HTTPException, status

from app.models.db.users import User
from app.services.db.service import DatabaseService
from app.core.supabase_client import get_supabase_client


class BulkUpdateStatusStage:
    """Pipeline stage for handling bulk deal status update operations."""

    def __init__(
        self,
        db: DatabaseService = None
    ):
        """Initialize the bulk update status stage with services."""
        self.db = db or DatabaseService(get_supabase_client())

    async def bulk_update_deal_status(
        self,
        deal_ids: List[UUID],
        new_status: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        Orchestrate the bulk update of deal statuses.

        Args:
            deal_ids: List of deal IDs to update
            new_status: New status to set (active, draft, dead)
            current_user: The authenticated user

        Returns:
            Dict[str, Any]: Result of the bulk update operation
        """
        if not deal_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No deal IDs provided"
            )

        # Validate status
        valid_statuses = ["active", "draft", "dead"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )

        try:
            # Use the repository method to perform bulk update
            updated_count, failed_deal_ids = self.db.deals_repo.bulk_update_deal_status(
                deal_ids=deal_ids,
                status=new_status,
                user_id=current_user.id
            )

            # Prepare response
            result = {
                "message": f"Successfully updated {updated_count} deal(s) to {new_status}",
                "updated_count": updated_count,
                "failed_deals": [str(deal_id) for deal_id in failed_deal_ids],
                "total_requested": len(deal_ids)
            }

            # If no deals were updated, raise an error
            if updated_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No deals were updated. All {len(deal_ids)} deals failed to update."
                )

            # If some deals failed, add warning to message
            if failed_deal_ids:
                result["message"] += f". {len(failed_deal_ids)} deal(s) failed to update."

            return result

        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to bulk update deal statuses: {str(e)}"
            )
