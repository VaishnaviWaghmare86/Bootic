"""Database seeding script for local development and testing.

Populates:
- 1 Super Admin
- 1 Admin
- 3 Regional Shopkeepers (Pune, Nashik, Satara)
- 7 Categories
- 10+ Wholesale clothing products with quantity tier pricing & initial inventory
- Sample shipping addresses, cart items, requirements, and orders
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import hash_password
from app.models.enums import (
    BusinessType,
    GenderCategory,
    InventoryAction,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    ProductStatus,
    RequirementStatus,
    UserRole,
    UserStatus,
)
from app.utils.helpers import generate_order_number, slugify, utc_now


async def seed_database() -> None:
    print(f"Connecting to MongoDB at {settings.MONGODB_URI} (Database: {settings.MONGODB_DATABASE})...")
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command("ping")
        db = client[settings.MONGODB_DATABASE]
        print("Connected to live MongoDB.")
    except Exception as e:
        print(f"Notice: Could not connect to live MongoDB ({e}). Testing with mongomock-motor in-memory engine.")
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[settings.MONGODB_DATABASE]

    # Optional: Clear existing collections for a clean seed
    collections = [
        "users", "categories", "products", "inventory", "inventory_logs",
        "carts", "orders", "requirements", "addresses", "notifications", "audit_logs"
    ]
    for col in collections:
        await db[col].delete_many({})
    print("Cleared existing development data.")

    now = utc_now()

    # --------------------------------------------------------------------------
    # 1. Seed Users (Super Admin, Admin, 3 Shopkeepers)
    # --------------------------------------------------------------------------
    dev_password = "Password@123"
    hashed_pwd = hash_password(dev_password)

    users_data = [
        {
            "full_name": "Suresh Mehta (Super Admin)",
            "email": "superadmin@example.com",
            "mobile": "9820011111",
            "hashed_password": hashed_pwd,
            "role": UserRole.SUPER_ADMIN.value,
            "status": UserStatus.ACTIVE.value,
            "city": "Mumbai",
            "state": "Maharashtra",
            "business_name": "Mumbai Mega Wholesale Hub",
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "full_name": "Amit Sharma (Admin)",
            "email": "admin@example.com",
            "mobile": "9820022222",
            "hashed_password": hashed_pwd,
            "role": UserRole.ADMIN.value,
            "status": UserStatus.ACTIVE.value,
            "city": "Mumbai",
            "state": "Maharashtra",
            "business_name": "Mumbai Mega Wholesale Hub",
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "full_name": "Rahul Deshmukh",
            "email": "pune.boutique@example.com",
            "mobile": "9820033333",
            "hashed_password": hashed_pwd,
            "role": UserRole.SHOPKEEPER.value,
            "status": UserStatus.ACTIVE.value,
            "city": "Pune",
            "state": "Maharashtra",
            "business_name": "Rahul Fashion Store",
            "business_type": BusinessType.BOUTIQUE.value,
            "pincode": "411002",
            "business_address": "Shop 14, Laxmi Road, Pune",
            "gst_number": "27AAACR1234F1Z1",
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "full_name": "Sunita Patil",
            "email": "nashik.traders@example.com",
            "mobile": "9820044444",
            "hashed_password": hashed_pwd,
            "role": UserRole.SHOPKEEPER.value,
            "status": UserStatus.ACTIVE.value,
            "city": "Nashik",
            "state": "Maharashtra",
            "business_name": "Sai Collections",
            "business_type": BusinessType.RETAIL_STORE.value,
            "pincode": "422001",
            "business_address": "Plot 8, Main Market, MG Road, Nashik",
            "gst_number": "27AABCS5678G2Z3",
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "full_name": "Vikram Jadhav",
            "email": "satara.retail@example.com",
            "mobile": "9820055555",
            "hashed_password": hashed_pwd,
            "role": UserRole.SHOPKEEPER.value,
            "status": UserStatus.ACTIVE.value,
            "city": "Satara",
            "state": "Maharashtra",
            "business_name": "Mahalaxmi Outfits",
            "business_type": BusinessType.BOUTIQUE.value,
            "pincode": "415001",
            "business_address": "Near Rajwada, Powai Naka, Satara",
            "gst_number": "27AADCM9012H3Z5",
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
        },
    ]

    user_insert_res = await db["users"].insert_many(users_data)
    user_ids = [str(_id) for _id in user_insert_res.inserted_ids]
    pune_user_id = user_ids[2]
    nashik_user_id = user_ids[3]
    satara_user_id = user_ids[4]
    print(f"Seeded {len(users_data)} users (Credentials: password is '{dev_password}').")

    # Initialize empty carts for shopkeepers
    for sk_id in [pune_user_id, nashik_user_id, satara_user_id]:
        await db["carts"].insert_one({"customer_id": sk_id, "items": [], "updated_at": now})

    # --------------------------------------------------------------------------
    # 2. Seed Delivery Addresses
    # --------------------------------------------------------------------------
    addresses_data = [
        {
            "customer_id": pune_user_id,
            "contact_person": "Rahul Deshmukh",
            "business_name": "Rahul Fashion Store",
            "phone": "9820033333",
            "address_line1": "Shop 14, Laxmi Road",
            "address_line2": "Opposite City Post Office",
            "landmark": "City Post",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411002",
            "is_default": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "customer_id": nashik_user_id,
            "contact_person": "Sunita Patil",
            "business_name": "Sai Collections",
            "phone": "9820044444",
            "address_line1": "Plot 8, Main Market",
            "address_line2": "MG Road",
            "landmark": "Near Clock Tower",
            "city": "Nashik",
            "state": "Maharashtra",
            "pincode": "422001",
            "is_default": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "customer_id": satara_user_id,
            "contact_person": "Vikram Jadhav",
            "business_name": "Mahalaxmi Outfits",
            "phone": "9820055555",
            "address_line1": "Near Rajwada",
            "address_line2": "Powai Naka",
            "landmark": "Shivaji Statue",
            "city": "Satara",
            "state": "Maharashtra",
            "pincode": "415001",
            "is_default": True,
            "created_at": now,
            "updated_at": now,
        },
    ]
    await db["addresses"].insert_many(addresses_data)
    print("Seeded sample delivery addresses.")

    # --------------------------------------------------------------------------
    # 3. Seed Categories
    # --------------------------------------------------------------------------
    categories_data = [
        {"name": "Kurtis", "description": "Designer Anarkali, Straight, Cotton & Silk Kurtis", "display_order": 1},
        {"name": "Sarees", "description": "Banarasi, Kanjeevaram, Chanderi, Georgette & Cotton Sarees", "display_order": 2},
        {"name": "Dresses & Gowns", "description": "Western & Indo-Western Party Wear Gowns", "display_order": 3},
        {"name": "Tops & Tunics", "description": "Casual, formal and floral printed ladies tops", "display_order": 4},
        {"name": "Shirts & Formal", "description": "Men's cotton & linen wholesale formal/casual shirts", "display_order": 5},
        {"name": "Jeans & Denim", "description": "Stretchable high-waist jeans and men's denim", "display_order": 6},
        {"name": "Palazzo & Ethnic Bottoms", "description": "Rayon, Cotton and Silk pants and palazzos", "display_order": 7},
    ]
    for c in categories_data:
        c["slug"] = slugify(c["name"])
        c["image_url"] = f"https://images.unsplash.com/clothing-{c['slug']}.jpg"
        c["is_active"] = True
        c["created_at"] = now
        c["updated_at"] = now

    cat_insert_res = await db["categories"].insert_many(categories_data)
    cat_ids = [str(_id) for _id in cat_insert_res.inserted_ids]
    print(f"Seeded {len(categories_data)} categories.")

    # --------------------------------------------------------------------------
    # 4. Seed Products with Wholesale Tier Pricing and Inventory
    # --------------------------------------------------------------------------
    products_raw = [
        {
            "name": "Women's Pure Cotton Anarkali Kurti (Pink Floral)",
            "sku": "KRT-001",
            "category_idx": 0,
            "subcategory": "Anarkali Kurti",
            "brand": "Mumbai Heritage",
            "fabric": "100% Cotton",
            "color": "Pink",
            "available_sizes": ["M", "L", "XL", "XXL"],
            "pattern": "Floral Print",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 550.0,
            "tier_prices": [
                {"min_quantity": 10, "max_quantity": 49, "price_per_unit": 500.0},
                {"min_quantity": 50, "max_quantity": 99, "price_per_unit": 470.0},
                {"min_quantity": 100, "max_quantity": None, "price_per_unit": 440.0},
            ],
            "minimum_order_quantity": 10,
            "opening_stock": 350,
            "low_stock_threshold": 25,
            "product_images": ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b"],
        },
        {
            "name": "Heavy Rayon Straight Gold Foil Kurti",
            "sku": "KRT-002",
            "category_idx": 0,
            "subcategory": "Straight Kurti",
            "brand": "Surat Silks",
            "fabric": "Rayon 14kg",
            "color": "Royal Blue",
            "available_sizes": ["L", "XL", "XXL", "3XL"],
            "pattern": "Foil Print",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 420.0,
            "tier_prices": [
                {"min_quantity": 15, "max_quantity": 50, "price_per_unit": 380.0},
                {"min_quantity": 51, "max_quantity": None, "price_per_unit": 350.0},
            ],
            "minimum_order_quantity": 15,
            "opening_stock": 500,
            "low_stock_threshold": 30,
            "product_images": ["https://images.unsplash.com/photo-1610030469983-98e550d6193c"],
        },
        {
            "name": "Art Silk Traditional Zari Border Saree with Blouse",
            "sku": "SAR-101",
            "category_idx": 1,
            "subcategory": "Silk Saree",
            "brand": "Kashi Weaves",
            "fabric": "Art Silk",
            "color": "Maroon Red",
            "available_sizes": ["Free Size"],
            "pattern": "Zari Weave",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 850.0,
            "tier_prices": [
                {"min_quantity": 5, "max_quantity": 19, "price_per_unit": 800.0},
                {"min_quantity": 20, "max_quantity": 49, "price_per_unit": 750.0},
                {"min_quantity": 50, "max_quantity": None, "price_per_unit": 700.0},
            ],
            "minimum_order_quantity": 5,
            "opening_stock": 200,
            "low_stock_threshold": 15,
            "product_images": ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb"],
        },
        {
            "name": "Printed Georgette Casual Daily Wear Saree",
            "sku": "SAR-102",
            "category_idx": 1,
            "subcategory": "Daily Wear",
            "brand": "Mumbai Textile",
            "fabric": "Georgette",
            "color": "Pastel Green",
            "available_sizes": ["Free Size"],
            "pattern": "Digital Print",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 320.0,
            "tier_prices": [
                {"min_quantity": 20, "max_quantity": 99, "price_per_unit": 290.0},
                {"min_quantity": 100, "max_quantity": None, "price_per_unit": 265.0},
            ],
            "minimum_order_quantity": 20,
            "opening_stock": 600,
            "low_stock_threshold": 50,
            "product_images": ["https://images.unsplash.com/photo-1610030469854-e692484a0d92"],
        },
        {
            "name": "Georgette Tiered Indo-Western Maxi Gown",
            "sku": "DRS-201",
            "category_idx": 2,
            "subcategory": "Maxi Dress",
            "brand": "Fashionista",
            "fabric": "Fox Georgette",
            "color": "Wine",
            "available_sizes": ["M", "L", "XL"],
            "pattern": "Embroidered Neck",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 950.0,
            "tier_prices": [
                {"min_quantity": 5, "max_quantity": 20, "price_per_unit": 890.0},
                {"min_quantity": 21, "max_quantity": None, "price_per_unit": 830.0},
            ],
            "minimum_order_quantity": 5,
            "opening_stock": 120,
            "low_stock_threshold": 10,
            "product_images": ["https://images.unsplash.com/photo-1595777457583-95e059d581b8"],
        },
        {
            "name": "Casual Cotton Floral Printed Western Top",
            "sku": "TOP-301",
            "category_idx": 3,
            "subcategory": "Western Top",
            "brand": "Trendy Club",
            "fabric": "Cotton Cambric",
            "color": "Yellow",
            "available_sizes": ["S", "M", "L", "XL"],
            "pattern": "Floral",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 280.0,
            "tier_prices": [
                {"min_quantity": 20, "max_quantity": 50, "price_per_unit": 250.0},
                {"min_quantity": 51, "max_quantity": None, "price_per_unit": 225.0},
            ],
            "minimum_order_quantity": 20,
            "opening_stock": 450,
            "low_stock_threshold": 40,
            "product_images": ["https://images.unsplash.com/photo-1534126511673-b6899657816a"],
        },
        {
            "name": "Men's Premium Oxford Cotton Casual Shirt (Assorted Colors)",
            "sku": "SHT-401",
            "category_idx": 4,
            "subcategory": "Casual Shirt",
            "brand": "Bombay Shirts Co",
            "fabric": "100% Oxford Cotton",
            "color": "Sky Blue",
            "available_sizes": ["M", "L", "XL", "XXL"],
            "pattern": "Solid",
            "gender": GenderCategory.MEN.value,
            "wholesale_price": 480.0,
            "tier_prices": [
                {"min_quantity": 12, "max_quantity": 48, "price_per_unit": 440.0},
                {"min_quantity": 49, "max_quantity": None, "price_per_unit": 410.0},
            ],
            "minimum_order_quantity": 12,
            "opening_stock": 400,
            "low_stock_threshold": 30,
            "product_images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c"],
        },
        {
            "name": "Men's Striped Linen Slim-Fit Casual Shirt",
            "sku": "SHT-402",
            "category_idx": 4,
            "subcategory": "Linen Shirt",
            "brand": "Bombay Shirts Co",
            "fabric": "Linen Blend",
            "color": "White & Olive",
            "available_sizes": ["M", "L", "XL"],
            "pattern": "Striped",
            "gender": GenderCategory.MEN.value,
            "wholesale_price": 520.0,
            "tier_prices": [
                {"min_quantity": 10, "max_quantity": 30, "price_per_unit": 480.0},
                {"min_quantity": 31, "max_quantity": None, "price_per_unit": 450.0},
            ],
            "minimum_order_quantity": 10,
            "opening_stock": 250,
            "low_stock_threshold": 20,
            "product_images": ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf"],
        },
        {
            "name": "Women's High Waist Ankle-Length Stretchable Jeans",
            "sku": "JNS-501",
            "category_idx": 5,
            "subcategory": "Denim",
            "brand": "Urban Stitch",
            "fabric": "Cotton Lycra Denim",
            "color": "Dark Blue",
            "available_sizes": ["28", "30", "32", "34"],
            "pattern": "Clean Wash",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 620.0,
            "tier_prices": [
                {"min_quantity": 12, "max_quantity": 48, "price_per_unit": 570.0},
                {"min_quantity": 49, "max_quantity": None, "price_per_unit": 530.0},
            ],
            "minimum_order_quantity": 12,
            "opening_stock": 300,
            "low_stock_threshold": 25,
            "product_images": ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246"],
        },
        {
            "name": "Rayon Schiffli Flared Palazzo Pants (Pack of 6 Assorted)",
            "sku": "PLZ-601",
            "category_idx": 6,
            "subcategory": "Palazzo",
            "brand": "Ethnic Roots",
            "fabric": "Heavy Rayon with Embroidery",
            "color": "Off-White & Beige",
            "available_sizes": ["Free Size (Elastic)"],
            "pattern": "Schiffli Work",
            "gender": GenderCategory.WOMEN.value,
            "wholesale_price": 310.0,
            "tier_prices": [
                {"min_quantity": 18, "max_quantity": 60, "price_per_unit": 280.0},
                {"min_quantity": 61, "max_quantity": None, "price_per_unit": 255.0},
            ],
            "minimum_order_quantity": 18,
            "opening_stock": 350,
            "low_stock_threshold": 30,
            "product_images": ["https://images.unsplash.com/photo-1509631179647-0177331693ae"],
        },
    ]

    for p in products_raw:
        cat_id = cat_ids[p["category_idx"]]
        cat_name = categories_data[p["category_idx"]]["name"]

        prod_doc = {
            "name": p["name"],
            "sku": p["sku"],
            "description": f"High grade wholesale quality {p['name']} manufactured for retailers and boutiques.",
            "category_id": cat_id,
            "category_name": cat_name,
            "subcategory": p["subcategory"],
            "brand": p["brand"],
            "fabric": p["fabric"],
            "color": p["color"],
            "available_sizes": p["available_sizes"],
            "pattern": p["pattern"],
            "gender": p["gender"],
            "product_images": p["product_images"],
            "wholesale_price": p["wholesale_price"],
            "tier_prices": p["tier_prices"],
            "minimum_order_quantity": p["minimum_order_quantity"],
            "low_stock_threshold": p["low_stock_threshold"],
            "status": ProductStatus.ACTIVE.value,
            "created_at": now,
            "updated_at": now,
        }

        p_res = await db["products"].insert_one(prod_doc)
        p_id = str(p_res.inserted_id)

        # Inventory record
        stock = p["opening_stock"]
        inv_doc = {
            "product_id": p_id,
            "sku": p["sku"],
            "product_name": p["name"],
            "total_stock": stock,
            "reserved_stock": 0,
            "available_stock": stock,
            "low_stock_threshold": p["low_stock_threshold"],
            "last_updated": now,
        }
        await db["inventory"].insert_one(inv_doc)

        # Log
        await db["inventory_logs"].insert_one({
            "product_id": p_id,
            "sku": p["sku"],
            "product_name": p["name"],
            "action": InventoryAction.STOCK_IN.value,
            "quantity_change": stock,
            "previous_available": 0,
            "new_available": stock,
            "previous_reserved": 0,
            "new_reserved": 0,
            "performed_by": "superadmin@example.com",
            "notes": "Initial inventory seed batch",
            "created_at": now,
        })

    print(f"Seeded {len(products_raw)} wholesale products with tiered pricing and inventory levels.")

    # --------------------------------------------------------------------------
    # 5. Seed Sample Requirements
    # --------------------------------------------------------------------------
    reqs = [
        {
            "customer_id": satara_user_id,
            "customer_name": "Vikram Jadhav",
            "customer_business_name": "Mahalaxmi Outfits",
            "customer_mobile": "9820055555",
            "customer_city": "Satara",
            "product_category": "Women's Kurtis",
            "product_title": "Festive Rayon Anarkali with Dupatta sets",
            "quantity": 100,
            "preferred_colors": ["Pink", "Wine", "Navy Blue"],
            "preferred_sizes": ["M", "L", "XL"],
            "target_budget": 45000.0,
            "delivery_city": "Satara",
            "delivery_state": "Maharashtra",
            "notes": "Need high quality festive stock before upcoming regional festival season.",
            "status": RequirementStatus.PENDING.value,
            "quote": None,
            "created_at": now,
            "updated_at": now,
        },
        {
            "customer_id": nashik_user_id,
            "customer_name": "Sunita Patil",
            "customer_business_name": "Sai Collections",
            "customer_mobile": "9820044444",
            "customer_city": "Nashik",
            "product_category": "Sarees",
            "product_title": "Pure Chanderi Silk Handloom Sarees",
            "quantity": 50,
            "preferred_colors": ["Yellow", "Red", "Green"],
            "preferred_sizes": ["Free Size"],
            "target_budget": 35000.0,
            "delivery_city": "Nashik",
            "delivery_state": "Maharashtra",
            "notes": "Wedding season bulk requirement.",
            "status": RequirementStatus.QUOTED.value,
            "quote": {
                "quoted_price_per_unit": 680.0,
                "total_quoted_price": 34000.0,
                "estimated_fulfillment_days": 4,
                "admin_notes": "We have 50 pieces ready in our Bhiwandi warehouse. Can dispatch immediately.",
                "suggested_product_ids": [],
            },
            "created_at": now,
            "updated_at": now,
        },
    ]
    await db["requirements"].insert_many(reqs)
    print("Seeded sample bulk requirements.")

    # --------------------------------------------------------------------------
    # 6. Seed Sample Orders
    # --------------------------------------------------------------------------
    sample_order = {
        "order_number": generate_order_number(),
        "customer_id": pune_user_id,
        "customer_name": "Rahul Deshmukh",
        "customer_business_name": "Rahul Fashion Store",
        "customer_city": "Pune",
        "customer_mobile": "9820033333",
        "items": [
            {
                "product_id": "seed-kurti-1",
                "sku": "KRT-001",
                "product_name": "Women's Pure Cotton Anarkali Kurti (Pink Floral)",
                "product_image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
                "quantity": 25,
                "selected_size": "L",
                "selected_color": "Pink",
                "unit_price": 500.0,  # Tier 1 applied
                "discount": 1250.0,
                "subtotal": 12500.0,
            }
        ],
        "subtotal": 12500.0,
        "discount": 0.0,
        "tax": 625.0,
        "shipping_charge": 0.0,
        "total_amount": 13125.0,
        "shipping_address": addresses_data[0],
        "payment_method": PaymentMethod.COD.value,
        "payment_status": PaymentStatus.PENDING.value,
        "order_status": OrderStatus.CONFIRMED.value,
        "courier_name": "VRL Logistics",
        "tracking_number": "VRL-PUN-98213",
        "expected_delivery_date": None,
        "notes": "Deliver before weekend opening.",
        "created_at": now,
        "updated_at": now,
    }
    await db["orders"].insert_one(sample_order)
    print("Seeded sample order.")

    print("\n=======================================================")
    print("[SUCCESS] DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("=======================================================")
    print("Development Test Credentials:")
    print("1. Super Admin: superadmin@example.com / Password@123")
    print("2. Admin:       admin@example.com      / Password@123")
    print("3. Shopkeeper:  pune.boutique@example.com / Password@123")
    print("4. Shopkeeper:  nashik.traders@example.com / Password@123")
    print("5. Shopkeeper:  satara.retail@example.com  / Password@123")
    print("=======================================================\n")


if __name__ == "__main__":
    asyncio.run(seed_database())
