"""
Deal description prompt template for LLM-based property description generation.


Separated from business logic for easier maintenance and prompt iteration.
"""


from langchain.prompts import PromptTemplate




def create_deal_description_prompt() -> PromptTemplate:
   """Create the prompt template for generating deal descriptions."""
   template = """
[ REDACTED FOR SECURITY / PROTECTING IP ]

The text comes from the executive summary and other relevant sections of the OM:
{text}

[ REDACTED FOR SECURITY / PROTECTING IP ]

Description:
"""


   return PromptTemplate(
       input_variables=["text"],
       template=template
   )
