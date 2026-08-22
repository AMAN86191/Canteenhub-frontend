import { useState } from 'react';

/** Product image with graceful fallback when the URL fails to load. */
export function SafeImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  const fallback = 'https://placehold.co/600x400/ffedd5/f97316?text=CanteenHub';
  return (
    <img
      src={failed || !src ? fallback : src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductCard({ product, onAdd, addedLabel }) {
  const unavailable = !product.isAvailable;
  const categoryName = product.category?.name || 'Food';

  return (
    <article className={`product-card ${unavailable ? 'card-unavailable' : ''}`}>
      <div className="product-img-wrap">
        <SafeImage src={product.image} alt={product.name} className="product-img" />
        {unavailable ? (
          <span className="availability-badge unavailable">Currently Unavailable</span>
        ) : (
          <span className="availability-badge available">Available</span>
        )}
      </div>
      <div className="product-body">
        <div className="product-top">
          <h3 className="product-name">{product.name}</h3>
          <span className="category-chip">{categoryName}</span>
        </div>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
          <button
            type="button"
            className={`btn btn-sm ${unavailable ? 'btn-outline' : 'btn-primary'}`}
            disabled={unavailable}
            onClick={() => onAdd(product)}
          >
            {unavailable ? 'Unavailable' : addedLabel ? `✓ ${addedLabel}` : '+ Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
