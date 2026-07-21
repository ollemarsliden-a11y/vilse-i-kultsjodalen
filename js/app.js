// ===================================================================
//  Vilse i Kultsjödalen — huvudlogik
// ===================================================================

/* global L, CATEGORIES, SEED_POIS, MAP_CENTER, MAP_ZOOM, Storage, TRAILS,
   iconSvg, pinHtml, Weather */

// ---- Bakgrundskartor ----------------------------------------------
const BASEMAPS = {
  enkel: {
    label: "Karta",
    layer: () =>
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxNativeZoom: 19, maxZoom: 18, attribution: "© OpenStreetMap",
      }),
  },
  topo: {
    label: "Terräng",
    layer: () =>
      L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxNativeZoom: 17, maxZoom: 18, attribution: "© OpenTopoMap (CC-BY-SA), © OpenStreetMap",
      }),
  },
  satellit: {
    label: "Satellit",
    layer: () =>
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxNativeZoom: 19, maxZoom: 18, attribution: "© Esri, Maxar, Earthstar Geographics" }
      ),
  },
  // Lantmäteriets Fjällkarta som LOKALA rutor (nedladdade en gång, CC0).
  // Visas bara när CONFIG.LOCAL_FJALL är true (dvs tiles/topo/ finns).
  fjall: {
    label: "Fjällkarta",
    requiresLocal: true,
    layer: () =>
      L.tileLayer("tiles/topo/{z}/{x}/{y}.png", {
        maxNativeZoom: CONFIG.LOCAL_FJALL_MAXZOOM || 14, maxZoom: 18,
        attribution: "© Lantmäteriet (CC0)",
      }),
  },
};

// ---- Live-overlays -------------------------------------------------
const RAA_WMS = "https://pub.raa.se/visning/lamningar_v1/wms";
const RAA_LAYERS = "fornlamning,mojligfornlamning,ovrkulthistlamning";

const SERVICE_KINDS = {
  boende:  { label: "Boende", color: "#e0872b" },
  mat:     { label: "Mat & fik", color: "#c1524a" },
  service: { label: "Affär & service", color: "#4f8a8b" },
};
const SERVICE_SUB = {
  hotel: "Hotell", guest_house: "Gästgiveri", hostel: "Vandrarhem", chalet: "Stuga",
  motel: "Motell", apartment: "Lägenhet", camp_site: "Camping", caravan_site: "Ställplats",
  wilderness_hut: "Fjällstuga", alpine_hut: "Fjällstuga", cabin: "Stuga",
  restaurant: "Restaurang", cafe: "Café", fast_food: "Snabbmat", pub: "Pub", bar: "Bar",
  fuel: "Drivmedel", butik: "Butik",
};

const OVERLAYS = {
  statligaleder: {
    label: "Statliga leder",
    icon: "led",
    sub: "Officiella leder & anordningar i skyddade områden (Länsstyrelsen)",
    toast: "Laddar statliga leder från Länsstyrelsen…",
    create: () =>
      L.tileLayer.wms("https://geodata.naturvardsverket.se/leder_friluftsliv/wms", {
        layers: "LED", format: "image/png", transparent: true, version: "1.3.0",
        attribution: "Leder © Naturvårdsverket / Länsstyrelserna",
      }),
  },
  waymarked: {
    label: "Fler leder & stigar",
    icon: "led",
    sub: "Alla markerade leder & stigar från OpenStreetMap (Waymarked Trails)",
    toast: "Laddar leder & stigar…",
    create: () =>
      L.tileLayer("https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png", {
        maxNativeZoom: 18, maxZoom: 18, opacity: 0.9,
        attribution: "Leder © waymarkedtrails.org, © OpenStreetMap",
      }),
  },
  service: {
    label: "Boende & service",
    icon: "boende",
    sub: "Hotell, stugor, camping, mat, affärer & mackar (OpenStreetMap)",
    toast: "Laddar boende & service…",
    create: () => buildServiceLayer(),
  },
  fornlamningar: {
    label: "Fornlämningar",
    icon: "kultur",
    sub: "Live från Riksantikvarieämbetet — tryck på en lämning för info",
    toast: "Fornlämningar laddas från Riksantikvarieämbetet…",
    create: () =>
      L.tileLayer.wms(RAA_WMS, {
        layers: RAA_LAYERS, format: "image/png", transparent: true,
        version: "1.3.0", attribution: "Lämningar © Riksantikvarieämbetet",
      }),
  },
};

