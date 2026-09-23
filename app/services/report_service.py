"""Report and analytics service for admin dashboard."""

from datetime import datetime, time, timezone
from typing import Any, Dict, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.enums import OrderStatus, ProductStatus, RequirementStatus, UserRole, UserStatus
from app.schemas.report import (
    CitySalesDistribution,
    DashboardStats,
    InventoryValuationReport,
    SalesReportResponse,
    TopSellingProduct,
)
from app.utils.helpers import utc_now


class ReportService:
    @staticmethod
    async def get_dashboard_stats(db: AsyncIOMotorDatabase) -> DashboardStats:
        """Fetch real-time comprehensive operational statistics."""
        # 1. Shopkeeper counts
        total_shopkeepers = await db["users"].count_documents({"role": UserRole.SHOPKEEPER.value})
        active_shopkeepers = await db["users"].count_documents({
            "role": UserRole.SHOPKEEPER.value,
            "status": UserStatus.ACTIVE.value
        })

        # 2. Products counts
        total_products = await db["products"].count_documents({})
        active_products = await db["products"].count_documents({"status": ProductStatus.ACTIVE.value})

        # 3. Inventory counts
        inv_cursor = db["inventory"].find({})
        inv_items = await inv_cursor.to_list(length=1000)
        total_stock_units = sum(i.get("total_stock", 0) for i in inv_items)
        low_stock_products_count = sum(
            1 for i in inv_items if 0 < i.get("available_stock", 0) <= i.get("low_stock_threshold", 20)
        )
        out_of_stock_products_count = sum(1 for i in inv_items if i.get("available_stock", 0) <= 0)

        # 4. Orders counts & status breakdown
        total_orders = await db["orders"].count_documents({})
        pending_orders = await db["orders"].count_documents({
            "order_status": {"$in": [OrderStatus.ORDER_PLACED.value, OrderStatus.PENDING_CONFIRMATION.value]}
        })
        processing_orders = await db["orders"].count_documents({
            "order_status": {"$in": [OrderStatus.CONFIRMED.value, OrderStatus.PROCESSING.value, OrderStatus.PACKED.value, OrderStatus.SHIPPED.value]}
        })
        completed_orders = await db["orders"].count_documents({"order_status": OrderStatus.DELIVERED.value})
        cancelled_orders = await db["orders"].count_documents({
            "order_status": {"$in": [OrderStatus.CANCELLED.value, OrderStatus.REJECTED.value]}
        })

        # 5. Sales Calculations
        orders_cursor = db["orders"].find({
            "order_status": {"$nin": [OrderStatus.CANCELLED.value, OrderStatus.REJECTED.value]}
        })
        valid_orders = await orders_cursor.to_list(length=5000)
        total_sales_amount = sum(float(o.get("total_amount", 0.0)) for o in valid_orders)

        now = utc_now()
        start_of_today = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)

        today_sales_amount = sum(
            float(o.get("total_amount", 0.0))
            for o in valid_orders
            if o.get("created_at") and o["created_at"].replace(tzinfo=timezone.utc) >= start_of_today
        )

        monthly_sales_amount = sum(
            float(o.get("total_amount", 0.0))
            for o in valid_orders
            if o.get("created_at") and o["created_at"].replace(tzinfo=timezone.utc) >= start_of_month
        )

        # 6. Pending Requirements
        pending_requirements = await db["requirements"].count_documents({"status": RequirementStatus.PENDING.value})

        return DashboardStats(
            total_shopkeepers=total_shopkeepers,
            active_shopkeepers=active_shopkeepers,
            total_products=total_products,
            active_products=active_products,
            total_stock_units=total_stock_units,
            low_stock_products_count=low_stock_products_count,
            out_of_stock_products_count=out_of_stock_products_count,
            total_orders=total_orders,
            pending_orders=pending_orders,
            processing_orders=processing_orders,
            completed_orders=completed_orders,
            cancelled_orders=cancelled_orders,
            total_sales_amount=round(total_sales_amount, 2),
            today_sales_amount=round(today_sales_amount, 2),
            monthly_sales_amount=round(monthly_sales_amount, 2),
            pending_requirements_count=pending_requirements,
        )

    @staticmethod
    async def get_sales_report(db: AsyncIOMotorDatabase) -> SalesReportResponse:
        """Aggregate sales by top products, top cities, and overall metrics."""
        orders_cursor = db["orders"].find({
            "order_status": {"$nin": [OrderStatus.CANCELLED.value, OrderStatus.REJECTED.value]}
        })
        orders = await orders_cursor.to_list(length=5000)

        total_rev = 0.0
        total_orders_count = len(orders)
        product_stats: Dict[str, Dict[str, Any]] = {}
        city_stats: Dict[str, Dict[str, Any]] = {}

        for o in orders:
            amt = float(o.get("total_amount", 0.0))
            total_rev += amt

            # City aggregation
            city = o.get("customer_city") or (o.get("shipping_address", {}).get("city")) or "Unknown"
            if city not in city_stats:
                city_stats[city] = {"city": city, "order_count": 0, "total_revenue": 0.0}
            city_stats[city]["order_count"] += 1
            city_stats[city]["total_revenue"] += amt

            # Product aggregation
            for it in o.get("items", []):
                pid = it.get("product_id")
                qty = it.get("quantity", 0)
                sub = float(it.get("subtotal", 0.0))
                if pid not in product_stats:
                    product_stats[pid] = {
                        "product_id": pid,
                        "product_name": it.get("product_name", "Product"),
                        "sku": it.get("sku", ""),
                        "units_sold": 0,
                        "total_revenue": 0.0,
                    }
                product_stats[pid]["units_sold"] += qty
                product_stats[pid]["total_revenue"] += sub

        avg_order = round(total_rev / total_orders_count, 2) if total_orders_count > 0 else 0.0

        # Sort top products
        sorted_prods = sorted(product_stats.values(), key=lambda x: x["total_revenue"], reverse=True)[:10]
        top_products = [
            TopSellingProduct(
                product_id=p["product_id"],
                product_name=p["product_name"],
                sku=p["sku"],
                units_sold=p["units_sold"],
                total_revenue=round(p["total_revenue"], 2),
            )
            for p in sorted_prods
        ]

        # Sort top cities
        sorted_cities = sorted(city_stats.values(), key=lambda x: x["total_revenue"], reverse=True)[:10]
        sales_by_city = [
            CitySalesDistribution(
                city=c["city"],
                order_count=c["order_count"],
                total_revenue=round(c["total_revenue"], 2),
            )
            for c in sorted_cities
        ]

        return SalesReportResponse(
            total_revenue=round(total_rev, 2),
            total_orders=total_orders_count,
            average_order_value=avg_order,
            top_products=top_products,
            sales_by_city=sales_by_city,
        )

    @staticmethod
    async def get_inventory_valuation(db: AsyncIOMotorDatabase) -> InventoryValuationReport:
        """Calculate total inventory valuation and quantity metrics."""
        inv_cursor = db["inventory"].find({})
        inv_items = await inv_cursor.to_list(length=5000)

        prod_cursor = db["products"].find({})
        prods = await prod_cursor.to_list(length=5000)
        price_map = {str(p["_id"]): float(p.get("wholesale_price", 0.0)) for p in prods}

        total_skus = len(inv_items)
        total_qty = 0
        total_res = 0
        total_avail = 0
        total_valuation = 0.0
        low_count = 0
        out_count = 0

        for item in inv_items:
            t_stock = item.get("total_stock", 0)
            r_stock = item.get("reserved_stock", 0)
            a_stock = item.get("available_stock", 0)
            threshold = item.get("low_stock_threshold", 20)

            total_qty += t_stock
            total_res += r_stock
            total_avail += a_stock

            price = price_map.get(item.get("product_id"), 0.0)
            total_valuation += t_stock * price

            if a_stock <= 0:
                out_count += 1
            elif a_stock <= threshold:
                low_count += 1

        return InventoryValuationReport(
            total_skus=total_skus,
            total_quantity_in_stock=total_qty,
            total_reserved_quantity=total_res,
            total_available_quantity=total_avail,
            estimated_wholesale_valuation=round(total_valuation, 2),
            low_stock_count=low_count,
            out_of_stock_count=out_count,
        )
