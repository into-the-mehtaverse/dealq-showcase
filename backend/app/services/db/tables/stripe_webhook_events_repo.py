from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.stripe_webhook_events import StripeWebhookEvent, StripeWebhookEventCreate, StripeWebhookEventUpdate


class StripeWebhookEventsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "stripe_webhook_events"

    def create_webhook_event(self, webhook_event: StripeWebhookEventCreate) -> StripeWebhookEvent:
        """Create a new webhook event record."""
        event_data = webhook_event.model_dump(exclude_unset=True)

        # Convert UUID fields to strings for JSON serialization
        if event_data.get('id'):
            event_data['id'] = str(event_data['id'])

        result = self.client.table(self.table).insert(event_data).execute()
        return StripeWebhookEvent(**result.data[0])

    def get_webhook_event_by_id(self, event_id: UUID) -> Optional[StripeWebhookEvent]:
        """Get a webhook event by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(event_id)).execute()
        if result.data:
            return StripeWebhookEvent(**result.data[0])
        return None

    def get_webhook_event_by_stripe_id(self, stripe_event_id: str) -> Optional[StripeWebhookEvent]:
        """Get a webhook event by Stripe event ID."""
        result = self.client.table(self.table).select("*").eq("stripe_event_id", stripe_event_id).execute()
        if result.data:
            return StripeWebhookEvent(**result.data[0])
        return None

    def get_webhook_events_by_type(self, event_type: str) -> List[StripeWebhookEvent]:
        """Get all webhook events of a specific type."""
        result = self.client.table(self.table).select("*").eq("type", event_type).execute()
        return [StripeWebhookEvent(**event) for event in result.data]

    def get_webhook_events_by_status(self, status: str) -> List[StripeWebhookEvent]:
        """Get all webhook events with a specific status."""
        result = self.client.table(self.table).select("*").eq("status", status).execute()
        return [StripeWebhookEvent(**event) for event in result.data]

    def get_pending_webhook_events(self) -> List[StripeWebhookEvent]:
        """Get all pending webhook events."""
        return self.get_webhook_events_by_status("pending")

    def get_processed_webhook_events(self) -> List[StripeWebhookEvent]:
        """Get all processed webhook events."""
        return self.get_webhook_events_by_status("processed")

    def get_failed_webhook_events(self) -> List[StripeWebhookEvent]:
        """Get all failed webhook events."""
        return self.get_webhook_events_by_status("failed")

    def get_all_webhook_events(self) -> List[StripeWebhookEvent]:
        """Get all webhook events."""
        result = self.client.table(self.table).select("*").execute()
        return [StripeWebhookEvent(**event) for event in result.data]

    def update_webhook_event(self, event_id: UUID, event_update: StripeWebhookEventUpdate) -> Optional[StripeWebhookEvent]:
        """Update a webhook event by ID."""
        update_data = event_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_webhook_event_by_id(event_id)

        # Convert UUID fields to strings for JSON serialization
        if 'id' in update_data and update_data['id'] is not None:
            update_data['id'] = str(update_data['id'])

        result = self.client.table(self.table).update(update_data).eq("id", str(event_id)).execute()
        if result.data:
            return StripeWebhookEvent(**result.data[0])
        return None

    def update_webhook_event_by_stripe_id(self, stripe_event_id: str, event_update: StripeWebhookEventUpdate) -> Optional[StripeWebhookEvent]:
        """Update a webhook event by Stripe event ID."""
        update_data = event_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_webhook_event_by_stripe_id(stripe_event_id)

        # Convert UUID fields to strings for JSON serialization
        if 'id' in update_data and update_data['id'] is not None:
            update_data['id'] = str(update_data['id'])

        # Convert datetime fields to ISO format strings for JSON serialization
        for key, value in update_data.items():
            if hasattr(value, 'isoformat'):  # Check if it's a datetime object
                update_data[key] = value.isoformat()

        result = self.client.table(self.table).update(update_data).eq("stripe_event_id", stripe_event_id).execute()
        if result.data:
            return StripeWebhookEvent(**result.data[0])
        return None

    def delete_webhook_event(self, event_id: UUID) -> bool:
        """Delete a webhook event by ID."""
        result = self.client.table(self.table).delete().eq("id", str(event_id)).execute()
        return len(result.data) > 0

    def delete_webhook_event_by_stripe_id(self, stripe_event_id: str) -> bool:
        """Delete a webhook event by Stripe event ID."""
        result = self.client.table(self.table).delete().eq("stripe_event_id", stripe_event_id).execute()
        return len(result.data) > 0

    def upsert_webhook_event(self, webhook_event: StripeWebhookEventCreate) -> StripeWebhookEvent:
        """
        Upsert a webhook event record.
        This is useful for webhook handlers where we want to create or update.
        """
        # Try to get existing event by Stripe event ID first
        existing = self.get_webhook_event_by_stripe_id(webhook_event.stripe_event_id)

        if existing:
            # Update existing record
            update_data = StripeWebhookEventUpdate(
                type=webhook_event.type,
                payload=webhook_event.payload,
                processed_at=webhook_event.processed_at,
                status=webhook_event.status,
                error_message=webhook_event.error_message
            )
            return self.update_webhook_event(existing.id, update_data)
        else:
            # Create new record
            return self.create_webhook_event(webhook_event)

    def mark_event_as_processed(self, stripe_event_id: str) -> Optional[StripeWebhookEvent]:
        """
        Mark a webhook event as processed.
        This is a convenience method for webhook processing.
        """
        from datetime import datetime
        update_data = StripeWebhookEventUpdate(
            status="processed",
            processed_at=datetime.utcnow()
        )
        return self.update_webhook_event_by_stripe_id(stripe_event_id, update_data)

    def mark_event_as_failed(self, stripe_event_id: str, error_message: str) -> Optional[StripeWebhookEvent]:
        """
        Mark a webhook event as failed with an error message.
        This is a convenience method for webhook processing.
        """
        from datetime import datetime
        update_data = StripeWebhookEventUpdate(
            status="failed",
            processed_at=datetime.utcnow(),
            error_message=error_message
        )
        return self.update_webhook_event_by_stripe_id(stripe_event_id, update_data)

    def is_event_processed(self, stripe_event_id: str) -> bool:
        """
        Check if a webhook event has already been processed.
        This is useful for idempotency checks.
        """
        event = self.get_webhook_event_by_stripe_id(stripe_event_id)
        return event is not None

    def get_recent_events_by_type(self, event_type: str, limit: int = 10) -> List[StripeWebhookEvent]:
        """
        Get recent webhook events of a specific type, ordered by creation time.
        """
        result = self.client.table(self.table).select("*").eq("type", event_type).order("created_at", desc=True).limit(limit).execute()
        return [StripeWebhookEvent(**event) for event in result.data]

    def get_events_by_date_range(self, start_date: str, end_date: str) -> List[StripeWebhookEvent]:
        """
        Get webhook events within a date range.
        Date strings should be in ISO format.
        """
        result = self.client.table(self.table).select("*").gte("created_at", start_date).lte("created_at", end_date).execute()
        return [StripeWebhookEvent(**event) for event in result.data]

    def cleanup_old_events(self, days_to_keep: int = 30) -> int:
        """
        Delete webhook events older than the specified number of days.
        Returns the number of events deleted.
        """
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

        result = self.client.table(self.table).delete().lt("created_at", cutoff_date.isoformat()).execute()
        return len(result.data)
