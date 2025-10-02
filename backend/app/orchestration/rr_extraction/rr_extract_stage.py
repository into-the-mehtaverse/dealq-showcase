"""
RR Extract Stage

Handles rent roll file extraction using precision extraction.
Downloads RR file from storage and runs precision extraction.
Returns structured extraction data.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException

from app.models.orchestration.rr_extract_stage import RRExtractStageInput, RRExtractStageOutput
from app.services.underwriting.rent_roll_extraction.service import RentRollExtractionService
from app.services.underwriting.rent_roll_classification.service import RentRollClassificationService
from app.services.storage.storage_service import StorageService
from app.orchestration._shared.file_utils import download_file_from_storage, cleanup_temp_file, determine_file_type_from_extension
from app.orchestration._shared.error_utils import log_stage_error


class RRExtractStage:
    """Pipeline stage for handling rent roll file extraction."""

    def __init__(
        self,
        extraction_service: RentRollExtractionService = None,
        classification_service: RentRollClassificationService = None,
        storage_service: StorageService = None
    ):
        """Initialize the RR extract stage with services."""
        self.extraction_service = extraction_service or RentRollExtractionService()
        self.classification_service = classification_service or RentRollClassificationService()
        self.storage_service = storage_service or StorageService()

    async def process_rr_extraction(
        self,
        input_data: RRExtractStageInput
    ) -> RRExtractStageOutput:
        """
        Process rent roll extraction if RR file exists.

        Args:
            input_data: RRExtractStageInput containing RR file path and optional OM classification

        Returns:
            RRExtractStageOutput with extraction result or None
        """
        try:
            # If no RR file, return None extraction result
            if not input_data.rr_file_path:  # This is now a file path, not URL
                print("No RR file provided for extraction")
                return RRExtractStageOutput(
                    rr_extraction=None,
                    file_type=None,
                    extraction_success=False,
                    error_message="No RR file provided"
                )

            print(f"Processing RR extraction for file: {input_data.rr_file_path}")

            # Download RR file from storage using private file path
            local_file_path = await download_file_from_storage(input_data.rr_file_path, self.storage_service)
            if not local_file_path:
                log_stage_error("RR Extract", Exception("Download failed"), file_url=input_data.rr_file_path)
                return RRExtractStageOutput(
                    rr_extraction=None,
                    file_type=None,
                    extraction_success=False,
                    error_message=f"Failed to download RR file: {input_data.rr_file_path}"
                )

            try:
                # Determine file type from file extension
                try:
                    file_type = determine_file_type_from_extension(input_data.rr_file_path)
                except ValueError as e:
                    return RRExtractStageOutput(
                        rr_extraction=None,
                        file_type=None,
                        extraction_success=False,
                        error_message=str(e)
                    )

                print(f"Determined file type: {file_type}")

                # Extract data using extraction service
                if file_type == "pdf":
                    extracted_data = await self.extraction_service.extract_rent_roll_pdf(local_file_path)
                else:
                    extracted_data = await self.extraction_service.extract_rent_roll_excel(local_file_path)

                print(f"Extracted data - {extracted_data.get('total_pages', extracted_data.get('total_sheets', 0))} pages/sheets")

                # Convert extracted data to text for classification
                if file_type == "pdf":
                    # Add page indicators to help the classifier identify page boundaries
                    page_data = extracted_data.get("page_data", [])
                    text_parts = []
                    for page in page_data:
                        page_num = page.get("page_number", "unknown")
                        page_text = page.get("text", "")
                        text_parts.append(f"=== PAGE {page_num} ===\n{page_text}")
                    text = "\n\n".join(text_parts)
                else:  # excel
                    text = extracted_data.get("enumerated_text", "")

                print(f"Converted to text - {len(text)} characters")

                # Run classification using classification service
                classification_result = await self.classification_service.analyze_rent_roll_boundaries(text, file_type)

                if not classification_result:
                    return RRExtractStageOutput(
                        rr_extraction=None,
                        file_type=file_type,
                        extraction_success=False,
                        error_message="Classification failed - no boundaries detected"
                    )

                print(f"Classification completed - {classification_result}")

                # Apply precision extraction based on boundaries
                precision_extraction = self.extraction_service.extract_rent_roll_with_boundaries(
                    extracted_data,
                    classification_result
                )

                print(f"Precision extraction completed")

                return RRExtractStageOutput(
                    rr_extraction=precision_extraction,
                    file_type=file_type,
                    extraction_success=True,
                    error_message=None
                )

            finally:
                # Clean up temp file
                cleanup_temp_file(local_file_path)

        except Exception as e:
            log_stage_error("RR Extract", e, file_url=input_data.rr_file_path)
            return RRExtractStageOutput(
                rr_extraction=None,
                file_type=None,
                extraction_success=False,
                error_message=f"RR extraction failed: {str(e)}"
            )
