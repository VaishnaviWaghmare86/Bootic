"""Helper utilities for unique ID generation, date handling, and data normalization."""

from datetime import datetime, timezone
import random
import re
import string
import uuid
from typing import Any, Dict, List, Optional
from bson import ObjectId


def utc_now() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


def generate_order_number() -> str:
    """Generate a readable unique order number like ORD-20260923-839102."""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_digits = "".join(random.choices(string.digits, k=6))
    return f"ORD-{date_str}-{random_digits}"


def generate_sku(prefix: str = "PRD") -> str:
    """Generate a clean product SKU like KRT-8391."""
    clean_prefix = re.sub(r"[^A-Z0-9]", "", prefix.upper())[:4] or "PRD"
    random_str = "".join(random.choices(string.digits, k=5))
    return f"{clean_prefix}-{random_str}"


def generate_uuid() -> str:
    """Generate a standard UUID4 string."""
    return str(uuid.uuid4())


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text)


def normalize_mongo_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert MongoDB _id to string 'id' and handle ObjectId conversions."""
    if not doc:
        return None
    normalized = dict(doc)
    if "_id" in normalized:
        normalized["id"] = str(normalized["_id"])
        del normalized["_id"]
    for key, value in normalized.items():
        if isinstance(value, ObjectId):
            normalized[key] = str(value)
        elif isinstance(value, list):
            normalized[key] = [
                normalize_mongo_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item)
                for item in value
            ]
        elif isinstance(value, dict):
            normalized[key] = normalize_mongo_doc(value)
    return normalized


def normalize_mongo_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Normalize a list of MongoDB documents."""
    return [normalize_mongo_doc(doc) for doc in docs if doc]
