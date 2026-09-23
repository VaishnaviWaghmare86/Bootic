"""Inventory management endpoints (Admin only)."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import PaginationParams, get_db, require_admin
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.inventory import (
    InventoryItemResponse,
    InventoryMovementLog,
    StockAdjustmentRequest,
    StockInRequest,
)
from app.services.audit_service import AuditService
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get(
    "",
    response_model=PaginatedResponse[InventoryItemResponse],
    summary="List all stock inventory (Admin only)",
)
async def list_inventory(
    search: Optional[str] = Query(None, description="Search product name or SKU"),
    low_stock_only: bool = Query(False, description="Filter low stock items"),
    out_of_stock_only: bool = Query(False, description="Filter out-of-stock items"),
    pagination: PaginationParams = Depends(),
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[InventoryItemResponse]:
    """Admin view of warehouse stock levels, reserved quantities, and thresholds."""
    res = await InventoryService.list_inventory(
        db=db,
        search=search,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
        skip=pagination.skip,
        limit=pagination.limit,
    )
    return PaginatedResponse(
        success=True,
        message="Inventory records retrieved.",
        data=[InventoryItemResponse(**item) for item in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )


@router.get(
    "/product/{product_id}",
    response_model=APIResponse[InventoryItemResponse],
    summary="Get stock details for specific product (Admin only)",
)
async def get_product_stock(
    product_id: str,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[InventoryItemResponse]:
    """Get real-time stock levels for a product."""
    inv = await InventoryService.get_by_product_id(db, product_id)
    return APIResponse(
        success=True,
        message="Inventory fetched.",
        data=InventoryItemResponse(**inv),
    )


@router.post(
    "/stock-in",
    response_model=APIResponse[InventoryItemResponse],
    summary="Receive new stock shipment (Admin only)",
)
async def stock_in(
    req: StockInRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[InventoryItemResponse]:
    """Add incoming wholesale stock batch."""
    inv = await InventoryService.stock_in(db, req, performed_by=admin_user.get("email", "admin"))

    await AuditService.log_action(
        db=db,
        user_id=str(admin_user["id"]),
        user_email=admin_user["email"],
        user_role=admin_user["role"],
        action="STOCK_IN",
        entity_type="INVENTORY",
        entity_id=req.product_id,
        details={"quantity_added": req.quantity, "supplier": req.supplier_name},
    )

    return APIResponse(
        success=True,
        message=f"Added {req.quantity} pieces to stock.",
        data=InventoryItemResponse(**inv),
    )


@router.post(
    "/stock-adjustment",
    response_model=APIResponse[InventoryItemResponse],
    summary="Manual stock adjustment (+ / -) (Admin only)",
)
async def stock_adjustment(
    req: StockAdjustmentRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[InventoryItemResponse]:
    """Adjust stock quantity for damages, count reconciliations, or shrinkage."""
    inv = await InventoryService.stock_adjustment(
        db, req, performed_by=admin_user.get("email", "admin")
    )

    await AuditService.log_action(
        db=db,
        user_id=str(admin_user["id"]),
        user_email=admin_user["email"],
        user_role=admin_user["role"],
        action="STOCK_ADJUSTMENT",
        entity_type="INVENTORY",
        entity_id=req.product_id,
        details={"adjustment": req.adjustment_quantity, "reason": req.reason},
    )

    return APIResponse(
        success=True,
        message="Stock adjusted successfully.",
        data=InventoryItemResponse(**inv),
    )


@router.get(
    "/history/{product_id}",
    response_model=PaginatedResponse[InventoryMovementLog],
    summary="Get stock movement audit history for a product (Admin only)",
)
async def get_stock_history(
    product_id: str,
    pagination: PaginationParams = Depends(),
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[InventoryMovementLog]:
    """Trace all additions, adjustments, reservations, and dispatches for a product."""
    res = await InventoryService.get_movement_history(
        db=db,
        product_id=product_id,
        skip=pagination.skip,
        limit=pagination.limit,
    )
    return PaginatedResponse(
        success=True,
        message="Stock movement logs retrieved.",
        data=[InventoryMovementLog(**log) for log in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )
