"""Database utility functions."""

from typing import Optional, Any, Dict
from uuid import UUID
from supabase import Client
from postgrest.exceptions import APIError


def convert_uuid_fields(data: Dict[str, Any], uuid_fields: list[str]) -> Dict[str, Any]:
    """Convert UUID objects to strings for fields specified in uuid_fields."""
    converted_data = data.copy()
    for field in uuid_fields:
        if field in converted_data and isinstance(converted_data[field], UUID):
            converted_data[field] = str(converted_data[field])
    return converted_data


def handle_supabase_error(func):
    """Decorator to handle common Supabase errors."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except APIError as e:
            # Log the error here if you have logging setup
            print(f"Supabase API Error in {func.__name__}: {e}")
            raise
        except Exception as e:
            # Log unexpected errors
            print(f"Unexpected error in {func.__name__}: {e}")
            raise
    return wrapper


def validate_uuid(uuid_string: str) -> Optional[UUID]:
    """Validate and convert string to UUID, return None if invalid."""
    try:
        return UUID(uuid_string)
    except (ValueError, TypeError):
        return None


def build_select_query(
    client: Client,
    table: str,
    select: str = "*",
    filters: Optional[Dict[str, Any]] = None,
    limit: Optional[int] = None,
    order_by: Optional[str] = None,
    ascending: bool = True
):
    """Build a Supabase select query with common options."""
    query = client.table(table).select(select)

    if filters:
        for key, value in filters.items():
            if isinstance(value, (list, tuple)):
                query = query.in_(key, value)
            else:
                query = query.eq(key, value)

    if order_by:
        query = query.order(order_by, desc=not ascending)

    if limit:
        query = query.limit(limit)

    return query
