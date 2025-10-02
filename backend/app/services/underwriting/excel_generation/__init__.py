"""
Excel Generation module for real estate document analysis.

Exports the unified excel generation service that consolidates all
Excel generation and Supabase integration functionality.
"""

from .service import ExcelGenerationService

__all__ = ["ExcelGenerationService"]
