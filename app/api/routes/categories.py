"""Category management endpoints."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import get_db, require_admin
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.schemas.common import APIResponse
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get(
    "",
    response_model=APIResponse[List[CategoryResponse]],
    summary="List all product categories",
)
async def list_categories(
    active_only: bool = True, db: AsyncIOMotorDatabase = Depends(get_db)
) -> APIResponse[List[CategoryResponse]]:
    """Public/Shopkeeper list of clothing categories (Kurtis, Sarees, Dresses, etc.)."""
    categories = await CategoryService.list_categories(db, active_only=active_only)
    return APIResponse(
        success=True,
        message="Categories retrieved successfully.",
        data=[CategoryResponse(**c) for c in categories],
    )


@router.get(
    "/{category_id}",
    response_model=APIResponse[CategoryResponse],
    summary="Get category details by ID",
)
async def get_category(
    category_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> APIResponse[CategoryResponse]:
    """Get single category details."""
    cat = await CategoryService.get_by_id(db, category_id)
    return APIResponse(
        success=True,
        message="Category fetched.",
        data=CategoryResponse(**cat),
    )


@router.post(
    "",
    response_model=APIResponse[CategoryResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create category (Admin only)",
)
async def create_category(
    cat_in: CategoryCreate,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[CategoryResponse]:
    """Create a new product classification category."""
    cat = await CategoryService.create_category(db, cat_in)
    return APIResponse(
        success=True,
        message="Category created successfully.",
        data=CategoryResponse(**cat),
    )


@router.put(
    "/{category_id}",
    response_model=APIResponse[CategoryResponse],
    summary="Update category (Admin only)",
)
async def update_category(
    category_id: str,
    cat_in: CategoryUpdate,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[CategoryResponse]:
    """Update category name, description, image, or active status."""
    cat = await CategoryService.update_category(db, category_id, cat_in)
    return APIResponse(
        success=True,
        message="Category updated successfully.",
        data=CategoryResponse(**cat),
    )


@router.delete(
    "/{category_id}",
    response_model=APIResponse[None],
    summary="Delete category (Admin only)",
)
async def delete_category(
    category_id: str,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[None]:
    """Delete or deactivate category."""
    await CategoryService.delete_category(db, category_id)
    return APIResponse(
        success=True,
        message="Category deleted successfully.",
        data=None,
    )
