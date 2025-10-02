from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from uuid import UUID


class OMClassificationBase(BaseModel):
    deal_id: UUID
    om_upload_file_id: UUID
    classification: Dict[str, Any]
    version: int = 1


class OMClassificationCreate(OMClassificationBase):
    pass


class OMClassificationUpdate(BaseModel):
    classification: Optional[Dict[str, Any]] = None
    version: Optional[int] = None


class OMClassification(OMClassificationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
