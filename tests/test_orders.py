"""Tests for wholesale order lifecycle, stock reservation, and status transitions."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_creation_and_inventory_reservation(
    client: AsyncClient, admin_auth_headers, shopkeeper_auth_headers
):
    # Setup product
    cat_res = await client.post("/api/v1/categories", json={"name": "Tops"}, headers=admin_auth_headers)
    cat_id = cat_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Floral Top",
            "sku": "TOP-TEST-001",
            "category_id": cat_id,
            "wholesale_price": 300.0,
            "minimum_order_quantity": 5,
            "opening_stock": 50,
        },
        headers=admin_auth_headers,
    )
    prod_id = prod_res.json()["data"]["id"]

    # 1. Place order for 20 pieces
    order_payload = {
        "items": [{"product_id": prod_id, "quantity": 20, "selected_size": "M"}],
        "shipping_address": {
            "contact_person": "Shopkeeper Rahul",
            "phone": "9800000002",
            "address_line1": "Laxmi Road",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411002",
        },
        "payment_method": "COD",
    }
    order_res = await client.post("/api/v1/orders/direct", json=order_payload, headers=shopkeeper_auth_headers)
    assert order_res.status_code == 201
    order_data = order_res.json()["data"]
    order_id = order_data["id"]
    assert order_data["order_status"] == "ORDER_PLACED"
    assert order_data["items"][0]["quantity"] == 20
    assert order_data["subtotal"] == 6000.0

    # 2. Verify stock was reserved: Total 50, Available 30, Reserved 20
    inv_res = await client.get(f"/api/v1/inventory/product/{prod_id}", headers=admin_auth_headers)
    inv_data = inv_res.json()["data"]
    assert inv_data["available_stock"] == 30
    assert inv_data["reserved_stock"] == 20
    assert inv_data["total_stock"] == 50

    # 3. Admin updates status to SHIPPED
    ship_res = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"order_status": "SHIPPED", "courier_name": "VRL Logistics", "tracking_number": "VRL-8822"},
        headers=admin_auth_headers,
    )
    assert ship_res.status_code == 200
    assert ship_res.json()["data"]["order_status"] == "SHIPPED"
    assert ship_res.json()["data"]["tracking_number"] == "VRL-8822"


@pytest.mark.asyncio
async def test_order_cancellation_releases_stock(
    client: AsyncClient, admin_auth_headers, shopkeeper_auth_headers
):
    cat_res = await client.post("/api/v1/categories", json={"name": "Bottoms"}, headers=admin_auth_headers)
    cat_id = cat_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Palazzo",
            "sku": "PLZ-TEST-001",
            "category_id": cat_id,
            "wholesale_price": 250.0,
            "minimum_order_quantity": 10,
            "opening_stock": 40,
        },
        headers=admin_auth_headers,
    )
    prod_id = prod_res.json()["data"]["id"]

    order_payload = {
        "items": [{"product_id": prod_id, "quantity": 15}],
        "shipping_address": {
            "contact_person": "Shopkeeper Rahul",
            "phone": "9800000002",
            "address_line1": "Laxmi Road",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411002",
        },
    }
    order_res = await client.post("/api/v1/orders/direct", json=order_payload, headers=shopkeeper_auth_headers)
    order_id = order_res.json()["data"]["id"]

    # Customer cancels order
    cancel_res = await client.post(f"/api/v1/orders/{order_id}/cancel", headers=shopkeeper_auth_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["order_status"] == "CANCELLED"

    # Verify stock returned: Available 40, Reserved 0
    inv_res = await client.get(f"/api/v1/inventory/product/{prod_id}", headers=admin_auth_headers)
    inv_data = inv_res.json()["data"]
    assert inv_data["available_stock"] == 40
    assert inv_data["reserved_stock"] == 0
