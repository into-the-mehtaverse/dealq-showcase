"""
Extract and Structure Orchestrator

Handles the background processing pipeline for:
1. OM classification
2. Rent roll extraction
3. T12 extraction
4. Data structuring
5. Deal status updates
"""

from typing import Optional
from uuid import UUID
from app.services.db.service import DatabaseService
from app.core.supabase_client import get_supabase_client
from app.orchestration.om_classification.classification_stage import ClassificationStage
from app.models.orchestration.classification_stage import ClassificationStageInput
from app.orchestration.rr_extraction.rr_extract_stage import RRExtractStage
from app.models.orchestration.rr_extract_stage import RRExtractStageInput
from app.orchestration.t12_extraction.t12_extract_stage import T12ExtractStage
from app.models.orchestration.t12_extract_stage import T12ExtractStageInput
from app.orchestration.structure.structure_stage import StructureStage
from app.models.orchestration.structure_stage import StructureStageInput
from app.models.db.deals import DealUpdate

class ExtractAndStructureOrchestrator:
    """Orchestrator for the extract and structure pipeline."""

    def __init__(self):
        self.db_service = DatabaseService(get_supabase_client())

    async def process_extract_and_structure(self, job_id: str) -> str:
        """
        Process the extract and structure pipeline for a given job.

        Args:
            job_id: ID of the job to process

        Returns:
            str: Deal ID that was processed
        """
        try:
            # 1. input is job_id
            # 2. pull deal_id from job record
            job_record = self.db_service.jobs_repo.get_job_by_id(UUID(job_id))
            if not job_record:
                raise Exception(f"Job {job_id} not found")

            deal_id = job_record.deal_id

            # 3. update status to running
            updated_job = self.db_service.jobs_repo.update_job_status(UUID(job_id), "running")
            if not updated_job:
                raise Exception(f"Failed to update job {job_id} status to running")

            # Update stage to show we're starting data processing
            self.db_service.jobs_repo.update_job_stage(UUID(job_id), "uploading_data")
            print(f"Job {job_id} stage updated to: uploading_data")

            # Get upload_id from the job record to find associated files
            uploads = self.db_service.uploads_repo.get_uploads_by_deal_id(deal_id)
            if not uploads:
                raise Exception(f"No uploads found for deal {deal_id}")

            upload_id = uploads[0].id  # Assuming one upload per deal for now

            # Get file paths from upload_files records
            upload_files = self.db_service.upload_files_repo.get_upload_files_by_upload_id(upload_id)

            # Extract file paths by document type
            om_file_path = None
            rr_file_path = None
            t12_file_path = None
            om_upload_file = None  # Store the OM file record

            for upload_file in upload_files:
                if upload_file.doc_type == "OM" and upload_file.file_type == "pdf":
                    om_file_path = upload_file.file_path
                    om_upload_file = upload_file  # Store the OM file record
                elif upload_file.doc_type == "RR":
                    rr_file_path = upload_file.file_path
                elif upload_file.doc_type == "T12":
                    t12_file_path = upload_file.file_path

            print(f"File paths found - OM: {om_file_path}, RR: {rr_file_path}, T12: {t12_file_path}")

            # 4. classifiy_om stage
            classification_result = None
            classification_image_path = None
            if om_file_path:
                # Update stage to show OM classification in progress
                self.db_service.jobs_repo.update_job_stage(UUID(job_id), "classifying_om")
                print(f"Job {job_id} stage updated to: classifying_om")

                classification_stage = ClassificationStage()
                classification_input = ClassificationStageInput(
                    om_file_path=om_file_path,
                    upload_id=upload_id,
                    deal_id=deal_id,
                    om_upload_file_id=om_upload_file.id
                )
                classification_output = await classification_stage.process_classification(classification_input)
                classification_result = classification_output.classification_result
                deal_description = classification_output.description
                market_description = classification_output.market_description
                classification_image_path = classification_output.image_path
                print(f"OM classification completed: {classification_result is not None}")
                if classification_image_path:
                    print(f"OM first page image extracted: {classification_image_path}")
            else:
                print("No OM file found, skipping classification")

            # 5. extract_rr stage
            rr_extraction_result = None
            if rr_file_path:
                # Update stage to show rent roll extraction in progress
                self.db_service.jobs_repo.update_job_stage(UUID(job_id), "extracting_rent_roll")
                print(f"Job {job_id} stage updated to: extracting_rent_roll")

                rr_extract_stage = RRExtractStage()
                rr_input = RRExtractStageInput(
                    rr_file_path=rr_file_path,
                    om_classification=classification_result.model_dump() if classification_result else None
                )
                rr_output = await rr_extract_stage.process_rr_extraction(rr_input)
                rr_extraction_result = rr_output.rr_extraction
                print(f"RR extraction completed: {rr_output.extraction_success}")
            else:
                print("No RR file found, skipping RR extraction")

            # 6. extract_t12 stage
            t12_extraction_result = None
            if t12_file_path:
                # Update stage to show T12 extraction in progress
                self.db_service.jobs_repo.update_job_stage(UUID(job_id), "extracting_t12")
                print(f"Job {job_id} stage updated to: extracting_t12")

                t12_extract_stage = T12ExtractStage()
                t12_input = T12ExtractStageInput(
                    t12_file_path=t12_file_path,
                    om_classification=classification_result.model_dump() if classification_result else None
                )
                t12_output = await t12_extract_stage.process_t12_extraction(t12_input)
                t12_extraction_result = t12_output.t12_extraction
                print(f"T12 extraction completed: {t12_output.extraction_success}")
            else:
                print("No T12 file found, skipping T12 extraction")

            # 7. pass extract_rr and extract_12 to structure stage
            structure_result = None
            if rr_extraction_result or t12_extraction_result:
                # Update stage to show structuring in progress
                self.db_service.jobs_repo.update_job_stage(UUID(job_id), "structuring_information")
                print(f"Job {job_id} stage updated to: structuring_information")

                structure_stage = StructureStage()
                structure_input = StructureStageInput(
                    rr_extraction=rr_extraction_result,
                    t12_plain_text=t12_extraction_result.plain_text if t12_extraction_result else None
                )
                structure_output = await structure_stage.process_structure(structure_input)
                structure_result = structure_output
                print(f"Structure stage completed: {structure_output.structure_success}")
            else:
                print("No extraction results found, skipping structure stage")

            # 8. update deal record with classification data and structured data if available
            # Always update the deal if we have classification data, regardless of RR/T12
            deal_update_data = {
                "status": "draft"
            }

            # Add classification data if available
            if classification_result:
                print(f"Adding classification data to deal update...")
                classification_dict = classification_result.model_dump()
                print(f"Classification dict: {classification_dict}")

                # Add individual classification fields
                if classification_result.property_name:
                    deal_update_data["property_name"] = classification_result.property_name.value
                if classification_result.address:
                    deal_update_data["address"] = classification_result.address.value
                if classification_result.zip_code:
                    deal_update_data["zip_code"] = classification_result.zip_code.value
                if classification_result.city:
                    deal_update_data["city"] = classification_result.city.value
                if classification_result.state:
                    deal_update_data["state"] = classification_result.state.value
                if classification_result.number_of_units:
                    deal_update_data["number_of_units"] = classification_result.number_of_units.value
                if classification_result.year_built:
                    deal_update_data["year_built"] = classification_result.year_built.value
                if classification_result.parking_spaces:
                    deal_update_data["parking_spaces"] = classification_result.parking_spaces.value
                if classification_result.gross_square_feet:
                    deal_update_data["gross_square_feet"] = classification_result.gross_square_feet.value
                if classification_result.asking_price:
                    deal_update_data["asking_price"] = classification_result.asking_price.value

                print(f"Deal update data after adding classification: {deal_update_data}")
            else:
                print("No classification result available for deal update")

            # Add image path if available
            if classification_image_path:
                deal_update_data["image_path"] = classification_image_path

            else:
                print("No image path available for deal update")

            # Add generated descriptions if available
            if deal_description:
                deal_update_data["description"] = deal_description
                print(f"Added deal description to deal update: {len(deal_description)} characters")
            else:
                print("No deal description available for deal update")

            if market_description:
                deal_update_data["market_description"] = market_description
                print(f"Added market description to deal update: {len(market_description)} characters")
            else:
                print("No market description available for deal update")

            # Add structured data if available (from structure stage)
            if structure_result and structure_result.structure_success:
                if structure_result.structured_rent_roll:
                    deal_update_data["rent_roll"] = structure_result.structured_rent_roll

                if structure_result.structured_t12:
                    deal_update_data["t12"] = structure_result.structured_t12


            else:
                print("No structured data available, updating deal with classification only")

            # Update the deal record
            deal_update = DealUpdate(**deal_update_data)
            updated_deal = self.db_service.deals_repo.update_deal(deal_id, deal_update)

            if updated_deal:
                print(f"Deal {deal_id} updated to draft status successfully")
            else:
                print(f"Warning: Failed to update deal {deal_id}")

            # 9. update job record with status to succeeded
            job_success = self.db_service.jobs_repo.update_job_status(UUID(job_id), "succeeded")
            if job_success:
                print(f"Job {job_id} marked as succeeded")
            else:
                print(f"Warning: Failed to update job {job_id} status to succeeded")

            # 10. return deal_id
            return str(deal_id)

        except Exception as e:
            raise Exception(f"Extract and structure pipeline failed: {str(e)}")


# Create singleton instance
extract_and_structure_orchestrator = ExtractAndStructureOrchestrator()