function TRAIL_STYLE(f) {
  const r = f.properties.route;
  if (r === "ski") return { color: "#2f6fb0", weight: 3, opacity: 0.85, dashArray: "4 6" };
  if (r === "hiking") return { color: "#1f6b2e", weight: 4, opacity: 0.9 };
  return { color: "#2f8f4e", weight: 3, opacity: 0.85 };
}
function buildServiceLayer() {
  if (typeof SERVICES === "undefined") return L.layerGroup();
  const group = L.layerGroup();
  for (const s of SERVICES) {
    const k = SERVICE_KINDS[s.kind] || SERVICE_KINDS.service;
    const icon = L.divIcon({
      className: "svc-pin",
      html: `<div class="svc-dot" style="--c:${k.color}">${iconSvg(s.kind, "#fff", 13)}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const sub = SERVICE_SUB[s.sub] || s.sub || k.label;
    const rows = [];
    if (s.hours) rows.push(`<div class="svc-row">🕑 ${escapeHtml(s.hours)}</div>`);
    if (s.phone) rows.push(`<div class="svc-row">📞 <a href="tel:${escapeHtml(s.phone)}">${escapeHtml(s.phone)}</a></div>`);
    if (s.website) rows.push(`<div class="svc-row"><a href="${encodeURI(s.website)}" target="_blank" rel="noopener">Hemsida ↗</a></div>`);
    L.marker([s.lat, s.lng], { icon })
      .bindPopup(
        `<div class="mini-pop">
           <div class="svc-cat" style="color:${k.color}">${escapeHtml(sub)}</div>
           <b>${escapeHtml(s.name)}</b>
           ${rows.join("")}
           <div class="mini-sub">Källa: OpenStreetMap</div>
         </div>`,
        { maxWidth: 240 }
      )
      .addTo(group);
  }
  return group;
}

function buildTrailLayer() {
  if (typeof TRAILS === "undefined") return L.layerGroup();
  const routeLabel = { hiking: "Vandringsled", foot: "Gångled/fjälled", ski: "Skidled" };
  return L.geoJSON(TRAILS, {
    style: TRAIL_STYLE,
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      layer.bindPopup(
        `<div class="mini-pop"><b>${escapeHtml(p.name)}</b><br>
         <span class="mini-sub">${routeLabel[p.route] || "Led"} · OpenStreetMap</span></div>`,
        { maxWidth: 240 }
      );
      layer.on("mouseover", () => layer.setStyle({ weight: 6 }));
      layer.on("mouseout", () => layer.setStyle(TRAIL_STYLE(feature)));
    },
  });
}

// ---- State --------------------------------------------------------
const state = {
  map: null,
  currentBasemap: null,
  layers: {},
  overlays: {},
  markers: {},        // poi.id -> marker
  editingId: null,    // id på tips som redigeras
  activeCategories: new Set(Object.keys(CATEGORIES)),
  meMarker: null,
  meCircle: null,
  meLatLng: null,
  routeLayer: null,
  winterLayer: null,
  season: "summer",
  pickingLocation: false,
  pendingCoord: null,
  pendingImage: null,
  weatherTimer: null,
  overrides: {},      // place_id -> patch (admin-textändringar)
  placeImages: {},    // place_id -> [bildrader]
  editingPlaceId: null,
  hubVillageId: null, // öppen byhub
  sharedRoutes: [],   // delade GPX-turer (Supabase)
  routeVillageId: null, // by som importerad rutt ska delas till
  bgTarget: null,     // vilken bakgrund admin byter (_startpage / _splash)
};

// ===================================================================
//  Init
// ===================================================================
// Kartan låses till Kultsjödalen med omnejd (Stekenjokk/Dikanäs/Kittelfjäll).
// Hindrar att man zoomar/panorerar ut till hela landet.
const MAP_MAX_BOUNDS = L.latLngBounds([64.70, 13.9], [65.50, 16.5]);
const MAP_MIN_ZOOM = 8;
const MAP_MAX_ZOOM = 18; // sista nivåerna skalas upp från tiles (se maxNativeZoom)

async function init() {
  state.map = L.map("map", {
    zoomControl: false, attributionControl: false,
    minZoom: MAP_MIN_ZOOM, maxZoom: MAP_MAX_ZOOM,
    maxBounds: MAP_MAX_BOUNDS, maxBoundsViscosity: 0.85,
    rotate: true, touchRotate: true, shiftKeyRotate: true, // rotera med två fingrar (mobil) / shift+drag (dator)
    rotateControl: { closeOnZeroBearing: false, position: "bottomright" },
  }).setView(MAP_CENTER, MAP_ZOOM);
  L.control.attribution({ position: "bottomleft", prefix: false }).addTo(state.map);
  L.control.zoom({ position: "bottomright" }).addTo(state.map);

  setBasemap(CONFIG.LOCAL_FJALL ? "fjall" : "topo");
  for (const key of Object.keys(CATEGORIES)) {
    state.layers[key] = L.layerGroup().addTo(state.map);
  }
  await loadPlaceData(); // admins textändringar + bilder ovanpå grunddatan
  SEED_POIS.forEach(addPoiMarker);
  if (typeof PEAKS !== "undefined") PEAKS.forEach(addPoiMarker);
  const userPois = await Storage.getUserPois();
  userPois.forEach(addPoiMarker);

  for (const key of Object.keys(OVERLAYS)) state.overlays[key] = OVERLAYS[key].create();

  buildCategoryChips();
  buildBasemapButtons();
  buildOverlayToggles();
  fillCategorySelect();
  fillVillageSelect();
  applyStaticI18n();
  buildStartPage();
  buildInfoPage();
  wireTabs();
  wireLang();
  wireSeason();
  wireControls();
  wireIdentify();
  wireSplash();
  wireWeather();
  wireAccount();
  registerServiceWorker();
  state.map.on("zoomend", updatePeakVisibility);
  updatePeakVisibility();
}

// ===================================================================
//  Vyer & flikrad (Upptäck / Karta / Info / Konto)
// ===================================================================
function showView(name) {
  // Stäng ev. öppet kort/panel vid flikbyte.
  document.querySelectorAll(".place-sheet.open, .panel.open, .sheet.open")
    .forEach((el) => el.classList.remove("open"));
  document.querySelectorAll(".view").forEach((v) =>
    v.classList.toggle("active", v.id === "view-" + name));
  document.querySelectorAll(".tab[data-view]").forEach((t) =>
    t.classList.toggle("active", t.dataset.view === name));
  document.body.dataset.view = name;
  // Leaflet måste räkna om storleken när kartan just blivit synlig.
  if (name === "map" && state.map) setTimeout(() => state.map.invalidateSize(), 60);
}

function wireTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.dataset.action === "account") { openAccountSheet(); return; }
      showView(tab.dataset.view);
    });
  });
}

// Språkväxlare (svenska / engelska).
function wireLang() {
  document.querySelectorAll("#lang-toggle [data-lang]").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === LANG);
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });
}

// ===================================================================
//  Admin-redigering: läs in ändringar + bilder ovanpå grunddatan
// ===================================================================
async function loadPlaceData() {
  if (Storage.mode !== "supabase") return;
  try {
    const [overrides, images, routes] = await Promise.all([
      Storage.getPlaceOverrides(), Storage.getPlaceImages(),
      Storage.getSharedRoutes ? Storage.getSharedRoutes() : [],
    ]);
    state.overrides = {};
    for (const o of overrides) state.overrides[o.place_id] = o.patch || {};
    state.placeImages = {};
    for (const im of images) (state.placeImages[im.place_id] ||= []).push(im);
    state.sharedRoutes = routes || [];
    applyOverridesToSeed();
  } catch (e) { console.warn("Kunde inte läsa platsdata:", e.message); }
}

// Lägg admins textändringar ovanpå grundplatserna (muterar SEED_POIS).
function applyOverridesToSeed() {
  for (const poi of SEED_POIS) {
    const patch = state.overrides[poi.id];
    if (patch) for (const k of Object.keys(patch)) poi[k] = patch[k];
  }
}

// Bilder att visa för en plats: grundbild (om ej dold) + synliga gallerибilder.
function galleryFor(poi) {
  const patch = state.overrides[poi.id] || {};
  const imgs = [];
  if (poi.image && !patch.hideSeedImage)
    imgs.push({ url: poi.image, credit: poi.imageCredit, seed: true });
  for (const r of (state.placeImages[poi.id] || []))
    if (!r.hidden) imgs.push({ url: r.url, caption: r.caption, id: r.id });
  return imgs;
}

function canAdminEdit(poi) {
  return Storage.auth && Storage.auth.isAdmin && Storage.auth.isAdmin() && poi && !poi.userAdded;
}

// ---- Redigeringsark (text + bildhanterare) ----
function factsToText(facts) {
  return (facts || []).map(([k, v]) => `${k}: ${v}`).join("\n");
}
function textToFacts(txt) {
  return txt.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf(":");
    return i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  });
}
function lodgingToText(list) {
  return (list || []).map((l) => [l.name, l.url, l.note].filter(Boolean).join(" | ")).join("\n");
}
function textToLodging(txt) {
  return txt.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name, url, note] = l.split("|").map((s) => (s || "").trim());
    return { name: name || "Boende", url: url || "", note: note || "" };
  });
}

function openPlaceEdit(poi) {
  state.editingPlaceId = poi.id;
  document.getElementById("pe-title").textContent = t("Redigera plats") + ": " + (poi.name || "");
  renderPlaceEdit(poi);
  openSheet("place-edit");
}

function renderPlaceEdit(poi) {
  const body = document.getElementById("pe-body");
  const patch = state.overrides[poi.id] || {};
  const imgList = [];
  if (poi.image) imgList.push({ seed: true, url: poi.image, hidden: !!patch.hideSeedImage });
  for (const r of (state.placeImages[poi.id] || [])) imgList.push({ id: r.id, url: r.url, hidden: r.hidden });

  body.innerHTML = `
    <label><span>${t("Namn")}</span>
      <input id="pe-name" type="text" value="${escapeHtml(poi.name || "")}" /></label>
    <label><span>${t("Kort beskrivning")}</span>
      <input id="pe-blurb" type="text" value="${escapeHtml(poi.blurb || "")}" /></label>
    <label><span>${t("Beskrivning")}</span>
      <textarea id="pe-desc" rows="4">${escapeHtml(poi.description || "")}</textarea></label>
    <label><span>${t("Historia")}</span>
      <textarea id="pe-history" rows="5">${escapeHtml(poi.history || "")}</textarea></label>
    <label><span>${t("Fakta (en per rad: Rubrik: värde)")}</span>
      <textarea id="pe-facts" rows="4">${escapeHtml(factsToText(poi.facts))}</textarea></label>
    <label><span>${t("Boende & länkar (en per rad: Namn | länk | valfri notis)")}</span>
      <textarea id="pe-lodging" rows="3" placeholder="Saxnäsgården | https://saxnas.se | Hotell & restaurang">${escapeHtml(lodgingToText(patch.lodging))}</textarea></label>
    <div class="sheet-actions"><button id="pe-save" class="btn-primary">${t("Spara ändringar")}</button></div>

    <h3 class="panel-subhead">${t("Bilder")}</h3>
    <button type="button" id="pe-add-photo" class="photo-btn">${t("📷 Ladda upp bild")}</button>
    <div class="pe-images">${imgList.map(imgManagerRow).join("") || `<p class="panel-hint">${t("Inga bilder än.")}</p>`}</div>
    <p class="panel-hint">${t("Dölj eller ta bort bilder som inte passar. Bilder du laddar upp måste du ha rätt till.")}</p>`;

  document.getElementById("pe-save").onclick = () => savePlaceEdit(poi);
  document.getElementById("pe-add-photo").onclick = () => document.getElementById("pe-photo").click();
  wireImageManager(poi);
}

function imgManagerRow(im) {
  return `<div class="pe-img${im.hidden ? " is-hidden" : ""}" data-id="${im.id || ""}" data-seed="${im.seed ? "1" : ""}">
    <div class="pe-img-thumb" style="background-image:url('${im.url}')">${im.seed ? `<span class="pe-img-tag">${t("Grundbild")}</span>` : ""}</div>
    <div class="pe-img-actions">
      <button data-act="hide">${im.hidden ? t("Visa") : t("Dölj")}</button>
      ${im.seed ? "" : `<button class="pe-del" data-act="del">${t("Ta bort")}</button>`}
    </div>
  </div>`;
}

function wireImageManager(poi) {
  document.querySelectorAll("#pe-body .pe-img").forEach((el) => {
    const id = el.dataset.id, seed = el.dataset.seed === "1";
    el.querySelector('[data-act="hide"]').onclick = async () => {
      try {
        if (seed) {
          const patch = { ...(state.overrides[poi.id] || {}) };
          patch.hideSeedImage = !patch.hideSeedImage;
          await Storage.savePlaceOverride(poi.id, patch);
        } else {
          const cur = (state.placeImages[poi.id] || []).find((r) => r.id === id);
          await Storage.setPlaceImageHidden(id, !(cur && cur.hidden));
        }
        await refreshAfterEdit(poi, true);
      } catch (e) { toast("Kunde inte ändra: " + e.message); }
    };
    const del = el.querySelector('[data-act="del"]');
    if (del) del.onclick = async () => {
      if (!confirm(t("Ta bort bilden?"))) return;
      try { await Storage.deletePlaceImage(id); await refreshAfterEdit(poi, true); }
      catch (e) { toast("Kunde inte ta bort: " + e.message); }
    };
  });
}

async function savePlaceEdit(poi) {
  const val = (id) => document.getElementById(id).value;
  const patch = { ...(state.overrides[poi.id] || {}) };
  patch.name = val("pe-name").trim() || poi.name;
  patch.blurb = val("pe-blurb").trim();
  patch.description = val("pe-desc").trim();
  patch.history = val("pe-history").trim();
  patch.facts = textToFacts(val("pe-facts"));
  patch.lodging = textToLodging(val("pe-lodging"));
  try {
    await Storage.savePlaceOverride(poi.id, patch);
    await refreshAfterEdit(poi, false);
    refreshHubIfOpen();
    toast("Ändringar sparade.");
  } catch (e) { toast("Kunde inte spara: " + e.message); }
}

function handlePlacePhoto(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file || !state.editingPlaceId) return;
  const poi = SEED_POIS.find((p) => p.id === state.editingPlaceId);
  if (!poi) return;
  toast("Förbereder foto…");
  compressImage(file).then(async (dataUrl) => {
    try {
      toast("Laddar upp foto…");
      const url = await Storage.uploadImage(dataUrl);
      await Storage.addPlaceImage(poi.id, url, null);
      await refreshAfterEdit(poi, true);
      refreshHubIfOpen();
      toast("Bild tillagd.");
    } catch (err) { toast("Kunde inte ladda upp: " + err.message); }
  }).catch(() => toast("Kunde inte läsa bilden."));
}

// Ladda om platsdata och uppdatera vyer efter en admin-ändring.
async function refreshAfterEdit(poi, keepEditOpen) {
  await loadPlaceData();
  const fresh = SEED_POIS.find((p) => p.id === poi.id) || poi;
  buildStartPage();
  if (document.getElementById("place-sheet").classList.contains("open"))
    openPlaceSheet(fresh, state.markers[fresh.id]);
  if (keepEditOpen) renderPlaceEdit(fresh);
}

// Spara kartrutorna för nuvarande vy i offline-cachen (service workern).
const lon2tileX = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2tileY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
async function downloadCurrentView() {
  const layer = state.currentBasemap;
  if (!layer || !layer.getTileUrl) return toast("Ingen karta att spara.");
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller)
    return toast("Offline-sparning fungerar i appen på mobilen, inte lokalt.");
  const b = state.map.getBounds();
  const zNow = Math.round(state.map.getZoom());
  const zMax = Math.min(layer.options.maxNativeZoom ?? layer.options.maxZoom ?? zNow, zNow + 2);
  const urls = [];
  for (let z = Math.max(zNow, MAP_MIN_ZOOM); z <= zMax; z++) {
    const x0 = lon2tileX(b.getWest(), z), x1 = lon2tileX(b.getEast(), z);
    const y0 = lat2tileY(b.getNorth(), z), y1 = lat2tileY(b.getSouth(), z);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) urls.push(layer.getTileUrl({ x, y, z }));
  }
  if (urls.length > 2500) return toast("Zooma in lite — då blir det lagom att spara.");
  toast(`Sparar ${urls.length} rutor offline…`);
  let done = 0, fail = 0;
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.all(urls.slice(i, i + 6).map((u) => fetch(u, { mode: "no-cors" }).catch(() => { fail++; })));
    done += Math.min(6, urls.length - i);
  }
  toast(fail ? `Sparade ${done - fail} av ${done} rutor offline.` : "Vyn sparad offline ✓");
}

// Slå på ett datalager (samma som att bocka i det i lagerpanelen).
function enableOverlay(key) {
  const cb = document.querySelector(`input[data-overlay="${key}"]`);
  if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event("change")); }
}

function setBasemap(key) {
  if (state.currentBasemap) state.map.removeLayer(state.currentBasemap);
  state.currentBasemap = BASEMAPS[key].layer().addTo(state.map);
  state.currentBasemap.bringToBack();
  document.querySelectorAll(".seg-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.key === key)
  );
}

// ===================================================================
//  Markörer
// ===================================================================
function markerIcon(cat) {
  const c = CATEGORIES[cat] || CATEGORIES.sevart;
  return L.divIcon({
    className: "poi-pin",
    html: pinHtml(cat, c.color),
    iconSize: [36, 46],
    iconAnchor: [18, 44],
  });
}

// Toppmarkör med höjdetikett direkt på kartan (triangel + meter).
function peakEle(poi) { const m = (poi.blurb || "").match(/\d+/); return m ? m[0] : ""; }
function peakIcon(poi) {
  return L.divIcon({
    className: "peak-marker",
    html: `<span class="peak-tri">▲</span><span class="peak-ele">${peakEle(poi)}</span>`,
    iconSize: [0, 0], iconAnchor: [7, 11],
  });
}

function addPoiMarker(poi) {
  const cat = poi.category in CATEGORIES ? poi.category : "sevart";
  const marker = L.marker(poi.coord, { icon: cat === "topp" ? peakIcon(poi) : markerIcon(cat) });
  marker.poi = poi;
  marker.on("click", () => openPlaceOrHub(poi, marker));
  (state.layers[cat] || state.layers.sevart).addLayer(marker);
  state.markers[poi.id] = marker;
  return marker;
}

function removeMarkerById(id) {
  const m = state.markers[id];
  if (!m) return;
  (state.layers[m.poi.category] || state.layers.sevart).removeLayer(m);
  delete state.markers[id];
}

// ===================================================================
//  Platskort (bottom sheet)
// ===================================================================
function openPlaceSheet(poi, marker) {
  const cat = CATEGORIES[poi.category] || CATEGORIES.sevart;
  const sheet = document.getElementById("place-sheet");
  const body = document.getElementById("place-body");

  const imgs = galleryFor(poi);
  const heroTag = (im) => escapeHtml(im.credit || im.caption || t("Foto: Kultsjödalen"));
  const header = imgs.length
    ? `<div class="ps-hero" id="ps-hero" style="background-image:url('${imgs[0].url}')">
         <span class="ps-hero-tag" id="ps-hero-tag">${heroTag(imgs[0])}</span>
       </div>
       ${imgs.length > 1
         ? `<div class="ps-gallery">${imgs.map((im, i) =>
             `<button class="ps-thumb${i === 0 ? " active" : ""}" data-idx="${i}" style="background-image:url('${im.url}')"></button>`).join("")}</div>`
         : ""}`
    : `<div class="ps-hero ps-hero-plain" style="--c:${cat.color}">
         <span class="ps-hero-glyph">${iconSvg(poi.category, "rgba(255,255,255,.9)", 46)}</span>
       </div>`;

  const facts = (poi.facts || [])
    .map(([k, v]) => `<div class="ps-fact"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`)
    .join("");

  const history = poi.history
    ? `<div class="ps-section"><h4>${t("Historia")}</h4><p>${escapeHtml(poi.history)}</p></div>`
    : "";

  const dist = state.meLatLng
    ? `<div class="ps-dist">📍 ${formatDist(state.map.distance(state.meLatLng, poi.coord))} ${t("härifrån")}</div>`
    : "";

  const uid = Storage.auth ? Storage.auth.userId() : null;
  const isOwner = poi.userAdded && uid && poi.user_id === uid;
  const community = poi.userAdded && Storage.mode === "supabase";

  const reactRow = community
    ? `<div class="ps-reactions" id="ps-reactions"></div>` : "";
  const ownerCtl = isOwner
    ? `<div class="ps-actions"><button class="ps-btn ps-btn-ghost" id="ps-edit">${t("Redigera")}</button>
         <button class="ps-btn ps-danger" id="ps-delete">${t("Ta bort")}</button></div>`
    : poi.userAdded && Storage.mode !== "supabase"
      ? `<button class="ps-del" id="ps-delete-local">${t("Ta bort tips")}</button>` : "";
  const reportBtn = community && !isOwner
    ? `<button class="ps-report" id="ps-report">${t("⚑ Rapportera")}</button>` : "";

  body.innerHTML = `
    ${header}
    <div class="ps-content">
      <div class="ps-cat" style="--c:${cat.color}">
        ${iconSvg(poi.category, cat.color, 15)} ${t(cat.label)}
      </div>
      <h2 class="ps-title">${escapeHtml(poi.name)}</h2>
      ${poi.blurb ? `<p class="ps-blurb">${escapeHtml(poi.blurb)}</p>` : ""}
      ${dist}
      <div class="ps-weather" id="ps-weather"><span class="ps-weather-load">${t("Hämtar väder…")}</span></div>
      ${reactRow}
      ${facts ? `<div class="ps-facts">${facts}</div>` : ""}
      ${poi.description ? `<div class="ps-section"><p>${escapeHtml(poi.description)}</p></div>` : ""}
      ${history}
      <div class="ps-actions">
        <button class="ps-btn" id="ps-directions">${t("🧭 Vägbeskrivning")}</button>
        <button class="ps-btn ps-btn-ghost" id="ps-center">${t("Visa på kartan")}</button>
      </div>
      ${ownerCtl}
      ${canAdminEdit(poi) ? `<button class="ps-btn ps-admin-edit" id="ps-place-edit">${t("✏️ Redigera plats")}</button>` : ""}
      ${community ? `<div class="ps-comments" id="ps-comments"></div>` : ""}
      ${poi.source ? `<div class="ps-src">${t("Källa")}: ${escapeHtml(poi.source)}</div>` : ""}
      ${LANG === "en" && (poi.description || poi.history || poi.blurb)
        ? `<div class="ps-src">${t("Platsbeskrivningar visas på svenska tills de översatts.")}</div>` : ""}
      ${reportBtn}
    </div>`;

  sheet.classList.add("open");

  // knappar
  document.getElementById("ps-directions").onclick = () => {
    const mode = ["topp", "led"].includes(poi.category) ? "walking" : "driving";
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${poi.coord[0]},${poi.coord[1]}&travelmode=${mode}`, "_blank");
  };
  document.getElementById("ps-center").onclick = () => {
    closePlaceSheet();
    showView("map");
    state.map.setView(poi.coord, Math.max(state.map.getZoom(), 13));
    if (marker) marker.openPopup?.();
  };
  const doDelete = async () => {
    if (!confirm(t("Ta bort det här tipset?"))) return;
    try {
      await Storage.deleteUserPoi(poi.id);
      removeMarkerById(poi.id);
      closePlaceSheet();
      toast("Tips borttaget.");
    } catch (e) { toast("Kunde inte ta bort: " + e.message); }
  };
  const delLocal = document.getElementById("ps-delete-local");
  if (delLocal) delLocal.onclick = doDelete;
  const delOwner = document.getElementById("ps-delete");
  if (delOwner) delOwner.onclick = doDelete;
  const editBtn = document.getElementById("ps-edit");
  if (editBtn) editBtn.onclick = () => startEditFlow(poi);
  const reportBtnEl = document.getElementById("ps-report");
  if (reportBtnEl) reportBtnEl.onclick = () => reportTip(poi.id);

  // Galleri-miniatyrer byter hero-bild
  const thumbs = [...document.querySelectorAll("#place-sheet .ps-thumb")];
  thumbs.forEach((tb) => tb.onclick = () => {
    const im = imgs[+tb.dataset.idx];
    document.getElementById("ps-hero").style.backgroundImage = `url('${im.url}')`;
    document.getElementById("ps-hero-tag").textContent = im.credit || im.caption || t("Foto: Kultsjödalen");
    thumbs.forEach((x) => x.classList.toggle("active", x === tb));
  });
  const placeEditBtn = document.getElementById("ps-place-edit");
  if (placeEditBtn) placeEditBtn.onclick = () => openPlaceEdit(poi);
  const heroEl = document.getElementById("ps-hero");
  if (heroEl) heroEl.onclick = () => openLightbox(bgUrl(heroEl));

  if (community) { loadReactions(poi.id); loadComments(poi.id); }

  // väder för platsen
  Weather.get(poi.coord[0], poi.coord[1])
    .then((w) => {
      const el = document.getElementById("ps-weather");
      if (el) el.innerHTML = weatherInner(w);
    })
    .catch(() => {
      const el = document.getElementById("ps-weather");
      if (el) el.remove();
    });
}

function closePlaceSheet() {
  document.getElementById("place-sheet").classList.remove("open");
}

function weatherInner(w) {
  return `
    <span class="ps-w-emoji">${w.emoji}</span>
    <span class="ps-w-temp">${w.temp}°</span>
    <span class="ps-w-meta">${escapeHtml(w.desc)} · ${w.wind} m/s${w.precip > 0 ? " · " + w.precip + " mm" : ""}</span>`;
}

function formatDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// ===================================================================
//  Kategori-chips, basemap, overlays
// ===================================================================
// ===================================================================
//  Startsida (Upptäck)
// ===================================================================
const VILLAGE_IDS = ["saxnas", "marsliden", "klimpfjall", "fatmomakke", "dikanas", "stalon", "ransarn"];

const QUICK_ACTIONS = [
  { label: "Utforska\nkartan", icon: "sevart", color: "#2f6fb0", run: () => showView("map") },
  { label: "Vandrings-\nleder", icon: "led", color: "#2f8f4e", run: () => { showView("map"); enableOverlay("leder"); } },
  { label: "Boende\n& mat", icon: "boende", color: "#e0872b", run: () => { showView("map"); enableOverlay("service"); } },
];

function placeCardHtml(poi) {
  const cat = CATEGORIES[poi.category] || CATEGORIES.sevart;
  const badge = `<span class="pc-badge">${iconSvg(poi.category, "#fff", 12)} ${t(cat.label)}</span>`;
  const heroUrl = (galleryFor(poi)[0] || {}).url;
  const hero = heroUrl
    ? `<div class="pc-hero" style="background-image:url('${heroUrl}')">${badge}</div>`
    : `<div class="pc-hero pc-hero-plain" style="--c:${cat.color}">
         <span class="pc-hero-glyph">${iconSvg(poi.category, "rgba(255,255,255,.92)", 34)}</span>${badge}
       </div>`;
  return `<button class="place-card" data-poi="${poi.id}">
      ${hero}
      <div class="pc-body">
        <div class="pc-name">${escapeHtml(poi.name)}</div>
        ${poi.blurb ? `<div class="pc-blurb">${escapeHtml(poi.blurb)}</div>` : ""}
      </div>
    </button>`;
}

function buildStartPage() {
  // Snabbknappar
  const quick = document.getElementById("start-quick");
  quick.innerHTML = QUICK_ACTIONS.map((a, i) =>
    `<button class="quick-btn" data-quick="${i}" style="--c:${a.color}">
       <span class="qb-ic">${iconSvg(a.icon, "currentColor", 22)}</span>
       <span>${escapeHtml(t(a.label)).replace(/\n/g, "<br>")}</span>
     </button>`).join("");
  quick.querySelectorAll("[data-quick]").forEach((b) =>
    b.addEventListener("click", () => QUICK_ACTIONS[+b.dataset.quick].run()));

  // Byar & platser
  const byId = Object.fromEntries(SEED_POIS.map((p) => [p.id, p]));
  const villages = VILLAGE_IDS.map((id) => byId[id]).filter(Boolean);
  const villageSet = new Set(VILLAGE_IDS);
  const sights = SEED_POIS.filter((p) => !villageSet.has(p.id));

  document.getElementById("start-villages").innerHTML = villages.map(placeCardHtml).join("");
  document.getElementById("start-sights").innerHTML = sights.map(placeCardHtml).join("");

  document.querySelectorAll("#view-start [data-poi]").forEach((el) =>
    el.addEventListener("click", () => {
      const poi = byId[el.dataset.poi];
      if (poi) openPlaceOrHub(poi, state.markers[poi.id]);
    }));

  applyStartHero();
}

// Startsidans bakgrund (admin kan byta). Lagras som vik_place_images med
// reserverat place_id "_startpage" — senaste synliga bilden används.
const START_BG_ID = "_startpage";
const SPLASH_BG_ID = "_splash";
function isAdminNow() { return !!(Storage.auth && Storage.auth.isAdmin && Storage.auth.isAdmin()); }

function applyStartHero() {
  const bg = document.querySelector("#view-start .start-hero-bg");
  const imgs = (state.placeImages[START_BG_ID] || []).filter((r) => !r.hidden);
  if (bg && imgs.length) bg.style.backgroundImage = `url('${imgs[imgs.length - 1].url}')`;
  const admin = isAdminNow();
  const b1 = document.getElementById("start-bg-btn");
  const b2 = document.getElementById("splash-bg-btn");
  if (b1) b1.hidden = !admin;
  if (b2) b2.hidden = !admin;
  applySplashBg();
}

function applySplashBg() {
  const bg = document.querySelector("#splash .splash-bg");
  const imgs = (state.placeImages[SPLASH_BG_ID] || []).filter((r) => !r.hidden);
  if (bg && imgs.length) bg.style.backgroundImage = `url('${imgs[imgs.length - 1].url}')`;
}

// Ladda upp bakgrund för startsidan (_startpage) eller välkomstbilden (_splash).
function handleBgPhoto(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (!(Storage.auth && Storage.auth.userId && Storage.auth.userId())) return toast("Logga in som admin.");
  const target = state.bgTarget || START_BG_ID;
  toast("Förbereder foto…");
  compressImage(file).then(async (dataUrl) => {
    try {
      toast("Laddar upp foto…");
      const url = await Storage.uploadImage(dataUrl);
      for (const r of (state.placeImages[target] || [])) {
        if (!r.hidden) { try { await Storage.setPlaceImageHidden(r.id, true); } catch {} }
      }
      await Storage.addPlaceImage(target, url, null);
      await loadPlaceData();
      applyStartHero();
      toast(target === SPLASH_BG_ID ? "Välkomstbilden uppdaterad." : "Startsidans bakgrund uppdaterad.");
    } catch (err) { toast("Kunde inte ladda upp: " + err.message); }
  }).catch(() => toast("Kunde inte läsa bilden."));
}

// ===================================================================
//  Byhub (helskärm per by)
// ===================================================================
function isVillage(poi) { return poi && VILLAGE_IDS.includes(poi.id); }
function openPlaceOrHub(poi, marker) {
  if (isVillage(poi)) openVillageHub(poi); else openPlaceSheet(poi, marker);
}
function distMeters(a, b) {
  try { return state.map.distance(L.latLng(a[0], a[1]), L.latLng(b[0], b[1])); }
  catch { return Infinity; }
}
function fmtDistShort(m) { return m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(1) + " km"; }

// Bildvisning i full storlek
function openLightbox(url) {
  if (!url) return;
  document.getElementById("lightbox-img").src = url;
  document.getElementById("lightbox").classList.add("open");
}
function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  document.getElementById("lightbox-img").removeAttribute("src");
}
function bgUrl(el) {
  const m = /url\(['"]?(.*?)['"]?\)/.exec((el && el.style.backgroundImage) || "");
  return m ? m[1] : null;
}

// Vilken by ligger närmast en koordinat? (så en plats hör till EN by)
function nearestVillageId(coord) {
  let best = null, bd = Infinity;
  for (const id of VILLAGE_IDS) {
    const v = SEED_POIS.find((p) => p.id === id);
    if (!v) continue;
    const d = distMeters(coord, v.coord);
    if (d < bd) { bd = d; best = id; }
  }
  return best;
}

function openVillageHub(poi) {
  state.hubVillageId = poi.id;
  renderVillageHub(poi);
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "village-hub"));
  document.getElementById("village-hub").scrollTop = 0;
}
function closeVillageHub() {
  document.getElementById("village-hub").classList.remove("active");
  document.getElementById("view-" + (document.body.dataset.view || "start"))?.classList.add("active");
  state.hubVillageId = null;
}
function refreshHubIfOpen() {
  if (state.hubVillageId && document.getElementById("village-hub").classList.contains("active")) {
    const poi = SEED_POIS.find((p) => p.id === state.hubVillageId);
    if (poi) renderVillageHub(poi);
  }
}

