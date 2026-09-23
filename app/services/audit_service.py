"""Audit service for tracking important administrative and business events."""

from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.utils.helpers import utc_now, normalize_mongo_doc, normalize_mongo_docs
from app.schemas.audit import AuditLogResponse


class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncIOMotorDatabase,
        user_id: str,
        user_email: str,
        user_role: str,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """Create an audit log record."""
        log_entry = {
            "user_id": user_id,
            "user_email": user_email,
            "user_role": user_role,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {},
            "ip_address": ip_address,
            "created_at": utc_now(),
        }
        await db["audit_logs"].insert_one(log_entry)

    @staticmethod
    async def get_logs(
        db: AsyncIOMotorDatabase,
        skip: int = 0,
        limit: int = 50,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Fetch paginated audit logs."""
        query: Dict[str, Any] = {}
        if action:
            query["action"] = action
        if entity_type:
            query["entity_type"] = entity_type

        total = await db["audit_logs"].count_documents(query)
        cursor = db["audit_logs"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return {"total": total, "items": normalize_mongo_docs(docs)}
