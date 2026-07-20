// ===================================================================
//  Rutter — GPX-tolkning, statistik, höjdprofil och lagring
// ===================================================================
//  Importera en rutt (t.ex. vägen upp på en topp) från klocka/telefon som
//  GPX, se längd, stigning och höjdprofil, spara den namngiven och dela.
//  Sparas lokalt på enheten (localStorage) — funkar utan inloggning.
// ===================================================================

const Routes = (() => {
  const KEY = "vik_routes_v1";

  // ---- GPX in ----
  function parseGpx(xmlText, fallbackName) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const nodes = [...doc.getElementsByTagName("trkpt"), ...doc.getElementsByTagName("rtept")];
    const points = nodes.map((p) => {
      const ele = p.getElementsByTagName("ele")[0];
      const time = p.getElementsByTagName("time")[0];
      return {
        lat: parseFloat(p.getAttribute("lat")),
        lng: parseFloat(p.getAttribute("lon")),
        ele: ele ? parseFloat(ele.textContent) : null,
        time: time ? time.textContent : null,
      };
    }).filter((p) => isFinite(p.lat) && isFinite(p.lng));
    const nameNode = doc.querySelector("trk > name, rte > name, metadata > name");
    const name = (nameNode && nameNode.textContent.trim()) || fallbackName || "Importerad rutt";
    return { name, points };
  }

  // ---- Statistik ----
  function haversine(a, b) {
    const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function computeStats(points) {
    let dist = 0, ascent = 0, descent = 0;
    let minEle = Infinity, maxEle = -Infinity;
    const profile = [];
    let lastEle = null;
    for (let i = 0; i < points.length; i++) {
      if (i > 0) dist += haversine(points[i - 1], points[i]);
      const e = points[i].ele;
      if (e != null && isFinite(e)) {
        if (lastEle != null) {
          const d = e - lastEle;
          if (d > 1) ascent += d; else if (d < -1) descent += -d; // 1 m brus-filter
        }
        lastEle = e;
        minEle = Math.min(minEle, e);
        maxEle = Math.max(maxEle, e);
        profile.push({ d: dist / 1000, ele: e });
      }
    }
    return {
      distanceKm: dist / 1000,
      ascent: Math.round(ascent),
      descent: Math.round(descent),
      minEle: isFinite(minEle) ? Math.round(minEle) : null,
      maxEle: isFinite(maxEle) ? Math.round(maxEle) : null,
      hasElevation: profile.length > 1,
      profile,
    };
  }

  // ---- Höjdprofil som inline-SVG ----
  function elevationSvg(profile) {
    if (!profile || profile.length < 2) return "";
    const W = 320, H = 90, pad = 4;
    const ds = profile.map((p) => p.d), es = profile.map((p) => p.ele);
    const dMax = Math.max(...ds) || 1;
    const eMin = Math.min(...es), eMax = Math.max(...es);
    const eRange = eMax - eMin || 1;
    const x = (d) => pad + (d / dMax) * (W - 2 * pad);
    const y = (e) => H - pad - ((e - eMin) / eRange) * (H - 2 * pad);
    let d = `M ${x(profile[0].d).toFixed(1)} ${y(profile[0].ele).toFixed(1)}`;
    for (const p of profile) d += ` L ${x(p.d).toFixed(1)} ${y(p.ele).toFixed(1)}`;
    const area = d + ` L ${x(dMax).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;
    return `<svg class="elev" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${area}" class="elev-fill"/><path d="${d}" class="elev-line"/></svg>`;
  }

  // ---- GPX ut (export/dela) ----
  function toGpx(route) {
    const pts = route.points.map((p) =>
      `<trkpt lat="${p.lat}" lon="${p.lng}">${p.ele != null ? `<ele>${p.ele}</ele>` : ""}</trkpt>`
    ).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Vilse i Kultsjödalen" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>${(route.name || "Rutt").replace(/[<&>]/g, "")}</name><trkseg>
${pts}
  </trkseg></trk>
</gpx>`;
  }

  // ---- Lagring (localStorage) ----
  function downsample(points, max = 2000) {
    if (points.length <= max) return points;
    const step = Math.ceil(points.length / max);
    return points.filter((_, i) => i % step === 0 || i === points.length - 1);
  }
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
  function write(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  return {
    parseGpx, computeStats, elevationSvg, toGpx,
    list: read,
    save(route) {
      const saved = {
        id: "route-" + Date.now(),
        name: route.name,
        points: downsample(route.points),
        stats: route.stats,
        createdAt: new Date().toISOString(),
      };
      const l = read(); l.push(saved); write(l);
      return saved;
    },
    remove(id) { write(read().filter((r) => r.id !== id)); },
  };
})();
