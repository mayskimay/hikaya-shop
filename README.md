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
- `src/lib/shipping/dhl.ts` – DHL Express (Etiketten) und DHL-Sendungsverfolgung (nur Server)
- `src/app/admin/` – Verwaltungsbereich (Anmeldung: `src/lib/adminAuth.ts`, `src/middleware.ts`); Einstellungen: `src/lib/settings.ts`
- `src/app/api/cron/tracking/` + `vercel.json` – tägliche Statusabfrage bei DHL
- `src/app/globals.css` – Farben und Gestaltung

## Noch offen

1. ⚠️ Rechtliche Texte (Impressum, AGB, Datenschutz, Widerrufsbelehrung + Muster-Formular) – aktuell Platzhalter, **müssen rechtlich geprüft/erstellt werden**
2. ⚠️ Shop-Angaben in `src/lib/shop.ts` (Firmenname, Adresse, Gewerbe, UID, Steuerhinweis) und Versandkosten festlegen
3. Kontaktformular
4. Echte Texte für Über uns, Versand, Zahlung
5. Hero-Foto, Domain

## Verwaltungsbereich /admin

Unter `/admin` verwaltet die Inhaberin den Shop ohne Code:

| Bereich | Was geht dort |
| --- | --- |
| Übersicht | offene Bestellungen, Bestand, fehlende Angaben, Status aller Anbieter |
| Produkte | Preis, Sale-Preis, Bestand direkt ändern; „Bearbeiten“ öffnet Fotos, Größen, Farben, Texte (DE/EN) im Editor |
| Kategorien | Haupt- und Unterkategorien (DE/EN), Reihenfolge, Anzahl Produkte |
| Bestellungen | alle Bestellungen mit Filter und Suche, stornieren (Bestand kommt zurück), „zugestellt“, Link zur Erstattung bei Stripe |
| Pakete versenden | Etiketten (DHL, falls verbunden) oder Sendungsnummer von Hand → Versand-E-Mail |
| Versand | Versandzonen, Länder, Kosten, Gratis-ab, Lieferzeiten (DE/EN), Lieferdienst je Zone, Paketmaße; Status der Lieferdienste |
| Zahlungen | Stripe- und PayPal-Status, aktive Zahlungsarten aus dem Stripe-Konto, Bankkonto-Status, Einrichtungsschritte |
| Shop-Infos | Impressumsangaben, Kontakt & Social Media, Steuer- und Versandhinweis |
| Texte (DE/EN) | Startseite und Info-Seiten; leer = Standardtext |

Gespeichert wird in Sanity (Dokumente `shopSettings`, `shippingSettings`, `siteTexts` – nur öffentliche Angaben). Solange dort nichts gespeichert ist, gelten die Startwerte aus `src/lib/shop.ts`. Änderungen erscheinen im Shop nach spätestens einer Minute.

### Anmeldung einrichten

1. Bei Vercel unter *Settings → Environment Variables* eintragen: `ADMIN_USER`, `ADMIN_PASSWORD` (Regeln siehe `.env.example`) und `ADMIN_SESSION_SECRET` (zufällig, mind. 32 Zeichen).
2. Neu deployen, dann `https://DEINE-DOMAIN/admin` öffnen und anmelden.

Sicherheit: Ohne diese drei Werte oder mit schwachem Passwort bleibt `/admin` gesperrt. Nach der Anmeldung gilt ein signiertes Cookie (HttpOnly, Secure, SameSite=Strict) 8 Stunden. Jede Admin-Seite und jede Admin-Schnittstelle prüft die Anmeldung serverseitig; speichernde Anfragen werden nur von der eigenen Seite angenommen. Nach 5 Fehlversuchen wird die Anmeldung 15 Minuten gesperrt. Auch der Editor `/studio` ist nur nach der Anmeldung erreichbar (und hat zusätzlich das Sanity-Login). Alle Sitzungen beenden: `ADMIN_SESSION_SECRET` ändern und neu deployen.

### Status der Anbieter

