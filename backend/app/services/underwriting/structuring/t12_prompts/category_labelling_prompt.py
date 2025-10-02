"""
T12 Category Labeling Prompt

Creates prompts for categorizing T12 line items into predefined categories.
Uses array of arrays format for token efficiency.
"""

from typing import Dict, Any, List
from ..categories import (
    get_t12_revenue_categories,
    get_t12_deduction_categories,
    get_t12_expense_categories,
    get_t12_subtotal_categories
)


def create_t12_category_labeling_prompt(line_items_and_amounts: List[List]) -> str:
    """
    Create a prompt for categorizing T12 line items.

    Args:
        line_items_and_amounts: List of [line_item, amount] arrays from extraction step

    Returns:
        Formatted prompt string for LLM categorization
    """
    # Convert to readable format for the prompt
    line_items_display = []
    for item in line_items_and_amounts:
        line_item = item[0]
        amount = item[1]
        line_items_display.append(f"- {line_item}: ${amount:,}")

    line_items_text = "\n".join(line_items_display)

    # Get categories from centralized definition
    revenue_categories = get_t12_revenue_categories()
    deduction_categories = get_t12_deduction_categories()
    expense_categories = get_t12_expense_categories()
    subtotal_categories = get_t12_subtotal_categories()

    # Format categories for the prompt
    revenue_categories_text = "\n".join([f"- {cat}" for cat in sorted(revenue_categories)])
    deduction_categories_text = "\n".join([f"- {cat}" for cat in sorted(deduction_categories)])
    expense_categories_text = "\n".join([f"- {cat}" for cat in sorted(expense_categories)])
    subtotal_categories_text = "\n".join([f"- {cat}" for cat in sorted(subtotal_categories)])

    prompt = f"""
[ REDACTED FOR SECURITY / PROTECTING IP ]

T12 LINE ITEMS TO CATEGORIZE:
{line_items_text}

[YOUR TASK: Assign each line item to the most appropriate category from the predefined list.]

**REVENUE CATEGORIES:**
{revenue_categories_text}

**DEDUCTION CATEGORIES:**
{deduction_categories_text}

**EXPENSE CATEGORIES:**
{expense_categories_text}

**SUBTOTAL CATEGORIES:**
{subtotal_categories_text}

[ REDACTED FOR SECURITY / PROTECTING IP ]

RESPONSE FORMAT:
Return a JSON array of arrays, where each inner array contains [line_item, category]:
[
    ["Residential Rent", "Residential Rent"],
    ["Commercial Rent", "Commercial Rent"],
    ["Property Management", "Management"],
    ["Electricity", "Electricity"]
]
[ REDACTED FOR SECURITY / PROTECTING IP ]
"""

    return prompt.strip()
