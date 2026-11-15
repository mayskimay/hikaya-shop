import { requireAdminPage } from '@/lib/adminPage';
import { activePaymentMethods, checkStripeAccount, infrastructureProviders, paypalProvider, stripeProvider, type MethodState } from '@/lib/providers';
import { ProviderCard } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const METHOD_LABEL: Record<MethodState, string> = {
  on: 'eingeschaltet',
  pending: 'wartet auf Freischaltung',
  off: 'ausgeschaltet',
};

export default async function PaymentsPage() {
  await requireAdminPage();
  const [account, pm] = await Promise.all([checkStripeAccount(), activePaymentMethods()]);
  const stripe = stripeProvider(account);
  const paypal = paypalProvider(pm);
  const infra = infrastructureProviders();

  return (
    <>
      <h1>Zahlungen</h1>
      <p className="admin-lead">
        Der Shop nimmt Zahlungen ausschließlich über die sichere Bezahlseite von Stripe an. Karten- und Bankdaten deiner
        Kundinnen gibt es nur bei Stripe – der Shop und dieser Bereich speichern sie nie. Auch deine eigene Bankverbindung
        trägst du nur direkt bei Stripe ein, nicht hier.
      </p>

      <ProviderCard p={stripe} check={stripe.state === 'not_connected' ? undefined : 'stripe'}>
        {account?.reachable && (
          <ul className="admin-checks">
            <li>{account.detailsSubmitted ? '✓' : '○'} Geschäftsangaben bei Stripe eingereicht</li>
            <li>{account.chargesEnabled ? '✓' : '○'} Stripe nimmt Zahlungen an</li>
            <li>
              {account.payoutsEnabled ? '✓' : '○'} Bankkonto für Auszahlungen hinterlegt und bestätigt
              {stripe.state === 'test' && <span className="note"> (im Testmodus ohne Bedeutung)</span>}
            </li>
            <li>{process.env.STRIPE_WEBHOOK_SECRET?.trim() ? '✓' : '○'} Webhook für Zahlungsbestätigungen eingetragen</li>
          </ul>
        )}
      </ProviderCard>

      <h2>Zahlungsarten</h2>
      <p className="note">
        Welche Zahlungsarten Kundinnen sehen, stellst du im Stripe-Dashboard ein. Der Shop übernimmt das automatisch –
        angezeigt wird nur, was dort eingeschaltet und freigeschaltet ist.
        {pm.state === 'not_connected' && ' Sobald Stripe verbunden ist, siehst du hier den Stand aus deinem Konto.'}
        {pm.state !== 'not_connected' && !pm.reachable && ' Der Stand konnte gerade nicht von Stripe gelesen werden.'}
      </p>
      {pm.state !== 'not_connected' && pm.reachable && (
        <div className="admin-scroll">
          <table className="admin-table">
            <tbody>
              {pm.all.map((m) => (
                <tr key={m.id}>
                  <td className="admin-badgecell">
                    <span className={`admin-state ${m.state}`}>
                      {m.state === 'on' && pm.state === 'test' ? 'eingeschaltet (Test)' : METHOD_LABEL[m.state]}
                    </span>
                  </td>
                  <td>{m.name.de}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        <a className="btn btn-outline" href="https://dashboard.stripe.com/settings/payment_methods" target="_blank" rel="noopener noreferrer">
          Zahlungsarten bei Stripe einstellen ↗
        </a>
      </p>

      <ProviderCard p={paypal} />

      <h2>So kommt das Geld auf dein Bankkonto</h2>
      <div className="admin-provider">
        <ol>
          <li>Im Stripe-Dashboard „Konto aktivieren“ wählen und die Geschäftsangaben, den Ausweis und das Gewerbe angeben.</li>
          <li>
            Unter Einstellungen → Auszahlungen dein Geschäftskonto (IBAN) eintragen. Stripe prüft es; hier erscheint danach
            „Bankkonto hinterlegt und bestätigt ✓“.
          </li>
          <li>Stripe überweist die Einnahmen abzüglich Gebühren automatisch nach dem eingestellten Auszahlungsplan.</li>
        </ol>
        <p className="note">
          Warum nicht hier? Bankdaten gehören nur zum Zahlungsanbieter: Stripe prüft Identität und Konto gesetzlich vorgeschrieben
          und schützt die Daten. Der Shop braucht deine IBAN nie.
        </p>
        <div className="admin-links">
          <a href="https://dashboard.stripe.com/account/onboarding" target="_blank" rel="noopener noreferrer">
            Konto aktivieren ↗
          </a>
          <a href="https://dashboard.stripe.com/settings/payouts" target="_blank" rel="noopener noreferrer">
            Bankkonto / Auszahlungen ↗
          </a>
        </div>
      </div>

      <h2>Zugangsdaten sicher hinterlegen</h2>
      <div className="admin-provider">
        <p style={{ marginTop: 0 }}>
          API-Schlüssel werden nicht in diesem Formular eingegeben, sondern nur in der geschützten Serverkonfiguration bei
          Vercel (Project → Settings → Environment Variables). Dort sind sie verschlüsselt, erscheinen nie im Browser und nie
          im Code-Repository. Nach jeder Änderung einmal neu deployen.
        </p>
        <ol>
          <li>Zuerst nur Test-Schlüssel (sk_test_…) verwenden und eine Testbestellung mit einer Stripe-Testkarte machen.</li>
          <li>Erst wenn alles klappt: Live-Schlüssel, neuen Live-Webhook und STRIPE_ALLOW_LIVE=true eintragen.</li>
        </ol>
      </div>

      <h2>Weitere Dienste</h2>
      {infra.map((p) => (
        <ProviderCard key={p.id} p={p} />
      ))}
    </>
  );
}
