import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

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
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return sanitize(parsed);
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const { user } = useAuth();

  // A cart belongs to exactly one identity. When the logged-in user changes
  // (login / logout / role switch in the same browser), wipe the cart so one
  // person's items can never leak into another account's checkout.
  const userId = user ? String(user._id || user.id || '') : '';
  const prevUserIdRef = useRef(userId);
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      setItems([]);
    }
  }, [userId]);

  // Students can only order from their own college canteen. If the logged-in
  // user's canteen changes (login/logout/switch), drop items that don't belong.
  const myCanteenId = user ? String(user.canteen?._id || user.canteenId || '') : '';
  useEffect(() => {
    setItems((prev) => {
      if (!prev.length) return prev;
      const kept = prev.filter((i) => !i.canteenId || !myCanteenId || i.canteenId === myCanteenId);
      return kept.length === prev.length ? prev : kept;
    });
  }, [myCanteenId]);

  // Persist cart across refreshes (per browser tab, so tabs never share carts)
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
          canteenId: product.canteenId ? String(product.canteenId) : undefined,
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
