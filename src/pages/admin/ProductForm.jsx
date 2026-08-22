import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import { useToast } from '../../context/ToastContext';
import { SafeImage } from '../../components/ProductCard';

const EMPTY = { name: '', description: '', price: '', category: '', image: '', isAvailable: true };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data.categories);
      } catch {
        toast.error('Could not load categories.');
      }
      if (isEdit) {
        try {
          const res = await api.get(`/products/${id}`);
          setForm({
            name: res.data.data.product.name,
            description: res.data.data.product.description,
            price: String(res.data.data.product.price),
            category: res.data.data.product.category?._id || '',
            image: res.data.data.product.image || '',
            isAvailable: res.data.data.product.isAvailable,
          });
        } catch (err) {
          toast.error(getErrorMessage(err));
          navigate('/admin/products');
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required.';
    if (!form.description.trim()) next.description = 'Description is required.';
    else if (form.description.trim().length < 5) next.description = 'Description must be at least 5 characters.';
    const price = Number(form.price);
    if (!form.price) next.price = 'Price is required.';
    else if (!Number.isFinite(price) || price <= 0) next.price = 'Price must be greater than zero.';
    if (!form.category) next.category = 'Please select a category.';
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      image: form.image.trim(),
      isAvailable: form.isAvailable,
    };
    try {
      const res = isEdit
        ? await api.put(`/products/${id}`, payload)
        : await api.post('/products', payload);
      toast.success(res.data.message);
      navigate('/admin/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading product..." full />;

  return (
    <div className="admin-page">
      <Link to="/admin/products" className="link-arrow">
        ← Back to Products
      </Link>
      <h1>{isEdit ? 'Edit Product ✏️' : 'Add Product ➕'}</h1>

      <div className="form-layout">
        <section className="card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="pname">Product Name *</label>
              <input
                id="pname"
                type="text"
                value={form.name}
                placeholder="e.g. Paneer Tikka Sandwich"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="pdesc">Description *</label>
              <textarea
                id="pdesc"
                rows={3}
                value={form.description}
                placeholder="Short tasty description..."
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pprice">Price (₹) *</label>
                <input
                  id="pprice"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  placeholder="99"
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="pcat">Category *</label>
                <select
                  id="pcat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pimg">Image URL</label>
              <input
                id="pimg"
                type="url"
                value={form.image}
                placeholder="https://example.com/burger.jpg"
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
              <small className="muted">Leave blank to use the default placeholder image.</small>
            </div>

            <div className="form-group checkbox-row">
              <input
                id="pavail"
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              />
              <label htmlFor="pavail">Available for ordering</label>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </form>
        </section>

        <aside className="card preview-card">
          <h3>Live Preview</h3>
          <SafeImage src={form.image} alt="Product preview" className="preview-img" />
          <strong>{form.name || 'Product name'}</strong>
          <p className="muted small">{form.description || 'Description preview'}</p>
          <span className="product-price">{Number(form.price) > 0 ? `₹${Number(form.price).toLocaleString('en-IN')}` : '₹--'}</span>
        </aside>
      </div>
    </div>
  );
}
