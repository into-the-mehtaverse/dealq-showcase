"""Billing orchestration for coordinating billing operations."""

from typing import Dict, Any, Optional, List
from uuid import UUID
from app.services.db.service import DatabaseService
from app.services.billing.service import BillingService
from app.models.db.accounts import AccountCreate
from app.models.db.stripe_customers import StripeCustomerCreate
from app.models.db.stripe_prices import StripePriceCreate
from app.models.db.stripe_subscriptions import StripeSubscriptionCreate
from app.models.db.users import User


class BillingOrchestrator:
    """Orchestrates billing operations and coordinates between services."""

    def __init__(self, billing_service: BillingService, db: DatabaseService):
        """Initialize billing orchestrator with billing service and database service."""
        self.billing_service = billing_service
        self.db = db

    # Checkout Session Operations
    async def create_checkout_session(
        self,
        user: User,
        price_id: str,
        success_url: str,
        cancel_url: str
    ) -> Dict[str, Any]:
        """
        Create a Stripe checkout session for user subscription.

        Args:
            user: Authenticated user
            price_id: Stripe price ID for the subscription
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled

        Returns:
            dict: Checkout session data with checkout_url and session_id
        """
        # Get or create user's account
        account = await self._get_or_create_user_account(user)

        # Get or create Stripe customer
        stripe_customer = await self._get_or_create_stripe_customer(account.id, user.email)

        # Create checkout session
        checkout_session = self.billing_service.create_checkout_session(
            customer_email=user.email,
            price_id=price_id,
            success_url=success_url,
            cancel_url=cancel_url,
            customer_id=stripe_customer.stripe_customer_id
        )

        return {
            "checkout_url": checkout_session["url"],
            "session_id": checkout_session["id"]
        }

    async def get_checkout_session(self, session_id: str) -> Dict[str, Any]:
        """Get checkout session details."""
        return self.billing_service.get_checkout_session(session_id)

    # Billing Information
    async def get_billing_info(self, user: User) -> Dict[str, Any]:
        """
        Get comprehensive billing information for user.

        Args:
            user: Authenticated user

        Returns:
            dict: Billing information including subscription, usage, and limits
        """
        # Get user's account
        account = await self._get_user_account(user)
        if not account:
            return self._get_default_billing_info(user)

        # Get Stripe customer
        stripe_customer = self.db.stripe_customers_repo.get_stripe_customer_by_account_id(account.id)
        if not stripe_customer:
            return self._get_default_billing_info(user)

        # Get active subscription
        subscriptions = self.db.stripe_subscriptions_repo.get_stripe_subscriptions_by_account_id(account.id)
        if not subscriptions:
            return self._get_default_billing_info(user)

        # Get the first active subscription (should only be one for user accounts)
        subscription = subscriptions[0]

        # Get price information
        price = self.db.stripe_prices_repo.get_stripe_price_by_id(subscription.stripe_subscription_id)
        price_metadata = price.metadata if price else {}

        # Calculate entitlements
        entitlements = self.billing_service.calculate_entitlements_from_subscription(
            subscription.__dict__, price_metadata
        )

        # Get usage data (this would come from your deals system)
        deals_used = await self._get_user_deals_usage(user.id)

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "subscription_tier": entitlements.get("tier", "starter"),
                "deals_used": deals_used,
                "deals_limit": entitlements.get("monthly_deals_limit", 20)
            },
            "subscription": {
                "id": subscription.stripe_subscription_id,
                "status": subscription.status_effective,
                "current_period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
                "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None
            },
            "limits": {
                "monthly_deals_limit": entitlements.get("monthly_deals_limit", 20),
                "features": entitlements.get("features", [])
            },
            "billing_period": {
                "start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
                "end": subscription.current_period_end.isoformat() if subscription.current_period_end else None
            }
        }

    # Subscription Management
    async def cancel_subscription(self, user: User) -> Dict[str, Any]:
        """
        Cancel user's subscription.

        Args:
            user: Authenticated user

        Returns:
            dict: Cancellation result
        """
        # Get user's account and subscription
        account = await self._get_user_account(user)
        if not account:
            raise ValueError("No account found for user")

        subscriptions = self.db.stripe_subscriptions_repo.get_stripe_subscriptions_by_account_id(account.id)
        if not subscriptions:
            raise ValueError("No active subscription found")

        subscription = subscriptions[0]

        # Cancel subscription in Stripe
        stripe_subscription = self.billing_service.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=True
        )

        # Update local subscription record
        from app.models.db.stripe_subscriptions import StripeSubscriptionUpdate
        update_data = StripeSubscriptionUpdate(
            cancel_at_period_end=True,
            status_raw=stripe_subscription["status"]
        )

        updated_subscription = self.db.stripe_subscriptions_repo.update_stripe_subscription(
            subscription.stripe_subscription_id, update_data
        )

        return {
            "success": True,
            "message": "Subscription will be cancelled at the end of the current period",
            "cancel_at_period_end": True,
            "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None
        }

    async def reactivate_subscription(self, user: User) -> Dict[str, Any]:
        """
        Reactivate user's cancelled subscription.

        Args:
            user: Authenticated user

        Returns:
            dict: Reactivation result
        """
        # Get user's account and subscription
        account = await self._get_user_account(user)
        if not account:
            raise ValueError("No account found for user")

        subscriptions = self.db.stripe_subscriptions_repo.get_stripe_subscriptions_by_account_id(account.id)
        if not subscriptions:
            raise ValueError("No subscription found")

        subscription = subscriptions[0]

        # Reactivate subscription in Stripe
        stripe_subscription = self.billing_service.reactivate_subscription(
            subscription.stripe_subscription_id
        )

        # Update local subscription record
        from app.models.db.stripe_subscriptions import StripeSubscriptionUpdate
        update_data = StripeSubscriptionUpdate(
            cancel_at_period_end=False,
            status_raw=stripe_subscription["status"]
        )

        updated_subscription = self.db.stripe_subscriptions_repo.update_stripe_subscription(
            subscription.stripe_subscription_id, update_data
        )

        return {
            "success": True,
            "message": "Subscription has been reactivated",
            "cancel_at_period_end": False
        }

    # Access Control
    async def check_feature_access(self, user: User, feature: str) -> bool:
        """
        Check if user has access to a specific feature.

        Args:
            user: Authenticated user
            feature: Feature name to check

        Returns:
            bool: True if user has access
        """
        entitlements = await self._get_user_entitlements(user)
        return self.billing_service.check_feature_access(entitlements, feature)

    async def check_deal_limit(self, user: User) -> Dict[str, Any]:
        """
        Check if user can create more deals.

        Args:
            user: Authenticated user

        Returns:
            dict: Deal limit information
        """
        entitlements = await self._get_user_entitlements(user)
        deals_used = await self._get_user_deals_usage(user.id)

        return self.billing_service.check_deal_limit(entitlements, deals_used)

    # Customer Portal
    async def create_customer_portal_session(self, user: User, return_url: str) -> Dict[str, Any]:
        """
        Create a Stripe customer portal session.

        Args:
            user: Authenticated user
            return_url: URL to return to after portal session

        Returns:
            dict: Portal session data
        """
        # Get user's account and Stripe customer
        account = await self._get_user_account(user)
        if not account:
            raise ValueError("No account found for user")

        stripe_customer = self.db.stripe_customers_repo.get_stripe_customer_by_account_id(account.id)
        if not stripe_customer:
            raise ValueError("No Stripe customer found")

        # Create portal session
        portal_session = self.billing_service.create_customer_portal_session(
            stripe_customer.stripe_customer_id,
            return_url
        )

        return {
            "portal_url": portal_session["url"]
        }

    # Private Helper Methods
    async def _get_or_create_user_account(self, user: User):
        """Get or create user account."""
        account = self.db.accounts_repo.get_user_account(user.id)

        if not account:
            # Create new account for user
            account_data = AccountCreate(
                type="user",
                user_id=user.id,
                owner_user_id=user.id
            )
            account = self.db.accounts_repo.create_account(account_data)

        return account

    async def _get_user_account(self, user: User):
        """Get user's account."""
        return self.db.accounts_repo.get_user_account(user.id)

    async def _get_or_create_stripe_customer(self, account_id: UUID, email: str):
        """Get or create Stripe customer for account."""
        stripe_customer = self.db.stripe_customers_repo.get_stripe_customer_by_account_id(account_id)

        if not stripe_customer:
            # Create Stripe customer
            stripe_customer_data = self.billing_service.create_customer(email)

            # Save to database
            customer_data = StripeCustomerCreate(
                account_id=account_id,
                stripe_customer_id=stripe_customer_data["id"],
                billing_email=email
            )
            stripe_customer = self.db.stripe_customers_repo.create_stripe_customer(customer_data)

        return stripe_customer

    async def _get_user_entitlements(self, user: User) -> Dict[str, Any]:
        """Get user's entitlements."""
        account = await self._get_user_account(user)
        if not account:
            return self._get_default_entitlements()

        subscriptions = self.db.stripe_subscriptions_repo.get_stripe_subscriptions_by_account_id(account.id)
        if not subscriptions:
            return self._get_default_entitlements()

        subscription = subscriptions[0]

        # Get price metadata
        price = self.db.stripe_prices_repo.get_stripe_price_by_id(subscription.stripe_subscription_id)
        price_metadata = price.metadata if price else {}

        return self.billing_service.calculate_entitlements_from_subscription(
            subscription.__dict__, price_metadata
        )

    async def _get_user_deals_usage(self, user_id: UUID) -> int:
        """Get user's current deals usage for the period."""
        # This would integrate with your deals system
        # For now, return 0 as placeholder
        return 0

    def _get_default_billing_info(self, user: User) -> Dict[str, Any]:
        """Get default billing info for user without subscription."""
        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "subscription_tier": "starter",
                "deals_used": 0,
                "deals_limit": 20
            },
            "subscription": None,
            "limits": {
                "monthly_deals_limit": 20,
                "features": ["basic_underwriting", "pdf_analysis", "excel_analysis", "standard_reporting"]
            },
            "billing_period": {
                "start": None,
                "end": None
            }
        }

    def _get_default_entitlements(self) -> Dict[str, Any]:
        """Get default entitlements for user without subscription."""
        return {
            "tier": "starter",
            "monthly_deals_limit": 20,
            "features": ["basic_underwriting", "pdf_analysis", "excel_analysis", "standard_reporting"],
            "max_seats": 1
        }

    # Subscription Status Check
    async def get_user_subscription_status(self, user: User) -> Optional[Dict[str, Any]]:
        """
        Get user's subscription status - returns None if no active subscription.

        Args:
            user: Authenticated user

        Returns:
            dict: Subscription status info if user has active subscription, None otherwise
        """
        # Get user's account
        account = await self._get_user_account(user)
        if not account:
            return None

        # Get active subscription
        subscriptions = self.db.stripe_subscriptions_repo.get_stripe_subscriptions_by_account_id(account.id)
        if not subscriptions:
            return None

        subscription = subscriptions[0]

        # Only return if subscription is active or in grace period
        if subscription.status_effective in ["active", "grace"]:
            return {
                "subscription_id": subscription.stripe_subscription_id,
                "status": subscription.status_effective,
                "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None
            }

        return None
