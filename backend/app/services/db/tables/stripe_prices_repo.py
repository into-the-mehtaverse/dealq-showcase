from typing import List, Optional
from supabase import Client
from app.models.db.stripe_prices import StripePrice, StripePriceCreate, StripePriceUpdate


class StripePricesRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "stripe_prices"

    def create_stripe_price(self, stripe_price: StripePriceCreate) -> StripePrice:
        """Create a new Stripe price record."""
        price_data = stripe_price.model_dump(exclude_unset=True)
        result = self.client.table(self.table).insert(price_data).execute()
        return StripePrice(**result.data[0])

    def get_stripe_price_by_id(self, stripe_price_id: str) -> Optional[StripePrice]:
        """Get a Stripe price by Stripe price ID."""
        result = self.client.table(self.table).select("*").eq("stripe_price_id", stripe_price_id).execute()
        if result.data:
            return StripePrice(**result.data[0])
        return None

    def get_stripe_prices_by_product_id(self, stripe_product_id: str) -> List[StripePrice]:
        """Get all Stripe prices for a specific product."""
        result = self.client.table(self.table).select("*").eq("stripe_product_id", stripe_product_id).execute()
        return [StripePrice(**price) for price in result.data]

    def get_stripe_prices_by_interval(self, interval: str) -> List[StripePrice]:
        """Get all Stripe prices for a specific interval (month, year, etc.)."""
        result = self.client.table(self.table).select("*").eq("interval", interval).execute()
        return [StripePrice(**price) for price in result.data]

    def get_stripe_prices_by_currency(self, currency: str) -> List[StripePrice]:
        """Get all Stripe prices for a specific currency."""
        result = self.client.table(self.table).select("*").eq("currency", currency).execute()
        return [StripePrice(**price) for price in result.data]

    def get_stripe_prices_by_metadata(self, metadata_key: str, metadata_value: str) -> List[StripePrice]:
        """Get all Stripe prices with specific metadata key-value pair."""
        result = self.client.table(self.table).select("*").contains("metadata", {metadata_key: metadata_value}).execute()
        return [StripePrice(**price) for price in result.data]

    def get_all_stripe_prices(self) -> List[StripePrice]:
        """Get all Stripe prices."""
        result = self.client.table(self.table).select("*").execute()
        return [StripePrice(**price) for price in result.data]

    def update_stripe_price(self, stripe_price_id: str, price_update: StripePriceUpdate) -> Optional[StripePrice]:
        """Update a Stripe price by Stripe price ID."""
        update_data = price_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_stripe_price_by_id(stripe_price_id)

        result = self.client.table(self.table).update(update_data).eq("stripe_price_id", stripe_price_id).execute()
        if result.data:
            return StripePrice(**result.data[0])
        return None

    def delete_stripe_price(self, stripe_price_id: str) -> bool:
        """Delete a Stripe price by Stripe price ID."""
        result = self.client.table(self.table).delete().eq("stripe_price_id", stripe_price_id).execute()
        return len(result.data) > 0

    def upsert_stripe_price(self, stripe_price: StripePriceCreate) -> StripePrice:
        """
        Upsert a Stripe price record.
        This is useful for syncing prices from Stripe webhooks or API calls.
        """
        # Try to get existing price first
        existing = self.get_stripe_price_by_id(stripe_price.stripe_price_id)

        if existing:
            # Update existing record
            update_data = StripePriceUpdate(
                stripe_product_id=stripe_price.stripe_product_id,
                nickname=stripe_price.nickname,
                unit_amount=stripe_price.unit_amount,
                currency=stripe_price.currency,
                interval=stripe_price.interval,
                metadata=stripe_price.metadata
            )
            return self.update_stripe_price(stripe_price.stripe_price_id, update_data)
        else:
            # Create new record
            return self.create_stripe_price(stripe_price)

    def get_active_prices(self) -> List[StripePrice]:
        """
        Get all active prices (assuming active prices have metadata.tier set).
        This is a convenience method for common use cases.
        """
        result = self.client.table(self.table).select("*").not_.is_("metadata->tier", "null").execute()
        return [StripePrice(**price) for price in result.data]

    def get_prices_by_tier(self, tier: str) -> List[StripePrice]:
        """
        Get all prices for a specific tier (e.g., 'pro', 'basic').
        """
        return self.get_stripe_prices_by_metadata("tier", tier)