function renderVillageHub(poi) {
  const cat = CATEGORIES[poi.category] || CATEGORIES.sevart;
  const imgs = galleryFor(poi);
  const hero0 = imgs[0];
  const pool = [...SEED_POIS, ...(typeof PEAKS !== "undefined" ? PEAKS : [])];

  const todo = pool.filter((p) => p.id !== poi.id && !isVillage(p))
    .map((p) => ({ p, d: distMeters(poi.coord, p.coord) }))
    .filter((x) => nearestVillageId(x.p.coord) === poi.id && x.d <= 15000)
    .sort((a, b) => a.d - b.d).slice(0, 10);
  const services = (typeof SERVICES !== "undefined" ? SERVICES : [])
    .filter((s) => s.kind === "boende" || s.kind === "mat")
    .map((s) => ({ s, d: distMeters(poi.coord, [s.lat, s.lng]) }))
    .filter((x) => x.d <= 9000).sort((a, b) => a.d - b.d).slice(0, 6);
  const tips = Object.values(state.markers).map((m) => m.poi).filter((p) => p.userAdded)
    .map((p) => ({ p, d: distMeters(poi.coord, p.coord) }))
    .filter((x) => x.p.village_id === poi.id || (!x.p.village_id && x.d <= 9000))
    .sort((a, b) => a.d - b.d).slice(0, 8);

  const patch = state.overrides[poi.id] || {};
  const lodging = Array.isArray(patch.lodging) ? patch.lodging : [];
  const routes = collectVillageRoutes(poi);
  const loggedIn = !!(Storage.auth && Storage.auth.userId && Storage.auth.userId());

  const poiRow = ({ p, d }) => {
    const c = CATEGORIES[p.category] || CATEGORIES.sevart;
    return `<button class="vh-row" data-poi="${p.id}" style="--c:${c.color}">
      <span class="vh-row-ic">${iconSvg(p.category, "currentColor", 20)}</span>
      <span class="vh-row-main"><span class="vh-row-name">${escapeHtml(p.name)}</span>
        <span class="vh-row-sub">${escapeHtml(p.blurb || t(c.label))}</span></span>
      <span class="vh-row-dist">${fmtDistShort(d)}</span></button>`;
  };
  const svcRow = ({ s, d }) => `<button class="vh-row" data-svc="${encodeURIComponent(s.website || "")}" style="--c:#e0872b">
      <span class="vh-row-ic">${iconSvg(s.kind === "mat" ? "mat" : "boende", "currentColor", 20)}</span>
      <span class="vh-row-main"><span class="vh-row-name">${escapeHtml(s.name)}</span>
        <span class="vh-row-sub">${escapeHtml(SERVICE_SUB[s.sub] || s.kind)}</span></span>
      ${s.website ? `<span class="vh-row-link">${t("Boka ↗")}</span>` : `<span class="vh-row-dist">${fmtDistShort(d)}</span>`}</button>`;
  const lodgeRow = (l) => `<a class="vh-row" href="${l.url ? encodeURI(l.url) : "#"}" target="_blank" rel="noopener" style="--c:#e0872b; text-decoration:none;">
      <span class="vh-row-ic">${iconSvg("boende", "currentColor", 20)}</span>
      <span class="vh-row-main"><span class="vh-row-name">${escapeHtml(l.name || "Boende")}</span>
        ${l.note ? `<span class="vh-row-sub">${escapeHtml(l.note)}</span>` : ""}</span>
      ${l.url ? `<span class="vh-row-link">${t("Boka ↗")}</span>` : ""}</a>`;
  const routeRow = (r) => `<button class="vh-row" data-route="${r.key}" style="--c:#d1495b">
      <span class="vh-row-ic">${iconSvg("led", "currentColor", 20)}</span>
      <span class="vh-row-main"><span class="vh-row-name">${escapeHtml(r.name)}</span>
        <span class="vh-row-sub">${r.sub}${r.shared ? "" : " · " + t("på din enhet")}</span></span>
      <span class="vh-row-dist">GPX</span></button>`;

  const heroTag = hero0 ? escapeHtml(hero0.credit || hero0.caption || "") : "";
  const heroHtml = hero0
    ? `<header class="vh-hero" style="background-image:url('${hero0.url}')">
         <button class="vh-back" id="vh-back">${t("‹ Byar")}</button>
         ${heroTag ? `<span class="vh-credit">${heroTag}</span>` : ""}
         <div class="vh-hero-inner"><div class="vh-cat">${t(cat.label)}</div>
           <h1 class="vh-name">${escapeHtml(poi.name)}</h1>
           ${poi.blurb ? `<p class="vh-blurb">${escapeHtml(poi.blurb)}</p>` : ""}</div></header>`
    : `<header class="vh-hero vh-plain" style="--c:${cat.color}">
         <button class="vh-back" id="vh-back">${t("‹ Byar")}</button>
         <div class="vh-hero-inner"><div class="vh-cat">${t(cat.label)}</div>
           <h1 class="vh-name">${escapeHtml(poi.name)}</h1>
           ${poi.blurb ? `<p class="vh-blurb">${escapeHtml(poi.blurb)}</p>` : ""}</div></header>`;
  const thumbs = imgs.length > 1
    ? `<div class="vh-thumbs">${imgs.map((im, i) => `<button class="ps-thumb${i === 0 ? " active" : ""}" data-idx="${i}" style="background-image:url('${im.url}')"></button>`).join("")}</div>` : "";

  document.getElementById("vh-body").innerHTML = `
    ${heroHtml}${thumbs}
    <div class="vh-section">
      ${poi.description ? `<div class="vh-about"><p>${escapeHtml(poi.description)}</p>
        ${poi.history ? `<p class="vh-more" hidden>${escapeHtml(poi.history)}</p><button class="vh-readmore" id="vh-readmore">${t("Läs mer")}</button>` : ""}</div>` : ""}

      <div class="vh-sec-head"><h3>${t("Att göra här")}</h3><span>${todo.length ? todo.length + " " + t("platser") : ""}</span></div>
      ${todo.length ? todo.map(poiRow).join("") : `<p class="vh-empty">${t("Inga registrerade platser nära byn än.")}</p>`}

      <div class="vh-sec-head"><h3>${t("Bo & äta")}</h3></div>
      ${lodging.map(lodgeRow).join("")}
      ${services.length ? services.map(svcRow).join("") : (lodging.length ? "" : `<p class="vh-empty">${t("Inget boende registrerat nära byn än.")}</p>`)}

      <div class="vh-sec-head"><h3>${t("Turer från byn")}</h3></div>
      ${routes.length ? routes.map(routeRow).join("") : `<p class="vh-empty">${t("Inga turer från byn än.")}</p>`}
      <button class="vh-add vh-add-soft" id="vh-import-gpx">${iconSvg("led", "currentColor", 18)} ${t("Importera GPX-tur")}</button>

      <div class="vh-sec-head"><h3>${t("Från besökare")}</h3></div>
      ${tips.length ? tips.map(poiRow).join("") : `<p class="vh-empty">${t("Inga besökartips än — bli först!")}</p>`}
      <button class="vh-add" id="vh-add">${iconSvg("smultron", "#fff", 18)} ${t("Lägg till tips vid byn")}</button>
      ${loggedIn ? `<button class="vh-add vh-add-soft" id="vh-photo-btn">${iconSvg("sevart", "currentColor", 18)} ${t("Lägg till bild")}</button>` : ""}

      <div class="vh-sec-head"><h3>${t("På kartan")}</h3></div>
      <button class="vh-row" id="vh-map" style="--c:#2f6fb0">
        <span class="vh-row-ic">${iconSvg("sevart", "currentColor", 20)}</span>
        <span class="vh-row-main"><span class="vh-row-name">${t("Visa byn på kartan")}</span></span></button>
    </div>`;

  document.getElementById("vh-back").onclick = (e) => { e.stopPropagation(); closeVillageHub(); };
  if (hero0) {
    const vhHero = document.querySelector("#vh-body .vh-hero");
    if (vhHero) vhHero.onclick = () => openLightbox(bgUrl(vhHero));
  }
  const rm = document.getElementById("vh-readmore");
  if (rm) rm.onclick = () => { document.querySelector("#vh-body .vh-more").hidden = false; rm.remove(); };
  document.querySelectorAll("#vh-body [data-poi]").forEach((el) => el.onclick = () => {
    const p = pool.find((x) => x.id === el.dataset.poi)
      || Object.values(state.markers).map((m) => m.poi).find((x) => x.id === el.dataset.poi);
    if (p) openPlaceSheet(p, state.markers[p.id]);
  });
  document.querySelectorAll("#vh-body [data-svc]").forEach((el) => el.onclick = () => {
    const url = decodeURIComponent(el.dataset.svc);
    if (url) window.open(url, "_blank", "noopener");
  });
  document.getElementById("vh-add").onclick = () => villageAdd(poi);
  document.getElementById("vh-map").onclick = () => {
    closeVillageHub(); showView("map");
    state.map.setView(poi.coord, Math.max(state.map.getZoom(), 12));
  };
  document.querySelectorAll("#vh-body [data-route]").forEach((el) => el.onclick = () => {
    const r = routes.find((x) => x.key === el.dataset.route);
    if (r) showVillageRoute(r);
  });
  document.getElementById("vh-import-gpx").onclick = () => villageImportGpx(poi);
  const vhPhoto = document.getElementById("vh-photo-btn");
  if (vhPhoto) vhPhoto.onclick = () => { state.editingPlaceId = poi.id; document.getElementById("pe-photo").click(); };
  const thumbEls = [...document.querySelectorAll("#vh-body .ps-thumb")];
  thumbEls.forEach((tb) => tb.onclick = () => {
    const im = imgs[+tb.dataset.idx];
    document.querySelector("#vh-body .vh-hero").style.backgroundImage = `url('${im.url}')`;
    thumbEls.forEach((x) => x.classList.toggle("active", x === tb));
  });
}

