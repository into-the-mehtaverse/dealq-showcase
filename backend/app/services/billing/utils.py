"""Shared utilities for billing operations."""

from typing import Dict, Any, Optional, List
from datetime import datetime
import re


class BillingUtils:
    """Shared utilities for billing operations."""

    # Price ID patterns for validation
    PRICE_ID_PATTERN = re.compile(r'^price_[a-zA-Z0-9]+$')
    CUSTOMER_ID_PATTERN = re.compile(r'^cus_[a-zA-Z0-9]+$')
    SUBSCRIPTION_ID_PATTERN = re.compile(r'^sub_[a-zA-Z0-9]+$')
    INVOICE_ID_PATTERN = re.compile(r'^in_[a-zA-Z0-9]+$')

    @staticmethod
    def validate_price_id(price_id: str) -> bool:
        """Validate Stripe price ID format."""
        return bool(BillingUtils.PRICE_ID_PATTERN.match(price_id))

    @staticmethod
    def validate_customer_id(customer_id: str) -> bool:
        """Validate Stripe customer ID format."""
        return bool(BillingUtils.CUSTOMER_ID_PATTERN.match(customer_id))

    @staticmethod
    def validate_subscription_id(subscription_id: str) -> bool:
        """Validate Stripe subscription ID format."""
        return bool(BillingUtils.SUBSCRIPTION_ID_PATTERN.match(subscription_id))

    @staticmethod
    def validate_invoice_id(invoice_id: str) -> bool:
        """Validate Stripe invoice ID format."""
        return bool(BillingUtils.INVOICE_ID_PATTERN.match(invoice_id))

    @staticmethod
    def format_amount_from_cents(amount_cents: int) -> float:
        """Convert amount from cents to dollars."""
        return amount_cents / 100.0

    @staticmethod
    def format_amount_to_cents(amount_dollars: float) -> int:
        """Convert amount from dollars to cents."""
        return int(amount_dollars * 100)

    @staticmethod
    def format_currency(amount_cents: int, currency: str = 'usd') -> str:
        """Format amount as currency string."""
        amount = BillingUtils.format_amount_from_cents(amount_cents)
        currency_symbols = {
            'usd': '$',
            'eur': '€',
            'gbp': '£'
        }
        symbol = currency_symbols.get(currency.lower(), currency.upper())
        return f"{symbol}{amount:.2f}"

    @staticmethod
    def parse_stripe_timestamp(timestamp: Any) -> Optional[datetime]:
        """Parse Stripe timestamp to datetime object."""
        if timestamp is None:
            return None

        if isinstance(timestamp, (int, float)):
            return datetime.fromtimestamp(timestamp)
        elif isinstance(timestamp, str):
            try:
                return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except ValueError:
                return None

        return None

    @staticmethod
    def format_stripe_timestamp(timestamp: Any) -> Optional[str]:
        """Format Stripe timestamp to ISO string."""
        dt = BillingUtils.parse_stripe_timestamp(timestamp)
        return dt.isoformat() if dt else None

    @staticmethod
    def extract_email_from_customer(customer_data: Dict[str, Any]) -> Optional[str]:
        """Extract email from Stripe customer data."""
        return customer_data.get('email')

    @staticmethod
    def extract_customer_id_from_subscription(subscription_data: Dict[str, Any]) -> Optional[str]:
        """Extract customer ID from Stripe subscription data."""
        customer = subscription_data.get('customer')
        if isinstance(customer, str):
            return customer
        elif isinstance(customer, dict):
            return customer.get('id')
        return None

    @staticmethod
    def extract_price_id_from_subscription(subscription_data: Dict[str, Any]) -> Optional[str]:
        """Extract price ID from Stripe subscription data."""
        items = subscription_data.get('items', {}).get('data', [])
        if items and len(items) > 0:
            price = items[0].get('price')
            if isinstance(price, str):
                return price
            elif isinstance(price, dict):
                return price.get('id')
        return None

    @staticmethod
    def is_trial_subscription(subscription_data: Dict[str, Any]) -> bool:
        """Check if subscription is in trial period."""
        trial_start = subscription_data.get('trial_start')
        trial_end = subscription_data.get('trial_end')

        if not trial_start or not trial_end:
            return False

        current_time = datetime.utcnow().timestamp()

        # Convert timestamps if needed
        if isinstance(trial_start, str):
            trial_start = datetime.fromisoformat(trial_start.replace('Z', '+00:00')).timestamp()
        if isinstance(trial_end, str):
            trial_end = datetime.fromisoformat(trial_end.replace('Z', '+00:00')).timestamp()

        return trial_start <= current_time <= trial_end

    @staticmethod
    def get_subscription_interval(subscription_data: Dict[str, Any]) -> Optional[str]:
        """Get subscription billing interval."""
        items = subscription_data.get('items', {}).get('data', [])
        if items and len(items) > 0:
            price = items[0].get('price', {})
            if isinstance(price, dict):
                return price.get('recurring', {}).get('interval')
        return None

    @staticmethod
    def calculate_proration_amount(
        old_price_cents: int,
        new_price_cents: int,
        days_remaining: int,
        total_days: int
    ) -> int:
        """Calculate proration amount for subscription changes."""
        if total_days == 0:
            return 0

        daily_old_rate = old_price_cents / total_days
        daily_new_rate = new_price_cents / total_days

        proration = (daily_new_rate - daily_old_rate) * days_remaining
        return int(proration)

    @staticmethod
    def sanitize_webhook_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize webhook payload for logging/storage."""
        # Remove sensitive data
        sensitive_keys = ['payment_method', 'card', 'bank_account', 'source']

        def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
            sanitized = {}
            for key, value in data.items():
                if key.lower() in sensitive_keys:
                    sanitized[key] = '[REDACTED]'
                elif isinstance(value, dict):
                    sanitized[key] = sanitize_dict(value)
                elif isinstance(value, list):
                    sanitized[key] = [
                        sanitize_dict(item) if isinstance(item, dict) else item
                        for item in value
                    ]
                else:
                    sanitized[key] = value
            return sanitized

        return sanitize_dict(payload)

    @staticmethod
    def generate_webhook_idempotency_key(event_id: str, event_type: str) -> str:
        """Generate idempotency key for webhook processing."""
        return f"webhook:{event_type}:{event_id}"

    @staticmethod
    def validate_webhook_timestamp(timestamp: int, max_age_seconds: int = 300) -> bool:
        """Validate webhook timestamp is not too old."""
        current_time = int(datetime.utcnow().timestamp())
        return (current_time - timestamp) <= max_age_seconds

    @staticmethod
    def extract_metadata_value(metadata: Dict[str, Any], key: str, default: Any = None) -> Any:
        """Extract value from Stripe metadata with type conversion."""
        value = metadata.get(key, default)

        # Convert string numbers to integers
        if isinstance(value, str) and value.isdigit():
            return int(value)

        # Convert string booleans
        if isinstance(value, str):
            if value.lower() == 'true':
                return True
            elif value.lower() == 'false':
                return False

        return value

    @staticmethod
    def build_webhook_error_message(error: Exception, event_type: str) -> str:
        """Build standardized error message for webhook processing."""
        return f"Webhook processing failed for {event_type}: {str(error)}"

    @staticmethod
    def is_webhook_retryable_error(error: Exception) -> bool:
        """Determine if webhook error is retryable."""
        retryable_errors = [
            'ConnectionError',
            'TimeoutError',
            'TemporaryFailure',
            'RateLimitError'
        ]

        error_type = type(error).__name__
        return any(retryable in error_type for retryable in retryable_errors)
