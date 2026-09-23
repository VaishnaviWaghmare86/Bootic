"""Shipping address schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    contact_person: str = Field(..., min_length=2, max_length=100)
    business_name: Optional[str] = None
    phone: str = Field(..., pattern=r"^[0-9]{10}$")
    address_line1: str = Field(..., min_length=5, max_length=200)
    address_line2: Optional[str] = Field(None, max_length=200)
    landmark: Optional[str] = Field(None, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(default="Maharashtra", max_length=100)
    pincode: str = Field(..., pattern=r"^[0-9]{6}$")
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    contact_person: Optional[str] = Field(None, min_length=2, max_length=100)
    business_name: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r"^[0-9]{10}$")
    address_line1: Optional[str] = Field(None, min_length=5, max_length=200)
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, pattern=r"^[0-9]{6}$")
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: str
    customer_id: str
    created_at: datetime
    updated_at: datetime
