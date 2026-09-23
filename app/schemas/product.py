"""Product schemas with wholesale tier pricing and attribute support."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import GenderCategory, ProductStatus


class TierPricing(BaseModel):
    min_quantity: int = Field(..., ge=1, description="Minimum piece quantity for this price slab")
    max_quantity: Optional[int] = Field(None, ge=1, description="Maximum piece quantity (None for unbounded e.g. 100+)")
    price_per_unit: float = Field(..., gt=0, description="Wholesale price per unit for this slab")


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    sku: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)
    category_id: str
    category_name: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = "Mumbai Wholesale"
    fabric: Optional[str] = None
    color: Optional[str] = None
    available_sizes: List[str] = Field(default_factory=lambda: ["M", "L", "XL", "XXL"])
    pattern: Optional[str] = None
    gender: GenderCategory = GenderCategory.WOMEN
    product_images: List[str] = Field(default_factory=list)
    wholesale_price: float = Field(..., gt=0, description="Base wholesale price per unit")
    tier_prices: List[TierPricing] = Field(default_factory=list, description="Quantity-based wholesale pricing slabs")
    minimum_order_quantity: int = Field(default=5, ge=1, description="Minimum Order Quantity (MOQ)")
    low_stock_threshold: int = Field(default=20, ge=0)
    status: ProductStatus = ProductStatus.ACTIVE


class ProductCreate(ProductBase):
    opening_stock: int = Field(default=0, ge=0, description="Initial stock quantity to create in inventory")


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    category_id: Optional[str] = None
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    fabric: Optional[str] = None
    color: Optional[str] = None
    available_sizes: Optional[List[str]] = None
    pattern: Optional[str] = None
    gender: Optional[GenderCategory] = None
    product_images: Optional[List[str]] = None
    wholesale_price: Optional[float] = Field(None, gt=0)
    tier_prices: Optional[List[TierPricing]] = None
    minimum_order_quantity: Optional[int] = Field(None, ge=1)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    status: Optional[ProductStatus] = None


class ProductResponse(ProductBase):
    id: str
    available_quantity: int = 0
    reserved_quantity: int = 0
    current_quantity: int = 0
    created_at: datetime
    updated_at: datetime


class ProductFilterParams(BaseModel):
    search: Optional[str] = None
    category_id: Optional[str] = None
    subcategory: Optional[str] = None
    gender: Optional[GenderCategory] = None
    fabric: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock_only: Optional[bool] = False
    status: Optional[ProductStatus] = None
    sort_by: Optional[str] = "newest"  # newest, price_low_to_high, price_high_to_low, popularity
    page: int = 1
    limit: int = 20
