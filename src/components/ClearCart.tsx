'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart';

// Leert den Warenkorb, sobald die Danke-Seite angezeigt wird.
export default function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