function villageAdd(poi) {
  if (!requireLogin()) return;
  state.editingId = null;
  state.pendingCoord = [poi.coord[0], poi.coord[1]];
  state.pendingImage = null;
  setAddFormMode(false);
  document.getElementById("add-village").value = poi.id;
  document.getElementById("add-form").classList.add("open");
  toast("Tipset placeras vid byn. Du kan flytta det på kartan sen.");
}

// Samla turer nära byn: delade (Supabase) + lokala (denna enhet).
function collectVillageRoutes(poi) {
  const out = [];
  for (const r of state.sharedRoutes) {
    const start = r.start_lat != null ? [r.start_lat, r.start_lng] : null;
    const near = r.village_id === poi.id ||
      (!r.village_id && start && nearestVillageId(start) === poi.id && distMeters(poi.coord, start) <= 15000);
    if (!near) continue;
    out.push({ key: "s:" + r.id, name: r.name, shared: true, row: r,
      sub: (r.distance_km ? r.distance_km.toFixed(1) + " km" : "GPX") + (r.ascent ? " · ↑" + r.ascent + " m" : "") });
  }
  const local = (typeof Routes !== "undefined" ? Routes.list() : []);
  for (const lr of local) {
    const p0 = lr.points && lr.points[0];
    if (!p0 || nearestVillageId([p0.lat, p0.lng]) !== poi.id || distMeters(poi.coord, [p0.lat, p0.lng]) > 15000) continue;
    out.push({ key: "l:" + lr.id, name: lr.name, shared: false, row: lr,
      sub: (lr.stats ? lr.stats.distanceKm.toFixed(1) + " km" : "GPX") + (lr.stats && lr.stats.ascent ? " · ↑" + lr.stats.ascent + " m" : "") });
  }
  return out;
}

