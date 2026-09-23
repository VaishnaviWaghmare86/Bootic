"""Inventory and stock movement schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enums import InventoryAction


class StockInRequest(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0, description="Quantity of items received into stock")
    supplier_name: Optional[str] = Field(None, max_length=150)
    purchase_price_per_unit: Optional[float] = Field(None, ge=0)
    batch_number: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)


class StockAdjustmentRequest(BaseModel):
    product_id: str
    adjustment_quantity: int = Field(..., description="Positive to add stock, negative to reduce stock")
    reason: str = Field(..., min_length=3, max_length=200, description="Reason for adjustment (e.g. damaged stock, count correction)")
    notes: Optional[str] = Field(None, max_length=500)


class InventoryItemResponse(BaseModel):
    id: str
    product_id: str
    sku: str
    product_name: str
    total_stock: int
    reserved_stock: int
    available_stock: int
    low_stock_threshold: int
    is_low_stock: bool
    is_out_of_stock: bool
    last_updated: datetime


class InventoryMovementLog(BaseModel):
    id: str
    product_id: str
    sku: str
    product_name: str
    action: InventoryAction
    quantity_change: int
    previous_available: int
    new_available: int
    previous_reserved: int
    new_reserved: int
    reference_id: Optional[str] = None  # e.g., order_id, po_number
    performed_by: str
    notes: Optional[str] = None
    created_at: datetime
