import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Boxes,
  Layers,
  AlertTriangle,
  Plus,
  Truck,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Package,
  Clock,
  Ban,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/client';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [criticalProducts, setCriticalProducts] = useState([]);
  const [criticalIndex, setCriticalIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, ordersRes, prodRes] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/orders?limit=5'),
        api.get('/products?limit=10'),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
        setStats(dashRes.value.data.data);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data.success) {
        setRecentOrders(ordersRes.value.data.data || []);
      }

      if (prodRes.status === 'fulfilled' && prodRes.value.data.success) {
        setCriticalProducts(prodRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Fallback critical items if DB products are empty
  const defaultCriticalItems = [
    {
      id: '1',
      name: 'Mumbai Mega Wholesaler',
      role_tag: 'ADMIN (Mumbai)',
      product_title: 'Pure Cotton Anarkali Kurti',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80',
      stock_text: '4 pcs left',
      status_label: 'LOW STOCK',
      is_out: false,
    },
    {
      id: '2',
      name: 'Mumbai Mega Wholesaler',
      role_tag: 'ADMIN (Mumbai)',
      product_title: 'Banarasi Silk Bridal Saree',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&auto=format&fit=crop&q=80',
      stock_text: '0 pcs available',
      status_label: 'OUT OF STOCK',
      is_out: true,
    },
    {
      id: '3',
      name: 'Mumbai Mega Wholesaler',
      role_tag: 'ADMIN (Mumbai)',
      product_title: 'Heavy Rayon Gold Foil Kurti',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80',
      stock_text: '2 pcs left',
      status_label: 'LOW STOCK',
      is_out: false,
    },
  ];

  const displayCritical =
    criticalProducts.length > 0
      ? criticalProducts.map((p) => ({
          id: p.id,
          name: 'Mumbai Mega Wholesaler',
          role_tag: 'ADMIN (Mumbai)',
          product_title: p.name,
          image:
            p.product_images?.[0] ||
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80',
          stock_text: `${p.stock_quantity ?? 4} pcs left`,
          status_label: (p.stock_quantity ?? 4) === 0 ? 'OUT OF STOCK' : 'LOW STOCK',
          is_out: (p.stock_quantity ?? 4) === 0,
        }))
      : defaultCriticalItems;

  const handlePrevCritical = () => {
    setCriticalIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, displayCritical.length - 2)));
  };

  const handleNextCritical = () => {
    setCriticalIndex((prev) => (prev + 2 < displayCritical.length ? prev + 1 : 0));
  };

  // Fallback recent orders if none
  const defaultRecentOrders = [
    {
      id: 'ord-1',
      customer_name: 'Mumbai Mega Wholesaler',
      subtext: 'ADMIN (Mumbai) • ORD-2026-001',
      amount: 20000,
      time: 'Today',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&auto=format&fit=crop&q=80',
      badge: 'Paid',
    },
    {
      id: 'ord-2',
      customer_name: 'Mumbai Mega Wholesaler',
      subtext: 'ADMIN (Mumbai) • ORD-2026-002',
      amount: 15400,
      time: 'Today',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=120&auto=format&fit=crop&q=80',
      badge: 'Processing',
    },
  ];

  const displayOrders =
    recentOrders.length > 0
      ? recentOrders.slice(0, 3).map((o) => ({
          id: o.id || o.order_number,
          customer_name: o.customer_name || 'Mumbai Mega Wholesaler',
          subtext: `ADMIN (Mumbai) • ${o.order_number || 'ORD-2026'}`,
          amount: o.total_amount || 20000,
          time: 'Today',
          image:
            o.items?.[0]?.product_image ||
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&auto=format&fit=crop&q=80',
          badge: o.payment_status || 'Paid',
        }))
      : defaultRecentOrders;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4 mb-6 border-b border-emerald-900/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Mumbai Wholesaler Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2.5">
            Mumbai Wholesaler Operations Hub
            <span className="hidden sm:inline-flex text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              LIVE
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white/90 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-2xl border border-emerald-500/20 shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-sm border border-slate-800 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add Product
          </Link>
          <Link
            to="/admin/inventory"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-0.5 hover:shadow-emerald-600/40"
          >
            <Boxes className="w-4 h-4" /> Stock-In Batch
          </Link>
        </div>
      </div>

      {/* Top Hero KPI Bar with Background Boutique Image Overlay */}
      <div className="relative rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-emerald-950/25 border border-emerald-500/30 mb-8 overflow-hidden backdrop-blur-xl bg-[#0d1d1f]">
        {/* Fashion Boutique Background Texture Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop')`,
          }}
        ></div>

        {/* Ambient Gradient Glows */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1d1f]/95 via-[#112328]/90 to-[#142634]/95 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 lg:divide-x divide-emerald-500/20 relative z-10">
          {/* KPI 1: TOTAL WHOLESALE REVENUE */}
          <div className="flex flex-col justify-between pr-0 lg:pr-6 pt-2 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-300/80 uppercase tracking-wider">
                TOTAL WHOLESALE REVENUE
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-black text-base shadow-lg shadow-emerald-500/20">
                ₹
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ₹{(stats?.total_sales_amount || 350750).toLocaleString()}
              </p>

              {/* Glowing Light Green Sparkline */}
              <div className="w-28 h-9 flex items-center justify-center">
                <svg className="w-full h-full text-emerald-400" viewBox="0 0 100 32" fill="none">
                  <defs>
                    <linearGradient id="dashEmeraldGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M2 24 C20 22, 35 26, 48 16 C60 6, 75 14, 98 4"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2 24 C20 22, 35 26, 48 16 C60 6, 75 14, 98 4 L98 32 L2 32 Z"
                    fill="url(#dashEmeraldGlow)"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="font-black text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                Today: ₹{(stats?.today_sales_amount || 15200).toLocaleString()}
              </span>
              <span className="text-slate-300 font-medium">
                • Month: ₹{(stats?.monthly_sales_amount || 210000).toLocaleString()}
              </span>
            </div>
          </div>

          {/* KPI 2: REGISTERED BOUTIQUES */}
          <div className="flex flex-col justify-between pl-0 lg:pl-6 pr-0 lg:pr-6 pt-4 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-300/80 uppercase tracking-wider">
                REGISTERED BOUTIQUES
              </span>
              <div className="w-9 h-9 rounded-2xl bg-teal-400/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {stats?.total_shopkeepers || 12}
              </p>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                +2 new
              </span>
            </div>

            <div className="mt-4 text-xs text-slate-300 font-medium">
              <span className="text-emerald-300 font-black">
                {stats?.active_shopkeepers || 10} active
              </span>{' '}
              retail buyers in Mumbai, Surat, Jaipur, etc.
            </div>
          </div>

          {/* KPI 3: WAREHOUSE STOCK UNITS */}
          <div className="flex flex-col justify-between pl-0 lg:pl-6 pr-0 lg:pr-6 pt-4 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-300/80 uppercase tracking-wider">
                WAREHOUSE STOCK UNITS
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Boxes className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {(stats?.total_stock_units || 15400).toLocaleString()}
              </p>

              {/* Light Green / Mint Mini Equalizer Bars */}
              <div className="flex items-end gap-1.5 h-8">
                <span className="w-1.5 bg-emerald-500/40 rounded-full h-3"></span>
                <span className="w-1.5 bg-emerald-400/70 rounded-full h-5"></span>
                <span className="w-1.5 bg-emerald-300 rounded-full h-7 animate-pulse"></span>
                <span className="w-1.5 bg-teal-300 rounded-full h-6"></span>
                <span className="w-1.5 bg-emerald-400 rounded-full h-8"></span>
                <span className="w-1.5 bg-emerald-500/80 rounded-full h-4"></span>
                <span className="w-1.5 bg-emerald-500/50 rounded-full h-2.5"></span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-300 font-medium">
              Across <strong className="text-emerald-300 font-black">{stats?.total_products || 45}</strong> wholesale styles
            </div>
          </div>

          {/* KPI 4: ACTION REQUIRED */}
          <div className="flex flex-col justify-between pl-0 lg:pl-6 pt-4 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-300/80 uppercase tracking-wider">
                ACTION REQUIRED
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-inner">
                <span className="text-amber-400 text-xl font-black">
                  {(stats?.pending_orders || 5) + (stats?.pending_requirements_count || 3)}
                </span>
                <span className="text-emerald-200 text-xs font-bold">Pending items</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-300 font-medium">
              {stats?.pending_orders || 5} new orders • {stats?.pending_requirements_count || 3} bulk inquiries
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Orders Fulfillment Pipeline & Stock Health Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* LEFT CARD: Orders Fulfillment Pipeline & Mini-order list */}
        <div className="bootic-card p-6 sm:p-8 flex flex-col justify-between bootic-card-hover">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                Orders Fulfillment Pipeline
              </h3>
              <Link
                to="/admin/orders"
                className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
              >
                View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Chevron Pipeline Flow */}
            <div className="mt-6">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {/* Step 1: PLACED */}
                <div className="relative group cursor-pointer">
                  <div
                    className="bg-[#1c2433] text-white py-4 px-2 text-center rounded-l-2xl group-hover:bg-slate-800 transition-colors shadow-sm"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
                    }}
                  >
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                      PLACED
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                      {stats?.pending_orders ?? 3}
                    </span>
                  </div>
                  {/* Circle icon below */}
                  <div className="flex justify-center mt-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Step 2: PROCESSING */}
                <div className="relative group cursor-pointer">
                  <div
                    className="bg-[#1e3438] text-white py-4 px-2 text-center group-hover:bg-[#254247] transition-colors shadow-sm"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
                    }}
                  >
                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-200 uppercase tracking-wider block">
                      PROCESSING
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                      {stats?.processing_orders ?? 4}
                    </span>
                  </div>
                  {/* Circle icon below */}
                  <div className="flex justify-center mt-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Step 3: DELIVERED (Vibrant Light Green / Emerald) */}
                <div className="relative group cursor-pointer">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-2 text-center shadow-md shadow-emerald-500/20 group-hover:brightness-105 transition-all"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
                    }}
                  >
                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-100 uppercase tracking-wider block">
                      DELIVERED
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block drop-shadow-sm">
                      {stats?.completed_orders ?? 1}
                    </span>
                  </div>
                  {/* Circle icon below */}
                  <div className="flex justify-center mt-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                      <Truck className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Step 4: CANCELLED */}
                <div className="relative group cursor-pointer">
                  <div
                    className="bg-[#1c2433] text-white py-4 px-2 text-center rounded-r-2xl group-hover:bg-slate-800 transition-colors shadow-sm"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)',
                    }}
                  >
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      CANCELLED
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-slate-300 mt-0.5 block">
                      {stats?.cancelled_orders ?? 0}
                    </span>
                  </div>
                  {/* Circle icon below */}
                  <div className="flex justify-center mt-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                      <Ban className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini-order list */}
          <div className="mt-8 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Mini-order list
              </span>
              <Link to="/admin/orders" className="text-xs font-bold text-emerald-700 hover:underline">
                View all order
              </Link>
            </div>

            <div className="space-y-3">
              {displayOrders.map((order, idx) => (
                <div
                  key={order.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100/80 bg-[#fbfdfc] hover:bg-emerald-50/50 hover:border-emerald-200 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={order.image}
                      alt="Order"
                      className="w-11 h-11 rounded-xl object-cover border border-emerald-100 shadow-sm"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {order.customer_name}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        {order.subtext}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">
                        ₹{order.amount.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md block mt-0.5">
                      {order.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Stock Health Alerts & critical items */}
        <div className="bootic-card p-6 sm:p-8 flex flex-col justify-between bootic-card-hover">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                Stock Health Alerts
              </h3>
              <Link
                to="/admin/inventory"
                className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
              >
                Manage inventory <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Two Alert Sub-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* LOW STOCK STYLES */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fffef7] to-[#fff8eb] border border-amber-200/80 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                    LOW STOCK STYLES
                  </span>
                  <p className="text-3xl font-black text-amber-950 mt-1">
                    {stats?.low_stock_products_count ?? 5}
                  </p>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full bg-amber-200/60 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <p className="text-[11px] font-bold text-amber-800/90 mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Need re-order soon
                  </p>
                </div>
              </div>

              {/* OUT OF STOCK STYLES */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fff5f6] to-[#ffedf0] border border-rose-200/80 flex items-center justify-between relative overflow-hidden shadow-sm">
                <div>
                  <span className="text-[10px] font-black text-rose-900 uppercase tracking-wider block">
                    OUT OF STOCK STYLES
                  </span>
                  <p className="text-3xl font-black text-rose-950 mt-1">
                    {stats?.out_of_stock_products_count ?? 1}
                  </p>
                  <p className="text-[11px] font-bold text-rose-700 mt-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    2 orders delayed
                  </p>
                </div>

                {/* Speedometer Gauge Visual */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="w-14 h-14 transform -rotate-45">
                    <circle
                      cx="20"
                      cy="20"
                      r="14"
                      fill="transparent"
                      stroke="#fecdd3"
                      strokeWidth="4"
                      strokeDasharray="65 100"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="14"
                      fill="transparent"
                      stroke="#e11d48"
                      strokeWidth="4"
                      strokeDasharray="45 100"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Gauge needle */}
                  <div className="absolute w-1 h-4 bg-rose-700 rounded-full transform origin-bottom rotate-45"></div>
                  <div className="absolute w-2.5 h-2.5 bg-rose-900 rounded-full border border-white"></div>
                </div>
              </div>
            </div>

            {/* Light Green Warehouse Health Highlight */}
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-950">94.8% Warehouse Fulfillment Health</p>
                  <p className="text-[10px] font-semibold text-emerald-700">Optimal inventory circulation across active regional boutiques</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-xl">
                Healthy
              </span>
            </div>
          </div>

          {/* Critical Items Carousel */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                critical items
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Carousel</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevCritical}
                    className="w-6 h-6 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center transition-colors border border-emerald-200"
                    title="Previous"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextCritical}
                    className="w-6 h-6 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center transition-colors border border-emerald-200"
                    title="Next"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {displayCritical.slice(criticalIndex, criticalIndex + 2).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100/80 bg-[#fbfdfc] hover:bg-emerald-50/50 hover:border-emerald-200 transition-all shadow-sm group"
                >
                  <img
                    src={item.image}
                    alt="Critical Item"
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {item.product_title || item.name}
                    </p>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md inline-block mt-1 ${
                        item.is_out
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.stock_text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Performance & Operations Quick Strip */}
      <div className="bootic-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Operational Dispatch Velocity
            </p>
            <p className="text-xs text-slate-500 font-semibold">
              Average order turnover time is <strong className="text-emerald-700">1.8 days</strong> from confirmation to dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Monthly Target ₹500,000
            </span>
            <div className="w-40 h-2 bg-emerald-50 border border-emerald-200/60 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                style={{ width: '70.1%' }}
              ></div>
            </div>
          </div>
          <Link
            to="/admin/reports"
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black rounded-xl text-xs border border-emerald-200 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> View Detailed Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
