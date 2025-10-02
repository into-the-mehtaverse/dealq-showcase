"""
Upload API endpoint for multi-file upload with full pipeline processing.

This endpoint delegates to the orchestrator for pipeline processing.
"""

from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from app.models.api.upload_new import APIUploadResponse
from app.orchestration.upload_stage.request_upload import request_upload_stage, RequestUploadInput
from app.orchestration.upload_stage.confirm_upload import confirm_upload_stage, ConfirmUploadInput
from app.auth.dependencies import get_current_user
from app.auth.entitlements import require_subscription
from app.models.db.users import User
from app.models.db.jobs import JobCreate
from app.services.db.service import DatabaseService
from app.core.supabase_client import get_supabase_client
from app.services.storage.storage_service import StorageService


router = APIRouter()



@router.post("/request-upload")
async def request_upload(
    input_data: RequestUploadInput,
    subscription: dict = Depends(require_subscription)
):
    """
    Request upload endpoint for generating pre-signed URLs.

    Accepts file metadata and returns pre-signed upload URLs and deal ID
    for direct frontend uploads to storage.

    Requires active subscription.
    """
    return await request_upload_stage.process_request_upload(input_data)


@router.post("/confirm")
async def confirm_upload(
    input_data: ConfirmUploadInput,
    background_tasks: BackgroundTasks,
    subscription: dict = Depends(require_subscription)
):
    """
    Confirm upload endpoint for updating upload status.

    Accepts upload ID and confirmation status, updates the upload status to 'uploaded'
    when files have been successfully uploaded to storage.

    Requires active subscription.
    """

    result = await confirm_upload_stage.process_confirm_upload(input_data)

    # If confirm upload is successful, create job record with status queued
    if result.success:
        # Verify user owns the deal
        db_service = DatabaseService(get_supabase_client())
        upload_record = db_service.uploads_repo.get_upload_by_id(input_data.upload_id)

        if not upload_record:
            raise HTTPException(status_code=404, detail="Upload not found")

        # if str(upload_record.user_id) != str(current_user.id):
        #     raise HTTPException(status_code=403, detail="Access denied to this deal")

        # Create job record
        job_create = JobCreate(
            deal_id=upload_record.deal_id,
            status="queued",
            stage="pending"
        )
        job_record = db_service.jobs_repo.create_job(job_create)

        # Add background job processing to background tasks
        background_tasks.add_task(
            process_extract_and_structure_background,
            str(job_record.id)
        )

        # Return job id along with confirm result immediately
        return {
            "confirm_result": result,
            "job_id": str(job_record.id),
            "deal_id": str(upload_record.deal_id),
            "processing_completed": False  # Now false since it's running in background
        }

    return result


async def process_extract_and_structure_background(job_id: str):
    """
    Background task to process extract and structure pipeline.
    This runs asynchronously after the API response is sent.
    """
    try:
        from app.orchestration._pipeline.extract_and_structure_orchestrator import extract_and_structure_orchestrator

        # Process the pipeline (orchestrator handles all status updates)
        deal_id = await extract_and_structure_orchestrator.process_extract_and_structure(job_id)

        # Update job status to succeeded
        db_service = DatabaseService(get_supabase_client())
        db_service.jobs_repo.update_job_status(job_id, "succeeded")
        print(f"Background job completed successfully for Deal ID {deal_id}")

    except Exception as e:
        print(f"Background job failed: {str(e)}")
        # Update job status to failed
        try:
            db_service = DatabaseService(get_supabase_client())
            db_service.jobs_repo.update_job_status(job_id, "failed")
        except Exception as update_error:
            print(f"Failed to update job status to failed: {str(update_error)}")


