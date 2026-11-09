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
- `src/app/globals.css` – Farben und Gestaltung

## Noch offen

1. Checkout und Zahlung (Stripe) und Versandoptionen
2. Kontaktformular
3. Echte Texte für Über uns, Versand, Zahlung, Rückgabe
4. Rechtliche Texte (Datenschutz, AGB, Impressum, Widerruf) – aktuell Platzhalter, müssen rechtssicher erstellt werden
5. Hero-Foto, Domain
