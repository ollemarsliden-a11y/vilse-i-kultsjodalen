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

const CONFIG = {
  API_BASE: _isLocal ? "http://localhost:8787" : "",
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  LM_TOKEN,
};
