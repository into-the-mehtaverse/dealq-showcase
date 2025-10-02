"""
Service dependencies for the application.

This module provides singleton instances of all services to ensure consistent
usage across the application and prevent multiple instantiations.
"""

from app.core.supabase_client import get_supabase_client
from app.services.storage.storage_service import StorageService
from app.services.underwriting.structuring.service import StructuringService
from app.services.underwriting.excel_generation.service import ExcelGenerationService
from app.services.underwriting.om_extraction.service import OMExtractionService
from app.services.underwriting.om_classification.service import OMClassificationService
from app.services.underwriting.t12_extraction.service import T12ExtractionService
from app.services.underwriting.rent_roll_extraction.service import RentRollExtractionService
from app.services.underwriting.rent_roll_classification.service import RentRollClassificationService
from app.services.db.service import DatabaseService
from app.services.cache.cache_service import CacheService
from app.services.billing.service import BillingService


# Singleton instances of all services
storage_service = StorageService()
db = DatabaseService(get_supabase_client())
cache_service = CacheService()
structuring_service = StructuringService()
excel_generation_service = ExcelGenerationService()
t12_extraction_service = T12ExtractionService()
rent_roll_extraction_service = RentRollExtractionService()
rent_roll_classification_service = RentRollClassificationService()
om_extraction_service = OMExtractionService()
om_classification_service = OMClassificationService()
billing_service = BillingService()