@router.get("/{job_id}/status")
async def get_job_status(job_id: str):
    """
    Get job status endpoint for frontend polling.

    Returns the current status and details of a specific job.

    Note: Accessible without subscription - users can check status of existing jobs.
    """
    try:
        from uuid import UUID

        # Validate job_id format
        try:
            job_uuid = UUID(job_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID format")

        # Get job status from database
        db_service = DatabaseService(get_supabase_client())
        job_record = db_service.jobs_repo.get_job_by_id(job_uuid)

        if not job_record:
            raise HTTPException(status_code=404, detail="Job not found")

        # Return job status information
        return {
            "job_id": str(job_record.id),
            "deal_id": str(job_record.deal_id),
            "status": job_record.status,
            "stage": job_record.stage,
            "attempts": job_record.attempts,
            "created_at": job_record.created_at.isoformat() if job_record.created_at else None,
            "started_at": job_record.started_at.isoformat() if job_record.started_at else None,
            "finished_at": job_record.finished_at.isoformat() if job_record.finished_at else None,
            "error_text": job_record.error_text
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.get("/draft/{deal_id}")
async def get_draft_deal(
    deal_id: str,
    subscription: dict = Depends(require_subscription)
):
    """
    Get draft deal information with signed URLs for files.

    Returns deal information in APIUploadResponse format including
    signed URLs for uploaded files and structured data.

    Note: Accessible without subscription - users can view existing draft deals.
    """
    try:
        from uuid import UUID

        # Validate deal_id format
        try:
            deal_uuid = UUID(deal_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid deal ID format")

        # Get deal information from database
        db_service = DatabaseService(get_supabase_client())
        deal_record = db_service.deals_repo.get_deal_by_id(deal_uuid)

        if not deal_record:
            raise HTTPException(status_code=404, detail="Deal not found")

        # Get uploads for this deal
        uploads = db_service.uploads_repo.get_uploads_by_deal_id(deal_uuid)
        if not uploads:
            raise HTTPException(status_code=404, detail="No uploads found for deal")

        upload_id = uploads[0].id  # Assuming one upload per deal

        # Get upload files for this upload
        upload_files = db_service.upload_files_repo.get_upload_files_by_upload_id(upload_id)

        # Generate signed URLs for files
        storage_service = StorageService()
        om_file_url = None
        t12_file_url = None
        rent_roll_file_url = None

        # Track signed URLs for each file type
        file_signed_urls = {}

        for upload_file in upload_files:
            try:
                signed_url = storage_service.get_signed_url(upload_file.file_path)

                if upload_file.doc_type == "OM":
                    om_file_url = signed_url
                    file_signed_urls[upload_file.id] = signed_url
                elif upload_file.doc_type == "T12":
                    t12_file_url = signed_url
                    file_signed_urls[upload_file.id] = signed_url
                elif upload_file.doc_type == "RR":
                    rent_roll_file_url = signed_url
                    file_signed_urls[upload_file.id] = signed_url
            except Exception as e:
                print(f"Failed to generate signed URL for {upload_file.file_path}: {str(e)}")

        # Prepare files list with signed URLs
        files = []
        for upload_file in upload_files:
            # Use signed URL if available, otherwise use file path as fallback
            file_url = file_signed_urls.get(upload_file.id, upload_file.file_path)

            files.append({
                "filename": upload_file.filename,
                "document_type": upload_file.doc_type,
                "file_type": upload_file.file_type,
                "file_url": file_url
            })

        # Prepare the response
        response_data = {
            "success": True,
            "message": "Draft deal retrieved successfully",
            "deal_id": str(deal_record.id),
            "files": files,
            "om_file_url": om_file_url,
            "t12_file_url": t12_file_url,
            "rent_roll_file_url": rent_roll_file_url,
            "property_info": {
                "property_name": deal_record.property_name,
                "address": deal_record.address,
                "city": deal_record.city,
                "state": deal_record.state,
                "zip_code": deal_record.zip_code,
                "number_of_units": deal_record.number_of_units,
                "year_built": deal_record.year_built,
                "parking_spaces": deal_record.parking_spaces,
                "gross_square_feet": deal_record.gross_square_feet,
                "asking_price": float(deal_record.asking_price) if deal_record.asking_price else None,
                "description": deal_record.description,
                "market_description": deal_record.market_description
            },
            "structured_t12": deal_record.t12,
            "structured_rent_roll": deal_record.rent_roll,
            "classification_result": {
                "property_name": {"value": deal_record.property_name, "first_page": 1} if deal_record.property_name else None,
                "address": {"value": deal_record.address, "first_page": 1} if deal_record.address else None,
                "city": {"value": deal_record.city, "first_page": 1} if deal_record.city else None,
                "state": {"value": deal_record.state, "first_page": 1} if deal_record.state else None,
                "zip_code": {"value": deal_record.zip_code, "first_page": 1} if deal_record.zip_code else None,
                "number_of_units": {"value": str(deal_record.number_of_units), "first_page": 1} if deal_record.number_of_units else None,
                "year_built": {"value": str(deal_record.year_built), "first_page": 1} if deal_record.year_built else None,
                "parking_spaces": {"value": str(deal_record.parking_spaces), "first_page": 1} if deal_record.parking_spaces else None,
                "gross_square_feet": {"value": str(deal_record.gross_square_feet), "first_page": 1} if deal_record.gross_square_feet else None,
                "asking_price": {"value": str(deal_record.asking_price), "first_page": 1} if deal_record.asking_price else None,
                "t12": [],  # Page references not stored in deal record
                "rent_roll": []  # Page references not stored in deal record
            },
            "error_code": None,
            "details": None
        }
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting draft deal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get draft deal: {str(e)}")
