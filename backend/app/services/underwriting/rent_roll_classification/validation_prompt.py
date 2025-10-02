"""
Rent roll classification validation prompt templates for boundary correction.

This handles the second pass validation to correct any early returns or boundary errors
from the first classification pass.
"""

from langchain.prompts import PromptTemplate
from typing import Dict, Any


def format_boundary_context_for_validation(
    boundaries: Dict[str, Any],
    context: Dict[str, str],
    file_type: str
) -> str:
    """
    Format boundary context for the validation prompt.

    Args:
        boundaries: Classification result from first pass
        context: Extracted boundary context
        file_type: Type of file ("pdf" or "excel")

    Returns:
        Formatted string for validation prompt
    """
    if file_type.lower() == "excel":
        start_row = boundaries.get("data_start_row", "unknown")
        end_row = boundaries.get("data_end_row", "unknown")

        return f"""
FIRST CLASSIFICATION RESULT:
- Start Row: {start_row}
- End Row: {end_row}
- Sheet: {boundaries.get('data_sheet_name', 'unknown')}

START BOUNDARY CONTEXT (Rows 1 through {start_row + 5 if isinstance(start_row, int) else 'start+5'}):
{context.get('start_context', 'No content')}

END BOUNDARY CONTEXT (Rows {end_row - 5 if isinstance(end_row, int) else 'end-5'} through end):
{context.get('end_context', 'No content')}
"""

    elif file_type.lower() == "pdf":
        start_page = boundaries.get("data_start_page", "unknown")
        end_page = boundaries.get("data_end_page", "unknown")

        return f"""
FIRST CLASSIFICATION RESULT:
- Start Page: {start_page}
- End Page: {end_page}

START BOUNDARY CONTEXT (Beginning through page {start_page} + context):
{context.get('start_context', 'No content')}

END BOUNDARY CONTEXT (Page {end_page} - context through end):
{context.get('end_context', 'No content')}
"""

    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def get_validation_data_structure(file_type: str) -> str:
    """Get the data structure for validation results."""
    if file_type.lower() == "pdf":
        return """{
  "data_start_page": integer,
  "data_end_page": integer,
  "data_start_marker": string|null,
  "data_end_marker": string|null,
  "exclude_patterns": [string],
  "estimated_units": integer|null,
  "confidence": "high"|"medium"|"low",
  "column_headers": [string],
  "corrections_made": {
    "start_boundary_corrected": boolean,
    "end_boundary_corrected": boolean,
    "explanation": string
  }
}"""
    elif file_type.lower() == "excel":
        return """{
  "data_sheet_name": string,
  "data_start_row": integer,
  "data_end_row": integer,
  "data_start_column": string|null,
  "data_end_column": string|null,
  "exclude_patterns": [string],
  "estimated_units": integer|null,
  "confidence": "high"|"medium"|"low",
  "column_headers": [string],
  "corrections_made": {
    "start_boundary_corrected": boolean,
    "end_boundary_corrected": boolean,
    "explanation": string
  }
}"""
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def create_boundary_validation_prompt() -> PromptTemplate:
    """Create the prompt template for boundary validation and correction."""
    template = """
[ REDACTED FOR SECURITY / PROTECTING IP ]

Use the following data structure: {file_type_data_structure}

[ REDACTED FOR SECURITY / PROTECTING IP ]

**BOUNDARY CONTEXT TO ANALYZE:**

{boundary_context}

**FIRST CLASSIFICATION RESULT:**

{first_classification_result}

[ REDACTED FOR SECURITY / PROTECTING IP ]

JSON Response:
"""

    return PromptTemplate(
        input_variables=[
            "file_type_data_structure",
            "boundary_context",
            "first_classification_result"
        ],
        template=template
    )
