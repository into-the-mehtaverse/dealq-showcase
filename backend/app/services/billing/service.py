"""Pure billing service for business logic only."""

from typing import Dict, Any, Optional, List
from .stripe_client import StripeClient
from .webhook_validator import WebhookValidator
from .entitlements_calculator import EntitlementsCalculator
from .subscription_status_mapper import SubscriptionStatusMapper
from .utils import BillingUtils


class BillingService:
    """Pure billing service that handles business logic only."""

    def __init__(self):
        """Initialize billing service with all modules."""
        self.stripe_client = StripeClient()
        self.webhook_validator = WebhookValidator()
        self.entitlements_calculator = EntitlementsCalculator()
        self.status_mapper = SubscriptionStatusMapper()
        self.utils = BillingUtils()

    # Checkout Session Operations
    def create_checkout_session(
        self,
        customer_email: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        customer_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Stripe checkout session."""
        # Validate inputs
        if not self.utils.validate_price_id(price_id):
            raise ValueError(f"Invalid price ID format: {price_id}")

        if customer_id and not self.utils.validate_customer_id(customer_id):
            raise ValueError(f"Invalid customer ID format: {customer_id}")

        return self.stripe_client.create_checkout_session(
            customer_email=customer_email,
            price_id=price_id,
            success_url=success_url,
            cancel_url=cancel_url,
            customer_id=customer_id
        )

    def get_checkout_session(self, session_id: str) -> Dict[str, Any]:
        """Get a Stripe checkout session."""
        return self.stripe_client.get_checkout_session(session_id)

    # Customer Operations
    def create_customer(self, email: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Create a Stripe customer."""
        return self.stripe_client.create_customer(email=email, name=name)

    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Get a Stripe customer."""
        if not self.utils.validate_customer_id(customer_id):
            raise ValueError(f"Invalid customer ID format: {customer_id}")

        return self.stripe_client.get_customer(customer_id)

    # Subscription Operations
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get a Stripe subscription."""
        if not self.utils.validate_subscription_id(subscription_id):
            raise ValueError(f"Invalid subscription ID format: {subscription_id}")

        return self.stripe_client.get_subscription(subscription_id)

    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> Dict[str, Any]:
        """Cancel a Stripe subscription."""
        if not self.utils.validate_subscription_id(subscription_id):
            raise ValueError(f"Invalid subscription ID format: {subscription_id}")

        return self.stripe_client.cancel_subscription(subscription_id, at_period_end)

    def reactivate_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Reactivate a cancelled Stripe subscription."""
        if not self.utils.validate_subscription_id(subscription_id):
            raise ValueError(f"Invalid subscription ID format: {subscription_id}")

        return self.stripe_client.reactivate_subscription(subscription_id)

    # Price Operations
    def get_price(self, price_id: str) -> Dict[str, Any]:
        """Get a Stripe price."""
        if not self.utils.validate_price_id(price_id):
            raise ValueError(f"Invalid price ID format: {price_id}")

        return self.stripe_client.get_price(price_id)

    def list_prices(self, product_id: Optional[str] = None, active: bool = True) -> List[Dict[str, Any]]:
        """List Stripe prices."""
        return self.stripe_client.list_prices(product_id=product_id, active=active)

    # Invoice Operations
    def get_invoice(self, invoice_id: str) -> Dict[str, Any]:
        """Get a Stripe invoice."""
        if not self.utils.validate_invoice_id(invoice_id):
            raise ValueError(f"Invalid invoice ID format: {invoice_id}")

        return self.stripe_client.get_invoice(invoice_id)

    def list_invoices(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """List invoices for a customer."""
        if not self.utils.validate_customer_id(customer_id):
            raise ValueError(f"Invalid customer ID format: {customer_id}")

        return self.stripe_client.list_invoices(customer_id, limit)

    # Webhook Operations
    def verify_webhook_signature(
        self,
        payload: bytes,
        sig_header: str,
        webhook_secret: Optional[str] = None
    ) -> bool:
        """Verify Stripe webhook signature."""
        return self.webhook_validator.verify_webhook_signature(
            payload, sig_header, webhook_secret
        )

    def construct_webhook_event(
        self,
        payload: bytes,
        sig_header: str,
        webhook_secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """Construct and verify a webhook event."""
        secret = webhook_secret or self.webhook_validator.webhook_secret
        return self.stripe_client.construct_webhook_event(payload, sig_header, secret)

    def validate_webhook_event(self, event_data: Dict[str, Any]) -> bool:
        """Validate webhook event structure."""
        return self.webhook_validator.validate_webhook_payload(event_data)

    def is_supported_webhook_event(self, event_type: str) -> bool:
        """Check if webhook event type is supported."""
        return self.webhook_validator.is_supported_event_type(event_type)

    # Entitlements and Access Control
    def calculate_entitlements_from_subscription(
        self,
        subscription_data: Dict[str, Any],
        price_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Calculate user entitlements from subscription data."""
        return self.entitlements_calculator.calculate_entitlements_from_subscription(
            subscription_data, price_metadata
        )

    def calculate_entitlements_from_price_metadata(self, price_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate entitlements from price metadata."""
        return self.entitlements_calculator.calculate_entitlements_from_price_metadata(price_metadata)

    def check_feature_access(self, entitlements: Dict[str, Any], feature: str) -> bool:
        """Check if user has access to a feature."""
        return self.entitlements_calculator.check_feature_access(entitlements, feature)

    def check_deal_limit(self, entitlements: Dict[str, Any], current_usage: int) -> Dict[str, Any]:
        """Check if user can create more deals."""
        return self.entitlements_calculator.check_deal_limit(entitlements, current_usage)

    # Status Mapping
    def map_subscription_status(self, raw_status: str, subscription_data: Dict[str, Any]) -> str:
        """Map raw Stripe status to effective status."""
        return self.status_mapper.map_raw_to_effective_status(raw_status, subscription_data)

    def is_subscription_active(self, effective_status: str) -> bool:
        """Check if subscription is active."""
        return self.status_mapper.is_subscription_active(effective_status)

    def should_grant_access(self, effective_status: str) -> bool:
        """Determine if user should have access."""
        return self.status_mapper.should_grant_access(effective_status)

    # Customer Portal
    def create_customer_portal_session(self, customer_id: str, return_url: str) -> Dict[str, Any]:
        """Create a customer portal session."""
        if not self.utils.validate_customer_id(customer_id):
            raise ValueError(f"Invalid customer ID format: {customer_id}")

        return self.stripe_client.create_portal_session(customer_id, return_url)

    # Utility Methods
    def format_currency(self, amount_cents: int, currency: str = 'usd') -> str:
        """Format amount as currency string."""
        return self.utils.format_currency(amount_cents, currency)

    def parse_stripe_timestamp(self, timestamp: Any) -> Optional[str]:
        """Parse Stripe timestamp to ISO string."""
        return self.utils.format_stripe_timestamp(timestamp)

    def sanitize_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize webhook payload for logging."""
        return self.utils.sanitize_webhook_payload(payload)
