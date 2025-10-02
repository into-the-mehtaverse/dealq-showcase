"""
Get Model Endpoint

This endpoint handles user-verified data and generates Excel files using the Excel stage.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.models.api.get_model import GetModelRequest, GetModelResponse
from app.models.orchestration.excel_stage import ExcelStageInput
from app.core.dependencies.stages import excel_stage
from app.auth.dependencies import get_current_user
from app.auth.entitlements import require_subscription
from app.models.db.users import User

router = APIRouter()

@router.post("/get-model", response_model=GetModelResponse)
async def get_model(
    request: GetModelRequest,
    current_user: User = Depends(get_current_user),
    subscription: dict = Depends(require_subscription)
) -> GetModelResponse:
    """
    Generate Excel model from user-verified data.

    This endpoint takes user-verified property information and structured data,
    then generates an Excel file using the Excel stage.

    Requires active subscription.
    """
    try:
        # Create ExcelStageInput from the request
        excel_input = ExcelStageInput(
            property_name=request.property_name,
            address=request.address,
            zip_code=request.zip_code,
            number_of_units=request.number_of_units,
            year_built=request.year_built,
            parking_spaces=request.parking_spaces,
            gross_square_feet=request.gross_square_feet,
            asking_price=request.asking_price,
            revenue=request.revenue,
            expenses=request.expenses,
            structured_t12=request.structured_t12,
            structured_rent_roll=request.structured_rent_roll,
            deal_id=request.deal_id
        )

        # Execute Excel stage
        result = await excel_stage.process_excel_generation(excel_input)

        if result.success:
            return GetModelResponse(
                success=True,
                message="Excel model generated successfully",
                excel_file_url=result.excel_file_url,
                deal_id=result.deal_id
            )
        else:
            return GetModelResponse(
                success=False,
                message="Failed to generate Excel model",
                deal_id=result.deal_id,
                error_code="EXCEL_GENERATION_FAILED",
                details={"error": result.error_message}
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating Excel model: {str(e)}"
        )
