"""Shopkeeper custom requirements and quote management schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import RequirementStatus


class RequirementCreate(BaseModel):
    product_category: str = Field(..., min_length=2, max_length=100, description="e.g. Women's Kurtis, Sarees, Palazzo")
    product_title: Optional[str] = Field(None, max_length=150)
    quantity: int = Field(..., ge=1, description="Desired total piece quantity")
    preferred_colors: List[str] = Field(default_factory=list, description="List of preferred colors e.g. ['Pink', 'Blue', 'Black']")
    preferred_sizes: List[str] = Field(default_factory=list, description="List of preferred sizes e.g. ['M', 'L', 'XL']")
    target_budget: Optional[float] = Field(None, gt=0, description="Target total budget in INR")
    delivery_city: str = Field(..., min_length=2, max_length=100, description="Destination city e.g. 'Satara', 'Kolhapur'")
    delivery_state: Optional[str] = "Maharashtra"
    needed_by_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)


class RequirementAdminQuote(BaseModel):
    quoted_price_per_unit: float = Field(..., gt=0)
    total_quoted_price: float = Field(..., gt=0)
    estimated_fulfillment_days: int = Field(..., ge=1)
    admin_notes: Optional[str] = Field(None, max_length=1000)
    suggested_product_ids: List[str] = Field(default_factory=list)


class RequirementStatusUpdate(BaseModel):
    status: RequirementStatus
    admin_notes: Optional[str] = None
    quote: Optional[RequirementAdminQuote] = None


class RequirementResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_business_name: Optional[str] = None
    customer_mobile: Optional[str] = None
    customer_city: Optional[str] = None
    product_category: str
    product_title: Optional[str] = None
    quantity: int
    preferred_colors: List[str]
    preferred_sizes: List[str]
    target_budget: Optional[float] = None
    delivery_city: str
    delivery_state: Optional[str] = None
    needed_by_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: RequirementStatus
    quote: Optional[RequirementAdminQuote] = None
    created_at: datetime
    updated_at: datetime
