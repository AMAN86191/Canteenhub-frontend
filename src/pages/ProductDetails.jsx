import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { SafeImage } from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [activeImg, setActiveImg] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    setActiveImg(0);
    setVariantIdx(0);
    setSelectedAddons([]);
    setQty(1);
    setAdded(false);
    (async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data.product);
      } catch (err) {
        setFailed(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const images = useMemo(
    () => (product ? (product.images || []).filter(Boolean).concat(product.image && product.images?.length === 0 ? [product.image] : []) : []),
    [product]
  );

  const variants = product?.variants || [];
  const addons = product?.addons || [];
  const variant = variants[variantIdx];
  const unitTotal = useMemo(() => {
    if (!product) return 0;
    const addonSum = selectedAddons.reduce((acc, a) => acc + Number(a.priceDelta || 0), 0);
    return Number(product.price) + Number(variant?.priceDelta || 0) + addonSum;
  }, [product, variant, selectedAddons]);

  function toggleAddon(addon) {
    setSelectedAddons((prev) =>
      prev.some((a) => a.name === addon.name)
        ? prev.filter((a) => a.name !== addon.name)
        : [...prev, addon]
    );
  }

  function handleAddToCart() {
    if (!product || product.isAvailable === false) return;
    addItem(product, qty, {
      variantName: variants.length ? variant.name : '',
      addons: selectedAddons,
    });
    toast.success(`${product.name} added to cart!`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  function handleBuyNow() {
    handleAddToCart();
    navigate('/cart');
  }

  if (loading) return <Loader label="Loading product..." full />;
  if (failed || !product) {
    return (
      <div className="container page">
        <EmptyState
          icon="😕"
          title="Product not found"
          message={failed || 'This item may have been removed.'}
          actionLabel="Back to Menu"
          actionTo="/menu"
        />
      </div>
    );
  }

  const unavailable = product.isAvailable === false;

  return (
    <div className="container page">
      <Link to="/menu" className="link-arrow">← Back to Menu</Link>

      <div className="pdp-layout">
        {/* Left - image gallery */}
        <section className="pdp-gallery card">
          <div className="pdp-main-img">
            <SafeImage src={images[activeImg]} alt={product.name} />
            {unavailable && (
              <span className="availability-badge unavailable">Currently Unavailable</span>
            )}
            {images.length > 1 && activeImg > 0 && (
              <button type="button" className="img-nav prev" style={{ opacity: 1 }} aria-label="Previous image" onClick={() => setActiveImg((i) => Math.max(0, i - 1))}>‹</button>
            )}
            {images.length > 1 && activeImg < images.length - 1 && (
              <button type="button" className="img-nav next" style={{ opacity: 1 }} aria-label="Next image" onClick={() => setActiveImg((i) => Math.min(images.length - 1, i + 1))}>›</button>
            )}
          </div>
          {images.length > 1 && (
            <div className="pdp-thumbs">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  className={`pdp-thumb ${i === activeImg ? 'on' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right - details + customization */}
        <section className="pdp-info">
          <div className="pdp-title-row">
            <h1>{product.name}</h1>
            <span className="category-chip">{product.category?.name || 'Food'}</span>
          </div>
          <p className="pdp-desc">{product.description}</p>

          <div className="pdp-price-row">
            <span className="product-price pdp-price">{formatCurrency(unitTotal)}</span>
            {(variants.length > 0 || selectedAddons.length > 0) && (
              <small className="muted">base {formatCurrency(product.price)}</small>
            )}
          </div>

          {variants.length > 0 && (
            <div className="option-group">
              <h4>
                Choose Option <span className="opt-required">(required)</span>
              </h4>
              <div className="option-grid">
                {variants.map((v, i) => (
                  <label key={v.name} className={`option-card ${i === variantIdx ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="variant"
                      checked={i === variantIdx}
                      onChange={() => setVariantIdx(i)}
                    />
                    <span className="option-name">{v.name}</span>
                    <span className="option-price">
                      {v.priceDelta > 0 ? `+${formatCurrency(v.priceDelta)}` : 'Base'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {addons.length > 0 && (
            <div className="option-group">
              <h4>Add-ons <span className="muted small">(optional)</span></h4>
              <div className="option-grid">
                {addons.map((a) => {
                  const on = selectedAddons.some((x) => x.name === a.name);
                  return (
                    <label key={a.name} className={`option-card check ${on ? 'selected' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleAddon(a)} />
                      <span className="option-check">{on ? '☑' : '☐'}</span>
                      <span className="option-name">{a.name}</span>
                      <span className="option-price">+{formatCurrency(a.priceDelta)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pdp-actions">
            <div className="qty-controls lg" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={unavailable}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} disabled={unavailable}>+</button>
            </div>
            <button
              type="button"
              className={`btn btn-primary btn-lg ${added ? 'btn-success-pulse' : ''}`}
              disabled={unavailable}
              onClick={handleAddToCart}
            >
              {unavailable ? 'Unavailable' : added ? '✓ Added!' : `Add to Cart · ${formatCurrency(unitTotal * qty)}`}
            </button>
            <button type="button" className="btn btn-outline btn-lg" disabled={unavailable} onClick={handleBuyNow}>
              Buy Now
            </button>
          </div>

          <p className="pdp-note">🛍️ Order ahead and skip the canteen queue!</p>
        </section>
      </div>
    </div>
  );
}
