"""Inventory management service: stock in/out, atomic reservations, adjustments, and low-stock alerting."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import (
    EntityNotFoundException,
    InsufficientStockException,
    ValidationException,
)
from app.models.enums import InventoryAction, NotificationType, ProductStatus
from app.schemas.inventory import StockAdjustmentRequest, StockInRequest
from app.services.notification_service import NotificationService
from app.utils.helpers import utc_now, normalize_mongo_doc, normalize_mongo_docs


class InventoryService:
    @staticmethod
    async def get_by_product_id(db: AsyncIOMotorDatabase, product_id: str) -> Dict[str, Any]:
        """Fetch inventory record for a product."""
        inv = await db["inventory"].find_one({"product_id": product_id})
        if not inv:
            raise EntityNotFoundException("Inventory", product_id)
        normalized = normalize_mongo_doc(inv)
        normalized["is_low_stock"] = (
            normalized["available_stock"] <= normalized.get("low_stock_threshold", 20)
            and normalized["available_stock"] > 0
        )
        normalized["is_out_of_stock"] = normalized["available_stock"] <= 0
        return normalized

    @staticmethod
    async def stock_in(
        db: AsyncIOMotorDatabase, req: StockInRequest, performed_by: str
    ) -> Dict[str, Any]:
        """Add new stock quantity to inventory (e.g. fresh batch from manufacturer)."""
        inv = await db["inventory"].find_one({"product_id": req.product_id})
        if not inv:
            raise EntityNotFoundException("Product Inventory", req.product_id)

        prev_avail = inv.get("available_stock", 0)
        prev_reserved = inv.get("reserved_stock", 0)
        prev_total = inv.get("total_stock", 0)

        new_total = prev_total + req.quantity
        new_avail = prev_avail + req.quantity

        await db["inventory"].update_one(
            {"product_id": req.product_id},
            {
                "$inc": {"total_stock": req.quantity, "available_stock": req.quantity},
                "$set": {"last_updated": utc_now()},
            }
        )

        # Update product status to ACTIVE if it was OUT_OF_STOCK
        if prev_avail <= 0 and new_avail > 0:
            await db["products"].update_one(
                {"_id": ObjectId(req.product_id) if ObjectId.is_valid(req.product_id) else req.product_id},
                {"$set": {"status": ProductStatus.ACTIVE.value, "updated_at": utc_now()}}
            )

        # Log movement
        notes = f"Supplier: {req.supplier_name or 'N/A'}"
        if req.batch_number:
            notes += f" | Batch: {req.batch_number}"
        if req.notes:
            notes += f" | {req.notes}"

        await db["inventory_logs"].insert_one({
            "product_id": req.product_id,
            "sku": inv.get("sku", ""),
            "product_name": inv.get("product_name", ""),
            "action": InventoryAction.STOCK_IN.value,
            "quantity_change": req.quantity,
            "previous_available": prev_avail,
            "new_available": new_avail,
            "previous_reserved": prev_reserved,
            "new_reserved": prev_reserved,
            "performed_by": performed_by,
            "notes": notes,
            "created_at": utc_now(),
        })

        return await InventoryService.get_by_product_id(db, req.product_id)

    @staticmethod
    async def stock_adjustment(
        db: AsyncIOMotorDatabase, req: StockAdjustmentRequest, performed_by: str
    ) -> Dict[str, Any]:
        """Manually adjust stock (positive or negative)."""
        inv = await db["inventory"].find_one({"product_id": req.product_id})
        if not inv:
            raise EntityNotFoundException("Product Inventory", req.product_id)

        prev_avail = inv.get("available_stock", 0)
        prev_reserved = inv.get("reserved_stock", 0)
        prev_total = inv.get("total_stock", 0)

        new_avail = prev_avail + req.adjustment_quantity
        new_total = prev_total + req.adjustment_quantity

        if new_avail < 0:
            raise ValidationException(
                f"Adjustment cannot result in negative stock. Current available: {prev_avail}, adjustment: {req.adjustment_quantity}"
            )

        await db["inventory"].update_one(
            {"product_id": req.product_id},
            {
                "$inc": {"total_stock": req.adjustment_quantity, "available_stock": req.adjustment_quantity},
                "$set": {"last_updated": utc_now()},
            }
        )

        # Update product status if out of stock
        if new_avail == 0:
            await db["products"].update_one(
                {"_id": ObjectId(req.product_id) if ObjectId.is_valid(req.product_id) else req.product_id},
                {"$set": {"status": ProductStatus.OUT_OF_STOCK.value, "updated_at": utc_now()}}
            )

        # Check low stock notification
        low_threshold = inv.get("low_stock_threshold", 20)
        if 0 < new_avail <= low_threshold:
            await NotificationService.notify_all_admins(
                db,
                title=f"Low Stock Alert: {inv.get('product_name')}",
                message=f"Stock for '{inv.get('product_name')}' ({inv.get('sku')}) is low: {new_avail} units remaining.",
                notification_type=NotificationType.LOW_STOCK,
                reference_id=req.product_id,
            )

        # Log
        await db["inventory_logs"].insert_one({
            "product_id": req.product_id,
            "sku": inv.get("sku", ""),
            "product_name": inv.get("product_name", ""),
            "action": InventoryAction.STOCK_ADJUSTMENT.value,
            "quantity_change": req.adjustment_quantity,
            "previous_available": prev_avail,
            "new_available": new_avail,
            "previous_reserved": prev_reserved,
            "new_reserved": prev_reserved,
            "performed_by": performed_by,
            "notes": f"Reason: {req.reason} | {req.notes or ''}",
            "created_at": utc_now(),
        })

        return await InventoryService.get_by_product_id(db, req.product_id)

    @staticmethod
    async def reserve_stock_for_order(
        db: AsyncIOMotorDatabase,
        product_id: str,
        quantity: int,
        order_number: str,
        performed_by: str = "system",
    ) -> bool:
        """
        Atomically reserve stock when an order is placed.
        Ensures available_stock >= quantity to avoid race conditions and negative stock.
        """
        inv = await db["inventory"].find_one({"product_id": product_id})
        if not inv:
            raise EntityNotFoundException("Product Inventory", product_id)

        # Atomic find and update with condition
        res = await db["inventory"].update_one(
            {
                "product_id": product_id,
                "available_stock": {"$gte": quantity},
            },
            {
                "$inc": {"available_stock": -quantity, "reserved_stock": quantity},
                "$set": {"last_updated": utc_now()},
            }
        )

        if res.modified_count == 0:
            avail = inv.get("available_stock", 0)
            raise InsufficientStockException(
                product_name=inv.get("product_name", product_id),
                requested=quantity,
                available=avail,
            )

        # Log reservation
        new_avail = inv.get("available_stock", 0) - quantity
        new_reserved = inv.get("reserved_stock", 0) + quantity

        # Update product status if available became 0
        if new_avail == 0:
            await db["products"].update_one(
                {"_id": ObjectId(product_id) if ObjectId.is_valid(product_id) else product_id},
                {"$set": {"status": ProductStatus.OUT_OF_STOCK.value, "updated_at": utc_now()}}
            )

        # Check low stock notification
        if 0 < new_avail <= inv.get("low_stock_threshold", 20):
            await NotificationService.notify_all_admins(
                db,
                title=f"Low Stock Alert: {inv.get('product_name')}",
                message=f"Stock for '{inv.get('product_name')}' ({inv.get('sku')}) is low: {new_avail} units remaining.",
                notification_type=NotificationType.LOW_STOCK,
                reference_id=product_id,
            )

        await db["inventory_logs"].insert_one({
            "product_id": product_id,
            "sku": inv.get("sku", ""),
            "product_name": inv.get("product_name", ""),
            "action": InventoryAction.ORDER_RESERVED.value,
            "quantity_change": -quantity,
            "previous_available": inv.get("available_stock", 0),
            "new_available": new_avail,
            "previous_reserved": inv.get("reserved_stock", 0),
            "new_reserved": new_reserved,
            "reference_id": order_number,
            "performed_by": performed_by,
            "notes": f"Stock reserved for Order {order_number}",
            "created_at": utc_now(),
        })

        return True

    @staticmethod
    async def release_reserved_stock(
        db: AsyncIOMotorDatabase,
        product_id: str,
        quantity: int,
        order_number: str,
        performed_by: str = "system",
    ) -> bool:
        """Release reserved stock back to available stock (e.g. order cancelled or rejected)."""
        inv = await db["inventory"].find_one({"product_id": product_id})
        if not inv:
            return False

        qty_to_release = min(quantity, inv.get("reserved_stock", 0))
        if qty_to_release <= 0:
            return True

        await db["inventory"].update_one(
            {"product_id": product_id},
            {
                "$inc": {"available_stock": qty_to_release, "reserved_stock": -qty_to_release},
                "$set": {"last_updated": utc_now()},
            }
        )

        # Restore ACTIVE status if previously marked OUT_OF_STOCK
        await db["products"].update_one(
            {"_id": ObjectId(product_id) if ObjectId.is_valid(product_id) else product_id},
            {"$set": {"status": ProductStatus.ACTIVE.value, "updated_at": utc_now()}}
        )

        prev_avail = inv.get("available_stock", 0)
        prev_res = inv.get("reserved_stock", 0)

        await db["inventory_logs"].insert_one({
            "product_id": product_id,
            "sku": inv.get("sku", ""),
            "product_name": inv.get("product_name", ""),
            "action": InventoryAction.ORDER_RELEASED.value,
            "quantity_change": qty_to_release,
            "previous_available": prev_avail,
            "new_available": prev_avail + qty_to_release,
            "previous_reserved": prev_res,
            "new_reserved": prev_res - qty_to_release,
            "reference_id": order_number,
            "performed_by": performed_by,
            "notes": f"Released reserved stock for cancelled/rejected Order {order_number}",
            "created_at": utc_now(),
        })

        return True

    @staticmethod
    async def fulfill_reserved_stock(
        db: AsyncIOMotorDatabase,
        product_id: str,
        quantity: int,
        order_number: str,
        performed_by: str = "system",
    ) -> bool:
        """Deduct from total stock and clear reserved stock upon shipment / delivery."""
        inv = await db["inventory"].find_one({"product_id": product_id})
        if not inv:
            return False

        qty_to_fulfill = min(quantity, inv.get("reserved_stock", 0))

        await db["inventory"].update_one(
            {"product_id": product_id},
            {
                "$inc": {"total_stock": -quantity, "reserved_stock": -qty_to_fulfill},
                "$set": {"last_updated": utc_now()},
            }
        )

        await db["inventory_logs"].insert_one({
            "product_id": product_id,
            "sku": inv.get("sku", ""),
            "product_name": inv.get("product_name", ""),
            "action": InventoryAction.ORDER_FULFILLED.value,
            "quantity_change": -quantity,
            "previous_available": inv.get("available_stock", 0),
            "new_available": inv.get("available_stock", 0),
            "previous_reserved": inv.get("reserved_stock", 0),
            "new_reserved": max(0, inv.get("reserved_stock", 0) - qty_to_fulfill),
            "reference_id": order_number,
            "performed_by": performed_by,
            "notes": f"Inventory fulfilled for delivered Order {order_number}",
            "created_at": utc_now(),
        })

        return True

    @staticmethod
    async def list_inventory(
        db: AsyncIOMotorDatabase,
        search: Optional[str] = None,
        low_stock_only: bool = False,
        out_of_stock_only: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """List inventory records with status calculations."""
        query: Dict[str, Any] = {}
        if search:
            query["$or"] = [
                {"product_name": {"$regex": search, "$options": "i"}},
                {"sku": {"$regex": search, "$options": "i"}},
            ]
        if out_of_stock_only:
            query["available_stock"] = {"$lte": 0}
        elif low_stock_only:
            query["$expr"] = {"$and": [{"$gt": ["$available_stock", 0]}, {"$lte": ["$available_stock", "$low_stock_threshold"]}]}

        total = await db["inventory"].count_documents(query)
        cursor = db["inventory"].find(query).sort("available_stock", 1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)

        items = []
        for doc in docs:
            normalized = normalize_mongo_doc(doc)
            avail = normalized.get("available_stock", 0)
            threshold = normalized.get("low_stock_threshold", 20)
            normalized["is_low_stock"] = 0 < avail <= threshold
            normalized["is_out_of_stock"] = avail <= 0
            items.append(normalized)

        return {"total": total, "items": items}

    @staticmethod
    async def get_movement_history(
        db: AsyncIOMotorDatabase, product_id: str, skip: int = 0, limit: int = 50
    ) -> Dict[str, Any]:
        """Fetch movement logs for a given product."""
        query = {"product_id": product_id}
        total = await db["inventory_logs"].count_documents(query)
        cursor = db["inventory_logs"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return {"total": total, "items": normalize_mongo_docs(docs)}
