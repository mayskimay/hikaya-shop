# Hikaya Shop

Online-Shop für Hikaya (Kleidung), gebaut mit Next.js 15, React 19 und TypeScript. Zweisprachig (Deutsch/Englisch), mobil zuerst.

## Starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:3000` öffnen. Du wirst automatisch zu `/de` oder `/en` weitergeleitet.

## Aufbau

- `src/app/[locale]/` – Seiten (Startseite, Shop, Produkt, Warenkorb, Infoseiten)
- `src/components/` – Header, Footer, Produktkarte, Warenkorb-Ansicht
- `src/lib/dict.ts` – alle Texte in Deutsch und Englisch
- `src/lib/products.ts` – Produkte und Kategorien (später aus dem CMS)
- `src/lib/cart.tsx` – Warenkorb (wird im Browser gespeichert)
- `src/middleware.ts` – leitet auf die passende Sprache um

## Neues Produkt hinzufügen (bis das CMS da ist)

In `src/lib/products.ts` einen weiteren Eintrag in die Liste `products` einfügen, am besten einen bestehenden kopieren und ändern.

## Noch offen

1. Echte Produktfotos (aktuell Platzhalter) und Logo
2. CMS (Sanity) für Produkte, Kategorien, Bestände
3. Checkout und Zahlung (Stripe) und Versandoptionen
4. Kontaktformular
5. Rechtliche Texte (Datenschutz, AGB, Impressum, Widerruf) – Platzhalter, müssen rechtssicher erstellt werden
6. Domain und Hosting (z. B. Vercel)
