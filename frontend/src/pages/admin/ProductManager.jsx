import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Layers, Search, Check } from 'lucide-react';
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
        sku: formData.sku || null,
        category_id: formData.category_id,
        fabric: formData.fabric,
        color: formData.color,
        available_sizes: formData.available_sizes.split(',').map((s) => s.trim()).filter(Boolean),
        gender: formData.gender,
        wholesale_price: parseFloat(formData.wholesale_price),
        minimum_order_quantity: parseInt(formData.minimum_order_quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        product_images: formData.product_images.split(',').map((s) => s.trim()).filter(Boolean),
        tier_prices,
      };

      if (!editingId) {
        payload.opening_stock = parseInt(formData.opening_stock);
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${editingId}`, payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Mark this product as Discontinued?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Products & Pricing Slabs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage catalog styles, assign wholesale volume tier discounts, and set Minimum Order Quantities (MOQ).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-xs flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Wholesale Product
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by SKU, name, fabric, or color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">SKU / Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Wholesale Price</th>
              <th className="p-4">Tier Pricing Slabs</th>
              <th className="p-4">MOQ</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.product_images?.[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200'}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-100"
                    />
                    <div>
                      <span className="font-extrabold text-rose-600 text-[10px] block">{p.sku}</span>
                      <strong className="text-slate-900 font-bold text-xs">{p.name}</strong>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-semibold text-slate-700">{p.category_name}</td>
                <td className="p-4 font-extrabold text-slate-900">₹{p.wholesale_price}</td>
                <td className="p-4">
                  {p.tier_prices?.length ? (
                    <div className="space-y-0.5">
                      {p.tier_prices.map((t, idx) => (
                        <span key={idx} className="block text-[10px] text-slate-600">
                          {t.min_quantity}+{t.max_quantity ? `-${t.max_quantity}` : ''} pcs: <strong className="text-rose-600">₹{t.price_per_unit}</strong>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Flat Base Price</span>
                  )}
                </td>
                <td className="p-4 font-bold text-amber-700">{p.minimum_order_quantity} pcs</td>
                <td className="p-4 font-extrabold text-slate-900">{p.available_quantity} pcs</td>
                <td className="p-4"><StatusBadge status={p.status} /></td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Discontinue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Add Wholesale Clothing Style
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Women Pure Cotton Anarkali Kurti"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU (Auto-generated if empty)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="KRT-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fabric</label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    placeholder="100% Cotton, Rayon"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="WOMEN">Women</option>
                    <option value="MEN">Men</option>
                    <option value="KIDS">Kids</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Wholesale Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.wholesale_price}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MOQ (Pieces)</label>
                  <input
                    type="number"
                    required
                    value={formData.minimum_order_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Opening Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.opening_stock}
                    onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Wholesale Tier Slabs Builder */}
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-3">
                <span className="font-bold text-rose-900 block uppercase tracking-wider text-[11px]">
                  Configure Wholesale Volume Tier Discounts:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Tier 1: Min Pcs</label>
                    <input
                      type="number"
                      value={formData.tier1_min}
                      onChange={(e) => setFormData({ ...formData, tier1_min: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Tier 1: Max Pcs</label>
                    <input
                      type="number"
                      value={formData.tier1_max}
                      onChange={(e) => setFormData({ ...formData, tier1_max: e.target.value })}
                      placeholder="49"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Tier 1: Price (₹)</label>
                    <input
                      type="number"
                      value={formData.tier1_price}
                      onChange={(e) => setFormData({ ...formData, tier1_price: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Tier 2: Min Pcs</label>
                    <input
                      type="number"
                      value={formData.tier2_min}
                      onChange={(e) => setFormData({ ...formData, tier2_min: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Tier 2: Max (Blank for 100+)</label>
                    <input
                      type="number"
                      value={formData.tier2_max}
                      onChange={(e) => setFormData({ ...formData, tier2_max: e.target.value })}
                      placeholder="Above"
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Tier 2: Price (₹)</label>
                    <input
                      type="number"
                      value={formData.tier2_price}
                      onChange={(e) => setFormData({ ...formData, tier2_price: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Image URL</label>
                <input
                  type="text"
                  value={formData.product_images}
                  onChange={(e) => setFormData({ ...formData, product_images: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-500/20"
                >
                  Save Wholesale Product
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
