"""Supabase client initialization for storage operations."""

from typing import Optional
from supabase import create_client, Client
from app.config.settings import get_settings

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create the Supabase client instance.

    Returns:
        Client: Initialized Supabase client

    Raises:
        ValueError: If required environment variables are not set
    """
    global _supabase_client

    if _supabase_client is None:
        # Get configuration from centralized settings
        settings = get_settings()
        supabase_config = settings.get_supabase_config()

        _supabase_client = create_client(
            supabase_config["url"],
            supabase_config["service_role_key"]
        )

    return _supabase_client


def get_storage_config() -> dict:
    """
    Get storage configuration from centralized settings.

    Returns:
        dict: Storage configuration with bucket name and storage URL
    """
    settings = get_settings()
    return settings.get_storage_config()
