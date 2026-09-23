import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, ArrowRight, ShieldCheck, Store } from 'lucide-react';
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
        // Fetch user profile
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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 mb-4">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to BOOTIC B2B
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to access wholesale clothing catalog and order management
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="retailer@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Quick Dev Login */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Test Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickFill('admin@example.com')}
              className="px-3 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              Mumbai Admin
            </button>
            <button
              onClick={() => quickFill('pune.boutique@example.com')}
              className="px-3 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-blue-500" />
              Pune Boutique
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have a boutique account?{' '}
            <Link to="/register" className="font-bold text-rose-600 hover:underline">
              Register Shopkeeper
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
