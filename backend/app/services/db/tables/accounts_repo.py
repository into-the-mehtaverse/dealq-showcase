from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.accounts import Account, AccountCreate, AccountUpdate


class AccountsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "accounts"

    def create_account(self, account: AccountCreate) -> Account:
        """Create a new account."""
        account_data = account.model_dump(exclude_unset=True)

        # Convert UUID fields to strings for JSON serialization
        if account_data.get('user_id'):
            account_data['user_id'] = str(account_data['user_id'])
        if account_data.get('owner_user_id'):
            account_data['owner_user_id'] = str(account_data['owner_user_id'])

        result = self.client.table(self.table).insert(account_data).execute()
        return Account(**result.data[0])

    def get_account_by_id(self, account_id: UUID) -> Optional[Account]:
        """Get an account by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(account_id)).execute()
        if result.data:
            return Account(**result.data[0])
        return None

    def get_account_by_user_id(self, user_id: UUID) -> Optional[Account]:
        """Get an account by user_id (for user-type accounts)."""
        result = self.client.table(self.table).select("*").eq("user_id", str(user_id)).execute()
        if result.data:
            return Account(**result.data[0])
        return None

    def get_accounts_by_owner(self, owner_user_id: UUID) -> List[Account]:
        """Get all accounts owned by a user."""
        result = self.client.table(self.table).select("*").eq("owner_user_id", str(owner_user_id)).execute()
        return [Account(**account) for account in result.data]

    def get_all_accounts(self) -> List[Account]:
        """Get all accounts."""
        result = self.client.table(self.table).select("*").execute()
        return [Account(**account) for account in result.data]

    def update_account(self, account_id: UUID, account_update: AccountUpdate) -> Optional[Account]:
        """Update an account by ID."""
        update_data = account_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_account_by_id(account_id)

        # Convert UUID fields to strings for JSON serialization
        if 'user_id' in update_data and update_data['user_id'] is not None:
            update_data['user_id'] = str(update_data['user_id'])
        if 'owner_user_id' in update_data and update_data['owner_user_id'] is not None:
            update_data['owner_user_id'] = str(update_data['owner_user_id'])

        result = self.client.table(self.table).update(update_data).eq("id", str(account_id)).execute()
        if result.data:
            return Account(**result.data[0])
        return None

    def delete_account(self, account_id: UUID) -> bool:
        """Delete an account by ID."""
        result = self.client.table(self.table).delete().eq("id", str(account_id)).execute()
        return len(result.data) > 0

    def get_user_account(self, user_id: UUID) -> Optional[Account]:
        """
        Get the account for a specific user (user-type account).

        Args:
            user_id: User ID to get account for

        Returns:
            Account if user has one, None otherwise
        """
        return self.get_account_by_user_id(user_id)
