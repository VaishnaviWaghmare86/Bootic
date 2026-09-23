"""Product management service with catalog search, filtering, and stock synchronization."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import (
    DuplicateEntityException,
    EntityNotFoundException,
    ValidationException,
)
from app.models.enums import InventoryAction, ProductStatus
from app.schemas.product import ProductCreate, ProductFilterParams, ProductUpdate
from app.utils.helpers import (
    generate_sku,
    utc_now,
    normalize_mongo_doc,
    normalize_mongo_docs,
)


class ProductService:
    @staticmethod
    async def create_product(
        db: AsyncIOMotorDatabase, prod_in: ProductCreate, created_by_user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new wholesale product and initialize its inventory."""
        # Verify category exists
        try:
            cat_obj_id = ObjectId(prod_in.category_id)
            cat = await db["categories"].find_one({"_id": cat_obj_id})
        except Exception:
            cat = await db["categories"].find_one({"_id": prod_in.category_id})

        if not cat:
            raise EntityNotFoundException("Category", prod_in.category_id)

        category_name = cat.get("name", "Clothing")

        # Generate or check SKU
        sku = prod_in.sku
        if not sku:
            prefix = category_name[:3].upper() if category_name else "PRD"
            sku = generate_sku(prefix)
        else:
            sku = sku.strip().upper()
            existing_sku = await db["products"].find_one({"sku": sku})
            if existing_sku:
                raise DuplicateEntityException("Product", "SKU", sku)

        opening_stock = prod_in.opening_stock

        prod_doc = {
            "name": prod_in.name.strip(),
            "sku": sku,
            "description": prod_in.description,
            "category_id": prod_in.category_id,
            "category_name": category_name,
            "subcategory": prod_in.subcategory,
            "brand": prod_in.brand,
            "fabric": prod_in.fabric,
            "color": prod_in.color,
            "available_sizes": prod_in.available_sizes,
            "pattern": prod_in.pattern,
            "gender": prod_in.gender.value,
            "product_images": prod_in.product_images,
            "wholesale_price": float(prod_in.wholesale_price),
            "tier_prices": [t.model_dump() for t in prod_in.tier_prices],
            "minimum_order_quantity": prod_in.minimum_order_quantity,
            "low_stock_threshold": prod_in.low_stock_threshold,
            "status": prod_in.status.value,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }

        result = await db["products"].insert_one(prod_doc)
        product_id = str(result.inserted_id)
        prod_doc["_id"] = result.inserted_id

        # Initialize inventory document
        inv_doc = {
            "product_id": product_id,
            "sku": sku,
            "product_name": prod_doc["name"],
            "total_stock": opening_stock,
            "reserved_stock": 0,
            "available_stock": opening_stock,
            "low_stock_threshold": prod_in.low_stock_threshold,
            "last_updated": utc_now(),
        }
        await db["inventory"].insert_one(inv_doc)

        if opening_stock > 0:
            await db["inventory_logs"].insert_one({
                "product_id": product_id,
                "sku": sku,
                "product_name": prod_doc["name"],
                "action": InventoryAction.STOCK_IN.value,
                "quantity_change": opening_stock,
                "previous_available": 0,
                "new_available": opening_stock,
                "previous_reserved": 0,
                "new_reserved": 0,
                "performed_by": created_by_user.get("email", "admin"),
                "notes": "Initial opening stock",
                "created_at": utc_now(),
            })

        normalized = normalize_mongo_doc(prod_doc)
        normalized["available_quantity"] = opening_stock
        normalized["reserved_quantity"] = 0
        normalized["current_quantity"] = opening_stock
        return normalized

    @staticmethod
    async def get_by_id(db: AsyncIOMotorDatabase, product_id: str) -> Dict[str, Any]:
        """Fetch product with real-time stock levels."""
        try:
            obj_id = ObjectId(product_id)
            prod = await db["products"].find_one({"_id": obj_id})
        except Exception:
            prod = await db["products"].find_one({"_id": product_id})

        if not prod:
            raise EntityNotFoundException("Product", product_id)

        # Merge inventory
        inv = await db["inventory"].find_one({"product_id": str(prod["_id"])})
        normalized = normalize_mongo_doc(prod)
        if inv:
            normalized["available_quantity"] = inv.get("available_stock", 0)
            normalized["reserved_quantity"] = inv.get("reserved_stock", 0)
            normalized["current_quantity"] = inv.get("total_stock", 0)
        else:
            normalized["available_quantity"] = 0
            normalized["reserved_quantity"] = 0
            normalized["current_quantity"] = 0
        return normalized

    @staticmethod
    async def update_product(
        db: AsyncIOMotorDatabase, product_id: str, prod_in: ProductUpdate
    ) -> Dict[str, Any]:
        """Update product details."""
        try:
            obj_id = ObjectId(product_id)
        except Exception:
            raise EntityNotFoundException("Product", product_id)

        update_data = {k: v for k, v in prod_in.model_dump().items() if v is not None}
        if not update_data:
            return await ProductService.get_by_id(db, product_id)

        if "gender" in update_data and update_data["gender"]:
            update_data["gender"] = update_data["gender"].value
        if "status" in update_data and update_data["status"]:
            update_data["status"] = update_data["status"].value
        if "category_id" in update_data:
            try:
                cat = await db["categories"].find_one({"_id": ObjectId(update_data["category_id"])})
                if cat:
                    update_data["category_name"] = cat.get("name")
            except Exception:
                pass

        update_data["updated_at"] = utc_now()
        res = await db["products"].update_one({"_id": obj_id}, {"$set": update_data})
        if res.matched_count == 0:
            raise EntityNotFoundException("Product", product_id)

        if "name" in update_data:
            await db["inventory"].update_one(
                {"product_id": product_id},
                {"$set": {"product_name": update_data["name"]}}
            )

        return await ProductService.get_by_id(db, product_id)

    @staticmethod
    async def delete_product(db: AsyncIOMotorDatabase, product_id: str) -> bool:
        """Soft delete product by setting status to DISCONTINUED."""
        try:
            obj_id = ObjectId(product_id)
        except Exception:
            raise EntityNotFoundException("Product", product_id)

        res = await db["products"].update_one(
            {"_id": obj_id},
            {"$set": {"status": ProductStatus.DISCONTINUED.value, "updated_at": utc_now()}}
        )
        return res.modified_count > 0

    @staticmethod
    async def list_products(
        db: AsyncIOMotorDatabase, params: ProductFilterParams, is_admin: bool = False
    ) -> Dict[str, Any]:
        """Search and filter catalog with pagination and stock enrichment."""
        query: Dict[str, Any] = {}

        # Visibility filter
        if not is_admin:
            query["status"] = {"$in": [ProductStatus.ACTIVE.value, ProductStatus.OUT_OF_STOCK.value]}
        elif params.status:
            query["status"] = params.status.value

        if params.category_id:
            query["category_id"] = params.category_id
        if params.subcategory:
            query["subcategory"] = {"$regex": f"^{params.subcategory}$", "$options": "i"}
        if params.gender:
            query["gender"] = params.gender.value
        if params.fabric:
            query["fabric"] = {"$regex": params.fabric, "$options": "i"}
        if params.color:
            query["color"] = {"$regex": params.color, "$options": "i"}
        if params.size:
            query["available_sizes"] = params.size.upper()

        if params.min_price is not None or params.max_price is not None:
            price_query: Dict[str, Any] = {}
            if params.min_price is not None:
                price_query["$gte"] = float(params.min_price)
            if params.max_price is not None:
                price_query["$lte"] = float(params.max_price)
            query["wholesale_price"] = price_query

        if params.search:
            search_regex = {"$regex": params.search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"description": search_regex},
                {"sku": search_regex},
                {"category_name": search_regex},
                {"fabric": search_regex},
                {"color": search_regex},
                {"brand": search_regex},
            ]

        # Sorting
        sort_field = "created_at"
        sort_order = -1
        if params.sort_by == "price_low_to_high":
            sort_field = "wholesale_price"
            sort_order = 1
        elif params.sort_by == "price_high_to_low":
            sort_field = "wholesale_price"
            sort_order = -1
        elif params.sort_by == "newest":
            sort_field = "created_at"
            sort_order = -1

        skip = (params.page - 1) * params.limit
        total = await db["products"].count_documents(query)

        cursor = db["products"].find(query).sort(sort_field, sort_order).skip(skip).limit(params.limit)
        docs = await cursor.to_list(length=params.limit)

        # Enrich with inventory
        product_ids = [str(d["_id"]) for d in docs]
        inv_cursor = db["inventory"].find({"product_id": {"$in": product_ids}})
        inv_list = await inv_cursor.to_list(length=len(product_ids))
        inv_map = {item["product_id"]: item for item in inv_list}

        enriched_items = []
        for doc in docs:
            normalized = normalize_mongo_doc(doc)
            inv = inv_map.get(str(doc["_id"]), {})
            avail = inv.get("available_stock", 0)
            normalized["available_quantity"] = avail
            normalized["reserved_quantity"] = inv.get("reserved_stock", 0)
            normalized["current_quantity"] = inv.get("total_stock", 0)

            # Filter out in_stock_only if requested
            if params.in_stock_only and avail <= 0:
                continue
            enriched_items.append(normalized)

        return {
            "total": total,
            "items": enriched_items,
        }
