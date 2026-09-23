"""Audit logging schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel


class AuditLogCreate(BaseModel):
    user_id: str
    user_email: str
    user_role: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_role: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime
