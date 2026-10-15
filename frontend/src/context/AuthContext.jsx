import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, signupUser, fetchCurrentUser } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('quickcart_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('quickcart_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);

  // Validate token on initial mount
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token)
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('quickcart_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        });
    }
  }, [token]);

  /**
   * Log in user
   */
  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('quickcart_token', res.token);
      localStorage.setItem('quickcart_user', JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      return res;
    }
    throw new Error('Invalid login response');
  };

  /**
   * Sign up user
   */
  const signup = async (name, email, password) => {
    const res = await signupUser({ name, email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('quickcart_token', res.token);
      localStorage.setItem('quickcart_user', JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      return res;
    }
    throw new Error('Invalid signup response');
  };

  /**
   * Log out user
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('quickcart_token');
      localStorage.removeItem('quickcart_user');
    } catch (err) {
      console.warn('Error clearing localStorage', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLogin: () => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        },
        openSignup: () => {
          setAuthModalMode('signup');
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => setIsAuthModalOpen(false),
        isMyOrdersOpen,
        openMyOrders: () => setIsMyOrdersOpen(true),
        closeMyOrders: () => setIsMyOrdersOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
