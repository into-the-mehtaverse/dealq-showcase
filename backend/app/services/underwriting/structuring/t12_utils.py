"""
T12 Utility Functions

Contains essential utility functions for T12 data processing.
Focused on core business logic rather than over-engineering.
"""

from typing import List, Dict, Any


def match_categories_with_amounts(line_items_and_amounts: List[List], line_items_and_categories: List[List]) -> List[List]:
    """
    Deterministically match categories with amounts from previous extraction step.

    Args:
        line_items_and_amounts: List of [line_item, amount] arrays from extraction
        line_items_and_categories: List of [line_item, category] arrays from categorization

    Returns:
        List of [line_item, amount, category] arrays
    """
    # Create lookup dictionary from line_items_and_categories
    category_lookup = {}
    for item in line_items_and_categories:
        if len(item) >= 2:
            line_item = item[0]
            category = item[1]
            category_lookup[line_item] = category

    # Match each item from line_items_and_amounts with its category
    result = []
    for item in line_items_and_amounts:
        if len(item) >= 2:
            line_item = item[0]
            amount = item[1]
            category = category_lookup.get(line_item, "Unknown")
            result.append([line_item, amount, category])

    return result


def convert_to_objects(categorized_items: List[List]) -> List[Dict[str, Any]]:
    """
    Convert array of arrays back to objects for final output.

    Args:
        categorized_items: List of [line_item, amount, category] arrays:
        [
            ["Base Rent", 50000, "rental_income"],
            ["CAM Reimbursements", 15000, "reimbursements"],
            ...
        ]

    Returns:
        List of objects with line_item, total, and category:
        [
            {"line_item": "Base Rent", "total": 50000, "category": "rental_income"},
            {"line_item": "CAM Reimbursements", "total": 15000, "category": "reimbursements"},
            ...
        ]
    """
    return [
        {
            "line_item": item[0],
            "total": item[1],
            "category": item[2]
        }
        for item in categorized_items
    ]
