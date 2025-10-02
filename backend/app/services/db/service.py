from supabase import Client
from typing import List
from uuid import UUID
from app.services.db.tables.users_repo import UsersRepository
from app.services.db.tables.uploads_repo import UploadsRepository
from app.services.db.tables.upload_files_repo import UploadFilesRepository
from app.services.db.tables.deals_repo import DealsRepository
from app.services.db.tables.om_classifications_repo import OMClassificationsRepository
from app.services.db.tables.jobs_repo import JobsRepository
from app.services.db.tables.accounts_repo import AccountsRepository
from app.services.db.tables.stripe_customers_repo import StripeCustomersRepository
from app.services.db.tables.stripe_prices_repo import StripePricesRepository
from app.services.db.tables.stripe_invoices_repo import StripeInvoicesRepository
from app.services.db.tables.stripe_subscriptions_repo import StripeSubscriptionsRepository
from app.services.db.tables.stripe_webhook_events_repo import StripeWebhookEventsRepository
from app.models.db.upload_files import UploadFile


class DatabaseService:
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.users_repo = UsersRepository(supabase_client)
        self.uploads_repo = UploadsRepository(supabase_client)
        self.upload_files_repo = UploadFilesRepository(supabase_client)
        self.deals_repo = DealsRepository(supabase_client)
        self.om_classifications_repo = OMClassificationsRepository(supabase_client)
        self.jobs_repo = JobsRepository(supabase_client)
        self.accounts_repo = AccountsRepository(supabase_client)
        self.stripe_customers_repo = StripeCustomersRepository(supabase_client)
        self.stripe_prices_repo = StripePricesRepository(supabase_client)
        self.stripe_invoices_repo = StripeInvoicesRepository(supabase_client)
        self.stripe_subscriptions_repo = StripeSubscriptionsRepository(supabase_client)
        self.stripe_webhook_events_repo = StripeWebhookEventsRepository(supabase_client)
        self.seed_user_id = '11111111-1111-1111-1111-111111111111'

    def get_all_files_for_deal(self, deal_id: UUID) -> List[UploadFile]:
        """
        Get all files associated with a deal.

        Args:
            deal_id: UUID of the deal

        Returns:
            List[UploadFile]: List of all files associated with the deal
        """
        files = []

        # Get all uploads for the deal
        uploads = self.uploads_repo.get_uploads_by_deal_id(deal_id)

        # Get all files for each upload
        for upload in uploads:
            upload_files = self.upload_files_repo.get_upload_files_by_upload_id(upload.id)
            files.extend(upload_files)

        return files
