from typing import List, Optional, Tuple
from uuid import UUID
from supabase import Client
from app.models.db.deals import Deal, DealCreate, DealUpdate, DealSummary


class DealsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "deals"

    def create_deal(self, deal: DealCreate) -> Deal:
        """Create a new deal."""
        deal_data = deal.model_dump(exclude_unset=True)

        # Convert UUID to string for Supabase
        deal_data["user_id"] = str(deal_data["user_id"])

        # Convert Decimal to float for JSON serialization
        if deal_data.get("asking_price"):
            deal_data["asking_price"] = float(deal_data["asking_price"])
        result = self.client.table(self.table).insert(deal_data).execute()
        return Deal(**result.data[0])

    def get_deal_by_id(self, deal_id: UUID) -> Optional[Deal]:
        """Get a deal by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(deal_id)).execute()
        if result.data:
            return Deal(**result.data[0])
        return None

    def get_deals_by_user_id(self, user_id: UUID) -> List[Deal]:
        """Get all active deals for a user."""
        result = (self.client.table(self.table)
                 .select("*")
                 .eq("user_id", str(user_id))
                 .eq("status", "active")
                 .execute())
        return [Deal(**deal) for deal in result.data]

    def get_deals_summary_by_user_id(self, user_id: UUID) -> List[DealSummary]:
        """Get simplified deal summaries for a user."""
        result = (self.client.table(self.table)
                 .select("id, property_name, address, zip_code, city, state, number_of_units, year_built, image_path")
                 .eq("user_id", str(user_id))
                 .eq("status", "active")
                 .execute())
        return [DealSummary(**deal) for deal in result.data]

    def get_recent_deals_summary_by_user_id(self, user_id: UUID, limit: int = 3) -> List[DealSummary]:
        """Get the most recently updated deal summaries for a user (limited count)."""
        result = (self.client.table(self.table)
                 .select("id, property_name, address, zip_code, city, state, number_of_units, year_built, image_path, asking_price, revenue, expenses, status")
                 .eq("user_id", str(user_id))
                 .eq("status", "active")
                 .order("updated_at", desc=True)
                 .limit(limit)
                 .execute())
        return [DealSummary(**deal) for deal in result.data]



    def update_deal(self, deal_id: UUID, deal_update: DealUpdate) -> Optional[Deal]:
        """Update a deal by ID."""
        update_data = deal_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_deal_by_id(deal_id)

        # Convert Decimal to float for JSON serialization
        if update_data.get("asking_price"):
            update_data["asking_price"] = float(update_data["asking_price"])

        result = self.client.table(self.table).update(update_data).eq("id", str(deal_id)).execute()
        if result.data:
            return Deal(**result.data[0])
        return None

    def delete_deal(self, deal_id: UUID) -> bool:
        """Delete a deal by ID."""
        result = self.client.table(self.table).delete().eq("id", str(deal_id)).execute()
        return len(result.data) > 0

    def update_deal_status(self, deal_id: UUID, status: str) -> Optional[Deal]:
        """Update deal status."""
        return self.update_deal(deal_id, DealUpdate(status=status))

    def bulk_update_deal_status(self, deal_ids: List[UUID], status: str, user_id: UUID) -> Tuple[int, List[UUID]]:
        """
        Update multiple deal statuses in a single operation.

        Args:
            deal_ids: List of deal IDs to update
            status: New status to set (active, draft, dead)
            user_id: User ID to verify ownership

        Returns:
            Tuple of (updated_count, failed_deal_ids)
        """
        if not deal_ids:
            return 0, []

        # Validate status
        valid_statuses = ["active", "draft", "dead"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        # Convert UUIDs to strings for Supabase
        deal_id_strings = [str(deal_id) for deal_id in deal_ids]

        try:
            # Update all deals in a single operation
            result = (self.client.table(self.table)
                     .update({"status": status})
                     .in_("id", deal_id_strings)
                     .eq("user_id", str(user_id))
                     .execute())

            # Count successful updates
            updated_count = len(result.data) if result.data else 0

            # Find failed deal IDs (deals that weren't updated)
            updated_deal_ids = {deal["id"] for deal in result.data} if result.data else set()
            failed_deal_ids = [
                UUID(deal_id) for deal_id in deal_id_strings
                if deal_id not in updated_deal_ids
            ]

            return updated_count, failed_deal_ids

        except Exception as e:
            # If the bulk operation fails, return all deal IDs as failed
            return 0, deal_ids

    def update_deal_excel_path(self, deal_id: UUID, excel_file_path: str) -> Optional[Deal]:
        """Update deal Excel file path."""
        return self.update_deal(deal_id, DealUpdate(excel_file_path=excel_file_path))

    def get_active_deals_count(self, user_id: UUID) -> int:
        """Get count of active deals for a user."""
        result = (self.client.table(self.table)
                 .select("id", count="exact")
                 .eq("user_id", str(user_id))
                 .eq("status", "active")
                 .execute())
        return result.count or 0

    def get_last_30_days_total_value(self, user_id: UUID) -> float:
        """Get sum of asking prices for deals updated in the last 30 days."""
        from datetime import datetime, timedelta

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        result = (self.client.table(self.table)
                 .select("asking_price")
                 .eq("user_id", str(user_id))
                 .gte("updated_at", thirty_days_ago.isoformat())
                 .execute())

        total_value = sum(deal.get("asking_price", 0) or 0 for deal in result.data)
        return float(total_value)

    def get_draft_deals_count(self, user_id: UUID) -> int:
        """Get count of draft deals for a user."""
        result = (self.client.table(self.table)
                 .select("id", count="exact")
                 .eq("user_id", str(user_id))
                 .eq("status", "draft")
                 .execute())
        return result.count or 0

    def get_last_30_days_deals_count(self, user_id: UUID) -> int:
        """Get total count of deals updated in the last 30 days."""
        from datetime import datetime, timedelta

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        result = (self.client.table(self.table)
                 .select("id", count="exact")
                 .eq("user_id", str(user_id))
                 .gte("updated_at", thirty_days_ago.isoformat())
                 .execute())
        return result.count or 0







    def get_deals_with_filters_and_sort(
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
            user_id: User ID to filter deals by
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
            sort_by: Field to sort by (id, property_name, address, city, state,
                     number_of_units, year_built, asking_price, revenue, expenses,
                     status, created_at, updated_at)
            sort_order: Sort order (asc, desc)

        Returns:
            Tuple of (deals, total_count, total_pages)
        """
        offset = (page - 1) * limit

        # Start building the query
        query = self.client.table(self.table).select(
            "id, property_name, address, zip_code, city, state, number_of_units, "
            "year_built, image_path, asking_price, revenue, expenses, status, "
            "created_at, updated_at"
        ).eq("user_id", str(user_id))

        # Apply filters
        if status:
            query = query.eq("status", status)

        if min_units is not None:
            query = query.gte("number_of_units", min_units)

        if max_units is not None:
            query = query.lte("number_of_units", max_units)

        if min_price is not None:
            query = query.gte("asking_price", min_price)

        if max_price is not None:
            query = query.lte("asking_price", max_price)

        if min_year_built is not None:
            query = query.gte("year_built", min_year_built)

        if max_year_built is not None:
            query = query.lte("year_built", max_year_built)

        if cities:
            # Handle multiple cities with partial matching
            city_filters = []
            for city in cities:
                city_filters.append(f"city.ilike.%{city}%")
            query = query.or_(','.join(city_filters))

        if states:
            # Handle multiple states with exact matching
            query = query.in_("state", states)

        # Validate sort parameters
        valid_sort_fields = [
            "id", "property_name", "address", "city", "state", "number_of_units",
            "year_built", "asking_price", "revenue", "expenses", "status",
            "created_at", "updated_at"
        ]

        if sort_by not in valid_sort_fields:
            sort_by = "updated_at"

        if sort_order not in ["asc", "desc"]:
            sort_order = "desc"

        # Apply sorting
        query = query.order(sort_by, desc=(sort_order == "desc"))

        # Get total count for pagination
        count_query = query
        count_result = count_query.execute()
        total_count = len(count_result.data)

        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        result = query.execute()

        deals = [DealSummary(**deal) for deal in result.data]
        total_pages = (total_count + limit - 1) // limit

        return deals, total_count, total_pages
