"""Tests for authentication, registration, login, and authorization."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_shopkeeper_registration(client: AsyncClient):
    payload = {
        "full_name": "Kishore Kumar",
        "business_name": "Kishore Cloth Center",
        "mobile": "9998887776",
        "email": "kishore@example.com",
        "password": "Password@123",
        "city": "Kolhapur",
        "state": "Maharashtra",
        "pincode": "416001",
        "business_address": "Main Bazar, Kolhapur",
        "business_type": "BOUTIQUE",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "kishore@example.com"
    assert data["data"]["role"] == "SHOPKEEPER"


@pytest.mark.asyncio
async def test_duplicate_email_registration(client: AsyncClient):
    payload = {
        "full_name": "Duplicate User",
        "business_name": "Duplicate Store",
        "mobile": "9998887771",
        "email": "shopkeeper@example.com",  # Already seeded in conftest
        "password": "Password@123",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "business_address": "Test Road",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "DUPLICATE_EMAIL"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    payload = {
        "email": "shopkeeper@example.com",
        "password": "Password@123",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    payload = {
        "email": "shopkeeper@example.com",
        "password": "WrongPassword@123",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, shopkeeper_auth_headers):
    response = await client.get("/api/v1/auth/me", headers=shopkeeper_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "shopkeeper@example.com"
    assert data["data"]["role"] == "SHOPKEEPER"


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
