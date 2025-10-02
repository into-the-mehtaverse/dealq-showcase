# Model registration service for dynamic Excel mapping

import os
import json
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from fastapi import HTTPException, UploadFile
import openpyxl

# Load environment variables first
load_dotenv()

from .utils import (
    validate_excel_file,
    save_excel_model,
    save_model_mapping,
    analyze_excel_structure,
    verify_multifamily_model,
    identify_input_sheets,
    generate_input_mappings,
    create_model_metadata,
    MODELS_DIR,
    MAPPINGS_DIR,
    METADATA_DIR
)


class ModelRegistrationService:
    """Service for registering Excel models and generating dynamic mappings."""

    def __init__(self):
        """Initialize the model registration service with environment-based configuration."""
        # Load configuration from environment variables
        self.model_name = os.getenv("LLM_MODEL", "gpt-4o")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

        self._validate_configuration()

    def _validate_configuration(self):
        """Validate that required configuration is available."""
        if not self.openai_api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not found. Set OPENAI_API_KEY environment variable."
            )

        # Validate temperature range
        if not (0.0 <= self.temperature <= 2.0):
            self.temperature = 0.1  # Reset to default if invalid
            print(f"Warning: Invalid LLM_TEMPERATURE value. Using default: {self.temperature}")

    def _create_llm(self) -> ChatOpenAI:
        """Create and configure the LLM instance."""
        return ChatOpenAI(
            model_name=self.model_name,
            temperature=self.temperature,
            openai_api_key=self.openai_api_key
        )



    async def register_excel_model(
        self,
        file: UploadFile,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Register an Excel model by analyzing its structure and generating mappings.

        Args:
            file: Uploaded Excel file
            model_name: Optional custom name for the model

        Returns:
            Dictionary containing model_id, mapping, and analysis summary
        """
        try:
            # Step 1: Validate Excel file
            validate_excel_file(file)

            # Generate model ID and determine model name
            model_id = str(uuid.uuid4())
            final_model_name = model_name or f"Model_{model_id[:8]}"

            # Step 2: Save Excel file
            saved_filename = await save_excel_model(file, model_id)

            # Step 3: Load and analyze Excel structure
            workbook_path = MODELS_DIR / saved_filename
            excel_structure = analyze_excel_structure(workbook_path)

            # Step 4: LLM verification - check if multifamily real estate model
            llm = self._create_llm()
            verification_result = await verify_multifamily_model(excel_structure, llm)

            if not verification_result["is_multifamily_model"]:
                # Clean up saved file
                workbook_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=400,
                    detail=f"Uploaded file is not a multifamily real estate model. {verification_result['reason']}"
                )

            # Step 5: Identify the single input sheet for each category
            input_sheets = await identify_input_sheets(excel_structure, llm)

            if not input_sheets:
                # Clean up saved file
                workbook_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=400,
                    detail="No input sheets found for rent roll or T-12 data."
                )

            # Step 6: Generate tactical mappings for data insertion
            tactical_mappings = await generate_input_mappings(
                workbook_path,
                input_sheets,
                llm
            )

            # Step 7: Create simple, focused mapping
            focused_mapping = {
                "model_id": model_id,
                "model_name": final_model_name,
                "mappings": tactical_mappings
            }

            # Step 8: Save mapping and metadata
            await save_model_mapping(model_id, focused_mapping)
            await create_model_metadata(model_id, final_model_name, file.filename)

            # Step 9: Return success response
            return {
                "status": "registered",
                "model_id": model_id,
                "model_name": final_model_name,
                "mapping": focused_mapping,
                "analysis_summary": {
                    "categories_found": list(tactical_mappings.keys()),
                    "input_sheets": list(input_sheets.values()),
                    "verification_confidence": verification_result.get("confidence", "unknown")
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error registering model: {str(e)}")

    async def get_model_info(self, model_id: str) -> Dict[str, Any]:
        """
        Get information about a registered model.

        Args:
            model_id: ID of the registered model

        Returns:
            Dictionary with model information and mapping
        """
        try:
            mapping_path = MAPPINGS_DIR / f"{model_id}_mapping.json"
            metadata_path = METADATA_DIR / f"{model_id}.json"

            if not mapping_path.exists():
                raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")

            # Load mapping
            with open(mapping_path, 'r') as f:
                mapping = json.load(f)

            # Load metadata if exists
            metadata = {}
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)

            return {
                "model_id": model_id,
                "metadata": metadata,
                "mapping": mapping,
                "status": "registered"
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving model info: {str(e)}")

    async def list_registered_models(self) -> List[Dict[str, Any]]:
        """
        List all registered models.

        Returns:
            List of model summaries
        """
        try:
            models_dir = METADATA_DIR
            mapping_dir = MAPPINGS_DIR

            models = []

            if models_dir.exists():
                for metadata_file in models_dir.glob("*.json"):
                    model_id = metadata_file.stem

                    # Load metadata
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)

                    # Check if mapping exists
                    mapping_path = mapping_dir / f"{model_id}_mapping.json"
                    has_mapping = mapping_path.exists()

                    models.append({
                        "model_id": model_id,
                        "model_name": metadata.get("model_name", "Unknown"),
                        "original_filename": metadata.get("original_filename", "Unknown"),
                        "registered_at": metadata.get("registered_at", "Unknown"),
                        "has_mapping": has_mapping
                    })

            return models

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")



# Create service instance
model_registration_service = ModelRegistrationService()
