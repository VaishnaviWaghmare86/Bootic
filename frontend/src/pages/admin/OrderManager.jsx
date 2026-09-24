import React, { useState, useEffect } from 'react';
import { Layers, Truck, CheckCircle2, Clock, XCircle, Search, Sparkles, X, ArrowUpRight } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [search, setSearch] = useState('');

  const [statusForm, setStatusForm] = useState({
    order_status: 'CONFIRMED',
    courier_name: 'VRL Logistics',
    tracking_number: '',
    notes: '',
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders?limit=100&search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const openStatusUpdate = (order) => {
    setSelectedOrder(order);
    setStatusForm({
      order_status: order.order_status,
      courier_name: order.courier_name || 'VRL Logistics',
      tracking_number: order.tracking_number || '',
      notes: '',
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/orders/${selectedOrder.id}/status`, statusForm);
      setShowStatusModal(false);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-900/10 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fulfillment Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Wholesale Order Fulfillment & Logistics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process incoming boutique orders, update courier dispatch tracking, and manage delivery status.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bootic-card p-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Boutique name, or City (Mumbai, Pune, Surat)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-emerald-50/40 border border-emerald-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bootic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f2f8f5] border-b border-emerald-900/10 text-emerald-900 font-black uppercase tracking-wider">
              <tr>
                <th className="p-4">Order # / Date</th>
                <th className="p-4">Boutique / City</th>
                <th className="p-4">Pieces Ordered</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Courier Logistics</th>
                <th className="p-4 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const totalPieces = order.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0;
                  return (
                    <tr key={order.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-4">
                        <span className="font-black text-slate-900 block text-xs">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-900 block">
                          {order.customer_name || 'Regional Boutique'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                          {order.shipping_address?.city || 'Mumbai'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-900">{totalPieces} pcs</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Across {order.items?.length || 1} styles
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-black text-emerald-900">
                          ₹{order.total_amount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={order.order_status} />
                      </td>
                      <td className="p-4">
                        {order.tracking_number ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">{order.courier_name}</span>
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              {order.tracking_number}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Pending Courier Info</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openStatusUpdate(order)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-sm"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Update Fulfillment & Tracking
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 font-medium">
              Order: <strong className="text-slate-900">{selectedOrder.order_number}</strong>
            </p>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Workflow Status
                </label>
                <select
                  value={statusForm.order_status}
                  onChange={(e) => setStatusForm({ ...statusForm, order_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="CONFIRMED">CONFIRMED (Stock Reserved)</option>
                  <option value="PROCESSING">PROCESSING (Packing in Bhiwandi)</option>
                  <option value="SHIPPED">SHIPPED (Dispatched with Courier)</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED (Stock Restocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Courier / Logistics Partner
                </label>
                <input
                  type="text"
                  value={statusForm.courier_name}
                  onChange={(e) => setStatusForm({ ...statusForm, courier_name: e.target.value })}
                  placeholder="e.g. VRL Logistics, SafeExpress, Trackon"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Waybill / Tracking Number (LR #)
                </label>
                <input
                  type="text"
                  value={statusForm.tracking_number}
                  onChange={(e) => setStatusForm({ ...statusForm, tracking_number: e.target.value })}
                  placeholder="e.g. VRL-MUM-89210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20"
                >
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
