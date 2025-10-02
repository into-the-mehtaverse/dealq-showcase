"""
Unified Structuring Service for Real Estate Document Analysis

Simplified service that focuses on LLM-based structuring of extracted text data.
All file processing and extraction is handled by the extraction service.
"""

import os
import asyncio
from typing import Dict, List, Any, Union
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from fastapi import HTTPException
from app.models.domain.rr_classification import PDFRentRollPrecisionExtract, ExcelRentRollPrecisionExtract
from .prompts import create_rent_roll_prompt
from .utils import (
    parse_json_response,
    validate_rent_roll_data,
    validate_t12_data,
    structure_text_with_llm,
    process_chunk
)
from .rr_repo import chunk_rent_roll_data, validate_chunks, get_chunk_summary
from .t12_repo import T12Repository

# Load environment variables
load_dotenv()


class StructuringService:
    """Simplified service for converting extracted text into structured JSON using LLM analysis."""

    def __init__(self):
        """Initialize the structuring service with environment-based configuration."""
        # Load configuration from environment variables
        self.model_name = os.getenv("LLM_MODEL", "gpt-4o")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

        self._validate_configuration()

        # Initialize LLM instance
        self.llm = self._create_llm()

        # Initialize T12 repository with LLM
        self.t12_repo = T12Repository(self.llm)

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

    async def structure_rent_roll_data(self, precision_extraction: Union[PDFRentRollPrecisionExtract, ExcelRentRollPrecisionExtract]) -> List[Dict[str, Any]]:
        """
        Structure rent roll data using concurrent chunked LLM processing.

        Args:
            precision_extraction: Precision extracted data with boundaries (Pydantic model)

        Returns:
            List of structured rent roll units
        """
        try:
            file_type = precision_extraction.file_type
            if not file_type:
                print(f"    RR structuring: No file type found in precision extraction")
                return []

            print(f"    RR structuring: Processing {file_type} file")

            # Log column headers if available
            if hasattr(precision_extraction, 'boundaries') and precision_extraction.boundaries:
                column_headers = precision_extraction.boundaries.get('column_headers', [])
                if column_headers:
                    print(f"    RR structuring: Found {len(column_headers)} column headers for chunking")
                else:
                    print(f"    RR structuring: No column headers found, chunks will be created without header context")

            # Chunk the data for concurrent processing
            chunks = chunk_rent_roll_data(precision_extraction)

            if not chunks:
                print(f"    RR structuring: No chunks created")
                return []

            # Validate chunks
            if not validate_chunks(chunks):
                print(f"    RR structuring: Invalid chunks created")
                return []

            # Get chunk summary for logging
            chunk_summary = get_chunk_summary(chunks)
            print(f"    RR structuring: Created {chunk_summary['total_chunks']} chunks, "
                  f"avg size: {chunk_summary['avg_chunk_size']} chars")





            # Set up LLM and prompt
            llm = self._create_llm()
            prompt = create_rent_roll_prompt()

            # Process chunks concurrently
            tasks = [
                process_chunk(chunk, llm, prompt)
                for chunk in chunks
            ]

            # Execute all tasks concurrently
            chunk_results = await asyncio.gather(*tasks, return_exceptions=True)

            # Combine results from all chunks
            all_results = []
            for i, result in enumerate(chunk_results):
                if isinstance(result, Exception):
                    print(f"    RR structuring: Chunk {i} failed with exception: {str(result)}")
                elif isinstance(result, list):
                    all_results.extend(result)
                else:
                    print(f"    RR structuring: Chunk {i} returned unexpected result type: {type(result)}")

            print(f"    RR structuring: Total {len(all_results)} units from all chunks")
            return all_results

        except Exception as e:
            print(f"    RR structuring error: {str(e)}")
            return []

    async def structure_t12_data(self, t12_text: str) -> List[Dict[str, Any]]:
        """
        Structure T12 text data using the new multi-step approach.

        Args:
            t12_text: Raw text extracted from T12 document

        Returns:
            List of structured T12 line items
        """
        try:
            if not t12_text or not t12_text.strip():
                print(f"    T12 structuring: Empty text provided")
                return []

            print(f"    T12 structuring: Processing {len(t12_text)} chars")

            # Use T12 repository for multi-step processing
            success, structured_data, error_message = await self.t12_repo.process_t12_data(t12_text)

            if not success:
                print(f"    T12 structuring failed: {error_message}")
                return []

            print(f"    T12 structuring: Successfully processed {len(structured_data)} line items")

            # Convert array of arrays format to objects for backward compatibility
            from .t12_repo import convert_to_objects
            final_result = convert_to_objects(structured_data)

            return final_result

        except Exception as e:
            print(f"    T12 structuring error: {str(e)}")
            return []

    def get_supported_categories(self) -> List[str]:
        """Get the list of supported categories for structuring."""
        return ["rent_roll", "t12"]
