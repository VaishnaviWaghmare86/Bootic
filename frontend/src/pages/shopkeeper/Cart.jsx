import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, MapPin, CheckCircle, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart, fetchCart } = useCart();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [orderNotes, setOrderNotes] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      if (res.data.success && res.data.data.length > 0) {
        setAddresses(res.data.data);
        const defaultAddr = res.data.data.find((a) => a.is_default) || res.data.data[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCheckout = async () => {
    setError('');
    setCheckingOut(true);
    try {
      const res = await api.post('/orders/checkout', {
        shipping_address_id: selectedAddressId || null,
        payment_method: paymentMethod,
        notes: orderNotes || null,
      });

      if (res.data.success) {
        await fetchCart();
        navigate(`/orders?success_id=${res.data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place wholesale order');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-emerald-800 font-extrabold">
        Loading wholesale cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bootic-card p-10">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Your Wholesale Cart is Empty</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto font-medium">
            Explore our Mumbai wholesale clothing catalog to select bulk apparel batches with volume discounts.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/25 text-xs sm:text-sm"
          >
            Browse Wholesale Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-emerald-900/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
            <span>Wholesale Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Wholesale Cart & Batch Confirmation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {cart.total_items_count} Styles • {cart.total_quantity} Total Pieces
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.product_id + item.size}
              className="bootic-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    item.product_image ||
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=150'
                  }
                  alt={item.product_name}
                  className="w-16 h-16 rounded-2xl object-cover border border-emerald-100 shadow-sm"
                />
                <div>
                  <h3 className="text-sm font-black text-slate-900">{item.product_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                      SKU: {item.sku}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Size: {item.size}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-900 block mt-1">
                    ₹{item.unit_price} / piece
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.product_id, parseInt(e.target.value) || 1, item.size)
                    }
                    className="w-16 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center"
                  />
                  <span className="text-xs text-slate-400 font-bold">pcs</span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 block">
                    ₹{item.total_price?.toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.product_id, item.size)}
                    className="text-[11px] font-bold text-rose-600 hover:underline mt-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Dispatch Details */}
        <div className="space-y-6">
          <div className="bootic-card p-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Wholesale Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Total Wholesale Pieces</span>
                <span className="font-black text-slate-900">{cart.total_quantity} pcs</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-black text-slate-900">₹{cart.subtotal_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Volume Tier Discount</span>
                <span className="font-black">- ₹{cart.discount_amount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>GST / Packaging</span>
                <span className="font-bold text-slate-500">₹0 (Included)</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                <span>Final Payable</span>
                <span className="text-emerald-900">₹{cart.final_amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Delivery Address Picker */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Shipping Destination (Boutique)
              </label>
              {addresses.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-xs">
                  No saved delivery addresses. Please add one in{' '}
                  <Link to="/addresses" className="underline font-bold">
                    Addresses
                  </Link>
                  .
                </div>
              ) : (
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.business_name || a.contact_person} — {a.city}, {a.state} ({a.pincode})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Payment Method */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                    paymentMethod === 'COD'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  NEFT / RTGS
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkingOut || addresses.length === 0}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Place Wholesale Order (₹{cart.final_amount?.toLocaleString()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
