import React, { useState, useEffect } from 'react';
import { Layers, Truck, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Wholesale Order Fulfillment & Tracking
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process incoming boutique orders, update dispatch/courier tracking numbers, and manage delivery status.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Shopkeeper name, boutique, or city (Pune, Nashik)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Order # / Date</th>
              <th className="p-4">Shopkeeper / City</th>
              <th className="p-4">Items / Total Pieces</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Courier & Tracking</th>
              <th className="p-4 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const totalPieces = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
              return (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <span className="font-extrabold text-slate-900 block">{order.order_number}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <strong className="text-slate-900 block font-bold">
                      {order.customer_business_name || order.customer_name}
                    </strong>
                    <span className="text-[10px] text-slate-500">
                      {order.customer_city || order.shipping_address?.city} • {order.customer_mobile}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800">{order.items?.length} Categories</span>
                    <span className="block text-[10px] text-slate-500">{totalPieces} Total Pieces</span>
                  </td>
                  <td className="p-4 font-black text-rose-600 text-sm">
                    ₹{order.total_amount?.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={order.order_status} />
                  </td>
                  <td className="p-4">
                    {order.courier_name ? (
                      <div>
                        <span className="font-bold text-slate-800 block">{order.courier_name}</span>
                        <span className="text-[10px] text-purple-700 font-semibold">{order.tracking_number}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Pending Dispatch</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openStatusUpdate(order)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-sm"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Update Order Status: {selectedOrder.order_number}
            </h3>
            <p className="text-slate-500 mt-2">
              Buyer: <strong>{selectedOrder.customer_business_name}</strong> ({selectedOrder.customer_city})
            </p>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Workflow Status</label>
                <select
                  value={statusForm.order_status}
                  onChange={(e) => setStatusForm({ ...statusForm, order_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  <option value="ORDER_PLACED">ORDER_PLACED</option>
                  <option value="CONFIRMED">CONFIRMED (Stock Reserved)</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED (In Transit)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED (Stock Released)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Courier / Transport Name</label>
                <input
                  type="text"
                  value={statusForm.courier_name}
                  onChange={(e) => setStatusForm({ ...statusForm, courier_name: e.target.value })}
                  placeholder="e.g. VRL Logistics, TCI Express, Delhivery"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Waybill / LR / Tracking Number</label>
                <input
                  type="text"
                  value={statusForm.tracking_number}
                  onChange={(e) => setStatusForm({ ...statusForm, tracking_number: e.target.value })}
                  placeholder="e.g. VRL-PUN-98213"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Notes</label>
                <input
                  type="text"
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  placeholder="Special handling note..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-500/20"
                >
                  Save Status
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
