// Service worker — offline-stöd för den publicerade appen (PWA).
// Registreras BARA i produktion (inte på localhost), så utveckling slipper
// cache-strul.
//
// Strategi:
//  - Fjällkart-rutor (tiles/topo/) + bilder (images/) = CACHE-FIRST. De ändras
//    aldrig, så vi serverar dem direkt från cachen och hämtar bara det som
//    saknas. Då fungerar kartan även UTAN TÄCKNING i fjället, och sparar data.
//    Rutorna cachas allteftersom man tittar på områden (inte alla på en gång).
//  - Allt annat = NETWORK-FIRST: alltid färskt online, cachad fallback offline.
const CACHE = "vik-v5";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
];

// Immutabla resurser som ska serveras cache-first.
function isCacheFirst(url) {
  return url.includes("/tiles/topo/") || url.includes("/images/");
}

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && (res.ok || res.type === "opaque")) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
  }
  return res;
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === "opaque")) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = e.request.url;
  e.respondWith(isCacheFirst(url) ? cacheFirst(e.request) : networkFirst(e.request));
});
