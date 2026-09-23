"""Notification service for user alerts and admin updates."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.enums import NotificationType, UserRole
from app.utils.helpers import utc_now, normalize_mongo_doc, normalize_mongo_docs


class NotificationService:
    @staticmethod
    async def send_notification(
        db: AsyncIOMotorDatabase,
        user_id: str,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        reference_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a user notification document."""
        doc = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type.value if hasattr(notification_type, "value") else str(notification_type),
            "reference_id": reference_id,
            "is_read": False,
            "created_at": utc_now(),
        }
        result = await db["notifications"].insert_one(doc)
        doc["_id"] = result.inserted_id
        return normalize_mongo_doc(doc)

    @staticmethod
    async def notify_all_admins(
        db: AsyncIOMotorDatabase,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.NEW_ORDER,
        reference_id: Optional[str] = None,
    ) -> None:
        """Broadcast a notification to all ADMIN and SUPER_ADMIN users."""
        admins_cursor = db["users"].find({"role": {"$in": [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]}})
        admins = await admins_cursor.to_list(length=100)
        now = utc_now()
        docs = [
            {
                "user_id": str(admin["_id"]),
                "title": title,
                "message": message,
                "type": notification_type.value if hasattr(notification_type, "value") else str(notification_type),
                "reference_id": reference_id,
                "is_read": False,
                "created_at": now,
            }
            for admin in admins
        ]
        if docs:
            await db["notifications"].insert_many(docs)

    @staticmethod
    async def get_user_notifications(
        db: AsyncIOMotorDatabase,
        user_id: str,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """Get paginated notifications for a user."""
        query: Dict[str, Any] = {"user_id": user_id}
        if unread_only:
            query["is_read"] = False

        total = await db["notifications"].count_documents(query)
        unread_count = await db["notifications"].count_documents({"user_id": user_id, "is_read": False})
        cursor = db["notifications"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return {
            "total": total,
            "unread_count": unread_count,
            "items": normalize_mongo_docs(docs),
        }

    @staticmethod
    async def mark_as_read(db: AsyncIOMotorDatabase, notification_id: str, user_id: str) -> bool:
        """Mark a single notification as read."""
        try:
            obj_id = ObjectId(notification_id)
        except Exception:
            return False
        result = await db["notifications"].update_one(
            {"_id": obj_id, "user_id": user_id},
            {"$set": {"is_read": True, "read_at": utc_now()}}
        )
        return result.modified_count > 0

    @staticmethod
    async def mark_all_as_read(db: AsyncIOMotorDatabase, user_id: str) -> int:
        """Mark all notifications of a user as read."""
        result = await db["notifications"].update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True, "read_at": utc_now()}}
        )
        return result.modified_count
