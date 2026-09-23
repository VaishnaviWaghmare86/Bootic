"""Shopkeeper custom bulk requirements and quote fulfillment service."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import EntityNotFoundException, ValidationException
from app.models.enums import NotificationType, RequirementStatus
from app.schemas.requirement import (
    RequirementAdminQuote,
    RequirementCreate,
    RequirementStatusUpdate,
)
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.utils.helpers import utc_now, normalize_mongo_doc, normalize_mongo_docs


class RequirementService:
    @staticmethod
    async def create_requirement(
        db: AsyncIOMotorDatabase, customer_id: str, req_in: RequirementCreate, user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Shopkeeper submits a custom bulk requirement."""
        doc = {
            "customer_id": customer_id,
            "customer_name": user.get("full_name"),
            "customer_business_name": user.get("business_name"),
            "customer_mobile": user.get("mobile"),
            "customer_city": user.get("city"),
            "product_category": req_in.product_category.strip(),
            "product_title": req_in.product_title.strip() if req_in.product_title else None,
            "quantity": req_in.quantity,
            "preferred_colors": req_in.preferred_colors,
            "preferred_sizes": req_in.preferred_sizes,
            "target_budget": req_in.target_budget,
            "delivery_city": req_in.delivery_city.strip(),
            "delivery_state": req_in.delivery_state,
            "needed_by_date": req_in.needed_by_date,
            "notes": req_in.notes,
            "status": RequirementStatus.PENDING.value,
            "quote": None,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }

        res = await db["requirements"].insert_one(doc)
        req_id = str(res.inserted_id)
        doc["_id"] = res.inserted_id

        # Notify admins
        await NotificationService.notify_all_admins(
            db=db,
            title="New Bulk Requirement Submitted",
            message=f"{user.get('business_name', 'Shopkeeper')} in {req_in.delivery_city} requested {req_in.quantity} units of {req_in.product_category}.",
            notification_type=NotificationType.REQUIREMENT_UPDATE,
            reference_id=req_id,
        )

        return normalize_mongo_doc(doc)

    @staticmethod
    async def get_by_id(
        db: AsyncIOMotorDatabase, requirement_id: str, customer_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get requirement details."""
        try:
            obj_id = ObjectId(requirement_id)
        except Exception:
            raise EntityNotFoundException("Requirement", requirement_id)

        query: Dict[str, Any] = {"_id": obj_id}
        if customer_id:
            query["customer_id"] = customer_id

        req = await db["requirements"].find_one(query)
        if not req:
            raise EntityNotFoundException("Requirement", requirement_id)
        return normalize_mongo_doc(req)

    @staticmethod
    async def list_requirements(
        db: AsyncIOMotorDatabase,
        customer_id: Optional[str] = None,
        status: Optional[RequirementStatus] = None,
        city: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """List requirements with filters and pagination."""
        query: Dict[str, Any] = {}
        if customer_id:
            query["customer_id"] = customer_id
        if status:
            query["status"] = status.value
        if city:
            query["delivery_city"] = {"$regex": city, "$options": "i"}

        total = await db["requirements"].count_documents(query)
        cursor = db["requirements"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return {"total": total, "items": normalize_mongo_docs(docs)}

    @staticmethod
    async def update_status_and_quote(
        db: AsyncIOMotorDatabase,
        requirement_id: str,
        update_in: RequirementStatusUpdate,
        admin_user: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Admin updates requirement status and provides wholesale quotation."""
        req = await RequirementService.get_by_id(db, requirement_id)
        obj_id = ObjectId(req["id"])

        update_fields: Dict[str, Any] = {
            "status": update_in.status.value,
            "updated_at": utc_now(),
        }

        if update_in.quote:
            update_fields["quote"] = update_in.quote.model_dump()
        if update_in.admin_notes:
            update_fields["admin_notes"] = update_in.admin_notes

        await db["requirements"].update_one({"_id": obj_id}, {"$set": update_fields})

        # Send notification to shopkeeper
        await NotificationService.send_notification(
            db=db,
            user_id=req["customer_id"],
            title=f"Requirement Update: {req.get('product_category')}",
            message=f"Your requirement status has been updated to '{update_in.status.value}'. Check quote details.",
            notification_type=NotificationType.REQUIREMENT_UPDATE,
            reference_id=str(req["id"]),
        )

        # Audit
        await AuditService.log_action(
            db=db,
            user_id=admin_user.get("id", "admin"),
            user_email=admin_user.get("email", "admin"),
            user_role=admin_user.get("role", "ADMIN"),
            action="UPDATE_REQUIREMENT_STATUS",
            entity_type="REQUIREMENT",
            entity_id=str(req["id"]),
            details={"new_status": update_in.status.value},
        )

        return await RequirementService.get_by_id(db, requirement_id)
