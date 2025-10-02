from typing import List, Optional
from uuid import UUID
from supabase import Client
from app.models.db.jobs import Job, JobCreate, JobUpdate


class JobsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table = "jobs"

    def create_job(self, job: JobCreate) -> Job:
        """Create a new job."""
        job_data = job.model_dump(exclude_unset=True)
        # Convert UUID to string for Supabase
        job_data["deal_id"] = str(job_data["deal_id"])
        result = self.client.table(self.table).insert(job_data).execute()
        return Job(**result.data[0])

    def get_job_by_id(self, job_id: UUID) -> Optional[Job]:
        """Get a job by ID."""
        result = self.client.table(self.table).select("*").eq("id", str(job_id)).execute()
        if result.data:
            return Job(**result.data[0])
        return None

    def get_jobs_by_deal_id(self, deal_id: UUID) -> List[Job]:
        """Get all jobs for a specific deal."""
        result = self.client.table(self.table).select("*").eq("deal_id", str(deal_id)).execute()
        return [Job(**job) for job in result.data]

    def get_active_job_by_deal_id(self, deal_id: UUID) -> Optional[Job]:
        """Get the active job (queued or running) for a specific deal."""
        result = (self.client.table(self.table)
                 .select("*")
                 .eq("deal_id", str(deal_id))
                 .in_("status", ["queued", "running"])
                 .execute())
        if result.data:
            return Job(**result.data[0])
        return None

    def update_job(self, job_id: UUID, job_update: JobUpdate) -> Optional[Job]:
        """Update a job by ID."""
        update_data = job_update.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self.get_job_by_id(job_id)

        result = self.client.table(self.table).update(update_data).eq("id", str(job_id)).execute()
        if result.data:
            return Job(**result.data[0])
        return None

    def delete_job(self, job_id: UUID) -> bool:
        """Delete a job by ID."""
        result = self.client.table(self.table).delete().eq("id", str(job_id)).execute()
        return len(result.data) > 0

    def update_job_status(self, job_id: UUID, status: str) -> Optional[Job]:
        """Update job status."""
        return self.update_job(job_id, JobUpdate(status=status))

    def update_job_stage(self, job_id: UUID, stage: str) -> Optional[Job]:
        """Update job stage."""
        return self.update_job(job_id, JobUpdate(stage=stage))

    def mark_job_started(self, job_id: UUID) -> Optional[Job]:
        """Mark job as started with current timestamp."""
        from datetime import datetime
        return self.update_job(job_id, JobUpdate(
            status="running",
            started_at=datetime.utcnow()
        ))

    def mark_job_finished(self, job_id: UUID, status: str = "succeeded") -> Optional[Job]:
        """Mark job as finished with current timestamp and status."""
        from datetime import datetime
        return self.update_job(job_id, JobUpdate(
            status=status,
            finished_at=datetime.utcnow()
        ))

    def increment_attempts(self, job_id: UUID) -> Optional[Job]:
        """Increment the attempts counter for a job."""
        current_job = self.get_job_by_id(job_id)
        if current_job:
            new_attempts = current_job.attempts + 1
            return self.update_job(job_id, JobUpdate(attempts=new_attempts))
        return None
