import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('b2b_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('b2b_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('b2b_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('b2b_token', accessToken);
    localStorage.setItem('b2b_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('b2b_token');
    localStorage.removeItem('b2b_user');
  };

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  const isShopkeeper = user && user.role === 'SHOPKEEPER';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isShopkeeper }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
