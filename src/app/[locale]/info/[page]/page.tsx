import { notFound } from 'next/navigation';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale, locales } from '@/lib/i18n';

const pages = ['about', 'shipping', 'payment', 'returns', 'contact', 'privacy', 'terms'] as const;
type PageKey = (typeof pages)[number];

export function generateStaticParams() {
  return locales.flatMap((locale) => pages.map((page) => ({ locale, page })));
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale: raw, page } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  if (!(pages as readonly string[]).includes(page)) notFound();

  const content = getDict(locale).info[page as PageKey];

  return (
    <div className="section container" style={{ maxWidth: 760 }}>
      <h1>{content.title}</h1>
      <p>{content.body}</p>
    </div>
  );
}
