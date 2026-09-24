import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Info, Check, Tag, Sparkles, Package } from 'lucide-react';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null); // for tier modal
  const [orderQty, setOrderQty] = useState(10);
  const [selectedSize, setSelectedSize] = useState('L');
  const [cartSuccess, setCartSuccess] = useState('');
  const [cartError, setCartError] = useState('');

  const { addToCart } = useCart();
  const { isShopkeeper } = useAuth();

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/products?limit=50&search=${encodeURIComponent(search)}`;
      if (selectedCategory) url += `&category_id=${selectedCategory}`;
      if (selectedGender) url += `&gender=${selectedGender}`;
      const res = await api.get(url);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedGender, search]);

  const openProductModal = (prod) => {
    setSelectedProduct(prod);
    setOrderQty(prod.minimum_order_quantity || 10);
    setSelectedSize(prod.available_sizes?.[0] || 'L');
    setCartSuccess('');
    setCartError('');
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    setCartError('');
    setCartSuccess('');

    const res = await addToCart(
      selectedProduct.id,
      parseInt(orderQty),
      selectedSize,
      selectedProduct.color
    );
    if (res.success) {
      setCartSuccess(`Added ${orderQty} pieces to your wholesale cart!`);
      setTimeout(() => {
        setSelectedProduct(null);
      }, 1200);
    } else {
      setCartError(res.message);
    }
  };

  // Helper to calculate price preview based on qty
  const getPreviewPrice = (prod, qty) => {
    if (!prod) return 0;
    const base = prod.wholesale_price;
    if (!prod.tier_prices || prod.tier_prices.length === 0) return base;

    for (const t of prod.tier_prices) {
      if (t.max_quantity) {
        if (qty >= t.min_quantity && qty <= t.max_quantity) return t.price_per_unit;
      } else {
        if (qty >= t.min_quantity) return t.price_per_unit;
      }
    }
    return base;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Direct from Mumbai Textile Warehouse
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Wholesale Clothing Catalog
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Bulk manufacturing prices for regional boutiques in Pune, Nashik, Kolhapur, Satara & beyond. Tiered wholesale volume discounts applied automatically!
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, fabric (Cotton, Rayon, Silk), SKU, or color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">All Genders</option>
              <option value="WOMEN">Women's Wear</option>
              <option value="MEN">Men's Wear</option>
              <option value="KIDS">Kids Wear</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === ''
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-20">
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Loading wholesale catalog...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={
                    prod.product_images?.[0] ||
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600'
                  }
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                  SKU: {prod.sku}
                </div>
                {prod.available_quantity <= 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-rose-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{prod.category_name}</span>
                    <span className="font-semibold text-emerald-600">
                      {prod.available_quantity} in stock
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {prod.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {prod.fabric && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {prod.fabric}
                      </span>
                    )}
                    {prod.color && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {prod.color}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-xs text-slate-400">Wholesale from</span>
                      <p className="text-lg font-extrabold text-slate-900">
                        ₹
                        {prod.tier_prices?.length
                          ? prod.tier_prices[prod.tier_prices.length - 1].price_per_unit
                          : prod.wholesale_price}
                        <span className="text-xs font-normal text-slate-500"> /pc</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      MOQ: {prod.minimum_order_quantity} pcs
                    </span>
                  </div>

                  <button
                    onClick={() => openProductModal(prod)}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    View Wholesale Slabs & Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wholesale Tier Pricing & Buy Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                  {selectedProduct.category_name} • SKU: {selectedProduct.sku}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Pricing Slabs Table */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Wholesale Volume Price Slabs:
              </label>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Quantity Slab</th>
                      <th className="p-2.5">Wholesale Price / Piece</th>
                      <th className="p-2.5 text-right">Saving</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr
                      className={
                        orderQty < (selectedProduct.tier_prices?.[0]?.min_quantity || 999)
                          ? 'bg-rose-50/50 font-bold'
                          : ''
                      }
                    >
                      <td className="p-2.5">Base MOQ ({selectedProduct.minimum_order_quantity}+ pcs)</td>
                      <td className="p-2.5 font-bold text-slate-900">
                        ₹{selectedProduct.wholesale_price}
                      </td>
                      <td className="p-2.5 text-right text-slate-400">Standard</td>
                    </tr>
                    {selectedProduct.tier_prices?.map((tier, idx) => {
                      const isMatching =
                        tier.max_quantity
                          ? orderQty >= tier.min_quantity && orderQty <= tier.max_quantity
                          : orderQty >= tier.min_quantity;

                      const saving = Math.round(
                        ((selectedProduct.wholesale_price - tier.price_per_unit) /
                          selectedProduct.wholesale_price) *
                          100
                      );

                      return (
                        <tr key={idx} className={isMatching ? 'bg-rose-50/70 font-bold text-rose-900' : ''}>
                          <td className="p-2.5">
                            {tier.min_quantity} - {tier.max_quantity ? `${tier.max_quantity} pcs` : 'Above'}
                          </td>
                          <td className="p-2.5 font-bold text-rose-600">
                            ₹{tier.price_per_unit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">
                            Save {saving}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Size:
              </label>
              <div className="flex items-center gap-2">
                {selectedProduct.available_sizes?.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedSize === sz
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Input */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Order Quantity (Pieces):
                </label>
                <span className="text-xs text-slate-500">
                  Stock: <strong className="text-slate-900">{selectedProduct.available_quantity}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={selectedProduct.minimum_order_quantity}
                  max={selectedProduct.available_quantity}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 outline-none text-center"
                />
                <div className="text-xs text-slate-600">
                  Effective Unit Price: <strong className="text-rose-600 text-sm">₹{getPreviewPrice(selectedProduct, orderQty)}</strong>
                  <span className="block font-medium text-slate-500">
                    Est. Subtotal: ₹{(getPreviewPrice(selectedProduct, orderQty) * orderQty).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {cartError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {cartError}
              </div>
            )}
            {cartSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" /> {cartSuccess}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                disabled={selectedProduct.available_quantity <= 0}
                className="w-2/3 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Wholesale Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