function showVillageRoute(r) {
  let route = r.row;
  if (r.shared) {
    route = Routes.parseGpx(r.row.gpx, r.row.name);
    route.stats = Routes.computeStats(route.points);
  }
  if (!route.points || !route.points.length) return toast("Turen saknar spårdata.");
  closeVillageHub();
  showView("map");
  if (state.routeLayer) state.map.removeLayer(state.routeLayer);
  state.routeLayer = L.polyline(route.points.map((p) => [p.lat, p.lng]),
    { color: "#d1495b", weight: 4, opacity: 0.95 }).addTo(state.map);
  state.map.fitBounds(state.routeLayer.getBounds(), { padding: [50, 50] });
  toast(route.name + (route.stats ? " · " + route.stats.distanceKm.toFixed(1) + " km" : ""));
}

function villageImportGpx(poi) {
  state.routeVillageId = poi.id;
  closeVillageHub();
  showView("map");
  document.getElementById("gpx-input").click();
}

async function shareRouteToVillage(route) {
  const vid = state.routeVillageId;
  if (!vid) return;
  try {
    const p0 = route.points[0];
    await Storage.addSharedRoute({
      village_id: vid, name: route.name, gpx: Routes.toGpx(route),
      start_lat: p0 ? p0.lat : null, start_lng: p0 ? p0.lng : null,
      distance_km: route.stats ? +route.stats.distanceKm.toFixed(2) : null,
      ascent: route.stats ? route.stats.ascent : null,
    });
    await loadPlaceData();
    state.routeVillageId = null;
    toast("Turen delad till byn!");
  } catch (e) { toast("Kunde inte dela: " + e.message); }
}

// ===================================================================
//  Info & fjällvett
// ===================================================================
function buildInfoPage() {
  const ic = (name) => `<span class="ic">${iconSvg(name, "currentColor", 18)}</span>`;
  document.getElementById("info-body").innerHTML =
    LANG === "en" ? infoPageEn(ic) : infoPageSv(ic);
}

function infoPageEn(ic) {
  return `
    <div class="info-card info-emergency">
      <h3>${ic("sevart")} In an emergency</h3>
      <p> Always call <b>112</b> in an accident or danger. Ask for <b>Mountain Rescue</b> (Fjällräddning). Give your position — you'll find coordinates on the place card in the map.</p>
      <a class="info-tel" href="tel:112">112</a>
      <p class="info-note">No signal? Move to higher ground or a road, try SMS, or ask someone else to call.</p>
    </div>

    <div class="info-card">
      <h3>${ic("led")} Getting here</h3>
      <ul>
        <li><b>Car:</b> The Wilderness Road (road 1067) runs through the valley — Vilhelmina–Saxnäs approx. 85 km (about 1 hr 15 min). The stretch over Stekenjokk is closed in winter, approx. 15 Oct–6 Jun.</li>
        <li><b>Air:</b> populAir flies South Lapland Airport (Vilhelmina) ↔ Stockholm Arlanda, Mon–Fri and Sundays; continue by car. <a href="https://www.populair.com/en/destinations/south-lapland-airport-vilhelmina/" target="_blank" rel="noopener">Flights & booking ↗</a></li>
        <li><b>Bus:</b> Regional buses to Vilhelmina and into the valley — timetables at <a href="https://tabussen.nu/" target="_blank" rel="noopener">tabussen.nu ↗</a></li>
      </ul>
    </div>

    <div class="info-card">
      <h3>${ic("boende")} Services in the valley</h3>
      <p>Accommodation, food, shops and fuel are marked on the map under the <b>Stay &amp; services</b> layer. The widest range is in Saxnäs. The nearest health centre and pharmacy are in Vilhelmina.</p>
      <p><b>Saxnäs recycling centre (ÅVC)</b> — Vilhelminavägen, approx. 1 km east of Saxnäs. Summer (1 Jun–21 Aug): Mon &amp; Wed 15:00–18:00, Fri 11:00–13:00. Hours vary off-season — <a href="https://www.vilhelmina.se/bygga-bo-och-miljo/avfall-och-atervinning/atervinningscentraler/" target="_blank" rel="noopener">check current hours ↗</a></p>
    </div>

    <div class="info-card">
      <h3>${ic("led")} Tours &amp; GPX — at your own risk</h3>
      <p>Trails, tour suggestions and GPX routes in the app are <b>tips, not guaranteed safe or up-to-date routes</b>. Weather, snow, ice and ground conditions change quickly in the mountains.</p>
      <p>You are responsible for your own trip: plan for your own ability, bring proper equipment and judge the conditions on site. If you follow someone else's route or suggestion, you do so entirely at your own risk.</p>
    </div>

    <div class="info-card">
      <h3>${ic("smultron")} Mountain sense &amp; right of public access</h3>
      <ul>
        <li>Take all your rubbish home — leave no trace.</li>
        <li>Light fires carefully and only where permitted; respect fire bans.</li>
        <li>Keep your dog leashed, especially during reindeer calving (spring–early summer).</li>
        <li>Show consideration for reindeer herding and Sami land — don't disturb reindeer.</li>
        <li>Tell someone where you're going and when you'll be back.</li>
        <li>Check the weather and avalanche situation before heading out. Conditions change fast.</li>
      </ul>
      <p>Read more at <a href="https://www.fjallsakerhetsradet.se/" target="_blank" rel="noopener">the Swedish Mountain Safety Council ↗</a> and <a href="https://www.naturvardsverket.se/en/" target="_blank" rel="noopener">the Environmental Protection Agency ↗</a>.</p>
    </div>

    <div class="info-card">
      <h3>${ic("fiske")} Fishing</h3>
      <p>A fishing permit is required in Lake Kultsjön, the Kultsjöån river and most mountain waters. The Kultsjöån is known for its Arctic char.</p>
    </div>

    <p class="info-foot">General mountain and safety information is based on the Swedish Mountain Safety Council and the Environmental Protection Agency.</p>`;
}

function infoPageSv(ic) {
  return `
    <div class="info-card info-emergency">
      <h3>${ic("sevart")} Vid nödläge</h3>
      <p> Larma alltid <b>112</b> vid olycka eller fara. Begär <b>Fjällräddning</b>. Uppge din position — koordinater hittar du på platskortet i kartan.</p>
      <a class="info-tel" href="tel:112">112</a>
      <p class="info-note">Har du ingen täckning: gå mot högre terräng eller väg, prova sms, eller be någon annan larma.</p>
    </div>

    <div class="info-card">
      <h3>${ic("led")} Hitta hit</h3>
      <ul>
        <li><b>Bil:</b> Vildmarksvägen (väg 1067) genom dalen — Vilhelmina–Saxnäs ca 85 km (dryg timme). Sträckan över Stekenjokk är vinterstängd ca 15 okt–6 jun.</li>
        <li><b>Flyg:</b> populAir flyger South Lapland Airport (Vilhelmina) ↔ Stockholm Arlanda, mån–fre samt söndag; därifrån bil vidare. <a href="https://www.populair.com/destinationer/vilhelmina/" target="_blank" rel="noopener">Tidtabell &amp; bokning ↗</a></li>
        <li><b>Buss:</b> Regionbuss till Vilhelmina och vidare in i dalen — tidtabeller på <a href="https://tabussen.nu/" target="_blank" rel="noopener">tabussen.nu ↗</a></li>
      </ul>
    </div>

    <div class="info-card">
      <h3>${ic("boende")} Service i dalen</h3>
      <p>Boende, mat, affär och drivmedel finns markerade i kartan under lagret <b>Boende &amp; service</b>. Störst utbud finns i Saxnäs. Närmaste vårdcentral och apotek finns i Vilhelmina.</p>
      <p><b>Saxnäs återvinningscentral (ÅVC)</b> — Vilhelminavägen, ca 1 km öster om Saxnäs. Sommar (1 jun–21 aug): mån &amp; ons 15.00–18.00, fre 11.00–13.00. Tiderna ändras under övrig tid på året — <a href="https://www.vilhelmina.se/bygga-bo-och-miljo/avfall-och-atervinning/atervinningscentraler/" target="_blank" rel="noopener">se aktuella tider ↗</a></p>
    </div>

    <div class="info-card">
      <h3>${ic("led")} Turer &amp; GPX — på egen risk</h3>
      <p>Leder, turförslag och GPX-rutter i appen är <b>tips — inte garanterat säkra eller uppdaterade leder</b>. Väder, snö, is och markförhållanden ändras snabbt i fjället.</p>
      <p>Du ansvarar själv för din tur: planera efter din egen förmåga, ta med rätt utrustning och bedöm förhållandena på plats. Följer du någon annans rutt eller förslag gör du det helt på eget ansvar.</p>
    </div>

    <div class="info-card">
      <h3>${ic("smultron")} Fjällvett &amp; allemansrätt</h3>
      <ul>
        <li>Ta med alla sopor hem — lämna inget efter dig.</li>
        <li>Elda försiktigt och bara där det är tillåtet; respektera eldningsförbud.</li>
        <li>Håll hunden kopplad, särskilt under renkalvningen (vår–försommar).</li>
        <li>Visa hänsyn till renskötsel och samisk mark — stör inte renar.</li>
        <li>Berätta för någon vart du går och när du är tillbaka.</li>
        <li>Kolla väder och lavinläge före fjällfärd. Vädret slår om snabbt.</li>
      </ul>
      <p>Läs mer hos <a href="https://www.fjallsakerhetsradet.se/" target="_blank" rel="noopener">Fjällsäkerhetsrådet ↗</a> och <a href="https://www.naturvardsverket.se/allemansratten" target="_blank" rel="noopener">Naturvårdsverket ↗</a>.</p>
    </div>

    <div class="info-card">
      <h3>${ic("fiske")} Fiske</h3>
      <p>Fiskekort krävs i Kultsjön, Kultsjöån och de flesta fjällvatten. Kultsjöån är känd för sitt rödingfiske.</p>
    </div>

    <p class="info-foot">Allmän fjäll- och säkerhetsinfo bygger på Fjällsäkerhetsrådet och Naturvårdsverket.</p>`;
}

