import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'ch_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.product && i.quantity > 0) : [];
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

  function addItem(product, quantity = 1) {
    if (!product || !product._id) return;
    if (product.isAvailable === false) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.product === product._id);
      if (existing) {
        return prev.map((i) =>
          i.product === product._id
            ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
            : i
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: Math.max(1, Math.min(99, quantity)),
        },
      ];
    });
  }

  /** Re-sync cart with fresh product data (price/availability changes). */
  function replaceCart(newItems) {
    setItems(Array.isArray(newItems) ? newItems.filter((i) => i.product && i.quantity > 0) : []);
  }

  function increaseQuantity(productId) {
    setItems((prev) =>
      prev.map((i) => (i.product === productId ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i))
    );
  }

  function decreaseQuantity(productId) {
    setItems((prev) =>
      prev.map((i) => (i.product === productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.product !== productId));
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
