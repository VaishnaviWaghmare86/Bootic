"""Shopkeeper bulk custom requirements and quotes endpoints."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import (
    PaginationParams,
    get_current_active_user,
    get_db,
    require_admin,
)
from app.models.enums import RequirementStatus, UserRole
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.requirement import (
    RequirementCreate,
    RequirementResponse,
    RequirementStatusUpdate,
)
from app.services.requirement_service import RequirementService

router = APIRouter(prefix="/requirements", tags=["Requirements"])


@router.post(
    "",
    response_model=APIResponse[RequirementResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit a custom bulk clothing requirement (Shopkeeper)",
)
async def create_requirement(
    req_in: RequirementCreate,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[RequirementResponse]:
    """Submit a custom requirement for quantities, specific colors, sizes, and target budget."""
    req = await RequirementService.create_requirement(
        db=db,
        customer_id=str(current_user["id"]),
        req_in=req_in,
        user=current_user,
    )
    return APIResponse(
        success=True,
        message="Your bulk requirement has been submitted. Wholesaler admin will review and provide a quote.",
        data=RequirementResponse(**req),
    )


@router.get(
    "",
    response_model=PaginatedResponse[RequirementResponse],
    summary="List requirements (Shopkeeper: own requirements, Admin: all requirements)",
)
async def list_requirements(
    status_filter: Optional[RequirementStatus] = Query(None, alias="status"),
    city: Optional[str] = Query(None, description="Filter by delivery city"),
    pagination: PaginationParams = Depends(),
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[RequirementResponse]:
    """List custom bulk requirements."""
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
    customer_id = None if is_admin else str(current_user["id"])

    res = await RequirementService.list_requirements(
        db=db,
        customer_id=customer_id,
        status=status_filter,
        city=city,
        skip=pagination.skip,
        limit=pagination.limit,
    )
    return PaginatedResponse(
        success=True,
        message="Requirements retrieved successfully.",
        data=[RequirementResponse(**r) for r in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )


@router.get(
    "/{requirement_id}",
    response_model=APIResponse[RequirementResponse],
    summary="Get requirement details and quote",
)
async def get_requirement(
    requirement_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[RequirementResponse]:
    """Get requirement details."""
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
    customer_id = None if is_admin else str(current_user["id"])

    req = await RequirementService.get_by_id(db, requirement_id, customer_id)
    return APIResponse(
        success=True,
        message="Requirement details fetched.",
        data=RequirementResponse(**req),
    )


@router.patch(
    "/{requirement_id}",
    response_model=APIResponse[RequirementResponse],
    summary="Review requirement, attach quote or update status (Admin only)",
)
async def update_requirement_status(
    requirement_id: str,
    update_in: RequirementStatusUpdate,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[RequirementResponse]:
    """Admin reviews requirement, sets status (QUOTED, APPROVED, REJECTED), and attaches wholesale quotation."""
    req = await RequirementService.update_status_and_quote(
        db=db,
        requirement_id=requirement_id,
        update_in=update_in,
        admin_user=admin_user,
    )
    return APIResponse(
        success=True,
        message=f"Requirement status updated to {update_in.status.value}.",
        data=RequirementResponse(**req),
    )
