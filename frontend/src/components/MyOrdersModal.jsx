import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, MapPin, Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrders } from '../services/api';

export default function MyOrdersModal() {
  const { isMyOrdersOpen, closeMyOrders, token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isMyOrdersOpen && token) {
      setIsLoading(true);
      setError(null);
      fetchMyOrders(token)
        .then((res) => {
          setOrders(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to load my orders:', err);
          setError(err.message || 'Could not fetch order history.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isMyOrdersOpen, token]);

  if (!isMyOrdersOpen) return null;

  const formatInr = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="modal-backdrop"
      id="my-orders-modal-backdrop"
      onClick={(e) => {
        if (e.target.id === 'my-orders-modal-backdrop') closeMyOrders();
      }}
    >
      <div className="modal-card orders-modal-card" role="dialog" aria-modal="true" aria-label="My Orders">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={22} style={{ color: 'var(--primary-600)' }} />
            <h2 className="modal-title">My Orders</h2>
            {orders.length > 0 && (
              <span className="section-count-badge">{orders.length}</span>
            )}
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            id="close-my-orders-btn"
            onClick={closeMyOrders}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body orders-modal-body">
          {isLoading ? (
            <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--primary-600)' }} />
              <p>Loading your past orders...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p style={{ color: 'var(--danger-600)', marginBottom: '1rem' }}>{error}</p>
              <button type="button" className="btn-add-cart" onClick={() => closeMyOrders()}>
                Close
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
              <div className="empty-state-icon">
                <ShoppingBag size={28} />
              </div>
              <h3 className="empty-state-title">No orders yet</h3>
              <p className="empty-state-desc">
                You haven&apos;t placed any orders yet. Explore our products and place your first order!
              </p>
              <button
                type="button"
                className="btn-add-cart"
                onClick={closeMyOrders}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-history-card" id={`order-card-${order.id}`}>
                  <div className="order-history-header">
                    <div>
                      <span className="order-ref-number">Order #{order.id}</span>
                      <div className="order-meta-info">
                        <span className="order-meta-date">
                          <Calendar size={13} />
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="order-status-pill">{order.status || 'Confirmed'}</span>
                      <div className="order-history-total">{formatInr(order.total_amount)}</div>
                    </div>
                  </div>

                  <div className="order-shipping-addr">
                    <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-muted)' }} />
                    <span>{order.customer_address}</span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="order-history-items-list">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-history-item-row">
                          <span className="order-item-title">
                            {item.product_name || `Product #${item.product_id}`} × {item.quantity}
                          </span>
                          <span className="order-item-price">
                            {formatInr(item.subtotal || item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
