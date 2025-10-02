from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.users import User, UserCreate, UserUpdate


class UsersRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "users"

    def create_user(self, user: UserCreate) -> User:
        """Create a new user."""
        user_data = user.model_dump(exclude_unset=True)
        result = self.client.table(self.table).insert(user_data).execute()
        return User(**result.data[0])

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(user_id)).execute()
        if result.data:
            return User(**result.data[0])
        return None

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        result = self.client.table(self.table).select("*").eq("email", email).execute()
        if result.data:
            return User(**result.data[0])
        return None

    def get_all_users(self) -> List[User]:
        """Get all users."""
        result = self.client.table(self.table).select("*").execute()
        return [User(**user) for user in result.data]

    def update_user(self, user_id: UUID, user_update: UserUpdate) -> Optional[User]:
        """Update a user by ID."""
        update_data = user_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_user_by_id(user_id)


        result = self.client.table(self.table).update(update_data).eq("id", str(user_id)).execute()
        if result.data:
            return User(**result.data[0])
        return None

    def delete_user(self, user_id: UUID) -> bool:
        """Delete a user by ID."""
        result = self.client.table(self.table).delete().eq("id", str(user_id)).execute()
        return len(result.data) > 0
