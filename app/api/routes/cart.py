"""Cart endpoints for authenticated shopkeepers."""

from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import get_current_active_user, get_db
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartResponse
from app.schemas.common import APIResponse
from app.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get(
    "",
    response_model=APIResponse[CartResponse],
    summary="Get current shopping cart with real-time wholesale pricing",
)
async def get_cart(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[CartResponse]:
    """Retrieve cart items with tiered quantity discounts and subtotal calculations."""
    cart_data = await CartService.get_cart_details(db, str(current_user["id"]))
    return APIResponse(
        success=True,
        message="Cart retrieved successfully.",
        data=cart_data,
    )


@router.post(
    "/items",
    response_model=APIResponse[CartResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add product to cart with MOQ validation",
)
async def add_item_to_cart(
    item_in: CartItemAdd,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[CartResponse]:
    """Add product to cart. Validates minimum order quantity and stock."""
    cart_data = await CartService.add_item(db, str(current_user["id"]), item_in)
    return APIResponse(
        success=True,
        message="Product added to cart.",
        data=cart_data,
    )


@router.put(
    "/items/{product_id}",
    response_model=APIResponse[CartResponse],
    summary="Update cart item quantity",
)
async def update_cart_item(
    product_id: str,
    item_in: CartItemUpdate,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[CartResponse]:
    """Update item quantity in cart."""
    cart_data = await CartService.update_item(db, str(current_user["id"]), product_id, item_in)
    return APIResponse(
        success=True,
        message="Cart item updated.",
        data=cart_data,
    )


@router.delete(
    "/items/{product_id}",
    response_model=APIResponse[CartResponse],
    summary="Remove product from cart",
)
async def remove_cart_item(
    product_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[CartResponse]:
    """Remove item from cart."""
    cart_data = await CartService.remove_item(db, str(current_user["id"]), product_id)
    return APIResponse(
        success=True,
        message="Item removed from cart.",
        data=cart_data,
    )


@router.delete(
    "",
    response_model=APIResponse[None],
    summary="Clear entire cart",
)
async def clear_cart(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[None]:
    """Empty cart."""
    await CartService.clear_cart(db, str(current_user["id"]))
    return APIResponse(
        success=True,
        message="Cart cleared.",
        data=None,
    )
