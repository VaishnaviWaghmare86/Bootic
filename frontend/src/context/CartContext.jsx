import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, isShopkeeper } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isShopkeeper) return;
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isShopkeeper) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user, isShopkeeper]);

  const addToCart = async (productId, quantity, selectedSize = 'L', selectedColor = null) => {
    try {
      const res = await api.post('/cart/items', {
        product_id: productId,
        quantity,
        selected_size: selectedSize,
        selected_color: selectedColor,
      });
      if (res.data.success) {
        setCart(res.data.data);
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to add item to cart',
      };
    }
  };

  const updateQuantity = async (productId, quantity, selectedSize = 'L') => {
    try {
      const res = await api.put(`/cart/items/${productId}`, {
        quantity,
        selected_size: selectedSize,
      });
      if (res.data.success) {
        setCart(res.data.data);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update quantity',
      };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart(null);
      fetchCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const totalItemsCount = cart?.total_quantity || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        totalItemsCount,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
