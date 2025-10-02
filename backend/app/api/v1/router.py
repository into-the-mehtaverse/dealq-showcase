


from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime
from .upload import router as upload_router
from .get_model import router as get_model_router
from .deals import router as deals_router
from .pipeline import router as pipeline_router
from .billing import router as billing_router


router = APIRouter(
    prefix="/api/v1",
    tags=["V1 - DealQ AI Analyst"],
    responses={
        500: {"description": "Internal server error"},
        400: {"description": "Bad request"},
        404: {"description": "Not found"}
    }
)

# Include upload routes
router.include_router(upload_router, prefix="/upload", tags=["Upload"])

# Include get_model routes
router.include_router(get_model_router)

# Include deals routes
router.include_router(deals_router, prefix="/deals", tags=["Deals"])

# Include pipeline routes
router.include_router(pipeline_router, prefix="/pipeline", tags=["Pipeline"])

# Include billing routes
router.include_router(billing_router, prefix="/billing", tags=["Billing"])