// Kategorier som är avstängda som standard (opt-in via chipraden).
const DEFAULT_OFF_CATEGORIES = new Set();

// Toppar visas bara från denna zoomnivå (annars för rörigt utzoomat).
const PEAK_MIN_ZOOM = 11;
function updatePeakVisibility() {
  const layer = state.layers["topp"];
  if (!layer) return;
  const want = state.activeCategories.has("topp") && state.map.getZoom() >= PEAK_MIN_ZOOM;
  const on = state.map.hasLayer(layer);
  if (want && !on) layer.addTo(state.map);
  else if (!want && on) state.map.removeLayer(layer);
}

function buildCategoryChips() {
  const wrap = document.getElementById("category-chips");
  for (const [key, c] of Object.entries(CATEGORIES)) {
    const startOff = DEFAULT_OFF_CATEGORIES.has(key);
    if (startOff) {
      state.activeCategories.delete(key);
      state.map.removeLayer(state.layers[key]);
    }
    const chip = document.createElement("button");
    chip.className = "chip" + (startOff ? "" : " active");
    chip.style.setProperty("--chip-color", c.color);
    chip.innerHTML = `<span class="chip-ic">${iconSvg(key, "currentColor", 16)}</span>${t(c.label)}`;
    chip.addEventListener("click", () => {
      const on = chip.classList.toggle("active");
      if (on) { state.activeCategories.add(key); state.map.addLayer(state.layers[key]); }
      else { state.activeCategories.delete(key); state.map.removeLayer(state.layers[key]); }
      updatePeakVisibility();
    });
    wrap.appendChild(chip);
  }
}

function buildBasemapButtons() {
  const wrap = document.getElementById("basemap-buttons");
  for (const [key, b] of Object.entries(BASEMAPS)) {
    if (b.requiresToken && !CONFIG.LM_TOKEN) continue; // dölj tills token finns
    if (b.requiresLocal && !CONFIG.LOCAL_FJALL) continue; // dölj tills lokala rutor finns
    const btn = document.createElement("button");
    btn.className = "seg-btn" + (key === (CONFIG.LOCAL_FJALL ? "fjall" : "topo") ? " active" : "");
    btn.dataset.key = key;
    btn.textContent = t(b.label);
    btn.addEventListener("click", () => setBasemap(key));
    wrap.appendChild(btn);
  }
}

function buildOverlayToggles() {
  const wrap = document.getElementById("overlay-toggles");
  for (const [key, o] of Object.entries(OVERLAYS)) {
    const row = document.createElement("label");
    row.className = "overlay-row";
    row.innerHTML = `
      <span class="overlay-ic">${iconSvg(o.icon, "currentColor", 18)}</span>
      <span class="overlay-text">
        <span class="overlay-title">${t(o.label)}</span>
        <span class="overlay-sub">${t(o.sub)}</span>
      </span>
      <input type="checkbox" data-overlay="${key}" />`;
    row.querySelector("input").addEventListener("change", (e) => {
      const layer = state.overlays[key];
      if (e.target.checked) {
        layer.addTo(state.map);
        if (layer.bringToBack) layer.bringToBack();
        if (o.toast) toast(o.toast);
      } else {
        state.map.removeLayer(layer);
      }
    });
    wrap.appendChild(row);
  }
}

function fillCategorySelect() {
  const sel = document.getElementById("add-category");
  for (const [key, c] of Object.entries(CATEGORIES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = t(c.label);
    sel.appendChild(opt);
  }
}

// Ort-väljare i tips-formuläret (knyter tipset till en by).
function fillVillageSelect() {
  const sel = document.getElementById("add-village");
  if (!sel) return;
  const byId = Object.fromEntries(SEED_POIS.map((p) => [p.id, p]));
  sel.innerHTML = `<option value="">${t("Närmaste (automatiskt)")}</option>` +
    VILLAGE_IDS.map((id) => byId[id]
      ? `<option value="${id}">${escapeHtml(byId[id].name)}</option>` : "").join("");
}

// ===================================================================
//  Kontroller
// ===================================================================
function wireControls() {
  document.getElementById("btn-locate").addEventListener("click", locateMe);
  document.getElementById("btn-layers").addEventListener("click", () => togglePanel("panel-layers"));
  document.getElementById("btn-offline").addEventListener("click", downloadCurrentView);
  document.getElementById("btn-add").addEventListener("click", startAddFlow);
  document.getElementById("btn-gpx").addEventListener("click", openRoutesSheet);
  document.getElementById("gpx-input").addEventListener("change", importGpxFile);
  document.getElementById("routes-cancel").addEventListener("click", () => closeSheet("routes-sheet"));

  document.getElementById("add-cancel").addEventListener("click", closeAddForm);
  document.getElementById("add-save").addEventListener("click", saveNewPoi);
  document.getElementById("add-photo-btn").addEventListener("click", () =>
    document.getElementById("add-photo").click());
  document.getElementById("add-photo").addEventListener("change", handlePhotoPick);
  document.getElementById("add-photo-clear").addEventListener("click", clearPhoto);

  document.getElementById("place-close").addEventListener("click", closePlaceSheet);
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox" || e.target.id === "lightbox-close") closeLightbox();
  });
  document.getElementById("pe-cancel").addEventListener("click", () => closeSheet("place-edit"));
  document.getElementById("pe-photo").addEventListener("change", handlePlacePhoto);
  document.getElementById("sp-photo").addEventListener("change", handleBgPhoto);
  document.getElementById("start-bg-btn").addEventListener("click", () => { state.bgTarget = START_BG_ID; document.getElementById("sp-photo").click(); });
  document.getElementById("splash-bg-btn").addEventListener("click", () => { state.bgTarget = SPLASH_BG_ID; document.getElementById("sp-photo").click(); });

  document.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", () => togglePanel(el.dataset.close, false)));
}

function togglePanel(id, force) {
  const el = document.getElementById(id);
  const show = force === undefined ? !el.classList.contains("open") : force;
  el.classList.toggle("open", show);
}

