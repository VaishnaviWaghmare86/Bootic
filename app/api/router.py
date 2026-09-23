"""API v1 master router aggregating all sub-routers."""

from fastapi import APIRouter
from app.api.routes import (
    addresses,
    admin,
    auth,
    cart,
    categories,
    inventory,
    notifications,
    orders,
    products,
    reports,
    requirements,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(inventory.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(requirements.router)
api_router.include_router(addresses.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
api_router.include_router(reports.router)
