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
      <header className="sticky top-0 z-40 bg-[#1e293b] text-white border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Nav */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-white block leading-none">
                    BOOTIC B2B
                  </span>
                  <span className="block text-[9px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
                    Wholesale Clothing Platform
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1.5">
                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/dashboard')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/products"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/products')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      Products
                    </Link>
                    <Link
                      to="/admin/inventory"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/inventory')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      Inventory
                    </Link>
                    <Link
                      to="/admin/orders"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/orders')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Orders
                    </Link>
                    <Link
                      to="/admin/requirements"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/requirements')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Quotes
                    </Link>
                    <Link
                      to="/admin/reports"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                        isActive('/admin/reports')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
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
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        isActive('/catalog')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      Catalog
                    </Link>
                    <Link
                      to="/orders"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        isActive('/orders')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/requirements"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        isActive('/requirements')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      Custom Bulk Requests
                    </Link>
                    <Link
                      to="/addresses"
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        isActive('/addresses')
                          ? 'bg-slate-800 text-white border border-slate-700/80 shadow-inner'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
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
                      className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {totalItemsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1e293b] shadow-sm animate-pulse">
                          {totalItemsCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Notifications */}
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <Bell className="w-5 h-5" />
                  </button>

                  {/* Profile info pill */}
                  <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white max-w-[140px] truncate leading-tight">
                        {user.business_name || user.full_name || 'Mumbai Mega Wholesale'}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 block mt-0.5 uppercase">
                        {user.role} {user.city ? `(${user.city})` : '(Mumbai)'}
                      </span>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors ml-1"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20"
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
