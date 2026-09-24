import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Info, Check, Tag, Sparkles, Package, ArrowUpRight, X } from 'lucide-react';
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
  const [selectedProduct, setSelectedProduct] = useState(null);
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-900/10 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Wholesale Clothing Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Explore Wholesale Apparel Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct warehouse pricing from Mumbai with volume tiered quantity price discounts for boutiques.
          </p>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bootic-card p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Kurtis, Sarees, Dresses, Fabrics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-emerald-50/40 border border-emerald-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              selectedCategory === ''
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-emerald-50/60 text-slate-700 hover:bg-emerald-100/60 border border-emerald-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-50/60 text-slate-700 hover:bg-emerald-100/60 border border-emerald-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 text-center text-emerald-800 font-extrabold">
          Loading wholesale collections...
        </div>
      ) : products.length === 0 ? (
        <div className="bootic-card p-12 text-center text-slate-400 font-bold">
          No wholesale garments matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bootic-card bootic-card-hover overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 rounded-t-3xl">
                  <img
                    src={
                      prod.product_images?.[0] ||
                      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500'
                    }
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-[10px] font-black tracking-wider uppercase border border-emerald-500/30 shadow-md">
                      MOQ: {prod.minimum_order_quantity} pcs
                    </span>
                    {prod.tier_prices?.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase shadow-md">
                        Volume Discount
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span>{prod.category_name || 'Ethnic Wear'}</span>
                    <span>SKU: {prod.sku}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium line-clamp-1">
                    {prod.fabric} • {prod.color} • Sizes: {prod.available_sizes?.join(', ')}
                  </p>

                  {/* Pricing Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Wholesale Base</span>
                      <span className="text-base font-black text-slate-900">
                        ₹{prod.wholesale_price?.toLocaleString()}
                      </span>
                    </div>
                    {prod.tier_prices?.length > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-700 block uppercase">As low as</span>
                        <span className="text-sm font-black text-emerald-700">
                          ₹{prod.tier_prices[prod.tier_prices.length - 1]?.price_per_unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => openProductModal(prod)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" /> Select Wholesale Batch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tier Price & Add to Cart Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Select Wholesale Order Quantity
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 my-4 p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100">
              <img
                src={selectedProduct.product_images?.[0]}
                alt={selectedProduct.name}
                className="w-16 h-16 rounded-xl object-cover border border-emerald-200"
              />
              <div>
                <h4 className="text-xs font-black text-slate-900">{selectedProduct.name}</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedProduct.fabric} • Color: {selectedProduct.color}
                </p>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded mt-1 inline-block">
                  MOQ: {selectedProduct.minimum_order_quantity} pieces
                </span>
              </div>
            </div>

            {/* Volume Tiers Breakdown */}
            {selectedProduct.tier_prices?.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                  Volume Quantity Discount Tiers:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedProduct.tier_prices.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-center text-xs ${
                        orderQty >= t.min_quantity && (!t.max_quantity || orderQty <= t.max_quantity)
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-black'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-[10px] block text-slate-400 font-semibold">
                        {t.min_quantity}
                        {t.max_quantity ? `-${t.max_quantity}` : '+'} pcs
                      </span>
                      <strong className="text-sm">₹{t.price_per_unit}/pc</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Size */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Garment Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {selectedProduct.available_sizes?.map((sz) => (
                    <option key={sz} value={sz}>
                      Size {sz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Batch Pieces (Qty)
                </label>
                <input
                  type="number"
                  min={selectedProduct.minimum_order_quantity || 1}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                />
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Effective Unit Price
                </span>
                <span className="text-base font-black text-emerald-950">
                  ₹{getPreviewPrice(selectedProduct, orderQty)} / piece
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Batch Estimate
                </span>
                <span className="text-lg font-black text-emerald-950">
                  ₹{(getPreviewPrice(selectedProduct, orderQty) * orderQty).toLocaleString()}
                </span>
              </div>
            </div>

            {cartSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black text-center animate-in fade-in">
                {cartSuccess}
              </div>
            )}
            {cartError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-100 text-rose-900 text-xs font-bold text-center animate-in fade-in">
                {cartError}
              </div>
            )}

            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <ShoppingCart className="w-4 h-4" /> Add {orderQty} Pieces to Wholesale Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
