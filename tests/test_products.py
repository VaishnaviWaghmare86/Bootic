"""Tests for category and product catalog endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_category_and_product(client: AsyncClient, admin_auth_headers):
    # 1. Create Category
    cat_res = await client.post(
        "/api/v1/categories",
        json={"name": "Kurtis", "description": "Designer kurtis"},
        headers=admin_auth_headers,
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["data"]["id"]

    # 2. Create Product with Wholesale Tier Pricing
    prod_payload = {
        "name": "Floral Anarkali Kurti",
        "sku": "KRT-TEST-001",
        "category_id": cat_id,
        "fabric": "Cotton",
        "color": "Pink",
        "available_sizes": ["M", "L", "XL"],
        "gender": "WOMEN",
        "wholesale_price": 500.0,
        "tier_prices": [
            {"min_quantity": 10, "max_quantity": 49, "price_per_unit": 450.0},
            {"min_quantity": 50, "max_quantity": None, "price_per_unit": 400.0},
        ],
        "minimum_order_quantity": 10,
        "opening_stock": 100,
    }
    prod_res = await client.post(
        "/api/v1/products",
        json=prod_payload,
        headers=admin_auth_headers,
    )
    assert prod_res.status_code == 201
    prod_data = prod_res.json()["data"]
    assert prod_data["name"] == "Floral Anarkali Kurti"
    assert prod_data["sku"] == "KRT-TEST-001"
    assert prod_data["available_quantity"] == 100

    # 3. Public catalog list
    list_res = await client.get("/api/v1/products?search=Floral")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["meta"]["total_records"] == 1
    assert list_data["data"][0]["sku"] == "KRT-TEST-001"


@pytest.mark.asyncio
async def test_shopkeeper_cannot_create_product(client: AsyncClient, shopkeeper_auth_headers):
    prod_payload = {
        "name": "Unauthorized Product",
        "category_id": "dummy_id",
        "wholesale_price": 500.0,
    }
    prod_res = await client.post(
        "/api/v1/products",
        json=prod_payload,
        headers=shopkeeper_auth_headers,
    )
    assert prod_res.status_code == 403
