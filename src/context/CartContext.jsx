import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'ch_cart';

/** Unique identity of a cart line = product + chosen variant + chosen add-ons. */
export function lineKey(productId, variantName = '', addonNames = []) {
  const sorted = [...addonNames].map((n) => String(n).trim()).sort().join('+');
  return `${productId}|${variantName || ''}|${sorted}`;
}

function buildKey(item) {
  return lineKey(
    item.product,
    item.variantName || '',
    (item.addons || []).map((a) => a.name)
  );
}

/** Unit price = base + variant delta + add-on deltas. */
export function unitPriceOf(basePrice, variantDelta = 0, addons = []) {
  const sum = (addons || []).reduce((acc, a) => acc + Number(a.priceDelta || 0), 0);
  return Math.round((Number(basePrice) + Number(variantDelta) + sum) * 100) / 100;
}

function sanitize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((i) => i && i.product && i.quantity > 0)
    .map((i) => ({
      ...i,
      addons: Array.isArray(i.addons) ? i.addons : [],
      variantName: i.variantName || '',
      key: i.key || buildKey(i),
    }));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return sanitize(parsed);
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  // Persist cart across refreshes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /**
   * Adds a configured item. options = { variantName, addons } where
   * addons is [{ name, priceDelta }] (already resolved by the caller).
   */
  function addItem(product, quantity = 1, options = {}) {
    if (!product || !product._id) return;
    if (product.isAvailable === false) return;

    const variantName = options.variantName || '';
    const addons = (options.addons || []).map((a) => ({ name: a.name, priceDelta: Number(a.priceDelta || 0) }));
    const variantDelta =
      (product.variants || []).find((v) => v.name === variantName)?.priceDelta || 0;
    const price = unitPriceOf(product.price, variantDelta, addons);
    const key = lineKey(product._id, variantName, addons.map((a) => a.name));
    const qty = Math.max(1, Math.min(99, quantity));

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: Math.min(99, i.quantity + qty), price } : i
        );
      }
      return [
        ...prev,
        {
          key,
          product: product._id,
          name: product.name,
          basePrice: product.price,
          price,
          image: product.images?.[0] || product.image || '',
          quantity: qty,
          variantName,
          addons,
        },
      ];
    });
  }

  /** Re-sync cart with fresh product data (price/availability changes). */
  function replaceCart(newItems) {
    setItems(sanitize(newItems));
  }

  function increaseQuantity(key) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i))
    );
  }

  function decreaseQuantity(key) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
    );
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  const { subtotal, totalItems } = useMemo(() => {
    let sub = 0;
    let count = 0;
    for (const item of items) {
      sub += Number(item.price) * item.quantity;
      count += item.quantity;
    }
    return { subtotal: Math.round(sub * 100) / 100, totalItems: count };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      subtotal,
      totalItems,
      addItem,
      replaceCart,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearCart,
    }),
    [items, subtotal, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
