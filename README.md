# 🛍️ B2B Wholesale Clothing Distribution Platform Backend

A high-performance, production-ready B2B wholesale clothing marketplace and distribution management system backend built with **Python 3.12+**, **FastAPI**, **MongoDB (Motor / PyMongo)**, **JWT Authentication**, and **Role-Based Access Control (RBAC)**.

---

## 📖 1. Business Overview

Designed specifically for large garment wholesalers and manufacturers (e.g. Mumbai-based textile hub) distributing wholesale clothing lots to small and medium-sized shopkeepers, boutiques, and apparel retailers across regional cities and towns (Pune, Nashik, Kolhapur, Satara, Solapur, Ahmednagar, etc.).

### Key Capabilities:
- **Wholesale Tiered Pricing**: Dynamic bulk volume discounts based on order quantity slabs (e.g. 10-49 pcs @ ₹500, 50-99 pcs @ ₹470, 100+ pcs @ ₹440).
- **Minimum Order Quantity (MOQ)**: Enforced per product to guarantee wholesale unit batch requirements.
- **Atomic Inventory Control**: Strict reservation and release using MongoDB atomic operators (`$inc` with conditional filters) preventing race conditions and negative stock.
- **Price Freezing**: Historic order item unit prices and catalog snapshots are locked at order creation to protect past records from subsequent price updates.
- **Custom Shopkeeper Requirements**: Shopkeepers can request customized lots, specific colors/sizes, or budget targets; wholesalers review and attach quotations.
- **Admin Dashboard & Business Intelligence**: Real-time sales statistics, top-selling items, city-wise order distribution, and total inventory valuation.
- **Audit Logging**: Comprehensive trace of all administrative operations (product creation, stock movements, order status changes).

---

## 🛠️ 2. Technology Stack

- **Language**: Python 3.12+ / Python 3.13
- **Framework**: FastAPI (Asynchronous REST API)
- **ASGI Server**: Uvicorn
- **Database**: MongoDB (with Motor async driver and PyMongo)
- **Validation**: Pydantic v2 & Pydantic Settings
- **Authentication**: JWT (JSON Web Tokens) with PyJWT and secure `bcrypt` password hashing
- **Testing**: PyTest, PyTest-Asyncio, HTTPX, and MongoMock-Motor

---

## 📂 3. Project Structure

```text
d:/bootic/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI initialization, CORS, global error handling & middleware
│   │
│   ├── core/
│   │   ├── config.py            # Environment and settings configuration (pydantic-settings)
│   │   ├── database.py          # Centralized MongoDB connection manager & index initialization
│   │   ├── exceptions.py        # Custom domain exception classes
│   │   ├── logging_config.py    # Structured logging
│   │   └── security.py          # Bcrypt password hashing & JWT token generators
│   │
│   ├── models/
│   │   └── enums.py             # UserRole, OrderStatus, ProductStatus, InventoryAction enums
│   │
│   ├── schemas/
│   │   ├── common.py            # APIResponse, APIErrorResponse, PaginationMeta
│   │   ├── auth.py              # Login, register, token schemas
│   │   ├── user.py              # Profile and user representations
│   │   ├── category.py          # Category CRUD schemas
│   │   ├── product.py           # Product and wholesale tier pricing schemas
│   │   ├── inventory.py         # Stock-in, adjustments, movement logs schemas
│   │   ├── cart.py              # Cart items and real-time discount calculation
│   │   ├── order.py             # Order items snapshots and status schemas
│   │   ├── requirement.py       # Custom requirement and quote schemas
│   │   ├── address.py           # Shipping destination address schemas
│   │   ├── notification.py      # User notifications
│   │   ├── audit.py             # Admin audit trails
│   │   └── report.py            # Admin KPIs and sales analytics schemas
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── category_service.py
│   │   ├── pricing_service.py   # Dynamic wholesale tier calculation
│   │   ├── product_service.py
│   │   ├── inventory_service.py # Atomic stock reservations & releases
│   │   ├── cart_service.py
│   │   ├── address_service.py
│   │   ├── order_service.py     # Complete order lifecycle & historic price freeze
│   │   ├── requirement_service.py
│   │   ├── notification_service.py
│   │   ├── audit_service.py
│   │   └── report_service.py    # Admin operational metrics & sales charts
│   │
│   └── api/
│       ├── deps.py              # Dependency injection: get_db, auth, RBAC, pagination
│       ├── router.py            # Master API router
│       └── routes/
│           ├── auth.py
│           ├── users.py
│           ├── categories.py
│           ├── products.py
│           ├── inventory.py
│           ├── cart.py
│           ├── orders.py
│           ├── requirements.py
│           ├── addresses.py
│           ├── notifications.py
│           ├── admin.py
│           └── reports.py
│
├── tests/
│   ├── conftest.py              # Async test fixtures and mock DB client
│   ├── test_auth.py
│   ├── test_products.py
│   ├── test_inventory.py
│   ├── test_cart.py
│   ├── test_orders.py
│   ├── test_requirements.py
│   └── test_admin_reports.py
│
├── .env
├── .env.example
├── .gitignore
├── pytest.ini
├── requirements.txt
├── seed.py                      # Database populator script
├── run.py                       # Server launcher
└── README.md
```

