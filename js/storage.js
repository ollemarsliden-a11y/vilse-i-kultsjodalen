// ===================================================================
//  Lagringslager — utbytbart (lokalt <-> moln)
// ===================================================================
//  Väljer automatiskt läge utifrån CONFIG.API_BASE (js/config.js):
//    tom sträng  -> LocalStorage (bara den egna enheten)
//    en URL      -> CloudStorage (delade tips via REST-API)
//
//  Molnläget cachar också svaren lokalt, så appen fungerar offline och
//  faller tillbaka till senast kända data om nätet är nere.
// ===================================================================

const Storage = (() => {
  const KEY = "vik_user_pois_v1";
  const API =
    typeof CONFIG !== "undefined" && CONFIG.API_BASE
      ? CONFIG.API_BASE.replace(/\/$/, "")
      : "";

  function localRead() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }
  function localWrite(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  // ---- Lokalt läge -------------------------------------------------
  const local = {
    mode: "local",
    async getUserPois() {
      return localRead();
    },
    async addUserPoi(poi) {
      const saved = {
        ...poi,
        id: "user-" + Date.now(),
        userAdded: true,
        createdAt: new Date().toISOString(),
      };
      const list = localRead();
      list.push(saved);
      localWrite(list);
      return saved;
    },
    async deleteUserPoi(id) {
      localWrite(localRead().filter((p) => p.id !== id));
    },
    // Lokalt läge: bilden bäddas in som data-URL direkt i tipset.
    async uploadImage(dataUrl) {
      return dataUrl;
    },
  };

  // ---- Molnläge (delat) -------------------------------------------
  const cloud = {
    mode: "cloud",
    async getUserPois() {
      try {
        const res = await fetch(`${API}/api/pois`);
        if (!res.ok) throw new Error(res.status);
        const list = await res.json();
        localWrite(list); // cacha för offline
        return list;
      } catch {
        return localRead(); // offline-fallback
      }
    },
    async addUserPoi(poi) {
      const res = await fetch(`${API}/api/pois`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poi),
      });
      if (!res.ok) throw new Error("Kunde inte spara till molnet");
      const saved = await res.json();
      const list = localRead();
      list.push(saved);
      localWrite(list);
      return saved;
    },
    async deleteUserPoi(id) {
      try {
        await fetch(`${API}/api/pois/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch {
        /* tas ändå bort lokalt nedan */
      }
      localWrite(localRead().filter((p) => p.id !== id));
    },
    // Molnläge: ladda upp bilden och få en delbar URL tillbaka.
    async uploadImage(dataUrl) {
      const res = await fetch(`${API}/api/uploads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataUrl }),
      });
      if (!res.ok) throw new Error("Bilduppladdning misslyckades");
      const { url } = await res.json();
      return API + url; // absolut URL så bilden kan visas
    },
  };

  return API ? cloud : local;
})();
