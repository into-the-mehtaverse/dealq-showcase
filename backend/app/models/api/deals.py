from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from app.models.db.deals import Deal, DealSummary

# Delete multiple deals
class DeleteMultipleDealsRequest(BaseModel):
    deal_ids: List[UUID]

# Bulk status update request
class BulkStatusUpdateRequest(BaseModel):
    deal_ids: List[UUID]
    status: str

# API request model for updating deals - only includes user-editable fields
class UpdateDealRequest(BaseModel):
    # Basic property information (safe to edit)
    property_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    number_of_units: Optional[int] = None
    year_built: Optional[int] = None
    parking_spaces: Optional[int] = None
    gross_square_feet: Optional[int] = None

    # Financial information (safe to edit)
    asking_price: Optional[float] = None
    revenue: Optional[float] = None
    expenses: Optional[float] = None

    # Descriptions (safe to edit)
    description: Optional[str] = None
    market_description: Optional[str] = None

# API response model that extends the database Deal model
class DealResponse(Deal):
    # File URLs (signed URLs for frontend access)
    excel_file_url: Optional[str] = None
    t12_file_url: Optional[str] = None
    rent_roll_file_url: Optional[str] = None
    om_file_url: Optional[str] = None
    image_url: Optional[str] = None  # Signed URL, different from image_path

    # AI-processed classification data
    om_classification: Optional[Dict[str, Any]] = None

# API response model for deal updates - includes file URLs like DealResponse
class UpdateDealResponse(Deal):
    # File URLs (signed URLs for frontend access)
    excel_file_url: Optional[str] = None
    t12_file_url: Optional[str] = None
    rent_roll_file_url: Optional[str] = None
    om_file_url: Optional[str] = None
    image_url: Optional[str] = None  # Signed URL, different from image_path

    # AI-processed classification data
    om_classification: Optional[Dict[str, Any]] = None


# API response model for dashboard deals endpoint
class DashboardDealsResponse(BaseModel):
    deals: List[DealSummary]
    active_deals_count: int
    last_30_days_total_value: float
    draft_deals_count: int
    last_30_days_deals_count: int
