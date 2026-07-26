// ===================================================================
//  Hämtar laddstationer i Kultsjödalen från Open Charge Map
// ===================================================================
//  Kör:  node scripts/fetch-charging.mjs
//
//  Skriver INTE i js/services.js automatiskt — den skriver ut färdiga
//  poster som du klistrar in i SERVICES.push(...) längst ned i filen.
//  Anledningen är att listan är kort och handplockad: OCM innehåller
//  dubbletter (samma laddplats från flera datakällor) och stationer
//  strax utanför dalen, som behöver sållas manuellt.
//
//  Licens: Open Charge Map, CC BY-SA — källan måste anges i appen.
// ===================================================================

import { readFileSync } from "node:fs";

// Läs nyckeln ur js/config.js så den bara finns på ett ställe.
const cfg = readFileSync(new URL("../js/config.js", import.meta.url), "utf8");
const KEY = (cfg.match(/const OCM_KEY = "([^"]*)"/) || [, ""])[1];
if (!KEY) {
  console.error("Ingen OCM_KEY i js/config.js — hämta en på openchargemap.org");
  process.exit(1);
}

// Dalen: mitten ungefär vid Fatmomakke, radie som täcker Stalon–Stekenjokk.
const CENTER = { lat: 65.05, lng: 15.25, km: 55 };
// Stationer utanför dalen som OCM tar med på köpet.
const UTANFOR = ["BORGAFJÄLL", "SLUSSFORS", "VILHELMINA", "DIKANÄS"];

const url =
  "https://api.openchargemap.io/v3/poi/?output=json&countrycode=SE" +
  `&latitude=${CENTER.lat}&longitude=${CENTER.lng}` +
  `&distance=${CENTER.km}&distanceunit=KM&maxresults=200&compact=false&verbose=false`;

const res = await fetch(url, {
  headers: { "X-API-Key": KEY, "User-Agent": "vilse-i-kultsjodalen/1.0" },
});
if (!res.ok) {
  console.error("OCM svarade", res.status, await res.text());
  process.exit(1);
}

const pois = await res.json();
const kvar = pois.filter((p) => {
  const ort = ((p.AddressInfo || {}).Town || "").toUpperCase();
  return !UTANFOR.some((u) => ort.includes(u));
});

console.log(`${pois.length} träffar, ${kvar.length} inom dalen\n`);
for (const p of kvar) {
  const a = p.AddressInfo || {};
  const c = p.Connections || [];
  const kw = Math.max(0, ...c.map((x) => x.PowerKW || 0));
  const typer = [...new Set(c.map((x) => (x.ConnectionType || {}).Title).filter(Boolean))];
  const info = [
    p.NumberOfPoints ? `${p.NumberOfPoints} laddpunkter` : "",
    kw ? `upp till ${kw} kW` : "",
    typer.join(" & "),
  ].filter(Boolean).join(" · ");

  console.log(`  {
    name: ${JSON.stringify(a.Title || "Laddstation")},
    kind: "service", sub: "charging",
    lat: ${(+a.Latitude).toFixed(5)}, lng: ${(+a.Longitude).toFixed(5)},
    website: "", phone: "", hours: "",
    info: ${JSON.stringify(info)},
    source: "Open Charge Map",
  },`);
}
console.log("\nOBS: kolla dubbletter — OCM listar ofta samma laddplats flera gånger.");
