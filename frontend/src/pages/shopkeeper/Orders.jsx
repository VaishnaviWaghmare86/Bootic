import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, XCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import OrderTracker from '../../components/OrderTracker';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('success_id');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders?limit=50');
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
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Reserved stock will be released.')) {
      return;
    }
    try {
      setCancellingId(orderId);
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          My Wholesale Order History
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track wholesale dispatch status, view frozen item unit price snapshots, and manage delivery orders.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-semibold">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Browse catalog to place your first wholesale batch order.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isHighlighted = order.id === highlightId;
            const canCancel =
              order.order_status === 'ORDER_PLACED' ||
              order.order_status === 'PENDING_CONFIRMATION';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border p-6 sm:p-8 shadow-sm transition-all ${
                  isHighlighted
                    ? 'border-rose-500 ring-4 ring-rose-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-black text-slate-900">
                        {order.order_number}
                      </span>
                      <StatusBadge status={order.order_status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Placed on{' '}
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Total Amount</span>
                      <p className="text-lg font-black text-rose-600">
                        ₹{order.total_amount.toLocaleString()}
                      </p>
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Stepper */}
                <div className="py-2">
                  <OrderTracker currentStatus={order.order_status} />
                </div>

                {/* Tracking Info if Shipped */}
                {order.courier_name && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span>
                        Transport / Courier: <strong>{order.courier_name}</strong> • Tracking #:
                        <strong> {order.tracking_number || 'N/A'}</strong>
                      </span>
                    </div>
                    {order.expected_delivery_date && (
                      <span>
                        Est. Delivery: {new Date(order.expected_delivery_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Items Snapshot Table */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Order Items Snapshot (Frozen Prices):
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              it.product_image ||
                              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200'
                            }
                            alt={it.product_name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{it.product_name}</p>
                            <span className="text-slate-400 text-[10px]">
                              SKU: {it.sku} • Size: {it.selected_size || 'L'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500">
                            {it.quantity} pcs × ₹{it.unit_price} ={' '}
                          </span>
                          <strong className="text-slate-900 font-extrabold text-sm">
                            ₹{it.subtotal.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                  <span>
                    Destination: {order.shipping_address?.address_line1},{' '}
                    {order.shipping_address?.city} ({order.shipping_address?.pincode})
                  </span>
                  <span>Payment: <strong>{order.payment_method}</strong> ({order.payment_status})</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
