# Hämtar boende, mat & service från OpenStreetMap (Overpass) och skriver
# js/services.js. Kör: python scripts/fetch-services.py

import json, urllib.request, urllib.parse, os
from collections import Counter

BBOX = "64.85,14.30,65.35,16.10"  # Kultsjödalen med omnejd
OUT = os.path.join("js", "services.js")

Q = f"""[out:json][timeout:90];
(
  nwr["tourism"~"hotel|guest_house|hostel|chalet|motel|apartment|camp_site|caravan_site|wilderness_hut|alpine_hut|cabin"]({BBOX});
  nwr["amenity"~"restaurant|cafe|fast_food|pub|bar|fuel"]({BBOX});
  nwr["shop"]({BBOX});
);
out center tags;"""

def kind(t):
    to, am, sh = t.get("tourism"), t.get("amenity"), t.get("shop")
    if to in ("hotel","guest_house","hostel","chalet","motel","apartment",
              "camp_site","caravan_site","wilderness_hut","alpine_hut","cabin"):
        return "boende"
    if am in ("restaurant","cafe","fast_food","pub","bar"):
        return "mat"
    if am == "fuel" or sh:
        return "service"
    return None

def main():
    req = urllib.request.Request(
        "https://overpass-api.de/api/interpreter",
        data=urllib.parse.urlencode({"data": Q}).encode(),
        headers={"User-Agent": "VilseIKultsjodalen/1.0 (services)"})
    d = json.load(urllib.request.urlopen(req, timeout=120))
    seen, rows = set(), []
    for e in d.get("elements", []):
        t = e.get("tags", {})
        k = kind(t)
        if not k:
            continue
        lat = e.get("lat") or (e.get("center", {}) or {}).get("lat")
        lon = e.get("lon") or (e.get("center", {}) or {}).get("lon")
        name = t.get("name") or t.get("operator")
        if lat is None or lon is None or not name:
            continue
        key = (round(lat, 5), round(lon, 5), name)
        if key in seen:
            continue
        seen.add(key)
        rows.append({
            "name": name, "kind": k,
            "sub": t.get("tourism") or t.get("amenity") or ("butik" if t.get("shop") else ""),
            "lat": round(lat, 5), "lng": round(lon, 5),
            "website": t.get("website") or t.get("contact:website") or "",
            "phone": t.get("phone") or t.get("contact:phone") or "",
            "hours": t.get("opening_hours") or "",
        })
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// Boende, mat & service i Kultsjödalen med omnejd.\n")
        f.write("// Källa: OpenStreetMap. Regenerera via scripts/fetch-services.py\n")
        f.write("const SERVICES = ")
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"Skrev {OUT}: {len(rows)} platser {dict(Counter(r['kind'] for r in rows))}")

if __name__ == "__main__":
    main()
