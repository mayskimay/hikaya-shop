'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartItem {
  slug: string;
  size: string;
  color: string; // Farb-Hex als Kennung
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, 'qty'>) => void;
  remove: (slug: string, size: string, color: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'hikaya-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const add: CartContextValue['add'] = (item) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.slug === item.slug && i.size === item.size && i.color === item.color
      );
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const remove: CartContextValue['remove'] = (slug, size, color) => {
    setItems((prev) =>
      prev.filter((i) => !(i.slug === slug && i.size === size && i.color === color))
    );
  };

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, add, remove }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart muss innerhalb von CartProvider verwendet werden');
  return ctx;
}
