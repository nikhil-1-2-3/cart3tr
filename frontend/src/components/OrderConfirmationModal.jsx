import React from 'react';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function OrderConfirmationModal() {
  const { completedOrder, setCompletedOrder } = useCart();

  if (!completedOrder) return null;

  const formatInr = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const handleClose = () => {
    setCompletedOrder(null);
  };

  const orderId = completedOrder.orderId || completedOrder.id;

  return (
    <div
      className="modal-backdrop"
      id="order-confirmation-backdrop"
      onClick={(e) => {
        if (e.target.id === 'order-confirmation-backdrop') handleClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Order Confirmation">
        <div className="confirmation-body">
          <div className="confirmation-check-icon">
            <CheckCircle2 size={44} />
          </div>

          <h2 className="confirmation-title">Order Placed Successfully!</h2>
          <p className="confirmation-subtitle">
            Thank you, <strong>{completedOrder.customerName}</strong>! Your order has been placed and saved to our database.
          </p>

          <div className="order-badge-pill" id="order-id-badge">
            Order Reference #{orderId}
          </div>

          <div className="confirmation-details-box">
            <div className="detail-line">
              <strong>Email:</strong> {completedOrder.customerEmail}
            </div>
            <div className="detail-line">
              <strong>Delivery To:</strong> {completedOrder.customerAddress}
            </div>
            <div className="detail-line">
              <strong>Payment Status:</strong> <span style={{ color: 'var(--success-600)', fontWeight: 700 }}>Confirmed (Cash on Delivery / Prepaid)</span>
            </div>
            <div className="detail-line" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
              <strong>Total Amount:</strong> {formatInr(completedOrder.totalAmount)}
            </div>
          </div>

          {completedOrder.items && completedOrder.items.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: '1.5rem', maxHeight: '140px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Purchased Items ({completedOrder.items.length})
              </div>
              {completedOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>{item.name || `Product #${item.productId || item.id}`} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{formatInr((item.price || item.unit_price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn-continue-shopping"
            id="btn-continue-shopping"
            onClick={handleClose}
          >
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>
    </div>
  );
}
