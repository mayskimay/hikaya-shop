'use client';

import { useState } from 'react';

// Zeigt das Hauptfoto und darunter kleine Vorschaubilder zum Umschalten.
// Ohne Fotos erscheint ein Platzhalter mit dem Produktnamen.
export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="main-img">{name}</div>;
  }

  return (
    <div>
      <div className="main-img">
        <img src={`${images[active]}?w=1200&auto=format`} alt={name} />
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === active ? 'thumb active' : 'thumb'}
              onClick={() => setActive(i)}
              aria-label={`${name} ${i + 1}`}
            >
              <img src={`${src}?w=160&auto=format`} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
