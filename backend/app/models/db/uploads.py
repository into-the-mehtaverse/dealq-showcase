from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class UploadBase(BaseModel):
    deal_id: UUID
    upload_name: Optional[str] = None
    status: str = "pending"


class UploadCreate(UploadBase):
    pass


class UploadUpdate(BaseModel):
    upload_name: Optional[str] = None
    status: Optional[str] = None


class Upload(UploadBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
