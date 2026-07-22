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

// Lantmäteriets fjällkarta som LOKALA rutor (nedladdade en gång, CC0).
// Sätts till true när tiles/topo/ finns i projektet (scripts/fetch-lm-tiles.mjs).
const LOCAL_FJALL = true;
const LOCAL_FJALL_MAXZOOM = 13; // sista nedladdade zoomnivån (skalas upp ovanför)

// Moderatorer (matchar admin.sql). Endast för att visa admin-vyn i klienten —
// den faktiska behörigheten styrs av säkerhetsreglerna i Supabase.
const ADMIN_EMAILS = ["olle.marsliden@gmail.com"];

const CONFIG = {
  API_BASE: _isLocal ? "http://localhost:8787" : "",
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  LM_TOKEN,
  TRV_KEY,
  LOCAL_FJALL,
  LOCAL_FJALL_MAXZOOM,
  ADMIN_EMAILS,
};