- **aktiv** – mit dem echten Konto verbunden und geprüft (Stripe: Live-Schlüssel freigegeben, Konto nimmt Zahlungen an, Bankkonto bestätigt, Webhook eingetragen; DHL: Live und Absender vollständig)
- **im Testmodus** – Testzugang verbunden, keine echten Zahlungen/Sendungen
- **noch nicht verbunden** – keine Zugangsdaten
- **wartet auf deine Einrichtung** – teilweise eingerichtet, ein Schritt der Inhaberin fehlt

„Verbindung prüfen“ testet Zugangsdaten beim Anbieter, ohne Zahlungen oder Sendungen auszulösen. Zugangsdaten und Bankdaten werden im Adminbereich nie eingegeben oder gespeichert: Schlüssel nur bei Vercel, Bankkonto nur bei Stripe.

Grundsätze für Kundinnen: Zahlungsarten zeigt nur Stripe (was im Konto eingeschaltet und freigeschaltet ist); „DHL Express“ erscheint erst, wenn DHL live verbunden ist, vorher „Standardversand“; Logos nur mit offiziellen Dateien und Erlaubnis.

## Bestellablauf – so funktioniert er

1. **Warenkorb** (`/de/cart`): Mengen ändern, Lieferland wählen → Versandkosten und Gesamtsumme werden angezeigt. Die Kundin bestätigt AGB, Widerrufsbelehrung und Datenschutz.
2. **„Weiter zur Zahlung“** → der Server (`/api/checkout`) prüft Preise, Bestand und Versandkosten neu und legt eine Stripe-Checkout-Sitzung an.
3. **Stripe-Zahlungsseite**: Die Kundin gibt E-Mail, Name, Telefon und Lieferadresse ein und wählt eine Zahlungsart. **Karten- und Bankdaten landen nur bei Stripe**, nie im Shop.
4. **Webhook** (`/api/stripe/webhook`): Stripe meldet die Zahlung. Der Shop prüft die Signatur, speichert die Bestellung in Sanity (Menü *Bestellung*), bucht den Bestand ab und verschickt die E-Mails (Kundin + Inhaberin). Bei SEPA-Lastschrift steht die Bestellung zuerst auf „Zahlung ausstehend“ und wird automatisch auf „Bezahlt“ gesetzt, sobald das Geld da ist.
5. **Danke-Seite** (`/de/checkout/success`): zeigt Bestellnummer, Artikel, Summe und Lieferadresse.

Sicherheit: Alle Schlüssel stehen nur in Umgebungsvariablen (Vorlage: `.env.example`). Ein Live-Schlüssel (`sk_live_…`) wird **nur** angenommen, wenn zusätzlich `STRIPE_ALLOW_LIVE=true` gesetzt ist.

## Versand mit DHL

### Welche DHL-Anbindung passt?

| DHL-Angebot | Für Hikaya (Versand aus Österreich) |
| --- | --- |
| **DHL Express – MyDHL API** | ✅ **Eingebaut.** Offizielle Schnittstelle, in Österreich verfügbar (national und international), mit Testumgebung. Benötigt ein DHL-Express-Kundenkonto. |
| DHL Paket DE – Parcel DE Shipping API | ❌ Nur für Geschäftskunden von DHL Paket **Deutschland** (deutsches EKP-Konto). |
| DHL eCommerce (eConnect) | ⚠️ Für Händler mit mehr als 3.000 grenzüberschreitenden Paketen pro Jahr – später möglich. |
| Versandplattform (z. B. Sendcloud) | Alternative: DHL Express, DHL eCommerce und Österreichische Post über eine Oberfläche. Würde eine eigene Anbindung brauchen. |

**Ohne DHL-Zugang funktioniert der Ablauf trotzdem:** Etikett im DHL-Portal oder an der Filiale erstellen, Sendungsnummer auf der Versand-Seite eintragen → die Kundin bekommt die Versand-E-Mail mit Sendungsverfolgung.

### So läuft der Versand ab

1. Nach der Zahlung steht die Bestellung in der Verwaltung unter **Pakete versenden** (`/admin/versand/pakete`) bei „Zu versenden“.
2. **„DHL-Etikett erstellen“** → der Shop schickt Adresse, Gewicht und Paketmaße an DHL Express und bekommt Sendungsnummer + Etikett (PDF) zurück. **„Etikett öffnen / drucken“** öffnet das PDF.
   (Für Länder außerhalb der EU, z. B. Schweiz, wird wegen Zoll kein automatisches Etikett erstellt – dort im MyDHL-Portal erstellen.)
