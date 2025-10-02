# FastAPI entry point

import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Determine environment and load appropriate .env file FIRST (before any other imports)
environment = os.getenv("ENVIRONMENT", "development")
env_file = f".env.{environment}"

# Load environment variables from environment-specific .env file
if os.path.exists(env_file):
    load_dotenv(env_file)
else:
    # Fallback to default .env file
    load_dotenv()

# Now import modules that depend on environment variables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.admin import register_model
from app.api.v1.router import router as v1_router
from app.config.settings import get_settings

# Get settings for configuration
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="DealQ API",
    description="AI underwriting platform for multifamily syndicators",
    version="1.0.0",
    # Disable docs in production
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None
)

# Add CORS middleware FIRST (before any auth/rate-limit middleware)
app.add_middleware(
    CORSMiddleware,
    **settings.get_cors_config()
)

# Include routers
app.include_router(register_model.router)
app.include_router(v1_router)

@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "DealQ API is running",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "v1": "/api/v1",
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        },
        "v1_ready": True
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
