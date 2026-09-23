"""Pytest configuration and async test fixtures with in-memory MongoDB client."""

import asyncio
from typing import AsyncGenerator, Dict
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient
from app.core.config import settings
from app.core.database import DatabaseManager
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.enums import UserRole, UserStatus
from app.utils.helpers import utc_now


@pytest.fixture(scope="session")
def event_loop():
    """Create session-wide event loop for tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db():
    """Set up clean in-memory database mock for each test."""
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client[settings.MONGODB_DATABASE]
    DatabaseManager.client = mock_client
    DatabaseManager.db = mock_db
    DatabaseManager.is_mock = True

    await DatabaseManager.create_indexes()

    # Pre-seed Admin and Shopkeeper
    now = utc_now()
    pwd = hash_password("Password@123")

    admin_doc = {
        "full_name": "Test Admin",
        "email": "admin@example.com",
        "mobile": "9800000001",
        "hashed_password": pwd,
        "role": UserRole.ADMIN.value,
        "status": UserStatus.ACTIVE.value,
        "city": "Mumbai",
        "state": "Maharashtra",
        "is_verified": True,
        "created_at": now,
        "updated_at": now,
    }
    admin_res = await mock_db["users"].insert_one(admin_doc)
    admin_doc["_id"] = admin_res.inserted_id

    shopkeeper_doc = {
        "full_name": "Rahul Fashion Store",
        "email": "shopkeeper@example.com",
        "mobile": "9800000002",
        "hashed_password": pwd,
        "role": UserRole.SHOPKEEPER.value,
        "status": UserStatus.ACTIVE.value,
        "city": "Pune",
        "state": "Maharashtra",
        "business_name": "Rahul Fashion Store",
        "business_address": "Laxmi Road, Pune",
        "pincode": "411002",
        "is_verified": True,
        "created_at": now,
        "updated_at": now,
    }
    sk_res = await mock_db["users"].insert_one(shopkeeper_doc)
    shopkeeper_doc["_id"] = sk_res.inserted_id

    # Create empty cart for test shopkeeper
    await mock_db["carts"].insert_one({
        "customer_id": str(sk_res.inserted_id),
        "items": [],
        "updated_at": now
    })

    yield mock_db

    mock_client.close()


@pytest_asyncio.fixture(scope="function")
async def client(test_db) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def admin_auth_headers(test_db) -> Dict[str, str]:
    """Auth headers for test admin."""
    admin = await test_db["users"].find_one({"email": "admin@example.com"})
    token = create_access_token(
        subject=str(admin["_id"]),
        role=UserRole.ADMIN.value,
        extra_claims={"email": admin["email"], "name": admin["full_name"]},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def shopkeeper_auth_headers(test_db) -> Dict[str, str]:
    """Auth headers for test shopkeeper."""
    sk = await test_db["users"].find_one({"email": "shopkeeper@example.com"})
    token = create_access_token(
        subject=str(sk["_id"]),
        role=UserRole.SHOPKEEPER.value,
        extra_claims={"email": sk["email"], "name": sk["full_name"]},
    )
    return {"Authorization": f"Bearer {token}"}
