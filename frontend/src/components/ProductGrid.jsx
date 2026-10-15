import React from 'react';
import ProductCard from './ProductCard';
import { PackageOpen, Sparkles } from 'lucide-react';

export default function ProductGrid({ products, isLoading, error, searchTerm, onResetSearch }) {
  if (isLoading) {
    return (
      <div className="product-grid" aria-label="Loading products">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="product-card" style={{ opacity: 0.6 }}>
            <div className="product-card-image-wrapper" style={{ backgroundColor: '#e2e8f0' }} />
            <div className="product-card-body">
              <div style={{ height: '16px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ height: '22px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ height: '36px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '16px' }} />
              <div style={{ height: '40px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <PackageOpen size={28} />
        </div>
        <h3 className="empty-state-title">Could not load products</h3>
        <p className="empty-state-desc">{error}</p>
        <button
          type="button"
          className="btn-add-cart"
          onClick={() => window.location.reload()}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <PackageOpen size={28} />
        </div>
        <h3 className="empty-state-title">No products found</h3>
        <p className="empty-state-desc">
          No matches found for &quot;{searchTerm}&quot;. Try checking for typos or searching a broader term.
        </p>
        {onResetSearch && (
          <button
            type="button"
            className="btn-add-cart"
            onClick={onResetSearch}
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">
          <Sparkles size={20} style={{ color: 'var(--primary-600)' }} />
          Featured Products
        </h2>
        <span className="section-count-badge">
          Showing {products.length} {products.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="product-grid" id="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
