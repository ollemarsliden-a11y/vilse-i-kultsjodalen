# ===================================================================
#  Hämtar statens friluftsanordningar i dalen → js/friluft.js
# ===================================================================
#  Källa: Naturvårdsverkets öppna data "Leder och friluftsanordningar"
#  (samma register som ligger bakom Länsstyrelsens ledlager). Innehåller
#  bl.a. Länsstyrelsens övernattningsstugor (200 kr/natt), raststugor,
#  rastskydd, vindskydd, kojor, eldstäder, dass och hjälptelefoner —
#  med namn och vilken statlig led de hör till.
#
#  Kör:  python scripts/fetch-friluft.py
#  Broar, skyltar, parkeringar m.m. filtreras bort (143 broar bara i
#  dalen — de är underhållsdata, inte besöksmål).
# ===================================================================
import json, math, io, urllib.request

URL = "https://geodata.naturvardsverket.se/nedladdning/friluftsliv/Anordningar.geojson"
BBOX = (64.80, 14.35, 65.35, 16.10)   # lat_min, lng_min, lat_max, lng_max
TYPER = {  # TYP i källdatan -> vår typkod
    "Övernattningsstuga": "stuga",
    "Raststuga": "raststuga",
    "Rastskydd": "rastskydd",
    "Koja": "koja",
    "Vindskydd": "vindskydd",
    "Eldstad": "eldstad",
    "Dass": "dass",
    "Hjälptelefon": "telefon",
}

# SWEREF99 TM (EPSG:3006) -> WGS84, utan externa bibliotek.
def till_wgs(x, y):
    a = 6378137.0; f = 1 / 298.257222101; e2 = f * (2 - f); k0 = 0.9996
    FE = 500000; lon0 = math.radians(15)
    e4 = e2 * e2; e6 = e4 * e2
    M = y / k0
    mu = M / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256))
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    phi1 = (mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu)
            + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
            + (151 * e1 ** 3 / 96) * math.sin(6 * mu)
            + (1097 * e1 ** 4 / 512) * math.sin(8 * mu))
    ep2 = e2 / (1 - e2)
    C1 = ep2 * math.cos(phi1) ** 2; T1 = math.tan(phi1) ** 2
    N1 = a / math.sqrt(1 - e2 * math.sin(phi1) ** 2)
    R1 = a * (1 - e2) / (1 - e2 * math.sin(phi1) ** 2) ** 1.5
    D = (x - FE) / (N1 * k0)
    lat = phi1 - (N1 * math.tan(phi1) / R1) * (
        D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
        + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720)
    lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6
                  + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / math.cos(phi1)
    return math.degrees(lat), math.degrees(lon)

print("Hämtar", URL)
data = json.load(urllib.request.urlopen(URL, timeout=180))
ut = []
for ft in data["features"]:
    typ = (ft["properties"].get("TYP") or "").strip()
    if typ not in TYPER:
        continue
    x, y = ft["geometry"]["coordinates"][:2]
    lat, lon = till_wgs(x, y)
    if not (BBOX[0] <= lat <= BBOX[2] and BBOX[1] <= lon <= BBOX[3]):
        continue
    p = ft["properties"]
    ut.append({
        "typ": TYPER[typ],
        "namn": (p.get("ANORDNINGNAMN") or "").strip(),
        "lat": round(lat, 5), "lng": round(lon, 5),
        "led": (p.get("STATLIGLED") or "").strip(),
        "omrade": (p.get("SKYDDATOMRADE") or "").strip(),
    })

ut.sort(key=lambda r: (r["typ"], r["namn"]))
rader = ",\n  ".join(json.dumps(r, ensure_ascii=False) for r in ut)
js = f"""// Statens friluftsanordningar i dalen — stugor, rastskydd, vindskydd m.m.
// Källa: Naturvårdsverket, öppna data "Leder och friluftsanordningar".
// Regenerera med scripts/fetch-friluft.py (broar m.m. bortfiltrerade).
const FRILUFT = [
  {rader},
];
"""
io.open("js/friluft.js", "w", encoding="utf-8", newline="\n").write(js)
from collections import Counter
print("skrev js/friluft.js:", len(ut), "punkter", dict(Counter(r["typ"] for r in ut)))