// ===================================================================
//  Säsong (sommar / vinter)
// ===================================================================
function wireSeason() {
  const stored = localStorage.getItem("vik_season");
  const m = new Date().getMonth(); // 0–11
  state.season = stored || ([10, 11, 0, 1, 2, 3].includes(m) ? "winter" : "summer");
  document.querySelectorAll("#season-toggle .seg-btn").forEach((b) =>
    b.addEventListener("click", () => setSeason(b.dataset.season)));
  applySeason();
}
function setSeason(s) {
  state.season = s;
  localStorage.setItem("vik_season", s);
  applySeason();
  toast(s === "winter" ? "Vinterläge — skid/skoterleder & lavininfo." : "Sommarläge.");
}
function seasonMatch(poi) {
  const s = poi.season || "all";
  return s === "all" || s === state.season;
}
function applySeason() {
  document.querySelectorAll("#season-toggle .seg-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.season === state.season));
  const card = document.getElementById("winter-card");
  if (state.season === "winter") {
    if (!state.winterLayer) state.winterLayer = buildWinterLayer();
    if (!state.map.hasLayer(state.winterLayer)) state.winterLayer.addTo(state.map);
    state.winterLayer.bringToBack?.();
    if (card) card.hidden = false;
  } else {
    if (state.winterLayer && state.map.hasLayer(state.winterLayer)) state.map.removeLayer(state.winterLayer);
    if (card) card.hidden = true;
  }
  applySeasonToMarkers();
}
function applySeasonToMarkers() {
  for (const id in state.markers) {
    const m = state.markers[id];
    const layer = state.layers[m.poi.category];
    if (!layer) continue;
    const show = seasonMatch(m.poi);
    if (show && !layer.hasLayer(m)) layer.addLayer(m);
    if (!show && layer.hasLayer(m)) layer.removeLayer(m);
  }
}
function buildWinterLayer() {
  const g = L.layerGroup();
  if (typeof TRAILS !== "undefined")
    L.geoJSON(TRAILS, {
      filter: (f) => f.properties.route === "ski",
      style: { color: "#2f6fb0", weight: 3, dashArray: "4 6", opacity: 0.9 },
      onEachFeature: (f, l) => l.bindPopup(`<div class="mini-pop"><b>${escapeHtml(f.properties.name)}</b><br><span class="mini-sub">Skidled · OpenStreetMap</span></div>`),
    }).addTo(g);
  if (typeof SNOWMOBILE !== "undefined")
    L.geoJSON(SNOWMOBILE, {
      style: { color: "#7b4fb0", weight: 3, opacity: 0.9 },
      onEachFeature: (f, l) => l.bindPopup(`<div class="mini-pop"><b>${escapeHtml(f.properties.name)}</b><br><span class="mini-sub">Skoterled · OpenStreetMap</span></div>`),
    }).addTo(g);
  return g;
}

// ===================================================================
//  Väder-pill (kartans mitt)
// ===================================================================
function wireWeather() {
  updateWeatherPill();
  state.map.on("moveend", () => {
    clearTimeout(state.weatherTimer);
    state.weatherTimer = setTimeout(updateWeatherPill, 700);
  });
  document.getElementById("weather-pill").addEventListener("click", updateWeatherPill);
  const sw = document.getElementById("start-weather");
  if (sw) sw.addEventListener("click", updateWeatherPill);
}
async function updateWeatherPill() {
  const pill = document.getElementById("weather-pill");
  const c = state.map.getCenter();
  try {
    const w = await Weather.get(c.lat, c.lng);
    const html = `<span class="wp-emoji">${w.emoji}</span><span class="wp-temp">${w.temp}°</span>`;
    const title = `${w.desc} · ${w.wind} m/s (SMHI)`;
    [pill, document.getElementById("start-weather")].forEach((el) => {
      if (!el) return;
      el.innerHTML = html; el.title = title; el.classList.add("show");
    });
  } catch {
    pill.classList.remove("show");
  }
}

// ===================================================================
//  Konto / inloggning (magic link)
// ===================================================================
function openSheet(id) { document.getElementById(id).classList.add("open"); }
function closeSheet(id) { document.getElementById(id).classList.remove("open"); }

function wireAccount() {
  const btn = document.getElementById("btn-account");
  if (!Storage.auth || Storage.mode !== "supabase") {
    btn.style.display = "none";
    const tab = document.getElementById("tab-account");
    if (tab) tab.remove();
    return;
  }
  btn.addEventListener("click", openAccountSheet);
  document.getElementById("account-cancel").addEventListener("click", () => closeSheet("account-sheet"));
  document.getElementById("account-send").addEventListener("click", sendMagicLink);
  document.getElementById("account-google").addEventListener("click", async () => {
    try { await Storage.auth.signInWithGoogle(); }
    catch (e) { toast("Kunde inte starta Google-inloggning: " + e.message); }
  });
  document.getElementById("account-signout").addEventListener("click", async () => {
    await Storage.auth.signOut(); toast("Utloggad."); closeSheet("account-sheet");
  });
  document.getElementById("account-admin").addEventListener("click", openAdminSheet);
  document.getElementById("admin-cancel").addEventListener("click", () => closeSheet("admin-sheet"));
  Storage.auth.onChange(updateAccountUI);
}
function updateAccountUI(user) {
  document.getElementById("btn-account").classList.toggle("signed-in", !!user);
  const admin = isAdminNow();
  ["start-bg-btn", "splash-bg-btn"].forEach((id) => {
    const el = document.getElementById(id); if (el) el.hidden = !admin;
  });
  if (document.getElementById("account-sheet").classList.contains("open")) renderAccount(user);
}
function renderAccount(user) {
  document.getElementById("account-signedout").hidden = !!user;
  document.getElementById("account-signedin").hidden = !user;
  document.getElementById("account-title").textContent = t(user ? "Konto" : "Logga in");
  if (user) document.getElementById("account-who").textContent = user.email || "inloggad";
  document.getElementById("account-admin").hidden = !(user && Storage.auth.isAdmin && Storage.auth.isAdmin());
}

// ===================================================================
//  Moderering (admin)
// ===================================================================
async function openAdminSheet() {
  closeSheet("account-sheet");
  const body = document.getElementById("admin-body");
  body.innerHTML = `<p class="panel-hint">Laddar…</p>`;
  openSheet("admin-sheet");
  try {
    const [reports, flagged] = await Promise.all([Storage.adminReports(), Storage.adminFlagged()]);
    renderAdmin(reports, flagged);
  } catch (e) {
    body.innerHTML = `<p class="panel-hint">Kunde inte läsa moderationsdata: ${escapeHtml(e.message)}.<br>Har du kört <b>supabase/admin.sql</b>?</p>`;
  }
}

function renderAdmin(reports, flagged) {
  const body = document.getElementById("admin-body");
  const repHtml = reports.length
    ? reports.map((r) => {
        const t = r.tip || {};
        return `<div class="adm-row" data-tip="${t.id}" data-lat="${t.lat}" data-lng="${t.lng}">
          <div class="adm-main">
            <div class="adm-name">${escapeHtml(t.name || "(borttaget tips)")} ${t.status && t.status !== "visible" ? `<span class="adm-flag">${t.status}</span>` : ""}</div>
            <div class="adm-reason">⚑ ${escapeHtml(r.reason)}${r.note ? " — " + escapeHtml(r.note) : ""}</div>
          </div>
          <div class="adm-actions">
            ${t.id ? `<button data-act="hide" data-id="${t.id}">Dölj</button>
                      <button data-act="show" data-id="${t.id}">Visa</button>
                      <button data-act="del" data-id="${t.id}" class="adm-del">Radera</button>` : ""}
            <button data-act="resolve" data-rid="${r.id}">Klar</button>
          </div>
        </div>`;
      }).join("")
    : `<p class="panel-hint">Inga öppna rapporter. 👍</p>`;

  const flagHtml = flagged.length
    ? flagged.map((p) => `<div class="adm-row">
        <div class="adm-main"><div class="adm-name">${escapeHtml(p.name)} <span class="adm-flag">${p.status}</span></div></div>
        <div class="adm-actions">
          <button data-act="show" data-id="${p.id}">Återställ</button>
          <button data-act="del" data-id="${p.id}" class="adm-del">Radera</button>
        </div></div>`).join("")
    : `<p class="panel-hint">Inga dolda/flaggade tips.</p>`;

  body.innerHTML = `
    <h3 class="panel-subhead">Öppna rapporter</h3>${repHtml}
    <h3 class="panel-subhead">Dolda / flaggade</h3>${flagHtml}`;

  body.querySelectorAll("[data-act]").forEach((b) => b.onclick = async () => {
    const act = b.dataset.act;
    try {
      if (act === "hide") await Storage.adminSetStatus(b.dataset.id, "hidden");
      else if (act === "show") await Storage.adminSetStatus(b.dataset.id, "visible");
      else if (act === "del") { if (!confirm("Radera tipset permanent?")) return; await Storage.deleteUserPoi(b.dataset.id); removeMarkerById(b.dataset.id); }
      else if (act === "resolve") await Storage.adminResolve(b.dataset.rid);
      toast("Klart.");
      openAdminSheet();
    } catch (e) { toast("Fel: " + e.message); }
  });
}
function openAccountSheet() { renderAccount(Storage.auth.user()); openSheet("account-sheet"); }
async function sendMagicLink() {
  const email = document.getElementById("account-email").value.trim();
  if (!email || !email.includes("@")) return toast("Ange din e-post.");
  try { await Storage.auth.signIn(email); toast("Kolla mejlen — inloggningslänk skickad!"); }
  catch (e) { toast("Kunde inte skicka länk: " + e.message); }
}
function requireLogin() {
  if (Storage.mode === "supabase" && !Storage.auth.userId()) {
    toast("Logga in för att dela tips."); openAccountSheet(); return false;
  }
  return true;
}

// ===================================================================
//  Reaktioner & rapportering
// ===================================================================
async function loadReactions(tipId) {
  const el = document.getElementById("ps-reactions");
  if (!el) return;
  let rows = [];
  try { rows = await Storage.reactionsFor(tipId); } catch { return; }
  const uid = Storage.auth.userId();
  const kinds = [["been_here", "✓ Varit här"], ["favorite", "❤ Favorit"]];
  el.innerHTML = kinds.map(([k, label]) => {
    const count = rows.filter((r) => r.kind === k).length;
    const mine = uid && rows.some((r) => r.kind === k && r.user_id === uid);
    return `<button class="ps-react${mine ? " on" : ""}" data-k="${k}">${t(label)}${count ? ` <b>${count}</b>` : ""}</button>`;
  }).join("");
  el.querySelectorAll(".ps-react").forEach((btn) => {
    btn.onclick = async () => {
      if (!Storage.auth.userId()) { toast("Logga in för att reagera."); openAccountSheet(); return; }
      const k = btn.dataset.k, mine = btn.classList.contains("on");
      try { mine ? await Storage.unreact(tipId, k) : await Storage.react(tipId, k); loadReactions(tipId); }
      catch { toast("Kunde inte spara reaktion."); }
    };
  });
}
async function reportTip(tipId) {
  if (!Storage.auth.userId()) { toast("Logga in för att rapportera."); openAccountSheet(); return; }
  const reason = prompt(t("Varför rapporterar du?\n(t.ex. olämpligt, fel plats, personuppgifter, upphovsrätt)"));
  if (!reason) return;
  try { await Storage.report(tipId, reason.slice(0, 60), null); toast("Tack, rapporten är skickad."); }
  catch { toast("Kunde inte skicka rapport."); }
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }); }
  catch { return ""; }
}
async function loadComments(tipId) {
  const el = document.getElementById("ps-comments");
  if (!el) return;
  let rows = [];
  try { rows = await Storage.commentsFor(tipId); } catch { return; }
  const uid = Storage.auth.userId();
  const list = rows.map((c) => {
    const own = uid && c.user_id === uid;
    return `<div class="cm"><div class="cm-body">${escapeHtml(c.body)}</div>
      <div class="cm-meta">${own ? t("Du · ") : ""}${fmtDate(c.created_at)}${own ? ` · <button class="cm-del" data-del="${c.id}">${t("ta bort")}</button>` : ""}</div></div>`;
  }).join("");
  const composer = uid
    ? `<div class="cm-composer"><input id="cm-input" type="text" placeholder="${t("Skriv en kommentar…")}" maxlength="1000" />
         <button id="cm-send" class="btn-primary btn-secondary">${t("Skicka")}</button></div>`
    : `<button class="cm-login" id="cm-login">${t("Logga in för att kommentera")}</button>`;
  el.innerHTML = `<h4 class="cm-h">${t("Kommentarer")}${rows.length ? ` (${rows.length})` : ""}</h4>
    ${list || `<p class="cm-empty">${t("Inga kommentarer än — bli först!")}</p>`}${composer}`;
  el.querySelectorAll(".cm-del").forEach((b) => b.onclick = async () => {
    try { await Storage.deleteComment(b.dataset.del); loadComments(tipId); } catch { toast("Kunde inte ta bort."); }
  });
  const send = document.getElementById("cm-send");
  if (send) send.onclick = async () => {
    const inp = document.getElementById("cm-input"), body = inp.value.trim();
    if (!body) return;
    try { await Storage.addComment(tipId, body); inp.value = ""; loadComments(tipId); }
    catch { toast("Kunde inte spara kommentaren."); }
  };
  const login = document.getElementById("cm-login");
  if (login) login.onclick = openAccountSheet;
}

