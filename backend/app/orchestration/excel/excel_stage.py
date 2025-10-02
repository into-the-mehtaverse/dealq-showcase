"""
Excel Stage

Handles Excel generation from user-verified data.
Downloads model and mapping files from storage, generates Excel using the excel service,
and uploads the result back to storage.
"""

import json
import tempfile
from typing import Optional
from fastapi import HTTPException

from app.models.orchestration.excel_stage import ExcelStageInput, ExcelStageOutput
from app.services.underwriting.excel_generation.service import ExcelGenerationService
from app.services.storage.storage_service import StorageService
from app.services.db.service import DatabaseService
from app.models.db.deals import DealUpdate
from app.models.db.upload_files import UploadFileCreate
from app.core.supabase_client import get_supabase_client
from app.orchestration._shared.file_utils import cleanup_temp_file
from app.orchestration._shared.error_utils import log_stage_error


class ExcelStage:
    """Pipeline stage for handling Excel generation from user-verified data."""

    # Private bucket file paths for model and mapping files
    MODEL_PATH = "models/6ecd59eb-aaf4-47e3-bbe8-e3bd3d5f58a1.xlsm"
    MAPPING_PATH = "mappings/6ecd59eb-aaf4-47e3-bbe8-e3bd3d5f58a1_mapping.json"

    def __init__(
        self,
        excel_generation_service: ExcelGenerationService = None,
        storage_service: StorageService = None,
        db: DatabaseService = None
    ):
        """Initialize the Excel stage with services."""
        self.excel_generation_service = excel_generation_service or ExcelGenerationService()
        self.storage_service = storage_service or StorageService()
        self.db = db or DatabaseService(get_supabase_client())

    async def process_excel_generation(
        self,
        input_data: ExcelStageInput
    ) -> ExcelStageOutput:
        """
        Process Excel generation from user-verified data.

        Args:
            input_data: ExcelStageInput containing property info and structured data

        Returns:
            ExcelStageOutput with Excel file URL or error
        """
        template_path = None
        mapping_file_path = None
        generated_file_path = None

        try:
            # Step 1: Convert input data to structured data format for Excel generation
            structured_data = {
                "rent_roll": input_data.structured_rent_roll or [],
                "t12": input_data.structured_t12 or [],
                "property_info": {
                    "name": input_data.property_name,
                    "address": input_data.address,
                    "zip_code": input_data.zip_code,
                    "year_built": input_data.year_built,
                    "parking_spots": input_data.parking_spaces,
                    "gross_square_feet": input_data.gross_square_feet,
                    "broker_price": input_data.asking_price,
                    "revenue": input_data.revenue,
                    "expenses": input_data.expenses
                }
            }

            # Step 2: Validate that structured data is ready for Excel generation
            validation_result = self.excel_generation_service.validate_structured_data(structured_data)

            if not validation_result["valid"]:
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Invalid structured data: {', '.join(validation_result['errors'])}"
                )

            # Step 3: Download model template from private bucket
            try:
                template_download = self.storage_service.download_file(self.MODEL_PATH)
                if not template_download["success"]:
                    log_stage_error("Excel", Exception("Model download failed"), deal_id=input_data.deal_id, error_type="download")
                    return ExcelStageOutput(
                        success=False,
                        deal_id=input_data.deal_id,
                        error_message=f"Failed to download Excel model: {template_download.get('error', 'Unknown error')}"
                    )

                # Create temporary file for the model
                template_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsm")
                template_path = template_file.name
                template_file.close()

                # Write the downloaded data to the temporary file
                with open(template_path, 'wb') as f:
                    f.write(template_download["data"])

            except Exception as download_error:
                log_stage_error("Excel", download_error, deal_id=input_data.deal_id, error_type="download")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Failed to download Excel model: {str(download_error)}"
                )

            # Step 4: Download mapping file from private bucket
            try:
                mapping_download = self.storage_service.download_file(self.MAPPING_PATH)
                if not mapping_download["success"]:
                    log_stage_error("Excel", Exception("Mapping download failed"), deal_id=input_data.deal_id, error_type="download")
                    return ExcelStageOutput(
                        success=False,
                        deal_id=input_data.deal_id,
                        error_message=f"Failed to download mapping file: {mapping_download.get('error', 'Unknown error')}"
                    )

                # Create temporary file for the mapping
                mapping_file = tempfile.NamedTemporaryFile(delete=False, suffix=".json")
                mapping_file_path = mapping_file.name
                mapping_file.close()

                # Write the downloaded data to the temporary file
                with open(mapping_file_path, 'wb') as f:
                    f.write(mapping_download["data"])

            except Exception as download_error:
                log_stage_error("Excel", download_error, deal_id=input_data.deal_id, error_type="download")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Failed to download mapping file: {str(download_error)}"
                )

            # Step 5: Load mapping data
            try:
                with open(mapping_file_path, 'r') as f:
                    model_mapping = json.load(f)

            except json.JSONDecodeError as e:
                log_stage_error("Excel", e, deal_id=input_data.deal_id, error_type="JSON decode")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Invalid JSON in mapping file: {str(e)}"
                )
            except Exception as download_error:
                log_stage_error("Excel", download_error, deal_id=input_data.deal_id, error_type="download")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Failed to download Excel model and mapping: {str(download_error)}"
                )

            # Step 6: Generate Excel file using the excel service
            try:
                generated_file_path = self.excel_generation_service.generate_excel(
                    structured_data=structured_data,
                    template_path=template_path,
                    model_mapping=model_mapping
                )
            except Exception as excel_error:
                log_stage_error("Excel", excel_error, deal_id=input_data.deal_id, error_type="generation")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Excel generation failed: {str(excel_error)}"
                )

            # Step 7: Upload the generated Excel file to storage
            try:
                excel_upload_result = self.storage_service.upload_excel_file(generated_file_path)
                excel_signed_url = excel_upload_result["signed_url"]
                excel_file_path = excel_upload_result["file_path"]
            except Exception as upload_error:
                log_stage_error("Excel", upload_error, deal_id=input_data.deal_id, error_type="upload")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Failed to upload Excel file: {str(upload_error)}"
                )

            # Step 8: Get upload_id for the deal and create upload_file entry
            try:
                # Get uploads for the deal
                uploads = self.db.uploads_repo.get_uploads_by_deal_id(input_data.deal_id)
                if not uploads:
                    return ExcelStageOutput(
                        success=False,
                        deal_id=input_data.deal_id,
                        error_message=f"No upload found for deal with ID {input_data.deal_id}"
                    )

                # Use the first upload (assuming one upload per deal for now)
                upload_id = uploads[0].id

                # Create upload file entry for the generated Excel file
                upload_file_create = UploadFileCreate(
                    upload_id=upload_id,
                    file_type="excel",
                    filename="generated_model.xlsm",
                    file_path=excel_file_path,  # Store private file path
                    doc_type="MODEL"
                )
                self.db.upload_files_repo.create_upload_file(upload_file_create)

            except Exception as db_error:
                log_stage_error("Excel", db_error, deal_id=input_data.deal_id, error_type="database")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Failed to create upload file entry: {str(db_error)}"
                )

            # Step 9: Update existing deal in database
            try:
                # Create update data
                update_data = {
                    "property_name": input_data.property_name,
                    "address": input_data.address,
                    "zip_code": input_data.zip_code,
                    "number_of_units": input_data.number_of_units,
                    "year_built": input_data.year_built,
                    "parking_spaces": input_data.parking_spaces,
                    "gross_square_feet": input_data.gross_square_feet,
                    "asking_price": input_data.asking_price,
                    "revenue": input_data.revenue,
                    "expenses": input_data.expenses,
                    "t12": input_data.structured_t12,
                    "rent_roll": input_data.structured_rent_roll,
                    "excel_file_path": excel_file_path,  # Store private file path in database
                    "status": "active"
                }

                # Update the existing deal
                deal_update = DealUpdate(**update_data)
                updated_deal = self.db.deals_repo.update_deal(input_data.deal_id, deal_update)

                if not updated_deal:
                    return ExcelStageOutput(
                        success=False,
                        deal_id=input_data.deal_id,
                        error_message=f"Deal with ID {input_data.deal_id} not found"
                    )

            except Exception as db_error:
                log_stage_error("Excel", db_error, deal_id=input_data.deal_id, error_type="database")
                return ExcelStageOutput(
                    success=False,
                    deal_id=input_data.deal_id,
                    error_message=f"Failed to update deal in database: {str(db_error)}"
                )

            # Step 10: Return successful result
            return ExcelStageOutput(
                success=True,
                excel_file_url=excel_signed_url,  # Return signed URL for frontend
                deal_id=input_data.deal_id
            )

        except Exception as e:
            log_stage_error("Excel", e, deal_id=input_data.deal_id)
            return ExcelStageOutput(
                success=False,
                deal_id=input_data.deal_id,
                error_message=f"Excel generation failed: {str(e)}"
            )
        finally:
            # Clean up temporary files
            cleanup_temp_file(template_path)
            cleanup_temp_file(mapping_file_path)
            cleanup_temp_file(generated_file_path)
