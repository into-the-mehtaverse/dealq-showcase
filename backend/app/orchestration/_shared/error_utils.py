"""
Shared error handling utilities for orchestration stages.

This module contains common error handling patterns used across multiple
orchestration stages including HTTP exception creation, error formatting,
and logging utilities.
"""

from typing import List, Optional, Dict, Any
from fastapi import HTTPException


def create_http_exception(status_code: int, detail: str) -> HTTPException:
    """
    Create a standardized HTTP exception.

    Args:
        status_code: HTTP status code
        detail: Error detail message

    Returns:
        HTTPException with the specified status code and detail
    """
    return HTTPException(status_code=status_code, detail=detail)


def create_validation_error(field: str, value: str, allowed_values: List[str]) -> HTTPException:
    """
    Create a standardized validation error for invalid field values.

    Args:
        field: Name of the field that failed validation
        value: The invalid value provided
        allowed_values: List of allowed values

    Returns:
        HTTPException with validation error details
    """
    allowed_str = ", ".join(allowed_values)
    detail = f"Invalid {field}: {value}. Must be one of: {allowed_str}"
    return create_http_exception(400, detail)


def create_file_upload_error(file_name: str, error: str) -> HTTPException:
    """
    Create a standardized file upload error.

    Args:
        file_name: Name of the file that failed to upload
        error: Specific error message

    Returns:
        HTTPException with file upload error details
    """
    detail = f"Failed to upload file '{file_name}': {error}"
    return create_http_exception(500, detail)


def create_download_error(file_url: str, error: str) -> HTTPException:
    """
    Create a standardized file download error.

    Args:
        file_url: URL of the file that failed to download
        error: Specific error message

    Returns:
        HTTPException with file download error details
    """
    detail = f"Failed to download file from '{file_url}': {error}"
    return create_http_exception(500, detail)


def create_processing_error(operation: str, error: Exception) -> HTTPException:
    """
    Create a standardized processing error.

    Args:
        operation: Name of the operation that failed
        error: The exception that occurred

    Returns:
        HTTPException with processing error details
    """
    detail = f"{operation} failed: {str(error)}"
    return create_http_exception(500, detail)


def format_error_message(operation: str, error: Exception) -> str:
    """
    Format an error message for logging or response.

    Args:
        operation: Name of the operation that failed
        error: The exception that occurred

    Returns:
        Formatted error message
    """
    return f"{operation} failed: {str(error)}"


def log_stage_error(stage_name: str, error: Exception, **context) -> None:
    """
    Log a stage error with context information.

    Args:
        stage_name: Name of the stage that failed
        error: The exception that occurred
        **context: Additional context information
    """
    context_str = " ".join([f"{k}={v}" for k, v in context.items()])
    print(f"{stage_name} stage error: {str(error)} {context_str}")


def determine_stage_success(errors: List[str]) -> bool:
    """
    Determine if a stage was successful based on error list.

    Args:
        errors: List of error messages

    Returns:
        True if no errors, False otherwise
    """
    return len(errors) == 0


def aggregate_error_messages(errors: List[str]) -> Optional[str]:
    """
    Aggregate multiple error messages into a single string.

    Args:
        errors: List of error messages

    Returns:
        Combined error message or None if no errors
    """
    if not errors:
        return None
    return "; ".join(errors)


def create_stage_result(success: bool, **kwargs) -> Dict[str, Any]:
    """
    Create a standardized stage result dictionary.

    Args:
        success: Whether the stage was successful
        **kwargs: Additional result fields

    Returns:
        Dictionary with success status and additional fields
    """
    result = {"success": success}
    result.update(kwargs)
    return result


def handle_stage_exception(stage_name: str, error: Exception, **context) -> Dict[str, Any]:
    """
    Handle a stage exception and return a standardized error result.

    Args:
        stage_name: Name of the stage that failed
        error: The exception that occurred
        **context: Additional context information

    Returns:
        Standardized error result dictionary
    """
    log_stage_error(stage_name, error, **context)
    error_message = format_error_message(stage_name, error)

    return create_stage_result(
        success=False,
        error_message=error_message,
        **context
    )
