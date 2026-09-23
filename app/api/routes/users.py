"""User management endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import PaginationParams, get_current_active_user, get_db, require_admin
from app.models.enums import UserStatus
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.user import UserProfileUpdate, UserResponse, UserStatusUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.put(
    "/profile",
    response_model=APIResponse[UserResponse],
    summary="Update current user's profile",
)
async def update_profile(
    profile_in: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[UserResponse]:
    """Update profile and business details for the current user."""
    updated = await UserService.update_profile(db, str(current_user["id"]), profile_in)
    return APIResponse(
        success=True,
        message="Profile updated successfully.",
        data=UserResponse(**updated),
    )


@router.get(
    "/shopkeepers",
    response_model=PaginatedResponse[UserResponse],
    summary="List all shopkeepers (Admin only)",
)
async def list_shopkeepers(
    search: Optional[str] = Query(None, description="Search by name, business, city, mobile"),
    city: Optional[str] = Query(None, description="Filter by city e.g. Pune, Nashik, Satara"),
    status_filter: Optional[UserStatus] = Query(None, alias="status"),
    pagination: PaginationParams = Depends(),
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[UserResponse]:
    """Admin directory of registered shopkeepers and boutiques."""
    res = await UserService.list_shopkeepers(
        db=db,
        search=search,
        city=city,
        status=status_filter,
        skip=pagination.skip,
        limit=pagination.limit,
    )
    return PaginatedResponse(
        success=True,
        message="Shopkeepers retrieved successfully.",
        data=[UserResponse(**item) for item in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )


@router.get(
    "/{user_id}",
    response_model=APIResponse[UserResponse],
    summary="Get user details by ID (Admin only)",
)
async def get_user_by_id(
    user_id: str,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[UserResponse]:
    """Get full details of any user."""
    user = await UserService.get_by_id(db, user_id)
    return APIResponse(
        success=True,
        message="User fetched.",
        data=UserResponse(**user),
    )


@router.patch(
    "/{user_id}/status",
    response_model=APIResponse[UserResponse],
    summary="Activate / Deactivate / Block user (Admin only)",
)
async def update_user_status(
    user_id: str,
    status_in: UserStatusUpdate,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[UserResponse]:
    """Admin control over user account status."""
    updated = await UserService.update_status(db, user_id, status_in)
    return APIResponse(
        success=True,
        message=f"User status updated to {status_in.status.value}.",
        data=UserResponse(**updated),
    )
