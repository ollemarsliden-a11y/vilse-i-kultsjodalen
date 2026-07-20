# Vilse i Kultsjödalen

**Live:** https://ollemarsliden-a11y.github.io/vilse-i-kultsjodalen/
(installerbar som app — öppna på mobilen och lägg till på hemskärmen)

Interaktiv kartguide (PWA) till Kultsjödalen och närliggande byar — leder,
smultronställen, fiske, kultur, fornlämningar, sevärdheter och boende. Byggd för
mobil, funkar även på surfplatta och dator.

## Snabbstart

**1. Backend (delade tips):**
```bash
node server/server.js        # startar tips-API på http://localhost:8787
```

**2. Appen (statisk webbserver):**
```bash
node server/dev-static.js    # öppna sedan http://localhost:5177
```
Dev-servern skickar `Cache-Control: no-store` så kodändringar alltid syns
(undvik `python -m http.server` — den saknar cache-headers och webbläsaren
serverar då gammal JS). Offline-workern (`sw.js`) är avstängd under utveckling.

På mobil: lägg till på hemskärmen för att köra som app. Vill du köra utan
backend? Sätt `API_BASE: ""` i [`js/config.js`](js/config.js) — då sparas tips
bara lokalt på enheten.

## Funktioner

- 🗺️ **Växlingsbara kartunderlag** — Enkel (OSM), Topografisk (OpenTopoMap), Satellit (Esri)
- 📍 **11 förladdade platser** i dalen (verifierade koordinater från OpenStreetMap)
- 🥾 **45 befintliga leder** — utmärkta vandrings-/fjäll-/skidleder från OpenStreetMap,
  klickbara med namn (bakade in i `js/leder.js`, funkar offline)
- 🏛️ **Fornlämningar live** — WMS-lager direkt från Riksantikvarieämbetet;
  tryck på en lämning för typ, bedömning och länk till Fornsök
- 🖼️ **Stämningsbilder** — AI-genererade (Azure gpt-image) för välkomstsplash
  och som stämningsbild på utvalda platser (märkta "Stämningsbild")
- ◎ **GPS** — visa min position
- ＋ **Lägg till eget tips** — delas med andra via molnet (eller lokalt)
- 📷 **Foto från kamera/galleri** — komprimeras i webbläsaren och laddas upp;
  delade tips visar riktiga bilder (backend sparar i `server/data/uploads/`)
- 🌤️ **Väder just nu** — live från SMHI (snow1g) i toppbaren och i varje platskort
- 🗂️ **Platskort (bottom sheet)** — bild, fakta, historia, väder, avstånd och
  vägbeskrivning för varje plats; historik om alla byar och sevärdheter
- 🧭 **GPX-import** — ladda upp en rutt och se den på kartan
- 📶 **Installbar PWA** med offline-fallback

## Arkitektur

| Del | Fil(er) | Roll |
|-----|---------|------|
| Data | [`js/data.js`](js/data.js) | **Redigera platser & kategorier här** |
| Konfig | [`js/config.js`](js/config.js) | `API_BASE` — lokalt vs moln |
| Lagring | [`js/storage.js`](js/storage.js) | Utbytbart: LocalStorage ⇄ CloudStorage |
| Applogik | [`js/app.js`](js/app.js) | Karta, lager, GPS, GPX, fornlämningar |
| Stil | [`css/styles.css`](css/styles.css) | Fjällpalett |
| Backend | [`server/server.js`](server/server.js) | Delade tips (REST, JSON-fil, inga npm-beroenden) |
| PWA | `manifest.webmanifest`, `sw.js` | Installerbar + offline |

### Molnlagring — provider-oberoende

Backenden i `server/` är en referens/utvecklingsserver som lagrar tips i
`server/data/pois.json`. Den kan:

- **Köras lokalt** som nu (delas i ditt nät).
- **Deployas till Azure App Service** (Node) i stort sett som den är — sätt
  sedan `API_BASE` i `js/config.js` till Azure-URL:en.
- **Bytas mot valfri tjänst** (Azure, Supabase, Firebase …) — appen bryr sig
  bara om REST-kontraktet: `GET/POST /api/pois`, `DELETE /api/pois/:id`.

Nästa steg för produktion: byt JSON-filen mot en databas och lägg
bilduppladdning i t.ex. Azure Blob Storage (idag sparas bild-URL:er).

## Datakällor & regenerering

- Kartor: OpenStreetMap, OpenTopoMap, Esri World Imagery
- Fornlämningar: Riksantikvarieämbetet (`pub.raa.se/visning/lamningar_v1`)
- Väder: SMHI öppna data (`snow1g/version/1`, ersätter nedlagda pmp3g)
- Platskoordinater: OpenStreetMap / Nominatim / Wikipedia (Marsfjällets topp)
- Leder: OpenStreetMap via Overpass — uppdatera med `python scripts/fetch-leder.py`
- Stämningsbilder: Azure gpt-image — `node scripts/generate-mood-images.mjs`
  (läser nyckeln från `C:/dev/sagostund/.env`, sparar PNG i `images/`; komprimera
  sedan till webp)

## Roadmap

1. ✅ Karta med förladdad lokaldata (A)
2. ✅ Fornlämningar live från Riksantikvarieämbetet (B)
3. ✅ Molnlagring för delade tips (C)
4. ⬜ Offline-cachning av kartrutor för valt område
5. ⬜ Foto direkt från kamera + bilduppladdning till blob storage
6. ⬜ Konton/moderering, fiskekortszoner, säsongsinfo (Vildmarksvägen öppen/stängd)
