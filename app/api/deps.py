"""FastAPI dependency injection utilities for database access, JWT auth, and RBAC."""

from typing import Any, Callable, Dict, List, Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import DatabaseManager
from app.core.exceptions import AuthenticationException, AuthorizationException
from app.core.security import decode_token
from app.models.enums import UserRole, UserStatus
from app.schemas.common import PaginationMeta
from app.utils.helpers import normalize_mongo_doc

bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> AsyncIOMotorDatabase:
    """Dependency returning the active MongoDB database instance."""
    return DatabaseManager.get_db()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Dict[str, Any]:
    """Validate JWT access token and return current user document."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except AuthenticationException as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db["users"].find_one({"_id": user_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.get("status") != UserStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.get('status')}.",
        )

    return normalize_mongo_doc(user)


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Ensure user status is ACTIVE."""
    return current_user


def require_roles(allowed_roles: List[UserRole]) -> Callable:
    """Dependency factory to enforce Role-Based Access Control (RBAC)."""
    allowed_role_values = [r.value if hasattr(r, "value") else str(r) for r in allowed_roles]

    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_active_user),
    ) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action prohibited for role '{user_role}'. Required roles: {allowed_role_values}",
            )
        return current_user

    return role_checker


# Role shortcut dependencies
require_admin = require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])
require_super_admin = require_roles([UserRole.SUPER_ADMIN])
require_shopkeeper = require_roles([UserRole.SHOPKEEPER])


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        limit: int = Query(20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.limit = limit
        self.skip = (page - 1) * limit

    def get_meta(self, total_records: int) -> PaginationMeta:
        total_pages = (total_records + self.limit - 1) // self.limit if total_records > 0 else 1
        return PaginationMeta(
            page=self.page,
            limit=self.limit,
            total_records=total_records,
            total_pages=total_pages,
            has_next=self.page < total_pages,
            has_prev=self.page > 1,
        )
