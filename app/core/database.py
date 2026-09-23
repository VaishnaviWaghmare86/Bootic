"""Centralized MongoDB database connection manager, lifecycle management, and index initialization."""

import asyncio
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo
from app.core.config import settings
from app.core.logging_config import logger


class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_mock: bool = False

    @classmethod
    async def connect_to_mongo(cls) -> None:
        """Connect to MongoDB with connection pooling and health check."""
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI} (Database: {settings.MONGODB_DATABASE})...")
        try:
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
                serverSelectionTimeoutMS=2000,
            )
            # Test ping
            await cls.client.admin.command("ping")
            cls.db = cls.client[settings.MONGODB_DATABASE]
            cls.is_mock = False
            logger.info("Successfully connected to live MongoDB server.")
        except Exception as exc:
            logger.warning(
                f"Could not connect to MongoDB server ({exc}). Initializing high-performance in-memory mock engine (mongomock-motor) for local development/testing."
            )
            try:
                from mongomock_motor import AsyncMongoMockClient
                cls.client = AsyncMongoMockClient()
                cls.db = cls.client[settings.MONGODB_DATABASE]
                cls.is_mock = True
                logger.info("In-memory MongoDB engine initialized successfully.")
            except Exception as mock_exc:
                logger.error(f"Failed to initialize database engine: {mock_exc}")
                raise exc

        # Initialize collections and indexes
        await cls.create_indexes()

    @classmethod
    async def close_mongo_connection(cls) -> None:
        """Gracefully close database connection."""
        if cls.client:
            logger.info("Closing MongoDB connection...")
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("MongoDB connection closed.")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Return the active database instance."""
        if cls.db is None:
            raise RuntimeError("Database is not initialized. Please call connect_to_mongo() first.")
        return cls.db

    @classmethod
    async def create_indexes(cls) -> None:
        """Create all required MongoDB collections and indexes."""
        if cls.db is None:
            return

        logger.info("Creating MongoDB indexes...")
        try:
            # Users indexes
            users_col = cls.db["users"]
            await users_col.create_index("email", unique=True)
            await users_col.create_index("mobile", unique=True)
            await users_col.create_index("role")
            await users_col.create_index("status")

            # Categories indexes
            cat_col = cls.db["categories"]
            await cat_col.create_index("name", unique=True)
            await cat_col.create_index("slug", unique=True, sparse=True)
            await cat_col.create_index("status")

            # Products indexes
            prod_col = cls.db["products"]
            await prod_col.create_index("sku", unique=True)
            await prod_col.create_index("category_id")
            await prod_col.create_index("name")
            await prod_col.create_index("status")
            await prod_col.create_index("created_at")
            await prod_col.create_index([("name", pymongo.TEXT), ("description", pymongo.TEXT)])

            # Inventory indexes
            inv_col = cls.db["inventory"]
            await inv_col.create_index("product_id", unique=True)
            await inv_col.create_index("sku")

            # Inventory Logs indexes
            inv_logs_col = cls.db["inventory_logs"]
            await inv_logs_col.create_index("product_id")
            await inv_logs_col.create_index("created_at")

            # Carts indexes
            cart_col = cls.db["carts"]
            await cart_col.create_index("customer_id", unique=True)

            # Orders indexes
            order_col = cls.db["orders"]
            await order_col.create_index("order_number", unique=True)
            await order_col.create_index("customer_id")
            await order_col.create_index("status")
            await order_col.create_index("created_at")

            # Requirements indexes
            req_col = cls.db["requirements"]
            await req_col.create_index("customer_id")
            await req_col.create_index("status")
            await req_col.create_index("created_at")

            # Addresses indexes
            addr_col = cls.db["addresses"]
            await addr_col.create_index("customer_id")
            await addr_col.create_index([("customer_id", 1), ("is_default", 1)])

            # Notifications indexes
            notif_col = cls.db["notifications"]
            await notif_col.create_index("user_id")
            await notif_col.create_index("is_read")
            await notif_col.create_index("created_at")

            # Audit Logs indexes
            audit_col = cls.db["audit_logs"]
            await audit_col.create_index("user_id")
            await audit_col.create_index("action")
            await audit_col.create_index("entity_type")
            await audit_col.create_index("created_at")

            logger.info("MongoDB indexes created successfully.")
        except Exception as e:
            logger.warning(f"Index creation encountered a non-critical notice: {e}")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency helper to get the database instance."""
    return DatabaseManager.get_db()
