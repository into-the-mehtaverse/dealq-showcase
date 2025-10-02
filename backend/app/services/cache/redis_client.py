"""
Redis client for connecting to Upstash Redis.

This module handles the Redis connection configuration and provides
a singleton Redis client instance for the application.
"""

import redis
import os
from typing import Optional
from app.config.settings import get_settings


class RedisClient:
    """Redis client wrapper for Upstash Redis connection."""

    def __init__(self):
        """Initialize Redis client with configuration from settings."""
        self._client: Optional[redis.Redis] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Redis client with native Redis protocol."""
        try:
            # Use REDIS_URL environment variable for native Redis protocol
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                self._client = redis.Redis.from_url(
                    redis_url,
                    decode_responses=True,  # Automatically decode bytes to strings
                    ssl_cert_reqs=None,  # Disable SSL certificate verification for Upstash
                    ssl_check_hostname=False,  # Disable hostname checking for Upstash
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    max_connections=10,
                    retry_on_timeout=True,
                    health_check_interval=30
                )

                # Test the connection
                self._client.ping()
                print("✅ Redis client initialized successfully with native protocol")
            else:
                print("❌ REDIS_URL environment variable not found")
                self._client = None

        except Exception as e:
            print(f"Warning: Failed to initialize Redis client: {e}")
            self._client = None

    @property
    def client(self) -> Optional[redis.Redis]:
        """Get the Redis client instance."""
        return self._client

    def is_connected(self) -> bool:
        """Check if Redis client is connected and available."""
        if not self._client:
            return False

        try:
            self._client.ping()
            return True
        except Exception:
            return False

    def reconnect(self):
        """Attempt to reconnect to Redis."""
        try:
            if self._client:
                if hasattr(self._client, 'close'):
                    self._client.close()
            self._initialize_client()
        except Exception as e:
            print(f"Failed to reconnect to Redis: {e}")


# Global Redis client instance
_redis_client: Optional[RedisClient] = None


def get_redis_client() -> RedisClient:
    """Get the global Redis client instance."""
    global _redis_client
    if _redis_client is None:
        _redis_client = RedisClient()
    return _redis_client
