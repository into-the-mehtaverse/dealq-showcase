from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel
from uuid import UUID


class AccountBase(BaseModel):
    type: Literal['user', 'org']
    user_id: Optional[UUID] = None  # Used when type='user'
    owner_user_id: UUID


class AccountCreate(AccountBase):
    id: Optional[UUID] = None


class AccountUpdate(BaseModel):
    type: Optional[Literal['user', 'org']] = None
    user_id: Optional[UUID] = None
    owner_user_id: Optional[UUID] = None


class Account(AccountBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
