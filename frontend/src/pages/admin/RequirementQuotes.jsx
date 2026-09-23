import React, { useState, useEffect } from 'react';
import { ClipboardList, Sparkles, Check, X, Send } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export const RequirementQuotes = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const [quoteForm, setQuoteForm] = useState({
    quoted_price_per_unit: 400,
    estimated_fulfillment_days: 4,
    admin_notes: 'Available from Bhiwandi wholesale stock for immediate dispatch.',
    status: 'QUOTED',
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

  const openQuoteModal = (req) => {
    setSelectedReq(req);
    const unitTarget = req.target_budget && req.quantity ? Math.round(req.target_budget / req.quantity) : 400;
    setQuoteForm({
      quoted_price_per_unit: unitTarget,
      estimated_fulfillment_days: 4,
      admin_notes: 'We have matching styles ready in our warehouse for direct dispatch.',
      status: 'QUOTED',
    });
    setShowQuoteModal(true);
  };

  const handleSendQuote = async (e) => {
    e.preventDefault();
    try {
      const totalQuoted = parseFloat(quoteForm.quoted_price_per_unit) * selectedReq.quantity;
      await api.patch(`/requirements/${selectedReq.id}`, {
        status: quoteForm.status,
        quote: {
          quoted_price_per_unit: parseFloat(quoteForm.quoted_price_per_unit),
          total_quoted_price: totalQuoted,
          estimated_fulfillment_days: parseInt(quoteForm.estimated_fulfillment_days),
          admin_notes: quoteForm.admin_notes,
          suggested_product_ids: [],
        },
      });

      setShowQuoteModal(false);
      fetchRequirements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send quote');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Shopkeeper Custom Requirements & Bulk Inquiries
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review customized garment volume requests from regional retailers and provide wholesale price quotations.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Category / Requirements</th>
              <th className="p-4">Boutique / Buyer</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Target Budget</th>
              <th className="p-4">City</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Quotation Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requirements.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <strong className="text-slate-900 block font-bold text-xs">
                    {req.product_category}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Colors: {req.preferred_colors?.join(', ')} • Sizes: {req.preferred_sizes?.join(', ')}
                  </span>
                  {req.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">"{req.notes}"</p>}
                </td>
                <td className="p-4">
                  <strong className="text-slate-900 block font-bold">
                    {req.customer_business_name || req.customer_name}
                  </strong>
                  <span className="text-[10px] text-slate-400">{req.customer_mobile}</span>
                </td>
                <td className="p-4 font-black text-slate-900 text-sm">{req.quantity} pcs</td>
                <td className="p-4 font-bold text-slate-700">
                  {req.target_budget ? `₹${req.target_budget.toLocaleString()}` : 'Open'}
                </td>
                <td className="p-4 font-semibold text-slate-800">{req.delivery_city}</td>
                <td className="p-4">
                  <StatusBadge status={req.status} />
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => openQuoteModal(req)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {req.quote ? 'Edit Quote' : 'Send Quote'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Provide Wholesale Quotation
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl my-3 space-y-1">
              <p>Category: <strong>{selectedReq.product_category}</strong></p>
              <p>Requested Quantity: <strong>{selectedReq.quantity} Pieces</strong></p>
              <p>Target City: <strong>{selectedReq.delivery_city}</strong></p>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quoted Wholesale Unit Price (₹/pc)</label>
                <input
                  type="number"
                  required
                  value={quoteForm.quoted_price_per_unit}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quoted_price_per_unit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-rose-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Total Quoted Value: <strong>₹{(quoteForm.quoted_price_per_unit * selectedReq.quantity).toLocaleString()}</strong>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Est. Fulfillment Days</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quoteForm.estimated_fulfillment_days}
                  onChange={(e) => setQuoteForm({ ...quoteForm, estimated_fulfillment_days: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wholesaler Message / Notes</label>
                <textarea
                  rows={2}
                  value={quoteForm.admin_notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, admin_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-500/20"
                >
                  Submit Quote to Shopkeeper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementQuotes;
