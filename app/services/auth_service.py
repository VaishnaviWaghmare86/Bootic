"""Authentication service managing registration, login, token refresh, and password management."""

from datetime import timedelta
from typing import Any, Dict, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationException,
    DuplicateEntityException,
    EntityNotFoundException,
    ValidationException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.enums import UserRole, UserStatus
from app.schemas.auth import (
    AdminCreateUserRequest,
    ChangePasswordRequest,
    LoginRequest,
    ShopkeeperRegisterRequest,
    TokenResponse,
)
from app.utils.helpers import utc_now, normalize_mongo_doc


class AuthService:
    @staticmethod
    async def register_shopkeeper(db: AsyncIOMotorDatabase, req: ShopkeeperRegisterRequest) -> Dict[str, Any]:
        """Register a new shopkeeper account."""
        # Check duplicate email
        existing_email = await db["users"].find_one({"email": req.email.lower()})
        if existing_email:
            raise DuplicateEntityException("User", "email", req.email)

        # Check duplicate mobile
        existing_mobile = await db["users"].find_one({"mobile": req.mobile})
        if existing_mobile:
            raise DuplicateEntityException("User", "mobile", req.mobile)

        user_doc = {
            "full_name": req.full_name.strip(),
            "business_name": req.business_name.strip(),
            "email": req.email.lower().strip(),
            "mobile": req.mobile.strip(),
            "hashed_password": hash_password(req.password),
            "role": UserRole.SHOPKEEPER.value,
            "status": UserStatus.ACTIVE.value,
            "city": req.city.strip(),
            "state": req.state.strip(),
            "pincode": req.pincode.strip(),
            "business_address": req.business_address.strip(),
            "gst_number": req.gst_number.strip() if req.gst_number else None,
            "business_type": req.business_type.value,
            "profile_image_url": req.profile_image_url,
            "is_verified": True,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }

        result = await db["users"].insert_one(user_doc)
        user_doc["_id"] = result.inserted_id

        # Also initialize an empty cart for the shopkeeper
        await db["carts"].insert_one({
            "customer_id": str(result.inserted_id),
            "items": [],
            "updated_at": utc_now()
        })

        return normalize_mongo_doc(user_doc)

    @staticmethod
    async def admin_create_user(db: AsyncIOMotorDatabase, req: AdminCreateUserRequest) -> Dict[str, Any]:
        """Authorized endpoint to create ADMIN or other staff accounts."""
        existing_email = await db["users"].find_one({"email": req.email.lower()})
        if existing_email:
            raise DuplicateEntityException("User", "email", req.email)

        existing_mobile = await db["users"].find_one({"mobile": req.mobile})
        if existing_mobile:
            raise DuplicateEntityException("User", "mobile", req.mobile)

        user_doc = {
            "full_name": req.full_name.strip(),
            "email": req.email.lower().strip(),
            "mobile": req.mobile.strip(),
            "hashed_password": hash_password(req.password),
            "role": req.role.value,
            "status": UserStatus.ACTIVE.value,
            "city": req.city,
            "state": req.state,
            "is_verified": True,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }

        result = await db["users"].insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return normalize_mongo_doc(user_doc)

    @staticmethod
    async def authenticate_user(db: AsyncIOMotorDatabase, req: LoginRequest) -> Dict[str, Any]:
        """Authenticate user by email and password, return user doc."""
        user = await db["users"].find_one({"email": req.email.lower()})
        if not user:
            raise AuthenticationException("Invalid email or password.")

        if not verify_password(req.password, user.get("hashed_password", "")):
            raise AuthenticationException("Invalid email or password.")

        if user.get("status") != UserStatus.ACTIVE.value:
            raise AuthenticationException(f"Account is {user.get('status')}. Please contact support.")

        return normalize_mongo_doc(user)

    @staticmethod
    def create_user_tokens(user: Dict[str, Any]) -> TokenResponse:
        """Generate access and refresh tokens for user."""
        user_id = str(user["id"])
        role = user.get("role", UserRole.SHOPKEEPER.value)

        access_token = create_access_token(
            subject=user_id,
            role=role,
            extra_claims={"email": user.get("email"), "name": user.get("full_name")},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        refresh_token = create_refresh_token(
            subject=user_id,
            role=role,
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    async def refresh_access_token(db: AsyncIOMotorDatabase, refresh_token_str: str) -> TokenResponse:
        """Validate refresh token and issue a new access token pair."""
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            raise AuthenticationException("Invalid token type. Refresh token required.")

        user_id = payload.get("sub")
        try:
            user = await db["users"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            raise AuthenticationException("User associated with token does not exist.")

        if not user or user.get("status") != UserStatus.ACTIVE.value:
            raise AuthenticationException("User account is inactive or deleted.")

        normalized_user = normalize_mongo_doc(user)
        return AuthService.create_user_tokens(normalized_user)

    @staticmethod
    async def change_password(
        db: AsyncIOMotorDatabase, user_id: str, req: ChangePasswordRequest
    ) -> bool:
        """Change password for an authenticated user."""
        try:
            user = await db["users"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            raise EntityNotFoundException("User", user_id)

        if not user:
            raise EntityNotFoundException("User", user_id)

        if not verify_password(req.current_password, user.get("hashed_password", "")):
            raise ValidationException("Current password is incorrect.")

        new_hash = hash_password(req.new_password)
        await db["users"].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"hashed_password": new_hash, "updated_at": utc_now()}}
        )
        return True
