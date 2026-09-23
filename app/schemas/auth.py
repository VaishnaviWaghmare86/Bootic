"""Authentication and authorization schemas."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import BusinessType, UserRole


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    type: str
    exp: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ShopkeeperRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    business_name: str = Field(..., min_length=2, max_length=150)
    mobile: str = Field(..., pattern=r"^[0-9]{10}$", description="10-digit Indian mobile number")
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(default="Maharashtra", max_length=100)
    pincode: str = Field(..., pattern=r"^[0-9]{6}$", description="6-digit Indian PIN code")
    business_address: str = Field(..., min_length=5, max_length=500)
    gst_number: Optional[str] = Field(None, max_length=20)
    business_type: BusinessType = BusinessType.BOUTIQUE
    profile_image_url: Optional[str] = None


class AdminCreateUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile: str = Field(..., pattern=r"^[0-9]{10}$")
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.ADMIN
    city: Optional[str] = "Mumbai"
    state: Optional[str] = "Maharashtra"


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6, max_length=100)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=100)
