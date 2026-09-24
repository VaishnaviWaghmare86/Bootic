import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, ArrowRight, ShieldCheck, Store, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { access_token } = res.data.data;
        localStorage.setItem('b2b_token', access_token);
        const profileRes = await api.get('/auth/me');
        if (profileRes.data.success) {
          login(profileRes.data.data, access_token);
          if (profileRes.data.data.role === 'ADMIN' || profileRes.data.data.role === 'SUPER_ADMIN') {
            navigate('/admin/dashboard');
          } else {
            navigate('/catalog');
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (userEmail) => {
    setEmail(userEmail);
    setPassword('Password@123');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6 bootic-card p-8 sm:p-10 shadow-2xl border border-emerald-500/30 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome to BOOTIC <span className="text-emerald-600">B2B</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Wholesale Clothing Distribution Platform (Mumbai Operations Hub)
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center animate-in fade-in">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="retailer@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center mb-2.5">
            Quick One-Click Demo Access:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickFill('admin@example.com')}
              className="p-2 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black border border-emerald-200 text-center transition-all"
            >
              Mumbai Admin Hub
            </button>
            <button
              type="button"
              onClick={() => quickFill('pune.boutique@example.com')}
              className="p-2 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black border border-emerald-200 text-center transition-all"
            >
              Pune Boutique Buyer
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-500 font-medium">Don't have a registered boutique? </span>
          <Link to="/register" className="text-xs font-black text-emerald-700 hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
