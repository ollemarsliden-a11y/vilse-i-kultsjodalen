// ===================================================================
//  Vägstatus — Vildmarksvägen över Stekenjokk (väg 1067)
// ===================================================================
//  Två nivåer:
//  1. Säsongsbaserad status (alltid tillgänglig): vintersstängd
//     ca 15 okt – 6 jun, enligt Trafikverkets normala tider.
//  2. Live-läge via Trafikverkets öppna API om CONFIG.TRV_KEY är satt
//     (gratis nyckel: https://data.trafikverket.se/ → registrera →
//     skapa API-nyckel, klistra in i js/config.js). Då hämtas aktuella
//     trafikmeddelanden (avstängningar m.m.) för väg 1067.
// ===================================================================

const RoadStatus = (() => {
  const TRV_URL = "https://api.trafikinfo.trafikverket.se/v2/data.json";
  const CACHE_KEY = "vik_road_status";
  const CACHE_TTL = 15 * 60 * 1000;

  // Normala datum för Stekenjokk-passagen (kan variera något år till år).
  function seasonal(now = new Date()) {
    const y = now.getFullYear();
    const opens = new Date(y, 5, 6);    // 6 juni
    const closes = new Date(y, 9, 15);  // 15 oktober
    const open = now >= opens && now < closes;
    return {
      open,
      live: false,
      label: open ? t("Stekenjokk: öppen") : t("Stekenjokk: vinterstängd"),
      detail: open
        ? t("Vildmarksvägen över Stekenjokk är öppen (stänger ca 15 okt).")
        : t("Vildmarksvägen över Stekenjokk är vinterstängd (öppnar ca 6 jun)."),
    };
  }

  async function live() {
    const key = (typeof CONFIG !== "undefined" && CONFIG.TRV_KEY) || "";
    if (!key) return null;
    try {
      const hit = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (hit && Date.now() - hit.time < CACHE_TTL) return hit.data;
    } catch {}
    const query = `<REQUEST>
      <LOGIN authenticationkey="${key}"/>
      <QUERY objecttype="Situation" schemaversion="1.5" limit="20">
        <FILTER>
          <ELEMENTMATCH>
            <EQ name="Deviation.RoadNumber" value="Väg 1067"/>
            <EQ name="Deviation.CountyNo" value="24"/>
          </ELEMENTMATCH>
        </FILTER>
        <INCLUDE>Deviation.Message</INCLUDE>
        <INCLUDE>Deviation.MessageType</INCLUDE>
        <INCLUDE>Deviation.SeverityText</INCLUDE>
        <INCLUDE>Deviation.StartTime</INCLUDE>
        <INCLUDE>Deviation.EndTime</INCLUDE>
      </QUERY>
    </REQUEST>`;
    const res = await fetch(TRV_URL, { method: "POST", headers: { "Content-Type": "text/xml" }, body: query });
    if (!res.ok) throw new Error("TRV " + res.status);
    const json = await res.json();
    const situations = (((json.RESPONSE || {}).RESULT || [])[0] || {}).Situation || [];
    const now = Date.now();
    const devs = situations.flatMap((s) => s.Deviation || []).filter((d) => {
      const start = d.StartTime ? new Date(d.StartTime).getTime() : 0;
      const end = d.EndTime ? new Date(d.EndTime).getTime() : Infinity;
      return start <= now && now <= end;
    });
    const closed = devs.some((d) => /avstängd|stängd|closed/i.test((d.Message || "") + (d.MessageType || "")));
    const data = {
      open: !closed,
      live: true,
      label: closed ? t("Stekenjokk: avstängd") : t("Stekenjokk: öppen"),
      detail: devs.length
        ? devs.map((d) => d.Message).filter(Boolean).join(" · ")
        : t("Inga trafikmeddelanden för väg 1067 just nu (Trafikverket)."),
    };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data })); } catch {}
    return data;
  }

  return {
    // Live om nyckel finns och anropet lyckas, annars säsongsstatus.
    async get() {
      try {
        const l = await live();
        if (l) return l;
      } catch {}
      return seasonal();
    },
    seasonal,
  };
})();