3. Paket abgeben, dann **„Paket ist abgegeben → Kundin informieren“** → Status „Versendet“, die Kundin bekommt eine E-Mail mit Sendungsnummer und Link zur DHL-Sendungsverfolgung.
4. Einmal täglich fragt der Shop bei DHL den Status ab. Ist das Paket zugestellt, wechselt die Bestellung auf „Zugestellt“. Den Status siehst du im Studio unter *Bestellung* und auf der Versand-Seite.

### DHL einrichten – Schritt für Schritt

1. **Versand-Seite schützen:** Bei Vercel `ADMIN_USER` und `ADMIN_PASSWORD` (mind. 12 Zeichen) eintragen. Ohne diese Werte ist die Seite gesperrt.
2. **Absenderadresse eintragen** in `src/lib/shop.ts` → `company`: Name, Straße, PLZ, Ort, **Telefon** (DHL verlangt sie) und E-Mail. Außerdem in `parcel` das Gewicht der Verpackung und die Paketmaße. Bei den Produkten im Studio das **Versandgewicht** eintragen.
3. **DHL-Express-Kundenkonto** beantragen (dhl.com → Österreich → Geschäftskunden / DHL Express). Du bekommst eine **Kontonummer**. Preise und Konditionen verhandelst du mit DHL – sie gehören dann als Versandkosten in `src/lib/shop.ts`.
4. **API-Zugang beantragen:** Auf [developer.dhl.com](https://developer.dhl.com) registrieren → *DHL Express – MyDHL API* → „Get Access“ / Zugang anfragen. DHL prüft die Anfrage und schaltet zuerst die **Testumgebung** frei. Benutzername und Passwort erscheinen danach im Portal.
5. **Bei Vercel eintragen:** `DHL_EXPRESS_API_USER`, `DHL_EXPRESS_API_PASSWORD`, `DHL_EXPRESS_ACCOUNT_NUMBER`, `DHL_EXPRESS_MODE=test`. Redeploy.
6. **Testen:** Testbestellung machen, auf der Versand-Seite „DHL-Etikett erstellen“. Im Testmodus ist das Etikett als **„Test-Etikett – nicht gültig“** markiert und darf **nicht** verwendet werden.
7. **Produktcodes prüfen:** In `src/lib/shop.ts` hat jede Versandzone einen DHL-Produktcode (`N` = Domestic Express in Österreich, `U` = Express Worldwide EU). Mit DHL abklären, welche Produkte in deinem Vertrag freigeschaltet sind, und ggf. anpassen.
8. **Sendungsverfolgung:** Auf developer.dhl.com eine App mit *Shipment Tracking – Unified* anlegen (kostenlos, 250 Abfragen/Tag) → Schlüssel als `DHL_TRACKING_API_KEY` eintragen. Dazu `CRON_SECRET` (beliebige lange Zeichenfolge) für die tägliche Abfrage.
9. **Live schalten:** Erst wenn DHL die Produktion freigegeben hat (DHL prüft die Testetiketten) und ein Test erfolgreich war: `DHL_EXPRESS_MODE=live` und `DHL_ALLOW_LIVE=true`. Redeploy. Dann ein echtes Paket an dich selbst schicken.

Hinweis: Der Link zur Sendungsverfolgung führt zur öffentlichen DHL-Seite (`dhl.com/at-de/home/tracking.html?tracking-id=…`). Einmal mit einer echten Sendungsnummer prüfen.

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
   - Ereignisse: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded` (Erstattungen)
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
| Bestellstatus ansehen | Studio → *Bestellung* |
| Etiketten, Sendungsnummer, Versand-E-Mail | Shop → `/admin/versand/pakete` |
| Absender, Paketmaße, Verpackungshinweis, DHL-Produktcodes | `src/lib/shop.ts` |
| Texte (DE/EN) | `src/lib/dict.ts` |
