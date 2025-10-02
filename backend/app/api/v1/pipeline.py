"""
Pipeline API endpoint

This endpoint handles pipeline-related operations for the authenticated user.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse

from app.models.db.deals import DealSummary
from app.models.api.deals import DealResponse, BulkStatusUpdateRequest
from app.models.db.users import User
from app.core.dependencies.services import db
from app.core.dependencies.stages import get_deals_for_pipeline_stage, bulk_update_status_stage
from app.auth.dependencies import get_current_user
from app.auth.entitlements import require_subscription
from uuid import UUID

router = APIRouter()


@router.get("/metrics")
async def get_pipeline_metrics(
    current_user: User = Depends(get_current_user)
):
    """
    Get pipeline metrics (counts for each status).

    Args:
        current_user: The authenticated user

    Note: Accessible without subscription - users can view existing pipeline metrics.

    Returns:
        JSON response with counts for each deal status
    """
    try:
        metrics = await get_deals_for_pipeline_stage.get_pipeline_metrics(current_user.id)
        return metrics

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve pipeline metrics: {str(e)}"
        )








@router.put("/{deal_id}/status")
async def change_deal_status(
    deal_id: UUID,
    status: str,
    current_user: User = Depends(get_current_user),
    subscription: dict = Depends(require_subscription)
):
    """
    Change the status of a deal.

    Args:
        deal_id: UUID of the deal to update
        status: New status (active, draft, dead)
        current_user: The authenticated user
        subscription: Active subscription (injected via dependency)

    Returns:
        Success message with updated deal information

    Requires active subscription.
    """
    try:
        # Validate status
        valid_statuses = ["active", "draft", "dead"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )

        # Update deal status using existing repository method
        updated_deal = db.deals_repo.update_deal_status(deal_id, status)

        if not updated_deal:
            raise HTTPException(
                status_code=404,
                detail="Deal not found"
            )

        # Verify user owns this deal
        if updated_deal.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: Deal does not belong to user"
            )

        return {
            "message": f"Deal status updated to {status}",
            "deal_id": str(deal_id),
            "new_status": status,
            "updated_at": updated_deal.updated_at.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update deal status: {str(e)}"
        )


@router.patch("/status")
async def bulk_update_deal_status(
    request: BulkStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    subscription: dict = Depends(require_subscription)
):
    """
    Update the status of multiple deals in a single operation.

    Args:
        request: BulkStatusUpdateRequest containing deal_ids and status
        current_user: The authenticated user
        subscription: Active subscription (injected via dependency)

    Returns:
        JSON response with update results

    Requires active subscription.
    """
    try:
        result = await bulk_update_status_stage.bulk_update_deal_status(
            deal_ids=request.deal_ids,
            new_status=request.status,
            current_user=current_user
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to bulk update deal statuses: {str(e)}"
        )


@router.get("/deals/filter")
async def get_deals_with_filters(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(12, ge=1, le=100, description="Number of deals per page"),
    status: Optional[str] = Query(None, description="Status to filter by (active, draft, dead)"),
    min_units: Optional[int] = Query(None, ge=0, description="Minimum number of units"),
    max_units: Optional[int] = Query(None, ge=0, description="Maximum number of units"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum asking price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum asking price"),
    min_year_built: Optional[int] = Query(None, ge=1800, le=2030, description="Minimum year built"),
    max_year_built: Optional[int] = Query(None, ge=1800, le=2030, description="Maximum year built"),
    cities: Optional[List[str]] = Query(None, description="List of cities to filter by"),
    states: Optional[List[str]] = Query(None, description="List of states to filter by"),
    sort_by: str = Query("updated_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    current_user: User = Depends(get_current_user)
):
    """
    Get deals with flexible filtering, sorting, and pagination.

    Args:
        page: Page number (1-based)
        limit: Number of deals per page (max 100)
        status: Status to filter by (active, draft, dead)
        min_units: Minimum number of units
        max_units: Maximum number of units
        min_price: Minimum asking price
        max_price: Maximum asking price
        min_year_built: Minimum year built
        max_year_built: Maximum year built
        current_user: The authenticated user

    Note: Accessible without subscription - users can view existing deals.

    Additional Args:
        cities: List of cities to filter by (partial match)
        states: List of states to filter by (exact match)
        sort_by: Field to sort by
        sort_order: Sort order (asc, desc)

    Returns:
        JSON response with deals, total count, and total pages
    """
    try:
        # Validate status if provided
        if status:
            valid_statuses = ["active", "draft", "dead"]
            if status not in valid_statuses:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )

        # Validate sort order
        if sort_order not in ["asc", "desc"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid sort_order. Must be 'asc' or 'desc'"
            )

        # Validate that min values are not greater than max values
        if min_units is not None and max_units is not None and min_units > max_units:
            raise HTTPException(
                status_code=400,
                detail="min_units cannot be greater than max_units"
            )

        if min_price is not None and max_price is not None and min_price > max_price:
            raise HTTPException(
                status_code=400,
                detail="min_price cannot be greater than max_price"
            )

        if min_year_built is not None and max_year_built is not None and min_year_built > max_year_built:
            raise HTTPException(
                status_code=400,
                detail="min_year_built cannot be greater than max_year_built"
            )

        deals, total_count, total_pages = await get_deals_for_pipeline_stage.get_deals_with_filters_and_sort(
            user_id=current_user.id,
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

        return {
            "deals": deals,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve deals with filters: {str(e)}"
        )
