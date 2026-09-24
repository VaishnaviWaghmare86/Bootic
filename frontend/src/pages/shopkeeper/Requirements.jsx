import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Sparkles, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-900/10 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
            <span>Custom Bulk Requests</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Custom Garment Requirements & Bulk Quotes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Looking for customized fabrics, unique color runs, or volume lots? Submit your inquiry for a direct wholesale quotation.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/25 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Submit Bulk Inquiry
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-emerald-800 font-extrabold">Loading your custom inquiries...</div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-20 bootic-card p-10 max-w-xl mx-auto">
          <ClipboardList className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-900">No Custom Inquiries Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-medium">
            Submit your specific garment lot requirement directly to our Mumbai warehouse team.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20"
          >
            Submit First Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="bootic-card p-6 bootic-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-base font-black text-slate-900 block">
                      {req.product_category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Submitted on {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Requested Volume:</span>
                    <span className="font-black text-slate-900">{req.quantity} pieces</span>
                  </div>
                  {req.target_budget && (
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Target Budget:</span>
                      <span className="font-black text-emerald-800">₹{req.target_budget?.toLocaleString()}</span>
                    </div>
                  )}
                  {req.preferred_colors?.length > 0 && (
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Preferred Colors:</span>
                      <span className="font-bold text-slate-700">{req.preferred_colors.join(', ')}</span>
                    </div>
                  )}
                  {req.description && (
                    <p className="text-slate-600 mt-2 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/80 italic text-[11px]">
                      "{req.description}"
                    </p>
                  )}
                </div>

                {/* Wholesaler Quotation Reply */}
                {req.quote && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Wholesaler Quotation Received
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">Offered Unit Price:</span>
                      <strong className="text-emerald-950 text-sm">₹{req.quote.quoted_price_per_unit} / pc</strong>
                    </div>
                    <div className="flex justify-between text-xs font-medium mt-1">
                      <span className="text-slate-600">Total Lot Quote:</span>
                      <strong className="text-emerald-950 font-black">₹{req.quote.total_quoted_price?.toLocaleString()}</strong>
                    </div>
                    {req.quote.admin_notes && (
                      <p className="text-[11px] text-emerald-800 mt-2 font-medium">
                        Notes: {req.quote.admin_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Submit Custom Garment Request
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Garment Category
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_category}
                  onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                  placeholder="e.g. Bandhani Sarees, Pure Rayon Kurtis"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity Needed (Pieces)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.target_budget}
                    onChange={(e) => setFormData({ ...formData, target_budget: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Colors / Patterns
                </label>
                <input
                  type="text"
                  value={formData.preferred_colors}
                  onChange={(e) => setFormData({ ...formData, preferred_colors: e.target.value })}
                  placeholder="e.g. Pink, Wine, Emerald, Foil Print"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Specifications / Fabric Requirements
                </label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Provide fabric GSM, embroidery style, or delivery urgency..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                ></textarea>
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
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20"
                >
                  {submitting ? 'Submitting...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requirements;
