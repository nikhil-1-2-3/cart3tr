import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderConfirmationModal from './components/OrderConfirmationModal';
import AuthModal from './components/AuthModal';
import MyOrdersModal from './components/MyOrdersModal';
import Toast from './components/Toast';
import { fetchProducts } from './services/api';
import { Zap, ShieldCheck, Truck, RotateCcw, Server, Cloud, Database } from 'lucide-react';

function QuickCartMain() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load products with optional search query
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      setIsLoading(true);
      fetchProducts(searchTerm)
        .then((response) => {
          if (isMounted) {
            setProducts(response.data || []);
            setError(null);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error('Failed to fetch products:', err);
            setError(err.message || 'Could not connect to QuickCart API.');
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  return (
    <div className="app-container">
      {/* Top Banner */}
      <div className="announcement-bar">
        <span className="announcement-tag">LIMITED OFFER</span>
        <span>⚡ Free Express Delivery on orders above ₹499 anywhere in India</span>
      </div>

      {/* Main Navbar */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchClear={() => setSearchTerm('')}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-pill">
            <Zap size={14} />
            <span>AWS 3-Tier Architecture Ready</span>
          </div>

          <h1 className="hero-title">
            Premium Essentials, <br />
            Delivered in Minutes.
          </h1>

          <p className="hero-subtitle">
            Experience lightning-fast shopping with QuickCart. Handpicked electronics,
            audio gear, and daily essentials with verified customer reviews and instant checkout.
          </p>

          <div className="hero-features">
            <div className="hero-feature-item">
              <span className="hero-feature-icon"><Truck size={18} /></span>
              <span>Fast Track Delivery</span>
            </div>
            <div className="hero-feature-item">
              <span className="hero-feature-icon"><ShieldCheck size={18} /></span>
              <span>100% Genuine Brands</span>
            </div>
            <div className="hero-feature-item">
              <span className="hero-feature-icon"><RotateCcw size={18} /></span>
              <span>7-Day Easy Returns</span>
            </div>
          </div>
        </section>

        {/* Product Catalog Grid */}
        <ProductGrid
          products={products}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
          onResetSearch={() => setSearchTerm('')}
        />
      </main>

      {/* Slide-over Cart & Modals */}
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <AuthModal />
      <MyOrdersModal />
      <Toast />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-badge">
            <Cloud size={14} style={{ color: 'var(--primary-600)' }} />
            <span>Vercel (React + Vite)</span>
            <span>•</span>
            <Server size={14} style={{ color: '#059669' }} />
            <span>AWS EC2 + ALB (Express)</span>
            <span>•</span>
            <Database size={14} style={{ color: '#d97706' }} />
            <span>Amazon RDS (MySQL)</span>
          </div>

          <div className="footer-copy">
            © {new Date().getFullYear()} QuickCart E-Commerce. All rights reserved. Built for AWS 3-Tier Architecture practice.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <QuickCartMain />
      </CartProvider>
    </AuthProvider>
  );
}
