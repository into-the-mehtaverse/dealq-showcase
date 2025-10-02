# Test endpoints for model registration service

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Dict, List, Any, Optional
import os
from app.services.admin.register_model.service import model_registration_service
from app.models.admin.mapping import SUPPORTED_CATEGORIES

router = APIRouter(prefix="/test/admin", tags=["model-registration-testing"])


@router.get("/models")
async def test_list_registered_models():
    """Test endpoint to list all registered models."""
    try:
        models = await model_registration_service.list_registered_models()

        return {
            "success": True,
            "models": models,
            "total_models": len(models),
            "message": f"Found {len(models)} registered models"
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error listing models: {str(e)}")


@router.get("/models/{model_id}/mapping-only")
async def test_get_model_mapping_only(model_id: str):
    """Test endpoint to get only the mapping information for a model (without full metadata)."""
    try:
        model_info = await model_registration_service.get_model_info(model_id)

        return {
            "success": True,
            "model_id": model_id,
            "model_name": model_info["mapping"].get("model_name", "Unknown"),
            "mappings": model_info["mapping"].get("mappings", {}),
            "message": f"Retrieved mapping for model '{model_id}'"
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error retrieving mapping: {str(e)}")

@router.post("/models/upload-and-register")
async def test_upload_and_register(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None)
):
    """
    Comprehensive test endpoint that uploads an Excel file and registers it in one step,
    returning detailed analysis and mapping information.
    """
    try:
        # Register the model
        result = await model_registration_service.register_excel_model(file, model_name)

        # Extract detailed information for comprehensive response
        mapping = result["mapping"]

        # Create simplified analysis summary
        detailed_analysis = {
            "mapping_details": {}
        }

        # Analyze mappings (handle different structures for tabular vs single-cell mappings)
        for category, category_mapping in mapping.get("mappings", {}).items():
            if category == "property_info":
                # Property info has a different structure with individual cell mappings
                cells = category_mapping.get("cells", {})
                detailed_analysis["mapping_details"][category] = {
                    "type": "property_info",
                    "cells": cells,
                    "fields_mapped": len(cells),
                    "structure": "single_cell_mapping"
                }
            else:
                # Tabular data (rent_roll, t12) has column-based structure
                detailed_analysis["mapping_details"][category] = {
                    "sheet_name": category_mapping.get("sheet_name", "Unknown"),
                    "data_start_row": category_mapping.get("data_start_row", "Unknown"),
                    "columns": category_mapping.get("columns", {}),
                    "column_count": len(category_mapping.get("columns", {})),
                    "structure": "tabular_mapping"
                }

        return {
            "success": True,
            "model_id": result["model_id"],
            "model_name": result["model_name"],
            "status": result["status"],
            "summary": result["analysis_summary"],
            "detailed_analysis": detailed_analysis,
            "ready_for_use": len(mapping.get("mappings", {})) > 0,
            "message": f"Successfully uploaded and registered '{result['model_name']}' with {len(mapping.get('mappings', {}))} category mappings"
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error in upload and register: {str(e)}")
