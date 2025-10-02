"""
Deals API endpoint

This endpoint handles deal-related operations for the authenticated user.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.models.db.deals import Deal, DealSummary
from app.models.api.deals import DeleteMultipleDealsRequest, DealResponse, UpdateDealRequest, UpdateDealResponse, DashboardDealsResponse
from app.models.db.users import User
from app.core.dependencies.services import db
from app.core.dependencies.stages import get_deals_for_dashboard_stage, get_individual_deal_stage
from app.auth.dependencies import get_current_user
from app.auth.entitlements import require_subscription
from app.core.dependencies.stages import delete_deals_stage, update_deal_stage
from uuid import UUID

router = APIRouter()


@router.get("", response_model=DashboardDealsResponse)
async def get_user_deals(
    current_user: User = Depends(get_current_user)
) -> DashboardDealsResponse:
    """
    Get all deals for the authenticated user with dashboard metrics.

    Args:
        current_user: The authenticated user

    Returns:
        DashboardDealsResponse: Dashboard data including deals, metrics, and counts

    Note: Accessible without subscription - users can view existing deals.
    """
    try:
        return await get_deals_for_dashboard_stage.get_deals_for_dashboard(current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve deals: {str(e)}"
        )

@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal_by_id(
    deal_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific deal by ID for the authenticated user.

    Args:
        deal_id: UUID of the deal to retrieve
        current_user: Authenticated user (injected via dependency)

    Returns:
        Deal information if found and owned by user

    Note: Accessible without subscription - users can view existing deals.
    """
    try:
        # Validate UUID format
        try:
            deal_uuid = UUID(deal_id)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid deal ID format"
            )

        # Get complete deal information using orchestration stage
        deal_data = await get_individual_deal_stage.get_individual_deal(deal_uuid, current_user.id)

        return DealResponse(**deal_data)

    except Exception as e:
        # Handle specific error cases
        if "Deal not found" in str(e):
            raise HTTPException(status_code=404, detail="Deal not found")
        elif "Access denied" in str(e):
            raise HTTPException(status_code=403, detail="Access denied: Deal does not belong to user")
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve deal: {str(e)}"
            )


@router.put("/{deal_id}", response_model=UpdateDealResponse)
async def update_deal(
    deal_id: str,
    deal_update: UpdateDealRequest,
    current_user: User = Depends(get_current_user),
    subscription: dict = Depends(require_subscription)
) -> UpdateDealResponse:
    """
    Update a specific deal by ID for the authenticated user.

    Args:
        deal_id: UUID of the deal to update
        deal_update: DealUpdateRequest containing fields to update
        current_user: Authenticated user (injected via dependency)
        subscription: Active subscription (injected via dependency)

    Returns:
        Updated deal information if found and owned by user

    Raises:
        HTTPException: If deal not found, user not authorized, or update fails

    Requires active subscription.
    """
    try:
        # Validate UUID format
        try:
            deal_uuid = UUID(deal_id)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid deal ID format"
            )

        # Update deal using orchestration stage
        updated_deal = await update_deal_stage.update_deal(deal_uuid, deal_update, current_user.id)

        return updated_deal

    except Exception as e:
        # Handle specific error cases
        if "Deal not found" in str(e):
            raise HTTPException(status_code=404, detail="Deal not found")
        elif "Access denied" in str(e):
            raise HTTPException(status_code=403, detail="Access denied: Deal does not belong to user")
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update deal: {str(e)}"
            )


@router.delete("/", response_model=dict)
async def delete_multiple_deals(
    request: DeleteMultipleDealsRequest,
    current_user: User = Depends(get_current_user),
    subscription: dict = Depends(require_subscription)
) -> dict:
    """
    Delete multiple deals by IDs.

    Users can only delete their own deals.

    Args:
        deal_ids: List of deal IDs to delete
        current_user: Authenticated user (injected via dependency)
        subscription: Active subscription (injected via dependency)

    Requires active subscription.

    Returns:
        dict: Success message with count of deleted deals

    Raises:
        HTTPException: If any deal not found or user not authorized
    """
    return await delete_deals_stage.delete_multiple_deals(request.deal_ids, current_user)


@router.delete("/{deal_id}", response_model=dict)
async def delete_deal(
    deal_id: UUID,
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Delete a deal by ID.

    Users can only delete their own deals.

    Args:
        deal_id: The ID of the deal to delete
        current_user: The authenticated user

    Returns:
        dict: Success message

    Raises:
        HTTPException: If deal not found or user not authorized
    """
    return await delete_deals_stage.delete_deal(deal_id, current_user)
