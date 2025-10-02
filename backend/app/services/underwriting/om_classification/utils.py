"""
Classification utility functions.

Contains reusable utility functions for PDF processing, LLM response parsing,
and format conversion operations used by the classification service.
"""

import json
import re
from typing import Dict, List

from app.models.domain.underwriting import EnhancedClassificationResult

def parse_llm_response(response: str) -> Dict:
    """Parse LLM response and extract the enhanced classification results."""
    try:
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            result = json.loads(json_str)

            # Use the model's empty result as the base
            clean_result = EnhancedClassificationResult.create_empty_result()

            # Process extracted information categories
            for category in EnhancedClassificationResult.get_property_info_fields():
                if category in result and result[category] is not None:
                    if isinstance(result[category], dict) and "value" in result[category] and "first_page" in result[category]:
                        clean_result[category] = {
                            "value": str(result[category]["value"]).strip(),
                            "first_page": int(result[category]["first_page"])
                        }

            # Process page number categories
            for category in EnhancedClassificationResult.get_page_list_fields():
                if category in result:
                    pages = result[category]
                    if isinstance(pages, list):
                        # Ensure pages are integers and unique
                        clean_pages = []
                        for page in pages:
                            try:
                                page_int = int(page)
                                if page_int > 0:  # Page numbers should be positive
                                    clean_pages.append(page_int)
                            except (ValueError, TypeError):
                                continue
                        clean_result[category] = sorted(list(set(clean_pages)))

            return clean_result
        else:
            # Return empty result if no JSON found
            return EnhancedClassificationResult.create_empty_result()
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        print(f"Error parsing LLM response: {e}")
        # Return empty result on parsing error
        return EnhancedClassificationResult.create_empty_result()


def merge_classification_results(results: List[Dict]) -> Dict:
    """
    Merge classification results from multiple chunks into a single result.
    For extracted information, takes the first occurrence found.
    For page numbers, combines all pages and removes duplicates.

    Note: This function is deprecated. Use EnhancedClassificationResult.merge_results() instead.
    """
    merged = EnhancedClassificationResult.create_empty_result()

    # For extracted information, take the first non-null value found
    for category in EnhancedClassificationResult.get_property_info_fields():
        for result in results:
            if result.get(category) is not None and merged[category] is None:
                merged[category] = result[category]
                break

    # For page numbers, combine all pages and remove duplicates
    for category in EnhancedClassificationResult.get_page_list_fields():
        all_pages = []
        for result in results:
            pages = result.get(category, [])
            if isinstance(pages, list):
                all_pages.extend(pages)
        merged[category] = sorted(list(set(all_pages)))

    return merged
