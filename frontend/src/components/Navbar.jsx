import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, ShoppingCart, X, User, LogOut, Package, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ searchTerm, onSearchChange, onSearchClear }) {
  const { totalItemsCount, openCart, showToast } = useCart();
  const { user, isAuthenticated, logout, openLogin, openMyOrders } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    showToast('Signed out successfully.');
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <a href="/" className="brand-logo" id="brand-logo" aria-label="QuickCart Homepage">
          <div className="brand-icon-wrapper">
            <ShoppingBag size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-text-container">
            <div className="brand-name">
              Quick<span>Cart</span>
            </div>
            <div className="brand-subtitle">Essentials Express</div>
          </div>
        </a>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              id="search-input"
              type="text"
              className="search-input"
              placeholder="Search products, brands, or categories..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search products"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={onSearchClear}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Navbar Actions */}
        <div className="navbar-actions">
          {/* User Auth Section */}
          {isAuthenticated ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <button
                type="button"
                className="user-profile-btn"
                id="user-profile-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-label="User Account Menu"
              >
                <div className="user-avatar-badge">
                  {getUserInitials(user.name)}
                </div>
                <span className="user-first-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="user-dropdown-menu" role="menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.name}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item"
                    id="dropdown-my-orders-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      openMyOrders();
                    }}
                  >
                    <Package size={16} />
                    <span>My Orders</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item danger"
                    id="dropdown-logout-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn-signin-nav"
              id="btn-signin-nav"
              onClick={openLogin}
            >
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}

          {/* Cart Button */}
          <button
            id="cart-button"
            className="cart-button"
            onClick={openCart}
            aria-label={`View cart with ${totalItemsCount} items`}
          >
            <ShoppingCart size={18} />
            <span>Cart</span>
            {totalItemsCount > 0 && (
              <span className="cart-badge" id="cart-item-count">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
