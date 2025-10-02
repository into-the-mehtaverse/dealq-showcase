from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.stripe_customers import StripeCustomer, StripeCustomerCreate, StripeCustomerUpdate


class StripeCustomersRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "stripe_customers"

    def create_stripe_customer(self, stripe_customer: StripeCustomerCreate) -> StripeCustomer:
        """Create a new Stripe customer record."""
        customer_data = stripe_customer.model_dump(exclude_unset=True)

        # Convert UUID fields to strings for JSON serialization
        if customer_data.get('account_id'):
            customer_data['account_id'] = str(customer_data['account_id'])

        result = self.client.table(self.table).insert(customer_data).execute()
        return StripeCustomer(**result.data[0])

    def get_stripe_customer_by_id(self, customer_id: UUID) -> Optional[StripeCustomer]:
        """Get a Stripe customer by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(customer_id)).execute()
        if result.data:
            return StripeCustomer(**result.data[0])
        return None

    def get_stripe_customer_by_stripe_id(self, stripe_customer_id: str) -> Optional[StripeCustomer]:
        """Get a Stripe customer by Stripe customer ID."""
        result = self.client.table(self.table).select("*").eq("stripe_customer_id", stripe_customer_id).execute()
        if result.data:
            return StripeCustomer(**result.data[0])
        return None

    def get_stripe_customer_by_account_id(self, account_id: UUID) -> Optional[StripeCustomer]:
        """Get a Stripe customer by account ID."""
        result = self.client.table(self.table).select("*").eq("account_id", str(account_id)).execute()
        if result.data:
            return StripeCustomer(**result.data[0])
        return None

    def get_all_stripe_customers(self) -> List[StripeCustomer]:
        """Get all Stripe customers."""
        result = self.client.table(self.table).select("*").execute()
        return [StripeCustomer(**customer) for customer in result.data]

    def update_stripe_customer(self, customer_id: UUID, customer_update: StripeCustomerUpdate) -> Optional[StripeCustomer]:
        """Update a Stripe customer by ID."""
        update_data = customer_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_stripe_customer_by_id(customer_id)

        # Convert UUID fields to strings for JSON serialization
        if 'account_id' in update_data and update_data['account_id'] is not None:
            update_data['account_id'] = str(update_data['account_id'])

        result = self.client.table(self.table).update(update_data).eq("id", str(customer_id)).execute()
        if result.data:
            return StripeCustomer(**result.data[0])
        return None

    def update_stripe_customer_by_stripe_id(self, stripe_customer_id: str, customer_update: StripeCustomerUpdate) -> Optional[StripeCustomer]:
        """Update a Stripe customer by Stripe customer ID."""
        update_data = customer_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_stripe_customer_by_stripe_id(stripe_customer_id)

        # Convert UUID fields to strings for JSON serialization
        if 'account_id' in update_data and update_data['account_id'] is not None:
            update_data['account_id'] = str(update_data['account_id'])

        result = self.client.table(self.table).update(update_data).eq("stripe_customer_id", stripe_customer_id).execute()
        if result.data:
            return StripeCustomer(**result.data[0])
        return None

    def delete_stripe_customer(self, customer_id: UUID) -> bool:
        """Delete a Stripe customer by ID."""
        result = self.client.table(self.table).delete().eq("id", str(customer_id)).execute()
        return len(result.data) > 0

    def delete_stripe_customer_by_stripe_id(self, stripe_customer_id: str) -> bool:
        """Delete a Stripe customer by Stripe customer ID."""
        result = self.client.table(self.table).delete().eq("stripe_customer_id", stripe_customer_id).execute()
        return len(result.data) > 0

    def upsert_stripe_customer(self, stripe_customer: StripeCustomerCreate) -> StripeCustomer:
        """
        Upsert a Stripe customer record.
        This is useful for webhook handlers where we want to create or update.
        """
        # Try to get existing customer by account_id first
        existing = self.get_stripe_customer_by_account_id(stripe_customer.account_id)

        if existing:
            # Update existing record
            update_data = StripeCustomerUpdate(
                stripe_customer_id=stripe_customer.stripe_customer_id,
                billing_email=stripe_customer.billing_email,
                default_payment_method_last4=stripe_customer.default_payment_method_last4
            )
            return self.update_stripe_customer(existing.id, update_data)
        else:
            # Create new record
            return self.create_stripe_customer(stripe_customer)
