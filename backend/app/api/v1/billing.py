"""
Billing API endpoints for subscription management and Stripe webhooks.

This module handles both user-facing billing operations and Stripe webhook processing.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse

# Set up logger
logger = logging.getLogger(__name__)

from app.models.db.users import User
from app.auth.dependencies import get_current_user
from app.core.dependencies.stages import billing_orchestrator, stripe_webhook_orchestrator

router = APIRouter()


# ============================================================================
# USER-FACING BILLING ENDPOINTS (BillingOrchestrator)
# ============================================================================

@router.post("/checkout")
async def create_checkout_session(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a Stripe checkout session for user subscription.

    Request body:
    - price_id: Stripe price ID for the subscription
    - success_url: URL to redirect after successful payment
    - cancel_url: URL to redirect if payment is cancelled

    Returns:
    - checkout_url: Stripe checkout URL
    - session_id: Stripe session ID
    """
    try:
        # Validate required fields
        required_fields = ['price_id', 'success_url', 'cancel_url']
        for field in required_fields:
            if field not in request:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )

        # Create checkout session
        result = await billing_orchestrator.create_checkout_session(
            user=current_user,
            price_id=request['price_id'],
            success_url=request['success_url'],
            cancel_url=request['cancel_url']
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.get("/info")
async def get_billing_info(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get comprehensive billing information for the authenticated user.

    Returns:
    - user: User information with subscription tier and usage
    - subscription: Current subscription details (if any)
    - limits: Feature limits and entitlements
    - billing_period: Current billing period dates
    """
    try:
        return await billing_orchestrator.get_billing_info(current_user)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get billing info: {str(e)}")


@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Cancel the user's subscription at the end of the current period.

    Returns:
    - success: Whether cancellation was successful
    - message: Confirmation message
    - cancel_at_period_end: Whether cancellation is scheduled
    - current_period_end: When subscription will end
    """
    try:
        return await billing_orchestrator.cancel_subscription(current_user)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")


@router.post("/reactivate")
async def reactivate_subscription(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Reactivate a cancelled subscription.

    Returns:
    - success: Whether reactivation was successful
    - message: Confirmation message
    - cancel_at_period_end: Whether cancellation flag was removed
    """
    try:
        return await billing_orchestrator.reactivate_subscription(current_user)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reactivate subscription: {str(e)}")


@router.post("/portal")
async def create_customer_portal_session(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a Stripe customer portal session for billing management.

    Request body:
    - return_url: URL to return to after portal session

    Returns:
    - portal_url: Stripe customer portal URL
    """
    try:
        if 'return_url' not in request:
            raise HTTPException(
                status_code=400,
                detail="Missing required field: return_url"
            )

        return await billing_orchestrator.create_customer_portal_session(
            user=current_user,
            return_url=request['return_url']
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")


# ============================================================================
# STRIPE WEBHOOK ENDPOINT (StripeWebhookOrchestrator)
# ============================================================================

@router.post("/webhooks")
async def handle_stripe_webhook(request: Request) -> JSONResponse:
    """
    Handle Stripe webhook events.

    This endpoint receives all webhook events from Stripe and processes them
    through the StripeWebhookOrchestrator.

    Supported events:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.finalized
    - invoice.paid
    """
    try:
        logger.info("Received Stripe webhook request")

        # Get raw payload and signature
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')

        logger.debug(f"Webhook payload size: {len(payload)} bytes, signature present: {bool(sig_header)}")

        if not sig_header:
            logger.error("Missing Stripe signature header")
            raise HTTPException(
                status_code=400,
                detail="Missing Stripe signature header"
            )

        # Verify webhook and process event
        logger.info("Processing webhook through orchestrator")
        result = await stripe_webhook_orchestrator.verify_and_process_webhook(
            payload=payload,
            sig_header=sig_header
        )

        logger.info(f"Webhook processing result: {result.get('status')} - {result.get('event_id', 'unknown')}")

        # Return appropriate response based on processing result
        if result.get('status') == 'already_processed':
            return JSONResponse(
                status_code=200,
                content={"status": "already_processed", "event_id": result.get('event_id')}
            )
        elif result.get('status') == 'success':
            return JSONResponse(
                status_code=200,
                content={
                    "status": "processed",
                    "event_id": result.get('event_id'),
                    "event_type": result.get('event_type'),
                    "action": result.get('result', {}).get('action')
                }
            )
        elif result.get('status') == 'ignored':
            return JSONResponse(
                status_code=200,
                content={"status": "ignored", "reason": result.get('message')}
            )
        else:  # error
            return JSONResponse(
                status_code=500,
                content={
                    "status": "failed",
                    "event_id": result.get('event_id'),
                    "event_type": result.get('event_type'),
                    "error": result.get('message')
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        # Log the error for debugging
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)

        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal server error"}
        )


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/health")
async def billing_health_check() -> Dict[str, Any]:
    """
    Health check endpoint for billing service.

    Returns:
    - status: Service status
    - timestamp: Current timestamp
    """
    return {
        "status": "healthy",
        "service": "billing",
        "timestamp": "2024-01-01T00:00:00Z"  # This would be actual timestamp
    }
