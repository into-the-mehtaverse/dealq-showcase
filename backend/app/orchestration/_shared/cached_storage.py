"""
Cached Storage Service

A utility service at the orchestration layer that provides cached storage operations
by coordinating between the pure StorageService and CacheService.
"""

from typing import Optional
from app.services.storage.storage_service import StorageService
from app.services.cache.cache_service import CacheService
from app.services.cache.utils import generate_signed_url_key, calculate_ttl_for_signed_url


class CachedStorageService:
    """
    Utility service for cached storage operations at orchestration layer.

    This service coordinates between StorageService and CacheService to provide
    efficient cached storage operations while maintaining service separation.
    """

    def __init__(self, storage_service: StorageService, cache_service: CacheService):
        """
        Initialize the cached storage service.

        Args:
            storage_service: Pure storage service for file operations
            cache_service: Pure cache service for Redis operations
        """
        self.storage_service = storage_service
        self.cache_service = cache_service

    def get_signed_url(
        self,
        file_path: str,
        expires_in: int = 186400,
        user_id: Optional[str] = None
    ) -> str:
        """
        Get a signed URL for a file, using cache if available.

        Args:
            file_path: Path to the file within the bucket
            expires_in: Expiration time in seconds (default: 51.8 hours)
            user_id: User identifier for cache scoping (optional)

        Returns:
            str: Signed URL for the file
        """
        # If no user_id provided or no cache service, fall back to direct storage service
        if not user_id or not self.cache_service:
            return self.storage_service.get_signed_url(file_path, expires_in)

        # Generate cache key for this signed URL
        cache_key = generate_signed_url_key(user_id, file_path, expires_in)

        # Try to get from cache first
        cached_url = self.cache_service.get(cache_key)
        if cached_url:
            return cached_url

        # Generate new signed URL from storage service
        new_url = self.storage_service.get_signed_url(file_path, expires_in)

        # Cache the new URL with appropriate TTL
        cache_ttl = calculate_ttl_for_signed_url(expires_in, buffer_minutes=15)
        self.cache_service.set(cache_key, new_url, cache_ttl)

        return new_url

    def get_signed_urls_batch(
        self,
        file_paths: list[str],
        expires_in: int = 186400,
        user_id: Optional[str] = None
    ) -> dict[str, str]:
        """
        Get multiple signed URLs in batch, using cache where available.

        Args:
            file_paths: List of file paths
            expires_in: Expiration time in seconds
            user_id: User identifier for cache scoping

        Returns:
            dict: Mapping of file_path to signed_url
        """
        if not user_id or not self.cache_service:
            # Fall back to direct storage service calls
            return {
                file_path: self.storage_service.get_signed_url(file_path, expires_in)
                for file_path in file_paths
            }

        result = {}
        uncached_paths = []

        # Check cache for each file path
        for file_path in file_paths:
            cache_key = generate_signed_url_key(user_id, file_path, expires_in)
            cached_url = self.cache_service.get(cache_key)

            if cached_url:
                result[file_path] = cached_url
            else:
                uncached_paths.append(file_path)

        # Generate signed URLs for uncached files
        if uncached_paths:
            cache_ttl = calculate_ttl_for_signed_url(expires_in, buffer_minutes=15)

            for file_path in uncached_paths:
                new_url = self.storage_service.get_signed_url(file_path, expires_in)
                result[file_path] = new_url

                # Cache the new URL
                cache_key = generate_signed_url_key(user_id, file_path, expires_in)
                self.cache_service.set(cache_key, new_url, cache_ttl)

        return result

    def invalidate_file_cache(self, file_path: str, user_id: str) -> bool:
        """
        Invalidate cache for a specific file.

        Args:
            file_path: Path to the file
            user_id: User identifier

        Returns:
            bool: True if cache was invalidated successfully
        """
        if not self.cache_service:
            return False

        # Invalidate all cached signed URLs for this file (different expiration times)
        common_expiration_times = [3600, 7200, 186400]  # 1h, 2h, 51.8h

        for expires_in in common_expiration_times:
            cache_key = generate_signed_url_key(user_id, file_path, expires_in)
            self.cache_service.delete(cache_key)

        return True

    def invalidate_user_cache(self, user_id: str) -> int:
        """
        Invalidate all cached data for a specific user.

        Args:
            user_id: User identifier

        Returns:
            int: Number of cache keys deleted
        """
        if not self.cache_service:
            return 0

        # Delete all cached data for this user
        pattern = f"*:{user_id}:*"
        return self.cache_service.delete_pattern(pattern)

    def get_cache_stats(self, user_id: str) -> dict:
        """
        Get cache statistics for a specific user.

        Args:
            user_id: User identifier

        Returns:
            dict: Cache statistics including hit count, miss count, etc.
        """
        if not self.cache_service:
            return {"error": "Cache service not available"}

        # This is a placeholder for future cache statistics implementation
        # For now, we'll return basic info
        return {
            "user_id": user_id,
            "cache_service_available": True,
            "note": "Detailed cache statistics not yet implemented"
        }
