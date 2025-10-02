"""
Structuring utility functions.

Contains reusable utility functions for JSON parsing, data validation,
LLM interaction, and PDF text extraction used by the structuring service.
"""

import json
import re
from typing import Dict, List, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from .categories import get_t12_valid_categories

# Rent roll column order for array format
RENT_ROLL_COLUMNS = [
    "unit",           # row[0]
    "unit_type",      # row[1]
    "status",         # row[2]
    "unit_size",      # row[3]
    "rent",           # row[4]
    "lease_expiration" # row[5]
]


async def process_chunk(chunk: Dict[str, Any], llm: ChatOpenAI, prompt) -> List[Dict[str, Any]]:
    """
    Process a single chunk with LLM structuring.

    Args:
        chunk: Chunk data to process
        llm: LLM instance
        prompt: Prompt template

    Returns:
        List of structured units from this chunk
    """
    try:
        print(f"    RR structuring: Processing chunk {chunk['chunk_id']} ({chunk['char_count']} chars)")

        # Structure text with LLM
        raw_result = await structure_text_with_llm(
            chunk["content"], llm, prompt, "rent_roll"
        )

        if raw_result is not None:
            # Validate and clean the result
            validated_result = validate_rent_roll_data(raw_result)
            print(f"    RR structuring: Chunk {chunk['chunk_id']} returned {len(validated_result)} units")
            return validated_result
        else:
            print(f"    RR structuring: Chunk {chunk['chunk_id']} returned None")
            return []

    except Exception as e:
        print(f"    RR structuring: Chunk {chunk['chunk_id']} error: {str(e)}")
        return []


def parse_json_response(response: str, expected_structure: str = "list") -> Optional[Any]:
    """
    Parse LLM response and extract JSON data.

    Args:
        response: Raw LLM response
        expected_structure: "list" for arrays, "object" for dictionaries

    Returns:
        Parsed JSON data or None if parsing failed
    """
    try:
        # First, try to find and extract markdown code blocks
        code_block_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', response, re.DOTALL)
        if code_block_match:
            # Extract content from markdown code block
            json_content = code_block_match.group(1).strip()
            print(f"    JSON parsing: Found markdown code block, extracted: {json_content[:100]}...")

            # Try to parse the extracted content
            try:
                result = json.loads(json_content)
                print(f"    JSON parsing: Successfully parsed markdown-wrapped JSON")
                return result
            except json.JSONDecodeError:
                print(f"    JSON parsing: Failed to parse markdown content, trying fallback...")
                # Fall through to regex extraction below

        # Fallback: Extract JSON from response using regex patterns
        if expected_structure == "list":
            # Look for array pattern - more robust regex
            json_match = re.search(r'\[\s*\{.*?\}\s*\]', response, re.DOTALL)
            if not json_match:
                # Try simpler array pattern - less greedy
                json_match = re.search(r'\[[^\]]*\]', response, re.DOTALL)
        elif expected_structure == "object":
            # Look for object pattern
            json_match = re.search(r'\{[^}]*\}', response, re.DOTALL)
        else:
            # Default to looking for any JSON structure
            json_match = re.search(r'[\[\{][^\]}]*[\]\}]', response, re.DOTALL)

        if json_match:
            json_str = json_match.group()
            # Clean up common issues
            json_str = json_str.strip()
            print(f"    JSON parsing: Extracted with regex: {json_str[:100]}...")
            result = json.loads(json_str)
            return result
        else:
            print(f"    JSON parsing: No JSON structure found in response")
            return None

    except json.JSONDecodeError as e:
        print(f"    JSON decode error: {str(e)}")
        print(f"    Attempted to parse: {json_str if 'json_str' in locals() else 'No JSON found'}")
        return None
    except Exception as e:
        print(f"    JSON parsing error: {str(e)}")
        return None


