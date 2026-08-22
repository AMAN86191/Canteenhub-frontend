import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import { useToast } from '../../context/ToastContext';
import { SafeImage } from '../../components/ProductCard';

const MAX_IMAGES = 6;
const EMPTY = { name: '', description: '', price: '', category: '', isAvailable: true };

/** Reusable editor for variants / add-ons lists. */
function ChoiceEditor({ icon, title, hint, list, onChange, maxItems }) {
  function update(i, field, value) {
    const next = list.map((row, idx) => (idx === i ? { ...row, [field]: value } : row));
    onChange(next);
  }
  function remove(i) {
    onChange(list.filter((_, idx) => idx !== i));
  }
  function add() {
    if (list.length >= maxItems) return;
    onChange([...list, { name: '', priceDelta: '' }]);
  }

  return (
    <div className="form-group">
      <label>
        {icon} {title} <span className="muted small">({list.length}/{maxItems})</span>
      </label>
      <small className="muted d-block" style={{ marginTop: -4, marginBottom: 8 }}>{hint}</small>

      {list.map((row, i) => (
        <div key={i} className="choice-row">
          <input
            type="text"
            placeholder={i === 0 && title === 'Variants' ? 'e.g. Simple' : 'e.g. Extra Cheese'}
            value={row.name}
            onChange={(e) => update(i, 'name', e.target.value)}
          />
          <div className="choice-price">
            <span>₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={row.priceDelta}
              onChange={(e) => update(i, 'priceDelta', e.target.value)}
              aria-label="Extra price"
            />
          </div>
          <button type="button" className="icon-btn danger choice-remove" onClick={() => remove(i)} aria-label="Remove">
            🗑️
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-outline btn-sm" onClick={add} disabled={list.length >= maxItems}>
        + Add {title === 'Variants' ? 'Variant' : 'Add-on'}
      </button>
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [addons, setAddons] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

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
          const p = res.data.data.product;
          setForm({
            name: p.name,
            description: p.description,
            price: String(p.price),
            category: p.category?._id || '',
            isAvailable: p.isAvailable,
          });
          setImages(p.images?.length ? p.images : p.image ? [p.image] : []);
          setVariants(p.variants || []);
          setAddons(p.addons || []);
        } catch (err) {
          toast.error(getErrorMessage(err));
          navigate('/admin/products');
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    if (images.length >= MAX_IMAGES) {
      return toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
    }
    const slotsLeft = MAX_IMAGES - images.length;
    const chosen = files.slice(0, slotsLeft);
    if (files.length > slotsLeft) {
      toast.error(`Only ${slotsLeft} more image(s) can be added.`);
    }

    const fd = new FormData();
    chosen.forEach((f) => fd.append('images', f));

    setUploading(true);
    try {
      const { data } = await api.post('/upload', fd);
      setImages((prev) => [...prev, ...data.data.images].slice(0, MAX_IMAGES));
      setActiveImg(images.length);
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setActiveImg(0);
  }

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

  function cleanChoices(list) {
    return list
      .map((r) => ({
        name: String(r.name || '').trim(),
        priceDelta: r.priceDelta === '' || r.priceDelta === null || r.priceDelta === undefined ? 0 : Number(r.priceDelta),
      }))
      .filter((r) => r.name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const cleanVariants = cleanChoices(variants);
    const cleanAddons = cleanChoices(addons);
    if (cleanVariants.some((v) => !Number.isFinite(v.priceDelta) || v.priceDelta < 0)) {
      return toast.error('Variant prices must be zero or more.');
    }
    if (cleanAddons.some((a) => !Number.isFinite(a.priceDelta) || a.priceDelta < 0)) {
      return toast.error('Add-on prices must be zero or more.');
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      images,
      variants: cleanVariants,
      addons: cleanAddons,
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

            {/* Image uploader */}
            <div className="form-group">
              <label>Product Images ({images.length}/{MAX_IMAGES})</label>

              <div
                className={`upload-zone ${dragging ? 'drag' : ''} ${uploading ? 'busy' : ''}`}
                onClick={() => !uploading && fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (!uploading) uploadFiles(e.dataTransfer.files);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <span className="upload-spinner" />
                    <p>Uploading to Cloudinary...</p>
                  </>
                ) : (
                  <>
                    <span className="upload-icon">🖼️</span>
                    <p><strong>Click to upload</strong> or drag &amp; drop</p>
                    <small className="muted">JPG, PNG, WEBP or GIF · up to 5 MB each · max {MAX_IMAGES}</small>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => uploadFiles(e.target.files)}
                />
              </div>

              {images.length > 0 && (
                <div className="img-thumbs">
                  {images.map((url, i) => (
                    <div
                      key={url}
                      className={`img-thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                      title={`Image ${i + 1}`}
                    >
                      <img src={url} alt={`Product ${i + 1}`} loading="lazy" />
                      <span className="thumb-num">{i === 0 ? 'Main' : i + 1}</span>
                      <button
                        type="button"
                        className="thumb-remove"
                        aria-label="Remove image"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {images.length === 0 && (
                <small className="muted">No image yet - the default placeholder will be used.</small>
              )}
            </div>

            <ChoiceEditor
              icon="🎯"
              title="Variants"
              hint="Customer ek option choose karega. Pehla variant base hota hai. Extra price base par add hoti hai."
              list={variants}
              onChange={setVariants}
              maxItems={12}
            />

            <ChoiceEditor
              icon="🧩"
              title="Add-ons"
              hint="Extras jo customer khud select kar sakta hai (checkbox). Har addon ki price base par judti hai."
              list={addons}
              onChange={setAddons}
              maxItems={15}
            />

            <div className="form-group checkbox-row">
              <input
                id="pavail"
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              />
              <label htmlFor="pavail">Available for ordering</label>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || uploading}>
              {saving ? 'Saving...' : uploading ? 'Uploading images...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </form>
        </section>

        <aside className="card preview-card">
          <h3>Live Preview</h3>
          <SafeImage src={images[activeImg]} alt="Product preview" className="preview-img" />
          {images.length > 1 && (
            <div className="img-dots static">
              {images.map((_, i) => (
                <span key={i} className={`img-dot ${i === activeImg ? 'on' : ''}`} onClick={() => setActiveImg(i)} role="presentation" />
              ))}
            </div>
          )}
          <strong>{form.name || 'Product name'}</strong>
          <p className="muted small">{form.description || 'Description preview'}</p>
          <span className="product-price">{Number(form.price) > 0 ? `₹${Number(form.price).toLocaleString('en-IN')}` : '₹--'}</span>
        </aside>
      </div>
    </div>
  );
}
