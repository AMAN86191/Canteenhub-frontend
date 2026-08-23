import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Menu() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  // The canteen this viewer is allowed to browse.
  // Students are permanently linked to their college canteen at signup.
  const canteenId = user ? user.canteen?._id || user.canteenId : null;
  const canteenName = user?.canteen?.name;

  // Fetch categories once
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (user.role === 'user' && canteenId) params.set('canteenId', canteenId);
        const res = await api.get(`/categories?${params.toString()}`);
        setCategories(res.data.data.categories);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load categories.'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever search/category changes
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (user.role === 'user' && canteenId) params.set('canteenId', canteenId);

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

  // Guests must log in before they can browse any canteen's food.
  if (!user) {
    return (
      <div className="container page">
        <div className="page-head">
          <h1>Food Menu 🍽️</h1>
        </div>
        <EmptyState
          icon="🔐"
          title="Log in to browse the menu"
          message="Each student sees the menu of their own college canteen. Log in or create a free account to continue."
          actionLabel="Log In"
          actionTo="/login"
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Food Menu 🍽️</h1>
        <p>Freshly made, fairly priced. Pick your favourites!</p>
      </div>

      {canteenName && (
        <div className="canteen-chip-row" aria-label="Your canteen">
          🏫 Ordering from <strong>{canteenName}</strong> — your college canteen
        </div>
      )}

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
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
