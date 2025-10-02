"""Stripe API client for billing operations."""

import stripe
from typing import Dict, Any, Optional, List
from app.config.settings import get_settings


class StripeClient:
    """Client for interacting with Stripe API."""

    def __init__(self):
        """Initialize Stripe client with configuration."""
        settings = get_settings()
        stripe.api_key = settings.stripe_secret_key.get_secret_value()
        self.config = settings.get_stripe_config()

    # Customer Operations
    def create_customer(self, email: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Create a new Stripe customer."""
        return stripe.Customer.create(
            email=email,
            name=name
        )

    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Get a Stripe customer by ID."""
        return stripe.Customer.retrieve(customer_id)

    def update_customer(self, customer_id: str, **kwargs) -> Dict[str, Any]:
        """Update a Stripe customer."""
        return stripe.Customer.modify(customer_id, **kwargs)

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
        session_data = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price': price_id,
                'quantity': 1,
            }],
            'mode': 'subscription',
            'success_url': success_url,
            'cancel_url': cancel_url,
        }

        if customer_id:
            session_data['customer'] = customer_id
        else:
            session_data['customer_email'] = customer_email

        return stripe.checkout.Session.create(**session_data)

    def get_checkout_session(self, session_id: str) -> Dict[str, Any]:
        """Get a Stripe checkout session by ID."""
        return stripe.checkout.Session.retrieve(session_id)

    # Subscription Operations
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get a Stripe subscription by ID."""
        return stripe.Subscription.retrieve(subscription_id)

    def update_subscription(self, subscription_id: str, **kwargs) -> Dict[str, Any]:
        """Update a Stripe subscription."""
        return stripe.Subscription.modify(subscription_id, **kwargs)

    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> Dict[str, Any]:
        """Cancel a Stripe subscription."""
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=at_period_end
        )

    def reactivate_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Reactivate a cancelled Stripe subscription."""
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )

    # Price Operations
    def get_price(self, price_id: str) -> Dict[str, Any]:
        """Get a Stripe price by ID."""
        return stripe.Price.retrieve(price_id)

    def list_prices(self, product_id: Optional[str] = None, active: bool = True) -> List[Dict[str, Any]]:
        """List Stripe prices."""
        params = {'active': active}
        if product_id:
            params['product'] = product_id

        return stripe.Price.list(**params).data

    # Invoice Operations
    def get_invoice(self, invoice_id: str) -> Dict[str, Any]:
        """Get a Stripe invoice by ID."""
        return stripe.Invoice.retrieve(invoice_id)

    def list_invoices(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """List invoices for a customer."""
        return stripe.Invoice.list(
            customer=customer_id,
            limit=limit
        ).data

    # Webhook Operations
    def construct_webhook_event(self, payload: bytes, sig_header: str, webhook_secret: str) -> Dict[str, Any]:
        """Construct and verify a webhook event."""
        return stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )

    # Customer Portal
    def create_portal_session(self, customer_id: str, return_url: str) -> Dict[str, Any]:
        """Create a customer portal session."""
        return stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url
        )
