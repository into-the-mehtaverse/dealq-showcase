"""
Unified Classification Service for Real Estate Document Analysis

Consolidates all classification logic from utils and service wrappers into a single,
maintainable service with clear boundaries and responsibilities.
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Union
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from fastapi import HTTPException

from app.models.domain.underwriting import EnhancedClassificationResult
from .prompts import create_classification_prompt
from .deal_description_prompt import create_deal_description_prompt
from .market_description_prompt import create_market_description_prompt
from .utils import (
    parse_llm_response
)

# Load environment variables
load_dotenv()


class OMClassificationService:
    """Unified service for classifying pages in OM PDFs using LLM analysis."""

    def __init__(self):
        """Initialize the classification service with environment-based configuration."""
        # Load configuration from environment variables
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

    async def _classify_chunk_with_llm(self, chunk: Dict, prompt) -> Dict:
        """Classify a single chunk using the LLM."""
        try:
            # Create chain using the service's LLM instance
            chain = LLMChain(llm=self.llm, prompt=prompt)

            # Run classification
            response = await chain.arun(
                pages=chunk["pages"],
                text=chunk["content"]
            )

            # Parse response using utility function
            return parse_llm_response(response)

        except Exception as e:
            print(f"Error classifying chunk {chunk['chunk_id']}: {str(e)}")
            # Use the model's empty result method
            return EnhancedClassificationResult.create_empty_result()

    def _convert_to_schema_format(self, classification_dict: Dict) -> EnhancedClassificationResult:
        """Convert the raw classification dictionary to the Pydantic schema format."""
        # Use the model's factory method for conversion
        return EnhancedClassificationResult.from_dict(classification_dict)

    async def classify_pdf_pages(self, chunks, num_chunks) -> EnhancedClassificationResult:
        """
        Classify pages in a PDF file to identify content categories and extract property information.

        Args:
            chunks: List of chunks to classify
            num_chunks: Number of chunks to classify

        Returns:
            EnhancedClassificationResult with extracted property information and page numbers
        """
        try:
            # Step 1: Set up prompt
            prompt = create_classification_prompt()

            # Step 2: Process all chunks (or up to max_chunks if set)
            classification_results = []

            for i in range(num_chunks):
                chunk = chunks[i]
                print(f"Processing chunk {i+1}/{num_chunks} (pages {chunk['pages']}, {chunk['char_count']} chars)")

                result = await self._classify_chunk_with_llm(chunk, prompt)
                classification_results.append(result)

            # Step 3: Convert classification results to model instances
            model_results = []
            for result in classification_results:
                model_results.append(self._convert_to_schema_format(result))

            # Step 4: Merge results using the model's merge method
            schema_result = EnhancedClassificationResult.merge_results(model_results)

            return schema_result

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

    async def generate_description(self, description_text: str, description_type: str) -> str:
        """
        Generate a description using LLM based on the provided text and description type.

        Args:
            description_text: The extracted text to generate description from
            description_type: Either "deal" or "market" to determine which prompt to use

        Returns:
            Generated description string

        Raises:
            HTTPException: If description_type is invalid or LLM call fails
        """
        try:
            # Validate description type
            if description_type not in ["deal", "market"]:
                raise HTTPException(
                    status_code=400,
                    detail="description_type must be either 'deal' or 'market'"
                )

            # Select appropriate prompt based on description type
            if description_type == "deal":
                prompt = create_deal_description_prompt()
            else:  # market
                prompt = create_market_description_prompt()

            # Create chain using the service's LLM instance
            chain = LLMChain(llm=self.llm, prompt=prompt)

            # Run description generation
            response = await chain.arun(text=description_text)

            # Clean up the response (remove any extra whitespace or formatting)
            cleaned_response = response.strip()

            return cleaned_response

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=500,
                detail=f"Error generating {description_type} description: {str(e)}"
            )


# Service instance is created in core/dependencies/services.py
