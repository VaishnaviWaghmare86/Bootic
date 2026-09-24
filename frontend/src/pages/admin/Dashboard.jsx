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
} from 'lucide-react';
import api from '../../api/client';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [criticalProducts, setCriticalProducts] = useState([]);
  const [criticalIndex, setCriticalIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fallback critical items if DB products are empty
  const defaultCriticalItems = [
    {
      id: '1',
      name: 'Mumbai Mega Wholesaler',
      role_tag: 'ADMIN (Mumbai)',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80',
      stock_text: '4 pcs left',
      status_label: 'LOW STOCK',
    },
    {
      id: '2',
      name: 'Mumbai Mega Wholesaler',
      role_tag: 'ADMIN (Mumbai)',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&auto=format&fit=crop&q=80',
      stock_text: '0 pcs available',
      status_label: 'OUT OF STOCK',
    },
    {
      id: '3',
      name: 'Mumbai Mega Wholesaler',
      role_tag: 'ADMIN (Mumbai)',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80',
      stock_text: '2 pcs left',
      status_label: 'LOW STOCK',
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
          stock_text: `${p.stock_quantity ?? 3} pcs left`,
          status_label: (p.stock_quantity ?? 3) === 0 ? 'OUT OF STOCK' : 'LOW STOCK',
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
      subtext: 'ADMIN (Mumbai)',
      amount: 20000,
      time: 'Today',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'ord-2',
      customer_name: 'Mumbai Mega Wholesaler',
      subtext: 'ADMIN (Mumbai)',
      amount: 15400,
      time: 'Today',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const displayOrders =
    recentOrders.length > 0
      ? recentOrders.slice(0, 3).map((o) => ({
          id: o.id || o.order_number,
          customer_name: 'Mumbai Mega Wholesaler',
          subtext: 'ADMIN (Mumbai)',
          amount: o.total_amount || 20000,
          time: 'Today',
          image:
            o.items?.[0]?.product_image ||
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&auto=format&fit=crop&q=80',
        }))
      : defaultRecentOrders;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4 mb-6">
          <div>
            <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-widest block">
              MUMBAI WHOLESALER OPERATIONS HUB
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Mumbai Wholesaler Operations Hub
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Link>
            <Link
              to="/admin/inventory"
              className="px-4 py-2.5 bg-[#e11d48] hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-500/25 transition-all"
            >
              <Boxes className="w-4 h-4" /> Stock-In Batch
            </Link>
          </div>
        </div>

        {/* Top KPI Bar (Dark Rounded Full-Width Container) */}
        <div className="bg-gradient-to-r from-[#1c2434] via-[#1e293b] to-[#25283f] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800/80 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 lg:divide-x divide-slate-800/80">
            {/* KPI 1: TOTAL WHOLESALE REVENUE */}
            <div className="flex flex-col justify-between pr-0 lg:pr-6 pt-2 sm:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  TOTAL WHOLESALE REVENUE
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  ₹{(stats?.total_sales_amount || 350750).toLocaleString()}
                </p>
                {/* Glow green sparkline */}
                <div className="w-24 h-8 flex items-center justify-center">
                  <svg className="w-full h-full text-emerald-400" viewBox="0 0 100 32" fill="none">
                    <path
                      d="M2 24 C20 22, 35 26, 48 16 C60 6, 75 14, 98 4"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs">
                <span className="font-bold text-emerald-400">
                  Today: ₹{(stats?.today_sales_amount || 15200).toLocaleString()}
                </span>
                <span className="text-slate-400">
                  • Month: ₹{(stats?.monthly_sales_amount || 210000).toLocaleString()}
                </span>
              </div>
            </div>

            {/* KPI 2: REGISTERED BOUTIQUES */}
            <div className="flex flex-col justify-between pl-0 lg:pl-6 pr-0 lg:pr-6 pt-4 sm:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  REGISTERED BOUTIQUES
                </span>
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  {stats?.total_shopkeepers || 12}
                </p>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                <span className="text-cyan-400 font-bold">
                  {stats?.active_shopkeepers || 10} active
                </span>{' '}
                retail buyers in Mumbai, Surat, Jaipur, etc.
              </div>
            </div>

            {/* KPI 3: WAREHOUSE STOCK UNITS */}
            <div className="flex flex-col justify-between pl-0 lg:pl-6 pr-0 lg:pr-6 pt-4 sm:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  WAREHOUSE STOCK UNITS
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  {(stats?.total_stock_units || 15400).toLocaleString()}
                </p>
                {/* Purple mini-bars */}
                <div className="flex items-end gap-1 h-7">
                  <span className="w-1.5 bg-purple-500/50 rounded-full h-3"></span>
                  <span className="w-1.5 bg-purple-500/70 rounded-full h-4"></span>
                  <span className="w-1.5 bg-purple-400 rounded-full h-6"></span>
                  <span className="w-1.5 bg-purple-400 rounded-full h-5"></span>
                  <span className="w-1.5 bg-purple-300 rounded-full h-7"></span>
                  <span className="w-1.5 bg-purple-400 rounded-full h-4"></span>
                  <span className="w-1.5 bg-purple-500/60 rounded-full h-2"></span>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Across <strong className="text-slate-200">{stats?.total_products || 45}</strong> wholesale styles
              </div>
            </div>

            {/* KPI 4: ACTION REQUIRED */}
            <div className="flex flex-col justify-between pl-0 lg:pl-6 pt-4 sm:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ACTION REQUIRED
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-slate-700/60 rounded-xl">
                  <span className="text-amber-400 text-lg font-black">
                    {(stats?.pending_orders || 5) + (stats?.pending_requirements_count || 3)}
                  </span>
                  <span className="text-slate-300 text-xs font-semibold">Pending items</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                {stats?.pending_orders || 5} new orders • {stats?.pending_requirements_count || 3} bulk inquiries
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section: Orders Fulfillment Pipeline & Stock Health Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT CARD: Orders Fulfillment Pipeline & Mini-order list */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  Orders Fulfillment Pipeline
                </h3>
                <Link to="/admin/orders" className="text-xs font-bold text-rose-600 hover:underline">
                  View All Orders
                </Link>
              </div>

              {/* Chevron Pipeline Flow */}
              <div className="mt-6">
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {/* Step 1: PLACED */}
                  <div className="relative">
                    <div
                      className="bg-[#1e293b] text-white py-3.5 px-2 text-center rounded-l-2xl"
                      style={{
                        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
                      }}
                    >
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                        PLACED
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                        {stats?.pending_orders ?? 3}
                      </span>
                    </div>
                    {/* Circle icon below */}
                    <div className="flex justify-center mt-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm border-2 border-white">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: PROCESSING */}
                  <div className="relative">
                    <div
                      className="bg-[#24334a] text-white py-3.5 px-2 text-center"
                      style={{
                        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
                      }}
                    >
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                        PROCESSING
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                        {stats?.processing_orders ?? 4}
                      </span>
                    </div>
                    {/* Circle icon below */}
                    <div className="flex justify-center mt-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: DELIVERED */}
                  <div className="relative">
                    <div
                      className="bg-[#0f766e] text-white py-3.5 px-2 text-center"
                      style={{
                        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
                      }}
                    >
                      <span className="text-[9px] sm:text-[10px] font-bold text-teal-100 uppercase tracking-wider block">
                        DELIVERED
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
                        {stats?.completed_orders ?? 1}
                      </span>
                    </div>
                    {/* Circle icon below */}
                    <div className="flex justify-center mt-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shadow-sm border-2 border-white">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Step 4: CANCELLED */}
                  <div className="relative">
                    <div
                      className="bg-[#1e293b] text-white py-3.5 px-2 text-center rounded-r-2xl"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)',
                      }}
                    >
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        CANCELLED
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-300 mt-0.5 block">
                        {stats?.cancelled_orders ?? 0}
                      </span>
                    </div>
                    {/* Circle icon below */}
                    <div className="flex justify-center mt-2.5">
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm border-2 border-white">
                        <Ban className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini-order list */}
            <div className="mt-8 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">
                  Mini-order list
                </span>
                <Link to="/admin/orders" className="text-xs font-bold text-rose-600 hover:underline">
                  View all order
                </Link>
              </div>

              <div className="space-y-2.5">
                {displayOrders.map((order, idx) => (
                  <div
                    key={order.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={order.image}
                        alt="Order"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {order.customer_name}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {order.subtext}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">
                        ₹{order.amount.toLocaleString()}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {order.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CARD: Stock Health Alerts & critical items */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Stock Health Alerts
                </h3>
                <Link to="/admin/inventory" className="text-xs font-bold text-rose-600 hover:underline">
                  Manage inventory
                </Link>
              </div>

              {/* Two Alert Sub-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {/* LOW STOCK STYLES */}
                <div className="p-4 rounded-2xl bg-[#fffcf5] border border-amber-200/70 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                      LOW STOCK STYLES
                    </span>
                    <p className="text-3xl font-black text-amber-950 mt-1">
                      {stats?.low_stock_products_count ?? 5}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 w-full bg-amber-200/50 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-[11px] font-semibold text-amber-800/80 mt-1.5">
                      Need re-order soon
                    </p>
                  </div>
                </div>

                {/* OUT OF STOCK STYLES */}
                <div className="p-4 rounded-2xl bg-[#fff1f2] border border-rose-200/70 flex items-center justify-between relative overflow-hidden">
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">
                      OUT OF STOCK STYLES
                    </span>
                    <p className="text-3xl font-black text-rose-950 mt-1">
                      {stats?.out_of_stock_products_count ?? 1}
                    </p>
                    <p className="text-[11px] font-semibold text-rose-700 mt-3">
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
            </div>

            {/* Critical Items Carousel */}
            <div className="mt-8 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">
                  critical items
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Carousel</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevCritical}
                      className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                      title="Previous"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleNextCritical}
                      className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
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
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt="Critical Item"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 truncate">
                        {item.role_tag}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
