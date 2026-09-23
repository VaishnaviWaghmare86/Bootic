"""Tests for stock-in, stock adjustments, and inventory tracking."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_inventory_stock_in_and_adjustment(client: AsyncClient, admin_auth_headers):
    # Create category and product first
    cat_res = await client.post(
        "/api/v1/categories",
        json={"name": "Sarees"},
        headers=admin_auth_headers,
    )
    cat_id = cat_res.json()["data"]["id"]

    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Silk Saree",
            "sku": "SAR-TEST-001",
            "category_id": cat_id,
            "wholesale_price": 800.0,
            "opening_stock": 50,
        },
        headers=admin_auth_headers,
    )
    prod_id = prod_res.json()["data"]["id"]

    # Stock in 30 more pieces
    stock_in_res = await client.post(
        "/api/v1/inventory/stock-in",
        json={"product_id": prod_id, "quantity": 30, "supplier_name": "Surat Mills"},
        headers=admin_auth_headers,
    )
    assert stock_in_res.status_code == 200
    inv_data = stock_in_res.json()["data"]
    assert inv_data["available_stock"] == 80
    assert inv_data["total_stock"] == 80

    # Stock adjustment (-10 damaged)
    adj_res = await client.post(
        "/api/v1/inventory/stock-adjustment",
        json={"product_id": prod_id, "adjustment_quantity": -10, "reason": "Damaged in transit"},
        headers=admin_auth_headers,
    )
    assert adj_res.status_code == 200
    adj_data = adj_res.json()["data"]
    assert adj_data["available_stock"] == 70

    # Movement history
    history_res = await client.get(
        f"/api/v1/inventory/history/{prod_id}",
        headers=admin_auth_headers,
    )
    assert history_res.status_code == 200
    history_logs = history_res.json()["data"]
    assert len(history_logs) == 3  # Initial + Stock-In + Adjustment
