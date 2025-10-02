"""
T12 Input Validation Prompt

Creates prompts for validating T12 document structure and content.
Checks if the document contains required information for T12 processing.
"""

from typing import Dict, Any


def create_t12_validation_prompt(t12_text: str) -> str:
    """
    Create a prompt for validating T12 document structure.

    Args:
        t12_text: Raw text extracted from T12 document

    Returns:
        Formatted prompt string for LLM validation
    """
    prompt = f"""
[ REDACTED FOR SECURITY / PROTECTING IP ]

YOUR TASK: Validate if this document contains the required information for further processing.


T12 STATEMENT TEXT:
{t12_text}



[ REDACTED FOR SECURITY / PROTECTING IP ]

RESPONSE FORMAT:
Return a JSON object with the following structure:
{{
    "is_valid": true/false,
    "has_line_items": true/false,
    "has_t12_totals": true/false,
    "has_monthly_breakdowns": true/false,
    "extraction_complexity": "low/medium/high",
    "validation_notes": "string with detailed observations about the document structure and content"
}}

[ REDACTED FOR SECURITY / PROTECTING IP ]

"""

    return prompt.strip()
