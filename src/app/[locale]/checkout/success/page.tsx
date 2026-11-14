import Link from 'next/link';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale } from '@/lib/i18n';
import ClearCart from '@/components/ClearCart';

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale).checkout;

  return (
    <div className="section container" style={{ maxWidth: 620, textAlign: 'center' }}>
      <ClearCart />
      <h1>{t.successTitle}</h1>
      <p>{t.successText}</p>
      <Link href={`/${locale}/shop`} className="btn btn-outline">
        {t.back}
      </Link>
    </div>
  );
}
