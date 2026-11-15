import { notFound } from 'next/navigation';
import { isLocale, defaultLocale, locales, formatPrice } from '@/lib/i18n';
import { countryName } from '@/lib/shop';
import { activePaymentMethods, dhlLive } from '@/lib/providers';
import { getShopConfig, getTexts } from '@/lib/settings';

// Zahlungsarten und Einstellungen werden regelmäßig neu geladen
export const revalidate = 300;

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

  const cfg = await getShopConfig();
  const content = (await getTexts(locale, cfg)).info[page as PageKey];
  const de = locale === 'de';
  const company = cfg.company;
  const carrierLive = dhlLive(cfg) && cfg.zones.some((z) => z.carrier === 'dhl-express');
  const payments = page === 'payment' ? await activePaymentMethods() : null;

  return (
    <div className="section container" style={{ maxWidth: 760 }}>
      <h1>{content.title}</h1>
      <p style={{ whiteSpace: 'pre-line' }}>{content.body}</p>

      {page === 'shipping' && (
        <table className="info-table">
          <thead>
            <tr>
              <th>{de ? 'Zone' : 'Zone'}</th>
              {carrierLive && <th>{de ? 'Versand mit' : 'Carrier'}</th>}
              <th>{de ? 'Kosten' : 'Cost'}</th>
              <th>{de ? 'Lieferzeit' : 'Delivery time'}</th>
            </tr>
          </thead>
          <tbody>
            {cfg.zones.map((z) => (
              <tr key={z.id}>
                <td>
                  <strong>{z.label[locale]}</strong>
                  <br />
                  <small>{z.countries.map((c) => countryName(c, locale)).join(', ')}</small>
                </td>
                {carrierLive && <td>{z.carrier === 'dhl-express' ? 'DHL Express' : de ? 'Standardversand' : 'Standard shipping'}</td>}
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

      {page === 'shipping' && <p>{cfg.packagingNote[locale]}</p>}

      {payments && (
        payments.methods.length > 0 ? (
          <>
            {payments.state === 'test' && (
              <p className="notice">{de ? 'Testmodus: Es werden keine echten Zahlungen ausgeführt.' : 'Test mode: no real payments are made.'}</p>
            )}
            <ul className="info-methods">
              {payments.methods.map((m) => (
                <li key={m.id}>{m.name[locale]}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="notice">
            {de
              ? 'Die verfügbaren Zahlungsarten werden hier angezeigt, sobald die Zahlung eingerichtet ist.'
              : 'Available payment methods will be shown here once payment has been set up.'}
          </p>
        )
      )}

      {page === 'contact' && cfg.contact.email && (
        <p>
          E-Mail: <a href={`mailto:${cfg.contact.email}`}>{cfg.contact.email}</a>
        </p>
      )}

      {page === 'imprint' && (
        <dl className="info-list">
          <dt>{de ? 'Unternehmen' : 'Company'}</dt>
          <dd>{company.name || (de ? '[Platzhalter – in der Verwaltung unter Shop-Infos eintragen]' : '[Placeholder]')}</dd>
          <dt>{de ? 'Anschrift' : 'Address'}</dt>
          <dd>{company.address || (de ? '[Platzhalter – in der Verwaltung unter Shop-Infos eintragen]' : '[Placeholder]')}</dd>
          <dt>E-Mail</dt>
          <dd>{company.email || (de ? '[Platzhalter – in der Verwaltung unter Shop-Infos eintragen]' : '[Placeholder]')}</dd>
          {company.phone && (
            <>
              <dt>{de ? 'Telefon' : 'Phone'}</dt>
              <dd>{company.phone}</dd>
            </>
          )}
          <dt>{de ? 'Gewerbe' : 'Trade'}</dt>
          <dd>{company.trade || (de ? '[Platzhalter – in der Verwaltung unter Shop-Infos eintragen]' : '[Placeholder]')}</dd>
          <dt>{de ? 'Gewerbebehörde' : 'Trade authority'}</dt>
          <dd>{company.authority || (de ? '[Platzhalter – in der Verwaltung unter Shop-Infos eintragen]' : '[Placeholder]')}</dd>
          {company.uid && (
            <>
              <dt>{de ? 'UID-Nummer' : 'VAT ID'}</dt>
              <dd>{company.uid}</dd>
            </>
          )}
          {company.register && (
            <>
              <dt>{de ? 'Firmenbuch' : 'Company register'}</dt>
              <dd>{company.register}</dd>
            </>
          )}
          <dt>{de ? 'Online-Streitbeilegung' : 'Online dispute resolution'}</dt>
          <dd>{de ? '[Platzhalter – aktuelle Rechtslage zur OS-Plattform prüfen lassen]' : '[Placeholder – check current rules on the ODR platform]'}</dd>
        </dl>
      )}
    </div>
  );
}
