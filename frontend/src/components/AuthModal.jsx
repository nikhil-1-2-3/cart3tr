import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    signup,
  } = useAuth();

  const { showToast } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const isSignup = authModalMode === 'signup';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleToggleMode = (mode) => {
    setAuthModalMode(mode);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup && !formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isSignup) {
        await signup(formData.name.trim(), formData.email.trim(), formData.password);
        showToast(`Welcome to QuickCart, ${formData.name.trim()}!`);
      } else {
        await login(formData.email.trim(), formData.password);
        showToast('Signed in successfully!');
      }
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      id="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target.id === 'auth-modal-backdrop' && !isLoading) {
          closeAuthModal();
        }
      }}
    >
      <div className="modal-card auth-modal-card" role="dialog" aria-modal="true" aria-label="Authentication">
        <div className="modal-header">
          <div className="auth-tab-group">
            <button
              type="button"
              className={`auth-tab-btn ${!isSignup ? 'active' : ''}`}
              id="tab-btn-login"
              onClick={() => handleToggleMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${isSignup ? 'active' : ''}`}
              id="tab-btn-signup"
              onClick={() => handleToggleMode('signup')}
            >
              Create Account
            </button>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            id="close-auth-modal-btn"
            onClick={closeAuthModal}
            disabled={isLoading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="auth-header-desc">
            <h3 className="auth-title">
              {isSignup ? 'Create your QuickCart account' : 'Welcome back to QuickCart'}
            </h3>
            <p className="auth-subtitle">
              {isSignup
                ? 'Sign up to track orders, save addresses, and speed up checkout.'
                : 'Enter your credentials to access your account and orders.'}
            </p>
          </div>

          {errorMessage && (
            <div className="auth-error-banner" id="auth-error-message">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} id="auth-form">
            {isSignup && (
              <div className="form-group">
                <label htmlFor="auth-name" className="form-label">
                  Full Name
                </label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-field-icon" />
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    className="form-input auth-input"
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required={isSignup}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email" className="form-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-field-icon" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  className="form-input auth-input"
                  placeholder="e.g. priya@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="auth-password" className="form-label">
                Password
              </label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-field-icon" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-order"
              id="btn-auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{isSignup ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-toggle">
            {isSignup ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => handleToggleMode('login')}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => handleToggleMode('signup')}
                >
                  Create one now
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
