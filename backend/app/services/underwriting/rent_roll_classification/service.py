"""
Rent roll classification repository for LLM-based boundary analysis.
"""

import os
import json
import re
from typing import Dict, Any, Optional, Union
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from fastapi import HTTPException

from app.models.domain.rr_classification import PDFRentRollClassification, ExcelRentRollClassification
from .prompt import create_rent_roll_analysis_prompt, get_file_type_data_structure, get_file_type_example_output
from .validation_prompt import create_boundary_validation_prompt, get_validation_data_structure, format_boundary_context_for_validation
from .utils import extract_full_boundary_context

# Load environment variables
load_dotenv()


class RentRollClassificationService:
    """Repository for rent roll classification operations."""

    def __init__(self):
        """
        Initialize the rent roll classification service.
        """
        self.model_name = os.getenv("LLM_MODEL", "gpt-4o")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

        self._validate_configuration()

        # Create LLM instance once during initialization
        self.llm = self._create_llm()

    def _validate_configuration(self):
        """Validate that required configuration is available."""
        if not self.openai_api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not found. Set OPENAI_API_KEY environment variable."
            )

        # Validate temperature range
        if not (0.0 <= self.temperature <= 2.0):
            self.temperature = 0.1  # Reset to default if invalid
            print(f"Warning: Invalid LLM_TEMPERATURE value. Using default: {self.temperature}")

    def _create_llm(self) -> ChatOpenAI:
        """Create and configure the LLM instance."""
        return ChatOpenAI(
            model_name=self.model_name,
            temperature=self.temperature,
            openai_api_key=self.openai_api_key
        )

    async def validate_boundaries(
        self,
        text: str,
        file_type: str,
        first_result: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Validate and correct boundaries from the first classification pass.

        Args:
            text: Raw text data from extraction service
            file_type: Type of file ("pdf" or "excel")
            first_result: Result from the first classification pass

        Returns:
            Corrected classification result or None if validation failed
        """
        try:
            print(f"    RR validation: Starting boundary validation for {file_type} file")

            # Extract boundary context for validation
            boundary_context = extract_full_boundary_context(text, first_result, file_type)


            # Format the context for the validation prompt
            formatted_context = format_boundary_context_for_validation(
                first_result, boundary_context, file_type
            )

            # Get the validation data structure
            validation_data_structure = get_validation_data_structure(file_type)

            # Create validation prompt and chain
            validation_prompt = create_boundary_validation_prompt()
            validation_chain = LLMChain(llm=self.llm, prompt=validation_prompt)

            # Run validation
            validation_response = await validation_chain.arun(
                file_type_data_structure=validation_data_structure,
                boundary_context=formatted_context,
                first_classification_result=json.dumps(first_result, indent=2)
            )

            # Parse validation response
            print(f"    RR validation: Raw LLM response: {validation_response}")
            json_match = re.search(r'\{.*\}', validation_response, re.DOTALL)
            if not json_match:
                print(f"    RR validation: No JSON found in validation response")
                return None

            json_str = json_match.group()
            validation_result = json.loads(json_str)

            print(f"    RR validation: End marker: {validation_result.get('data_end_marker', 'No end marker found')}")

            # Check if corrections were made
            corrections = validation_result.get("corrections_made", {})
            start_corrected = corrections.get("start_boundary_corrected", False)
            end_corrected = corrections.get("end_boundary_corrected", False)

            if start_corrected or end_corrected:
                print(f"    RR validation: Boundaries corrected - Start: {start_corrected}, End: {end_corrected}")
                print(f"    RR validation: Explanation: {corrections.get('explanation', 'No explanation provided')}")
            else:
                print(f"    RR validation: No corrections needed - boundaries are correct")

            return validation_result

        except Exception as e:
            print(f"    RR validation error: {str(e)}")
            return None

    async def analyze_rent_roll_boundaries(
        self,
        text: str,
        file_type: str
    ) -> Optional[Union[PDFRentRollClassification, ExcelRentRollClassification]]:
        """
        Analyze rent roll data to identify boundaries for precision extraction.
        Uses a two-pass approach: initial classification followed by boundary validation.

        Args:
            text: Raw text data from extraction service
            file_type: Type of file ("pdf" or "excel")

        Returns:
            Classification result with validated boundaries or None if analysis failed
        """
        try:
            # Validate file type
            if file_type.lower() not in ["pdf", "excel"]:
                raise ValueError(f"Unsupported file type: {file_type}")

            print(f"    RR analysis: Starting two-pass classification for {file_type} file")

            # PASS 1: Initial boundary classification
            print(f"    RR analysis: Pass 1 - Initial boundary detection")

            # Get the appropriate data structure
            file_type_data_structure = get_file_type_data_structure(file_type)

            # Get the appropriate example output
            file_type_example_output = get_file_type_example_output(file_type)

            if not text.strip():
                print("    RR analysis: No text content to analyze")
                return None

            # Create prompt and chain using the repository's LLM instance
            prompt = create_rent_roll_analysis_prompt()
            chain = LLMChain(llm=self.llm, prompt=prompt)

            # Run initial analysis
            response = await chain.arun(
                file_type=file_type,
                file_type_data_structure=file_type_data_structure,
                file_type_example_output=file_type_example_output,
                text=text
            )

            # Parse response
            json_match = re.search(r'\{.*?\}', response, re.DOTALL)
            if not json_match:
                print(f"    RR analysis: No JSON found in response")
                return None

            json_str = json_match.group()
            first_result = json.loads(json_str)

            print(f"    RR analysis: Pass 1 result: {first_result}")

            # PASS 2: Boundary validation and correction
            print(f"    RR analysis: Pass 2 - Boundary validation")

            validation_result = await self.validate_boundaries(text, file_type, first_result)

            if validation_result:
                # Use the validated result (which may include corrections)
                final_result = validation_result
                print(f"    RR analysis: Using validated result with corrections")
            else:
                # Fall back to first result if validation failed
                final_result = first_result
                print(f"    RR analysis: Validation failed, using first pass result")

            # Convert to appropriate model
            if file_type.lower() == "pdf":
                return PDFRentRollClassification(**final_result)
            else:
                return ExcelRentRollClassification(**final_result)

        except Exception as e:
            print(f"    RR analysis error: {str(e)}")
            return None
