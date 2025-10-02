from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StripeInvoiceBase(BaseModel):
    stripe_invoice_id: str
    stripe_subscription_id: Optional[str] = None  # Can be None for one-time payments
    status: str  # raw Stripe status (e.g. 'draft','open','paid','uncollectible','void')
    amount_due: int  # stored in cents
    amount_paid: int  # stored in cents
    hosted_invoice_url: Optional[str] = None


class StripeInvoiceCreate(StripeInvoiceBase):
    pass


class StripeInvoiceUpdate(BaseModel):
    stripe_subscription_id: Optional[str] = None
    status: Optional[str] = None
    amount_due: Optional[int] = None
    amount_paid: Optional[int] = None
    hosted_invoice_url: Optional[str] = None


class StripeInvoice(StripeInvoiceBase):
    created_at: datetime

    class Config:
        from_attributes = True
