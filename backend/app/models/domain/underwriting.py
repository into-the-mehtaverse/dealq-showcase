# Underwriting domain Pydantic models

from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ExtractedPropertyInfo(BaseModel):
    """Model for extracted property information with page reference."""
    value: str
    first_page: int

class EnhancedClassificationResult(BaseModel):
    """Model for enhanced classification results. When updating this model, make sure to update the classification/prompts.py file as well with description and example line."""
    property_name: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    address: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    zip_code: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    city: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    state: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    number_of_units: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    year_built: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    parking_spaces: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    gross_square_feet: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    asking_price: Optional[ExtractedPropertyInfo] = Field(None, field_type="property_info")
    t12: List[int] = Field(default=[], field_type="page_list")
    rent_roll: List[int] = Field(default=[], field_type="page_list")
    executive_summary: List[int] = Field(default=[], field_type="page_list")
    market_overview: List[int] = Field(default=[], field_type="page_list")

    @classmethod
    def get_property_info_fields(cls) -> List[str]:
        """Get all property info field names dynamically."""
        return [name for name, field in cls.model_fields.items()
                if field.json_schema_extra and field.json_schema_extra.get("field_type") == "property_info"]

    @classmethod
    def get_page_list_fields(cls) -> List[str]:
        """Get all page list field names dynamically."""
        return [name for name, field in cls.model_fields.items()
                if field.json_schema_extra and field.json_schema_extra.get("field_type") == "page_list"]

    @classmethod
    def from_dict(cls, data: Dict) -> "EnhancedClassificationResult":
        """Create instance from raw classification dictionary."""
        # Process property info fields
        property_info_fields = {}
        for field_name in cls.get_property_info_fields():
            if data.get(field_name) is not None:
                field_data = data[field_name]
                if isinstance(field_data, dict) and "value" in field_data and "first_page" in field_data:
                    property_info_fields[field_name] = ExtractedPropertyInfo(
                        value=str(field_data["value"]).strip(),
                        first_page=int(field_data["first_page"])
                    )
                else:
                    property_info_fields[field_name] = None
            else:
                property_info_fields[field_name] = None

        # Process page list fields
        page_list_fields = {}
        for field_name in cls.get_page_list_fields():
            pages = data.get(field_name, [])
            if isinstance(pages, list):
                # Ensure pages are integers and unique
                clean_pages = []
                for page in pages:
                    try:
                        page_int = int(page)
                        if page_int > 0:  # Page numbers should be positive
                            clean_pages.append(page_int)
                    except (ValueError, TypeError):
                        continue
                page_list_fields[field_name] = sorted(list(set(clean_pages)))
            else:
                page_list_fields[field_name] = []

        # Combine all fields
        all_fields = {**property_info_fields, **page_list_fields}
        return cls(**all_fields)

    @classmethod
    def merge_results(cls, results: List["EnhancedClassificationResult"]) -> "EnhancedClassificationResult":
        """
        Merge multiple classification results into a single result.
        For property info, takes the first occurrence found.
        For page lists, combines all pages and removes duplicates.
        """
        merged_data = {}

        # For property info fields, take the first non-null value found
        for field_name in cls.get_property_info_fields():
            merged_data[field_name] = None
            for result in results:
                field_value = getattr(result, field_name)
                if field_value is not None and merged_data[field_name] is None:
                    merged_data[field_name] = field_value
                    break

        # For page list fields, combine all pages and remove duplicates
        for field_name in cls.get_page_list_fields():
            all_pages = []
            for result in results:
                field_value = getattr(result, field_name)
                if isinstance(field_value, list):
                    all_pages.extend(field_value)
            merged_data[field_name] = sorted(list(set(all_pages)))

        return cls(**merged_data)

    @classmethod
    def create_empty_result(cls) -> Dict:
        """Create an empty result dictionary with all fields set to appropriate defaults."""
        empty_result = {}

        # Property info fields default to None
        for field_name in cls.get_property_info_fields():
            empty_result[field_name] = None

        # Page list fields default to empty list
        for field_name in cls.get_page_list_fields():
            empty_result[field_name] = []

        return empty_result
