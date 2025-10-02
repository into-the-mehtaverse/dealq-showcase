"""
Structuring prompt templates for LLM-based text structuring.

Separated from business logic for easier maintenance and prompt iteration.
"""

from langchain.prompts import PromptTemplate
from .categories import (
    get_t12_revenue_categories,
    get_t12_deduction_categories,
    get_t12_expense_categories
)


def create_rent_roll_prompt() -> PromptTemplate:
    """Create the prompt template for rent roll structuring."""
    template = """

[ REDACTED FOR SECURITY / PROTECTING IP ]

Here is the rent roll data:
{text}

JSON Response:
"""

    return PromptTemplate(
        input_variables=["text"],
        template=template
    )
