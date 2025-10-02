from datetime import datetime
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel
from uuid import UUID


class StripeWebhookEventBase(BaseModel):
    stripe_event_id: str
    type: str  # e.g. 'invoice.payment_succeeded'
    payload: Dict[str, Any]  # full Stripe payload
    processed_at: Optional[datetime] = None
    status: Literal['pending', 'processed', 'failed'] = 'pending'
    error_message: Optional[str] = None


class StripeWebhookEventCreate(StripeWebhookEventBase):
    id: Optional[UUID] = None


class StripeWebhookEventUpdate(BaseModel):
    stripe_event_id: Optional[str] = None
    type: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    processed_at: Optional[datetime] = None
    status: Optional[Literal['pending', 'processed', 'failed']] = None
    error_message: Optional[str] = None


class StripeWebhookEvent(StripeWebhookEventBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
