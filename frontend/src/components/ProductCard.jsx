import React, { useState } from 'react';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  // Format price in Indian Rupee format
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  // Fallback image placeholder
  const fallbackImg = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

  return (
    <article className="product-card" id={`product-card-${product.id}`}>
      <div className="product-card-image-wrapper">
        <img
          src={imgError ? fallbackImg : product.image_url}
          alt={product.name}
          className="product-card-image"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {product.category && (
          <span className="product-category-tag">{product.category}</span>
        )}
      </div>

      <div className="product-card-body">
        <div className="product-rating">
          <Star size={15} />
          <span>{product.rating || '4.5'}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            ({product.stock || 45} in stock)
          </span>
        </div>

        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        <p className="product-description">{product.description}</p>

        <div className="product-card-footer">
          <div className="product-price-wrapper">
            <span className="price-currency-label">Price</span>
            <span className="product-price" id={`product-price-${product.id}`}>
              {formattedPrice}
            </span>
          </div>

          <button
            type="button"
            id={`add-to-cart-btn-${product.id}`}
            className={`btn-add-cart ${isAdded ? 'added' : ''}`}
            onClick={handleAdd}
            aria-label={`Add ${product.name} to cart`}
          >
            {isAdded ? (
              <>
                <Check size={16} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
