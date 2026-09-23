import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Package,
  Boxes,
  Layers,
  AlertTriangle,
  ClipboardList,
  ArrowUpRight,
  Plus,
  Truck,
  DollarSign,
} from 'lucide-react';
import api from '../../api/client';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 font-semibold">
        Loading admin operational dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
        <div>
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">
            Mumbai Wholesaler Operations Hub
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Admin Management Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          <Link
            to="/admin/inventory"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
          >
            <Boxes className="w-4 h-4" /> Stock-In Batch
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Wholesale Revenue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            ₹{stats?.total_sales_amount?.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-emerald-600">
              Today: ₹{stats?.today_sales_amount?.toLocaleString() || 0}
            </span>
            <span>• Month: ₹{stats?.monthly_sales_amount?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* Shopkeepers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Registered Boutiques
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{stats?.total_shopkeepers}</p>
          <p className="mt-2 text-xs text-slate-500">
            <strong className="text-blue-600 font-bold">{stats?.active_shopkeepers} active</strong> retail buyers in Pune, Nashik, etc.
          </p>
        </div>

        {/* Warehouse Inventory */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Warehouse Stock Units
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            {stats?.total_stock_units?.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Across <strong>{stats?.total_products}</strong> wholesale styles
          </p>
        </div>

        {/* Pending Orders & Requirements */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Action Required
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              {stats?.pending_orders + stats?.pending_requirements_count}
            </span>
            <span className="text-xs text-slate-400 font-medium">Pending items</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {stats?.pending_orders} new orders • {stats?.pending_requirements_count} bulk inquiries
          </p>
        </div>
      </div>

      {/* Orders Breakdown & Stock Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Orders Pipeline */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" /> Orders Fulfillment Pipeline
            </h3>
            <Link to="/admin/orders" className="text-xs font-bold text-rose-600 hover:underline">
              View All Orders
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/50 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Placed</span>
              <p className="text-xl font-black text-amber-900 mt-1">{stats?.pending_orders}</p>
            </div>
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/50 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Processing</span>
              <p className="text-xl font-black text-blue-900 mt-1">{stats?.processing_orders}</p>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/50 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Delivered</span>
              <p className="text-xl font-black text-emerald-900 mt-1">{stats?.completed_orders}</p>
            </div>
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/50 text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Cancelled</span>
              <p className="text-xl font-black text-rose-900 mt-1">{stats?.cancelled_orders}</p>
            </div>
          </div>
        </div>

        {/* Stock Alerts & Health */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Stock Health Alerts
            </h3>
            <Link to="/admin/inventory" className="text-xs font-bold text-rose-600 hover:underline">
              Manage Inventory
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-5 bg-orange-50 rounded-2xl border border-orange-200 text-left">
              <span className="text-[10px] font-black text-orange-700 uppercase tracking-wider">
                Low Stock Styles
              </span>
              <p className="text-2xl font-black text-orange-900 mt-1">
                {stats?.low_stock_products_count}
              </p>
              <p className="text-xs text-orange-700 mt-1 font-medium">Under re-order threshold</p>
            </div>

            <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200 text-left">
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">
                Out of Stock Styles
              </span>
              <p className="text-2xl font-black text-rose-900 mt-1">
                {stats?.out_of_stock_products_count}
              </p>
              <p className="text-xs text-rose-700 mt-1 font-medium">Orders blocked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
