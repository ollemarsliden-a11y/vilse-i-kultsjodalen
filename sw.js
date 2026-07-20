// Service worker — offline-stöd för den publicerade appen (PWA).
// Registreras BARA i produktion (inte på localhost), så utveckling slipper
// cache-strul. Strategi: network-first — alltid färskt när man är online,
// annars senast cachade. Besökta resurser (app, kartrutor, bilder) cachas
// så appen fungerar även utan nät i fjället.
const CACHE = "vik-v4";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
];

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

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cacha lyckade svar (app-filer, kartrutor, bilder) för offline.
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
