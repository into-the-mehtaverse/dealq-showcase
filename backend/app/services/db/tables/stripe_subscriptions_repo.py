from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.stripe_subscriptions import StripeSubscription, StripeSubscriptionCreate, StripeSubscriptionUpdate


class StripeSubscriptionsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "stripe_subscriptions"

    def create_stripe_subscription(self, stripe_subscription: StripeSubscriptionCreate) -> StripeSubscription:
        """Create a new Stripe subscription record."""
        subscription_data = stripe_subscription.model_dump(exclude_unset=True)

        # Convert UUID fields to strings for JSON serialization
        if subscription_data.get('account_id'):
            subscription_data['account_id'] = str(subscription_data['account_id'])

        result = self.client.table(self.table).insert(subscription_data).execute()
        return StripeSubscription(**result.data[0])

    def get_stripe_subscription_by_id(self, stripe_subscription_id: str) -> Optional[StripeSubscription]:
        """Get a Stripe subscription by Stripe subscription ID."""
        result = self.client.table(self.table).select("*").eq("stripe_subscription_id", stripe_subscription_id).execute()
        if result.data:
            return StripeSubscription(**result.data[0])
        return None

    def get_stripe_subscriptions_by_account_id(self, account_id: UUID) -> List[StripeSubscription]:
        """Get all subscriptions for a specific account."""
        result = self.client.table(self.table).select("*").eq("account_id", str(account_id)).execute()
        return [StripeSubscription(**subscription) for subscription in result.data]

    def get_active_subscriptions_by_account_id(self, account_id: UUID) -> List[StripeSubscription]:
        """Get all active subscriptions for a specific account."""
        result = self.client.table(self.table).select("*").eq("account_id", str(account_id)).eq("status_effective", "active").execute()
        return [StripeSubscription(**subscription) for subscription in result.data]

    def get_stripe_subscriptions_by_status_effective(self, status_effective: str) -> List[StripeSubscription]:
        """Get all subscriptions with a specific effective status."""
        result = self.client.table(self.table).select("*").eq("status_effective", status_effective).execute()
        return [StripeSubscription(**subscription) for subscription in result.data]

    def get_stripe_subscriptions_by_status_raw(self, status_raw: str) -> List[StripeSubscription]:
        """Get all subscriptions with a specific raw Stripe status."""
        result = self.client.table(self.table).select("*").eq("status_raw", status_raw).execute()
        return [StripeSubscription(**subscription) for subscription in result.data]

    def get_active_subscriptions(self) -> List[StripeSubscription]:
        """Get all active subscriptions."""
        return self.get_stripe_subscriptions_by_status_effective("active")

    def get_inactive_subscriptions(self) -> List[StripeSubscription]:
        """Get all inactive subscriptions."""
        return self.get_stripe_subscriptions_by_status_effective("inactive")

    def get_grace_subscriptions(self) -> List[StripeSubscription]:
        """Get all subscriptions in grace period."""
        return self.get_stripe_subscriptions_by_status_effective("grace")

    def get_paused_subscriptions(self) -> List[StripeSubscription]:
        """Get all paused subscriptions."""
        return self.get_stripe_subscriptions_by_status_effective("paused")

    def get_all_stripe_subscriptions(self) -> List[StripeSubscription]:
        """Get all Stripe subscriptions."""
        result = self.client.table(self.table).select("*").execute()
        return [StripeSubscription(**subscription) for subscription in result.data]

    def update_stripe_subscription(self, stripe_subscription_id: str, subscription_update: StripeSubscriptionUpdate) -> Optional[StripeSubscription]:
        """Update a Stripe subscription by Stripe subscription ID."""
        update_data = subscription_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_stripe_subscription_by_id(stripe_subscription_id)

        # Convert UUID fields to strings for JSON serialization
        if 'account_id' in update_data and update_data['account_id'] is not None:
            update_data['account_id'] = str(update_data['account_id'])

        result = self.client.table(self.table).update(update_data).eq("stripe_subscription_id", stripe_subscription_id).execute()
        if result.data:
            return StripeSubscription(**result.data[0])
        return None

    def delete_stripe_subscription(self, stripe_subscription_id: str) -> bool:
        """Delete a Stripe subscription by Stripe subscription ID."""
        result = self.client.table(self.table).delete().eq("stripe_subscription_id", stripe_subscription_id).execute()
        return len(result.data) > 0

    def upsert_stripe_subscription(self, stripe_subscription: StripeSubscriptionCreate) -> StripeSubscription:
        """
        Upsert a Stripe subscription record.
        This is useful for webhook handlers where we want to create or update.
        """
        # Try to get existing subscription first
        existing = self.get_stripe_subscription_by_id(stripe_subscription.stripe_subscription_id)

        if existing:
            # Update existing record
            update_data = StripeSubscriptionUpdate(
                account_id=stripe_subscription.account_id,
                status_raw=stripe_subscription.status_raw,
                status_effective=stripe_subscription.status_effective,
                cancel_at_period_end=stripe_subscription.cancel_at_period_end,
                current_period_start=stripe_subscription.current_period_start,
                current_period_end=stripe_subscription.current_period_end,
                trial_start=stripe_subscription.trial_start,
                trial_end=stripe_subscription.trial_end,
                pause_collection=stripe_subscription.pause_collection,
                entitlements=stripe_subscription.entitlements
            )
            return self.update_stripe_subscription(stripe_subscription.stripe_subscription_id, update_data)
        else:
            # Create new record
            return self.create_stripe_subscription(stripe_subscription)

    def get_subscriptions_by_entitlement(self, entitlement_key: str, entitlement_value: str) -> List[StripeSubscription]:
        """
        Get subscriptions with specific entitlement key-value pair.
        Useful for access control based on plan features.
        """
        result = self.client.table(self.table).select("*").contains("entitlements", {entitlement_key: entitlement_value}).execute()
        return [StripeSubscription(**subscription) for subscription in result.data]

    def get_subscriptions_by_tier(self, tier: str) -> List[StripeSubscription]:
        """
        Get subscriptions for a specific tier (e.g., 'pro', 'basic').
        """
        return self.get_subscriptions_by_entitlement("tier", tier)

    def get_subscriptions_expiring_soon(self, days_ahead: int = 7) -> List[StripeSubscription]:
        """
        Get subscriptions that are expiring within the specified number of days.
        This is useful for renewal notifications.
        """
        from datetime import datetime, timedelta
        future_date = datetime.utcnow() + timedelta(days=days_ahead)

        result = self.client.table(self.table).select("*").lte("current_period_end", future_date.isoformat()).eq("status_effective", "active").execute()
        return [StripeSubscription(**subscription) for subscription in result.data]

    def cancel_subscription_at_period_end(self, stripe_subscription_id: str) -> Optional[StripeSubscription]:
        """
        Mark a subscription to cancel at the end of the current period.
        """
        update_data = StripeSubscriptionUpdate(cancel_at_period_end=True)
        return self.update_stripe_subscription(stripe_subscription_id, update_data)

    def reactivate_subscription(self, stripe_subscription_id: str) -> Optional[StripeSubscription]:
        """
        Reactivate a subscription (remove cancel_at_period_end flag).
        """
        update_data = StripeSubscriptionUpdate(cancel_at_period_end=False)
        return self.update_stripe_subscription(stripe_subscription_id, update_data)
