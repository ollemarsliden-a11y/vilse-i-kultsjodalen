// ===================================================================
//  Hämta Lantmäteriets topografiska webbkarta (CC0) för Kultsjödalen
// ===================================================================
//  Laddar ner kartrutor EN gång från den öppna WMTS:en (Web Mercator,
//  samma rutnät som OSM/Leaflet) och sparar dem som statiska filer i
//  tiles/topo/{z}/{x}/{y}.png. Sen serveras de utan inloggning (CC0).
//
//  KÖRS LOKALT AV OLLE — ditt lösenord stannar på din dator, det läses
//  från miljövariabeln LM_PASS och sparas ALDRIG i koden/repot.
//
//  Windows PowerShell:
//    $env:LM_PASS="ditt-losenord"; node scripts/fetch-lm-tiles.mjs         (dry run – räknar bara)
//    $env:LM_PASS="ditt-losenord"; node scripts/fetch-lm-tiles.mjs --download   (hämtar på riktigt)
//
//  Byt LAYER till "topowebb_nedtonad" om du vill ha den grå varianten.
// ===================================================================

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

// ---- Inställningar ----
const USER = process.env.LM_USER || "olle.marsliden@gmail.com";
const PASS = process.env.LM_PASS || "";
const LAYER = "topowebb";              // eller "topowebb_nedtonad"
const OUT = path.resolve("tiles/topo");
const BASE = "https://maps.lantmateriet.se/open/topowebb-ccby/v1/wmts/1.0.0";

// Område: Kultsjödalen med omnejd (samma zon som appens maxBounds).
const BBOX = { south: 64.75, north: 65.45, west: 14.05, east: 16.30 };
const ZMIN = 8;
const ZMAX = 13;   // ~68 MB. z14 fyrdubblar (~262 MB) – kräver PMTiles istället

const DOWNLOAD = process.argv.includes("--download");
const CONCURRENCY = 5;      // snällt mot LM:s server
const DELAY_MS = 40;        // liten paus mellan omgångar

// ---- Slippy-tile-matematik (standard Web Mercator) ----
const lon2x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z);
};

function tilesForZoom(z) {
  const x0 = lon2x(BBOX.west, z), x1 = lon2x(BBOX.east, z);
  const y0 = lat2y(BBOX.north, z), y1 = lat2y(BBOX.south, z); // north = mindre y
  const list = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) list.push({ z, x, y });
  return list;
}

const authHeader = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function fetchTile({ z, x, y }) {
  const url = `${BASE}/${LAYER}/default/3857/${z}/${y}/${x}.png`; // WMTS: {TileMatrix}/{TileRow}/{TileCol} = z/y/x
  const file = path.join(OUT, String(z), String(x), `${y}.png`);
  if (await exists(file)) return "skip";
  const res = await fetch(url, { headers: { Authorization: authHeader, "User-Agent": "VilseIKultsjodalen/1.0" } });
  if (res.status === 401) throw new Error("401 – fel användarnamn/lösenord (LM_PASS).");
  if (!res.ok) return "fail:" + res.status;
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
  return "ok";
}

async function run() {
  const all = [];
  console.log(`Område: ${BBOX.south}–${BBOX.north} N, ${BBOX.west}–${BBOX.east} Ö | lager: ${LAYER}`);
  for (let z = ZMIN; z <= ZMAX; z++) {
    const t = tilesForZoom(z);
    all.push(...t);
    console.log(`  zoom ${z}: ${t.length} rutor`);
  }
  const estMB = (all.length * 25) / 1024; // ~25 kB/ruta grovt
  console.log(`TOTALT: ${all.length} rutor  (~${estMB.toFixed(0)} MB uppskattat)`);

  if (!DOWNLOAD) {
    console.log("\nDry run. Kör med  --download  för att hämta på riktigt.");
    return;
  }
  if (!PASS) { console.error("Saknar LM_PASS (ditt Lantmäteriet-lösenord)."); process.exit(1); }

  let ok = 0, skip = 0, fail = 0, done = 0;
  for (let i = 0; i < all.length; i += CONCURRENCY) {
    const batch = all.slice(i, i + CONCURRENCY);
    const res = await Promise.all(batch.map(fetchTile));
    for (const r of res) { if (r === "ok") ok++; else if (r === "skip") skip++; else fail++; }
    done += batch.length;
    if (done % 200 < CONCURRENCY) process.stdout.write(`\r  ${done}/${all.length}  (ok ${ok}, hoppat ${skip}, fel ${fail})   `);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log(`\nKlart. Hämtade ${ok}, hoppade ${skip}, fel ${fail}. Filer i ${OUT}`);
}

run().catch((e) => { console.error("\nFel:", e.message); process.exit(1); });
