"""FastAPI Application Main Entrypoint."""

from contextlib import asynccontextmanager
import time
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.router import api_router
from app.core.config import settings
from app.core.database import DatabaseManager
from app.core.exceptions import AppException
from app.core.logging_config import logger
from app.schemas.common import APIErrorResponse, APIResponse


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup and shutdown events."""
    logger.info("Starting B2B Wholesale Clothing Platform Backend...")
    await DatabaseManager.connect_to_mongo()
    yield
    logger.info("Shutting down B2B Wholesale Clothing Platform Backend...")
    await DatabaseManager.close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# 🛍️ B2B Wholesale Clothing Distribution Platform API

A production-ready backend built for wholesale clothing distribution to regional shopkeepers and boutiques across Tier 2/3 cities.

### Key Features:
- **Role-Based Access Control**: `SUPER_ADMIN`, `ADMIN`, `SHOPKEEPER`
- **Catalog & Wholesale Tier Pricing**: Quantity slabs (e.g. 10-49 pcs, 50-99 pcs, 100+ pcs)
- **Minimum Order Quantity (MOQ)**: Enforced per product
- **Inventory Engine**: Atomic reservation and deduction with zero race conditions
- **Order Lifecycle**: Snapshot historic prices, status workflows, and stock releases on cancellation
- **Shopkeeper Custom Requirements**: Bulk quotation and fulfillment requests
- **Admin Dashboard & Analytics**: Operational KPIs, sales reports, inventory valuations
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ------------------------------------------------------------------------------
# CORS Middleware
# ------------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# Request Timing & Logging Middleware
# ------------------------------------------------------------------------------
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    # Exclude health check from log noise
    if request.url.path not in ["/health", "/"]:
        logger.info(
            f"{request.method} {request.url.path} - Status: {response.status_code} - {duration_ms}ms"
        )
    response.headers["X-Process-Time-Ms"] = str(duration_ms)
    return response


# ------------------------------------------------------------------------------
# Global Exception Handlers
# ------------------------------------------------------------------------------
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application domain exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=APIErrorResponse(
            success=False,
            message=exc.message,
            error_code=exc.error_code,
            errors=exc.errors,
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle standard FastAPI HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=APIErrorResponse(
            success=False,
            message=str(exc.detail),
            error_code="HTTP_ERROR",
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with clean frontend-friendly messages."""
    error_details = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg")
        error_details.append(f"{field}: {msg}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=APIErrorResponse(
            success=False,
            message="Request validation failed. Please verify input data.",
            error_code="VALIDATION_ERROR",
            errors=error_details,
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    logger.exception(f"Unhandled error processing {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=APIErrorResponse(
            success=False,
            message="An unexpected internal server error occurred.",
            error_code="INTERNAL_SERVER_ERROR",
        ).model_dump(),
    )


# ------------------------------------------------------------------------------
# Core Endpoints
# ------------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root() -> APIResponse[dict]:
    """Root endpoint returning platform info."""
    return APIResponse(
        success=True,
        message="B2B Wholesale Clothing Platform API is running.",
        data={
            "service": settings.PROJECT_NAME,
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "docs": "/docs",
            "redoc": "/redoc",
        },
    )


@app.get("/health", tags=["Health"])
async def health_check() -> APIResponse[dict]:
    """Health check endpoint verifying database connectivity."""
    db = DatabaseManager.get_db()
    is_connected = False
    try:
        if DatabaseManager.client:
            if not DatabaseManager.is_mock:
                await DatabaseManager.client.admin.command("ping")
            is_connected = True
    except Exception:
        is_connected = False

    return APIResponse(
        success=True,
        message="Service is healthy.",
        data={
            "status": "healthy",
            "database_connected": is_connected,
            "database_mode": "in-memory-mock" if DatabaseManager.is_mock else "mongodb-server",
            "timestamp": time.time(),
        },
    )


# ------------------------------------------------------------------------------
# Register Versioned API Routes
# ------------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)
