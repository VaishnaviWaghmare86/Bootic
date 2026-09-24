import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  User,
  LogOut,
  Layers,
  FileSpreadsheet,
  Package,
  Boxes,
  Bell,
  BarChart3,
  MapPin,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationModal from './NotificationModal';

export const Navbar = () => {
  const { user, logout, isAdmin, isShopkeeper } = useAuth();
  const { totalItemsCount } = useCart();
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#111e24] text-white border-b border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Nav */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight text-white block leading-none flex items-center gap-1.5">
                    BOOTIC <span className="text-emerald-400">B2B</span>
                  </span>
                  <span className="block text-[9px] font-extrabold tracking-wider text-emerald-300/80 uppercase mt-1">
                    Wholesale Clothing Hub
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1.5">
                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className={`px-3.5 py-1.5 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/dashboard')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner shadow-emerald-950/40'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/products"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/products')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Products
                    </Link>
                    <Link
                      to="/admin/inventory"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/inventory')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      Inventory
                    </Link>
                    <Link
                      to="/admin/orders"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/orders')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Orders
                    </Link>
                    <Link
                      to="/admin/requirements"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/requirements')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Quotes
                    </Link>
                    <Link
                      to="/admin/reports"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/reports')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Reports
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/catalog"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        isActive('/catalog')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      Catalog
                    </Link>
                    <Link
                      to="/orders"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        isActive('/orders')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/requirements"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        isActive('/requirements')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      Custom Bulk Requests
                    </Link>
                    <Link
                      to="/addresses"
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        isActive('/addresses')
                          ? 'bg-[#183038] text-emerald-300 border border-emerald-500/40 shadow-inner'
                          : 'text-slate-300 hover:text-emerald-300 hover:bg-[#16272e]'
                      }`}
                    >
                      Addresses
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Right: Actions, Notifications, Profile, Logout */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Cart Button (for shopkeepers) */}
                  {isShopkeeper && (
                    <Link
                      to="/cart"
                      className="relative p-2 text-slate-300 hover:text-emerald-300 hover:bg-[#16272e] rounded-xl transition-all"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {totalItemsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111e24] shadow-md animate-pulse">
                          {totalItemsCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Notifications */}
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="p-2 text-slate-300 hover:text-emerald-300 hover:bg-[#16272e] rounded-xl transition-all relative"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 ring-2 ring-[#111e24]"></span>
                  </button>

                  {/* Profile info pill */}
                  <div className="hidden sm:flex items-center gap-2.5 pl-2.5 border-l border-emerald-500/20">
                    <div className="w-8 h-8 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                      {user.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-white max-w-[140px] truncate leading-tight">
                        {user.business_name || user.full_name || 'Mumbai Mega Wholesale'}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-400 block uppercase">
                        {user.role} {user.city ? `(${user.city})` : '(Mumbai)'}
                      </span>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#16272e] rounded-xl transition-colors ml-1"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-emerald-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20"
                  >
                    Register Boutique
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Navbar;
