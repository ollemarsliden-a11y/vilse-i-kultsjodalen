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
  };
})();
