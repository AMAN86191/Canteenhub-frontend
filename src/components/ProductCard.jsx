import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

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

const PLACEHOLDER = 'https://placehold.co/600x400/ffedd5/f97316?text=CanteenHub';

export default function ProductCard({ product, addedLabel }) {
  const unavailable = !product.isAvailable;
  const categoryName = product.category?.name || 'Food';
  const images = (product.images || []).filter(Boolean);
  if (images.length === 0 && product.image) images.push(product.image);

  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = images[activeIdx] || '';

  const needsCustomization =
    (product.variants?.length > 0) || (product.addons?.length > 0);

  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleQuickAdd() {
    if (unavailable || needsCustomization) return;
    addItem(product, 1, {});
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  const mainButton = needsCustomization ? (
    <Link
      to={`/product/${product._id}`}
      className={`btn btn-sm ${unavailable ? 'btn-outline disabled' : 'btn-primary'}`}
      aria-disabled={unavailable}
      onClick={(e) => unavailable && e.preventDefault()}
    >
      {unavailable ? 'Unavailable' : '⚙ Customize'}
    </Link>
  ) : (
    <button
      type="button"
      className={`btn btn-sm ${unavailable ? 'btn-outline' : justAdded ? 'btn-success' : 'btn-primary'}`}
      disabled={unavailable}
      onClick={handleQuickAdd}
    >
      {unavailable ? 'Unavailable' : justAdded ? '✓ Added!' : '+ Add to Cart'}
    </button>
  );

  return (
    <article className={`product-card ${unavailable ? 'card-unavailable' : ''}`}>
      <Link to={`/product/${product._id}`} className="product-img-link">
        <div className="product-img-wrap">
          <SafeImage src={activeImage || PLACEHOLDER} alt={product.name} className="product-img" key={activeImage} />

          {unavailable ? (
            <span className="availability-badge unavailable">Currently Unavailable</span>
          ) : (
            <span className="availability-badge available">Available</span>
          )}

          {!unavailable && images.length > 1 && (
            <>
              {activeIdx > 0 && (
                <button
                  type="button"
                  className="img-nav prev"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIdx((i) => Math.max(0, i - 1));
                  }}
                >
                  ‹
                </button>
              )}
              {activeIdx < images.length - 1 && (
                <button
                  type="button"
                  className="img-nav next"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIdx((i) => Math.min(images.length - 1, i + 1));
                  }}
                >
                  ›
                </button>
              )}
              <div className="img-dots">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`img-dot ${i === activeIdx ? 'on' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveIdx(i);
                    }}
                    role="presentation"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Link>
      <div className="product-body">
        <div className="product-top">
          <h3 className="product-name">
            <Link to={`/product/${product._id}`} className="product-name-link">{product.name}</Link>
          </h3>
          <span className="category-chip">{categoryName}</span>
        </div>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">
            ₹{Number(product.price).toLocaleString('en-IN')}
            {needsCustomization && <small className="muted">+</small>}
          </span>
          {mainButton}
        </div>
      </div>
    </article>
  );
}
