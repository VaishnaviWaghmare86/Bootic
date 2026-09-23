"""Product catalog and administration endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import (
    PaginationParams,
    get_current_user,
    get_db,
    require_admin,
)
from app.models.enums import GenderCategory, ProductStatus, UserRole
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.product import (
    ProductCreate,
    ProductFilterParams,
    ProductResponse,
    ProductUpdate,
)
from app.services.audit_service import AuditService
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "",
    response_model=PaginatedResponse[ProductResponse],
    summary="Browse and search products with wholesale pricing and filters",
)
async def list_products(
    search: Optional[str] = Query(None, description="Search by name, SKU, category, color, fabric"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"),
    gender: Optional[GenderCategory] = Query(None, description="Filter by gender (WOMEN, MEN, KIDS, UNISEX)"),
    fabric: Optional[str] = Query(None, description="Filter by fabric (Cotton, Rayon, Silk, Georgette, etc.)"),
    color: Optional[str] = Query(None, description="Filter by color"),
    size: Optional[str] = Query(None, description="Filter by size (M, L, XL, XXL)"),
    min_price: Optional[float] = Query(None, description="Minimum wholesale price"),
    max_price: Optional[float] = Query(None, description="Maximum wholesale price"),
    in_stock_only: bool = Query(False, description="Show only in-stock products"),
    sort_by: str = Query("newest", description="newest, price_low_to_high, price_high_to_low"),
    pagination: PaginationParams = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PaginatedResponse[ProductResponse]:
    """Public/Shopkeeper endpoint to search and browse wholesale catalog."""
    filter_params = ProductFilterParams(
        search=search,
        category_id=category_id,
        subcategory=subcategory,
        gender=gender,
        fabric=fabric,
        color=color,
        size=size,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only,
        sort_by=sort_by,
        page=pagination.page,
        limit=pagination.limit,
    )

    res = await ProductService.list_products(db, filter_params, is_admin=False)
    return PaginatedResponse(
        success=True,
        message="Products retrieved successfully.",
        data=[ProductResponse(**p) for p in res["items"]],
        meta=pagination.get_meta(res["total"]),
    )


@router.get(
    "/{product_id}",
    response_model=APIResponse[ProductResponse],
    summary="Get product details and wholesale price tiers",
)
async def get_product(
    product_id: str, db: AsyncIOMotorDatabase = Depends(get_db)
) -> APIResponse[ProductResponse]:
    """Get full product details including tier prices and available stock."""
    prod = await ProductService.get_by_id(db, product_id)
    return APIResponse(
        success=True,
        message="Product details fetched.",
        data=ProductResponse(**prod),
    )


@router.post(
    "",
    response_model=APIResponse[ProductResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create wholesale product (Admin only)",
)
async def create_product(
    prod_in: ProductCreate,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[ProductResponse]:
    """Admin creates a new product with wholesale tier pricing and initial stock."""
    prod = await ProductService.create_product(db, prod_in, admin_user)

    # Audit log
    await AuditService.log_action(
        db=db,
        user_id=str(admin_user["id"]),
        user_email=admin_user["email"],
        user_role=admin_user["role"],
        action="CREATE_PRODUCT",
        entity_type="PRODUCT",
        entity_id=str(prod["id"]),
        details={"name": prod["name"], "sku": prod["sku"], "wholesale_price": prod["wholesale_price"]},
    )

    return APIResponse(
        success=True,
        message="Product created successfully.",
        data=ProductResponse(**prod),
    )


@router.put(
    "/{product_id}",
    response_model=APIResponse[ProductResponse],
    summary="Update product details (Admin only)",
)
async def update_product(
    product_id: str,
    prod_in: ProductUpdate,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[ProductResponse]:
    """Admin updates product metadata, pricing, or status."""
    prod = await ProductService.update_product(db, product_id, prod_in)

    await AuditService.log_action(
        db=db,
        user_id=str(admin_user["id"]),
        user_email=admin_user["email"],
        user_role=admin_user["role"],
        action="UPDATE_PRODUCT",
        entity_type="PRODUCT",
        entity_id=product_id,
        details={"updates": prod_in.model_dump(exclude_unset=True)},
    )

    return APIResponse(
        success=True,
        message="Product updated successfully.",
        data=ProductResponse(**prod),
    )


@router.delete(
    "/{product_id}",
    response_model=APIResponse[None],
    summary="Delete / Discontinue product (Admin only)",
)
async def delete_product(
    product_id: str,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[None]:
    """Admin soft deletes / discontinues a product."""
    await ProductService.delete_product(db, product_id)

    await AuditService.log_action(
        db=db,
        user_id=str(admin_user["id"]),
        user_email=admin_user["email"],
        user_role=admin_user["role"],
        action="DISCONTINUE_PRODUCT",
        entity_type="PRODUCT",
        entity_id=product_id,
    )

    return APIResponse(
        success=True,
        message="Product marked as discontinued.",
        data=None,
    )
