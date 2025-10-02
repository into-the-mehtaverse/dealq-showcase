from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class UserBase(BaseModel):
    email: str
    name: Optional[str] = None


class UserCreate(UserBase):
    id: Optional[UUID] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None


class User(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
