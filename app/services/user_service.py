"""User profile management service."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import EntityNotFoundException, ValidationException
from app.models.enums import UserRole, UserStatus
from app.schemas.user import UserProfileUpdate, UserStatusUpdate
from app.utils.helpers import utc_now, normalize_mongo_doc, normalize_mongo_docs


class UserService:
    @staticmethod
    async def get_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, Any]:
        """Fetch user by id string."""
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            raise EntityNotFoundException("User", user_id)

        user = await db["users"].find_one({"_id": obj_id})
        if not user:
            raise EntityNotFoundException("User", user_id)
        return normalize_mongo_doc(user)

    @staticmethod
    async def get_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[Dict[str, Any]]:
        """Fetch user by email."""
        user = await db["users"].find_one({"email": email.lower()})
        return normalize_mongo_doc(user) if user else None

    @staticmethod
    async def update_profile(
        db: AsyncIOMotorDatabase, user_id: str, profile_in: UserProfileUpdate
    ) -> Dict[str, Any]:
        """Update shopkeeper/user profile."""
        update_data = {k: v for k, v in profile_in.model_dump().items() if v is not None}
        if "business_type" in update_data and update_data["business_type"]:
            update_data["business_type"] = update_data["business_type"].value

        if not update_data:
            return await UserService.get_by_id(db, user_id)

        update_data["updated_at"] = utc_now()
        await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        return await UserService.get_by_id(db, user_id)

    @staticmethod
    async def update_status(
        db: AsyncIOMotorDatabase, user_id: str, status_in: UserStatusUpdate
    ) -> Dict[str, Any]:
        """Admin update of user status (ACTIVE, INACTIVE, BLOCKED)."""
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            raise EntityNotFoundException("User", user_id)

        update_fields = {
            "status": status_in.status.value,
            "status_reason": status_in.reason,
            "updated_at": utc_now(),
        }
        res = await db["users"].update_one({"_id": obj_id}, {"$set": update_fields})
        if res.matched_count == 0:
            raise EntityNotFoundException("User", user_id)
        return await UserService.get_by_id(db, user_id)

    @staticmethod
    async def list_shopkeepers(
        db: AsyncIOMotorDatabase,
        search: Optional[str] = None,
        city: Optional[str] = None,
        status: Optional[UserStatus] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """Admin list of shopkeepers with filters."""
        query: Dict[str, Any] = {"role": UserRole.SHOPKEEPER.value}
        if city:
            query["city"] = {"$regex": f"^{city}$", "$options": "i"}
        if status:
            query["status"] = status.value
        if search:
            query["$or"] = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"business_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"mobile": {"$regex": search, "$options": "i"}},
                {"city": {"$regex": search, "$options": "i"}},
            ]

        total = await db["users"].count_documents(query)
        cursor = db["users"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return {"total": total, "items": normalize_mongo_docs(docs)}
