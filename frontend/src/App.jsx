import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

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
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-semibold">
        Loading...
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
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
    </div>
  );
};

export default App;
