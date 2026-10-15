import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    grandTotal,
    openCheckout,
  } = useCart();

  if (!isCartOpen) return null;

  // Formatting helper
  const formatInr = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const neededForFreeShipping = Math.max(0, 499 - subtotal);

  return (
    <div
      className="drawer-backdrop"
      id="cart-drawer-backdrop"
      onClick={(e) => {
        if (e.target.id === 'cart-drawer-backdrop') closeCart();
      }}
    >
      <div className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Cart">
        {/* Header */}
        <div className="drawer-header">
          <h2 className="drawer-title">
            <ShoppingBag size={20} />
            Your Shopping Cart ({cartItems.reduce((a, b) => a + b.quantity, 0)})
          </h2>
          <button
            type="button"
            className="drawer-close-btn"
            id="close-cart-btn"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {cartItems.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto 0' }}>
              <div className="empty-state-icon">
                <ShoppingBag size={28} />
              </div>
              <h3 className="empty-state-title">Your cart is empty</h3>
              <p className="empty-state-desc">
                Looks like you haven&apos;t added any products to your cart yet.
              </p>
              <button
                type="button"
                className="btn-add-cart"
                onClick={closeCart}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Delivery notice */}
              <div className="delivery-notice">
                {neededForFreeShipping > 0 ? (
                  <span>
                    Add <strong>{formatInr(neededForFreeShipping)}</strong> more to get <strong>FREE delivery</strong>!
                  </span>
                ) : (
                  <span>🎉 <strong>FREE Delivery</strong> unlocked on this order!</span>
                )}
              </div>

              {/* Items List */}
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item-card" id={`cart-item-${item.id}`}>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-details">
                    <div className="cart-item-name" title={item.name}>
                      {item.name}
                    </div>
                    <div className="cart-item-unit-price">
                      {formatInr(item.price)} each
                    </div>
                    <div className="cart-item-qty-row">
                      <button
                        type="button"
                        className="qty-btn"
                        id={`qty-minus-${item.id}`}
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value" id={`qty-val-${item.id}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="qty-btn"
                        id={`qty-plus-${item.id}`}
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-right">
                    <div className="cart-item-subtotal">
                      {formatInr(item.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      className="btn-remove-item"
                      id={`remove-item-${item.id}`}
                      onClick={() => removeFromCart(item.id)}
                      title="Remove product"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer with totals & Checkout Button */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="bill-row">
              <span>Subtotal</span>
              <span>{formatInr(subtotal)}</span>
            </div>
            <div className="bill-row">
              <span>Standard Delivery</span>
              <span>{shippingFee === 0 ? <strong style={{ color: 'var(--success-600)' }}>FREE</strong> : formatInr(shippingFee)}</span>
            </div>
            <div className="bill-row total">
              <span>Total Amount</span>
              <span id="cart-grand-total">{formatInr(grandTotal)}</span>
            </div>

            <button
              type="button"
              className="btn-checkout"
              id="btn-proceed-checkout"
              onClick={openCheckout}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
