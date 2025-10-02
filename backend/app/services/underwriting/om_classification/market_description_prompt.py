"""
Market description prompt template for LLM-based market overview generation.

Separated from business logic for easier maintenance and prompt iteration.
"""

from langchain.prompts import PromptTemplate


def create_market_description_prompt() -> PromptTemplate:
    """Create the prompt template for generating market descriptions."""
    template = """

[ REDACTED FOR SECURITY / PROTECTING IP ]

The text comes from the market overview and other relevant sections of the OM:
{text}

[ REDACTED FOR SECURITY / PROTECTING IP ]

Market Description:
"""

    return PromptTemplate(
        input_variables=["text"],
        template=template
    )
