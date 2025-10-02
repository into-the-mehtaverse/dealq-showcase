"""
Cache service for handling Redis operations.

This service provides a clean interface for caching operations including
user-scoped key management and TTL handling.
"""

import json
from typing import Optional, Any, Union
from .redis_client import get_redis_client


class CacheService:
    """Service for handling Redis caching operations."""

    def __init__(self):
        """Initialize the cache service with Redis client."""
        self.redis_client = get_redis_client()
        self.default_ttl = 2700  # 45 minutes default

    def _is_available(self) -> bool:
        """Check if Redis is available for caching operations."""
        return self.redis_client.is_connected()

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a value from cache.

        Args:
            key: Cache key to retrieve

        Returns:
            Cached value or None if not found or Redis unavailable
        """
        if not self._is_available():
            return None

        try:
            value = self.redis_client.client.get(key)
            if value is None:
                return None

            # Try to deserialize JSON, fallback to string
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value

        except Exception as e:
            print(f"Error retrieving from cache: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Store a value in cache with optional TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (defaults to default_ttl)

        Returns:
            True if successful, False otherwise
        """
        if not self._is_available():
            return False

        try:
            # Use provided TTL or default
            expiration = ttl if ttl is not None else self.default_ttl

            # Serialize value to JSON if it's not a string
            if isinstance(value, str):
                serialized_value = value
            else:
                serialized_value = json.dumps(value)

            # Set with expiration
            result = self.redis_client.client.setex(key, expiration, serialized_value)
            return bool(result)

        except Exception as e:
            print(f"Error setting cache: {e}")
            return False

    def delete(self, key: str) -> bool:
        """
        Delete a specific key from cache.

        Args:
            key: Cache key to delete

        Returns:
            True if successful, False otherwise
        """
        if not self._is_available():
            return False

        try:
            result = self.redis_client.client.delete(key)
            return bool(result)
        except Exception as e:
            print(f"Error deleting from cache: {e}")
            return False

    def exists(self, key: str) -> bool:
        """
        Check if a key exists in cache.

        Args:
            key: Cache key to check

        Returns:
            True if key exists, False otherwise
        """
        if not self._is_available():
            return False

        try:
            result = self.redis_client.client.exists(key)
            return bool(result)
        except Exception as e:
            print(f"Error checking cache existence: {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.

        Args:
            pattern: Redis pattern (e.g., "user:123:*")

        Returns:
            Number of keys deleted
        """
        if not self._is_available():
            return 0

        try:
            # Find all keys matching the pattern
            keys = self.redis_client.client.keys(pattern)
            if not keys:
                return 0

            # Delete all matching keys
            result = self.redis_client.client.delete(*keys)
            return result

        except Exception as e:
            print(f"Error deleting pattern from cache: {e}")
            return 0

    def get_ttl(self, key: str) -> Optional[int]:
        """
        Get the remaining TTL for a key.

        Args:
            key: Cache key to check

        Returns:
            TTL in seconds, -1 if no expiration, None if key doesn't exist
        """
        if not self._is_available():
            return None

        try:
            ttl = self.redis_client.client.ttl(key)
            return ttl if ttl != -2 else None  # -2 means key doesn't exist
        except Exception as e:
            print(f"Error getting TTL: {e}")
            return None

    def set_ttl(self, key: str, ttl: int) -> bool:
        """
        Set TTL for an existing key.

        Args:
            key: Cache key
            ttl: Time to live in seconds

        Returns:
            True if successful, False otherwise
        """
        if not self._is_available():
            return False

        try:
            result = self.redis_client.client.expire(key, ttl)
            return bool(result)
        except Exception as e:
            print(f"Error setting TTL: {e}")
            return False

    def flush_all(self) -> bool:
        """
        Clear all keys from cache (use with caution).

        Returns:
            True if successful, False otherwise
        """
        if not self._is_available():
            return False

        try:
            result = self.redis_client.client.flushdb()
            return bool(result)
        except Exception as e:
            print(f"Error flushing cache: {e}")
            return False
