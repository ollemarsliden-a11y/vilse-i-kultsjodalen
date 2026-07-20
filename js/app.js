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
        maxZoom: 19, attribution: "© OpenStreetMap",
      }),
  },
  topo: {
    label: "Terräng",
    layer: () =>
      L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxZoom: 17, attribution: "© OpenTopoMap (CC-BY-SA), © OpenStreetMap",
      }),
  },
  satellit: {
    label: "Satellit",
    layer: () =>
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "© Esri, Maxar, Earthstar Geographics" }
      ),
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
  service: {
    label: "Boende & service",
    icon: "boende",
    sub: "Hotell, stugor, camping, mat, affärer & mackar (OpenStreetMap)",
    toast: "Laddar boende & service…",
    create: () => buildServiceLayer(),
  },
  leder: {
    label: "Vandringsleder",
    icon: "led",
    sub: "Utmärkta leder från OpenStreetMap — tryck på en led för namn",
    toast: "Laddar vandringsleder…",
    create: () => buildTrailLayer(),
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
  gpxLayer: null,
  pickingLocation: false,
  pendingCoord: null,
  pendingImage: null,
  weatherTimer: null,
};

// ===================================================================
//  Init
// ===================================================================
async function init() {
  state.map = L.map("map", { zoomControl: false, attributionControl: false })
    .setView(MAP_CENTER, MAP_ZOOM);
  L.control.attribution({ position: "bottomleft", prefix: false }).addTo(state.map);
  L.control.zoom({ position: "bottomright" }).addTo(state.map);

  setBasemap("enkel");
  for (const key of Object.keys(CATEGORIES)) {
    state.layers[key] = L.layerGroup().addTo(state.map);
  }
  SEED_POIS.forEach(addPoiMarker);
  const userPois = await Storage.getUserPois();
  userPois.forEach(addPoiMarker);

  for (const key of Object.keys(OVERLAYS)) state.overlays[key] = OVERLAYS[key].create();

  buildCategoryChips();
  buildBasemapButtons();
  buildOverlayToggles();
  fillCategorySelect();
  wireControls();
  wireIdentify();
  wireSplash();
  wireWeather();
  wireAccount();
  registerServiceWorker();
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

function addPoiMarker(poi) {
  const cat = poi.category in CATEGORIES ? poi.category : "sevart";
  const marker = L.marker(poi.coord, { icon: markerIcon(cat) });
  marker.poi = poi;
  marker.on("click", () => openPlaceSheet(poi, marker));
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

  const header = poi.image
    ? `<div class="ps-hero" style="background-image:url('${poi.image}')">
         <span class="ps-hero-tag">${poi.ambiance ? "Stämningsbild" : "Foto: Kultsjödalen"}</span>
       </div>`
    : `<div class="ps-hero ps-hero-plain" style="--c:${cat.color}">
         <span class="ps-hero-glyph">${iconSvg(poi.category, "rgba(255,255,255,.9)", 46)}</span>
       </div>`;

  const facts = (poi.facts || [])
    .map(([k, v]) => `<div class="ps-fact"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`)
    .join("");

  const history = poi.history
    ? `<div class="ps-section"><h4>Historia</h4><p>${escapeHtml(poi.history)}</p></div>`
    : "";

  const dist = state.meLatLng
    ? `<div class="ps-dist">📍 ${formatDist(state.map.distance(state.meLatLng, poi.coord))} härifrån</div>`
    : "";

  const uid = Storage.auth ? Storage.auth.userId() : null;
  const isOwner = poi.userAdded && uid && poi.user_id === uid;
  const community = poi.userAdded && Storage.mode === "supabase";

  const reactRow = community
    ? `<div class="ps-reactions" id="ps-reactions"></div>` : "";
  const ownerCtl = isOwner
    ? `<div class="ps-actions"><button class="ps-btn ps-btn-ghost" id="ps-edit">Redigera</button>
         <button class="ps-btn ps-danger" id="ps-delete">Ta bort</button></div>`
    : poi.userAdded && Storage.mode !== "supabase"
      ? `<button class="ps-del" id="ps-delete-local">Ta bort tips</button>` : "";
  const reportBtn = community && !isOwner
    ? `<button class="ps-report" id="ps-report">⚑ Rapportera</button>` : "";

  body.innerHTML = `
    ${header}
    <div class="ps-content">
      <div class="ps-cat" style="--c:${cat.color}">
        ${iconSvg(poi.category, cat.color, 15)} ${cat.label}
      </div>
      <h2 class="ps-title">${escapeHtml(poi.name)}</h2>
      ${poi.blurb ? `<p class="ps-blurb">${escapeHtml(poi.blurb)}</p>` : ""}
      ${dist}
      <div class="ps-weather" id="ps-weather"><span class="ps-weather-load">Hämtar väder…</span></div>
      ${reactRow}
      ${facts ? `<div class="ps-facts">${facts}</div>` : ""}
      ${poi.description ? `<div class="ps-section"><p>${escapeHtml(poi.description)}</p></div>` : ""}
      ${history}
      <div class="ps-actions">
        <button class="ps-btn" id="ps-directions">🧭 Vägbeskrivning</button>
        <button class="ps-btn ps-btn-ghost" id="ps-center">Visa på kartan</button>
      </div>
      ${ownerCtl}
      ${poi.source ? `<div class="ps-src">Källa: ${escapeHtml(poi.source)}</div>` : ""}
      ${reportBtn}
    </div>`;

  sheet.classList.add("open");

  // knappar
  document.getElementById("ps-directions").onclick = () =>
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${poi.coord[0]},${poi.coord[1]}`, "_blank");
  document.getElementById("ps-center").onclick = () => {
    closePlaceSheet();
    state.map.setView(poi.coord, Math.max(state.map.getZoom(), 13));
    if (marker) marker.openPopup?.();
  };
  const doDelete = async () => {
    if (!confirm("Ta bort det här tipset?")) return;
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

  if (community) loadReactions(poi.id);

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
function buildCategoryChips() {
  const wrap = document.getElementById("category-chips");
  for (const [key, c] of Object.entries(CATEGORIES)) {
    const chip = document.createElement("button");
    chip.className = "chip active";
    chip.style.setProperty("--chip-color", c.color);
    chip.innerHTML = `<span class="chip-ic">${iconSvg(key, "currentColor", 16)}</span>${c.label}`;
    chip.addEventListener("click", () => {
      const on = chip.classList.toggle("active");
      if (on) { state.activeCategories.add(key); state.map.addLayer(state.layers[key]); }
      else { state.activeCategories.delete(key); state.map.removeLayer(state.layers[key]); }
    });
    wrap.appendChild(chip);
  }
}

function buildBasemapButtons() {
  const wrap = document.getElementById("basemap-buttons");
  for (const [key, b] of Object.entries(BASEMAPS)) {
    const btn = document.createElement("button");
    btn.className = "seg-btn" + (key === "enkel" ? " active" : "");
    btn.dataset.key = key;
    btn.textContent = b.label;
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
        <span class="overlay-title">${o.label}</span>
        <span class="overlay-sub">${o.sub}</span>
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
    opt.textContent = c.label;
    sel.appendChild(opt);
  }
}

// ===================================================================
//  Kontroller
// ===================================================================
function wireControls() {
  document.getElementById("btn-locate").addEventListener("click", locateMe);
  document.getElementById("btn-layers").addEventListener("click", () => togglePanel("panel-layers"));
  document.getElementById("btn-add").addEventListener("click", startAddFlow);
  document.getElementById("btn-gpx").addEventListener("click", () =>
    document.getElementById("gpx-input").click());
  document.getElementById("gpx-input").addEventListener("change", handleGpx);

  document.getElementById("add-cancel").addEventListener("click", closeAddForm);
  document.getElementById("add-save").addEventListener("click", saveNewPoi);
  document.getElementById("add-photo-btn").addEventListener("click", () =>
    document.getElementById("add-photo").click());
  document.getElementById("add-photo").addEventListener("change", handlePhotoPick);
  document.getElementById("add-photo-clear").addEventListener("click", clearPhoto);

  document.getElementById("place-close").addEventListener("click", closePlaceSheet);

  document.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", () => togglePanel(el.dataset.close, false)));
}

function togglePanel(id, force) {
  const el = document.getElementById(id);
  const show = force === undefined ? !el.classList.contains("open") : force;
  el.classList.toggle("open", show);
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
}
async function updateWeatherPill() {
  const pill = document.getElementById("weather-pill");
  const c = state.map.getCenter();
  try {
    const w = await Weather.get(c.lat, c.lng);
    pill.innerHTML = `<span class="wp-emoji">${w.emoji}</span><span class="wp-temp">${w.temp}°</span>`;
    pill.classList.add("show");
    pill.title = `${w.desc} · ${w.wind} m/s (SMHI)`;
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
  if (!Storage.auth || Storage.mode !== "supabase") { btn.style.display = "none"; return; }
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
  Storage.auth.onChange(updateAccountUI);
}
function updateAccountUI(user) {
  document.getElementById("btn-account").classList.toggle("signed-in", !!user);
  if (document.getElementById("account-sheet").classList.contains("open")) renderAccount(user);
}
function renderAccount(user) {
  document.getElementById("account-signedout").hidden = !!user;
  document.getElementById("account-signedin").hidden = !user;
  document.getElementById("account-title").textContent = user ? "Konto" : "Logga in";
  if (user) document.getElementById("account-who").textContent = user.email || "inloggad";
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
    return `<button class="ps-react${mine ? " on" : ""}" data-k="${k}">${label}${count ? ` <b>${count}</b>` : ""}</button>`;
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
  const reason = prompt("Varför rapporterar du?\n(t.ex. olämpligt, fel plats, personuppgifter, upphovsrätt)");
  if (!reason) return;
  try { await Storage.report(tipId, reason.slice(0, 60), null); toast("Tack, rapporten är skickad."); }
  catch { toast("Kunde inte skicka rapport."); }
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
      <div class="ps-cat" style="--c:${cat.color}">Fornlämning</div>
      <h2 class="ps-title">${features.length > 1 ? features.length + " lämningar här" : "Lämning"}</h2>
      ${items}
      <div class="ps-src">Källa: Riksantikvarieämbetet (Fornsök)</div>
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
  setAddFormMode(true);
  closePlaceSheet();
  document.getElementById("add-form").classList.add("open");
}

function setAddFormMode(editing) {
  document.querySelector("#add-form .panel-head h2").textContent = editing ? "Redigera tips" : "Nytt tips";
  document.getElementById("add-save").textContent = editing ? "Spara ändringar" : "Spara tips";
}

function closeAddForm() {
  document.getElementById("add-form").classList.remove("open");
  document.getElementById("add-name").value = "";
  document.getElementById("add-desc").value = "";
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
      document.getElementById("add-photo-btn").textContent = "📷 Byt foto";
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
  if (btn) btn.textContent = "📷 Ta foto eller välj bild";
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
  const description = document.getElementById("add-desc").value.trim();
  try {
    let image;
    if (state.pendingImage) { toast("Laddar upp foto…"); image = await Storage.uploadImage(state.pendingImage); }

    if (state.editingId) {
      const patch = { name, category, description };
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
      name, category, description, image: image || "", coord: state.pendingCoord,
    });
    addPoiMarker(saved);
    closeAddForm();
    toast(Storage.mode === "supabase" ? "Tips delat! Nu syns det för alla."
      : Storage.mode === "cloud" ? "Tips delat!" : "Tips sparat lokalt.");
    openPlaceSheet(saved);
  } catch (e) {
    toast("Kunde inte spara: " + (e.message || "fel"));
  }
}

// ===================================================================
//  GPX-import
// ===================================================================
function handleGpx(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { try { drawGpx(ev.target.result); } catch { toast("Kunde inte läsa GPX-filen."); } };
  reader.readAsText(file);
  e.target.value = "";
}
function drawGpx(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const pts = [...doc.getElementsByTagName("trkpt"), ...doc.getElementsByTagName("rtept")];
  if (!pts.length) return toast("Inga spårpunkter i filen.");
  const latlngs = pts.map((p) => [parseFloat(p.getAttribute("lat")), parseFloat(p.getAttribute("lon"))]);
  if (state.gpxLayer) state.map.removeLayer(state.gpxLayer);
  state.gpxLayer = L.polyline(latlngs, { color: "#d1495b", weight: 4, opacity: 0.9 }).addTo(state.map);
  state.map.fitBounds(state.gpxLayer.getBounds(), { padding: [40, 40] });
  toast(`Rutt inläst (${latlngs.length} punkter).`);
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
  el.textContent = msg;
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
