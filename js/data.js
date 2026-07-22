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
  topp:     { label: "Toppar",                 color: "#5f7488" },
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
      "och bodar kring den lilla fjällkyrkan — en plats där samisk kultur och " +
      "nybyggarkultur möts tydligt sida vid sida. Sommartid erbjuds guidade " +
      "turer i kyrkstaden (se Visit Vilhelmina för tider).",
    history:
      "Fatmomakke har varit en samisk mötesplats i generationer. Den första " +
      "gudstjänsten hölls den 8 juli 1781, sedan två kåtor och en bod rests på en " +
      "liten holme vid Ransaråns utlopp. Platsen växte till ett hundratal " +
      "byggnader — omkring 80 kåtor och 20 timmerstugor. Samerna reste kåtor medan " +
      "nybyggarna byggde timmerhus, vilket än i dag gör de två kulturerna synliga " +
      "sida vid sida. 1904 bildades här Sveriges första sameförening, och sedan " +
      "2014 är kyrkstaden ett kulturreservat (Faepmie).",
    facts: [
      ["Byggnader", "~100"],
      ["Första gudstjänst", "1781"],
      ["Sameförening", "1904"],
      ["Kulturreservat", "2014 (Faepmie)"],
    ],
    image: "images/fatmomakke.webp",
    imageCredit: "Foto: Moralist / Wikimedia Commons (CC BY-SA 4.0)",
    source: "Länsstyrelsen Västerbotten, Wikipedia",
  },
  {
    id: "saxnas",
    name: "Saxnäs",
    category: "boende",
    coord: [64.9706, 15.3516],
    blurb: "Fjällby och nav i dalen",
    description:
      "Största byn vid Kultsjön och ett nav i dalen, med fjällhotell, butik och " +
      "service. Härifrån utgår fiske, vandring och turer längs Vildmarksvägen — " +
      "omgiven av fjällkedjor och vidöppna vyer över sjön. Vintertid är Saxnäs " +
      "snösäkert med preparerade längdspår (skate och klassiskt, nov–maj), " +
      "skoterleder och fina turer med snöskor.",
    history:
      "Det första nybygget i Saxnäs anlades 1824, och väg till Vilhelmina " +
      "(~85 km) kom på 1920-talet. Turismen växte fram från 1930-talet, dels " +
      "genom Saxnäsgården, dels genom Bernhard Nordhs romaner ”I Marsfjällets " +
      "skugga” (1937) och ”Fjällfolk” (1938) som utspelar sig i trakten. På " +
      "1940-talet skapade konstnärsparet Emma och Folke Ricklund konsthemmet " +
      "Ricklundgården, i dag ett konstnärsresidens med storslagen utsikt över " +
      "Kultsjön och Marsfjället. Saxnäs kyrka byggdes 1958–59.",
    facts: [
      ["Grundat", "1824"],
      ["Invånare", "~130"],
      ["Kyrka", "1959"],
      ["Konsthem", "Ricklundgården"],
    ],
    image: "images/saxnas.webp",
    imageCredit: "Foto: Skogsfrun / Wikimedia Commons (CC BY-SA 3.0)",
    source: "Wikipedia, Visit Vilhelmina",
  },
  {
    id: "ricklundgarden",
    name: "Ricklundgården",
    category: "kultur",
    coord: [64.97109, 15.35599],
    blurb: "Konsthem & residens med vy över Kultsjön",
    description:
      "Konstnärshem skapat av Emma och Folke Ricklund på 1940-talet, i dag ett " +
      "konstnärsresidens där konstnärer från hela världen bor och arbetar. Känt " +
      "för sin storslagna vy över Kultsjön med Marsfjället i fonden.",
    facts: [["Skapat", "1940-talet"], ["Typ", "Konsthem & residens"]],
    image: "",
    source: "Visit Vilhelmina, Ricklundgården, OpenStreetMap",
  },
  {
    id: "kultsjogarden",
    name: "Kultsjögården",
    category: "boende",
    coord: [64.97061, 15.34598],
    blurb: "Prisvärt fjällboende i Saxnäs",
    description:
      "Mysigt och prisvärt boende mitt i Saxnäs — vandrarhemsrum, stugor, " +
      "lägenheter och ställplatser, med utsikt mot Kultsjön och Marsfjällen. " +
      "Reception i Marsfjällshandlar'n. Drivs ihop med Fiskecentrum Saxnäs.",
    website: "https://xn--fiskecentrumsaxns-5qb.se/",
    facts: [["Typ", "Boende"], ["By", "Saxnäs"]],
    image: "",
    source: "Visit Vilhelmina, Kultsjögården",
  },
  {
    id: "fiskecentrum-saxnas",
    name: "Fiskecentrum Saxnäs",
    category: "fiske",
    coord: [64.97146, 15.33801],
    blurb: "Fiskekort, utrustning & guidning i Handlar'n",
    description:
      "Fiskecentrum ligger i Marsfjällshandlar'n mitt i Saxnäs. Här köper du " +
      "fiske- och jaktkort, hittar fiske- och friluftsutrustning, fjällkartor och " +
      "dagligvaror. De ordnar guidning och kurser och tipsar om vattnen kring " +
      "Kultsjön, Kultsjöån, Stekenjokk och Ransarån.",
    website: "https://xn--fiskecentrumsaxns-5qb.se/",
    facts: [["Läge", "Marsfjällshandlar'n"], ["By", "Saxnäs"]],
    image: "",
    source: "Visit Vilhelmina, Fiskecentrum Saxnäs",
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
    image: "images/trappstegsforsen.webp",
    imageCredit: "Foto: Lavallen / Wikimedia Commons (Public domain)",
    source: "OpenStreetMap, Kultsjöåns FVO",
  },
  {
    id: "marsfjallet",
    name: "Marsfjället (1589 m)",
    category: "led",
    coord: [65.1066, 15.3798],
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
    image: "images/marsfjallet.webp",
    imageCredit: "Foto: Lövberg / Wikimedia Commons (CC0)",
    source: "Wikipedia, Länsstyrelsen",
  },
  {
    id: "marsliden",
    name: "Marsliden",
    category: "boende",
    coord: [65.0296, 15.3701],
    blurb: "By vid fjällets fot — porten till Marsfjället",
    description:
      "Marsliden ligger utmed Kultsjöns östra strand, tätt inpå Marsfjället, och " +
      "brukar kallas porten till Marsfjällets naturreservat. Byn är liten — ett " +
      "tjugotal fastboende men uppemot 200 fritidshus — och har kvar mycket av sin " +
      "gamla nybyggar- och fäbodmiljö. Härifrån utgår markerade leder mot toppar, " +
      "kåtor och fjällstugor, och den lokala intresseföreningen håller flera mil " +
      "leder öppna både sommar och vinter.",
    history:
      "Byns första nybygge anlades på 1800-talet, och trakten blev vida känd genom " +
      "Bernhard Nordhs romaner om nybyggarna ”i Marsfjällets skugga”. En bevarad " +
      "kopia av det första nybygget — Pålssons stuga efter Lars Pålsson — är öppen " +
      "som litet museum, och sommartid visas utställningen ”De skrivna orden” om " +
      "Nordh och andra författare från byn. Mitt i Marsliden ligger Kanons kiosk och " +
      "café, som förutom fika också fungerar som informationspunkt och ett stycke " +
      "lokalt kuriosamuseum.",
    facts: [
      ["Läge", "Kultsjöns östra strand"],
      ["Fastboende", "ca 20–30"],
      ["Fritidshus", "ca 200"],
      ["Port till", "Marsfjället"],
    ],
    image: "",
    source: "Visit Vilhelmina, Marslidens intresseförening, Vilhelmina museum",
  },
  {
    id: "palssons-stuga",
    name: "Pålssons stuga",
    category: "kultur",
    coord: [65.02538, 15.36378],
    blurb: "Byns första nybygge — litet museum",
    description:
      "En bevarad kopia av Lars Pålssons stuga, det första nybygget i Marsliden. " +
      "Ett litet museum om nybyggartiden och livet i Marsfjällets skugga.",
    facts: [["Typ", "Nybyggarmuseum"], ["By", "Marsliden"]],
    image: "",
    source: "Visit Vilhelmina, OpenStreetMap",
  },
  {
    id: "kanons-kiosk",
    name: "Kanons kiosk & café",
    category: "boende",
    coord: [65.0262, 15.36633],
    blurb: "Bykrog, café och kuriosamuseum",
    description:
      "Landmärke mitt i Marsliden — café och kiosk som också fungerar som " +
      "informationspunkt och ett stycke lokalt prylmuseum. Här hämtar man ofta " +
      "nyckeln till fjällbyns stugor.",
    facts: [["Typ", "Café & info"], ["By", "Marsliden"]],
    image: "",
    source: "Visit Vilhelmina, OpenStreetMap",
  },
  {
    id: "klimpfjall",
    name: "Klimpfjäll",
    category: "boende",
    coord: [65.0634, 14.8017],
    blurb: "Fjällby längs Vildmarksvägen",
    description:
      "By väster om Saxnäs på väg mot Stekenjokk, omgiven av fjäll. Boende och " +
      "utgångspunkt för fjällturer, fiske, bärmarker och vidsträckta utsikter över " +
      "dalgångarna — sommar som vinter. Vildmarksvägen går rakt genom byn.",
    history:
      "Klimpfjälls förste nybyggare, Jonatan Björklund från trakten kring " +
      "Skellefteå, byggde stuga och lada i slutet av 1820-talet, och byn fick sitt " +
      "namn genom Johan Gabrielssons nybyggesansökan 1831. Trakten har djupa " +
      "samiska rötter — vid Vielmesmakke intill låg ett gammalt sommarviste, och i " +
      "en av kåtorna drevs en nomadskola för samiska barn 1926–1950.",
    facts: [
      ["Förste nybyggare", "1820-tal"],
      ["Namngavs", "1831"],
      ["Nomadskola", "1926–1950"],
    ],
    image: "images/klimpfjall.webp",
    imageCredit: "Foto: Lövberg / Wikimedia Commons (CC0)",
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
    image: "images/stekenjokk.webp",
    imageCredit: "Foto: Sprucecopse / Wikimedia Commons (CC BY-SA 4.0)",
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
    website: "https://sodralappland.nu/fiskeomraden/fiskeomraden-vilhelmina/",
    image: "",
    source: "Sportfiskeguide, Vilhelmina museum",
  },
  {
    id: "stensjon",
    name: "Stensjön",
    category: "fiske",
    coord: [64.86071, 15.35699],
    blurb: "Fiskesjö i Kultsjöns fiskevårdsområde",
    description:
      "Sjö söder om Kultsjön som ingår i Kultsjöns fiskevårdsområde (tillsammans " +
      "med Insjön). Fiskekort krävs och löses via Kultsjöns FVO.",
    website: "https://kultsjonfvo.se/",
    facts: [["Fiskekort", "Kultsjöns FVO"], ["Arter", "Röding & öring"]],
    image: "",
    source: "Kultsjöns FVO, OpenStreetMap",
  },
  {
    id: "vastra-marssjon",
    name: "Västra Marssjön",
    category: "fiske",
    coord: [65.02025, 15.37511],
    blurb: "Marslidens fiskesjö — öring, röding & abborre",
    description:
      "Sjön vid Marsliden, i skuggan av Marsfjällen. Här fiskas abborre (gott om), " +
      "öring och röding, och det finns båtar att hyra samt vindskydd vid vattnet. " +
      "Sjön ingår i Marslidens fiskevårdsområde tillsammans med Harrtjärn, och " +
      "fiskekort löses enklast via iFiske. Observera lekfredning för öring " +
      "20 augusti–1 oktober.",
    website: "https://www.ifiske.se/fiske-marslidens.htm",
    facts: [
      ["Fiskekort", "Marslidens FVO (iFiske)"],
      ["Arter", "Abborre, öring, röding"],
      ["Lekfredning", "20 aug–1 okt"],
    ],
    image: "",
    source: "iFiske, Marslidens FVO",
  },
  {
    id: "stora-grytsjon",
    name: "Stora Grytsjön",
    category: "fiske",
    coord: [64.99877, 15.56724],
    blurb: "Skogssjö sydost om Kultsjön",
    description:
      "En av Grytsjöarna söder om Kultsjön, med Grytsjöån som avvattnar dem. " +
      "Kontrollera vilket fiskekort som gäller innan du fiskar — sjön listas inte " +
      "under något av de vanliga fiskevårdsområdena.",
    website: "https://www.ifiske.se/fiske-i-vilhelmina-kommun.htm",
    facts: [["Fiskekort", "Kontrollera före fiske"]],
    image: "",
    source: "OpenStreetMap, iFiske",
  },
  {
    id: "lilla-grytsjon",
    name: "Lilla Grytsjön",
    category: "fiske",
    coord: [64.99842, 15.53253],
    blurb: "Mindre skogssjö vid Grytsjöån",
    description:
      "Den mindre av Grytsjöarna, strax väster om Stora Grytsjön. Kontrollera " +
      "vilket fiskekort som gäller innan du fiskar — sjön listas inte under något " +
      "av de vanliga fiskevårdsområdena.",
    website: "https://www.ifiske.se/fiske-i-vilhelmina-kommun.htm",
    facts: [["Fiskekort", "Kontrollera före fiske"]],
    image: "",
    source: "OpenStreetMap, iFiske",
  },
  {
    id: "stalon",
    name: "Stalon",
    category: "sevart",
    coord: [64.9409, 15.8741],
    blurb: "Kraftverket vid Kultsjöåns utlopp",
    description:
      "By vid Kultsjöån öster om Kultsjön, starkt präglad av vattenkraften. " +
      "Utgångspunkt österut i dalen.",
    history:
      "Stalons kraftstation, uppkallad efter Stalo ur samisk folktro, byggdes " +
      "1958–1961 och tog Kultsjön i anspråk för reglering. Via en 17,8 km lång " +
      "bergtunnel leds vattnet från sjön till turbinerna, vilket i praktiken " +
      "torrlade Kultsjöåns gamla fåra — vintertid rinner bara omkring 1,5 m³/s " +
      "genom den. En äldre betongbro över ån från 1933 revs 1960 när " +
      "utloppskanalen byggdes.",
    facts: [
      ["Kraftverk", "1958–1961"],
      ["Tunnel", "17,8 km"],
      ["Reglerar", "Kultsjön"],
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
      "Fjällby i övre Vojmådalen nordost om Kultsjödalen, med service, skola och " +
      "kyrka. Utgångspunkt för turer i omkringliggande fjäll och samiskt kärnland; " +
      "härifrån går bland annat en kort vandring mot gamla samevisten.",
    history:
      "Trakten kring Dikanäs har djupa samiska rötter, och de första svenska " +
      "nybyggarna kom under 1800-talets första decennier — det äldsta kronobygget " +
      "anlades 1815. Efter en gudstjänst i Fatmomakke 1828 bad nybyggarna i " +
      "Vojmådalen om hjälp att bygga ett eget kapell, då vägen till kyrkan i " +
      "Vilhelmina var lång. Dikanäs kapell timrades 1832 och stod klart 1833 — en " +
      "av församlingens äldsta bevarade kyrkor.",
    facts: [
      ["Äldsta kronobygge", "1815"],
      ["Kyrka", "1833"],
      ["Läge", "Övre Vojmådalen"],
    ],
    image: "images/dikanas.webp",
    imageCredit: "Foto: Riksantikvarieämbetet (KMB) / Wikimedia Commons (Public domain)",
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
      "53 km² stor och som djupast nära 130 m. Röding och öring; fiskekort krävs. " +
      "Vintertid lockar sjön med pimpelfiske, och vid rätt isförhållanden är den " +
      "ett fint vatten för långfärdsskridsko — kontrollera alltid isen själv, " +
      "sjön är reglerad och isen kan vara opålitlig nära in- och utlopp.",
    history:
      "Sjön regleras sedan 1960-talet för Stalons kraftverk och varierar mellan " +
      "537 och 542 m ö.h. Kultsjöån för vattnet vidare mot Ångermanälven.",
    facts: [
      ["Yta", "53,4 km²"],
      ["Djup", "max ~130 m"],
      ["Höjd", "542 m ö.h."],
      ["Strandlinje", "129 km"],
    ],
    website: "https://kultsjonfvo.se/",
    image: "images/kultsjon.webp",
    imageCredit: "Foto: Lövberg / Wikimedia Commons (CC0)",
    source: "Wikipedia, Kultsjöns FVO",
  },

  // ---- Fler sevärdheter (koordinater från OpenStreetMap) ----
  {
    id: "stekenjokkgruvan",
    name: "Stekenjokkgruvan",
    category: "kultur",
    coord: [65.0902, 14.4576],
    blurb: "Lämningar efter koppargruvan",
    description:
      "Rester efter koppargruvan uppe på Stekenjokks kalfjällsplatå. Det var för " +
      "gruvan som Vildmarksvägen en gång byggdes.",
    history:
      "Gruvan bröt koppar och zink 1969–1988 men blev aldrig något samhälle — " +
      "arbetarna pendlade. I dag återstår spår i landskapet nära norska gränsen.",
    facts: [["Drift", "1969–1988"], ["Höjd", "ca 800 m ö.h."]],
    image: "", source: "OpenStreetMap",
  },
  {
    id: "stalonberget-utsikt",
    name: "Stalonbergets utsiktsplats",
    category: "sevart",
    coord: [64.9492, 15.8293],
    blurb: "Vy över Kultsjöåns dalgång",
    description:
      "Utsiktsplats vid Stalon med vidsträckt vy över Kultsjöåns dalgång och " +
      "kraftverksmiljön österut i dalen.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "fiskonfallet",
    name: "Fiskonfallet",
    category: "sevart",
    coord: [64.9903, 15.2247],
    blurb: "Vattenfall med utsiktsplats",
    description:
      "Vattenfall med utsiktsplats i trakten nordväst om Saxnäs — ett stopp värt " +
      "en rast längs vägen.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "dimforsen",
    name: "Dimforsen",
    category: "sevart",
    coord: [64.9397, 15.7566],
    blurb: "Fors öster i dalen",
    description: "Vattenfall i den östra delen av dalen, nära Stalon.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "litsjoforsen",
    name: "Litsjöforsen",
    category: "sevart",
    coord: [64.923, 15.6479],
    blurb: "Fors och utsiktsplats",
    description: "Fors med utsiktsplats söder om Kultsjön.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "tjuvbruforsen",
    name: "Tjuvbruforsen",
    category: "sevart",
    coord: [65.3224, 14.3723],
    blurb: "Vattenfall nära gränsen",
    description:
      "Vattenfall i dalens nordvästra hörn, nära Stekenjokk och norska gränsen.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "kullafallet",
    name: "Kullafallet — 7 forsar",
    category: "sevart",
    coord: [65.0763, 14.7854],
    blurb: "Rastplats vid forsarna",
    description:
      "Rastplats med grillplats där Vildmarksvägen följer en rad forsar nära " +
      "Klimpfjäll — flera fall på kort sträcka.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "grytsjo-skvaltkvarn",
    name: "Grytsjö skvaltkvarn",
    category: "kultur",
    coord: [65.002, 15.54],
    blurb: "Gammal vattendriven kvarn",
    description:
      "En skvaltkvarn — en liten vattendriven kvarn — bevarad vid Grytsjö. " +
      "Minne från självhushållets tid i dalen.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "bjornknasen",
    name: "Björnknäsen",
    category: "sevart",
    coord: [65.2604, 15.5041],
    blurb: "Utsiktsplats vid Kittelfjäll",
    description:
      "Utsiktsplats i Kittelfjällsområdet nordost om Kultsjödalen, med vy över " +
      "de omgivande fjällen.",
    facts: [], image: "", source: "OpenStreetMap",
  },
  {
    id: "norgefarargarden",
    name: "Norgefarargården",
    category: "kultur",
    coord: [65.06241, 14.7956],
    blurb: "Nybyggargård från 1832 i Klimpfjäll",
    description:
      "Hembygdsgård och museum i Klimpfjäll som berättar om norgefararna — " +
      "handelsfärderna över fjället till Norge — och om nybyggarlivet i dalens " +
      "västligaste by. Gården är från 1832. Härifrån utgår också Norgefararleden, " +
      "vandringsleden som följer den gamla färdvägen mot gränsen.",
    facts: [["Byggd", "1832"], ["Typ", "Hembygdsgård & museum"]],
    image: "",
    source: "Visit Vilhelmina, OpenStreetMap",
  },
  {
    id: "grillkojan-trappstegsforsen",
    name: "Grillkojan vid Trappstegsforsen",
    category: "boende",
    coord: [64.9575, 15.4655],
    blurb: "Café & servering vid forsen",
    description:
      "Servering vid Trappstegsforsen — fika och enklare mat med Sveriges kanske " +
      "mest fotograferade vattenfall som utsikt. Vid rastplatsen finns även " +
      "turistinformation. Öppet sommartid.",
    facts: [["Säsong", "Sommar"]],
    image: "",
    source: "Visit Vilhelmina",
  },
  {
    id: "helikopterturer-klimpfjall",
    name: "Helikopterturer Klimpfjäll",
    category: "sevart",
    coord: [65.06122, 14.80798],
    blurb: "Fjällflyg & sightseeing från helikopterplattan",
    description:
      "Från helikopterplattan i Klimpfjäll flygs sightseeing- och fjällturer över " +
      "Stekenjokk, Marsfjällen och gränsfjällen — även transport till fiskevatten " +
      "och toppar. Norrhelikopter är baserade här; helikopterturer bokas även via " +
      "Arctic Air (se Visit Vilhelmina).",
    website: "http://norrhelikopter.se/",
    facts: [["Bas", "Klimpfjäll"]],
    image: "",
    source: "Visit Vilhelmina, OpenStreetMap",
  },
  {
    id: "mtb-stekenjokk",
    name: "MTB på Stekenjokk",
    category: "led",
    coord: [65.093, 14.455],
    blurb: "Sommarcykling på kalfjällsplatån",
    description:
      "Stekenjokkplatån bjuder på stigcykling i öppen kalfjällsterräng — grusvägar " +
      "och stigar kring gruvområdet och platån, med vida vyer åt alla håll. " +
      "Säsongen är kort (vägen öppnar ca 6 juni) och vädret slår om snabbt — " +
      "packa vindskydd. Respektera stopp- och parkeringsförbudet 6 jun–15 jul, " +
      "parkera vid Stekenjokk- eller Tjåkkolaparkeringen.",
    facts: [["Säsong", "Jun–sep"], ["Terräng", "Kalfjäll & grus"]],
    image: "",
    source: "Visit Vilhelmina",
  },
  {
    id: "satsfjallet",
    name: "Satsfjället (1105 m)",
    category: "led",
    coord: [64.93811, 15.24535],
    blurb: "Toppvandring med vy över Kultsjön",
    description:
      "Fjället söder om Kultsjön, mitt emot Saxnäs. En tacksam topptur med " +
      "utsiktspunkt på toppen (1105 m) och vidsträckt vy över Kultsjön, " +
      "Marsfjällen och dalen. Väster om toppen ligger Satsfjällets naturreservat " +
      "med gammelskog.",
    facts: [["Höjd", "1105 m"], ["Utgångspunkt", "Saxnäs-sidan"]],
    image: "",
    source: "OpenStreetMap",
  },
  {
    id: "sagostigen-dikanas",
    name: "Sagostigen i Dikanäs",
    category: "led",
    coord: [65.24706, 15.52225],
    blurb: "Familjevandring med sagofigurer",
    description:
      "Kort och barnvänlig vandringsstig i Dikanäs där sagofigurer och " +
      "berättelser kantar vägen — perfekt första fjällvandring för de minsta. " +
      "Stigen hänger ihop med Vojmåstigen längs älven.",
    facts: [["Passar", "Barnfamiljer"], ["Längd", "Kort slinga"]],
    image: "",
    source: "OpenStreetMap",
  },
  {
    id: "bernhard-nordh-utstallningen",
    name: "Bernhard Nordh-utställningen",
    category: "kultur",
    coord: [65.0298, 15.3705],
    blurb: "Om författaren till 'I Marsfjällets skugga'",
    description:
      "Utställning i Marsliden om Bernhard Nordh, vars romaner 'I Marsfjällets " +
      "skugga' (1937) och 'Fjällfolk' (1938) bygger på nybyggarlivet just här. " +
      "Nordh bodde i Marsliden sommaren 1936 och samlade berättelser från byborna. " +
      "Utställningen drivs av Marslidens intresseförening och håller öppet " +
      "sommartid (ca juni–augusti).",
    website: "https://marsliden.se/",
    facts: [["Öppet", "Sommartid"], ["Arrangör", "Marslidens intresseförening"]],
    image: "",
    source: "Marslidens intresseförening, Visit Vilhelmina",
  },
];