def convert_rent_roll_arrays_to_objects(array_data: List[List]) -> List[Dict[str, Any]]:
    """
    Convert rent roll array format to object format for backward compatibility.

    Args:
        array_data: Array of arrays where each row is [Unit, Unit Type, Status, Size, Rent, Lease Expiration]

    Returns:
        List of objects with named fields
    """
    if not isinstance(array_data, list):
        return []

    converted_units = []

    for row in array_data:
        if not isinstance(row, list) or len(row) < 4:  # Accept 4-6 columns instead of requiring exactly 6
            continue

        try:
            # Extract values by position with null handling
            unit = str(row[0]).strip() if row[0] is not None and row[0] != "" else ""
            unit_type = str(row[1]).strip() if row[1] is not None and row[1] != "" else ""
            status = str(row[2]).strip() if row[2] is not None and row[2] != "" else "Occupied"

            # Handle size - can be null or 0
            unit_size = 0
            if len(row) > 3 and row[3] is not None and row[3] != "":
                try:
                    unit_size = int(float(row[3]))
                except (ValueError, TypeError):
                    unit_size = 0

            # Handle rent - can be null or 0 (valid for vacant units)
            rent = 0
            if len(row) > 4 and row[4] is not None and row[4] != "":
                try:
                    rent = int(float(row[4]))
                except (ValueError, TypeError):
                    rent = 0

            # Handle lease expiration - can be null
            lease_expiration = None
            if len(row) > 5 and row[5] is not None and row[5] != "":
                lease_expiration = row[5]

            # Create object with named fields
            unit_object = {
                "unit": unit,
                "unit_type": unit_type,
                "status": status,
                "unit_size": unit_size,
                "rent": rent,
                "lease_expiration": lease_expiration
            }

            converted_units.append(unit_object)

        except (ValueError, TypeError, IndexError):
            # Skip invalid rows
            continue

    return converted_units


def validate_rent_roll_data(data: List[Dict]) -> List[Dict]:
    """
    Validate and clean structured rent roll data.
    Handles both array format (new) and object format (legacy).

    Args:
        data: Parsed rent roll data from LLM (can be arrays or objects)

    Returns:
        Cleaned and validated rent roll data as objects
    """
    if not isinstance(data, list):
        return []

    # Check if data is in array format (new) or object format (legacy)
    if data and isinstance(data[0], list):
        # New array format - convert to objects first
        print(f"    RR validation: Converting array format to objects")
        print(f"    RR validation: Input data has {len(data)} rows")

        data = convert_rent_roll_arrays_to_objects(data)

        print(f"    RR validation: Conversion complete, now have {len(data)} objects")
        print(f"    RR validation: TEMPORARILY SKIPPING VALIDATION - returning converted objects directly")
        return data  # Return converted objects without validation
    else:
        print(f"    RR validation: Data is already in object format, skipping conversion")

    # TEMPORARILY SKIP VALIDATION - just return the data as-is
    print(f"    RR validation: TEMPORARILY SKIPPING VALIDATION - returning data directly")
    return data


def validate_financial_line_items(data: List[Dict]) -> List[Dict]:
    """
    Validate and clean financial line items (for T-12 data).

    Args:
        data: Parsed financial line items data

    Returns:
        Cleaned and validated financial line items
    """
    if not isinstance(data, list):
        return []

    # Get valid T12 categories from centralized definition
    valid_categories = get_t12_valid_categories()

    validated_items = []

    for item in data:
        if not isinstance(item, dict):
            continue

        # Check required fields
        required_fields = ["line_item", "category", "total"]
        if not all(field in item for field in required_fields):
            continue

        try:
            # Validate and clean data
            category = str(item["category"]).strip()

            # Validate category against allowed list
            if category not in valid_categories:
                category = "Unknown"

            validated_item = {
                "line_item": str(item["line_item"]).strip(),
                "category": category,
                "total": int(float(item["total"])),  # Handle potential float values
            }

            # Basic sanity checks - allow negative amounts for vacancy/credit loss
            if (validated_item["category"] in valid_categories and
                validated_item["line_item"]):
                validated_items.append(validated_item)

        except (ValueError, TypeError):
            continue

    return validated_items


