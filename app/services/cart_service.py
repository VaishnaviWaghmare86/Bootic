"""Cart management service with MOQ validation and dynamic wholesale tier pricing."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import (
    BusinessRuleException,
    EntityNotFoundException,
    InsufficientStockException,
    ValidationException,
)
from app.models.enums import ProductStatus
from app.schemas.cart import CartItemAdd, CartItemResponse, CartItemUpdate, CartResponse
from app.services.pricing_service import PricingService
from app.utils.helpers import utc_now, normalize_mongo_doc


class CartService:
    @staticmethod
    async def get_or_create_cart(db: AsyncIOMotorDatabase, customer_id: str) -> Dict[str, Any]:
        """Fetch active cart for customer or create new if not present."""
        cart = await db["carts"].find_one({"customer_id": customer_id})
        if not cart:
            new_cart = {
                "customer_id": customer_id,
                "items": [],
                "updated_at": utc_now(),
            }
            res = await db["carts"].insert_one(new_cart)
            new_cart["_id"] = res.inserted_id
            return new_cart
        return cart

    @staticmethod
    async def get_cart_details(db: AsyncIOMotorDatabase, customer_id: str) -> CartResponse:
        """Fetch cart and compute real-time pricing and stock status for all items."""
        cart = await CartService.get_or_create_cart(db, customer_id)
        raw_items = cart.get("items", [])

        if not raw_items:
            return CartResponse(
                id=str(cart["_id"]),
                customer_id=customer_id,
                items=[],
                total_items_count=0,
                total_quantity=0,
                subtotal=0.0,
                estimated_tax=0.0,
                estimated_shipping=0.0,
                total_amount=0.0,
                updated_at=cart.get("updated_at", utc_now()),
            )

        product_ids = [item["product_id"] for item in raw_items]
        obj_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]

        products_cursor = db["products"].find({"$or": [{"_id": {"$in": obj_ids}}, {"_id": {"$in": product_ids}}]})
        products = await products_cursor.to_list(length=len(product_ids))
        prod_map = {str(p["_id"]): p for p in products}

        inv_cursor = db["inventory"].find({"product_id": {"$in": product_ids}})
        inv_list = await inv_cursor.to_list(length=len(product_ids))
        inv_map = {item["product_id"]: item for item in inv_list}

        enriched_items: List[CartItemResponse] = []
        subtotal = 0.0
        total_quantity = 0

        for item in raw_items:
            pid = item["product_id"]
            prod = prod_map.get(pid)
            inv = inv_map.get(pid, {})
            avail_stock = inv.get("available_stock", 0)

            if not prod:
                # Product no longer exists in catalog
                continue

            qty = item["quantity"]
            pricing_calc = PricingService.calculate_item_subtotal(prod, qty)
            effective_unit_price = pricing_calc["effective_unit_price"]
            item_subtotal = pricing_calc["subtotal"]

            is_available = (
                prod.get("status") == ProductStatus.ACTIVE.value
                and avail_stock >= qty
            )

            product_image = None
            if prod.get("product_images"):
                product_image = prod["product_images"][0]

            enriched_item = CartItemResponse(
                product_id=pid,
                sku=prod.get("sku", ""),
                product_name=prod.get("name", "Product"),
                product_image=product_image,
                quantity=qty,
                selected_size=item.get("selected_size"),
                selected_color=item.get("selected_color"),
                base_price=float(prod.get("wholesale_price", 0.0)),
                effective_unit_price=effective_unit_price,
                item_total=item_subtotal,
                minimum_order_quantity=prod.get("minimum_order_quantity", 5),
                is_available=is_available,
                available_stock=avail_stock,
            )
            enriched_items.append(enriched_item)
            subtotal += item_subtotal
            total_quantity += qty

        # Estimated wholesale GST (e.g. 5% standard apparel rate in India) & flat shipping estimation
        subtotal = round(subtotal, 2)
        estimated_tax = round(subtotal * 0.05, 2)
        estimated_shipping = 0.0 if subtotal >= 10000 or subtotal == 0 else 250.0
        total_amount = round(subtotal + estimated_tax + estimated_shipping, 2)

        return CartResponse(
            id=str(cart["_id"]),
            customer_id=customer_id,
            items=enriched_items,
            total_items_count=len(enriched_items),
            total_quantity=total_quantity,
            subtotal=subtotal,
            estimated_tax=estimated_tax,
            estimated_shipping=estimated_shipping,
            total_amount=total_amount,
            updated_at=cart.get("updated_at", utc_now()),
        )

    @staticmethod
    async def add_item(db: AsyncIOMotorDatabase, customer_id: str, item_in: CartItemAdd) -> CartResponse:
        """Add product to cart or update existing quantity with MOQ validation."""
        # 1. Validate product exists and active
        try:
            prod_id = ObjectId(item_in.product_id)
            prod = await db["products"].find_one({"_id": prod_id})
        except Exception:
            prod = await db["products"].find_one({"_id": item_in.product_id})

        if not prod:
            raise EntityNotFoundException("Product", item_in.product_id)

        if prod.get("status") != ProductStatus.ACTIVE.value:
            raise BusinessRuleException(
                f"Product '{prod.get('name')}' is currently {prod.get('status')} and cannot be ordered.",
                error_code="PRODUCT_INACTIVE"
            )

        # 2. Validate MOQ
        moq = prod.get("minimum_order_quantity", 1)
        if item_in.quantity < moq:
            raise BusinessRuleException(
                f"Minimum order quantity (MOQ) for '{prod.get('name')}' is {moq} pieces.",
                error_code="MOQ_NOT_MET"
            )

        # 3. Check stock availability
        inv = await db["inventory"].find_one({"product_id": item_in.product_id})
        avail = inv.get("available_stock", 0) if inv else 0
        if avail < item_in.quantity:
            raise InsufficientStockException(prod.get("name", "Product"), item_in.quantity, avail)

        # 4. Update cart document
        cart = await CartService.get_or_create_cart(db, customer_id)
        items = cart.get("items", [])

        # Check if item with same product_id, size, and color already exists
        existing_idx = -1
        for idx, it in enumerate(items):
            if (
                it.get("product_id") == item_in.product_id
                and it.get("selected_size") == item_in.selected_size
                and it.get("selected_color") == item_in.selected_color
            ):
                existing_idx = idx
                break

        if existing_idx >= 0:
            new_qty = items[existing_idx]["quantity"] + item_in.quantity
            if new_qty > avail:
                raise InsufficientStockException(prod.get("name", "Product"), new_qty, avail)
            items[existing_idx]["quantity"] = new_qty
        else:
            items.append({
                "product_id": item_in.product_id,
                "quantity": item_in.quantity,
                "selected_size": item_in.selected_size,
                "selected_color": item_in.selected_color,
            })

        await db["carts"].update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": items, "updated_at": utc_now()}}
        )

        return await CartService.get_cart_details(db, customer_id)

    @staticmethod
    async def update_item(
        db: AsyncIOMotorDatabase,
        customer_id: str,
        product_id: str,
        item_in: CartItemUpdate,
    ) -> CartResponse:
        """Update quantity or options of an existing cart item."""
        try:
            prod_id = ObjectId(product_id)
            prod = await db["products"].find_one({"_id": prod_id})
        except Exception:
            prod = await db["products"].find_one({"_id": product_id})

        if not prod:
            raise EntityNotFoundException("Product", product_id)

        moq = prod.get("minimum_order_quantity", 1)
        if item_in.quantity < moq:
            raise BusinessRuleException(
                f"Minimum order quantity (MOQ) for '{prod.get('name')}' is {moq} pieces.",
                error_code="MOQ_NOT_MET"
            )

        inv = await db["inventory"].find_one({"product_id": product_id})
        avail = inv.get("available_stock", 0) if inv else 0
        if avail < item_in.quantity:
            raise InsufficientStockException(prod.get("name", "Product"), item_in.quantity, avail)

        cart = await CartService.get_or_create_cart(db, customer_id)
        items = cart.get("items", [])

        found = False
        for item in items:
            if item.get("product_id") == product_id:
                item["quantity"] = item_in.quantity
                if item_in.selected_size is not None:
                    item["selected_size"] = item_in.selected_size
                if item_in.selected_color is not None:
                    item["selected_color"] = item_in.selected_color
                found = True
                break

        if not found:
            raise EntityNotFoundException("Cart item for product", product_id)

        await db["carts"].update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": items, "updated_at": utc_now()}}
        )
        return await CartService.get_cart_details(db, customer_id)

    @staticmethod
    async def remove_item(db: AsyncIOMotorDatabase, customer_id: str, product_id: str) -> CartResponse:
        """Remove product from cart."""
        cart = await CartService.get_or_create_cart(db, customer_id)
        items = [it for it in cart.get("items", []) if it.get("product_id") != product_id]

        await db["carts"].update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": items, "updated_at": utc_now()}}
        )
        return await CartService.get_cart_details(db, customer_id)

    @staticmethod
    async def clear_cart(db: AsyncIOMotorDatabase, customer_id: str) -> bool:
        """Empty the user's cart."""
        cart = await CartService.get_or_create_cart(db, customer_id)
        res = await db["carts"].update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": [], "updated_at": utc_now()}}
        )
        return res.modified_count > 0
