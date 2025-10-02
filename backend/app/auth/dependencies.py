"""Authentication dependencies for the application."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase_client import get_supabase_client
from app.models.db.users import User
from supabase import Client

# Security scheme for JWT tokens
security = HTTPBearer()


def verify_token_with_supabase(token: str) -> dict:
    """
    Verify JWT token with Supabase and return user information.

    Args:
        token: JWT token to verify

    Returns:
        dict: User information from Supabase

    Raises:
        HTTPException: If token is invalid or verification fails
    """
    try:
        supabase_client: Client = get_supabase_client()

        # Use Supabase's built-in JWT verification
        # This will verify the token signature and extract user info
        user_response = supabase_client.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "user_metadata": user_response.user.user_metadata or {},
            "app_metadata": user_response.user.app_metadata or {}
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_info_from_database(user_id: str) -> User:
    """
    Get user information from the database using user ID.

    Args:
        user_id: User ID from Supabase auth

    Returns:
        User: User object from database

    Raises:
        HTTPException: If user not found in database
    """
    try:
        supabase_client: Client = get_supabase_client()

        # Query the users table for the user
        result = supabase_client.table("users").select("*").eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found in database",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Convert to User model
        user_data = result.data[0]
        return User(**user_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while fetching user",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Complete authentication flow: verify token with Supabase, get user info.

    Args:
        credentials: HTTP authorization credentials containing the JWT token

    Returns:
        User: Authenticated user object

    Raises:
        HTTPException: If authentication fails at any step
    """
    # Step 1: Extract token from HTTPBearer dependency
    token = credentials.credentials

    # Step 2: Verify token with Supabase
    user_info = verify_token_with_supabase(token)

    # Step 3: Get user info from database
    user = get_user_info_from_database(user_info["id"])

    return user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Optional authentication - returns user if authenticated, None otherwise.

    Args:
        credentials: Optional HTTP authorization credentials

    Returns:
        Optional[User]: User object if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
