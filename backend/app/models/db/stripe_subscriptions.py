from datetime import datetime
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel
from uuid import UUID


class StripeSubscriptionBase(BaseModel):
    stripe_subscription_id: str
    account_id: UUID
    status_raw: str  # raw Stripe status (e.g., 'active','past_due','canceled','incomplete',...)
    status_effective: Literal['active', 'grace', 'paused', 'inactive']
    cancel_at_period_end: bool = False
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    pause_collection: Optional[bool] = False
    entitlements: Optional[Dict[str, Any]] = None  # mirror of stripe_prices.metadata


class StripeSubscriptionCreate(StripeSubscriptionBase):
    pass


class StripeSubscriptionUpdate(BaseModel):
    account_id: Optional[UUID] = None
    status_raw: Optional[str] = None
    status_effective: Optional[Literal['active', 'grace', 'paused', 'inactive']] = None
    cancel_at_period_end: Optional[bool] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    pause_collection: Optional[bool] = None
    entitlements: Optional[Dict[str, Any]] = None


class StripeSubscription(StripeSubscriptionBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
