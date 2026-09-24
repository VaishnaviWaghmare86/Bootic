import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Layers, Search, Check, Sparkles, Image, DollarSign, Boxes, X } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    fabric: 'Cotton',
    color: 'Red',
    available_sizes: 'M, L, XL, XXL',
    gender: 'WOMEN',
    wholesale_price: 500,
    minimum_order_quantity: 10,
    opening_stock: 100,
    low_stock_threshold: 20,
    product_images: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    tier1_min: 10,
    tier1_max: 49,
    tier1_price: 450,
    tier2_min: 50,
    tier2_max: '',
    tier2_price: 400,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        api.get(`/products?limit=100&search=${encodeURIComponent(search)}`),
        api.get('/categories'),
      ]);
      if (pRes.data.success) setProducts(pRes.data.data);
      if (cRes.data.success) {
        setCategories(cRes.data.data);
        if (cRes.data.data.length > 0 && !formData.category_id) {
          setFormData((prev) => ({ ...prev, category_id: cRes.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      category_id: categories[0]?.id || '',
      fabric: 'Cotton',
      color: 'Pink',
      available_sizes: 'M, L, XL, XXL',
      gender: 'WOMEN',
      wholesale_price: 500,
      minimum_order_quantity: 10,
      opening_stock: 100,
      low_stock_threshold: 20,
      product_images: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
      tier1_min: 10,
      tier1_max: 49,
      tier1_price: 450,
      tier2_min: 50,
      tier2_max: '',
      tier2_price: 400,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tier_prices = [];
      if (formData.tier1_min && formData.tier1_price) {
        tier_prices.push({
          min_quantity: parseInt(formData.tier1_min),
          max_quantity: formData.tier1_max ? parseInt(formData.tier1_max) : null,
          price_per_unit: parseFloat(formData.tier1_price),
        });
      }
      if (formData.tier2_min && formData.tier2_price) {
        tier_prices.push({
          min_quantity: parseInt(formData.tier2_min),
          max_quantity: formData.tier2_max ? parseInt(formData.tier2_max) : null,
          price_per_unit: parseFloat(formData.tier2_price),
        });
      }

      const payload = {
        name: formData.name,
        sku: formData.sku,
        category_id: formData.category_id,
        fabric: formData.fabric,
        color: formData.color,
        available_sizes: formData.available_sizes.split(',').map((s) => s.trim()),
        gender: formData.gender,
        wholesale_price: parseFloat(formData.wholesale_price),
        minimum_order_quantity: parseInt(formData.minimum_order_quantity),
        opening_stock: parseInt(formData.opening_stock),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        product_images: formData.product_images.split(',').map((u) => u.trim()),
        tier_prices,
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to discontinue this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-900/10 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Product Catalog Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Wholesale Catalog & Quantity Tier Pricing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage wholesale styles, fabric descriptions, quantity price discounts, and batch stock levels.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Add Wholesale Style
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bootic-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, Kurti, Saree, Fabric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-emerald-50/40 border border-emerald-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
            {products.length} Styles Total
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bootic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f2f8f5] border-b border-emerald-900/10 text-emerald-900 font-black uppercase tracking-wider">
              <tr>
                <th className="p-4">Product / SKU</th>
                <th className="p-4">Category / Fabric</th>
                <th className="p-4">Wholesale Price</th>
                <th className="p-4">Volume Tiers</th>
                <th className="p-4">MOQ</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    Loading wholesale products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={
                          p.product_images?.[0] ||
                          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100'
                        }
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shadow-sm"
                      />
                      <div>
                        <p className="font-black text-slate-900 line-clamp-1">{p.name}</p>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                          SKU: {p.sku}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block">{p.category_name || 'Ethnic Wear'}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {p.fabric} • {p.color}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-black text-slate-900">
                        ₹{p.wholesale_price?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">Base price</span>
                    </td>
                    <td className="p-4">
                      {p.tier_prices && p.tier_prices.length > 0 ? (
                        <div className="space-y-1">
                          {p.tier_prices.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md block w-fit"
                            >
                              {t.min_quantity}
                              {t.max_quantity ? `-${t.max_quantity}` : '+'} pcs: ₹{t.price_per_unit}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Standard only</span>
                      )}
                    </td>
                    <td className="p-4 font-black text-slate-800">
                      {p.minimum_order_quantity} pcs
                    </td>
                    <td className="p-4">
                      <StatusBadge status={p.stock_quantity === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'} />
                      <span className="text-[10px] font-bold text-slate-500 block mt-1">
                        Stock: {p.stock_quantity ?? 100}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Discontinue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                Add Wholesale Clothing Style
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Style Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Bandhani Print Cotton Kurti"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. KRT-099"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fabric
                  </label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wholesale Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.wholesale_price}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    MOQ (Pieces)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.minimum_order_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Opening Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.opening_stock}
                    onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Tier Pricing */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider block mb-2">
                  Wholesale Volume Tier Pricing
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Tier 1 Qty (10-49)</label>
                    <input
                      type="number"
                      placeholder="Price e.g. 450"
                      value={formData.tier1_price}
                      onChange={(e) => setFormData({ ...formData, tier1_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Tier 2 Qty (50+)</label>
                    <input
                      type="number"
                      placeholder="Price e.g. 400"
                      value={formData.tier2_price}
                      onChange={(e) => setFormData({ ...formData, tier2_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Image URL</label>
                    <input
                      type="text"
                      value={formData.product_images}
                      onChange={(e) => setFormData({ ...formData, product_images: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20"
                >
                  Save Style
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
