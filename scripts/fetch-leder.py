# Hämtar befintliga, utmärkta leder från OpenStreetMap (Overpass) och skriver
# js/leder.js (en FeatureCollection med MultiLineString per led).
#
# Kör:  python scripts/fetch-leder.py
#
# Justera BBOX för att täcka ett annat område. route=hiking/foot/ski tas med.

import json, urllib.request, urllib.parse, os

BBOX = "64.85,14.30,65.35,16.10"  # Kultsjödalen med omnejd
OUT = os.path.join("js", "leder.js")

Q = f"""[out:json][timeout:120];
(
  relation["route"="hiking"]({BBOX});
  relation["route"="foot"]({BBOX});
  relation["route"="ski"]({BBOX});
);
out geom;"""

def main():
    data = urllib.parse.urlencode({"data": Q}).encode()
    req = urllib.request.Request(
        "https://overpass-api.de/api/interpreter", data=data,
        headers={"User-Agent": "VilseIKultsjodalen/1.0 (trail import)"})
    d = json.load(urllib.request.urlopen(req, timeout=150))

    rnd = lambda x: round(x, 5)
    feats = []
    for e in d.get("elements", []):
        if e.get("type") != "relation":
            continue
        t = e.get("tags", {})
        lines = []
        for m in e.get("members", []):
            g = m.get("geometry")
            if not g:
                continue
            coords = [[rnd(p["lon"]), rnd(p["lat"])] for p in g]
            if len(coords) >= 2:
                lines.append(coords)
        if not lines:
            continue
        feats.append({
            "type": "Feature",
            "properties": {
                "name": t.get("name") or t.get("ref") or "Namnlös led",
                "route": t.get("route", ""),
                "network": t.get("network", ""),
                "osm_id": e.get("id"),
            },
            "geometry": {"type": "MultiLineString", "coordinates": lines},
        })

    fc = {"type": "FeatureCollection", "features": feats}
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// Befintliga, utmärkta leder i Kultsjödalen med omnejd.\n")
        f.write("// Källa: OpenStreetMap (route=hiking/foot/ski). Genererad via Overpass.\n")
        f.write("// Regenerera med: python scripts/fetch-leder.py\n")
        f.write("const TRAILS = ")
        json.dump(fc, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    print(f"Skrev {OUT}: {len(feats)} leder, {os.path.getsize(OUT)/1024:.0f} kB")

if __name__ == "__main__":
    main()
