// ===================================================================
//  Lagringslager — Supabase (community) med lokal fallback
// ===================================================================
//  Läge väljs automatiskt:
//    supabase  – om SUPABASE_URL + biblioteket finns  (delade tips + konton)
//    cloud     – om CONFIG.API_BASE är satt            (gamla Node-backenden)
//    local     – annars                                (bara egna enheten)
// ===================================================================

const Storage = (() => {
  const KEY = "vik_user_pois_v1";
  const hasSupabase =
    typeof window !== "undefined" && window.supabase &&
    CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY;

  // ---------- Hjälpare ----------
  function localRead() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function localWrite(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(",");
    const mime = (meta.match(/data:(.*?);/) || [, "image/webp"])[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function rowToPoi(r) {
    return {
      id: r.id, name: r.name, category: r.category, description: r.description || "",
      image: r.image_url || "", coord: [r.lat, r.lng], season: r.season || "all",
      village_id: r.village_id || null,
      user_id: r.user_id, userAdded: true, createdAt: r.created_at, status: r.status,
    };
  }

  // =================================================================
  //  SUPABASE-läge
  // =================================================================
  if (hasSupabase) {
    const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    let currentUser = null;
    const listeners = [];

    sb.auth.getSession().then(({ data }) => {
      currentUser = data.session?.user || null;
      listeners.forEach((cb) => cb(currentUser));
    });
    sb.auth.onAuthStateChange((_e, session) => {
      currentUser = session?.user || null;
      listeners.forEach((cb) => cb(currentUser));
    });

    return {
      mode: "supabase",
      sb,
      auth: {
        user: () => currentUser,
        userId: () => currentUser?.id || null,
        email: () => currentUser?.email || null,
        onChange(cb) { listeners.push(cb); cb(currentUser); },
        async signIn(email) {
          const redirect = location.href.split("#")[0];
          const { error } = await sb.auth.signInWithOtp({
            email, options: { emailRedirectTo: redirect },
          });
          if (error) throw error;
        },
        async signInWithGoogle() {
          const redirect = location.href.split("#")[0];
          const { error } = await sb.auth.signInWithOAuth({
            provider: "google", options: { redirectTo: redirect },
          });
          if (error) throw error;
        },
        async signOut() { await sb.auth.signOut(); },
        isAdmin: () => !!currentUser &&
          (CONFIG.ADMIN_EMAILS || []).includes(currentUser.email),
      },

      async getUserPois() {
        const { data, error } = await sb
          .from("vik_tips")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) { console.warn("Supabase läsning:", error.message); return []; }
        return (data || []).map(rowToPoi);
      },

      async addUserPoi(poi) {
        if (!currentUser) throw new Error("Inte inloggad");
        const { data, error } = await sb.from("vik_tips").insert({
          user_id: currentUser.id, name: poi.name, category: poi.category,
          description: poi.description || null, lat: poi.coord[0], lng: poi.coord[1],
          image_url: poi.image || null, season: poi.season || "all",
          village_id: poi.village_id || null,
        }).select().single();
        if (error) throw error;
        return rowToPoi(data);
      },

      async updateUserPoi(id, patch) {
        const upd = {};
        if (patch.name != null) upd.name = patch.name;
        if (patch.category != null) upd.category = patch.category;
        if (patch.description != null) upd.description = patch.description;
        if (patch.image != null) upd.image_url = patch.image;
        if (patch.season != null) upd.season = patch.season;
        if (patch.village_id !== undefined) upd.village_id = patch.village_id;
        upd.edited_at = new Date().toISOString();
        const { data, error } = await sb.from("vik_tips").update(upd).eq("id", id).select().single();
        if (error) throw error;
        return rowToPoi(data);
      },

      async deleteUserPoi(id) {
        const { error } = await sb.from("vik_tips").delete().eq("id", id);
        if (error) throw error;
      },

      async uploadImage(dataUrl) {
        if (!currentUser) throw new Error("Inte inloggad");
        const blob = dataUrlToBlob(dataUrl);
        const ext = blob.type.includes("jpeg") ? "jpg" : "webp";
        const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await sb.storage.from("vik-photos").upload(path, blob, {
          contentType: blob.type, upsert: false,
        });
        if (error) throw error;
        return sb.storage.from("vik-photos").getPublicUrl(path).data.publicUrl;
      },

      // Reaktioner
      async react(tipId, kind) {
        if (!currentUser) throw new Error("Inte inloggad");
        return sb.from("vik_reactions").insert({ tip_id: tipId, user_id: currentUser.id, kind });
      },
      async unreact(tipId, kind) {
        return sb.from("vik_reactions").delete()
          .eq("tip_id", tipId).eq("user_id", currentUser.id).eq("kind", kind);
      },
      async reactionsFor(tipId) {
        const { data } = await sb.from("vik_reactions").select("kind,user_id").eq("tip_id", tipId);
        return data || [];
      },

      // Kommentarer
      async commentsFor(tipId) {
        const { data } = await sb.from("vik_comments")
          .select("id,body,user_id,created_at").eq("tip_id", tipId)
          .order("created_at", { ascending: true });
        return data || [];
      },
      async addComment(tipId, body) {
        if (!currentUser) throw new Error("Inte inloggad");
        const { data, error } = await sb.from("vik_comments")
          .insert({ tip_id: tipId, user_id: currentUser.id, body }).select().single();
        if (error) throw error;
        return data;
      },
      async deleteComment(id) {
        const { error } = await sb.from("vik_comments").delete().eq("id", id);
        if (error) throw error;
      },

      // Rapportering
      async report(tipId, reason, note) {
        if (!currentUser) throw new Error("Inte inloggad");
        return sb.from("vik_reports").insert({
          tip_id: tipId, reporter_id: currentUser.id, reason, note: note || null,
        });
      },

      // Moderering (kräver admin.sql + admin-e-post)
      async adminReports() {
        const { data, error } = await sb.from("vik_reports")
          .select("id,reason,note,created_at,resolved,tip:vik_tips(id,name,status,category,lat,lng)")
          .eq("resolved", false).order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async adminFlagged() {
        const { data, error } = await sb.from("vik_tips").select("*")
          .neq("status", "visible").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(rowToPoi);
      },
      async adminSetStatus(tipId, status) {
        const { error } = await sb.from("vik_tips").update({ status }).eq("id", tipId);
        if (error) throw error;
      },
      async adminResolve(reportId) {
        const { error } = await sb.from("vik_reports").update({ resolved: true }).eq("id", reportId);
        if (error) throw error;
      },

      // -------- Admin-redigering av inbyggda platser (byar/sevärt) --------
      // Textändringar per plats (patch = ändrade fält). Kräver places.sql.
      async getPlaceOverrides() {
        const { data, error } = await sb.from("vik_place_overrides").select("place_id,patch");
        if (error) { console.warn("place_overrides:", error.message); return []; }
        return data || [];
      },
      async savePlaceOverride(placeId, patch) {
        if (!currentUser) throw new Error("Inte inloggad");
        const { data, error } = await sb.from("vik_place_overrides")
          .upsert({ place_id: placeId, patch, updated_at: new Date().toISOString(), updated_by: currentUser.id })
          .select().single();
        if (error) throw error;
        return data;
      },
      // Bildgalleri per plats.
      async getPlaceImages() {
        const { data, error } = await sb.from("vik_place_images")
          .select("id,place_id,url,caption,sort,hidden")
          .order("sort", { ascending: true }).order("created_at", { ascending: true });
        if (error) { console.warn("place_images:", error.message); return []; }
        return data || [];
      },
      async addPlaceImage(placeId, url, caption) {
        if (!currentUser) throw new Error("Inte inloggad");
        const { data, error } = await sb.from("vik_place_images")
          .insert({ place_id: placeId, url, caption: caption || null, created_by: currentUser.id })
          .select().single();
        if (error) throw error;
        return data;
      },
      async setPlaceImageHidden(id, hidden) {
        const { error } = await sb.from("vik_place_images").update({ hidden }).eq("id", id);
        if (error) throw error;
      },
      async deletePlaceImage(id) {
        const { error } = await sb.from("vik_place_images").delete().eq("id", id);
        if (error) throw error;
      },

      // -------- Delade GPX-turer (vik_routes) --------
      async getSharedRoutes() {
        const { data, error } = await sb.from("vik_routes")
          .select("id,village_id,name,gpx,start_lat,start_lng,distance_km,ascent,user_id")
          .order("created_at", { ascending: false });
        if (error) { console.warn("vik_routes:", error.message); return []; }
        return data || [];
      },
      async addSharedRoute(r) {
        if (!currentUser) throw new Error("Inte inloggad");
        const { data, error } = await sb.from("vik_routes").insert({
          user_id: currentUser.id, village_id: r.village_id || null, name: r.name,
          gpx: r.gpx, start_lat: r.start_lat, start_lng: r.start_lng,
          distance_km: r.distance_km, ascent: r.ascent,
        }).select().single();
        if (error) throw error;
        return data;
      },
      async deleteSharedRoute(id) {
        const { error } = await sb.from("vik_routes").delete().eq("id", id);
        if (error) throw error;
      },
    };
  }

  // =================================================================
  //  Fallback: lokalt läge (och gamla Node-backenden om API_BASE satt)
  // =================================================================
  const API = CONFIG.API_BASE ? CONFIG.API_BASE.replace(/\/$/, "") : "";
  const noAuth = { user: () => null, userId: () => null, email: () => null,
    onChange(cb) { cb(null); }, async signIn() { throw new Error("Ingen inloggning i lokalt läge"); },
    async signOut() {} };

  if (API) {
    return {
      mode: "cloud", auth: noAuth,
      async getUserPois() {
        try { const r = await fetch(`${API}/api/pois`); if (!r.ok) throw 0;
          const l = await r.json(); localWrite(l); return l; } catch { return localRead(); }
      },
      async addUserPoi(poi) {
        const r = await fetch(`${API}/api/pois`, { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(poi) });
        if (!r.ok) throw new Error("moln");
        const saved = await r.json(); const l = localRead(); l.push(saved); localWrite(l); return saved;
      },
      async deleteUserPoi(id) {
        try { await fetch(`${API}/api/pois/${encodeURIComponent(id)}`, { method: "DELETE" }); } catch {}
        localWrite(localRead().filter((p) => p.id !== id));
      },
      async uploadImage(dataUrl) {
        const r = await fetch(`${API}/api/uploads`, { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: dataUrl }) });
        if (!r.ok) throw new Error("upload"); return API + (await r.json()).url;
      },
    };
  }

  return {
    mode: "local", auth: noAuth,
    async getUserPois() { return localRead(); },
    async addUserPoi(poi) {
      const saved = { ...poi, id: "user-" + Date.now(), userAdded: true, createdAt: new Date().toISOString() };
      const l = localRead(); l.push(saved); localWrite(l); return saved;
    },
    async deleteUserPoi(id) { localWrite(localRead().filter((p) => p.id !== id)); },
    async uploadImage(dataUrl) { return dataUrl; },
  };
})();
