"""Tests for admin dashboard KPIs and sales reporting."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_dashboard_and_reports(
    client: AsyncClient, admin_auth_headers
):
    # 1. Dashboard stats
    dash_res = await client.get("/api/v1/admin/dashboard", headers=admin_auth_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()["data"]
    assert "total_shopkeepers" in dash_data
    assert "total_products" in dash_data
    assert "total_sales_amount" in dash_data

    # 2. Sales Report
    sales_res = await client.get("/api/v1/reports/sales", headers=admin_auth_headers)
    assert sales_res.status_code == 200
    sales_data = sales_res.json()["data"]
    assert "total_revenue" in sales_data
    assert "sales_by_city" in sales_data

    # 3. Inventory Valuation
    inv_res = await client.get("/api/v1/reports/inventory", headers=admin_auth_headers)
    assert inv_res.status_code == 200
    inv_data = inv_res.json()["data"]
    assert "estimated_wholesale_valuation" in inv_data
