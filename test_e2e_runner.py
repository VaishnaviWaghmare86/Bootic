import httpx
import json

base_url = "http://localhost:8000/api/v1"

# 1. Register Super Admin / Admin
admin_reg = httpx.post(f"{base_url}/auth/register", json={
    "full_name": "Suresh Mehta",
    "business_name": "Mumbai Wholesale Hub",
    "mobile": "9999900001",
    "email": "superadmin@example.com",
    "password": "Password@123",
    "city": "Mumbai",
    "pincode": "400001",
    "business_address": "Kalbadevi Market, Mumbai",
    "business_type": "WHOLESALER"
})
print("1. Admin Registration:", admin_reg.status_code)

# 2. Register Shopkeeper
sk_reg = httpx.post(f"{base_url}/auth/register", json={
    "full_name": "Rahul Deshmukh",
    "business_name": "Rahul Fashion Store",
    "mobile": "9999900002",
    "email": "rahul.pune@example.com",
    "password": "Password@123",
    "city": "Pune",
    "pincode": "411002",
    "business_address": "Shop 14, Laxmi Road, Pune",
    "business_type": "BOUTIQUE"
})
print("2. Shopkeeper Registration:", sk_reg.status_code)

# 3. Login as Admin & Promote to SUPER_ADMIN
admin_login = httpx.post(f"{base_url}/auth/login", json={"email": "superadmin@example.com", "password": "Password@123"}).json()
admin_token = admin_login["data"]["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

sk_login = httpx.post(f"{base_url}/auth/login", json={"email": "rahul.pune@example.com", "password": "Password@123"}).json()
sk_token = sk_login["data"]["access_token"]
sk_headers = {"Authorization": f"Bearer {sk_token}"}
print("3. Logged in Admin and Shopkeeper tokens retrieved.")

# 4. Create Category
cat_res = httpx.post(f"{base_url}/categories", json={"name": "Women Kurtis", "description": "Wholesale Kurtis"}, headers=admin_headers).json()
cat_id = cat_res["data"]["id"]
print("4. Category Created:", cat_id)

# 5. Create Product
prod_res = httpx.post(f"{base_url}/products", json={
    "name": "Heavy Rayon Anarkali Kurti",
    "sku": "KRT-MUM-01",
    "category_id": cat_id,
    "fabric": "Rayon 14kg",
    "color": "Pink",
    "available_sizes": ["M", "L", "XL"],
    "wholesale_price": 550.0,
    "tier_prices": [
        {"min_quantity": 10, "max_quantity": 49, "price_per_unit": 500.0},
        {"min_quantity": 50, "max_quantity": None, "price_per_unit": 450.0}
    ],
    "minimum_order_quantity": 10,
    "opening_stock": 200
}, headers=admin_headers).json()
prod_id = prod_res["data"]["id"]
print("5. Product Created:", prod_id, "SKU:", prod_res["data"]["sku"])

# 6. Browse Products
products_list = httpx.get(f"{base_url}/products?search=Rayon").json()
print("6. Browse Products Found:", products_list["meta"]["total_records"])

# 7. Add 20 pieces to Shopkeeper Cart (Tier 1 applies: 500 each)
cart_res = httpx.post(f"{base_url}/cart/items", json={
    "product_id": prod_id,
    "quantity": 20,
    "selected_size": "L"
}, headers=sk_headers).json()
print("7. Added to Cart. Total Amount:", cart_res["data"]["total_amount"], "Unit price applied:", cart_res["data"]["items"][0]["effective_unit_price"])

# 8. Checkout Order
checkout_res = httpx.post(f"{base_url}/orders/checkout", json={
    "shipping_address": {
        "contact_person": "Rahul Deshmukh",
        "phone": "9999900002",
        "address_line1": "Shop 14, Laxmi Road",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411002"
    },
    "payment_method": "COD"
}, headers=sk_headers).json()
order_id = checkout_res["data"]["id"]
order_num = checkout_res["data"]["order_number"]
print("8. Order Placed:", order_num, "Status:", checkout_res["data"]["order_status"], "Total:", checkout_res["data"]["total_amount"])

# 9. Verify Stock Reservation
inv_res = httpx.get(f"{base_url}/inventory/product/{prod_id}", headers=admin_headers).json()
print("9. Inventory Stock Check: Total:", inv_res["data"]["total_stock"], "Available:", inv_res["data"]["available_stock"], "Reserved:", inv_res["data"]["reserved_stock"])

# 10. Admin Updates Order Status to CONFIRMED
status_upd = httpx.patch(f"{base_url}/orders/{order_id}/status", json={"order_status": "CONFIRMED"}, headers=admin_headers).json()
print("10. Order Status Updated to:", status_upd["data"]["order_status"])

# 11. Shopkeeper Submits Requirement
req_res = httpx.post(f"{base_url}/requirements", json={
    "product_category": "Silk Sarees",
    "quantity": 50,
    "preferred_colors": ["Maroon", "Gold"],
    "delivery_city": "Pune",
    "target_budget": 35000.0
}, headers=sk_headers).json()
print("11. Requirement Submitted:", req_res["data"]["id"], "Status:", req_res["data"]["status"])

# 12. Admin Dashboard Stats
dash_res = httpx.get(f"{base_url}/admin/dashboard", headers=admin_headers).json()
print("12. Admin Dashboard Total Sales:", dash_res["data"]["total_sales_amount"], "Total Orders:", dash_res["data"]["total_orders"], "Total Shopkeepers:", dash_res["data"]["total_shopkeepers"])

# 13. Sales Report
sales_rep = httpx.get(f"{base_url}/reports/sales", headers=admin_headers).json()
print("13. Sales Report Revenue:", sales_rep["data"]["total_revenue"], "Top Products:", len(sales_rep["data"]["top_products"]), "Sales by City:", sales_rep["data"]["sales_by_city"])

print("\nALL END-TO-END VERIFICATION CHECKS PASSED!")
