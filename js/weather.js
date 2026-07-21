// ===================================================================
//  Väder — SMHI öppna data (snow1g), "just nu"
// ===================================================================
//  pmp3g lades ner 2026-03-31; snow1g är efterföljaren. CORS är öppet,
//  så vi hämtar direkt i webbläsaren. Vi tar det tidssteg som ligger
//  närmast nu och plockar ut temperatur, vind och vädersymbol.
// ===================================================================

const Weather = (() => {
  const BASE =
    "https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point";
  const cache = new Map(); // "lat,lon" -> { time, data }

  // SMHI Wsymb2 / symbol_code 1–27 → text + emoji
  const SYMBOLS = {
    1: ["Klart", "☀️"], 2: ["Mestadels klart", "🌤️"], 3: ["Växlande molnighet", "⛅"],
    4: ["Halvklart", "⛅"], 5: ["Molnigt", "☁️"], 6: ["Mulet", "☁️"],
    7: ["Dimma", "🌫️"], 8: ["Lätt regnskur", "🌦️"], 9: ["Regnskur", "🌦️"],
    10: ["Kraftig regnskur", "🌧️"], 11: ["Åskväder", "⛈️"], 12: ["Lätt snöblandad skur", "🌨️"],
    13: ["Snöblandad skur", "🌨️"], 14: ["Kraftig snöblandad skur", "🌨️"], 15: ["Lätt snöby", "🌨️"],
    16: ["Snöby", "🌨️"], 17: ["Kraftig snöby", "❄️"], 18: ["Lätt regn", "🌧️"],
    19: ["Regn", "🌧️"], 20: ["Kraftigt regn", "🌧️"], 21: ["Åska", "⛈️"],
    22: ["Lätt snöblandat regn", "🌨️"], 23: ["Snöblandat regn", "🌨️"], 24: ["Kraftigt snöblandat regn", "🌨️"],
    25: ["Lätt snöfall", "🌨️"], 26: ["Snöfall", "❄️"], 27: ["Kraftigt snöfall", "❄️"],
  };

  function pickNearest(series) {
    const now = Date.now();
    let best = series[0];
    let bestDiff = Infinity;
    for (const s of series) {
      const diff = Math.abs(new Date(s.time).getTime() - now);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = s;
      }
    }
    return best;
  }

  return {
    async get(lat, lon) {
      const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.time < 15 * 60 * 1000) return hit.data;

      const url = `${BASE}/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("SMHI " + res.status);
      const json = await res.json();
      const step = pickNearest(json.timeSeries);
      const d = step.data;
      const sym = SYMBOLS[d.symbol_code] || ["", "🌡️"];
      const out = {
        temp: Math.round(d.air_temperature),
        wind: Math.round(d.wind_speed),
        gust: Math.round(d.wind_speed_of_gust),
        precip: d.precipitation_amount_mean,
        desc: sym[0],
        emoji: sym[1],
        time: step.time,
      };
      cache.set(key, { time: Date.now(), data: out });
      return out;
    },

    // Dygnsprognos för kommande dagar (temp, vind, nederbörd).
    async forecast(lat, lon) {
      const url = `${BASE}/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("SMHI " + res.status);
      const json = await res.json();
      const series = json.timeSeries.map((s) => ({ t: new Date(s.time), d: s.data }));
      const byDay = new Map();
      for (const s of series) {
        const k = s.t.toISOString().slice(0, 10);
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(s);
      }
      const days = [];
      for (const [date, arr] of byDay) {
        arr.sort((a, b) => a.t - b.t);
        const temps = arr.map((x) => x.d.air_temperature);
        const winds = arr.map((x) => x.d.wind_speed);
        const gusts = arr.map((x) => x.d.wind_speed_of_gust);
        let precip = 0;
        for (let i = 0; i < arr.length; i++) {
          const hrs = i < arr.length - 1 ? (arr[i + 1].t - arr[i].t) / 3600000 : 1;
          precip += (arr[i].d.precipitation_amount_mean || 0) * hrs;
        }
        const rep = arr.reduce((a, b) =>
          Math.abs(b.t.getHours() - 13) < Math.abs(a.t.getHours() - 13) ? b : a);
        const sym = SYMBOLS[rep.d.symbol_code] || ["", "🌡️"];
        days.push({
          date,
          tmin: Math.round(Math.min(...temps)),
          tmax: Math.round(Math.max(...temps)),
          wind: Math.round(Math.max(...winds)),
          gust: Math.round(Math.max(...gusts)),
          precip: Math.round(precip * 10) / 10,
          emoji: sym[1], desc: sym[0],
        });
      }
      return days.slice(0, 7);
    },
  };
})();
