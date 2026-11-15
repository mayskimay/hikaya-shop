'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: [string, string][] = [
  ['/admin', 'Übersicht'],
  ['/admin/produkte', 'Produkte'],
  ['/admin/kategorien', 'Kategorien'],
  ['/admin/bestellungen', 'Bestellungen'],
  ['/admin/versand/pakete', 'Pakete versenden'],
];
const SETTINGS: [string, string][] = [
  ['/admin/versand', 'Versand'],
  ['/admin/zahlungen', 'Zahlungen'],
  ['/admin/shop-infos', 'Shop-Infos'],
  ['/admin/texte', 'Texte (DE / EN)'],
];

export default function AdminNav({ user }: { user: string }) {
  const path = usePathname();
  const link = ([href, label]: [string, string]) => (
    <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
      {label}
    </Link>
  );
  return (
    <nav className="admin-nav" aria-label="Verwaltung">
      <div className="brand">
        <img src="/logo.svg" alt="" width={28} height={28} /> HIKAYA
      </div>
      {LINKS.map(link)}
      <small>Einstellungen</small>
      {SETTINGS.map(link)}
      <small>Weiteres</small>
      <a href="/studio" target="_blank" rel="noopener">
        Editor (Fotos, Details) ↗
      </a>
      <a href="/" target="_blank" rel="noopener">
        Shop ansehen ↗
      </a>
      <form method="post" action="/admin/api/logout">
        <button className="link-btn" type="submit">
          Abmelden ({user})
        </button>
      </form>
    </nav>
  );
}
