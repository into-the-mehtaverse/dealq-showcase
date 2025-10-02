"""
Pipeline Stages

This module provides singleton instances of all pipeline stages to ensure consistent
usage across the application and prevent multiple instantiations.
"""

from app.orchestration.upload_stage.upload_stage import UploadStage
from app.orchestration.om_classification.classification_stage import ClassificationStage
from app.orchestration.rr_extraction.rr_extract_stage import RRExtractStage
from app.orchestration.t12_extraction.t12_extract_stage import T12ExtractStage
from app.orchestration.structure.structure_stage import StructureStage
from app.orchestration.excel.excel_stage import ExcelStage
from app.orchestration.deals.delete_deals import DeleteDealsStage
from app.orchestration.deals.get_deals_for_dashboard import GetDealsForDashboardOrchestrator
from app.orchestration.deals.get_individual_deal import GetIndividualDealStage
from app.orchestration.deals.update_deal import UpdateDealStage
from app.orchestration.deals.get_deals_for_pipeline import GetDealsForPipelineOrchestrator
from app.orchestration.deals.bulk_update_status import BulkUpdateStatusStage
from app.orchestration.billing.billing_orchestrator import BillingOrchestrator
from app.orchestration.billing.stripe_webhook_orchestrator import StripeWebhookOrchestrator
from app.orchestration._shared.cached_storage import CachedStorageService
from .services import (
    storage_service,
    structuring_service,
    excel_generation_service,
    t12_extraction_service,
    rent_roll_extraction_service,
    rent_roll_classification_service,
    om_extraction_service,
    om_classification_service,
    db,
    cache_service,
    billing_service
)

# Create cached storage service instance
cached_storage_service = CachedStorageService(storage_service, cache_service)

upload_stage = UploadStage(cached_storage_service, db, cache_service)
classification_stage = ClassificationStage(om_extraction_service, om_classification_service, storage_service, db)
rr_extract_stage = RRExtractStage(rent_roll_extraction_service, rent_roll_classification_service, storage_service)
t12_extract_stage = T12ExtractStage(t12_extraction_service, storage_service)
structure_stage = StructureStage(structuring_service)
excel_stage = ExcelStage(excel_generation_service, storage_service, db)
delete_deals_stage = DeleteDealsStage(storage_service, db)
get_deals_for_dashboard_stage = GetDealsForDashboardOrchestrator(cached_storage_service, db, cache_service)
get_individual_deal_stage = GetIndividualDealStage(cached_storage_service, db, cache_service)
update_deal_stage = UpdateDealStage(cached_storage_service, db, cache_service)
get_deals_for_pipeline_stage = GetDealsForPipelineOrchestrator(cached_storage_service, db, cache_service)
bulk_update_status_stage = BulkUpdateStatusStage(db)

# Billing orchestration
billing_orchestrator = BillingOrchestrator(billing_service, db)
stripe_webhook_orchestrator = StripeWebhookOrchestrator(billing_service, db)
