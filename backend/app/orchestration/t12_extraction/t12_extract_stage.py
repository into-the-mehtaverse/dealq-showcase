"""
T12 Extract Stage

Handles T12 file extraction using the extraction service.
Downloads T12 file from storage and runs extraction.
Returns structured extraction data.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException

from app.models.orchestration.t12_extract_stage import T12ExtractStageInput, T12ExtractStageOutput, T12ExtractionResult, T12PageData, T12SheetData
from app.services.underwriting.t12_extraction.service import T12ExtractionService
from app.services.storage.storage_service import StorageService
from app.orchestration._shared.file_utils import download_file_from_storage, cleanup_temp_file, determine_file_type_from_extension
from app.orchestration._shared.error_utils import create_download_error, log_stage_error


class T12ExtractStage:
    """Pipeline stage for handling T12 file extraction."""

    def __init__(
        self,
        extraction_service: T12ExtractionService = None,
        storage_service: StorageService = None
    ):
        """Initialize the T12 extract stage with services."""
        self.extraction_service = extraction_service or T12ExtractionService()
        self.storage_service = storage_service or StorageService()

    async def process_t12_extraction(
        self,
        input_data: T12ExtractStageInput
    ) -> T12ExtractStageOutput:
        """
        Process T12 extraction if T12 file exists.

        Args:
            input_data: T12ExtractStageInput containing T12 file path and optional OM classification

        Returns:
            T12ExtractStageOutput with extraction result or None
        """
        try:
            # If no T12 file, return None extraction result
            if not input_data.t12_file_path:  # This is now a file path, not URL
                print("No T12 file provided for extraction")
                return T12ExtractStageOutput(
                    t12_extraction=None,
                    file_type=None,
                    extraction_success=False,
                    error_message="No T12 file provided"
                )

            print(f"Processing T12 extraction for file: {input_data.t12_file_path}")

            # Download T12 file from storage using private file path
            local_file_path = await download_file_from_storage(input_data.t12_file_path, self.storage_service)
            if not local_file_path:
                log_stage_error("T12 Extract", Exception("Download failed"), file_url=input_data.t12_file_path)
                return T12ExtractStageOutput(
                    t12_extraction=None,
                    file_type=None,
                    extraction_success=False,
                    error_message=f"Failed to download T12 file: {input_data.t12_file_path}"
                )

            try:
                # Determine file type from file extension
                try:
                    file_type = determine_file_type_from_extension(input_data.t12_file_path)
                except ValueError as e:
                    return T12ExtractStageOutput(
                        t12_extraction=None,
                        file_type=None,
                        extraction_success=False,
                        error_message=str(e)
                    )

                print(f"Determined file type: {file_type}")

                # Extract data using extraction service
                if file_type == "pdf":
                    extracted_data = await self.extraction_service.extract_t12_pdf(local_file_path)
                else:
                    extracted_data = await self.extraction_service.extract_t12_excel(local_file_path)

                print(f"Extracted data - {extracted_data.get('total_pages', extracted_data.get('total_sheets', 0))} pages/sheets")

                # Convert raw extraction data to typed Pydantic model
                t12_extraction = self._convert_to_typed_result(extracted_data)

                return T12ExtractStageOutput(
                    t12_extraction=t12_extraction,
                    file_type=file_type,
                    extraction_success=True,
                    error_message=None
                )

            finally:
                # Clean up temp file
                cleanup_temp_file(local_file_path)

        except Exception as e:
            log_stage_error("T12 Extract", e, file_url=input_data.t12_file_path)
            return T12ExtractStageOutput(
                t12_extraction=None,
                file_type=None,
                extraction_success=False,
                error_message=f"T12 extraction failed: {str(e)}"
            )

    def _convert_to_typed_result(self, extracted_data: dict) -> T12ExtractionResult:
        """Convert raw extraction data to typed Pydantic model."""
        # Convert page_data to typed models if present (PDF)
        page_data = None
        if extracted_data.get("page_data"):
            page_data = [
                T12PageData(
                    page_number=page["page_number"],
                    text=page["text"],
                    text_length=page["text_length"]
                )
                for page in extracted_data["page_data"]
            ]

        # Convert sheets to typed models if present (Excel)
        sheets = None
        if extracted_data.get("sheets"):
            sheets = [
                T12SheetData(
                    sheet_name=sheet["sheet_name"],
                    data=sheet["data"],
                    rows=sheet["rows"],
                    columns=sheet["columns"]
                )
                for sheet in extracted_data["sheets"]
            ]

        # Convert to plain text for structuring service
        plain_text = self._convert_extracted_data_to_text(extracted_data)

        return T12ExtractionResult(
            file_type=extracted_data["file_type"],
            document_type=extracted_data["document_type"],
            total_pages=extracted_data.get("total_pages"),
            total_sheets=extracted_data.get("total_sheets"),
            extracted_text=extracted_data.get("extracted_text"),
            page_data=page_data,
            sheets=sheets,
            plain_text=plain_text
        )

    def _convert_extracted_data_to_text(self, extracted_data: Dict[str, Any]) -> str:
        """Convert extracted data to text format for structuring."""
        if extracted_data.get("file_type") == "pdf":
            # For PDF, combine all extracted text
            return "\n\n".join(extracted_data.get("extracted_text", []))
        elif extracted_data.get("file_type") == "excel":
            # For Excel, convert sheet data to text
            text_parts = []
            for sheet in extracted_data.get("sheets", []):
                sheet_name = sheet.get("sheet_name", "")
                data = sheet.get("data", [])
                if data:
                    text_parts.append(f"Sheet: {sheet_name}")
                    for row in data:
                        text_parts.append("\t".join(str(cell) for cell in row))
            return "\n".join(text_parts)

        return ""
