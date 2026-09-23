"""Admin dashboard overview and audit endpoints (Admin only)."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import PaginationParams, get_db, require_admin
from app.schemas.audit import AuditLogResponse
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.report import DashboardStats
from app.services.audit_service import AuditService
from app.services.report_service import ReportService

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get(
    "/dashboard",
    response_model=APIResponse[DashboardStats],
    summary="Get aggregated admin dashboard operational statistics",
)
async def get_dashboard(
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[DashboardStats]:
    """Retrieve operational KPIs: shopkeeper counts, product catalog status, stock units, orders breakdown, sales metrics, pending requirements."""
    stats = await ReportService.get_dashboard_stats(db)
    return APIResponse(
        success=True,
        message="Dashboard statistics retrieved.",
        data=stats,
    )


@router.get(
    "/audit-logs",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="Get system audit log trail",
)
async def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name e.g. CREATE_PRODUCT, STOCK_IN"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type e.g. PRODUCT, ORDER"),
    pagination: PaginationParams = Depends(),
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[AuditLogResponse]:
    """Audit logs for tracking admin operations."""
    res = await AuditService.get_logs(
        db=db,
        skip=pagination.skip,
        limit=pagination.limit,
        action=action,
        entity_type=entity_type,
    )
    return PaginatedResponse(
        success=True,
        message="Audit logs retrieved.",
        data=[AuditLogResponse(**log) for log in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )
