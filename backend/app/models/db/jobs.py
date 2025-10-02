from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class JobBase(BaseModel):
    deal_id: UUID
    status: str = "queued"
    stage: Optional[str] = None
    error_text: Optional[str] = None
    attempts: int = 0
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    status: Optional[str] = None
    stage: Optional[str] = None
    error_text: Optional[str] = None
    attempts: Optional[int] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class Job(JobBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
