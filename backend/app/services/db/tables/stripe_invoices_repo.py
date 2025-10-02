from typing import List, Optional
from supabase import Client
from app.models.db.stripe_invoices import StripeInvoice, StripeInvoiceCreate, StripeInvoiceUpdate


class StripeInvoicesRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "stripe_invoices"

    def create_stripe_invoice(self, stripe_invoice: StripeInvoiceCreate) -> StripeInvoice:
        """Create a new Stripe invoice record."""
        invoice_data = stripe_invoice.model_dump(exclude_unset=True)
        result = self.client.table(self.table).insert(invoice_data).execute()
        return StripeInvoice(**result.data[0])

    def get_stripe_invoice_by_id(self, stripe_invoice_id: str) -> Optional[StripeInvoice]:
        """Get a Stripe invoice by Stripe invoice ID."""
        result = self.client.table(self.table).select("*").eq("stripe_invoice_id", stripe_invoice_id).execute()
        if result.data:
            return StripeInvoice(**result.data[0])
        return None

    def get_stripe_invoices_by_subscription_id(self, stripe_subscription_id: str) -> List[StripeInvoice]:
        """Get all invoices for a specific subscription."""
        result = self.client.table(self.table).select("*").eq("stripe_subscription_id", stripe_subscription_id).execute()
        return [StripeInvoice(**invoice) for invoice in result.data]

    def get_stripe_invoices_by_status(self, status: str) -> List[StripeInvoice]:
        """Get all invoices with a specific status."""
        result = self.client.table(self.table).select("*").eq("status", status).execute()
        return [StripeInvoice(**invoice) for invoice in result.data]

    def get_paid_invoices(self) -> List[StripeInvoice]:
        """Get all paid invoices."""
        return self.get_stripe_invoices_by_status("paid")

    def get_unpaid_invoices(self) -> List[StripeInvoice]:
        """Get all unpaid invoices (open, draft, etc.)."""
        result = self.client.table(self.table).select("*").in_("status", ["draft", "open", "uncollectible"]).execute()
        return [StripeInvoice(**invoice) for invoice in result.data]

    def get_all_stripe_invoices(self) -> List[StripeInvoice]:
        """Get all Stripe invoices."""
        result = self.client.table(self.table).select("*").execute()
        return [StripeInvoice(**invoice) for invoice in result.data]

    def update_stripe_invoice(self, stripe_invoice_id: str, invoice_update: StripeInvoiceUpdate) -> Optional[StripeInvoice]:
        """Update a Stripe invoice by Stripe invoice ID."""
        update_data = invoice_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_stripe_invoice_by_id(stripe_invoice_id)

        result = self.client.table(self.table).update(update_data).eq("stripe_invoice_id", stripe_invoice_id).execute()
        if result.data:
            return StripeInvoice(**result.data[0])
        return None

    def delete_stripe_invoice(self, stripe_invoice_id: str) -> bool:
        """Delete a Stripe invoice by Stripe invoice ID."""
        result = self.client.table(self.table).delete().eq("stripe_invoice_id", stripe_invoice_id).execute()
        return len(result.data) > 0

    def upsert_stripe_invoice(self, stripe_invoice: StripeInvoiceCreate) -> StripeInvoice:
        """
        Upsert a Stripe invoice record.
        This is useful for webhook handlers where we want to create or update.
        """
        # Try to get existing invoice first
        existing = self.get_stripe_invoice_by_id(stripe_invoice.stripe_invoice_id)

        if existing:
            # Update existing record
            update_data = StripeInvoiceUpdate(
                stripe_subscription_id=stripe_invoice.stripe_subscription_id,
                status=stripe_invoice.status,
                amount_due=stripe_invoice.amount_due,
                amount_paid=stripe_invoice.amount_paid,
                hosted_invoice_url=stripe_invoice.hosted_invoice_url
            )
            return self.update_stripe_invoice(stripe_invoice.stripe_invoice_id, update_data)
        else:
            # Create new record
            return self.create_stripe_invoice(stripe_invoice)

    def get_invoices_by_amount_range(self, min_amount: int, max_amount: int) -> List[StripeInvoice]:
        """
        Get invoices within a specific amount range (in cents).
        """
        result = self.client.table(self.table).select("*").gte("amount_due", min_amount).lte("amount_due", max_amount).execute()
        return [StripeInvoice(**invoice) for invoice in result.data]

    def get_latest_invoice_for_subscription(self, stripe_subscription_id: str) -> Optional[StripeInvoice]:
        """
        Get the most recent invoice for a subscription.
        """
        result = self.client.table(self.table).select("*").eq("stripe_subscription_id", stripe_subscription_id).order("created_at", desc=True).limit(1).execute()
        if result.data:
            return StripeInvoice(**result.data[0])
        return None

    def mark_invoice_as_paid(self, stripe_invoice_id: str, amount_paid: int) -> Optional[StripeInvoice]:
        """
        Mark an invoice as paid with the amount paid.
        This is a convenience method for the invoice.paid webhook.
        """
        update_data = StripeInvoiceUpdate(
            status="paid",
            amount_paid=amount_paid
        )
        return self.update_stripe_invoice(stripe_invoice_id, update_data)
