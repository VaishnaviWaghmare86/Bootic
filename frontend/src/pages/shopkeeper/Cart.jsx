import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, MapPin, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 font-semibold">
        Loading wholesale cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Your Wholesale Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Browse wholesale catalog to select garment batches with tiered quantity volume pricing.
        </p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-sm"
        >
          Browse Clothing Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {cart.total_items_count} Product Categories • {cart.total_quantity} Total Pieces
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" /> Clear Cart
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.product_id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    item.product_image ||
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300'
                  }
                  alt={item.product_name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-100"
                />
                <div>
                  <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">
                    SKU: {item.sku}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.product_name}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>Size: <strong className="text-slate-800">{item.selected_size || 'L'}</strong></span>
                    {item.selected_color && <span>• Color: {item.selected_color}</span>}
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600">
                    Tier Wholesale Unit Price: <strong className="text-rose-600 font-bold">₹{item.effective_unit_price}</strong>
                    {item.base_price > item.effective_unit_price && (
                      <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                        Wholesale Slab Applied
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Qty:</span>
                  <input
                    type="number"
                    min={item.minimum_order_quantity}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(
                        item.product_id,
                        Math.max(1, parseInt(e.target.value) || 1),
                        item.selected_size
                      )
                    }
                    className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none"
                  />
                </div>

                <div className="text-right">
                  <p className="text-base font-extrabold text-slate-900">
                    ₹{item.item_total.toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-slate-400 hover:text-rose-600 text-xs mt-1 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Summary Sidebar */}
        <div className="space-y-6">
          {/* Delivery Address Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" /> Delivery Address
              </h3>
              <Link to="/addresses" className="text-xs font-bold text-rose-600 hover:underline">
                Manage
              </Link>
            </div>

            {addresses.length === 0 ? (
              <p className="text-xs text-slate-500">
                Defaulting to registered boutique address in profile ({user?.city}).
              </p>
            ) : (
              <select
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.contact_person} - {a.address_line1}, {a.city} ({a.pincode})
                  </option>
                ))}
              </select>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Order Notes / Transport Instructions:
              </label>
              <input
                type="text"
                placeholder="e.g. Send via VRL Logistics or specific transport"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Wholesale Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-xl border text-xs font-bold cursor-pointer flex items-center gap-2 ${
                  paymentMethod === 'COD'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="accent-rose-600"
                />
                COD / Pay on Delivery
              </label>
              <label
                className={`p-3 rounded-xl border text-xs font-bold cursor-pointer flex items-center gap-2 ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="accent-rose-600"
                />
                Bank Transfer / NEFT
              </label>
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Wholesale Order Summary
            </h3>
            <div className="divide-y divide-slate-100 text-xs space-y-2 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.total_quantity} pcs)</span>
                <span className="font-bold text-slate-900">₹{cart.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2">
                <span>Est. Wholesale GST (5%)</span>
                <span className="font-bold text-slate-900">₹{cart.estimated_tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2">
                <span>Transport / Shipping</span>
                <span className="font-bold text-emerald-600">
                  {cart.estimated_shipping === 0 ? 'FREE Wholesale Shipping' : `₹${cart.estimated_shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-3">
                <span>Total Payable</span>
                <span className="text-lg text-rose-600">₹{cart.total_amount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-4"
            >
              {checkingOut ? 'Placing Wholesale Order...' : 'Place Wholesale Order Now'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
