import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import SearchBar from '../../components/SearchBar';
import { SafeImage } from '../../components/ProductCard';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/format';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data.products);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load products.'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.data.categories))
      .catch(() => {});
    loadProducts();
  }, [loadProducts]);

  async function toggleAvailability(product) {
    setTogglingId(product._id);
    try {
      const res = await api.patch(`/products/${product._id}/availability`, {
        isAvailable: !product.isAvailable,
      });
      setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.data.product : p)));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/products/${deleteTarget._id}`);
      toast.success(res.data.message);
      setDeleteTarget(null);
      loadProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="page-head-row">
        <div>
          <h1>Products 🍔</h1>
          <p className="muted">{products.length} item(s) on the menu</p>
        </div>
        <Link to="/admin/products/add" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      <div className="menu-controls">
        <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
        <select
          className="select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader label="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState icon="🍔" title="No products found" message="Add your first product to get started." actionLabel="+ Add Product" actionTo="/admin/products/add" />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="cell-product">
                      <Link to={`/admin/products/${product._id}`} style={{ display: 'contents' }}>
                        <SafeImage src={product.images?.[0] || product.image} alt={product.name} className="thumb" />
                      </Link>
                      <div>
                        <strong>
                          <Link to={`/admin/products/${product._id}`} className="apd-name-link">{product.name}</Link>
                        </strong>
                        <small className="muted d-block clamp-1">{product.description}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category?.name || '-'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <button
                      type="button"
                      className={`toggle ${product.isAvailable ? 'on' : 'off'}`}
                      disabled={togglingId === product._id}
                      onClick={() => toggleAvailability(product)}
                      aria-label={`Toggle availability for ${product.name}`}
                    >
                      {togglingId === product._id ? '...' : product.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/admin/products/edit/${product._id}`} className="btn btn-outline btn-xs">
                        Edit
                      </Link>
                      <button type="button" className="btn btn-danger btn-xs" onClick={() => setDeleteTarget(product)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete Product"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
