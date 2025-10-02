"""
Entitlement dependencies for API protection.

This module provides FastAPI dependencies for checking user subscription status
and feature access before allowing access to protected endpoints.
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, Depends
from app.models.db.users import User
from app.auth.dependencies import get_current_user
from app.core.dependencies.stages import billing_orchestrator


async def require_subscription(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Require active subscription to access endpoint.

    Args:
        current_user: Authenticated user (injected via dependency)

    Returns:
        dict: Subscription status information

    Raises:
        HTTPException: 402 if user doesn't have active subscription
    """
    subscription = await billing_orchestrator.get_user_subscription_status(current_user)
    if not subscription:
        raise HTTPException(
            status_code=402,
            detail="Active subscription required to access this feature"
        )
    return subscription
