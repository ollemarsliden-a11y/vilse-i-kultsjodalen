// ===================================================================
//  App-konfiguration
// ===================================================================
//  Community-backend: Supabase (delas med frågesport-projektet, men våra
//  tabeller är vik_-prefixade + egen bucket vik-photos → ingen krock).
//  Publishable-nyckeln är gjord för frontend och är säker att ha här.
// ===================================================================
const SUPABASE_URL = "https://ackvaaavkrxcemmixloh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_59097m0ExGRyMzSGCqbArw_yjk4WqJk";

const _isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

// Gammal Node-backend (endast fallback om Supabase inte är laddat).
// Lantmäteriets Fjällkarta (öppna data, CC0). Klistra in din öppna-data-token
// här så dyker "Fjällkarta" upp som kartunderlag. Registrering: se README.
const LM_TOKEN = "";

// Trafikverkets öppna API (vägstatus Stekenjokk, väg 1067). Gratis nyckel:
// registrera på https://data.trafikverket.se/ och klistra in här. Utan nyckel
// visas säsongsbaserad status (vinterstängd ca 15 okt–6 jun).
const TRV_KEY = "";

// Open Charge Map (laddstationer, öppna data CC BY-SA). Nyckeln används av
// scripts/fetch-charging.mjs för att uppdatera listan i js/services.js —
// appen själv hämtar inget live, så laddstationerna finns kvar utan täckning.
// Gratis nyckel: https://openchargemap.org/site/profile/applications
const OCM_KEY = "714d8c57-b779-4be5-b387-48d5ca7ae77a";

// Lantmäteriets fjällkarta som LOKALA rutor (nedladdade en gång, CC0).
// Sätts till true när tiles/topo/ finns i projektet (scripts/fetch-lm-tiles.mjs).
const LOCAL_FJALL = true;
// z13 finns över hela dalen. z14 finns BARA över kärnområdet (byarna och
// Marsfjället) — hela dalen på z14 hade blivit ~364 MB. Appen lägger därför
// z14 som ett extra lager ovanpå z13 inom de här gränserna; utanför visas
// z13 uppskalat precis som förut, i stället för tomma rutor.
const LOCAL_FJALL_MAXZOOM = 13;      // nedladdat överallt
const LOCAL_FJALL_KARNA_MAXZOOM = 14; // nedladdat inom kärnområdet
const LOCAL_FJALL_KARNA = { south: 64.92, north: 65.18, west: 15.00, east: 15.62 };

// Moderatorer (matchar admin.sql). Endast för att visa admin-vyn i klienten —
// den faktiska behörigheten styrs av säkerhetsreglerna i Supabase.
const ADMIN_EMAILS = ["olle.marsliden@gmail.com"];

const CONFIG = {
  API_BASE: _isLocal ? "http://localhost:8787" : "",
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  LM_TOKEN,
  TRV_KEY,
  OCM_KEY,
  LOCAL_FJALL,
  LOCAL_FJALL_MAXZOOM,
  LOCAL_FJALL_KARNA_MAXZOOM,
  LOCAL_FJALL_KARNA,
  ADMIN_EMAILS,
};
