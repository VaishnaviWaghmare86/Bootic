"""Authentication endpoints."""

from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import get_current_active_user, get_db, require_super_admin
from app.schemas.auth import (
    AdminCreateUserRequest,
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ShopkeeperRegisterRequest,
    TokenResponse,
)
from app.schemas.common import APIResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Shopkeeper public registration",
)
async def register_shopkeeper(
    req: ShopkeeperRegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)
) -> APIResponse[UserResponse]:
    """Register a new shopkeeper account with boutique business details."""
    user = await AuthService.register_shopkeeper(db, req)
    return APIResponse(
        success=True,
        message="Shopkeeper account created successfully. You can now login.",
        data=UserResponse(**user),
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    summary="User login with email and password",
)
async def login(
    req: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)
) -> APIResponse[TokenResponse]:
    """Authenticate user and return JWT access and refresh token pair."""
    user = await AuthService.authenticate_user(db, req)
    tokens = AuthService.create_user_tokens(user)
    return APIResponse(
        success=True,
        message="Authentication successful.",
        data=tokens,
    )


@router.post(
    "/refresh",
    response_model=APIResponse[TokenResponse],
    summary="Refresh JWT access token",
)
async def refresh_token(
    req: RefreshTokenRequest, db: AsyncIOMotorDatabase = Depends(get_db)
) -> APIResponse[TokenResponse]:
    """Generate a new access token using a valid refresh token."""
    tokens = await AuthService.refresh_access_token(db, req.refresh_token)
    return APIResponse(
        success=True,
        message="Token refreshed successfully.",
        data=tokens,
    )


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get current logged-in user profile",
)
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
) -> APIResponse[UserResponse]:
    """Return profile details of the authenticated user."""
    return APIResponse(
        success=True,
        message="User profile fetched.",
        data=UserResponse(**current_user),
    )


@router.post(
    "/change-password",
    response_model=APIResponse[None],
    summary="Change password",
)
async def change_password(
    req: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[None]:
    """Change the authenticated user's password."""
    await AuthService.change_password(db, str(current_user["id"]), req)
    return APIResponse(
        success=True,
        message="Password changed successfully.",
        data=None,
    )


@router.post(
    "/create-admin",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Admin/Staff user (Super Admin only)",
)
async def create_admin_user(
    req: AdminCreateUserRequest,
    super_admin: Dict[str, Any] = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[UserResponse]:
    """Super Admin can provision new admin/manager accounts."""
    user = await AuthService.admin_create_user(db, req)
    return APIResponse(
        success=True,
        message=f"{req.role.value} account created successfully.",
        data=UserResponse(**user),
    )
