"""Application settings and configuration."""

import os
from typing import Optional, List
from pydantic import SecretStr, field_validator, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Environment Configuration
    environment: str = "development"

    # API Settings
    app_name: str = "DealQ API"
    app_version: str = "1.0.0"

    # CORS Configuration
    # Set CORS_ORIGINS environment variable for production domains
    # Example: CORS_ORIGINS="https://yourdomain.com,https://your-frontend.onrender.com"
    cors_origins: str = Field(default="http://localhost:3000,http://localhost:3001,http://frontend:3000")
    cors_max_age: int = 86400  # 24 hours for preflight caching
    cors_expose_headers: str = "Content-Disposition"

    # Security Configuration
    enable_docs: bool = True  # Disable in production

    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: SecretStr
    supabase_storage_url: str
    supabase_bucket_name: str

    # OpenAI Configuration
    openai_api_key: Optional[str] = None

    # LLM Configuration
    llm_model: str = "gpt-4o"
    llm_temperature: float = 0.1

    # Database Configuration
    database_url: str

    # Redis Configuration
    redis_direct_url: Optional[str] = Field(default=None, alias="REDIS_URL")  # For native Redis protocol
    redis_ttl: int = 2700  # 45 minutes default
    redis_max_connections: int = 10
    redis_socket_timeout: int = 5
    redis_socket_connect_timeout: int = 5

    # Stripe Configuration
    stripe_secret_key: SecretStr
    stripe_publishable_key: str
    stripe_webhook_secret: Optional[SecretStr] = None

    # Stripe Price IDs for subscription plans
    stripe_price_id_starter_monthly: str  # $30/month, 20 deals
    stripe_price_id_professional_monthly: str  # $175/month, unlimited deals

    # Frontend URL for redirects
    frontend_url: str

    class Config:
        env_file = ".env.development" if os.getenv("ENVIRONMENT") == "development" else ".env.production"
        case_sensitive = False

    @field_validator('cors_origins')
    @classmethod
    def parse_cors_origins(cls, v: str) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        if isinstance(v, str):
            # Split by comma and strip whitespace, filter out empty strings
            origins = [origin.strip() for origin in v.split(',') if origin.strip()]
            return origins
        return v

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() in ["development", "dev"]

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() in ["production", "prod"]

    def get_supabase_config(self) -> dict:
        """
        Get Supabase configuration.

        Returns:
            dict: Supabase configuration with URL and service role key
        """
        return {
            "url": self.supabase_url,
            "service_role_key": self.supabase_service_role_key.get_secret_value()
        }

    def get_storage_config(self) -> dict:
        """
        Get storage configuration.

        Returns:
            dict: Storage configuration with bucket name and storage URL
        """
        return {
            "storage_url": self.supabase_storage_url,
            "bucket_name": self.supabase_bucket_name
        }

    def get_redis_config(self) -> dict:
        """
        Get Redis configuration.

        Returns:
            dict: Redis configuration with connection settings
        """
        return {
            "ttl": self.redis_ttl,
            "max_connections": self.redis_max_connections,
            "socket_timeout": self.redis_socket_timeout,
            "socket_connect_timeout": self.redis_socket_connect_timeout,
            "redis_direct_url": self.redis_direct_url
        }

    def get_stripe_config(self) -> dict:
        """
        Get Stripe configuration.

        Returns:
            dict: Stripe configuration with API keys and price IDs
        """
        return {
            "secret_key": self.stripe_secret_key.get_secret_value(),
            "publishable_key": self.stripe_publishable_key,
            "webhook_secret": self.stripe_webhook_secret.get_secret_value() if self.stripe_webhook_secret else None,
            "price_ids": {
                "starter_monthly": self.stripe_price_id_starter_monthly,
                "professional_monthly": self.stripe_price_id_professional_monthly
            },
            "frontend_url": self.frontend_url
        }

    def get_cors_config(self) -> dict:
        """
        Get CORS configuration with environment-specific security.

        Returns:
            dict: CORS configuration with origins and other settings
        """
        # Base CORS config
        cors_config = {
            "allow_origins": self.cors_origins,
            "allow_credentials": False,  # No CSRF needed with JWT
            "max_age": self.cors_max_age,
            "expose_headers": [header.strip() for header in self.cors_expose_headers.split(',') if header.strip()]
        }

        # Production hardening
        if self.is_production:
            cors_config.update({
                "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                "allow_headers": ["Authorization", "Content-Type"],
            })
        else:
            # Development - more permissive
            cors_config.update({
                "allow_methods": ["*"],
                "allow_headers": ["*"],
            })

        return cors_config


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get application settings."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
