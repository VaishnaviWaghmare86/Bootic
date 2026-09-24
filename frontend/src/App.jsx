import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import { ShoppingBag, ShieldCheck, Heart, Sparkles } from 'lucide-react';

// Auth Pages
import Login from './pages/auth/Login';
import RegisterShopkeeper from './pages/auth/RegisterShopkeeper';

// Shopkeeper Pages
import Catalog from './pages/shopkeeper/Catalog';
import Cart from './pages/shopkeeper/Cart';
import Orders from './pages/shopkeeper/Orders';
import Requirements from './pages/shopkeeper/Requirements';
import Addresses from './pages/shopkeeper/Addresses';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ProductManager from './pages/admin/ProductManager';
import InventoryManager from './pages/admin/InventoryManager';
import OrderManager from './pages/admin/OrderManager';
import RequirementQuotes from './pages/admin/RequirementQuotes';
import Reports from './pages/admin/Reports';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-emerald-800 font-extrabold bootic-mesh-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 animate-spin">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-sm font-black tracking-wide">Loading Bootic B2B Wholesale Platform...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/catalog" replace />;
  }

  return children;
};

export const App = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bootic-mesh-bg text-slate-800 relative selection:bg-emerald-500 selection:text-white">
      {/* Global Ambient Glow Orbs */}
      <div className="fixed -top-40 left-1/4 w-[42rem] h-[42rem] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed top-1/3 -right-20 w-[36rem] h-[36rem] bg-teal-400/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed -bottom-40 left-10 w-[36rem] h-[36rem] bg-emerald-300/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Sticky Header */}
      <Navbar />

      {/* Main Content Area - Full width, perfectly centered grid container */}
      <main className="flex-1 w-full flex flex-col justify-start relative z-10">
        <Routes>
          {/* Public / Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterShopkeeper />} />

          {/* Root Redirect */}
          <Route
            path="/"
            element={
              user ? (
                isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/catalog" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Shopkeeper Routes */}
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requirements"
            element={
              <ProtectedRoute>
                <Requirements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addresses"
            element={
              <ProtectedRoute>
                <Addresses />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ProductManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute requireAdmin={true}>
                <InventoryManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin={true}>
                <OrderManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requirements"
            element={
              <ProtectedRoute requireAdmin={true}>
                <RequirementQuotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Signature Bootic Footer (Matched Alignment) */}
      <footer className="mt-auto w-full border-t border-emerald-900/10 bg-white/80 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-emerald-500/20">
              B
            </div>
            <div>
              <span className="font-black text-slate-900">BOOTIC B2B</span>
              <span className="text-slate-500 ml-1.5 font-medium">— Wholesale Clothing Distribution Platform (Mumbai)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-semibold text-[11px]">
            <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              FastAPI & MongoDB Engine
            </span>
            <span>© {new Date().getFullYear()} BOOTIC B2B. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
