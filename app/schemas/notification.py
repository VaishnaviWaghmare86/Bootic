"""Notification schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.enums import NotificationType


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: NotificationType = NotificationType.SYSTEM_ALERT
    reference_id: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    reference_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime
