"""Stripe webhook orchestration for processing Stripe events."""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID
from app.services.db.service import DatabaseService
from app.services.billing.service import BillingService
from app.models.db.stripe_webhook_events import StripeWebhookEventCreate, StripeWebhookEventUpdate
from app.models.db.stripe_customers import StripeCustomerCreate
from app.models.db.stripe_prices import StripePriceCreate
from app.models.db.stripe_subscriptions import StripeSubscriptionCreate, StripeSubscriptionUpdate
from app.models.db.stripe_invoices import StripeInvoiceCreate, StripeInvoiceUpdate
from app.models.db.accounts import AccountCreate

# Set up logger
logger = logging.getLogger(__name__)


class StripeWebhookOrchestrator:
    """Orchestrates Stripe webhook event processing and coordinates between services."""

    def __init__(self, billing_service: BillingService, db: DatabaseService):
        """Initialize webhook orchestrator with billing service and database service."""
        self.billing_service = billing_service
        self.db = db

    async def verify_and_process_webhook(
        self,
        payload: bytes,
        sig_header: str
    ) -> Dict[str, Any]:
        """
        Verify webhook signature and process the event.

        Args:
            payload: Raw webhook payload
            sig_header: Stripe signature header

        Returns:
            dict: Processing result
        """
        logger.info("Starting webhook verification and processing")

        try:
            # Verify webhook signature and construct event
            logger.debug("Verifying webhook signature")
            event_data = self.billing_service.construct_webhook_event(
                payload=payload,
                sig_header=sig_header
            )
            logger.info(f"Webhook signature verified successfully. Event ID: {event_data.get('id', 'unknown')}")
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {str(e)}")
            return {"status": "error", "message": f"Webhook signature verification failed: {str(e)}"}

        # Validate event structure
        logger.debug("Validating webhook event structure")
        if not self.billing_service.validate_webhook_event(event_data):
            logger.error("Invalid webhook event structure")
            return {"status": "error", "message": "Invalid webhook event structure"}

        # Check if event type is supported
        event_type = event_data.get('type')
        logger.info(f"Processing webhook event type: {event_type}")

        if not self.billing_service.is_supported_webhook_event(event_type):
            logger.info(f"Ignoring unsupported event type: {event_type}")
            return {"status": "ignored", "message": f"Unsupported event type: {event_type}"}

        # Process the verified event
        logger.info(f"Processing webhook event: {event_type} (ID: {event_data.get('id', 'unknown')})")
        return await self.process_webhook_event(event_data, payload, sig_header)

    async def process_webhook_event(
        self,
        event_data: Dict[str, Any],
        payload: bytes,
        sig_header: str
    ) -> Dict[str, Any]:
        """
        Process a Stripe webhook event.

        Args:
            event_data: Parsed webhook event data
            payload: Raw webhook payload
            sig_header: Stripe signature header

        Returns:
            dict: Processing result
        """
        event_id = event_data.get('id')
        event_type = event_data.get('type')

        logger.info(f"Processing webhook event: {event_type} (ID: {event_id})")

        # Check if event already processed (idempotency)
        if event_id and self._is_event_processed(event_id):
            logger.info(f"Event {event_id} already processed, skipping")
            return {"status": "already_processed", "event_id": event_id}

        # Log webhook event
        logger.debug(f"Logging webhook event to database: {event_id}")
        webhook_event = await self._log_webhook_event(event_data, payload)

        try:
            # Process based on event type
            logger.debug(f"Routing webhook event {event_type} to handler")
            result = await self._route_webhook_event(event_type, event_data)

            # Mark as processed
            logger.info(f"Webhook event {event_id} processed successfully")
            await self._mark_event_processed(webhook_event.id)

            return {
                "status": "processed",
                "event_id": event_id,
                "event_type": event_type,
                "result": result
            }

        except Exception as e:
            # Mark as failed
            logger.error(f"Webhook event {event_id} processing failed: {str(e)}")
            await self._mark_event_failed(webhook_event.id, str(e))

            return {
                "status": "failed",
                "event_id": event_id,
                "event_type": event_type,
                "error": str(e)
            }

    # Webhook Event Handlers
    async def handle_checkout_session_completed(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle checkout.session.completed webhook.
        Link Stripe customer to our account.
        """
        logger.info("Handling checkout.session.completed webhook")

        try:
            session_data = event_data.get('data', {}).get('object', {})
            customer_id = session_data.get('customer')
            customer_email = session_data.get('customer_email')

            logger.info(f"Checkout session - Customer ID: {customer_id}, Email: {customer_email}")

            if not customer_id:
                logger.error("Missing customer ID in checkout session")
                raise ValueError("Missing customer ID in checkout session")

            # Get customer details from Stripe
            logger.debug(f"Fetching Stripe customer details for ID: {customer_id}")
            try:
                stripe_customer = self.billing_service.get_customer(customer_id)
                logger.debug(f"Stripe customer fetched: {stripe_customer}")
            except Exception as e:
                logger.error(f"Failed to fetch Stripe customer {customer_id}: {str(e)}")
                raise

            # Get email from Stripe customer if not in session
            if not customer_email:
                customer_email = stripe_customer.get('email')
                logger.info(f"Retrieved customer email from Stripe: {customer_email}")

            if not customer_email:
                logger.error("Missing customer email in checkout session and Stripe customer")
                raise ValueError("Missing customer email in checkout session and Stripe customer")

            # Find or create user account
            logger.debug(f"Looking up user by email: {customer_email}")
            try:
                user = await self._find_user_by_email(customer_email)
                logger.debug(f"User lookup result: {user}")
            except Exception as e:
                logger.error(f"Failed to lookup user by email {customer_email}: {str(e)}")
                raise

            if not user:
                logger.error(f"User not found for email: {customer_email}")
                raise ValueError(f"User not found for email: {customer_email}")

            # Get or create account
            logger.debug(f"Getting or creating account for user: {user.id}")
            try:
                account = await self._get_or_create_user_account(user)
                logger.debug(f"Account result: {account}")
            except Exception as e:
                logger.error(f"Failed to get or create account for user {user.id}: {str(e)}")
                raise

            # Create or update Stripe customer record
            logger.debug(f"Creating/updating Stripe customer record for account: {account.id}")
            try:
                customer_data = StripeCustomerCreate(
                    account_id=account.id,
                    stripe_customer_id=customer_id,
                    billing_email=customer_email
                )
                logger.debug(f"StripeCustomerCreate object: {customer_data}")
            except Exception as e:
                logger.error(f"Failed to create StripeCustomerCreate object: {str(e)}")
                raise

            try:
                stripe_customer_record = self.db.stripe_customers_repo.upsert_stripe_customer(customer_data)
                logger.debug(f"Stripe customer record created/updated: {stripe_customer_record}")
            except Exception as e:
                logger.error(f"Failed to upsert Stripe customer record: {str(e)}")
                raise

            logger.info(f"Successfully linked Stripe customer {customer_id} to account {account.id}")

            return {
                "action": "customer_linked",
                "account_id": str(account.id),
                "stripe_customer_id": customer_id
            }

        except Exception as e:
            logger.error(f"Error in handle_checkout_session_completed: {str(e)}", exc_info=True)
            raise

    async def handle_subscription_created(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle customer.subscription.created webhook.
        Create subscription record and grant access.
        """
        logger.info("Handling customer.subscription.created webhook")

        try:
            subscription_data = event_data.get('data', {}).get('object', {})
            subscription_id = subscription_data.get('id')
            customer_id = subscription_data.get('customer')

            logger.info(f"Subscription created - ID: {subscription_id}, Customer: {customer_id}")

            if not subscription_id or not customer_id:
                logger.error(f"Missing subscription or customer information - subscription_id: {subscription_id}, customer_id: {customer_id}")
                raise ValueError("Missing subscription or customer information")

            # Get Stripe customer record
            logger.debug(f"Looking up Stripe customer by ID: {customer_id}")
            try:
                stripe_customer = self.db.stripe_customers_repo.get_stripe_customer_by_stripe_id(customer_id)
                logger.debug(f"Stripe customer lookup result: {stripe_customer}")
            except Exception as e:
                logger.error(f"Failed to lookup Stripe customer {customer_id}: {str(e)}")
                raise

            if not stripe_customer:
                logger.error(f"Stripe customer not found: {customer_id}")
                raise ValueError(f"Stripe customer not found: {customer_id}")

            # Get price information
            logger.debug("Extracting price ID from subscription data")
            try:
                price_id = self.billing_service.utils.extract_price_id_from_subscription(subscription_data)
                logger.debug(f"Extracted price ID: {price_id}")
            except Exception as e:
                logger.error(f"Failed to extract price ID from subscription: {str(e)}")
                logger.error(f"Subscription data items: {subscription_data.get('items', {})}")
                raise

            if not price_id:
                logger.error(f"Could not extract price ID from subscription data: {subscription_data.get('items', {})}")
                raise ValueError("Could not extract price ID from subscription")

            # Get or create price record
            logger.debug(f"Looking up price record for ID: {price_id}")
            try:
                price = self.db.stripe_prices_repo.get_stripe_price_by_id(price_id)
                logger.debug(f"Price lookup result: {price}")
            except Exception as e:
                logger.error(f"Failed to lookup price {price_id}: {str(e)}")
                raise

            if not price:
                logger.debug(f"Price not found locally, fetching from Stripe: {price_id}")
                try:
                    stripe_price = self.billing_service.get_price(price_id)
                    logger.debug(f"Stripe price fetched: {stripe_price}")
                except Exception as e:
                    logger.error(f"Failed to fetch Stripe price {price_id}: {str(e)}")
                    raise

                try:
                    price_data = StripePriceCreate(
                        stripe_price_id=stripe_price['id'],
                        stripe_product_id=stripe_price['product'],
                        nickname=stripe_price.get('nickname'),
                        unit_amount=stripe_price['unit_amount'],
                        currency=stripe_price['currency'],
                        interval=stripe_price['recurring']['interval'],
                        metadata=stripe_price.get('metadata', {})
                    )
                    logger.debug(f"Creating price record: {price_data}")
                    price = self.db.stripe_prices_repo.create_stripe_price(price_data)
                    logger.debug(f"Price record created: {price}")
                except Exception as e:
                    logger.error(f"Failed to create price record: {str(e)}")
                    raise

            # Calculate effective status
            logger.debug("Calculating effective subscription status")
            try:
                raw_status = subscription_data.get('status')
                effective_status = self.billing_service.map_subscription_status(raw_status, subscription_data)
                logger.debug(f"Status mapping - raw: {raw_status}, effective: {effective_status}")
            except Exception as e:
                logger.error(f"Failed to calculate effective status: {str(e)}")
                raise

            # Calculate entitlements
            logger.debug("Calculating entitlements from subscription")
            try:
                entitlements = self.billing_service.calculate_entitlements_from_subscription(
                    subscription_data, price.metadata
                )
                logger.debug(f"Calculated entitlements: {entitlements}")
            except Exception as e:
                logger.error(f"Failed to calculate entitlements: {str(e)}")
                raise

            # Create subscription record
            logger.debug("Creating StripeSubscriptionCreate object")
            try:
                subscription_create = StripeSubscriptionCreate(
                    stripe_subscription_id=subscription_id,
                    account_id=stripe_customer.account_id,
                    status_raw=raw_status,
                    status_effective=effective_status,
                    cancel_at_period_end=subscription_data.get('cancel_at_period_end', False),
                    current_period_start=self.billing_service.utils.parse_stripe_timestamp(
                        subscription_data.get('current_period_start')
                    ),
                    current_period_end=self.billing_service.utils.parse_stripe_timestamp(
                        subscription_data.get('current_period_end')
                    ),
                    trial_start=self.billing_service.utils.parse_stripe_timestamp(
                        subscription_data.get('trial_start')
                    ),
                    trial_end=self.billing_service.utils.parse_stripe_timestamp(
                        subscription_data.get('trial_end')
                    ),
                    pause_collection=subscription_data.get('pause_collection') is not None and subscription_data.get('pause_collection', {}).get('behavior') == 'pause',
                    entitlements=entitlements
                )
                logger.debug(f"StripeSubscriptionCreate object created: {subscription_create}")
            except Exception as e:
                logger.error(f"Failed to create StripeSubscriptionCreate object: {str(e)}")
                logger.error(f"Subscription data: {subscription_data}")
                raise

            logger.debug("Creating subscription record in database")
            try:
                subscription = self.db.stripe_subscriptions_repo.create_stripe_subscription(subscription_create)
                logger.debug(f"Subscription record created: {subscription}")
            except Exception as e:
                logger.error(f"Failed to create subscription record in database: {str(e)}")
                raise

            logger.info(f"Subscription {subscription_id} created successfully")

            return {
                "action": "subscription_created",
                "subscription_id": subscription_id,
                "account_id": str(stripe_customer.account_id),
                "status": effective_status,
                "entitlements": entitlements
            }

        except Exception as e:
            logger.error(f"Error in handle_subscription_created: {str(e)}", exc_info=True)
            raise

    async def handle_subscription_updated(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle customer.subscription.updated webhook.
        Update subscription record and recalculate entitlements.
        """
        subscription_data = event_data.get('data', {}).get('object', {})
        subscription_id = subscription_data.get('id')

        if not subscription_id:
            raise ValueError("Missing subscription ID")

        # Get existing subscription
        existing_subscription = self.db.stripe_subscriptions_repo.get_stripe_subscription_by_id(subscription_id)
        if not existing_subscription:
            raise ValueError(f"Subscription not found: {subscription_id}")

        # Calculate new effective status
        raw_status = subscription_data.get('status')
        effective_status = self.billing_service.map_subscription_status(raw_status, subscription_data)

        # Get price information for entitlements
        price_id = self.billing_service.utils.extract_price_id_from_subscription(subscription_data)
        price_metadata = {}
        if price_id:
            price = self.db.stripe_prices_repo.get_stripe_price_by_id(price_id)
            if price:
                price_metadata = price.metadata

        # Calculate new entitlements
        entitlements = self.billing_service.calculate_entitlements_from_subscription(
            subscription_data, price_metadata
        )

        # Update subscription record
        update_data = StripeSubscriptionUpdate(
            status_raw=raw_status,
            status_effective=effective_status,
            cancel_at_period_end=subscription_data.get('cancel_at_period_end', False),
            current_period_start=self.billing_service.utils.parse_stripe_timestamp(
                subscription_data.get('current_period_start')
            ),
            current_period_end=self.billing_service.utils.parse_stripe_timestamp(
                subscription_data.get('current_period_end')
            ),
            trial_start=self.billing_service.utils.parse_stripe_timestamp(
                subscription_data.get('trial_start')
            ),
            trial_end=self.billing_service.utils.parse_stripe_timestamp(
                subscription_data.get('trial_end')
            ),
            pause_collection=subscription_data.get('pause_collection') is not None and subscription_data.get('pause_collection', {}).get('behavior') == 'pause',
            entitlements=entitlements
        )

        updated_subscription = self.db.stripe_subscriptions_repo.update_stripe_subscription(
            subscription_id, update_data
        )

        return {
            "action": "subscription_updated",
            "subscription_id": subscription_id,
            "status": effective_status,
            "entitlements": entitlements
        }

    async def handle_subscription_deleted(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle customer.subscription.deleted webhook.
        Mark subscription as inactive and revoke access.
        """
        subscription_data = event_data.get('data', {}).get('object', {})
        subscription_id = subscription_data.get('id')

        if not subscription_id:
            raise ValueError("Missing subscription ID")

        # Update subscription to inactive
        update_data = StripeSubscriptionUpdate(
            status_raw=subscription_data.get('status'),
            status_effective='inactive',
            cancel_at_period_end=False
        )

        updated_subscription = self.db.stripe_subscriptions_repo.update_stripe_subscription(
            subscription_id, update_data
        )

        return {
            "action": "subscription_deleted",
            "subscription_id": subscription_id,
            "status": "inactive"
        }

    async def handle_invoice_finalized(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle invoice.finalized webhook.
        Record invoice history for reconciliation.
        """
        logger.info("Handling invoice.finalized webhook")

        try:
            invoice_data = event_data.get('data', {}).get('object', {})
            invoice_id = invoice_data.get('id')
            subscription_id = invoice_data.get('subscription')

            logger.info(f"Invoice finalized - ID: {invoice_id}, Subscription: {subscription_id}")

            if not invoice_id:
                logger.error("Missing invoice ID in invoice.finalized webhook")
                raise ValueError("Missing invoice information")

            # Create or update invoice record
            logger.debug("Creating StripeInvoiceCreate object")
            try:
                invoice_create = StripeInvoiceCreate(
                    stripe_invoice_id=invoice_id,
                    stripe_subscription_id=subscription_id,  # Can be None for one-time payments
                    status=invoice_data.get('status'),
                    amount_due=invoice_data.get('amount_due', 0),
                    amount_paid=invoice_data.get('amount_paid', 0),
                    hosted_invoice_url=invoice_data.get('hosted_invoice_url')
                )
                logger.debug(f"StripeInvoiceCreate object created: {invoice_create}")
            except Exception as e:
                logger.error(f"Failed to create StripeInvoiceCreate object: {str(e)}")
                logger.error(f"Invoice data: {invoice_data}")
                raise

            logger.debug(f"Creating invoice record: {invoice_id}")
            try:
                invoice = self.db.stripe_invoices_repo.upsert_stripe_invoice(invoice_create)
                logger.debug(f"Invoice record created/updated: {invoice}")
            except Exception as e:
                logger.error(f"Failed to create/update invoice record: {str(e)}")
                raise

            logger.info(f"Invoice record created/updated: {invoice_id}")

            return {
                "action": "invoice_recorded",
                "invoice_id": invoice_id,
                "subscription_id": subscription_id
            }

        except Exception as e:
            logger.error(f"Error in handle_invoice_finalized: {str(e)}", exc_info=True)
            raise

    async def handle_invoice_paid(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle invoice.paid webhook.
        Mark billing cycle as paid.
        """
        logger.info("Handling invoice.paid webhook")

        try:
            invoice_data = event_data.get('data', {}).get('object', {})
            invoice_id = invoice_data.get('id')
            amount_paid = invoice_data.get('amount_paid', 0)

            logger.info(f"Invoice paid - ID: {invoice_id}, Amount: {amount_paid}")

            if not invoice_id:
                logger.error("Missing invoice ID in invoice.paid webhook")
                raise ValueError("Missing invoice ID")

            # Mark invoice as paid
            logger.debug(f"Marking invoice as paid: {invoice_id}")
            try:
                updated_invoice = self.db.stripe_invoices_repo.mark_invoice_as_paid(invoice_id, amount_paid)
                logger.debug(f"Invoice marked as paid: {updated_invoice}")
            except Exception as e:
                logger.error(f"Failed to mark invoice as paid: {str(e)}")
                raise

            logger.info(f"Invoice {invoice_id} marked as paid successfully")

            return {
                "action": "invoice_paid",
                "invoice_id": invoice_id,
                "amount_paid": amount_paid
            }

        except Exception as e:
            logger.error(f"Error in handle_invoice_paid: {str(e)}", exc_info=True)
            raise

    # Private Helper Methods
    async def _route_webhook_event(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Route webhook event to appropriate handler."""
        logger.debug(f"Routing webhook event type: {event_type}")

        handlers = {
            'checkout.session.completed': self.handle_checkout_session_completed,
            'customer.subscription.created': self.handle_subscription_created,
            'customer.subscription.updated': self.handle_subscription_updated,
            'customer.subscription.deleted': self.handle_subscription_deleted,
            'invoice.finalized': self.handle_invoice_finalized,
            'invoice.paid': self.handle_invoice_paid
        }

        handler = handlers.get(event_type)
        if not handler:
            logger.error(f"Unsupported webhook event type: {event_type}")
            raise ValueError(f"Unsupported webhook event type: {event_type}")

        logger.debug(f"Calling handler for event type: {event_type}")
        return await handler(event_data)

    async def _log_webhook_event(self, event_data: Dict[str, Any], payload: bytes) -> Any:
        """Log webhook event for idempotency and debugging."""
        logger.debug(f"Logging webhook event to database: {event_data.get('id')}")

        webhook_event_data = StripeWebhookEventCreate(
            stripe_event_id=event_data.get('id'),
            type=event_data.get('type'),
            payload=event_data,
            status='pending'
        )

        webhook_event = self.db.stripe_webhook_events_repo.upsert_webhook_event(webhook_event_data)
        logger.debug(f"Webhook event logged with ID: {webhook_event.id}")
        return webhook_event

    def _is_event_processed(self, event_id: str) -> bool:
        """Check if webhook event has already been processed."""
        return self.db.stripe_webhook_events_repo.is_event_processed(event_id)

    async def _mark_event_processed(self, event_id: UUID) -> None:
        """Mark webhook event as processed."""
        logger.debug(f"Marking webhook event as processed: {event_id}")
        self.db.stripe_webhook_events_repo.mark_event_as_processed(str(event_id))

    async def _mark_event_failed(self, event_id: UUID, error_message: str) -> None:
        """Mark webhook event as failed."""
        logger.error(f"Marking webhook event as failed: {event_id}, Error: {error_message}")
        self.db.stripe_webhook_events_repo.mark_event_as_failed(str(event_id), error_message)

    async def _find_user_by_email(self, email: str) -> Optional[Any]:
        """Find user by email address."""
        return self.db.users_repo.get_user_by_email(email)

    async def _get_or_create_user_account(self, user: Any) -> Any:
        """Get or create user account."""
        account = self.db.accounts_repo.get_user_account(user.id)

        if not account:
            account_data = AccountCreate(
                type="user",
                user_id=user.id,
                owner_user_id=user.id
            )
            account = self.db.accounts_repo.create_account(account_data)

        return account
