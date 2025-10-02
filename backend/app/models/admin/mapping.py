"""
Mapping models for Excel generation and model registration.

This module serves as the single source of truth for all mapping structures
used throughout the application.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from enum import Enum


class MappingType(str, Enum):
    """Types of mappings supported by the system."""
    TABULAR = "tabular"
    PROPERTY_INFO = "property_info"


class CellLocation(BaseModel):
    """Represents a specific cell location in an Excel sheet."""
    sheet: str = Field(..., description="Name of the Excel sheet")
    cell: str = Field(..., description="Cell address (e.g., 'B5', 'N12')")


class TabularMapping(BaseModel):
    """Mapping configuration for tabular data (rent_roll, t12)."""
    sheet_name: str = Field(..., description="Name of the Excel sheet")
    data_start_row: int = Field(..., description="Row number where data insertion starts")
    columns: Dict[str, str] = Field(..., description="Field to column letter mapping")

    @property
    def mapping_type(self) -> MappingType:
        return MappingType.TABULAR

    @property
    def column_count(self) -> int:
        return len(self.columns)


class PropertyInfoMapping(BaseModel):
    """Mapping configuration for single-cell property information."""
    type: str = Field(default="property_info", description="Type identifier")
    cells: Dict[str, CellLocation] = Field(..., description="Field to cell location mapping")

    @property
    def mapping_type(self) -> MappingType:
        return MappingType.PROPERTY_INFO

    @property
    def fields_mapped(self) -> int:
        return len(self.cells)


class ModelMapping(BaseModel):
    """Complete mapping configuration for an Excel model."""
    model_id: str = Field(..., description="Unique identifier for the model")
    model_name: str = Field(..., description="Human-readable name for the model")
    mappings: Dict[str, Any] = Field(..., description="Category-specific mappings")

    def get_tabular_mapping(self, category: str) -> Optional[TabularMapping]:
        """Get tabular mapping for a specific category."""
        mapping_data = self.mappings.get(category)
        if mapping_data and "sheet_name" in mapping_data:
            return TabularMapping(**mapping_data)
        return None

    def get_property_info_mapping(self) -> Optional[PropertyInfoMapping]:
        """Get property info mapping."""
        mapping_data = self.mappings.get("property_info")
        if mapping_data and mapping_data.get("type") == "property_info":
            # Convert cell dictionaries to CellLocation objects
            cells = {}
            for field, cell_data in mapping_data.get("cells", {}).items():
                cells[field] = CellLocation(**cell_data)
            return PropertyInfoMapping(cells=cells)
        return None


# Property info field mapping - maps classification fields to Excel generation fields
PROPERTY_INFO_FIELD_MAPPING = {
    "property_name": "name",
    "address": "address",
    "zip_code": "zip_code",
    "year_built": "year_built",
    "parking_spaces": "parking_spots",  # Note: different field name
    "gross_square_feet": "gross_square_feet",
    "asking_price": "broker_price"
}

# Supported categories for structuring and Excel generation
SUPPORTED_CATEGORIES = ["rent_roll", "t12", "property_info"]

# Field definitions for model registration
FIELD_DEFINITIONS = {
    "rent_roll": ["unit", "unit_type", "status", "unit_size", "rent", "lease_expiration"],
    "t12": ["line_item", "category", "total"],
    "property_info": list(PROPERTY_INFO_FIELD_MAPPING.values())  # Use Excel field names
}
