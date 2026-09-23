"""User schemas and business profile representations."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import BusinessType, UserRole, UserStatus


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    mobile: str
    role: UserRole = UserRole.SHOPKEEPER
    status: UserStatus = UserStatus.ACTIVE
    city: Optional[str] = None
    state: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[BusinessType] = None
    pincode: Optional[str] = None
    business_address: Optional[str] = None
    gst_number: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_verified: bool = True
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    business_name: Optional[str] = Field(None, min_length=2, max_length=150)
    business_type: Optional[BusinessType] = None
    business_address: Optional[str] = Field(None, min_length=5, max_length=500)
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, pattern=r"^[0-9]{6}$")
    gst_number: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserStatusUpdate(BaseModel):
    status: UserStatus
    reason: Optional[str] = None
