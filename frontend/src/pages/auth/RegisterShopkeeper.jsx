import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const RegisterShopkeeper = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    mobile: '',
    email: '',
    password: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411002',
    business_address: '',
    gst_number: '',
    business_type: 'BOUTIQUE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        // Automatically login
        const loginRes = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        if (loginRes.data.success) {
          const { access_token } = loginRes.data.data;
          login(res.data.data, access_token);
          navigate('/catalog');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Register Retail Boutique / Shop
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join the Mumbai wholesale distribution network to buy wholesale garments at bulk prices
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Owner / Contact Person
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Rahul Deshmukh"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Boutique / Shop Name
              </label>
              <input
                type="text"
                name="business_name"
                required
                value={formData.business_name}
                onChange={handleChange}
                placeholder="e.g. Rahul Fashion Store"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number (10 Digits)
              </label>
              <input
                type="tel"
                name="mobile"
                required
                pattern="[0-9]{10}"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="9820033333"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="rahul@example.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business Type
              </label>
              <select
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              >
                <option value="BOUTIQUE">Boutique</option>
                <option value="RETAIL_STORE">Retail Clothing Store</option>
                <option value="CHAIN_STORE">Chain Store</option>
                <option value="ONLINE_RETAILER">Online Retailer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Pune, Nashik, Satara"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PIN Code
              </label>
              <input
                type="text"
                name="pincode"
                required
                pattern="[0-9]{6}"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="411002"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shop / Delivery Address
            </label>
            <textarea
              name="business_address"
              required
              rows={2}
              value={formData.business_address}
              onChange={handleChange}
              placeholder="Shop No., Market / Street Name, Landmark"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              GST Number (Optional)
            </label>
            <input
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              placeholder="27AAACR1234F1Z1"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register & Enter Wholesale Portal'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-rose-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterShopkeeper;
