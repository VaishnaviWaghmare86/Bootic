"""Cart schemas with real-time wholesale tier price calculation."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1, description="Quantity to add (must satisfy product MOQ)")
    selected_size: Optional[str] = Field(None, description="Selected clothing size e.g. 'M', 'L', 'Set'")
    selected_color: Optional[str] = Field(None, description="Selected color variant")


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, description="Updated quantity (must satisfy product MOQ)")
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


class CartItemResponse(BaseModel):
    product_id: str
    sku: str
    product_name: str
    product_image: Optional[str] = None
    quantity: int
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None
    base_price: float
    effective_unit_price: float
    item_total: float
    minimum_order_quantity: int
    is_available: bool = True
    available_stock: int = 0


class CartResponse(BaseModel):
    id: str
    customer_id: str
    items: List[CartItemResponse] = Field(default_factory=list)
    total_items_count: int = 0
    total_quantity: int = 0
    subtotal: float = 0.0
    estimated_tax: float = 0.0
    estimated_shipping: float = 0.0
    total_amount: float = 0.0
    updated_at: datetime
