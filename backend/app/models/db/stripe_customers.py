from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class StripeCustomerBase(BaseModel):
    account_id: UUID
    stripe_customer_id: str
    billing_email: Optional[str] = None
    default_payment_method_last4: Optional[str] = None


class StripeCustomerCreate(StripeCustomerBase):
    id: Optional[UUID] = None


class StripeCustomerUpdate(BaseModel):
    account_id: Optional[UUID] = None
    stripe_customer_id: Optional[str] = None
    billing_email: Optional[str] = None
    default_payment_method_last4: Optional[str] = None


class StripeCustomer(StripeCustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
