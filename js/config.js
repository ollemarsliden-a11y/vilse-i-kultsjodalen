// ===================================================================
//  App-konfiguration
// ===================================================================
//  API_BASE styr var användarnas egna tips lagras.
//  Automatik: lokalt (localhost) används dev-backenden på :8787.
//  Publikt (t.ex. GitHub Pages) används lokalt läge tills vi kopplat
//  på en molnbackend — byt då PROD_API nedan till backendens URL.
// ===================================================================
const _isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

// Sätt denna till din hostade backend när den finns (annars "" = lokalt läge):
const PROD_API = "";

const CONFIG = {
  API_BASE: _isLocal ? "http://localhost:8787" : PROD_API,
};
