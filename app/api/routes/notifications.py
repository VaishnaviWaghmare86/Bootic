"""Notification endpoints."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import PaginationParams, get_current_active_user, get_db
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=PaginatedResponse[NotificationResponse],
    summary="List notifications for current user",
)
async def list_notifications(
    unread_only: bool = Query(False, description="Filter unread notifications only"),
    pagination: PaginationParams = Depends(),
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[NotificationResponse]:
    """Get notifications (order status changes, low stock alerts, admin announcements)."""
    res = await NotificationService.get_user_notifications(
        db=db,
        user_id=str(current_user["id"]),
        unread_only=unread_only,
        skip=pagination.skip,
        limit=pagination.limit,
    )
    return PaginatedResponse(
        success=True,
        message="Notifications retrieved.",
        data=[NotificationResponse(**n) for n in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )


@router.patch(
    "/{notification_id}/read",
    response_model=APIResponse[None],
    summary="Mark notification as read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[None]:
    """Mark a notification as read."""
    await NotificationService.mark_as_read(db, notification_id, str(current_user["id"]))
    return APIResponse(
        success=True,
        message="Notification marked as read.",
        data=None,
    )


@router.patch(
    "/read-all",
    response_model=APIResponse[Dict[str, int]],
    summary="Mark all notifications as read",
)
async def mark_all_read(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[Dict[str, int]]:
    """Mark all unread notifications as read."""
    count = await NotificationService.mark_all_as_read(db, str(current_user["id"]))
    return APIResponse(
        success=True,
        message=f"Marked {count} notifications as read.",
        data={"marked_count": count},
    )
