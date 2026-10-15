import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { submitOrder } from '../services/api';

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    cartItems,
    grandTotal,
    clearCart,
    setCompletedOrder,
  } = useCart();

  const { user, token, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-fill user details if logged in
  useEffect(() => {
    if (isCheckoutOpen && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [isCheckoutOpen, user]);

  if (!isCheckoutOpen) return null;

  const formatInr = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!formData.address.trim() || formData.address.trim().length < 10) {
      setErrorMessage('Please provide a complete delivery address with city & PIN code.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your cart is empty. Add items before checking out.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const orderPayload = {
        userId: user ? user.id : null,
        customerName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        customerAddress: formData.address.trim(),
        items: cartItems.map((item) => ({
          productId: item.id,
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: grandTotal,
      };

      const result = await submitOrder(orderPayload, token);

      // On successful order placement
      setCompletedOrder(result.data || {
        orderId: Math.floor(100000 + Math.random() * 900000),
        customerName: formData.name,
        customerEmail: formData.email,
        customerAddress: formData.address,
        totalAmount: grandTotal,
        items: cartItems,
      });

      clearCart();
      closeCheckout();
    } catch (err) {
      console.error('Order submission failed:', err);
      setErrorMessage(err.message || 'Failed to place order. Please verify that your backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      id="checkout-modal-backdrop"
      onClick={(e) => {
        if (e.target.id === 'checkout-modal-backdrop' && !isSubmitting) {
          closeCheckout();
        }
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Checkout">
        <div className="modal-header">
          <h2 className="modal-title">Checkout & Delivery</h2>
          <button
            type="button"
            className="drawer-close-btn"
            id="close-checkout-btn"
            onClick={closeCheckout}
            disabled={isSubmitting}
            aria-label="Close checkout"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {isAuthenticated && (
            <div className="checkout-auth-badge">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Ordering as <strong>{user.name}</strong> ({user.email})</span>
            </div>
          )}

          {/* Order Summary box */}
          <div className="checkout-summary-mini">
            <div className="checkout-summary-title">Order Summary</div>
            <div className="checkout-items-preview">
              {cartItems.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total Payable</span>
              <span>{formatInr(grandTotal)}</span>
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} id="checkout-form">
            <div className="form-group">
              <label htmlFor="customer-name" className="form-label">
                Full Name *
              </label>
              <input
                id="customer-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Aarav Sharma"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-email" className="form-label">
                Email Address *
              </label>
              <input
                id="customer-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="e.g. aarav@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-address" className="form-label">
                Delivery Address (with City & PIN) *
              </label>
              <textarea
                id="customer-address"
                name="address"
                className="form-textarea"
                placeholder="e.g. Flat 302, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn-submit-order"
              id="btn-place-order"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Place Order • {formatInr(grandTotal)}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
