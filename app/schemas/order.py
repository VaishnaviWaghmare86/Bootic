"""Order schemas with item snapshots, status workflows, and tracking."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.schemas.address import AddressBase


class OrderItemSnapshot(BaseModel):
    product_id: str
    sku: str
    product_name: str
    product_image: Optional[str] = None
    quantity: int = Field(..., ge=1)
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None
    unit_price: float = Field(..., gt=0, description="Frozen historical unit wholesale price")
    discount: float = Field(default=0.0, ge=0)
    subtotal: float = Field(..., gt=0)


class OrderCreateFromCart(BaseModel):
    shipping_address_id: Optional[str] = None
    shipping_address: Optional[AddressBase] = None
    payment_method: PaymentMethod = PaymentMethod.COD
    notes: Optional[str] = Field(None, max_length=500)


class DirectOrderItem(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1)
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


class OrderCreateDirect(BaseModel):
    items: List[DirectOrderItem] = Field(..., min_length=1)
    shipping_address_id: Optional[str] = None
    shipping_address: Optional[AddressBase] = None
    payment_method: PaymentMethod = PaymentMethod.COD
    notes: Optional[str] = Field(None, max_length=500)


class OrderStatusUpdate(BaseModel):
    order_status: OrderStatus
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None


class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_business_name: Optional[str] = None
    customer_city: Optional[str] = None
    customer_mobile: Optional[str] = None
    items: List[OrderItemSnapshot]
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    shipping_charge: float = 0.0
    total_amount: float
    shipping_address: AddressBase
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    order_status: OrderStatus
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
