"""
Get Deals for Dashboard Orchestrator

Handles the orchestration for retrieving deals for the dashboard with signed image URLs and metrics.
"""

from typing import List
from uuid import UUID
from app.services.db.service import DatabaseService
from app.orchestration._shared.cached_storage import CachedStorageService
from app.models.db.deals import DealSummary
from app.models.api.deals import DashboardDealsResponse


class GetDealsForDashboardOrchestrator:
    """Orchestrator for retrieving recent deals for dashboard with signed image URLs."""

    def __init__(
        self,
        storage_service: CachedStorageService,
        db: DatabaseService,
        cache_service = None
    ):
        """Initialize the orchestrator with required services."""
        self.storage_service = storage_service
        self.db_service = db
        self.cache_service = cache_service

    async def get_deals_for_dashboard(self, user_id: UUID) -> DashboardDealsResponse:
        """
        Get the last 3 updated deals for the user's dashboard with signed image URLs and metrics.

        Args:
            user_id: UUID of the user whose recent deals to retrieve

        Returns:
            DashboardDealsResponse: Dashboard data including deals, active count, and total value
        """
        try:
            # 1. Get deals using existing db method

            print(f"User ID: {user_id}")
            deals = self.db_service.deals_repo.get_recent_deals_summary_by_user_id(user_id, limit=3)

            # 2. Get dashboard metrics
            active_deals_count = self.db_service.deals_repo.get_active_deals_count(user_id)
            last_30_days_total_value = self.db_service.deals_repo.get_last_30_days_total_value(user_id)
            draft_deals_count = self.db_service.deals_repo.get_draft_deals_count(user_id)
            last_30_days_deals_count = self.db_service.deals_repo.get_last_30_days_deals_count(user_id)

            # 3. Generate signed URLs for image_paths
            for deal in deals:
                if deal.image_path:
                    try:
                        signed_url = self.storage_service.get_signed_url(deal.image_path, user_id=str(user_id))
                        # Add signed URL to the deal object
                        deal.image_url = signed_url
                    except Exception as e:
                        print(f"Failed to generate signed URL for image {deal.image_path}: {str(e)}")
                        deal.image_url = None
                else:
                    deal.image_url = None

            print(f"Deals: {deals}")

            return DashboardDealsResponse(
                deals=deals,
                active_deals_count=active_deals_count,
                last_30_days_total_value=last_30_days_total_value,
                draft_deals_count=draft_deals_count,
                last_30_days_deals_count=last_30_days_deals_count
            )

        except Exception as e:
            print(f"Error getting deals for dashboard: {str(e)}")
            raise Exception(f"Failed to retrieve deals for dashboard: {str(e)}")
