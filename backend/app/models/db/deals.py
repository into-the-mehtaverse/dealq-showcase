from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from uuid import UUID



class DealBase(BaseModel):
    user_id: UUID
    property_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    number_of_units: Optional[int] = None
    year_built: Optional[int] = None
    parking_spaces: Optional[int] = None
    gross_square_feet: Optional[int] = None
    asking_price: Optional[float] = None
    revenue: Optional[float] = None
    expenses: Optional[float] = None
    t12: Optional[List[Dict[str, Any]]] = None
    rent_roll: Optional[List[Dict[str, Any]]] = None
    description: Optional[str] = None
    market_description: Optional[str] = None
    excel_file_path: Optional[str] = None
    image_path: Optional[str] = None
    status: str = "draft"


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    user_id: Optional[UUID] = None
    property_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    number_of_units: Optional[int] = None
    year_built: Optional[int] = None
    parking_spaces: Optional[int] = None
    gross_square_feet: Optional[int] = None
    asking_price: Optional[float] = None
    revenue: Optional[float] = None
    expenses: Optional[float] = None
    t12: Optional[List[Dict[str, Any]]] = None
    rent_roll: Optional[List[Dict[str, Any]]] = None
    description: Optional[str] = None
    market_description: Optional[str] = None
    excel_file_path: Optional[str] = None
    image_path: Optional[str] = None
    status: Optional[str] = "draft"


class Deal(DealBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DealSummary(BaseModel):
    """Simplified deal model for dashboard listings."""
    id: UUID
    property_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    number_of_units: Optional[int] = None
    year_built: Optional[int] = None
    excel_file_path: Optional[str] = None
    image_path: Optional[str] = None
    image_url: Optional[str] = None

    asking_price: Optional[float] = None
    revenue: Optional[float] = None
    expenses: Optional[float] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True
