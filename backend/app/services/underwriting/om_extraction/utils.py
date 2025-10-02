"""
Classification utility functions.

Contains reusable utility functions for PDF processing, LLM response parsing,
and format conversion operations used by the classification service.
"""

import fitz  # PyMuPDF
import json
import re
from pathlib import Path
from typing import Dict, List

def extract_text_by_page(pdf_path: Path) -> Dict[int, str]:
    """
    Extract text from PDF, returning a dictionary with page numbers and their text content.
    Page numbers are 1-indexed to match standard PDF page numbering.
    """
    doc = fitz.open(pdf_path)
    pages_text = {}

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        # Store with 1-indexed page numbers
        pages_text[page_num + 1] = text

    doc.close()
    return pages_text


def extract_first_page_image(pdf_path: Path, dpi: int = 72) -> bytes:
    """
    Extract the largest image from the first page of a PDF.

    Args:
        pdf_path: Path to the PDF file
        dpi: Resolution for the output image (default: 72 for thumbnail size)

    Returns:
        Image bytes in PNG format

    Raises:
        Exception: If PDF processing fails
    """
    try:
        doc = fitz.open(pdf_path)

        if len(doc) == 0:
            doc.close()
            raise Exception("PDF has no pages")

        # Get the first page (index 0)
        page = doc[0]

        # Get all images from the first page
        image_list = page.get_images()

        if not image_list:
            # Fallback: if no images found, rasterize the entire page
            print("No images found on first page, falling back to page rasterization")
            zoom = dpi / 72.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)

            # Resize image to thumbnail dimensions if it's too large
            max_width = 400
            max_height = 600

            if pix.width > max_width or pix.height > max_height:
                scale_x = max_width / pix.width
                scale_y = max_height / pix.height
                scale = min(scale_x, scale_y)
                resize_mat = fitz.Matrix(scale, scale)
                pix = page.get_pixmap(matrix=resize_mat)

            image_bytes = pix.tobytes("png")
            doc.close()
            return image_bytes

        # Find the largest image by pixel area
        largest_image = None
        max_area = 0

        for img_index, img_info in enumerate(image_list):
            try:
                # Get image rectangle and dimensions
                # img_info is a tuple: (xref, bbox, width, height, bpc, colorspace, ...)
                if len(img_info) >= 4:  # Ensure we have width and height
                    width = img_info[2]
                    height = img_info[3]
                    area = width * height

                    # Filter out very small images (likely icons/logos)
                    if area > 10000:  # Minimum 100x100 pixels
                        if area > max_area:
                            max_area = area
                            largest_image = (img_index, img_info, width, height)
            except Exception as e:
                print(f"Error processing image {img_index}: {str(e)}")
                continue

        if largest_image:
            img_index, img_info, width, height = largest_image

            # Extract the image data
            try:
                # Get image data using the xref from img_info
                xref = img_info[0]  # First element is the xref
                img_data = doc.extract_image(xref)
                if img_data:
                    # Check if we need to resize the extracted image
                    img_bytes = img_data["image"]

                    # For now, return the original image bytes
                    # In the future, we could add image resizing here if needed
                    doc.close()
                    return img_bytes
                else:
                    raise Exception("Failed to extract image data")

            except Exception as e:
                print(f"Failed to extract largest image: {str(e)}")
                # Fall back to page rasterization
                pass

        # Fallback: rasterize the entire page if image extraction fails
        print("Image extraction failed, falling back to page rasterization")
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)

        # Resize image to thumbnail dimensions if it's too large
        max_width = 400
        max_height = 600

        if pix.width > max_width or pix.height > max_height:
            scale_x = max_width / pix.width
            scale_y = max_height / pix.height
            scale = min(scale_x, scale_y)
            resize_mat = fitz.Matrix(scale, scale)
            pix = page.get_pixmap(matrix=resize_mat)

        image_bytes = pix.tobytes("png")
        doc.close()
        return image_bytes

    except Exception as e:
        if 'doc' in locals():
            doc.close()
        raise Exception(f"Failed to extract first page image: {str(e)}")


def create_page_chunks(pages_text: Dict[int, str], chunk_size: int = 6000) -> List[Dict]:
    """
    Create chunks from PDF pages ensuring pages are NEVER split across chunks.
    Groups complete pages together while respecting LLM context window limits.

    Args:
        pages_text: Dictionary of page numbers and their text content
        chunk_size: Maximum characters per chunk (leaving room for prompt overhead)

    Returns:
        List of chunks with metadata about which pages they contain
    """
    chunks = []
    current_chunk_pages = []
    current_chunk_text = ""
    current_chunk_size = 0
    chunk_id = 0

    # Sort pages by page number to process in order
    sorted_pages = sorted(pages_text.items())

    for page_num, page_text in sorted_pages:
        # Create page content with clear markers
        page_content = f"\n\n--- PAGE {page_num} ---\n\n{page_text}"
        page_content_size = len(page_content)

        # Check if adding this page would exceed chunk size
        if current_chunk_pages and (current_chunk_size + page_content_size) > chunk_size:
            # Finish current chunk (if it has content)
            if current_chunk_pages:
                chunks.append({
                    "content": current_chunk_text.strip(),
                    "pages": current_chunk_pages.copy(),
                    "chunk_id": chunk_id,
                    "char_count": current_chunk_size
                })
                chunk_id += 1

            # Start new chunk with current page
            current_chunk_pages = [page_num]
            current_chunk_text = page_content
            current_chunk_size = page_content_size
        else:
            # Add page to current chunk
            current_chunk_pages.append(page_num)
            current_chunk_text += page_content
            current_chunk_size += page_content_size

        # Special handling for very large single pages that exceed chunk_size
        if page_content_size > chunk_size and len(current_chunk_pages) == 1:
            # Create a chunk with just this oversized page
            chunks.append({
                "content": current_chunk_text.strip(),
                "pages": current_chunk_pages.copy(),
                "chunk_id": chunk_id,
                "char_count": current_chunk_size,
                "oversized": True  # Flag for monitoring
            })
            chunk_id += 1
            # Reset for next chunk
            current_chunk_pages = []
            current_chunk_text = ""
            current_chunk_size = 0

    # Add any remaining pages as the final chunk
    if current_chunk_pages:
        chunks.append({
            "content": current_chunk_text.strip(),
            "pages": current_chunk_pages.copy(),
            "chunk_id": chunk_id,
            "char_count": current_chunk_size
        })

    return chunks
