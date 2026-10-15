import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Toast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="toast-container" id="toast-notification">
      <div className="toast">
        <CheckCircle size={18} className="toast-icon" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
