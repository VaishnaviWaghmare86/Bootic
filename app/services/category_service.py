"""Category service for product classifications."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import DuplicateEntityException, EntityNotFoundException
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.utils.helpers import slugify, utc_now, normalize_mongo_doc, normalize_mongo_docs


class CategoryService:
    @staticmethod
    async def create_category(db: AsyncIOMotorDatabase, cat_in: CategoryCreate) -> Dict[str, Any]:
        """Create a new product category."""
        existing = await db["categories"].find_one({"name": {"$regex": f"^{cat_in.name}$", "$options": "i"}})
        if existing:
            raise DuplicateEntityException("Category", "name", cat_in.name)

        slug = slugify(cat_in.name)
        doc = {
            "name": cat_in.name.strip(),
            "slug": slug,
            "description": cat_in.description,
            "image_url": cat_in.image_url,
            "is_active": cat_in.is_active,
            "display_order": cat_in.display_order,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }
        res = await db["categories"].insert_one(doc)
        doc["_id"] = res.inserted_id
        return normalize_mongo_doc(doc)

    @staticmethod
    async def get_by_id(db: AsyncIOMotorDatabase, category_id: str) -> Dict[str, Any]:
        """Get category by ID."""
        try:
            obj_id = ObjectId(category_id)
        except Exception:
            raise EntityNotFoundException("Category", category_id)

        cat = await db["categories"].find_one({"_id": obj_id})
        if not cat:
            raise EntityNotFoundException("Category", category_id)
        return normalize_mongo_doc(cat)

    @staticmethod
    async def update_category(
        db: AsyncIOMotorDatabase, category_id: str, cat_in: CategoryUpdate
    ) -> Dict[str, Any]:
        """Update category."""
        try:
            obj_id = ObjectId(category_id)
        except Exception:
            raise EntityNotFoundException("Category", category_id)

        update_data = {k: v for k, v in cat_in.model_dump().items() if v is not None}
        if not update_data:
            return await CategoryService.get_by_id(db, category_id)

        if "name" in update_data:
            existing = await db["categories"].find_one({
                "name": {"$regex": f"^{update_data['name']}$", "$options": "i"},
                "_id": {"$ne": obj_id}
            })
            if existing:
                raise DuplicateEntityException("Category", "name", update_data["name"])
            update_data["slug"] = slugify(update_data["name"])

        update_data["updated_at"] = utc_now()
        res = await db["categories"].update_one({"_id": obj_id}, {"$set": update_data})
        if res.matched_count == 0:
            raise EntityNotFoundException("Category", category_id)
        return await CategoryService.get_by_id(db, category_id)

    @staticmethod
    async def delete_category(db: AsyncIOMotorDatabase, category_id: str) -> bool:
        """Delete category if no products linked."""
        try:
            obj_id = ObjectId(category_id)
        except Exception:
            raise EntityNotFoundException("Category", category_id)

        # Check if products exist in category
        prod_count = await db["products"].count_documents({"category_id": category_id})
        if prod_count > 0:
            # Soft delete
            await db["categories"].update_one({"_id": obj_id}, {"$set": {"is_active": False, "updated_at": utc_now()}})
            return True

        res = await db["categories"].delete_one({"_id": obj_id})
        return res.deleted_count > 0

    @staticmethod
    async def list_categories(
        db: AsyncIOMotorDatabase, active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """List all categories ordered by display_order."""
        query = {"is_active": True} if active_only else {}
        cursor = db["categories"].find(query).sort("display_order", 1)
        docs = await cursor.to_list(length=100)
        return normalize_mongo_docs(docs)