// ===================================================================
//  GPS
// ===================================================================
function locateMe() {
  if (!navigator.geolocation) return toast("GPS stöds inte i den här webbläsaren.");
  toast("Söker din position…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const ll = [latitude, longitude];
      state.meLatLng = L.latLng(latitude, longitude);
      if (state.meMarker) {
        state.meMarker.setLatLng(ll);
        state.meCircle.setLatLng(ll).setRadius(accuracy);
      } else {
        state.meMarker = L.circleMarker(ll, {
          radius: 8, color: "#fff", weight: 3, fillColor: "#1e6fd9", fillOpacity: 1,
        }).addTo(state.map);
        state.meCircle = L.circle(ll, {
          radius: accuracy, color: "#1e6fd9", weight: 1, fillOpacity: 0.1,
        }).addTo(state.map);
      }
      state.map.setView(ll, Math.max(state.map.getZoom(), 13));
    },
    () => toast("Kunde inte hämta position. Tillåt platsåtkomst."),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ===================================================================
//  Fornlämningar — klick-identifiering (WMS GetFeatureInfo)
// ===================================================================
function wireIdentify() {
  state.map.on("click", (e) => {
    if (state.pickingLocation) return;
    if (!state.map.hasLayer(state.overlays.fornlamningar)) return;
    identifyForn(e);
  });
}

async function identifyForn(e) {
  const size = state.map.getSize();
  const b = state.map.getBounds();
  const crs = state.map.options.crs;
  const sw = crs.project(b.getSouthWest());
  const ne = crs.project(b.getNorthEast());
  const params = new URLSearchParams({
    service: "WMS", version: "1.3.0", request: "GetFeatureInfo",
    layers: RAA_LAYERS, query_layers: RAA_LAYERS, crs: "EPSG:3857",
    bbox: `${sw.x},${sw.y},${ne.x},${ne.y}`,
    width: size.x, height: size.y,
    i: Math.round(e.containerPoint.x), j: Math.round(e.containerPoint.y),
    info_format: "application/json", feature_count: "8", buffer: "28",
  });
  toast("Söker lämning…");
  try {
    const res = await fetch(`${RAA_WMS}?${params}`);
    const data = await res.json();
    const feats = data.features || [];
    if (!feats.length) return toast("Ingen registrerad lämning just där — pröva att zooma in.");
    openFornSheet(feats);
  } catch {
    toast("Kunde inte nå Riksantikvarieämbetet.");
  }
}

function openFornSheet(features) {
  const sheet = document.getElementById("place-sheet");
  const body = document.getElementById("place-body");
  const cat = CATEGORIES.kultur;
  const items = features.map((f) => {
    const p = f.properties || {};
    const title = p.namn && p.namn !== "None" ? p.namn : p.lamningstyp || "Lämning";
    const rows = [
      ["Antikvarisk bedömning", p.antikvarisk_bedomning],
      ["Egenskap", p.egenskap],
      ["Lämningsnummer", p.lamningsnummer],
      ["RAÄ-nummer", p.raa_nummer],
    ].filter(([, v]) => v && v !== "None")
      .map(([k, v]) => `<div class="ps-fact"><span>${k}</span><b>${escapeHtml(v)}</b></div>`)
      .join("");
    const link = p.url
      ? `<a class="ps-btn ps-btn-ghost" href="${p.url}" target="_blank" rel="noopener">Öppna i Fornsök ↗</a>` : "";
    return `<div class="forn-block">
        <div class="ps-cat" style="--c:${cat.color}">${iconSvg("kultur", cat.color, 15)} ${escapeHtml(title)}</div>
        <div class="ps-facts">${rows}</div>${link}
      </div>`;
  }).join("");

  body.innerHTML = `
    <div class="ps-hero ps-hero-plain" style="--c:${cat.color}">
      <span class="ps-hero-glyph">${iconSvg("kultur", "rgba(255,255,255,.9)", 46)}</span>
    </div>
    <div class="ps-content">
      <div class="ps-cat" style="--c:${cat.color}">${t("Fornlämning")}</div>
      <h2 class="ps-title">${features.length > 1 ? features.length + " " + t("lämningar här") : t("Lämning")}</h2>
      ${items}
      <div class="ps-src">${t("Källa: Riksantikvarieämbetet (Fornsök)")}</div>
    </div>`;
  sheet.classList.add("open");
}

// ===================================================================
//  Lägg till eget tips
// ===================================================================
function startAddFlow() {
  if (!requireLogin()) return;
  state.editingId = null;
  state.pickingLocation = true;
  document.body.classList.add("picking");
  toast("Tryck på kartan där platsen ligger.");
  state.map.once("click", (e) => {
    state.pendingCoord = [e.latlng.lat, e.latlng.lng];
    state.pickingLocation = false;
    document.body.classList.remove("picking");
    setAddFormMode(false);
    document.getElementById("add-form").classList.add("open");
  });
}

function startEditFlow(poi) {
  state.editingId = poi.id;
  state.pendingCoord = poi.coord;
  clearPhoto();
  document.getElementById("add-name").value = poi.name;
  document.getElementById("add-desc").value = poi.description || "";
  document.getElementById("add-category").value = poi.category;
  document.getElementById("add-season").value = poi.season || "all";
  document.getElementById("add-village").value = poi.village_id || "";
  setAddFormMode(true);
  closePlaceSheet();
  document.getElementById("add-form").classList.add("open");
}

function setAddFormMode(editing) {
  document.querySelector("#add-form .panel-head h2").textContent = t(editing ? "Redigera tips" : "Nytt tips");
  document.getElementById("add-save").textContent = t(editing ? "Spara ändringar" : "Spara tips");
}

function closeAddForm() {
  document.getElementById("add-form").classList.remove("open");
  document.getElementById("add-name").value = "";
  document.getElementById("add-desc").value = "";
  document.getElementById("add-season").value = "all";
  document.getElementById("add-village").value = "";
  state.pendingCoord = null;
  state.editingId = null;
  setAddFormMode(false);
  clearPhoto();
}

function handlePhotoPick(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  toast("Förbereder foto…");
  compressImage(file)
    .then((dataUrl) => {
      state.pendingImage = dataUrl;
      document.getElementById("add-photo-img").src = dataUrl;
      document.getElementById("add-photo-preview").hidden = false;
      document.getElementById("add-photo-btn").textContent = t("📷 Byt foto");
    })
    .catch(() => toast("Kunde inte läsa bilden."));
}
function clearPhoto() {
  state.pendingImage = null;
  const prev = document.getElementById("add-photo-preview");
  if (prev) prev.hidden = true;
  const img = document.getElementById("add-photo-img");
  if (img) img.removeAttribute("src");
  const btn = document.getElementById("add-photo-btn");
  if (btn) btn.textContent = t("📷 Ta foto eller välj bild");
}
function compressImage(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objUrl);
      let out = canvas.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", quality);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("bild")); };
    img.src = objUrl;
  });
}

async function saveNewPoi() {
  const name = document.getElementById("add-name").value.trim();
  if (!name) return toast("Ge platsen ett namn.");
  const category = document.getElementById("add-category").value;
  const season = document.getElementById("add-season").value;
  const village_id = document.getElementById("add-village").value || null;
  const description = document.getElementById("add-desc").value.trim();
  try {
    let image;
    if (state.pendingImage) { toast("Laddar upp foto…"); image = await Storage.uploadImage(state.pendingImage); }

    if (state.editingId) {
      const patch = { name, category, description, season, village_id };
      if (image !== undefined) patch.image = image;
      const updated = await Storage.updateUserPoi(state.editingId, patch);
      removeMarkerById(state.editingId);
      addPoiMarker(updated);
      closeAddForm();
      toast("Ändringar sparade.");
      openPlaceSheet(updated);
      return;
    }

    const saved = await Storage.addUserPoi({
      name, category, description, season, village_id, image: image || "", coord: state.pendingCoord,
    });
    addPoiMarker(saved);
    refreshHubIfOpen();
    closeAddForm();
    toast(Storage.mode === "supabase" ? "Tips delat! Nu syns det för alla."
      : Storage.mode === "cloud" ? "Tips delat!" : "Tips sparat lokalt.");
    openPlaceSheet(saved);
  } catch (e) {
    toast("Kunde inte spara: " + (e.message || "fel"));
  }
}

// ===================================================================
//  Rutter (GPX-import, spara, höjdprofil, dela)
// ===================================================================
function openRoutesSheet() { renderRoutesList(); openSheet("routes-sheet"); }

function renderRoutesList() {
  const body = document.getElementById("routes-body");
  document.getElementById("routes-title").textContent = t("Rutter");
  const saved = Routes.list();
  const rows = saved.length
    ? saved.map((r) => `
        <button class="route-row" data-show="${r.id}">
          <span class="route-ic">🥾</span>
          <span class="route-meta">
            <span class="route-name">${escapeHtml(r.name)}</span>
            <span class="route-sub">${r.stats.distanceKm.toFixed(1)} km${r.stats.ascent ? " · ↑" + r.stats.ascent + " m" : ""}</span>
          </span>
        </button>`).join("")
    : `<p class="panel-hint">${t("Inga sparade rutter än. Importera en GPX-fil från din klocka eller telefon — t.ex. vägen upp på en topp.")}</p>`;

  body.innerHTML = `
    <button class="btn-primary" id="routes-import">${t("📥 Importera GPX-fil")}</button>
    <div class="routes-list">${rows}</div>
    <p class="panel-hint">${t("Turer och GPX-rutter är tips — färd sker på egen risk. Se Info & fjällvett.")}</p>`;
  document.getElementById("routes-import").onclick = () => document.getElementById("gpx-input").click();
  body.querySelectorAll("[data-show]").forEach((b) =>
    b.addEventListener("click", () => {
      const r = Routes.list().find((x) => x.id === b.dataset.show);
      if (r) showRoute(r, false);
    }));
}

function importGpxFile(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = Routes.parseGpx(ev.target.result, file.name.replace(/\.gpx$/i, ""));
      if (!parsed.points.length) return toast("Inga spårpunkter i filen.");
      parsed.stats = Routes.computeStats(parsed.points);
      showRoute(parsed, true);
    } catch { toast("Kunde inte läsa GPX-filen."); }
  };
  reader.readAsText(file);
}

function showRoute(route, unsaved) {
  if (state.routeLayer) state.map.removeLayer(state.routeLayer);
  state.routeLayer = L.polyline(route.points.map((p) => [p.lat, p.lng]),
    { color: "#d1495b", weight: 4, opacity: 0.95 }).addTo(state.map);
  state.map.fitBounds(state.routeLayer.getBounds(), { padding: [50, 50] });
  renderRouteDetail(route, unsaved);
  openSheet("routes-sheet");
}

function renderRouteDetail(route, unsaved) {
  const body = document.getElementById("routes-body");
  const s = route.stats;
  document.getElementById("routes-title").textContent = t("Rutt");
  const facts = [
    ["Längd", s.distanceKm.toFixed(1) + " km"],
    s.ascent ? ["Stigning", "↑ " + s.ascent + " m"] : null,
    s.descent ? ["Utför", "↓ " + s.descent + " m"] : null,
    s.maxEle != null ? ["Högsta", s.maxEle + " m"] : null,
  ].filter(Boolean).map(([k, v]) => `<div class="ps-fact"><span>${t(k)}</span><b>${v}</b></div>`).join("");
  const elev = s.hasElevation
    ? `<div class="ps-section"><h4>${t("Höjdprofil")}</h4>${Routes.elevationSvg(s.profile)}</div>` : "";

  body.innerHTML = `
    <button class="route-back" id="route-back">${t("‹ Alla rutter")}</button>
    <h2 class="ps-title">${escapeHtml(route.name)}</h2>
    <div class="ps-facts">${facts}</div>
    ${elev}
    <div class="ps-actions">
      ${unsaved
        ? `<button class="ps-btn" id="route-save">${t("Spara rutt")}</button>`
        : `<button class="ps-btn ps-danger" id="route-del">${t("Ta bort")}</button>`}
      <button class="ps-btn ps-btn-ghost" id="route-share">${t("Dela / exportera")}</button>
    </div>
    ${unsaved && state.routeVillageId && Storage.mode === "supabase" && Storage.auth.userId()
      ? `<button class="ps-btn" id="route-village-share" style="width:100%;margin-top:2px">${t("Dela till byn")}</button>` : ""}`;

  document.getElementById("route-back").onclick = renderRoutesList;
  document.getElementById("route-share").onclick = () => shareRoute(route);
  const rvs = document.getElementById("route-village-share");
  if (rvs) rvs.onclick = () => shareRouteToVillage(route);
  const saveBtn = document.getElementById("route-save");
  if (saveBtn) saveBtn.onclick = () => {
    const name = prompt(t("Namn på rutten:"), route.name) || route.name;
    Routes.save({ ...route, name });
    toast("Rutt sparad.");
    renderRoutesList();
  };
  const delBtn = document.getElementById("route-del");
  if (delBtn) delBtn.onclick = () => {
    if (!confirm("Ta bort rutten?")) return;
    Routes.remove(route.id);
    if (state.routeLayer) { state.map.removeLayer(state.routeLayer); state.routeLayer = null; }
    toast("Rutt borttagen.");
    renderRoutesList();
  };
}

async function shareRoute(route) {
  const gpx = Routes.toGpx(route);
  const file = new File([gpx], (route.name || "rutt").replace(/[^\w-]+/g, "_") + ".gpx",
    { type: "application/gpx+xml" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: route.name }); return; } catch {}
  }
  const url = URL.createObjectURL(new Blob([gpx], { type: "application/gpx+xml" }));
  const a = document.createElement("a");
  a.href = url; a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("GPX exporterad.");
}

// ===================================================================
//  Splash
// ===================================================================
function wireSplash() {
  const splash = document.getElementById("splash");
  const enter = document.getElementById("splash-enter");
  if (!splash) return;
  if (sessionStorage.getItem("vik_splash_seen")) { splash.remove(); return; }
  enter.addEventListener("click", () => {
    splash.classList.add("hide");
    sessionStorage.setItem("vik_splash_seen", "1");
    setTimeout(() => splash.remove(), 550);
  });
}

// ===================================================================
//  Hjälpare
// ===================================================================
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = t(msg);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (isLocal) {
    // Utveckling: ingen SW (undviker cache-strul). Rensa ev. gammal.
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  } else {
    // Produktion: installerbar PWA med offline-stöd.
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

init();
