# Hikaya Shop

Online-Shop für Hikaya (Kleidung), gebaut mit Next.js 16, React 19 und TypeScript. Zweisprachig (Deutsch/Englisch), mobil zuerst. Produkte und Kategorien werden über das CMS Sanity verwaltet.

## Lokal starten (optional)

Voraussetzung: Node.js 22.12 oder neuer.

```bash
npm install
npm run dev
```

Dann `http://localhost:3000` öffnen. Ohne CMS-Einrichtung zeigt der Shop die Beispielprodukte aus `src/lib/products.ts`.

## CMS einrichten (Sanity)

Das CMS läuft direkt im Shop unter `/studio` (z. B. `https://deine-seite.vercel.app/studio`). Die Einrichtung geschieht einmalig im Browser:

1. **Projekt anlegen:** Auf [sanity.io/manage](https://www.sanity.io/manage) anmelden (Google oder GitHub genügt) und ein neues Projekt "Hikaya" mit dem Dataset `production` erstellen. Die **Project ID** steht danach in der Projektübersicht.
2. **Adresse erlauben:** Im Projekt unter *API → CORS origins* die Adresse des Shops hinzufügen (z. B. `https://hikaya-shop.vercel.app`, später auch die eigene Domain) und **"Allow credentials"** anhaken. Für lokales Testen zusätzlich `http://localhost:3000`.
3. **Werte bei Vercel eintragen:** Im Vercel-Projekt unter *Settings → Environment Variables*:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` = die Project ID
   - `NEXT_PUBLIC_SANITY_DATASET` = `production`

   Danach unter *Deployments* den letzten Stand neu ausliefern ("Redeploy").
4. **Node-Version prüfen:** Bei Vercel unter *Settings → General → Node.js Version* mindestens 22.x wählen.
5. **Studio öffnen:** `/studio` an die Shop-Adresse hängen und mit demselben Konto anmelden.

### Erste Schritte im Studio

**Zuerst die Kategorien anlegen** (Menü *Kategorie*). Hauptkategorien lässt du bei "Übergeordnete Kategorie" leer, bei Unterkategorien wählst du die Hauptkategorie aus.

| Hauptkategorie (DE / EN) | Unterkategorien (DE / EN) |
| --- | --- |
| Outerwear / Outerwear | Kimono / Kimono |
| Unterteile / Bottoms | Röcke / Skirts · Denim-Röcke / Denim skirts · Ballonröcke / Balloon skirts |
| Kostüme / Sets / Suits / Sets | Dreiteilige Kostüme / Three-piece suits · Kimono-Set / Kimono set · Trainingsanzüge / Sport-Sets / Tracksuits / Sport sets · Ramadan-Set / Ramadan set |
| Kleider / Dresses | Mini-Kleider / Mini dresses |

**Dann Produkte anlegen** (Menü *Produkt*): Name, Fotos, Kategorie, Preis, Sale-Preis (leer = kein Sale), Bestseller, Neuheit, Beschreibung, Material, Farben, Größen und Bestand. Änderungen erscheinen im Shop nach etwa einer Minute.

Wichtig: Sobald das CMS verbunden ist, werden die Beispielprodukte nicht mehr angezeigt. Der Shop zeigt nur noch, was im Studio angelegt wurde.

## Aufbau

- `src/app/[locale]/` – Seiten (Startseite, Shop, Produkt, Warenkorb, Infoseiten)
- `src/app/studio/` – das CMS (Sanity Studio)
- `src/sanity/` – Datenmodell des CMS (Produkt, Kategorie)
- `src/lib/data.ts` – lädt Produkte und Kategorien aus dem CMS
- `src/lib/dict.ts` – alle festen Texte in Deutsch und Englisch
- `src/lib/site.ts` – E-Mail und Social-Media-Links
- `src/components/` – Header, Footer, Produktkarte, Galerie, Warenkorb
- `src/lib/cart.tsx` – Warenkorb (wird im Browser gespeichert)
- `src/lib/shop.ts` – Versandzonen, Firmenangaben, Steuerhinweis
- `src/app/api/checkout/` – legt die Stripe-Zahlung an
- `src/app/api/stripe/webhook/` – empfängt Zahlungsbestätigungen von Stripe
- `src/lib/stripe.ts`, `orders.ts`, `fulfillment.ts`, `email.ts` – Zahlung, Bestellungen, E-Mails (nur Server)
- `src/sanity/schemaTypes/order.ts` – Bestellungen im CMS
- `src/app/globals.css` – Farben und Gestaltung

## Noch offen

1. ⚠️ Rechtliche Texte (Impressum, AGB, Datenschutz, Widerrufsbelehrung + Muster-Formular) – aktuell Platzhalter, **müssen rechtlich geprüft/erstellt werden**
2. ⚠️ Shop-Angaben in `src/lib/shop.ts` (Firmenname, Adresse, Gewerbe, UID, Steuerhinweis) und Versandkosten festlegen
3. Kontaktformular
4. Echte Texte für Über uns, Versand, Zahlung
5. Hero-Foto, Domain

## Bestellablauf – so funktioniert er

1. **Warenkorb** (`/de/cart`): Mengen ändern, Lieferland wählen → Versandkosten und Gesamtsumme werden angezeigt. Die Kundin bestätigt AGB, Widerrufsbelehrung und Datenschutz.
2. **„Weiter zur Zahlung“** → der Server (`/api/checkout`) prüft Preise, Bestand und Versandkosten neu und legt eine Stripe-Checkout-Sitzung an.
3. **Stripe-Zahlungsseite**: Die Kundin gibt E-Mail, Name, Telefon und Lieferadresse ein und wählt eine Zahlungsart. **Karten- und Bankdaten landen nur bei Stripe**, nie im Shop.
4. **Webhook** (`/api/stripe/webhook`): Stripe meldet die Zahlung. Der Shop prüft die Signatur, speichert die Bestellung in Sanity (Menü *Bestellung*), bucht den Bestand ab und verschickt die E-Mails (Kundin + Inhaberin). Bei SEPA-Lastschrift steht die Bestellung zuerst auf „Zahlung ausstehend“ und wird automatisch auf „Bezahlt“ gesetzt, sobald das Geld da ist.
5. **Danke-Seite** (`/de/checkout/success`): zeigt Bestellnummer, Artikel, Summe und Lieferadresse.

Sicherheit: Alle Schlüssel stehen nur in Umgebungsvariablen (Vorlage: `.env.example`). Ein Live-Schlüssel (`sk_live_…`) wird **nur** angenommen, wenn zusätzlich `STRIPE_ALLOW_LIVE=true` gesetzt ist.

## Zahlung einrichten (Stripe) – Schritt für Schritt

### A. Testmodus (zuerst)

1. **Stripe-Konto anlegen** auf [stripe.com](https://stripe.com) – am besten direkt durch die Inhaberin (Firmen-, Ausweis- und Bankdaten gehören ihr).
2. Im Dashboard oben rechts den **Testmodus** (bzw. eine *Sandbox*) einschalten.
3. **Geheimen Schlüssel kopieren:** *Entwickler → API-Schlüssel* → „Geheimer Schlüssel“ (`sk_test_…`). Den Schlüssel nie per Chat/E-Mail weitergeben und nie in den Code schreiben.
4. **Bei Vercel eintragen:** Projekt → *Settings → Environment Variables*:
   - `STRIPE_SECRET_KEY` = `sk_test_…`
   - `NEXT_PUBLIC_SITE_URL` = Adresse des Shops (z. B. `https://hikaya-shop.vercel.app`)
5. **Webhook anlegen:** *Entwickler → Webhooks → Endpunkt hinzufügen*
   - URL: `https://DEINE-SHOP-ADRESSE/api/stripe/webhook`
   - Ereignisse: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   - Danach das **Signing secret** (`whsec_…`) kopieren und bei Vercel als `STRIPE_WEBHOOK_SECRET` eintragen.
6. **Bestellungen speichern:** Auf [sanity.io/manage](https://www.sanity.io/manage) → Projekt → *API → Tokens → Add API token*, Rechte **Editor**. Bei Vercel als `SANITY_API_WRITE_TOKEN` eintragen.
7. **Bestell-E-Mails (optional, empfohlen):** Konto bei [resend.com](https://resend.com) anlegen, die eigene Domain bestätigen und einen API-Schlüssel erstellen. Bei Vercel eintragen: `RESEND_API_KEY`, `ORDER_EMAIL_FROM` (z. B. `Hikaya <bestellung@hikaya.at>`), `ORDER_NOTIFY_EMAIL` (Postfach der Inhaberin). Ohne diese Werte funktioniert der Shop, es werden nur keine E-Mails verschickt.
8. **Zahlungsarten wählen:** *Einstellungen → Zahlungen → Zahlungsmethoden*. Für Österreich sinnvoll: Karten, Apple Pay/Google Pay, **EPS**, **PayPal**, **SEPA-Lastschrift**, ggf. Klarna. Manche Methoden muss Stripe erst für das Konto freischalten – angezeigt wird nur, was für Konto, Land und Betrag verfügbar ist.
9. **Neu ausliefern:** Vercel → *Deployments* → „Redeploy“.
10. **Testen:** Bestellung mit Testkarte `4242 4242 4242 4242` (beliebiges Datum in der Zukunft, beliebige Prüfziffer). Danach prüfen: Danke-Seite, Bestellung im Studio unter *Bestellung* (mit „[TEST]“), Bestand reduziert, E-Mails angekommen. Unter *Entwickler → Webhooks* sieht man, ob Stripe den Shop erreicht hat.

### B. Bestellungen prüfen (Datenschutz)

Bestellungen werden mit einer ID wie `orders.HK-20261115-ABC123` gespeichert. Dokumente mit Punkt in der ID sind bei Sanity nicht öffentlich abrufbar. **Einmal prüfen:** im Browser
`https://PROJECT_ID.apicdn.sanity.io/v2025-01-01/data/query/production?query=*[_type=="order"]` öffnen – das Ergebnis muss **leer** sein (`"result":[]`), obwohl im Studio Bestellungen zu sehen sind.

### C. Auf echte Zahlungen umstellen (erst wenn alles geprüft ist)

Voraussetzungen: Stripe-Konto vollständig verifiziert (Firma, Ausweis, Bankkonto), Rechtstexte und Shop-Angaben fertig und geprüft, Testbestellungen erfolgreich.

1. Im Stripe-Dashboard den Testmodus ausschalten und unter *Entwickler → API-Schlüssel* den **Live-Schlüssel** (`sk_live_…`) kopieren.
2. Im Live-Modus den **Webhook erneut anlegen** (gleiche URL und Ereignisse) – er hat ein eigenes `whsec_…`.
3. Bei Vercel ändern: `STRIPE_SECRET_KEY` = `sk_live_…`, `STRIPE_WEBHOOK_SECRET` = neues Secret, `STRIPE_ALLOW_LIVE` = `true`. Redeploy.
4. Eine **echte Bestellung mit kleinem Betrag** machen, prüfen und im Stripe-Dashboard erstatten.

Zurück in den Testmodus: Test-Schlüssel und Test-Webhook-Secret wieder eintragen (oder `STRIPE_ALLOW_LIVE` entfernen – dann ist die Kasse gesperrt, bis ein Test-Schlüssel eingetragen ist).

### Wo was eingestellt wird

| Was | Wo |
| --- | --- |
| Versandzonen, -kosten, Lieferzeiten | `src/lib/shop.ts` → `shippingZones` |
| Firmenangaben (Impressum, E-Mails), Steuerhinweis | `src/lib/shop.ts` → `company`, `vatNote` |
| Zahlungsarten | Stripe-Dashboard → Zahlungsmethoden |
| Bestellstatus, Sendungsnummer | Studio → *Bestellung* |
| Texte (DE/EN) | `src/lib/dict.ts` |
