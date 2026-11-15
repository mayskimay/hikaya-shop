import { notFound } from 'next/navigation';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale, locales, formatPrice } from '@/lib/i18n';
import { shop, countryName } from '@/lib/shop';

const pages = ['about', 'shipping', 'payment', 'returns', 'contact', 'privacy', 'terms', 'imprint'] as const;
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
  const de = locale === 'de';

  return (
    <div className="section container" style={{ maxWidth: 760 }}>
      <h1>{content.title}</h1>
      <p>{content.body}</p>

      {page === 'shipping' && (
        <table className="info-table">
          <thead>
            <tr>
              <th>{de ? 'Zone' : 'Zone'}</th>
              <th>{de ? 'Versand mit' : 'Carrier'}</th>
              <th>{de ? 'Kosten' : 'Cost'}</th>
              <th>{de ? 'Lieferzeit' : 'Delivery time'}</th>
            </tr>
          </thead>
          <tbody>
            {shop.shippingZones.map((z) => (
              <tr key={z.id}>
                <td>
                  <strong>{z.label[locale]}</strong>
                  <br />
                  <small>{z.countries.map((c) => countryName(c, locale)).join(', ')}</small>
                </td>
                <td>{z.carrier}</td>
                <td>
                  {formatPrice(z.amount, locale)}
                  {z.freeFrom !== undefined && (
                    <>
                      <br />
                      <small>
                        {de ? 'gratis ab' : 'free from'} {formatPrice(z.freeFrom, locale)}
                      </small>
                    </>
                  )}
                </td>
                <td>{z.delivery[locale]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {page === 'shipping' && <p>{shop.packagingNote[locale]}</p>}

      {page === 'imprint' && (
        <dl className="info-list">
          <dt>{de ? 'Unternehmen' : 'Company'}</dt>
          <dd>{shop.company.name}</dd>
          <dt>{de ? 'Anschrift' : 'Address'}</dt>
          <dd>{shop.company.address}</dd>
          <dt>E-Mail</dt>
          <dd>{shop.company.email}</dd>
          {shop.company.phone && (
            <>
              <dt>{de ? 'Telefon' : 'Phone'}</dt>
              <dd>{shop.company.phone}</dd>
            </>
          )}
          <dt>{de ? 'Gewerbe' : 'Trade'}</dt>
          <dd>{shop.company.trade}</dd>
          <dt>{de ? 'Gewerbebehörde' : 'Trade authority'}</dt>
          <dd>{shop.company.authority}</dd>
          {shop.company.uid && (
            <>
              <dt>{de ? 'UID-Nummer' : 'VAT ID'}</dt>
              <dd>{shop.company.uid}</dd>
            </>
          )}
          {shop.company.register && (
            <>
              <dt>{de ? 'Firmenbuch' : 'Company register'}</dt>
              <dd>{shop.company.register}</dd>
            </>
          )}
          <dt>{de ? 'Online-Streitbeilegung' : 'Online dispute resolution'}</dt>
          <dd>{de ? '[Platzhalter – aktuelle Rechtslage zur OS-Plattform prüfen lassen]' : '[Placeholder – check current rules on the ODR platform]'}</dd>
        </dl>
      )}
    </div>
  );
}
