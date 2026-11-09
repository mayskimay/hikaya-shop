import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import type { Dict } from '@/lib/dict';

const pages = ['about', 'shipping', 'payment', 'returns', 'contact', 'privacy', 'terms'] as const;

export default function Footer({ locale, t }: { locale: Locale; t: Dict['footer'] }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          {pages.map((p) => (
            <Link key={p} href={`/${locale}/info/${p}`}>
              {t[p]}
            </Link>
          ))}
        </div>
        <small>© {new Date().getFullYear()} Hikaya. {t.rights}</small>
      </div>
    </footer>
  );
}