---

## 🚀 4. Getting Started & Local Setup

### 4.1 Prerequisites
- **Python 3.12+** or **Python 3.13** installed.
- **MongoDB Server** (or MongoDB Compass).

### 4.2 MongoDB Installation on Windows
1. Download the official installer from [MongoDB Community Server](https://www.mongodb.com/try/download/community) (or run `mongodb-windows-setup.msi` in your `Downloads` folder).
2. Follow the setup wizard and check **"Install MongoDB as a Service"** and **"Install MongoDB Compass"**.
3. Verify the service is running:
   ```powershell
   Get-Service -Name MongoDB
   ```
4. Open **MongoDB Compass**, connect to `mongodb://localhost:27017`, and explore `b2b_clothing_db`.

*(Note: If MongoDB is offline, the backend automatically utilizes an in-memory database engine (`mongomock-motor`) so all development and tests run immediately without failure).*

---

### 4.3 Virtual Environment & Dependencies Setup (Windows PowerShell)

```powershell
# 1. Clone/navigate to project directory
cd d:\bootic

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\activate

# 4. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 4.4 Environment Configuration

Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Configuration parameters:
```ini
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=b2b_clothing_db

JWT_SECRET_KEY=b2b_wholesale_clothing_secret_key_change_in_production_2026
JWT_ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

---

### 4.5 Seed Development Database

Run the seed script to populate sample admin accounts, regional shopkeepers, categories, and wholesale clothing products:
```powershell
python seed.py
```

#### Pre-seeded Development Accounts (Password: `Password@123`):
| Role | Name | Email | City |
|---|---|---|---|
| **SUPER_ADMIN** | Suresh Mehta | `superadmin@example.com` | Mumbai |
| **ADMIN** | Amit Sharma | `admin@example.com` | Mumbai |
| **SHOPKEEPER** | Rahul Deshmukh (Rahul Fashion Store) | `pune.boutique@example.com` | Pune |
| **SHOPKEEPER** | Sunita Patil (Sai Collections) | `nashik.traders@example.com` | Nashik |
| **SHOPKEEPER** | Vikram Jadhav (Mahalaxmi Outfits) | `satara.retail@example.com` | Satara |

---

### 4.6 Start the Server

```powershell
python run.py
```
Or with Uvicorn CLI directly:
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📚 5. Interactive API Documentation

Once the server is running, visit:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 6. Running Automated Tests

Run the full automated pytest suite:
```powershell
pytest -v
```

All 14 unit and integration tests verify:
- ✅ Shopkeeper registration, duplicate prevention, and JWT login.
- ✅ Admin product creation, public search, and MOQ validation.
- ✅ Stock-in, adjustments, and movement audit logs.
- ✅ Cart management with real-time wholesale tiered price discounts.
- ✅ Direct and cart order placement, atomic stock reservation, and cancellation rollback.
- ✅ Custom bulk requirement submissions and quotation workflow.
- ✅ Admin dashboard operational statistics, sales analytics, and inventory valuations.

---

## 🔒 7. Core Business Rules

1. **Authentication**: All protected endpoints require a valid Bearer JWT token in the `Authorization` header.
2. **Role Authorization**: Only `ADMIN` or `SUPER_ADMIN` can create, update, or discontinue products, adjust inventory, and review quotes.
3. **Data Isolation**: Shopkeepers can only access and modify their own carts, orders, addresses, and requirements.
4. **Wholesale Tier Pricing**: Wholesale products support quantity slabs (e.g. 10-49 pcs @ ₹500, 50-99 pcs @ ₹470, 100+ pcs @ ₹440).
5. **MOQ Enforcement**: Orders and cart items must meet or exceed the product's Minimum Order Quantity.
6. **Atomic Stock Protection**: Orders atomically reserve inventory. Negative stock is strictly rejected at the database level.
7. **Order Cancellation**: Cancelling an order automatically releases the reserved stock back to available warehouse inventory. Delivered orders cannot be cancelled online.
8. **Historic Price Freezing**: Order item unit prices are recorded in the order document at checkout time, ensuring future catalog price changes never modify past orders.
9. **Audit Trail**: Administrative actions (product modifications, stock changes, order status updates) are logged in `audit_logs`.

---

## 🔌 8. Frontend Integration Guide

When connecting a React / Vue / Angular / Mobile frontend:
- Base API URL: `http://localhost:8000/api/v1`
- Configure CORS in `.env` (`FRONTEND_URL=http://localhost:5173`)
- Include the JWT token in request headers:
  ```javascript
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
  ```
- Standard JSON envelope format:
  ```json
  {
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... }
  }
  ```
