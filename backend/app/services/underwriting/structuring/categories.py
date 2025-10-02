"""
Centralized category definitions for the structuring service.

This module serves as the single source of truth for all category definitions
used in the structuring service, particularly for T-12 financial statements.
"""

# T-12 Financial Categories
T12_REVENUE_CATEGORIES = {
    "Residential Rent",
    "Commercial Rent",
    "Parking Revenue",
    "Renovated Apartments",
    "Improved Apartment Income",
    "Other Income",
}

T12_DEDUCTION_CATEGORIES = {
    "Residential Vacancy",
    "Commercial Vacancy",
    "Parking Vacancy",
    "Bad Debt",
}

T12_EXPENSE_CATEGORIES = {
    "Property Tax",
    "Insurance",
    "Electricity",
    "Water",
    "Gas",
    "Service Contracts",
    "Professional Fees",
    "R&M",
    "Leasing & Marketing",
    "Turnover",
    "G&A",
    "Payroll",
    "Management",
    "Asset Management",
}

T12_SUBTOTAL_CATEGORIES = {
    "Subtotal",
    "Non-Operating Items",
}

# Combined set of all valid T-12 categories
T12_VALID_CATEGORIES = (
    T12_REVENUE_CATEGORIES |
    T12_DEDUCTION_CATEGORIES |
    T12_EXPENSE_CATEGORIES |
    T12_SUBTOTAL_CATEGORIES |
    {"Unknown"}  # Fallback category for unclassified items
)

def get_t12_revenue_categories() -> set:
    """Get the set of T-12 revenue categories."""
    return T12_REVENUE_CATEGORIES.copy()

def get_t12_deduction_categories() -> set:
    """Get the set of T-12 deduction categories."""
    return T12_DEDUCTION_CATEGORIES.copy()

def get_t12_expense_categories() -> set:
    """Get the set of T-12 expense categories."""
    return T12_EXPENSE_CATEGORIES.copy()

def get_t12_subtotal_categories() -> set:
    """Get the set of T-12 subtotal categories."""
    return T12_SUBTOTAL_CATEGORIES.copy()

def get_t12_valid_categories() -> set:
    """Get the complete set of valid T-12 categories."""
    return T12_VALID_CATEGORIES.copy()

def is_valid_t12_category(category: str) -> bool:
    """Check if a category is valid for T-12 classification."""
    return category in T12_VALID_CATEGORIES
