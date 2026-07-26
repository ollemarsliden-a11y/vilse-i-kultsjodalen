// ===================================================================
//  Namngivna fjälltoppar (≥ 1000 m) i Kultsjödalen med omnejd
// ===================================================================
//  Från OpenStreetMap via Overpass (natural=peak + name, ele≥1000)
//  inom vår datazon. Egen kategori "topp", avstängd som standard i
//  chipraden så kartan hålls ren. Regenerera med samma Overpass-fråga.
//
//  Urval: bara toppar inom 25 km från någon av byarna i dalen. Overpass-
//  zonen sträcker sig annars långt in i Norge och ner mot Borgafjäll —
//  fjäll man varken ser eller når härifrån. Marsfjället ligger som egen
//  plats i data.js (med text och bild) och ska INTE dubbleras här.
// ===================================================================

const PEAKS = [
  { id: "peak-gahkagaejsie-nord", name: "Gahkagaejsie (nordtopp)", category: "topp", coord: [65.08873, 15.37228], blurb: "1449 m ö.h.", facts: [["Höjd", "1449 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-aajnantjahke", name: "Aajnantjahke", category: "topp", coord: [65.06721, 15.32482], blurb: "1245 m ö.h.", facts: [["Höjd", "1245 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-gahkagaejsie-syd", name: "Gahkagaejsie (sydtopp)", category: "topp", coord: [65.06687, 15.38332], blurb: "1196 m ö.h.", facts: [["Höjd", "1196 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-jiengejehtseme-2", name: "Jiengejehtseme", category: "topp", coord: [64.89529, 15.12504], blurb: "1477 m ö.h.", facts: [["Höjd", "1477 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-kruanahke-4", name: "Kruanahke", category: "topp", coord: [64.93594, 14.95624], blurb: "1426 m ö.h.", facts: [["Höjd", "1426 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-stra-fj-llfj-llet-6", name: "Östra Fjällfjället", category: "topp", coord: [65.17361, 14.75722], blurb: "1409 m ö.h.", facts: [["Höjd", "1409 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-risfj-llet-7", name: "Risfjället", category: "topp", coord: [65.1503, 15.44319], blurb: "1388 m ö.h.", facts: [["Höjd", "1388 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-gr-nfj-llet-8", name: "Grönfjället", category: "topp", coord: [65.30074, 15.57954], blurb: "1376 m ö.h.", facts: [["Höjd", "1376 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-klippfj-llet-10", name: "Klippfjället", category: "topp", coord: [65.31151, 15.65925], blurb: "1364 m ö.h.", facts: [["Höjd", "1364 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-ortsen-14", name: "Ortsen", category: "topp", coord: [65.08847, 15.34312], blurb: "1304 m ö.h.", facts: [["Höjd", "1304 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-kl-verfj-llet-15", name: "Klöverfjället", category: "topp", coord: [64.8789, 15.06911], blurb: "1302 m ö.h.", facts: [["Höjd", "1302 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-gealta-17", name: "Gealta", category: "topp", coord: [65.39984, 15.7047], blurb: "1301 m ö.h.", facts: [["Höjd", "1301 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-durrenpiken-18", name: "Durrenpiken", category: "topp", coord: [65.1223, 14.69139], blurb: "1286 m ö.h.", facts: [["Höjd", "1286 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-ljusfj-llet-20", name: "Ljusfjället", category: "topp", coord: [65.26283, 14.80863], blurb: "1248 m ö.h.", facts: [["Höjd", "1248 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-bealloetjahke-21", name: "Bealloetjahke", category: "topp", coord: [65.40509, 15.67981], blurb: "1247 m ö.h.", facts: [["Höjd", "1247 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-autjoklimpen-22", name: "Autjoklimpen", category: "topp", coord: [64.99949, 14.81134], blurb: "1240 m ö.h.", facts: [["Höjd", "1240 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-kittelfj-llet-24", name: "Kittelfjället", category: "topp", coord: [65.27417, 15.49197], blurb: "1231 m ö.h.", facts: [["Höjd", "1231 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-gealtangietjie-25", name: "Gealtangietjie", category: "topp", coord: [65.38057, 15.73972], blurb: "1211 m ö.h.", facts: [["Höjd", "1211 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-b-verfj-llet-30", name: "Bäverfjället", category: "topp", coord: [65.2008, 15.30393], blurb: "1183 m ö.h.", facts: [["Höjd", "1183 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-svaarthoe-31", name: "Svaarthoe", category: "topp", coord: [65.16198, 15.54462], blurb: "1182 m ö.h.", facts: [["Höjd", "1182 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-rovpentjahke-35", name: "Rovpentjahke", category: "topp", coord: [65.04506, 15.33151], blurb: "1148 m ö.h.", facts: [["Höjd", "1148 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-gelven-hkoe-36", name: "Gelvenåhkoe", category: "topp", coord: [65.05283, 14.41344], blurb: "1141 m ö.h.", facts: [["Höjd", "1141 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-boernetjahke-38", name: "Boernetjahke", category: "topp", coord: [65.41221, 15.83782], blurb: "1131 m ö.h.", facts: [["Höjd", "1131 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-tjaallinge-42", name: "Tjaallinge", category: "topp", coord: [65.06323, 14.52195], blurb: "1122 m ö.h.", facts: [["Höjd", "1122 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-kraejhpiesvaerie-43", name: "Kraejhpiesvaerie", category: "topp", coord: [65.1476, 15.09473], blurb: "1118 m ö.h.", facts: [["Höjd", "1118 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-ohtje-vaajjatj-hke-44", name: "Ohtje Vaajjatjåhke", category: "topp", coord: [65.40568, 15.79173], blurb: "1117 m ö.h.", facts: [["Höjd", "1117 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-s-ttan-55", name: "Såttan", category: "topp", coord: [65.05418, 15.49356], blurb: "1067 m ö.h.", facts: [["Höjd", "1067 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-tjohkele-56", name: "Tjohkele", category: "topp", coord: [65.36329, 15.58155], blurb: "1066 m ö.h.", facts: [["Höjd", "1066 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-steavhketjahke-58", name: "Steavhketjahke", category: "topp", coord: [65.37642, 15.82875], blurb: "1060 m ö.h.", facts: [["Höjd", "1060 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-b-assjasvaajjantjahke-59", name: "Båassjasvaajjantjahke", category: "topp", coord: [64.84485, 14.68091], blurb: "1056 m ö.h.", facts: [["Höjd", "1056 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-tj-ervietjahke-61", name: "Tjåervietjahke", category: "topp", coord: [64.84563, 15.57476], blurb: "1048 m ö.h.", facts: [["Höjd", "1048 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-jalketjahke-65", name: "Jalketjahke", category: "topp", coord: [64.96367, 14.64134], blurb: "1042 m ö.h.", facts: [["Höjd", "1042 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-stihke-68", name: "Stihke", category: "topp", coord: [65.09278, 14.50516], blurb: "1035 m ö.h.", facts: [["Höjd", "1035 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-borgah-llan-70", name: "Borgahällan", category: "topp", coord: [64.80448, 14.99928], blurb: "1030 m ö.h.", facts: [["Höjd", "1030 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-gaarenstjahke-72", name: "Gaarenstjahke", category: "topp", coord: [65.37764, 15.6296], blurb: "1025 m ö.h.", facts: [["Höjd", "1025 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-murfj-llet-75", name: "Murfjället", category: "topp", coord: [65.16706, 15.14061], blurb: "1019 m ö.h.", facts: [["Höjd", "1019 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-domprosten-76", name: "Domprosten", category: "topp", coord: [65.06665, 14.41624], blurb: "1014 m ö.h.", facts: [["Höjd", "1014 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-st-ken-81", name: "Stöken", category: "topp", coord: [65.03249, 15.2549], blurb: "1005 m ö.h.", facts: [["Höjd", "1005 m ö.h."]], source: "OpenStreetMap" },
  { id: "peak-gumtiken-84", name: "Gumtiken", category: "topp", coord: [65.40407, 15.87039], blurb: "1000 m ö.h.", facts: [["Höjd", "1000 m ö.h."]], source: "OpenStreetMap" },
];

// ===================================================================
//  Handskrivna texter för topparna kring Marsliden
// ===================================================================
//  Listan ovan kommer från OSM och kan regenereras — den här delen är
//  skriven för hand och ska INTE skrivas över. Nyckeln är toppens namn
//  (inte id:t, som får ett löpnummer vid regenerering).
//  Lägg gärna till fler toppar här efter hand.
//
//  OBS: höjder och lägen kommer från OSM. Terrängbeskrivningarna är
//  allmänt hållna — det finns inga markerade leder till de här topparna,
//  till skillnad från Marsfjället.
// ===================================================================
const PEAK_TEXT = {
  "Rovpentjahke": {
    blurb: "1148 m — närmaste fjället från Marsliden",
    description:
      "Fjället närmast byn, 2,5 km nordväst om Marsliden. Det är den här " +
      "ryggen man ser resa sig direkt bakom husen. Kort väg men brant — det " +
      "är knappt 600 höjdmeter upp från byn (byn ligger på ca 570 m), först genom fjällbjörkskog och " +
      "sedan ut på öppet kalfjäll. Uppifrån ligger Västra Marssjön och byn " +
      "rakt nedanför, med Marsfjället i norr. En bra första topp för den som " +
      "bor i byn och vill upp på fjället utan att göra en heldag av det.",
  },
  "Gahkagaejsie (sydtopp)": {
    blurb: "1196 m — södra delen av ryggen mot Marsfjället",
    description:
      "Södra av de två Gahkagaejsie-topparna, 4,2 km norr om Marsliden. " +
      "Tillsammans med nordtoppen bildar den fjällryggen mellan byn och " +
      "Marsfjället, och ligger halvvägs däremellan. Öppet kalfjäll hela vägen " +
      "från trädgränsen. Namnet är sydsamiskt, som de flesta fjällnamn här — " +
      "hela området är renbetesland inom Vilhelmina norra sameby.",
  },
  "Gahkagaejsie (nordtopp)": {
    blurb: "1449 m — områdets näst högsta topp",
    description:
      "Näst högsta toppen i trakten efter Marsfjället, och bara 2 km söder om " +
      "själva huvudtoppen. Det gör att den går att ta med på samma tur för den " +
      "som ändå är på väg upp mot Marsfjället. Från Marsliden är det 6,6 km " +
      "rakt norrut och en rejäl stigning — högfjäll med allt vad det innebär " +
      "av snöfläckar långt in på sommaren och väder som vänder snabbt.",
  },
  "Aajnantjahke": {
    blurb: "1245 m — kalfjäll nordväst om byn",
    description:
      "Ligger 4,7 km nordväst om Marsliden, på västra sidan av fjällpartiet " +
      "mellan byn och Marsfjället. Öppen och vidsträckt kalfjällsterräng utan " +
      "markerad led — här går man på karta och kompass, eller efter GPS. " +
      "Ta höjd för att sikten kan försvinna fort när dimman kommer in.",
  },
  "Ortsen": {
    blurb: "1304 m — grannfjäll till Marsfjället",
    description:
      "Toppen ligger 2,6 km sydväst om Marsfjället och 6,7 km norr om " +
      "Marsliden, alltså långt inne i fjällmassivet. Med 1304 m är det en av " +
      "de högre topparna i området, och en naturlig avstickare för den som " +
      "redan är uppe på fjället. Kalfjäll och blockterräng.",
  },
  "Såttan": {
    blurb: "1067 m — åt Kittelfjällshållet",
    description:
      "Till skillnad från de andra topparna kring Marsliden ligger Såttan " +
      "åt nordost, 6,4 km från byn och bort från Marsfjället. Lägre och " +
      "mjukare terräng, med utsikt österut längs dalen mot Kittelfjäll.",
  },
  "Stöken": {
    blurb: "1005 m — nätt och jämnt över tusenstrecket",
    description:
      "Den lägsta av topparna kring Marsliden, 5,4 km väster om byn och precis " +
      "över tusen meter. Kortare stigning än grannfjällen och därmed ett " +
      "rimligt mål en eftermiddag, med Kultsjön och Västra Marssjön i söder.",
  },
};
for (const p of PEAKS) {
  const extra = PEAK_TEXT[p.name];
  if (extra) Object.assign(p, extra);
}
