"""
Cache utilities for key generation and TTL management.

This module provides helper functions for creating consistent cache keys
and managing TTL values across the application.
"""

from typing import Optional, Union
from datetime import datetime, timedelta


def generate_cache_key(prefix: str, user_id: str, *args) -> str:
    """
    Generate a consistent cache key with user scoping.

    Args:
        prefix: Cache key prefix (e.g., "signed_url", "deal", "pipeline")
        user_id: User identifier for scoping
        *args: Additional key components

    Returns:
        Formatted cache key string

    Example:
        >>> generate_cache_key("signed_url", "user123", "file.pdf", 3600)
        "signed_url:user123:file.pdf:3600"
    """
    # Ensure all components are strings and clean
    components = [prefix, str(user_id)]
    components.extend([str(arg) for arg in args if arg is not None])

    # Filter out empty strings and join with colons
    clean_components = [comp for comp in components if comp.strip()]
    return ":".join(clean_components)


def generate_signed_url_key(user_id: str, file_path: str, expires_in: int) -> str:
    """
    Generate a cache key for signed URLs.

    Args:
        user_id: User identifier
        file_path: Path to the file
        expires_in: Expiration time in seconds

    Returns:
        Cache key for signed URL
    """
    return generate_cache_key("signed_url", user_id, file_path, expires_in)


def generate_deal_key(user_id: str, deal_id: str, suffix: Optional[str] = None) -> str:
    """
    Generate a cache key for deal-related data.

    Args:
        user_id: User identifier
        deal_id: Deal identifier
        suffix: Optional suffix for specific deal data (e.g., "files", "metrics")

    Returns:
        Cache key for deal data
    """
    if suffix:
        return generate_cache_key("deal", user_id, deal_id, suffix)
    return generate_cache_key("deal", user_id, deal_id)


def generate_pipeline_key(user_id: str, pipeline_id: str, stage: Optional[str] = None) -> str:
    """
    Generate a cache key for pipeline-related data.

    Args:
        user_id: User identifier
        pipeline_id: Pipeline identifier
        stage: Optional pipeline stage

    Returns:
        Cache key for pipeline data
    """
    if stage:
        return generate_cache_key("pipeline", user_id, pipeline_id, stage)
    return generate_cache_key("pipeline", user_id, pipeline_id)


def generate_user_pattern(user_id: str) -> str:
    """
    Generate a Redis pattern for all keys belonging to a user.

    Args:
        user_id: User identifier

    Returns:
        Redis pattern for user keys

    Example:
        >>> generate_user_pattern("user123")
        "*:user123:*"
    """
    return f"*:{user_id}:*"


def calculate_ttl_for_signed_url(expires_in: int, buffer_minutes: int = 15) -> int:
    """
    Calculate TTL for signed URL caching with buffer.

    Args:
        expires_in: Original expiration time in seconds
        buffer_minutes: Buffer time in minutes before actual expiration

    Returns:
        TTL in seconds for caching

    Example:
        >>> calculate_ttl_for_signed_url(3600, 15)
        2700  # 45 minutes (1 hour - 15 minutes buffer)
    """
    buffer_seconds = buffer_minutes * 60
    return max(expires_in - buffer_seconds, 60)  # Minimum 1 minute TTL


def get_default_ttl(cache_type: str) -> int:
    """
    Get default TTL for different cache types.

    Args:
        cache_type: Type of cached data

    Returns:
        Default TTL in seconds
    """
    ttl_map = {
        "signed_url": 2700,      # 45 minutes
        "deal": 1800,            # 30 minutes
        "pipeline": 900,         # 15 minutes
        "user_preferences": 3600, # 1 hour
        "analytics": 7200,       # 2 hours
        "default": 2700          # 45 minutes
    }

    return ttl_map.get(cache_type, ttl_map["default"])


def is_cache_key_expiring_soon(key: str, current_ttl: int, warning_threshold: int = 300) -> bool:
    """
    Check if a cache key is expiring soon.

    Args:
        key: Cache key
        current_ttl: Current TTL in seconds
        warning_threshold: Threshold in seconds to consider "expiring soon"

    Returns:
        True if key is expiring soon, False otherwise
    """
    return current_ttl is not None and current_ttl <= warning_threshold


def format_cache_key_for_logging(key: str) -> str:
    """
    Format cache key for safe logging (truncate long keys).

    Args:
        key: Cache key to format

    Returns:
        Formatted key safe for logging
    """
    if len(key) <= 100:
        return key

    # Truncate long keys for logging
    return f"{key[:50]}...{key[-50:]}"


def validate_cache_key(key: str) -> bool:
    """
    Validate cache key format and length.

    Args:
        key: Cache key to validate

    Returns:
        True if key is valid, False otherwise
    """
    if not key or not isinstance(key, str):
        return False

    # Check key length (Redis has a limit of 512MB, but we'll be more conservative)
    if len(key) > 1000:
        return False

    # Check for invalid characters (Redis allows most characters, but we'll be safe)
    invalid_chars = ['\x00', '\r', '\n']
    if any(char in key for char in invalid_chars):
        return False

    return True
