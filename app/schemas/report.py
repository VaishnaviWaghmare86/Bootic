"""Admin dashboard summary and reporting schemas."""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_shopkeepers: int = 0
    active_shopkeepers: int = 0
    total_products: int = 0
    active_products: int = 0
    total_stock_units: int = 0
    low_stock_products_count: int = 0
    out_of_stock_products_count: int = 0
    total_orders: int = 0
    pending_orders: int = 0
    processing_orders: int = 0
    completed_orders: int = 0
    cancelled_orders: int = 0
    total_sales_amount: float = 0.0
    today_sales_amount: float = 0.0
    monthly_sales_amount: float = 0.0
    pending_requirements_count: int = 0


class TopSellingProduct(BaseModel):
    product_id: str
    product_name: str
    sku: str
    units_sold: int
    total_revenue: float


class CitySalesDistribution(BaseModel):
    city: str
    order_count: int
    total_revenue: float


class SalesReportResponse(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    top_products: List[TopSellingProduct] = []
    sales_by_city: List[CitySalesDistribution] = []


class InventoryValuationReport(BaseModel):
    total_skus: int
    total_quantity_in_stock: int
    total_reserved_quantity: int
    total_available_quantity: int
    estimated_wholesale_valuation: float
    low_stock_count: int
    out_of_stock_count: int
