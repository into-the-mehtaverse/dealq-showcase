"""Status normalization logic for subscription states."""

from typing import Dict, Any, Optional
from datetime import datetime


class SubscriptionStatusMapper:
    """Maps raw Stripe statuses to effective statuses and handles state transitions."""

    # Raw Stripe statuses to effective status mapping
    STATUS_MAPPING = {
        # Active states
        'active': 'active',
        'trialing': 'active',

        # Grace period states (past due but still active)
        'past_due': 'grace',
        'unpaid': 'grace',

        # Paused states
        'paused': 'paused',

        # Inactive states
        'canceled': 'inactive',
        'incomplete': 'inactive',
        'incomplete_expired': 'inactive',
        'unpaid': 'inactive'  # After grace period
    }

    def map_raw_to_effective_status(self, raw_status: str, subscription_data: Dict[str, Any]) -> str:
        """
        Map raw Stripe status to effective status.

        Args:
            raw_status: Raw Stripe subscription status
            subscription_data: Full subscription object from Stripe

        Returns:
            str: Effective status (active, grace, paused, inactive)
        """
        # Handle special cases based on subscription data
        if raw_status == 'past_due':
            # Check if we should put in grace or mark as inactive
            if self._should_put_in_grace_period(subscription_data):
                return 'grace'
            else:
                return 'inactive'

        if raw_status == 'paused':
            # Check if pause collection is enabled
            if subscription_data.get('pause_collection'):
                return 'paused'
            else:
                return 'active'

        # Default mapping
        return self.STATUS_MAPPING.get(raw_status, 'inactive')

    def _should_put_in_grace_period(self, subscription_data: Dict[str, Any]) -> bool:
        """
        Determine if subscription should be in grace period.

        Args:
            subscription_data: Full subscription object from Stripe

        Returns:
            bool: True if should be in grace period
        """
        # Check if subscription has been past due for less than 7 days
        current_time = datetime.utcnow()

        # Get the last invoice to check payment failure date
        last_invoice = subscription_data.get('latest_invoice')
        if last_invoice and isinstance(last_invoice, dict):
            invoice_created = last_invoice.get('created')
            if invoice_created:
                # Convert timestamp to datetime
                if isinstance(invoice_created, (int, float)):
                    invoice_date = datetime.fromtimestamp(invoice_created)
                else:
                    invoice_date = datetime.fromisoformat(str(invoice_created).replace('Z', '+00:00'))

                # If invoice is less than 7 days old, put in grace
                days_since_invoice = (current_time - invoice_date).days
                return days_since_invoice <= 7

        return True  # Default to grace period

    def is_subscription_active(self, effective_status: str) -> bool:
        """
        Check if subscription is considered active.

        Args:
            effective_status: Effective subscription status

        Returns:
            bool: True if subscription is active
        """
        return effective_status in ['active', 'grace']

    def is_subscription_cancelled(self, effective_status: str, subscription_data: Dict[str, Any]) -> bool:
        """
        Check if subscription is cancelled.

        Args:
            effective_status: Effective subscription status
            subscription_data: Full subscription object from Stripe

        Returns:
            bool: True if subscription is cancelled
        """
        if effective_status == 'inactive':
            return True

        # Check if cancel_at_period_end is true
        if subscription_data.get('cancel_at_period_end'):
            return True

        return False

    def should_grant_access(self, effective_status: str) -> bool:
        """
        Determine if user should have access based on effective status.

        Args:
            effective_status: Effective subscription status

        Returns:
            bool: True if user should have access
        """
        return effective_status in ['active', 'grace']

    def get_status_display_name(self, effective_status: str) -> str:
        """
        Get human-readable status name.

        Args:
            effective_status: Effective subscription status

        Returns:
            str: Display name for status
        """
        display_names = {
            'active': 'Active',
            'grace': 'Past Due (Grace Period)',
            'paused': 'Paused',
            'inactive': 'Inactive'
        }

        return display_names.get(effective_status, 'Unknown')

    def get_status_description(self, effective_status: str, subscription_data: Dict[str, Any]) -> str:
        """
        Get detailed status description.

        Args:
            effective_status: Effective subscription status
            subscription_data: Full subscription object from Stripe

        Returns:
            str: Detailed status description
        """
        descriptions = {
            'active': 'Your subscription is active and in good standing.',
            'grace': 'Your payment is past due. Please update your payment method to avoid service interruption.',
            'paused': 'Your subscription is paused. You can resume it anytime.',
            'inactive': 'Your subscription is inactive. Please subscribe to continue using the service.'
        }

        base_description = descriptions.get(effective_status, 'Unknown status.')

        # Add additional context for specific cases
        if effective_status == 'inactive' and subscription_data.get('cancel_at_period_end'):
            period_end = subscription_data.get('current_period_end')
            if period_end:
                base_description += f" Your subscription will end on {period_end}."

        return base_description

    def calculate_next_billing_date(self, subscription_data: Dict[str, Any]) -> Optional[str]:
        """
        Calculate next billing date.

        Args:
            subscription_data: Full subscription object from Stripe

        Returns:
            str: Next billing date in ISO format, or None
        """
        current_period_end = subscription_data.get('current_period_end')
        if not current_period_end:
            return None

        # Convert to datetime if needed
        if isinstance(current_period_end, (int, float)):
            return datetime.fromtimestamp(current_period_end).isoformat()
        elif isinstance(current_period_end, str):
            return current_period_end

        return None

    def get_subscription_health_score(self, effective_status: str, subscription_data: Dict[str, Any]) -> int:
        """
        Get subscription health score (0-100).

        Args:
            effective_status: Effective subscription status
            subscription_data: Full subscription object from Stripe

        Returns:
            int: Health score (0-100)
        """
        if effective_status == 'active':
            return 100
        elif effective_status == 'grace':
            # Calculate grace period remaining
            current_time = datetime.utcnow()
            period_end = subscription_data.get('current_period_end')

            if period_end:
                if isinstance(period_end, (int, float)):
                    period_end_dt = datetime.fromtimestamp(period_end)
                else:
                    period_end_dt = datetime.fromisoformat(str(period_end).replace('Z', '+00:00'))

                days_remaining = (period_end_dt - current_time).days
                # Score decreases as grace period approaches end
                return max(20, 100 - (7 - days_remaining) * 10)

            return 50  # Default grace period score
        elif effective_status == 'paused':
            return 75  # Paused but can be resumed
        else:  # inactive
            return 0

    def should_send_notification(self, old_status: str, new_status: str) -> bool:
        """
        Determine if notification should be sent for status change.

        Args:
            old_status: Previous effective status
            new_status: New effective status

        Returns:
            bool: True if notification should be sent
        """
        # Notify on significant status changes
        significant_changes = [
            ('inactive', 'active'),  # Subscription activated
            ('active', 'inactive'),  # Subscription cancelled
            ('active', 'grace'),     # Payment failed
            ('grace', 'active'),     # Payment recovered
            ('grace', 'inactive'),   # Grace period expired
        ]

        return (old_status, new_status) in significant_changes

    def get_status_transition_actions(self, old_status: str, new_status: str) -> list[str]:
        """
        Get actions to take based on status transition.

        Args:
            old_status: Previous effective status
            new_status: New effective status

        Returns:
            list: Actions to take
        """
        actions = []

        if old_status != new_status:
            if new_status == 'active':
                actions.extend(['grant_access', 'send_welcome_email'])
            elif new_status == 'grace':
                actions.extend(['send_payment_failed_email', 'show_payment_warning'])
            elif new_status == 'inactive':
                actions.extend(['revoke_access', 'send_cancellation_email'])
            elif new_status == 'paused':
                actions.extend(['send_pause_confirmation'])

        return actions
