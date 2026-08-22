import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { SafeImage } from '../../components/ProductCard';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/format';

export default function AdminProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    setActiveImg(0);
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

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await api.delete(`/products/${id}`);
      toast.success(res.data.message);
      navigate('/admin/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <Loader label="Loading product..." full />;
  if (failed || !product) {
    return (
      <div className="admin-page">
        <EmptyState
          icon="😕"
          title="Product not found"
          message={failed || 'It may have been deleted.'}
          actionLabel="Back to Products"
          actionTo="/admin/products"
        />
      </div>
    );
  }

  const images = (product.images || []).filter(Boolean);
  const hasVariants = product.variants?.length > 0;
  const hasAddons = product.addons?.length > 0;

  return (
    <div className="admin-page">
      <Link to="/admin/products" className="link-arrow">← Back to Products</Link>

      <div className="apd-head">
        <h1>Product Details</h1>
        <div className="row-actions">
          <Link to={`/admin/products/edit/${product._id}`} className="btn btn-outline">✏️ Edit</Link>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="pdp-layout">
        {/* Gallery */}
        <section className="pdp-gallery card">
          <div className="pdp-main-img">
            <SafeImage src={images[activeImg] || product.image} alt={product.name} />
            {!product.isAvailable && (
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

        {/* Info */}
        <section className="pdp-info">
          <div className="pdp-title-row">
            <h2 style={{ fontSize: '1.5rem' }}>{product.name}</h2>
            <span className="category-chip">{product.category?.name || '-'}</span>
            <span className={`toggle ${product.isAvailable ? 'on' : 'off'} static`}>
              {product.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <p className="pdp-desc">{product.description}</p>

          <div className="pdp-price-row">
            <span className="product-price pdp-price">{formatCurrency(product.price)}</span>
            {(hasVariants || hasAddons) && <small className="muted">+ extras below</small>}
          </div>

          <div className="apd-meta card" style={{ padding: '16px 18px', marginTop: 18 }}>
            <h4 style={{ marginBottom: 10 }}>📋 Configuration Summary</h4>
            <div className="summary-row"><span>Images uploaded</span><strong>{images.length || 0}</strong></div>
            <div className="summary-row"><span>Variants</span><strong>{product.variants?.length || 0}</strong></div>
            <div className="summary-row"><span>Add-ons</span><strong>{product.addons?.length || 0}</strong></div>
            <div className="summary-row"><span>Created</span><strong>{new Date(product.createdAt).toLocaleDateString('en-IN')}</strong></div>
          </div>

          {hasVariants && (
            <div className="option-group">
              <h4>🎯 Variants</h4>
              <div className="option-grid">
                {product.variants.map((v, i) => (
                  <div key={v.name} className="option-card selected static">
                    <span className="option-check">{i === 0 ? '⭐' : '•'}</span>
                    <span className="option-name">{v.name}{i === 0 && <small className="muted"> (base)</small>}</span>
                    <span className="option-price">{v.priceDelta > 0 ? `+${formatCurrency(v.priceDelta)}` : formatCurrency(product.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasAddons && (
            <div className="option-group">
              <h4>🧩 Add-ons</h4>
              <div className="option-grid">
                {product.addons.map((a) => (
                  <div key={a.name} className="option-card check selected static">
                    <span className="option-check">☑</span>
                    <span className="option-name">{a.name}</span>
                    <span className="option-price">+{formatCurrency(a.priceDelta)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasVariants && !hasAddons && (
            <p className="muted small" style={{ marginTop: 16 }}>
              No variants or add-ons configured. Use <Link to={`/admin/products/edit/${product._id}`}>Edit</Link> to add them.
            </p>
          )}

          <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 26 }}>
            <Link to={`/admin/products/edit/${product._id}`} className="btn btn-primary btn-lg">✏️ Edit Product</Link>
            <Link to="/admin/products" className="btn btn-ghost">Back</Link>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete product?"
        message={`"${product.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
