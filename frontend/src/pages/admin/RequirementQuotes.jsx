import React, { useState, useEffect } from 'react';
import { ClipboardList, Sparkles, Check, X, Send, ArrowUpRight } from 'lucide-react';
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-900/10 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
            <span>Custom Bulk Inquiries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Regional Retailer Custom Bulk Requirements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review custom garment inquiries, offer competitive volume price quotes, and specify fulfillment timelines.
          </p>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bootic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f2f8f5] border-b border-emerald-900/10 text-emerald-900 font-black uppercase tracking-wider">
              <tr>
                <th className="p-4">Category / Inquired Details</th>
                <th className="p-4">Boutique / Retailer</th>
                <th className="p-4">Requested Pieces</th>
                <th className="p-4">Target Budget</th>
                <th className="p-4">Destination City</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quotation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    Loading bulk requirements...
                  </td>
                </tr>
              ) : requirements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    No custom requirements found.
                  </td>
                </tr>
              ) : (
                requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4">
                      <strong className="text-slate-900 block font-black text-sm">
                        {req.product_category}
                      </strong>
                      <p className="text-slate-500 mt-0.5 line-clamp-1 max-w-xs">{req.description}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{req.business_name || 'Boutique Buyer'}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{req.contact_person}</span>
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      {req.quantity} pcs
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-black text-emerald-900">
                        ₹{req.target_budget?.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        (₹{Math.round(req.target_budget / req.quantity)}/pc target)
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {req.city || 'Pune'}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openQuoteModal(req)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-black shadow-sm"
                      >
                        {req.status === 'QUOTED' ? 'Edit Quote' : 'Send Quote'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Submission Modal */}
      {showQuoteModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Submit Wholesale Quote
              </h2>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 my-4 text-xs">
              <span className="text-slate-500 font-semibold block">Inquired Item:</span>
              <p className="font-black text-slate-900">{selectedReq.product_category} ({selectedReq.quantity} pcs)</p>
              <p className="text-slate-600 mt-1 font-medium">Buyer Target: ₹{selectedReq.target_budget?.toLocaleString()}</p>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quoted Price Per Unit (₹)
                </label>
                <input
                  type="number"
                  required
                  value={quoteForm.quoted_price_per_unit}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quoted_price_per_unit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                  Total Quote: ₹{(parseFloat(quoteForm.quoted_price_per_unit || 0) * selectedReq.quantity).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estimated Fulfillment (Days)
                </label>
                <input
                  type="number"
                  required
                  value={quoteForm.estimated_fulfillment_days}
                  onChange={(e) => setQuoteForm({ ...quoteForm, estimated_fulfillment_days: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Wholesaler Proposal Notes
                </label>
                <textarea
                  rows="2"
                  value={quoteForm.admin_notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, admin_notes: e.target.value })}
                  placeholder="Details on fabric blend, packaging, or dispatch ready time..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20"
                >
                  Send Proposal Quote
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
