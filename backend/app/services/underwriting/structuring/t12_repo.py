"""
T12 Repository

Contains utilities and helper functions for T12 data processing.
Handles the multi-step T12 structuring flow: validation → extraction → labeling.
"""

from typing import Dict, List, Any, Optional, Tuple
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from .t12_prompts.input_validation_prompt import create_t12_validation_prompt
from .t12_prompts.line_item_and_totals_prompt import create_t12_line_item_extraction_prompt
from .t12_prompts.category_labelling_prompt import create_t12_category_labeling_prompt
from .utils import parse_json_response
from .t12_utils import (
    match_categories_with_amounts,
    convert_to_objects
)


class T12Repository:
    """Repository for T12 data processing operations."""

    def __init__(self, llm: ChatOpenAI):
        """
        Initialize T12 repository with LLM instance.

        Args:
            llm: LangChain ChatOpenAI instance for LLM calls
        """
        self.llm = llm

    async def process_t12_data(self, t12_text: str) -> Tuple[bool, List[List], str]:
        """
        Process T12 data through the complete flow: validation → extraction → labeling.

        Args:
            t12_text: Raw text extracted from T12 document

        Returns:
            Tuple of (success, structured_data, error_message):
            - success: bool indicating if processing was successful
            - structured_data: List of [line_item, amount, category] arrays
            - error_message: Error message if processing failed, None if successful
        """
        try:
            # Step 1: Validate T12 structure
            print(f"    T12 processing: Starting validation...")
            validation_result = await self._validate_t12_structure(t12_text)

            if not validation_result.get("is_valid", False):
                error_msg = f"T12 validation failed: {validation_result.get('validation_notes', 'Unknown error')}"
                print(f"    T12 processing: {error_msg}")
                return False, [], error_msg

            print(f"    T12 processing: Validation passed - {validation_result.get('extraction_complexity', 'unknown')} complexity")
            print(f"    T12 processing: Validation details: {validation_result}")

            # Step 2: Extract line items and amounts
            print(f"    T12 processing: Starting line item extraction...")
            line_items_and_amounts = await self._extract_t12_line_items(t12_text)

            if not line_items_and_amounts:
                error_msg = "Failed to extract line items from T12"
                print(f"    T12 processing: {error_msg}")
                return False, [], error_msg

            print(f"    T12 processing: Extracted {len(line_items_and_amounts)} line items")

            # Step 3: Label categories
            print(f"    T12 processing: Starting category labeling...")
            line_items_and_categories = await self._label_t12_categories(line_items_and_amounts)

            if not line_items_and_categories:
                error_msg = "Failed to label categories for T12 line items"
                print(f"    T12 processing: {error_msg}")
                return False, [], error_msg

            print(f"    T12 processing: Successfully categorized {len(line_items_and_categories)} items")

            # Step 4: Combine amounts with categories using deterministic matching
            print(f"    T12 processing: Combining amounts with categories...")
            final_categorized_items = match_categories_with_amounts(line_items_and_amounts, line_items_and_categories)

            if not final_categorized_items:
                error_msg = "Failed to combine amounts with categories"
                print(f"    T12 processing: {error_msg}")
                return False, [], error_msg

            print(f"    T12 processing: Successfully combined {len(final_categorized_items)} items")

            # Step 5: Return final structured data
            return True, final_categorized_items, None

        except Exception as e:
            error_msg = f"T12 processing failed: {str(e)}"
            print(f"    T12 processing: {error_msg}")
            return False, [], error_msg

    async def _validate_t12_structure(self, t12_text: str) -> Dict[str, Any]:
        """
        Validate T12 document structure using LLM.

        Args:
            t12_text: Raw text extracted from T12 document

        Returns:
            Dict containing validation results:
            {
                "is_valid": bool,
                "has_line_items": bool,
                "has_t12_totals": bool,
                "has_monthly_breakdowns": bool,
                "validation_notes": str,
                "extraction_complexity": str
            }
        """
        try:
            # Create validation prompt
            prompt = create_t12_validation_prompt(t12_text)

            # Call LLM with validation prompt
            response = await self.llm.ainvoke(prompt)

            # Log raw LLM response for debugging
            print(f"    T12 validation: Raw LLM response: {response.content}")

            # Parse JSON response
            validation_result = parse_json_response(response.content, expected_structure="object")

            # Check if parsing was successful
            if validation_result is None:
                print("T12 validation: Failed to parse LLM response as JSON")
                return {
                    "is_valid": False,
                    "has_line_items": False,
                    "has_t12_totals": False,
                    "has_monthly_breakdowns": False,
                    "validation_notes": "Failed to parse LLM response as JSON",
                    "extraction_complexity": "unknown"
                }

            # Log parsed validation result
            print(f"    T12 validation: Parsed result: {validation_result}")

            return validation_result
        except Exception as e:
            print(f"T12 validation error: {str(e)}")
            return {
                "is_valid": False,
                "has_line_items": False,
                "has_t12_totals": False,
                "has_monthly_breakdowns": False,
                "validation_notes": f"Validation failed: {str(e)}",
                "extraction_complexity": "unknown"
            }

    async def _extract_t12_line_items(self, t12_text: str) -> List[List]:
        """
        Extract line items and amounts from T12 text using LLM.

        Args:
            t12_text: Raw text extracted from T12 document

        Returns:
            List of arrays with [line_item, amount]:
            [
                ["Base Rent", 50000],
                ["CAM Reimbursements", 15000],
                ...
            ]
        """
        try:
            # Create extraction prompt
            prompt = create_t12_line_item_extraction_prompt(t12_text)

            # Call LLM with extraction prompt
            response = await self.llm.ainvoke(prompt)

            # Log raw LLM response for debugging
            print(f"    T12 extraction: Raw LLM response: {response.content}")

            # Parse JSON response as array of arrays
            line_items_and_amounts = parse_json_response(response.content, expected_structure="list")

            # Check if parsing was successful
            if line_items_and_amounts is None:
                print("T12 extraction: Failed to parse LLM response as JSON")
                return []

            # Validate that we got the expected format
            if not isinstance(line_items_and_amounts, list):
                print("T12 extraction: Invalid response format")
                return []

            # Log parsed extraction result
            print(f"    T12 extraction: Parsed {len(line_items_and_amounts)} items: {line_items_and_amounts[:3]}...")

            return line_items_and_amounts
        except Exception as e:
            print(f"T12 extraction error: {str(e)}")
            return []

    async def _label_t12_categories(self, line_items_and_amounts: List[List]) -> List[List]:
        """
        Add category labels to T12 line items using LLM.

        Args:
            line_items_and_amounts: List of [line_item, amount] arrays:
            [
                ["Base Rent", 50000],
                ["CAM Reimbursements", 15000],
                ...
            ]

        Returns:
            List of arrays with [line_item, amount, category]:
            [
                ["Base Rent", 50000, "rental_income"],
                ["CAM Reimbursements", 15000, "reimbursements"],
                ...
            ]
        """
        try:
            # Create category labeling prompt
            prompt = create_t12_category_labeling_prompt(line_items_and_amounts)

            # Call LLM with category labeling prompt
            response = await self.llm.ainvoke(prompt)

            # Log raw LLM response for debugging
            print(f"    T12 categorization: Raw LLM response: {response.content}")

            # Parse JSON response as array of [line_item, amount, category] arrays
            categorized_items = parse_json_response(response.content, expected_structure="list")

            # Check if parsing was successful
            if categorized_items is None:
                print("T12 categorization: Failed to parse LLM response as JSON")
                return []

            # Validate that we got the expected format
            if not isinstance(categorized_items, list):
                print("T12 categorization: Invalid response format")
                return []

            # Log parsed categorization result
            print(f"    T12 categorization: Parsed {len(categorized_items)} items: {categorized_items[:3]}...")

            return categorized_items
        except Exception as e:
            print(f"T12 categorization error: {str(e)}")
            return []
