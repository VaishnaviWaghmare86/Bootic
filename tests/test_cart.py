"""Tests for cart management and wholesale MOQ & tier calculations."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cart_workflow(client: AsyncClient, admin_auth_headers, shopkeeper_auth_headers):
    # Admin creates product with MOQ 10 and tier pricing
    cat_res = await client.post(
        "/api/v1/categories",
        json={"name": "Dresses"},
        headers=admin_auth_headers,
    )
    cat_id = cat_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Party Gown",
            "sku": "DRS-TEST-001",
            "category_id": cat_id,
            "wholesale_price": 1000.0,
            "tier_prices": [
                {"min_quantity": 10, "max_quantity": 49, "price_per_unit": 900.0},
                {"min_quantity": 50, "max_quantity": None, "price_per_unit": 800.0},
            ],
            "minimum_order_quantity": 10,
            "opening_stock": 100,
        },
        headers=admin_auth_headers,
    )
    prod_id = prod_res.json()["data"]["id"]

    # 1. Add less than MOQ (should fail)
    fail_res = await client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 5, "selected_size": "L"},
        headers=shopkeeper_auth_headers,
    )
    assert fail_res.status_code == 400
    assert fail_res.json()["error_code"] == "MOQ_NOT_MET"

    # 2. Add valid MOQ (15 pieces -> tier 1: 900 each)
    add_res = await client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 15, "selected_size": "L", "selected_color": "Red"},
        headers=shopkeeper_auth_headers,
    )
    assert add_res.status_code == 201
    cart_data = add_res.json()["data"]
    assert cart_data["total_quantity"] == 15
    assert cart_data["items"][0]["effective_unit_price"] == 900.0
    assert cart_data["subtotal"] == 13500.0

    # 3. Update quantity to 50 pieces -> tier 2: 800 each
    upd_res = await client.put(
        f"/api/v1/cart/items/{prod_id}",
        json={"quantity": 50, "selected_size": "L"},
        headers=shopkeeper_auth_headers,
    )
    assert upd_res.status_code == 200
    upd_cart = upd_res.json()["data"]
    assert upd_cart["total_quantity"] == 50
    assert upd_cart["items"][0]["effective_unit_price"] == 800.0
    assert upd_cart["subtotal"] == 40000.0

    # 4. Remove item from cart
    del_res = await client.delete(
        f"/api/v1/cart/items/{prod_id}",
        headers=shopkeeper_auth_headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["data"]["total_quantity"] == 0