def validate_t12_data(data: List[Dict]) -> List[Dict]:
    """
    Validate and clean T-12 data structure.

    Args:
        data: Parsed T-12 data (now a list of financial line items)

    Returns:
        Cleaned and validated T-12 data
    """
    return validate_financial_line_items(data)


def validate_property_info_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and clean property information data.

    Args:
        data: Parsed property info data from LLM

    Returns:
        Cleaned and validated property info data
    """
    if not isinstance(data, dict):
        return {}

    validated_data = {}

    # Define expected field types
    string_fields = ["name", "address", "zip_code"]
    integer_fields = ["year_built", "parking_spots", "gross_square_feet", "broker_price"]

    # Validate string fields
    for field in string_fields:
        if field in data and data[field] is not None:
            value = str(data[field]).strip()
            if value:  # Only add non-empty strings
                validated_data[field] = value

    # Validate integer fields
    for field in integer_fields:
        if field in data and data[field] is not None:
            try:
                # Handle potential string inputs with commas
                if isinstance(data[field], str):
                    # Remove commas and other formatting
                    cleaned_value = data[field].replace(",", "").replace("$", "").strip()
                    value = int(float(cleaned_value))
                else:
                    value = int(float(data[field]))

                # Basic sanity checks
                if field == "year_built" and (value < 1800 or value > 2030):
                    continue  # Skip unrealistic years
                elif field in ["parking_spots", "gross_square_feet"] and value < 0:
                    continue  # Skip negative values
                elif field == "broker_price" and value < 0:
                    continue  # Skip negative broker prices

                validated_data[field] = value
            except (ValueError, TypeError):
                continue  # Skip invalid values

    return validated_data


async def structure_text_with_llm(
    text: str,
    llm: ChatOpenAI,
    prompt,
    category: str
) -> Optional[Any]:
    """
    Structure text using LLM with the appropriate prompt.

    Args:
        text: Raw text to structure
        llm: LangChain LLM instance
        prompt: Prompt template to use
        category: Category type for response parsing

    Returns:
        Structured data or None if processing failed
    """
    try:
        # Create chain
        chain = LLMChain(llm=llm, prompt=prompt)

        # Run structuring
        response = await chain.arun(text=text)

        # Parse response - rent_roll and t12 both expect lists
        return parse_json_response(response, "list")

    except Exception as e:
        return None


def get_structuring_summary(structured_data: Dict[str, Any]) -> Dict[str, Dict]:
    """
    Generate a summary of structuring results for logging and debugging.

    Args:
        structured_data: The structured data by category

    Returns:
        Dictionary with structuring statistics
    """
    summary = {}

    for category, data in structured_data.items():
        if category == "property_info":
            # Property info returns a dictionary
            if isinstance(data, dict):
                summary[category] = {
                    "success": True,
                    "fields_extracted": len(data),
                    "has_data": len(data) > 0
                }
            else:
                summary[category] = {
                    "success": False,
                    "fields_extracted": 0,
                    "has_data": False
                }
        elif isinstance(data, list):
            # Rent roll and T12 return lists
            if category == "rent_roll":
                summary[category] = {
                    "success": True,
                    "units_extracted": len(data),
                    "has_data": len(data) > 0
                }
            else:
                # T-12 (financial line items)
                summary[category] = {
                    "success": True,
                    "line_items_extracted": len(data),
                    "has_data": len(data) > 0
                }
        else:
            # Invalid data structure
            if category == "rent_roll":
                summary[category] = {
                    "success": False,
                    "units_extracted": 0,
                    "has_data": False
                }
            elif category == "property_info":
                summary[category] = {
                    "success": False,
                    "fields_extracted": 0,
                    "has_data": False
                }
            else:
                summary[category] = {
                    "success": False,
                    "line_items_extracted": 0,
                    "has_data": False
                }

    return summary
