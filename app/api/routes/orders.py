"""Order management endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import (
    PaginationParams,
    get_current_active_user,
    get_db,
    require_admin,
)
from app.models.enums import OrderStatus, UserRole
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.order import (
    OrderCreateDirect,
    OrderCreateFromCart,
    OrderResponse,
    OrderStatusUpdate,
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "/checkout",
    response_model=APIResponse[OrderResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Place wholesale order from shopping cart",
)
async def checkout_cart(
    req: OrderCreateFromCart,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[OrderResponse]:
    """Convert cart into a confirmed order, snapshot prices, and reserve stock atomically."""
    order = await OrderService.create_order_from_cart(
        db=db,
        customer_id=str(current_user["id"]),
        req=req,
        user=current_user,
    )
    return APIResponse(
        success=True,
        message=f"Order {order.get('order_number')} placed successfully.",
        data=OrderResponse(**order),
    )


@router.post(
    "/direct",
    response_model=APIResponse[OrderResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Place wholesale order directly with item list",
)
async def create_direct_order(
    req: OrderCreateDirect,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[OrderResponse]:
    """Place wholesale order directly without using the cart."""
    order = await OrderService.create_order_direct(
        db=db,
        customer_id=str(current_user["id"]),
        req=req,
        user=current_user,
    )
    return APIResponse(
        success=True,
        message=f"Order {order.get('order_number')} created successfully.",
        data=OrderResponse(**order),
    )


@router.get(
    "",
    response_model=PaginatedResponse[OrderResponse],
    summary="List orders (Shopkeeper: own orders, Admin: all orders)",
)
async def list_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Search order number, customer, city"),
    pagination: PaginationParams = Depends(),
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[OrderResponse]:
    """List orders with pagination. Admin sees all; shopkeeper sees only their own."""
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
    customer_id = None if is_admin else str(current_user["id"])

    res = await OrderService.list_orders(
        db=db,
        customer_id=customer_id,
        status=status_filter,
        search=search,
        skip=pagination.skip,
        limit=pagination.limit,
    )
    return PaginatedResponse(
        success=True,
        message="Orders retrieved successfully.",
        data=[OrderResponse(**o) for o in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )


@router.get(
    "/{order_id}",
    response_model=APIResponse[OrderResponse],
    summary="Get order details by ID or Order Number",
)
async def get_order(
    order_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[OrderResponse]:
    """Get full order details with item snapshots and tracking status."""
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
    customer_id = None if is_admin else str(current_user["id"])

    order = await OrderService.get_by_id(db, order_id, customer_id)
    return APIResponse(
        success=True,
        message="Order details fetched.",
        data=OrderResponse(**order),
    )


@router.patch(
    "/{order_id}/status",
    response_model=APIResponse[OrderResponse],
    summary="Update order status & delivery tracking (Admin only)",
)
async def update_order_status(
    order_id: str,
    update_in: OrderStatusUpdate,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[OrderResponse]:
    """Admin updates workflow status (CONFIRMED, SHIPPED, DELIVERED, CANCELLED) and tracking details."""
    order = await OrderService.update_order_status(
        db=db,
        order_id=order_id,
        update_in=update_in,
        admin_user=admin_user,
    )
    return APIResponse(
        success=True,
        message=f"Order status updated to {update_in.order_status.value}.",
        data=OrderResponse(**order),
    )


@router.post(
    "/{order_id}/cancel",
    response_model=APIResponse[OrderResponse],
    summary="Cancel order (Shopkeeper self-service if not yet processing)",
)
async def cancel_order(
    order_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[OrderResponse]:
    """Shopkeeper cancels an initial placed order, releasing reserved stock."""
    order = await OrderService.cancel_customer_order(
        db=db,
        order_id=order_id,
        customer_id=str(current_user["id"]),
        user=current_user,
    )
    return APIResponse(
        success=True,
        message="Order has been cancelled and reserved stock returned to inventory.",
        data=OrderResponse(**order),
    )
