"""
T12 Line Item and Totals Extraction Prompt

Creates prompts for extracting line items and their corresponding amounts from T12 documents.
Uses array of arrays format for token efficiency.
"""

from typing import Dict, Any, List


def create_t12_line_item_extraction_prompt(t12_text: str) -> str:
    """
    Create a prompt for extracting line items and amounts from T12 text.

    Args:
        t12_text: Raw text extracted from T12 document

    Returns:
        Formatted prompt string for LLM extraction
    """
    prompt = f"""
[ REDACTED FOR SECURITY / PROTECTING IP ]

T12 STATEMENT TEXT:
{t12_text}

YOUR TASK: Extract all line items and their corresponding T12 total amounts.

[ REDACTED FOR SECURITY / PROTECTING IP ]

RESPONSE FORMAT:
Return a JSON array of arrays, where each inner array contains [line_item, amount]:
[
    ["Base Rent", 50000],
    ["CAM Reimbursements", 15000],
    ["Property Management Fees", 5000],
    ["Utilities", 12000]
]

[ REDACTED FOR SECURITY / PROTECTING IP ]

    return prompt.strip()
