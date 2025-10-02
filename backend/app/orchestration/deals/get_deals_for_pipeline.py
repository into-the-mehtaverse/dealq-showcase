"""
Get Deals for Pipeline Orchestrator

Handles the orchestration for retrieving deals for the pipeline with signed image URLs and pagination.
"""

from typing import List, Tuple, Dict, Optional
from uuid import UUID
from app.services.db.service import DatabaseService
from app.orchestration._shared.cached_storage import CachedStorageService
from app.models.db.deals import DealSummary


class GetDealsForPipelineOrchestrator:
    """Orchestrator for retrieving deals for pipeline with signed image URLs and pagination."""

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

    async def get_pipeline_metrics(self, user_id: UUID) -> Dict[str, int]:
        """
        Get pipeline metrics (counts for each status).

        Args:
            user_id: UUID of the user whose metrics to retrieve

        Returns:
            Dict with counts for each status
        """
        try:
            # Get counts using existing repository methods
            active_count = self.db_service.deals_repo.get_active_deals_count(user_id)
            draft_count = self.db_service.deals_repo.get_draft_deals_count(user_id)

            # For dead deals, we need to get the count since there's no existing method
            # We'll get it from the deals table
            dead_count_result = self.db_service.deals_repo.client.table("deals").select("id", count="exact").eq("user_id", str(user_id)).eq("status", "dead").execute()
            dead_count = dead_count_result.count or 0

            # Total pipeline deals (active + draft, excluding dead)
            total_pipeline_deals = active_count + draft_count

            return {
                "totalDealsCount": total_pipeline_deals,
                "activeDealsCount": active_count,
                "draftDealsCount": draft_count,
                "deadDealsCount": dead_count
            }

        except Exception as e:
            print(f"Error getting pipeline metrics: {str(e)}")
            raise Exception(f"Failed to retrieve pipeline metrics: {str(e)}")





    async def get_deals_with_filters_and_sort(
        self,
        user_id: UUID,
        page: int = 1,
        limit: int = 12,
        status: Optional[str] = None,
        min_units: Optional[int] = None,
        max_units: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_year_built: Optional[int] = None,
        max_year_built: Optional[int] = None,
        cities: Optional[List[str]] = None,
        states: Optional[List[str]] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc"
    ) -> Tuple[List[DealSummary], int, int]:
        """
        Get deals with flexible filtering, sorting, and pagination.

        Args:
            user_id: UUID of the user whose deals to retrieve
            page: Page number (1-based)
            limit: Number of deals per page
            status: Status to filter by (active, draft, dead)
            min_units: Minimum number of units
            max_units: Maximum number of units
            min_price: Minimum asking price
            max_price: Maximum asking price
            min_year_built: Minimum year built
            max_year_built: Maximum year built
            cities: List of cities to filter by (partial match)
            states: List of states to filter by (exact match)
            sort_by: Field to sort by
            sort_order: Sort order (asc, desc)

        Returns:
            Tuple of (deals, total_count, total_pages)
        """
        try:
            # 1. Get deals with filters and sorting using the new repository method
            deals, total_count, total_pages = self.db_service.deals_repo.get_deals_with_filters_and_sort(
                user_id=user_id,
                page=page,
                limit=limit,
                status=status,
                min_units=min_units,
                max_units=max_units,
                min_price=min_price,
                max_price=max_price,
                min_year_built=min_year_built,
                max_year_built=max_year_built,
                cities=cities,
                states=states,
                sort_by=sort_by,
                sort_order=sort_order
            )

            # 2. Generate signed URLs for image_paths
            for deal in deals:
                if deal.image_path:
                    try:
                        signed_url = self.storage_service.get_signed_url(deal.image_path, user_id=str(user_id))
                        deal.image_url = signed_url
                    except Exception as e:
                        print(f"Failed to generate signed URL for image {deal.image_path}: {str(e)}")
                        deal.image_url = None
                else:
                    deal.image_url = None

            return deals, total_count, total_pages

        except Exception as e:
            print(f"Error getting deals with filters and sort for pipeline: {str(e)}")
            raise Exception(f"Failed to retrieve deals with filters and sort for pipeline: {str(e)}")
