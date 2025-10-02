from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class UploadFileBase(BaseModel):
    upload_id: UUID
    file_type: str
    filename: str
    file_path: str
    doc_type: Optional[str] = None


class UploadFileCreate(UploadFileBase):
    pass


class UploadFileUpdate(BaseModel):
    file_type: Optional[str] = None
    filename: Optional[str] = None
    file_path: Optional[str] = None
    doc_type: Optional[str] = None


class UploadFile(UploadFileBase):
    id: UUID
    uploaded_at: datetime

    class Config:
        from_attributes = True
