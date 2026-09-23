import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export const Requirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    product_category: "Women's Kurtis",
    product_title: '',
    quantity: 100,
    preferred_colors: 'Pink, Blue, Wine',
    preferred_sizes: 'M, L, XL',
    target_budget: '',
    delivery_city: user?.city || 'Satara',
    notes: '',
  });

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requirements?limit=50');
      if (res.data.success) {
        setRequirements(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        target_budget: formData.target_budget ? parseFloat(formData.target_budget) : null,
        preferred_colors: formData.preferred_colors.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_sizes: formData.preferred_sizes.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const res = await api.post('/requirements', payload);
      if (res.data.success) {
        setShowModal(false);
        fetchRequirements();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit requirement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Custom Bulk Requirements & Inquiries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Looking for customized fabrics, specific colors, or large lots not listed in catalog? Submit your requirement for a wholesale quotation.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-xs flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Submit Bulk Requirement
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-semibold">Loading requirements...</div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Custom Requirements Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Submit your specific fabric, color, or volume request directly to our Mumbai warehouse team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                    Category: {req.product_category}
                  </span>
                  <StatusBadge status={req.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">
                  {req.product_title || req.product_category}
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity</span>
                    <strong className="text-slate-900 text-sm">{req.quantity} Pieces</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Budget</span>
                    <strong className="text-slate-900 text-sm">
                      {req.target_budget ? `₹${req.target_budget.toLocaleString()}` : 'Open'}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-600">
                  <p>
                    <strong>Preferred Colors:</strong> {req.preferred_colors?.join(', ') || 'Any'}
                  </p>
                  <p>
                    <strong>Preferred Sizes:</strong> {req.preferred_sizes?.join(', ') || 'Any'}
                  </p>
                  <p>
                    <strong>Destination City:</strong> {req.delivery_city}
                  </p>
                  {req.notes && (
                    <p className="italic text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg">
                      "{req.notes}"
                    </p>
                  )}
                </div>

                {/* Admin Quote Box */}
                {req.quote && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Wholesaler Quotation
                    </span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs text-emerald-900">
                        Quoted Price: <strong className="text-sm font-extrabold">₹{req.quote.quoted_price_per_unit}/pc</strong>
                      </p>
                      <p className="text-xs text-emerald-900 font-extrabold">
                        Total: ₹{req.quote.total_quoted_price?.toLocaleString()}
                      </p>
                    </div>
                    {req.quote.admin_notes && (
                      <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                        Note: {req.quote.admin_notes}
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                      Est. Fulfillment: {req.quote.estimated_fulfillment_days} days
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                Submitted on {new Date(req.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Submit Bulk Requirement
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Category</label>
                <input
                  type="text"
                  required
                  value={formData.product_category}
                  onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                  placeholder="e.g. Women's Kurtis, Sarees, Party Gowns"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Required Quantity (Pieces)</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Colors</label>
                  <input
                    type="text"
                    value={formData.preferred_colors}
                    onChange={(e) => setFormData({ ...formData, preferred_colors: e.target.value })}
                    placeholder="Pink, Blue, Wine"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Sizes</label>
                  <input
                    type="text"
                    value={formData.preferred_sizes}
                    onChange={(e) => setFormData({ ...formData, preferred_sizes: e.target.value })}
                    placeholder="M, L, XL, Free Size"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.target_budget}
                    onChange={(e) => setFormData({ ...formData, target_budget: e.target.value })}
                    placeholder="40000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery City</label>
                  <input
                    type="text"
                    required
                    value={formData.delivery_city}
                    onChange={(e) => setFormData({ ...formData, delivery_city: e.target.value })}
                    placeholder="Pune, Satara, Nashik"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Specific embroidery, neck pattern, or packaging instructions..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit to Wholesaler'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requirements;
