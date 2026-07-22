// ===================================================================
//  Sol — soluppgång/solnedgång, beräknas lokalt (NOAA-algoritm)
// ===================================================================
//  Inget API behövs. Så här långt norrut kan solen vara uppe eller
//  nere hela dygnet — då returneras midnattssol/polarnatt i stället
//  för klockslag.
// ===================================================================

const Sun = (() => {
  const RAD = Math.PI / 180;

  function toJulian(date) { return date.getTime() / 86400000 - 0.5 + 2440588; }
  function fromJulian(j) { return new Date((j + 0.5 - 2440588) * 86400000); }

  function calc(lat, lon, date) {
    const lw = -lon * RAD;
    const phi = lat * RAD;
    const J2000 = 2451545;
    const n = Math.round(toJulian(date) - J2000 - 0.0009 - lw / (2 * Math.PI));
    const ds = J2000 + 0.0009 + lw / (2 * Math.PI) + n;
    const M = (357.5291 + 0.98560028 * (ds - J2000)) * RAD;
    const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * RAD;
    const P = 102.9372 * RAD;
    const Lsun = M + C + P + Math.PI;
    const dec = Math.asin(Math.sin(Lsun) * Math.sin(23.4397 * RAD));
    const Jtransit = ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * Lsun);
    // -0.833° = solskivans övre kant vid horisonten inkl. refraktion.
    const cosH = (Math.sin(-0.833 * RAD) - Math.sin(phi) * Math.sin(dec)) /
                 (Math.cos(phi) * Math.cos(dec));
    if (cosH < -1) return { always: "up" };    // midnattssol
    if (cosH > 1) return { always: "down" };   // polarnatt
    const H = Math.acos(cosH);
    const Jset = Jtransit + H / (2 * Math.PI);
    const Jrise = Jtransit - H / (2 * Math.PI);
    return { rise: fromJulian(Jrise), set: fromJulian(Jset) };
  }

  function hhmm(d) {
    return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  }

  return {
    // { rise, set } som Date, eller { always: "up" | "down" }
    times(lat, lon, date = new Date()) { return calc(lat, lon, date); },
    format(lat, lon, date = new Date()) {
      const s = calc(lat, lon, date);
      if (s.always === "up") return { text: t("Midnattssol"), emoji: "🌞" };
      if (s.always === "down") return { text: t("Polarnatt"), emoji: "🌑" };
      return { text: `${hhmm(s.rise)}–${hhmm(s.set)}`, emoji: "☀️", rise: hhmm(s.rise), set: hhmm(s.set) };
    },
  };
})();
