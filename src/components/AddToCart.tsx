'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import type { Locale } from '@/lib/i18n';
import type { Dict } from '@/lib/dict';
import type { Product } from '@/lib/products';

export default function AddToCart({
  product,
  locale,
  t,
}: {
  product: Product;
  locale: Locale;
  t: Dict['product'];
}) {
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0].hex);
  const [done, setDone] = useState(false);

  const handleAdd = () => {
    add({ slug: product.slug, size, color });
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  return (
    <div>
      <div className="field">
        <label>{t.color}</label>
        <div className="options">
          {product.colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              className={color === c.hex ? 'swatch active' : 'swatch'}
              style={{ background: c.hex }}
              title={c.name[locale]}
              aria-label={c.name[locale]}
              onClick={() => setColor(c.hex)}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <label>{t.size}</label>
        <div className="options">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              className={size === s ? 'opt active' : 'opt'}
              onClick={() => setSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button className="btn" onClick={handleAdd} disabled={product.stock <= 0}>
        {done ? t.added : t.addToCart}
      </button>
    </div>
  );
}
