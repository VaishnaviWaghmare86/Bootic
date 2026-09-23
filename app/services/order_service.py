"""Order lifecycle management service with atomic inventory reservation and historic price freezing."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import (
    BusinessRuleException,
    EntityNotFoundException,
    InsufficientStockException,
    ValidationException,
)
from app.models.enums import NotificationType, OrderStatus, PaymentMethod, PaymentStatus, ProductStatus
from app.schemas.address import AddressBase
from app.schemas.order import (
    OrderCreateDirect,
    OrderCreateFromCart,
    OrderItemSnapshot,
    OrderStatusUpdate,
)
from app.services.address_service import AddressService
from app.services.audit_service import AuditService
from app.services.inventory_service import InventoryService
from app.services.notification_service import NotificationService
from app.services.pricing_service import PricingService
from app.utils.helpers import (
    generate_order_number,
    utc_now,
    normalize_mongo_doc,
    normalize_mongo_docs,
)


class OrderService:
    @staticmethod
    async def create_order_from_cart(
        db: AsyncIOMotorDatabase, customer_id: str, req: OrderCreateFromCart, user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create order directly from user's current shopping cart."""
        cart = await db["carts"].find_one({"customer_id": customer_id})
        items = cart.get("items", []) if cart else []

        if not items:
            raise BusinessRuleException("Your cart is empty. Please add items to cart before placing an order.", error_code="EMPTY_CART")

        # Resolve shipping address
        shipping_addr_dict = await OrderService._resolve_shipping_address(db, customer_id, req.shipping_address_id, req.shipping_address)

        return await OrderService._process_and_create_order(
            db=db,
            customer_id=customer_id,
            user=user,
            raw_items=items,
            shipping_address=shipping_addr_dict,
            payment_method=req.payment_method,
            notes=req.notes,
            is_from_cart=True,
        )

    @staticmethod
    async def create_order_direct(
        db: AsyncIOMotorDatabase, customer_id: str, req: OrderCreateDirect, user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create order directly with specified items list."""
        raw_items = [item.model_dump() for item in req.items]
        if not raw_items:
            raise ValidationException("Order must contain at least one item.")

        shipping_addr_dict = await OrderService._resolve_shipping_address(db, customer_id, req.shipping_address_id, req.shipping_address)

        return await OrderService._process_and_create_order(
            db=db,
            customer_id=customer_id,
            user=user,
            raw_items=raw_items,
            shipping_address=shipping_addr_dict,
            payment_method=req.payment_method,
            notes=req.notes,
            is_from_cart=False,
        )

    @staticmethod
    async def _resolve_shipping_address(
        db: AsyncIOMotorDatabase,
        customer_id: str,
        address_id: Optional[str],
        address_payload: Optional[AddressBase],
    ) -> Dict[str, Any]:
        """Helper to resolve and validate shipping address."""
        if address_payload:
            return address_payload.model_dump()

        if address_id:
            addr = await AddressService.get_by_id(db, address_id, customer_id)
            return addr

        # Look for default address
        default_addr = await db["addresses"].find_one({"customer_id": customer_id, "is_default": True})
        if default_addr:
            return normalize_mongo_doc(default_addr)

        # Look for any address
        any_addr = await db["addresses"].find_one({"customer_id": customer_id})
        if any_addr:
            return normalize_mongo_doc(any_addr)

        # Fall back to user business address if saved in profile
        user_doc = await db["users"].find_one({"_id": ObjectId(customer_id) if ObjectId.is_valid(customer_id) else customer_id})
        if user_doc and user_doc.get("business_address"):
            return {
                "contact_person": user_doc.get("full_name", "Shopkeeper"),
                "business_name": user_doc.get("business_name"),
                "phone": user_doc.get("mobile", "9999999999"),
                "address_line1": user_doc.get("business_address"),
                "city": user_doc.get("city", "Mumbai"),
                "state": user_doc.get("state", "Maharashtra"),
                "pincode": user_doc.get("pincode", "400001"),
                "is_default": True,
            }

        raise BusinessRuleException("Please provide or select a valid delivery address for your order.", error_code="ADDRESS_REQUIRED")

    @staticmethod
    async def _process_and_create_order(
        db: AsyncIOMotorDatabase,
        customer_id: str,
        user: Dict[str, Any],
        raw_items: List[Dict[str, Any]],
        shipping_address: Dict[str, Any],
        payment_method: PaymentMethod,
        notes: Optional[str] = None,
        is_from_cart: bool = False,
    ) -> Dict[str, Any]:
        """Validate stock, snapshot prices, reserve inventory atomically, and create order."""
        product_ids = [item["product_id"] for item in raw_items]
        obj_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]

        products_cursor = db["products"].find({"$or": [{"_id": {"$in": obj_ids}}, {"_id": {"$in": product_ids}}]})
        products = await products_cursor.to_list(length=len(product_ids))
        prod_map = {str(p["_id"]): p for p in products}

        order_number = generate_order_number()
        order_item_snapshots: List[Dict[str, Any]] = []
        subtotal = 0.0

        # Step 1: Pre-validation of products, MOQ, and availability
        for item in raw_items:
            pid = item["product_id"]
            prod = prod_map.get(pid)
            if not prod:
                raise EntityNotFoundException("Product", pid)

            if prod.get("status") != ProductStatus.ACTIVE.value:
                raise BusinessRuleException(
                    f"Product '{prod.get('name')}' is {prod.get('status')} and cannot be ordered.",
                    error_code="PRODUCT_INACTIVE"
                )

            qty = int(item["quantity"])
            moq = prod.get("minimum_order_quantity", 1)
            if qty < moq:
                raise BusinessRuleException(
                    f"Minimum order quantity for '{prod.get('name')}' is {moq} pieces.",
                    error_code="MOQ_NOT_MET"
                )

            pricing = PricingService.calculate_item_subtotal(prod, qty)
            effective_unit_price = pricing["effective_unit_price"]
            item_subtotal = pricing["subtotal"]
            discount = pricing["discount"]

            product_img = prod.get("product_images", [None])[0] if prod.get("product_images") else None

            snapshot = {
                "product_id": pid,
                "sku": prod.get("sku", ""),
                "product_name": prod.get("name", "Product"),
                "product_image": product_img,
                "quantity": qty,
                "selected_size": item.get("selected_size"),
                "selected_color": item.get("selected_color"),
                "unit_price": effective_unit_price,
                "discount": discount,
                "subtotal": item_subtotal,
            }
            order_item_snapshots.append(snapshot)
            subtotal += item_subtotal

        # Step 2: Atomic Inventory Reservation (Rolls back if any item fails)
        reserved_items: List[Dict[str, Any]] = []
        try:
            for item in order_item_snapshots:
                await InventoryService.reserve_stock_for_order(
                    db=db,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    order_number=order_number,
                    performed_by=user.get("email", "customer"),
                )
                reserved_items.append(item)
        except Exception as reserve_err:
            # Rollback reserved items
            for rollback_item in reserved_items:
                await InventoryService.release_reserved_stock(
                    db=db,
                    product_id=rollback_item["product_id"],
                    quantity=rollback_item["quantity"],
                    order_number=order_number,
                    performed_by="system-rollback",
                )
            raise reserve_err

        # Step 3: Compute Taxes & Total
        subtotal = round(subtotal, 2)
        tax = round(subtotal * 0.05, 2)  # Standard 5% B2B apparel tax
        shipping_charge = 0.0 if subtotal >= 10000 else 250.0
        total_amount = round(subtotal + tax + shipping_charge, 2)

        order_doc = {
            "order_number": order_number,
            "customer_id": customer_id,
            "customer_name": user.get("full_name"),
            "customer_business_name": user.get("business_name"),
            "customer_city": user.get("city"),
            "customer_mobile": user.get("mobile"),
            "items": order_item_snapshots,
            "subtotal": subtotal,
            "discount": 0.0,
            "tax": tax,
            "shipping_charge": shipping_charge,
            "total_amount": total_amount,
            "shipping_address": shipping_address,
            "payment_method": payment_method.value if hasattr(payment_method, "value") else str(payment_method),
            "payment_status": PaymentStatus.PENDING.value,
            "order_status": OrderStatus.ORDER_PLACED.value,
            "courier_name": None,
            "tracking_number": None,
            "expected_delivery_date": None,
            "notes": notes,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }

        res = await db["orders"].insert_one(order_doc)
        order_id = str(res.inserted_id)
        order_doc["_id"] = res.inserted_id

        # Step 4: Clear cart if created from cart
        if is_from_cart:
            await db["carts"].update_one(
                {"customer_id": customer_id},
                {"$set": {"items": [], "updated_at": utc_now()}}
            )

        # Step 5: Notifications
        await NotificationService.send_notification(
            db=db,
            user_id=customer_id,
            title="Order Placed Successfully",
            message=f"Your wholesale order {order_number} for ₹{total_amount:,.2f} has been placed.",
            notification_type=NotificationType.NEW_ORDER,
            reference_id=order_id,
        )

        await NotificationService.notify_all_admins(
            db=db,
            title=f"New Wholesale Order: {order_number}",
            message=f"Shopkeeper {user.get('business_name', user.get('full_name'))} ({user.get('city')}) placed order {order_number} for ₹{total_amount:,.2f}.",
            notification_type=NotificationType.NEW_ORDER,
            reference_id=order_id,
        )

        return normalize_mongo_doc(order_doc)

    @staticmethod
    async def get_by_id(db: AsyncIOMotorDatabase, order_id: str, customer_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetch order by ID, optionally restricted to customer."""
        try:
            obj_id = ObjectId(order_id)
            query: Dict[str, Any] = {"_id": obj_id}
        except Exception:
            query = {"order_number": order_id}

        if customer_id:
            query["customer_id"] = customer_id

        order = await db["orders"].find_one(query)
        if not order:
            raise EntityNotFoundException("Order", order_id)
        return normalize_mongo_doc(order)

    @staticmethod
    async def list_orders(
        db: AsyncIOMotorDatabase,
        customer_id: Optional[str] = None,
        status: Optional[OrderStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """List orders with pagination and filtering."""
        query: Dict[str, Any] = {}
        if customer_id:
            query["customer_id"] = customer_id
        if status:
            query["order_status"] = status.value
        if search:
            query["$or"] = [
                {"order_number": {"$regex": search, "$options": "i"}},
                {"customer_name": {"$regex": search, "$options": "i"}},
                {"customer_business_name": {"$regex": search, "$options": "i"}},
                {"customer_city": {"$regex": search, "$options": "i"}},
                {"customer_mobile": {"$regex": search, "$options": "i"}},
            ]

        total = await db["orders"].count_documents(query)
        cursor = db["orders"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return {"total": total, "items": normalize_mongo_docs(docs)}

    @staticmethod
    async def update_order_status(
        db: AsyncIOMotorDatabase,
        order_id: str,
        update_in: OrderStatusUpdate,
        admin_user: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Admin transition order status and handle inventory reservations/releases."""
        order = await OrderService.get_by_id(db, order_id)
        current_status = order.get("order_status")
        new_status = update_in.order_status.value
        order_number = order.get("order_number")
        customer_id = order.get("customer_id")

        # Rule 10: Delivered orders cannot normally be cancelled
        if current_status == OrderStatus.DELIVERED.value and new_status in [OrderStatus.CANCELLED.value, OrderStatus.REJECTED.value]:
            raise BusinessRuleException("A delivered order cannot be cancelled directly.", error_code="DELIVERED_ORDER_CANCELLATION_PROHIBITED")

        # If transitioning from active/reserved state to CANCELLED/REJECTED, release reserved stock
        if (
            current_status not in [OrderStatus.CANCELLED.value, OrderStatus.REJECTED.value, OrderStatus.DELIVERED.value]
            and new_status in [OrderStatus.CANCELLED.value, OrderStatus.REJECTED.value]
        ):
            for item in order.get("items", []):
                await InventoryService.release_reserved_stock(
                    db=db,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    order_number=order_number,
                    performed_by=admin_user.get("email", "admin"),
                )

        # If transitioning to DELIVERED, fulfill reserved stock
        if (
            current_status != OrderStatus.DELIVERED.value
            and new_status == OrderStatus.DELIVERED.value
        ):
            for item in order.get("items", []):
                await InventoryService.fulfill_reserved_stock(
                    db=db,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    order_number=order_number,
                    performed_by=admin_user.get("email", "admin"),
                )

        update_fields: Dict[str, Any] = {
            "order_status": new_status,
            "updated_at": utc_now(),
        }
        if update_in.payment_status:
            update_fields["payment_status"] = update_in.payment_status.value
        if update_in.courier_name is not None:
            update_fields["courier_name"] = update_in.courier_name
        if update_in.tracking_number is not None:
            update_fields["tracking_number"] = update_in.tracking_number
        if update_in.expected_delivery_date is not None:
            update_fields["expected_delivery_date"] = update_in.expected_delivery_date
        if update_in.notes:
            update_fields["notes"] = update_in.notes

        try:
            obj_id = ObjectId(order["id"])
            await db["orders"].update_one({"_id": obj_id}, {"$set": update_fields})
        except Exception:
            await db["orders"].update_one({"order_number": order_number}, {"$set": update_fields})

        # Notification for customer
        notif_type = NotificationType.ORDER_STATUS
        if new_status == OrderStatus.CONFIRMED.value:
            notif_type = NotificationType.ORDER_CONFIRMED
        elif new_status == OrderStatus.SHIPPED.value:
            notif_type = NotificationType.ORDER_SHIPPED
        elif new_status == OrderStatus.DELIVERED.value:
            notif_type = NotificationType.ORDER_DELIVERED
        elif new_status == OrderStatus.CANCELLED.value:
            notif_type = NotificationType.ORDER_CANCELLED

        await NotificationService.send_notification(
            db=db,
            user_id=customer_id,
            title=f"Order Update: {order_number}",
            message=f"Your order {order_number} status is now {new_status}.",
            notification_type=notif_type,
            reference_id=str(order["id"]),
        )

        # Audit log
        await AuditService.log_action(
            db=db,
            user_id=admin_user.get("id", "admin"),
            user_email=admin_user.get("email", "admin"),
            user_role=admin_user.get("role", "ADMIN"),
            action="UPDATE_ORDER_STATUS",
            entity_type="ORDER",
            entity_id=str(order["id"]),
            details={"previous_status": current_status, "new_status": new_status, "order_number": order_number},
        )

        return await OrderService.get_by_id(db, str(order["id"]))

    @staticmethod
    async def cancel_customer_order(
        db: AsyncIOMotorDatabase, order_id: str, customer_id: str, user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Allow customer to cancel their order if it hasn't entered processing/shipping yet."""
        order = await OrderService.get_by_id(db, order_id, customer_id)
        current_status = order.get("order_status")

        if current_status not in [OrderStatus.ORDER_PLACED.value, OrderStatus.PENDING_CONFIRMATION.value]:
            raise BusinessRuleException(
                f"Order {order.get('order_number')} is currently '{current_status}' and cannot be cancelled online. Please contact admin.",
                error_code="ORDER_NOT_CANCELLABLE"
            )

        order_number = order.get("order_number")
        for item in order.get("items", []):
            await InventoryService.release_reserved_stock(
                db=db,
                product_id=item["product_id"],
                quantity=item["quantity"],
                order_number=order_number,
                performed_by=user.get("email", "customer"),
            )

        try:
            obj_id = ObjectId(order["id"])
            await db["orders"].update_one(
                {"_id": obj_id},
                {"$set": {"order_status": OrderStatus.CANCELLED.value, "updated_at": utc_now()}}
            )
        except Exception:
            await db["orders"].update_one(
                {"order_number": order_number},
                {"$set": {"order_status": OrderStatus.CANCELLED.value, "updated_at": utc_now()}}
            )

        await NotificationService.notify_all_admins(
            db=db,
            title=f"Order Cancelled: {order_number}",
            message=f"Shopkeeper {user.get('business_name', user.get('full_name'))} cancelled order {order_number}.",
            notification_type=NotificationType.ORDER_CANCELLED,
            reference_id=str(order["id"]),
        )

        return await OrderService.get_by_id(db, str(order["id"]))
