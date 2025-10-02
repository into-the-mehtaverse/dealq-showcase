"""
Classification prompt templates for LLM-based page classification.

Separated from business logic for easier maintenance and prompt iteration.

NOTE: When updating the EnhancedClassificationResult model fields, manually update this prompt:
1. Add/remove field descriptions in the numbered list
2. Update the JSON response format
3. Update the example response
4. Update the field name lists in the instructions
"""

from langchain.prompts import PromptTemplate


def create_classification_prompt() -> PromptTemplate:
    """Create the prompt template for page classification."""
    template = """

[ REDACTED FOR SECURITY / PROTECTING IP ]

The text chunk covers the following pages: {pages}

Text to analyze:
{text}

Respond with a JSON object using this exact format:

{{
    "property_name": {{"value": "extracted_name", "first_page": page_number}} or null,
    "address": {{"value": "extracted_address", "first_page": page_number}} or null,
    "zip_code": {{"value": "extracted_zip_code", "first_page": page_number}} or null,
    "city": {{"value": "extracted_city", "first_page": page_number}} or null,
    "state": {{"value": "extracted_state", "first_page": page_number}} or null,
    "number_of_units": {{"value": "extracted_units", "first_page": page_number}} or null,
    "year_built": {{"value": "extracted_year", "first_page": page_number}} or null,
    "asking_price": {{"value": "extracted_price", "first_page": page_number}} or null,
    "parking_spaces": {{"value": "extracted_parking_spaces", "first_page": page_number}} or null,
    "gross_square_feet": {{"value": "extracted_gross_square_feet", "first_page": page_number}} or null,
    "t12": [page_numbers],
    "rent_roll": [page_numbers],
    "executive_summary": [page_numbers],
    "market_overview": [page_numbers]
}}

[ REDACTED FOR SECURITY / PROTECTING IP ]

Example response:
{{
    "property_name": {{"value": "Sunset Manor Apartments", "first_page": 1}},
    "address": {{"value": "456 Oak Street, Los Angeles, CA 90210", "first_page": 1}},
    "zip_code": {{"value": "90210", "first_page": 1}},
    "city": {{"value": "Los Angeles", "first_page": 1}},
    "state": {{"value": "CA", "first_page": 1}},
    "number_of_units": {{"value": "120", "first_page": 2}},
    "year_built": {{"value": "1985", "first_page": 2}},
    "asking_price": {{"value": "10000000", "first_page": 2}},
    "parking_spaces": {{"value": "100", "first_page": 2}},
    "gross_square_feet": {{"value": "100000", "first_page": 2}},
    "t12": [12, 13],
    "rent_roll": [15, 16],
    "executive_summary": [3],
    "market_overview": [10]
}}

JSON Response:
"""

    return PromptTemplate(
        input_variables=["pages", "text"],
        template=template
    )
