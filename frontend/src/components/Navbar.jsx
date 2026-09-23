import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-700 to-rose-500 bg-clip-text text-transparent">
                    BOOTIC B2B
                  </span>
                  <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Wholesale Clothing Platform
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/products"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-1.5"
                    >
                      <Package className="w-4 h-4" />
                      Products
                    </Link>
                    <Link
                      to="/admin/inventory"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-1.5"
                    >
                      <Boxes className="w-4 h-4" />
                      Inventory
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-1.5"
                    >
                      <Layers className="w-4 h-4" />
                      Orders
                    </Link>
                    <Link
                      to="/admin/requirements"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-1.5"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Quotes
                    </Link>
                    <Link
                      to="/admin/reports"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Reports
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/catalog"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
                    >
                      Catalog
                    </Link>
                    <Link
                      to="/orders"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/requirements"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
                    >
                      Custom Bulk Requests
                    </Link>
                    <Link
                      to="/addresses"
                      className="px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
                    >
                      Addresses
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Cart Button (for shopkeepers) */}
                  {isShopkeeper && (
                    <Link
                      to="/cart"
                      className="relative p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {totalItemsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                          {totalItemsCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Notifications */}
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Bell className="w-5 h-5" />
                  </button>

                  {/* Profile info pill */}
                  <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        {user.business_name || user.full_name}
                      </p>
                      <span className="text-[10px] font-semibold text-rose-600">
                        {user.role} {user.city ? `(${user.city})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20"
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
