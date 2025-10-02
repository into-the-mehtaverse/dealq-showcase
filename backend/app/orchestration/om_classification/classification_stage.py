"""
Classification Stage

Handles OM file classification. Checks if OM file exists and runs classification if it does.
Returns classification result or None if no OM file.
"""

from typing import Optional
from fastapi import HTTPException
from app.services.underwriting.om_extraction.service import OMExtractionService
from app.services.underwriting.om_classification.service import OMClassificationService
from app.services.storage.storage_service import StorageService
from app.services.db.service import DatabaseService
from app.models.orchestration.classification_stage import ClassificationStageInput, ClassificationStageOutput
from app.models.db.upload_files import UploadFileCreate
from app.orchestration._shared.file_utils import download_file_from_storage, cleanup_temp_file
from app.orchestration._shared.error_utils import log_stage_error
from app.core.supabase_client import get_supabase_client
import uuid


class ClassificationStage:
    """Pipeline stage for handling OM file classification."""

    def __init__(
        self,
        om_extraction_service: OMExtractionService = None,
        om_classification_service: OMClassificationService = None,
        storage_service: StorageService = None,
        db_service: DatabaseService = None
    ):
        """Initialize the classification stage with services."""
        self.om_extraction_service = om_extraction_service or OMExtractionService()
        self.om_classification_service = om_classification_service or OMClassificationService()
        self.storage_service = storage_service or StorageService()
        self.db_service = db_service or DatabaseService(get_supabase_client())

    async def process_classification(
        self,
        input_data: ClassificationStageInput
    ) -> ClassificationStageOutput:
        """
        Process OM classification if OM file exists.

        Args:
            input_data: ClassificationStageInput containing the OM file path

        Returns:
            ClassificationStageOutput with classification result or None
        """
        try:
            # Extract the OM file path from the input data
            om_file_path = input_data.om_file_path  # This is a file path.

            # If no OM file, return None classification result
            if not om_file_path:
                print("No OM file provided for classification")
                return ClassificationStageOutput(classification_result=None, description=None, market_description=None, image_path=None)

            print(f"Processing OM classification for file: {om_file_path}")

            # Download OM file from storage using private file path
            local_file_path = await download_file_from_storage(om_file_path, self.storage_service)
            if not local_file_path:
                log_stage_error("Classification", Exception("Download failed"), file_url=om_file_path)
                return ClassificationStageOutput(classification_result=None, description=None, market_description=None, image_path=None)

            try:
                # Extract first page image and upload to storage
                image_path = None
                try:
                    image_bytes = await self.om_extraction_service.get_om_first_image(local_file_path)
                    if image_bytes:
                        # Generate unique filename for the image
                        image_filename = f"{uuid.uuid4()}.png"
                        upload_result = self.storage_service.upload_file(
                            file_data=image_bytes,
                            folder="deal_covers",
                            filename=image_filename,
                            content_type="image/png"
                        )
                        if upload_result.get("success"):
                            image_path = upload_result["file_path"]
                            print(f"Successfully uploaded OM first page image: {image_path}")

                            # Create upload_file record for the image if upload_id is provided
                            if input_data.upload_id:
                                try:
                                    upload_file_create = UploadFileCreate(
                                        upload_id=input_data.upload_id,
                                        file_type="png",
                                        filename=f"OM_FirstPage_{image_filename}",
                                        file_path=image_path,
                                        doc_type="OM_FirstPage"
                                    )
                                    self.db_service.upload_files_repo.create_upload_file(upload_file_create)
                                    print(f"Created upload_file record for OM first page image: {image_path}")
                                except Exception as e:
                                    print(f"Failed to create upload_file record for image: {str(e)}")
                                    # Continue with classification even if upload_file record creation fails
                        else:
                            print(f"Failed to upload OM first page image: {upload_result.get('error')}")
                except Exception as e:
                    print(f"Failed to extract OM first page image: {str(e)}")
                    # Continue with classification even if image extraction fails

                # Extract text from PDF by page
                pages_text = self.om_extraction_service.extract_text_by_page(local_file_path)

                # Create chunks for classification from the extracted pages
                extraction_result = await self.om_extraction_service.create_chunks_for_classification(pages_text)
                classification_result = await self.om_classification_service.classify_pdf_pages(extraction_result["chunks"], extraction_result["num_chunks"])

                # Generate deal and market descriptions if classification was successful
                deal_description = None
                market_description = None

                if classification_result:
                    try:
                        # Combine executive summary and market overview pages for comprehensive text extraction
                        description_pages = []
                        if classification_result.executive_summary:
                            description_pages.extend(classification_result.executive_summary)
                        if classification_result.market_overview:
                            description_pages.extend(classification_result.market_overview)

                        # Remove duplicates and sort page numbers
                        description_pages = sorted(list(set(description_pages)))

                        if description_pages:
                            # Extract text from all relevant pages once
                            description_text = self.om_extraction_service.get_relevant_description_pages(
                                pages_text,
                                description_pages
                            )

                            # Generate both descriptions using the same comprehensive text
                            deal_description = await self.om_classification_service.generate_description(
                                description_text,
                                "deal"
                            )
                            print(f"Generated deal description: {len(deal_description)} characters")

                            market_description = await self.om_classification_service.generate_description(
                                description_text,
                                "market"
                            )
                            print(f"Generated market description: {len(market_description)} characters")

                    except Exception as e:
                        print(f"Failed to generate descriptions: {str(e)}")
                        # Continue with the process even if description generation fails

                # Save classification result to database if we have the necessary IDs
                if classification_result and input_data.deal_id and input_data.om_upload_file_id:
                    try:
                        from app.models.db.om_classifications import OMClassificationCreate

                        # Create the classification record
                        classification_create = OMClassificationCreate(
                            deal_id=input_data.deal_id,
                            om_upload_file_id=input_data.om_upload_file_id,
                            classification=classification_result.model_dump()
                        )

                        saved_classification = self.db_service.om_classifications_repo.create_om_classification(classification_create)
                        print(f"Successfully saved classification to database with ID: {saved_classification.id}")

                    except Exception as e:
                        print(f"Failed to save classification to database: {str(e)}")
                        # Continue with the process even if database save fails
                else:
                    print("Skipping database save - missing deal_id or om_upload_file_id")

                return ClassificationStageOutput(
                    classification_result=classification_result,
                    description=deal_description,
                    market_description=market_description,
                    image_path=image_path
                )

            finally:
                # Clean up temp file
                cleanup_temp_file(local_file_path)

        except Exception as e:
            log_stage_error("Classification", e, file_url=om_file_path)
            return ClassificationStageOutput(classification_result=None, description=None, market_description=None, image_path=None)
