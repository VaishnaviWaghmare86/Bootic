"""Reporting and business intelligence endpoints (Admin only)."""

from typing import Any, Dict
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import get_db, require_admin
from app.schemas.common import APIResponse
from app.schemas.report import InventoryValuationReport, SalesReportResponse
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get(
    "/sales",
    response_model=APIResponse[SalesReportResponse],
    summary="Get sales analytics, top products and city distributions (Admin only)",
)
async def get_sales_report(
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[SalesReportResponse]:
    """Retrieve detailed sales performance breakdown by top products and regional cities."""
    report = await ReportService.get_sales_report(db)
    return APIResponse(
        success=True,
        message="Sales report generated successfully.",
        data=report,
    )


@router.get(
    "/inventory",
    response_model=APIResponse[InventoryValuationReport],
    summary="Get total inventory valuation and stock health (Admin only)",
)
async def get_inventory_report(
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[InventoryValuationReport]:
    """Calculate total warehouse stock count, reserved vs available units, and estimated wholesale asset valuation."""
    report = await ReportService.get_inventory_valuation(db)
    return APIResponse(
        success=True,
        message="Inventory report generated successfully.",
        data=report,
    )
