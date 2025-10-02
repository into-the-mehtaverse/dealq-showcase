from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class StripePriceBase(BaseModel):
    stripe_price_id: str
    stripe_product_id: str
    nickname: Optional[str] = None
    unit_amount: int  # stored in cents
    currency: str  # e.g. 'usd'
    interval: str  # e.g. 'month', 'year'
    metadata: Optional[Dict[str, Any]] = None


class StripePriceCreate(StripePriceBase):
    pass


class StripePriceUpdate(BaseModel):
    stripe_product_id: Optional[str] = None
    nickname: Optional[str] = None
    unit_amount: Optional[int] = None
    currency: Optional[str] = None
    interval: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class StripePrice(StripePriceBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
