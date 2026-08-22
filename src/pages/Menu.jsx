import { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();
  const toast = useToast();

  // Fetch categories once
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data.categories);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load categories.'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever search/category changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (activeCategory !== 'all') params.set('category', activeCategory);

    (async () => {
      try {
        const res = await api.get(`/products?${params.toString()}`);
        if (!cancelled) setProducts(res.data.data.products);
        if (!cancelled) setError('');
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search, activeCategory]);

  const categoryNameById = useMemo(() => {
    const map = {};
    for (const c of categories) map[c._id] = c.name;
    return map;
  }, [categories]);

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Food Menu 🍽️</h1>
        <p>Freshly made, fairly priced. Pick your favourites!</p>
      </div>

      <div className="menu-controls">
        <SearchBar value={search} onChange={setSearch} placeholder="Search food by name..." />
        <div className="category-filter" role="tablist">
          <button
            type="button"
            className={`filter-pill${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              className={`filter-pill${activeCategory === c._id ? ' active' : ''}`}
              onClick={() => setActiveCategory(c._id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader label="Loading menu..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Could not load the menu" message={error} actionLabel="Go to Home" actionTo="/" />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No items found"
          message={
            search || activeCategory !== 'all'
              ? 'Try a different search term or category.'
              : 'The menu is empty right now. Check back soon!'
          }
        />
      ) : (
        <>
          <p className="result-count">
            Showing <strong>{products.length}</strong> item{products.length !== 1 ? 's' : ''}
            {search && <> for “{search}”</>}
            {activeCategory !== 'all' && <> in {categoryNameById[activeCategory]}</>}
          </p>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAdd={() => {
                  addItem(product);
                  toast.success(`${product.name} added to cart!`);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
