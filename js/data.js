// ===================================================================
//  Vilse i Kultsjödalen — grunddata
// ===================================================================
//  Förladdad lokaldata. Koordinater är [latitud, longitud], verifierade
//  mot OpenStreetMap / Wikipedia. Varje plats har kort beskrivning,
//  historia och fakta som visas i platskortet.
// ===================================================================

const CATEGORIES = {
  led:      { label: "Leder & turer",          color: "#2f8f4e" },
  fiske:    { label: "Fiske",                  color: "#2f6fb0" },
  smultron: { label: "Smultronställen",        color: "#d1495b" },
  kultur:   { label: "Kultur & fornlämningar", color: "#9a6a3a" },
  sevart:   { label: "Sevärt",                 color: "#17a2a2" },
  boende:   { label: "Boende & mat",           color: "#e0872b" },
};

// Karta centreras kring dalen (Stekenjokk i väster → Dikanäs i öster).
const MAP_CENTER = [65.06, 15.25];
const MAP_ZOOM = 9;

const SEED_POIS = [
  {
    id: "fatmomakke",
    name: "Fatmomakke kyrkstad",
    category: "kultur",
    coord: [65.0845, 15.1459],
    blurb: "Samisk kyrkstad vid Kultsjön",
    description:
      "En av Sveriges mest särpräglade kyrkstäder, vackert belägen där Ransarån " +
      "möter Kultsjön med Marsfjället i fonden. Ett myller av kåtor, timmerstugor " +
      "och bodar kring den lilla fjällkyrkan.",
    history:
      "Fatmomakke har varit en samisk mötesplats sedan 1700-talet. Första " +
      "gudstjänsten hölls 1781, och platsen växte till ett hundratal byggnader — " +
      "omkring 80 kåtor och 20 timmerstugor. Samerna reste sina kåtor uppför " +
      "sluttningen medan nybyggarna byggde stugor närmare stranden. 1904 bildades " +
      "här Sveriges första sameförening. Sedan 2014 är kyrkstaden ett kulturreservat.",
    facts: [
      ["Byggnader", "~100"],
      ["Första gudstjänst", "1781"],
      ["Sameförening", "1904"],
      ["Skydd", "Kulturreservat 2014"],
    ],
    image: "",
    source: "Länsstyrelsen Västerbotten, Wikipedia",
  },
  {
    id: "saxnas",
    name: "Saxnäs",
    category: "boende",
    coord: [64.9706, 15.3516],
    blurb: "Fjällby och nav i dalen",
    description:
      "Största byn vid Kultsjön, med fjällanläggning, butik och service. " +
      "Utgångspunkt för fiske, vandring och turer längs Vildmarksvägen.",
    history:
      "Första nybygget i Saxnäs anlades 1824. Väg till Vilhelmina (~85 km) kom på " +
      "1920-talet. Från 1930-talet växte turismen fram, dels genom Saxnäsgården, " +
      "dels genom Bernhard Nordhs romaner ”I Marsfjällets skugga” (1937) och " +
      "”Fjällfolk” (1938) som utspelar sig i trakten. Saxnäs kyrka byggdes 1958–59.",
    facts: [
      ["Grundat", "1824"],
      ["Invånare", "~130"],
      ["Kyrka", "1959"],
    ],
    image: "images/summer-valley.webp",
    source: "Wikipedia, Visit Vilhelmina",
  },
  {
    id: "trappstegsforsen",
    name: "Trappstegsforsen",
    category: "sevart",
    coord: [64.9571, 15.4649],
    blurb: "Vildmarksvägens trappande vattenfall",
    description:
      "Ett av Vildmarksvägens mest fotograferade vattenfall, där Kultsjöån faller " +
      "i tydliga trappsteg. Rastplats och spång intill vägen.",
    history:
      "Forsen ligger i Kultsjöåns fiskevatten, som sträcker sig från Kultsjöns " +
      "utlopp nedströms genom sjöarna Bielite, Gaskalite och Voullelite. Trakten " +
      "är känd för sitt rödingfiske.",
    facts: [
      ["Vattendrag", "Kultsjöån"],
      ["Läge", "Vid Vildmarksvägen"],
    ],
    image: "images/waterfall-summer.webp",
    ambiance: true,
    source: "OpenStreetMap, Kultsjöåns FVO",
  },
  {
    id: "marsfjallet",
    name: "Marsfjället (1589 m)",
    category: "led",
    coord: [65.1402, 15.5206],
    blurb: "Södra Lapplands högsta topp",
    description:
      "Marsfjället reser sig 1589 m över havet och är det högsta fjället mellan " +
      "Sylarna och Norra Storfjället. Toppen nås via markerade leder från bland " +
      "annat Marsliden och Fatmomakke — en rejäl dagstur genom naturreservatet.",
    history:
      "Hela Marsfjällsområdet är ett samiskt kulturlandskap och del av Vilhelmina " +
      "norra samebys renbetesland. Naturreservatet bildades 1988 och omfattar ca " +
      "114 000 hektar med kalfjäll, fjällbjörkskog, myrar och gammelskog. Här " +
      "finns bland annat fjällräv och björn.",
    facts: [
      ["Höjd", "1589 m ö.h."],
      ["Naturreservat", "1988"],
      ["Areal", "~114 000 ha"],
    ],
    image: "images/marsfjallet-massif.webp",
    source: "Wikipedia, Länsstyrelsen",
  },
  {
    id: "marsliden",
    name: "Marsliden",
    category: "boende",
    coord: [65.0296, 15.3701],
    blurb: "By vid fjällets fot",
    description:
      "Liten by vid Kultsjöns strand och ingång till Marsfjällets naturreservat. " +
      "Bevarad nybyggar- och fäbodmiljö.",
    history:
      "Marsliden bär tydliga spår av nybyggartiden, bland annat efter Lars " +
      "Pålsson. I byn finns utställningen ”De skrivna orden” om författaren " +
      "Bernhard Nordh, vars romaner skildrar livet i Marsfjällets skugga.",
    facts: [
      ["Läge", "Kultsjöns östra del"],
      ["Nära", "Marsfjället"],
    ],
    image: "images/autumn-trail.webp",
    source: "Vilhelmina museum, OpenStreetMap",
  },
  {
    id: "klimpfjall",
    name: "Klimpfjäll",
    category: "boende",
    coord: [65.0634, 14.8017],
    blurb: "Fjällby längs Vildmarksvägen",
    description:
      "By väster om Saxnäs på väg mot Stekenjokk, omgiven av fjäll. Boende och " +
      "utgångspunkt för fjällturer sommar som vinter.",
    history:
      "Klimpfjälls förste nybyggare, Jonatan Björklund, byggde stuga och lada i " +
      "slutet av 1820-talet. Vid Vielmesmakke intill låg ett gammalt samiskt " +
      "sommarviste, och i en av kåtorna drevs en nomadskola för samiska barn " +
      "1926–1950.",
    facts: [
      ["Förste nybyggare", "1820-tal"],
      ["Nomadskola", "1926–1950"],
    ],
    image: "",
    source: "Visit Vilhelmina",
  },
  {
    id: "stekenjokk",
    name: "Stekenjokk",
    category: "sevart",
    coord: [65.0943, 14.4608],
    blurb: "Kalfjällsplatån — Vildmarksvägens tak",
    description:
      "Vidsträckt kalfjällsplatå nära norska gränsen. Renar, vidder och ofta snö " +
      "långt in på sommaren. Vägen över Stekenjokk är Sveriges högsta asfalterade.",
    history:
      "Vildmarksvägen byggdes 1969 för att försörja koppargruvan i Stekenjokk. " +
      "Gruvan var i drift till 1989 men blev aldrig något samhälle — arbetarna " +
      "pendlade. Vägen över platån (876 m ö.h.) är stängd vintertid, ungefär " +
      "15 oktober–6 juni.",
    facts: [
      ["Höjd", "876 m ö.h."],
      ["Väg byggd", "1969"],
      ["Gruva", "1969–1989"],
      ["Öppen", "ca juni–okt"],
    ],
    image: "images/reindeer-stekenjokk.webp",
    source: "Wikipedia",
  },
  {
    id: "ransarn",
    name: "Ransarn",
    category: "fiske",
    coord: [65.238, 15.0057],
    blurb: "Fjällsjö och sen nybyggarbygd",
    description:
      "Stor fjällsjö i dalens nordvästra del — paddling i högfjällsstillhet och " +
      "känt vinterfiske efter röding. Sjön rymmer även öring.",
    history:
      "Ransarn koloniserades sent — upp till tolv nybyggen anlades mellan 1890 " +
      "och 1920, bland de sista i Sverige. Utan väg levde man på jakt, fiske och " +
      "boskap. Nästan alla nybyggen övergavs när Ransaren reglerades på 1950-talet.",
    facts: [
      ["Nybyggen", "1890–1920"],
      ["Reglerad", "1950-tal"],
      ["Fiske", "Röding & öring"],
    ],
    image: "",
    source: "Sportfiskeguide, Vilhelmina museum",
  },
  {
    id: "stalon",
    name: "Stalon",
    category: "sevart",
    coord: [64.9409, 15.8741],
    blurb: "Kraftverket vid Kultsjöåns utlopp",
    description:
      "By vid Kultsjöån öster om Kultsjön, präglad av vattenkraften. " +
      "Utgångspunkt österut i dalen.",
    history:
      "Stalons kraftstation byggdes 1958–1961 och reglerar Kultsjön. Via en " +
      "17 800 meter lång bergtunnel leds vatten från sjön till kraftverket. " +
      "Kultsjöåns naturliga fåra är därför mestadels torrlagd — vintertid rinner " +
      "bara ca 1,5 m³/s genom den gamla åfåran.",
    facts: [
      ["Kraftverk", "1958–1961"],
      ["Tunnel", "17 800 m"],
    ],
    image: "",
    source: "Wikipedia",
  },
  {
    id: "dikanas",
    name: "Dikanäs",
    category: "boende",
    coord: [65.2347, 15.9952],
    blurb: "By i övre Vojmådalen",
    description:
      "Fjällby nordost om Kultsjödalen med service, skola och kyrka. Utgångspunkt " +
      "för turer i omkringliggande fjäll och samiskt kärnland.",
    history:
      "Trakten kring Dikanäs har djupa samiska rötter — vistena Siliste och " +
      "Klitvallen i övre Vojmådalen anlades redan 1831–32. Bygden hör till " +
      "Vilhelminas fjällsamiska område.",
    facts: [
      ["Viste", "1831–32"],
      ["Läge", "Övre Vojmådalen"],
    ],
    image: "",
    source: "dikanas.eu, Vilhelmina museum",
  },
  {
    id: "kultsjon",
    name: "Kultsjön",
    category: "fiske",
    coord: [65.02, 15.24],
    blurb: "Dalens stora reglerade fjällsjö",
    description:
      "Kultsjön sträcker sig som ett smalt band genom hela dalen — 542 m ö.h., " +
      "53 km² stor och som djupast nära 130 m. Röding och öring; fiskekort krävs.",
    history:
      "Sjön regleras sedan 1960-talet för Stalons kraftverk och varierar mellan " +
      "537 och 542 m ö.h. Kultsjöån för vattnet vidare mot Ångermanälven.",
    facts: [
      ["Yta", "53,4 km²"],
      ["Djup", "max ~130 m"],
      ["Höjd", "542 m ö.h."],
      ["Strandlinje", "129 km"],
    ],
    image: "images/kultsjon-winter.webp",
    source: "Wikipedia",
  },
];
