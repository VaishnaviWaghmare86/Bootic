"""Tests for bulk clothing requirements and admin quotations."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_requirement_workflow(
    client: AsyncClient, admin_auth_headers, shopkeeper_auth_headers
):
    # 1. Shopkeeper submits requirement
    req_payload = {
        "product_category": "Women's Kurtis",
        "product_title": "Festive Rayon Anarkali",
        "quantity": 100,
        "preferred_colors": ["Pink", "Blue"],
        "preferred_sizes": ["M", "L", "XL"],
        "target_budget": 40000.0,
        "delivery_city": "Satara",
        "notes": "Urgent requirement for festive season",
    }
    create_res = await client.post("/api/v1/requirements", json=req_payload, headers=shopkeeper_auth_headers)
    assert create_res.status_code == 201
    req_data = create_res.json()["data"]
    req_id = req_data["id"]
    assert req_data["status"] == "PENDING"
    assert req_data["delivery_city"] == "Satara"

    # 2. Admin reviews and provides quote
    quote_payload = {
        "status": "QUOTED",
        "quote": {
            "quoted_price_per_unit": 380.0,
            "total_quoted_price": 38000.0,
            "estimated_fulfillment_days": 3,
            "admin_notes": "Ready in Mumbai warehouse for immediate dispatch.",
        },
    }
    quote_res = await client.patch(
        f"/api/v1/requirements/{req_id}",
        json=quote_payload,
        headers=admin_auth_headers,
    )
    assert quote_res.status_code == 200
    updated_req = quote_res.json()["data"]
    assert updated_req["status"] == "QUOTED"
    assert updated_req["quote"]["quoted_price_per_unit"] == 380.0
    assert updated_req["quote"]["total_quoted_price"] == 38000.0
