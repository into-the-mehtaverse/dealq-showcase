"""Webhook security and validation utilities."""

import hashlib
import hmac
import time
from typing import Dict, Any, Optional
from app.config.settings import get_settings


class WebhookValidator:
    """Handles Stripe webhook security and validation."""

    def __init__(self):
        """Initialize webhook validator with settings."""
        settings = get_settings()
        self.webhook_secret = settings.stripe_webhook_secret.get_secret_value()

    def verify_webhook_signature(
        self,
        payload: bytes,
        sig_header: str,
        webhook_secret: Optional[str] = None
    ) -> bool:
        """
        Verify Stripe webhook signature.

        Args:
            payload: Raw request body
            sig_header: Stripe-Signature header value
            webhook_secret: Webhook secret (uses default if None)

        Returns:
            bool: True if signature is valid
        """
        try:
            secret = webhook_secret or self.webhook_secret

            # Parse the signature header
            elements = sig_header.split(',')
            timestamp = None
            signature = None

            for element in elements:
                key, value = element.split('=')
                if key == 't':
                    timestamp = value
                elif key == 'v1':
                    signature = value

            if not timestamp or not signature:
                return False

            # Check timestamp (reject if older than 5 minutes)
            current_time = int(time.time())
            if current_time - int(timestamp) > 300:  # 5 minutes
                return False

            # Create expected signature
            signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
            expected_signature = hmac.new(
                secret.encode('utf-8'),
                signed_payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            # Compare signatures
            return hmac.compare_digest(signature, expected_signature)

        except Exception:
            return False

    def validate_webhook_payload(self, event_data: Dict[str, Any]) -> bool:
        """
        Validate webhook payload structure.

        Args:
            event_data: Parsed webhook event data

        Returns:
            bool: True if payload is valid
        """
        required_fields = ['id', 'type', 'data', 'created']

        # Check required fields exist
        if not all(field in event_data for field in required_fields):
            return False

        # Check data object exists
        if not isinstance(event_data.get('data'), dict):
            return False

        # Check object field exists in data
        if 'object' not in event_data['data']:
            return False

        return True

    def extract_event_type(self, event_data: Dict[str, Any]) -> Optional[str]:
        """
        Extract event type from webhook payload.

        Args:
            event_data: Parsed webhook event data

        Returns:
            str: Event type or None if invalid
        """
        if not self.validate_webhook_payload(event_data):
            return None

        return event_data.get('type')

    def extract_object_data(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract object data from webhook payload.

        Args:
            event_data: Parsed webhook event data

        Returns:
            dict: Object data or None if invalid
        """
        if not self.validate_webhook_payload(event_data):
            return None

        return event_data.get('data', {}).get('object')

    def generate_idempotency_key(self, event_id: str, event_type: str) -> str:
        """
        Generate idempotency key for webhook processing.

        Args:
            event_id: Stripe event ID
            event_type: Event type

        Returns:
            str: Unique idempotency key
        """
        return f"{event_type}:{event_id}"

    def is_supported_event_type(self, event_type: str) -> bool:
        """
        Check if event type is supported by our webhook handlers.

        Args:
            event_type: Stripe event type

        Returns:
            bool: True if supported
        """
        supported_events = {
            'checkout.session.completed',
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'invoice.finalized',
            'invoice.paid'
        }

        return event_type in supported_events

    def validate_checkout_session_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Validate checkout.session.completed event structure.

        Args:
            event_data: Parsed webhook event data

        Returns:
            bool: True if valid checkout session event
        """
        if event_data.get('type') != 'checkout.session.completed':
            return False

        object_data = self.extract_object_data(event_data)
        if not object_data:
            return False

        required_fields = ['id', 'customer', 'subscription', 'payment_status']
        return all(field in object_data for field in required_fields)

    def validate_subscription_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Validate subscription-related event structure.

        Args:
            event_data: Parsed webhook event data

        Returns:
            bool: True if valid subscription event
        """
        event_type = event_data.get('type', '')
        if not event_type.startswith('customer.subscription.'):
            return False

        object_data = self.extract_object_data(event_data)
        if not object_data:
            return False

        required_fields = ['id', 'customer', 'status', 'current_period_start', 'current_period_end']
        return all(field in object_data for field in required_fields)

    def validate_invoice_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Validate invoice-related event structure.

        Args:
            event_data: Parsed webhook event data

        Returns:
            bool: True if valid invoice event
        """
        event_type = event_data.get('type', '')
        if not event_type.startswith('invoice.'):
            return False

        object_data = self.extract_object_data(event_data)
        if not object_data:
            return False

        required_fields = ['id', 'customer', 'subscription', 'status', 'amount_due', 'amount_paid']
        return all(field in object_data for field in required_fields)
