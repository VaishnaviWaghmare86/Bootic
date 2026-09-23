"""Address management service for shopkeepers."""

from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.exceptions import EntityNotFoundException
from app.schemas.address import AddressCreate, AddressUpdate
from app.utils.helpers import utc_now, normalize_mongo_doc, normalize_mongo_docs


class AddressService:
    @staticmethod
    async def create_address(
        db: AsyncIOMotorDatabase, customer_id: str, addr_in: AddressCreate
    ) -> Dict[str, Any]:
        """Add a new delivery address for a shopkeeper."""
        # If marked default, unset other defaults
        if addr_in.is_default:
            await db["addresses"].update_many(
                {"customer_id": customer_id},
                {"$set": {"is_default": False}}
            )
        else:
            # If this is the first address, make it default automatically
            count = await db["addresses"].count_documents({"customer_id": customer_id})
            if count == 0:
                addr_in.is_default = True

        doc = {
            "customer_id": customer_id,
            "contact_person": addr_in.contact_person.strip(),
            "business_name": addr_in.business_name.strip() if addr_in.business_name else None,
            "phone": addr_in.phone.strip(),
            "address_line1": addr_in.address_line1.strip(),
            "address_line2": addr_in.address_line2.strip() if addr_in.address_line2 else None,
            "landmark": addr_in.landmark.strip() if addr_in.landmark else None,
            "city": addr_in.city.strip(),
            "state": addr_in.state.strip(),
            "pincode": addr_in.pincode.strip(),
            "is_default": addr_in.is_default,
            "created_at": utc_now(),
            "updated_at": utc_now(),
        }

        res = await db["addresses"].insert_one(doc)
        doc["_id"] = res.inserted_id
        return normalize_mongo_doc(doc)

    @staticmethod
    async def get_by_id(db: AsyncIOMotorDatabase, address_id: str, customer_id: Optional[str] = None) -> Dict[str, Any]:
        """Fetch address by ID with optional owner verification."""
        try:
            obj_id = ObjectId(address_id)
        except Exception:
            raise EntityNotFoundException("Address", address_id)

        query: Dict[str, Any] = {"_id": obj_id}
        if customer_id:
            query["customer_id"] = customer_id

        addr = await db["addresses"].find_one(query)
        if not addr:
            raise EntityNotFoundException("Address", address_id)
        return normalize_mongo_doc(addr)

    @staticmethod
    async def list_addresses(db: AsyncIOMotorDatabase, customer_id: str) -> List[Dict[str, Any]]:
        """List all addresses for a customer."""
        cursor = db["addresses"].find({"customer_id": customer_id}).sort("is_default", -1)
        docs = await cursor.to_list(length=50)
        return normalize_mongo_docs(docs)

    @staticmethod
    async def update_address(
        db: AsyncIOMotorDatabase,
        address_id: str,
        customer_id: str,
        addr_in: AddressUpdate,
    ) -> Dict[str, Any]:
        """Update address."""
        try:
            obj_id = ObjectId(address_id)
        except Exception:
            raise EntityNotFoundException("Address", address_id)

        update_data = {k: v for k, v in addr_in.model_dump().items() if v is not None}
        if not update_data:
            return await AddressService.get_by_id(db, address_id, customer_id)

        if update_data.get("is_default"):
            await db["addresses"].update_many(
                {"customer_id": customer_id, "_id": {"$ne": obj_id}},
                {"$set": {"is_default": False}}
            )

        update_data["updated_at"] = utc_now()
        res = await db["addresses"].update_one(
            {"_id": obj_id, "customer_id": customer_id},
            {"$set": update_data}
        )
        if res.matched_count == 0:
            raise EntityNotFoundException("Address", address_id)
        return await AddressService.get_by_id(db, address_id, customer_id)

    @staticmethod
    async def delete_address(db: AsyncIOMotorDatabase, address_id: str, customer_id: str) -> bool:
        """Delete an address."""
        try:
            obj_id = ObjectId(address_id)
        except Exception:
            raise EntityNotFoundException("Address", address_id)

        res = await db["addresses"].delete_one({"_id": obj_id, "customer_id": customer_id})
        return res.deleted_count > 0
