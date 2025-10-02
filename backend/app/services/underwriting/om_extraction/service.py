"""
Unified Classification Service for Real Estate Document Analysis

Consolidates all classification logic from utils and service wrappers into a single,
maintainable service with clear boundaries and responsibilities.
"""

import os
import json
import re
import fitz  # PyMuPDF
from pathlib import Path
from typing import Dict, List, Optional, Union
from dotenv import load_dotenv
from fastapi import HTTPException
from app.models.domain.rr_classification import PDFRentRollClassification, ExcelRentRollClassification
from app.utils.file_utils import get_file_path, file_exists
from .utils import (
    create_page_chunks,
    extract_first_page_image
)

# Load environment variables
load_dotenv()


class OMExtractionService:
    """Unified service for classifying pages in OM PDFs using LLM analysis."""

    def __init__(self):
        """Initialize the classification service with environment-based configuration."""

        # Chunking configuration
        self.chunk_size = int(os.getenv("CHUNK_SIZE", "6000"))  # Characters per chunk
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "500"))  # Character overlap
        self.max_chunks = int(os.getenv("MAX_CHUNKS", "0"))  # 0 = no limit

    def extract_text_by_page(self, pdf_path: str) -> Dict[int, str]:
        """
        Extract text from PDF, returning a dictionary with page numbers and their text content.
        Page numbers are 1-indexed to match standard PDF page numbering.

        Args:
            pdf_path: Full path to the PDF file

        Returns:
            Dictionary with page numbers as keys and text content as values

        Raises:
            HTTPException: If file not found or processing fails
        """
        # Validate file exists
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail=f"File '{pdf_path}' not found")

        try:
            doc = fitz.open(pdf_path)
            pages_text = {}

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                # Store with 1-indexed page numbers
                pages_text[page_num + 1] = text

            doc.close()
            return pages_text

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")

    async def create_chunks_for_classification(self, pages_text: Dict[int, str]) -> Dict[str, any]:
        """
        Create chunks for LLM-based classification from pre-extracted pages text.

        Args:
            pages_text: Dictionary with page numbers as keys and text content as values

        Returns:
            Dictionary containing chunks and number of chunks to process
        """
        try:
            if not pages_text:
                raise HTTPException(status_code=400, detail="No text content provided")

            # Create chunks for LLM processing using utility function
            chunks = create_page_chunks(pages_text, self.chunk_size)

            if not chunks:
                raise HTTPException(status_code=400, detail="Failed to create text chunks from pages text")

            # Determine how many chunks to process
            chunks_to_process = len(chunks)
            if self.max_chunks > 0:
                chunks_to_process = min(len(chunks), self.max_chunks)
                print(f"Processing {chunks_to_process} of {len(chunks)} chunks (limited by MAX_CHUNKS)")
            else:
                print(f"Processing all {chunks_to_process} chunks")

            return {
                "chunks": chunks,
                "num_chunks": chunks_to_process
            }

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error creating chunks: {str(e)}")

    async def get_om_first_image(self, file_path: str) -> bytes:
        """
        Extract the first page of an OM PDF as an image.

        Args:
            file_path: Full path to the PDF file (can be temp file path)

        Returns:
            Image bytes in PNG format

        Raises:
            HTTPException: If file not found or processing fails
        """
        # Validate file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File '{file_path}' not found")

        try:
            # Use utility function to extract first page image
            image_bytes = extract_first_page_image(file_path)
            return image_bytes

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error extracting OM first page image: {str(e)}")

    def get_relevant_description_pages(self, pages_text: Dict[int, str], page_numbers: List[int]) -> str:
        """
        Extract and combine text from specific pages for description generation.

        Args:
            pages_text: Dictionary with page numbers as keys and text content as values
            page_numbers: List of page numbers to extract text from

        Returns:
            Combined text string from the specified pages

        Raises:
            HTTPException: If no valid pages found or processing fails
        """
        try:
            if not pages_text:
                raise HTTPException(status_code=400, detail="No pages text provided")

            if not page_numbers:
                raise HTTPException(status_code=400, detail="No page numbers provided")

            # Extract text from the specified pages
            relevant_texts = []
            for page_num in page_numbers:
                if page_num in pages_text:
                    page_text = pages_text[page_num].strip()
                    if page_text:  # Only add non-empty text
                        relevant_texts.append(f"--- PAGE {page_num} ---\n{page_text}")
                else:
                    print(f"Warning: Page {page_num} not found in pages_text")

            if not relevant_texts:
                raise HTTPException(status_code=400, detail="No text content found in specified pages")

            # Combine all relevant text with clear page separators
            combined_text = "\n\n".join(relevant_texts)
            return combined_text

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error extracting relevant pages: {str(e)}")


# Service instance is created in core/dependencies/services.py
