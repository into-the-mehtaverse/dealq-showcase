"""
Classification module for real estate document analysis.

Exports the unified classification service that consolidates all
document classification functionality.
"""

from .service import OMExtractionService

__all__ = ["OMExtractionService"]
