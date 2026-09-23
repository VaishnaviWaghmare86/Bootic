"""Shopkeeper delivery addresses endpoints."""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.deps import get_current_active_user, get_db
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate
from app.schemas.common import APIResponse
from app.services.address_service import AddressService

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get(
    "",
    response_model=APIResponse[List[AddressResponse]],
    summary="List saved delivery addresses for current shopkeeper",
)
async def list_addresses(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[List[AddressResponse]]:
    """List all delivery destinations."""
    addresses = await AddressService.list_addresses(db, str(current_user["id"]))
    return APIResponse(
        success=True,
        message="Addresses retrieved.",
        data=[AddressResponse(**a) for a in addresses],
    )


@router.post(
    "",
    response_model=APIResponse[AddressResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Add a new delivery address",
)
async def create_address(
    addr_in: AddressCreate,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[AddressResponse]:
    """Save a new delivery address for the shopkeeper."""
    address = await AddressService.create_address(db, str(current_user["id"]), addr_in)
    return APIResponse(
        success=True,
        message="Delivery address added successfully.",
        data=AddressResponse(**address),
    )


@router.put(
    "/{address_id}",
    response_model=APIResponse[AddressResponse],
    summary="Update delivery address",
)
async def update_address(
    address_id: str,
    addr_in: AddressUpdate,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[AddressResponse]:
    """Update address fields."""
    address = await AddressService.update_address(db, address_id, str(current_user["id"]), addr_in)
    return APIResponse(
        success=True,
        message="Address updated successfully.",
        data=AddressResponse(**address),
    )


@router.delete(
    "/{address_id}",
    response_model=APIResponse[None],
    summary="Delete delivery address",
)
async def delete_address(
    address_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[None]:
    """Delete address."""
    await AddressService.delete_address(db, address_id, str(current_user["id"]))
    return APIResponse(
        success=True,
        message="Address deleted.",
        data=None,
    )
