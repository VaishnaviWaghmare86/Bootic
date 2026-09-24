import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="mb-8 pb-4 border-b border-emerald-900/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          <span>Boutique Purchase History</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
          My Wholesale Order History & Tracking
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live fulfillment tracking, dispatch details, and volume batch invoice receipts.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-emerald-800 font-extrabold">Loading your wholesale orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bootic-card p-10 max-w-xl mx-auto">
          <Package className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-900">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-medium">
            Browse our Mumbai wholesale catalog to select your first batch of garments.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20"
          >
            Browse Catalog <ArrowRight className="w-4 h-4" />
          </Link>
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
                className={`bootic-card p-6 sm:p-8 transition-all ${
                  isHighlighted
                    ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                    : 'hover:border-emerald-500/30'
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
                    <p className="text-xs text-slate-400 mt-1 font-semibold">
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

                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Total Amount
                      </span>
                      <span className="text-lg font-black text-emerald-900">
                        ₹{order.total_amount?.toLocaleString()}
                      </span>
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-colors"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tracking Progress */}
                <div className="my-6">
                  <OrderTracker currentStatus={order.order_status} />
                </div>

                {/* Items List */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-3">
                    Batch Items ({order.items?.length || 0} styles)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100/80"
                      >
                        <img
                          src={
                            item.product_image ||
                            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100'
                          }
                          alt={item.product_name}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {item.product_name}
                          </p>
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            SKU: {item.sku} • Size: {item.size} • Qty: {item.quantity} pcs
                          </span>
                          <span className="text-[11px] font-black text-emerald-800 block mt-0.5">
                            ₹{item.unit_price} / pc (Total ₹{item.total_price?.toLocaleString()})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
