// ===================================================================
//  i18n — gränssnittsöversättning (svenska = källa, engelska = tillägg)
// ===================================================================
//  Mekanik: den svenska texten ÄR nyckeln. t("Spara tips") ger den
//  engelska motsvarigheten när språket är "en", annars svenskan själv.
//  Saknas en översättning faller den tillbaka till svenska (aldrig tom).
//  Platstexter (byhistorik) översätts INTE maskinellt här — de kräver
//  mänsklig översättning. Se [[vilse-i-kultsjodalen-backlog]].
// ===================================================================

let LANG = localStorage.getItem("vik_lang") || "sv";

const I18N = {
  en: {
    // Splash & varumärke
    "Upptäck dalen och byarna — leder, smultronställen,": "Discover the valley and its villages — trails, berry spots,",
    "fiske, kultur och fornlämningar på kartan.": "fishing, culture and ancient remains on the map.",
    "Kom igång": "Get started",
    "Din guide till dalen": "Your guide to the valley",
    "Foto: Kultsjödalen": "Photo: Kultsjödalen",

    // Flikar
    "Upptäck": "Discover",
    "Karta": "Map",
    "Info": "Info",
    "Konto": "Account",

    // Startsida
    "Din guide till dalen — byar, leder, fiske, kultur och sevärdheter.":
      "Your guide to the valley — villages, trails, fishing, culture and sights.",
    "Byar & platser i dalen": "Villages & places in the valley",
    "Sevärt & natur": "Sights & nature",
    "Tryck på ett kort för att läsa mer och visa platsen på kartan.":
      "Tap a card to read more and show the place on the map.",
    "Utforska\nkartan": "Explore\nthe map",
    "Vandrings-\nleder": "Hiking\ntrails",
    "Boende\n& mat": "Stay\n& eat",

    // Kategorier
    "Leder & turer": "Trails & tours",
    "Fiske": "Fishing",
    "Smultronställen": "Hidden gems",
    "Kultur & fornlämningar": "Culture & heritage",
    "Sevärt": "Sights",
    "Boende & mat": "Stay & eat",
    "Toppar": "Peaks",

    // Kartlager-panel
    "Kartunderlag": "Base map",
    "Säsong": "Season",
    "☀️ Sommar": "☀️ Summer",
    "❄️ Vinter": "❄️ Winter",
    "❄️ Vinterinfo & säkerhet": "❄️ Winter info & safety",
    "Lavinprognos — Södra Lapplandsfjällen ↗": "Avalanche forecast — Southern Lapland ↗",
    "Skoterledskarta — Vilhelmina ↗": "Snowmobile trail map — Vilhelmina ↗",
    "Vildmarksvägen över Stekenjokk är vinterstängd (ca 15 okt–6 jun). Kontrollera alltid väder och lavinläge före fjällfärd.":
      "The Wilderness Road over Stekenjokk is closed in winter (approx. 15 Oct–6 Jun). Always check weather and avalanche conditions before heading into the mountains.",
    "Datalager": "Data layers",
    "Offline": "Offline",
    "⬇ Spara denna vy offline": "⬇ Save this view offline",
    "Sparar kartrutorna för det du ser nu, så de fungerar utan täckning.":
      "Saves the map tiles for what you see now, so they work without signal.",
    "Vyn sparad offline ✓": "View saved offline ✓",
    "Zooma in lite — då blir det lagom att spara.": "Zoom in a bit — then it's a sensible amount to save.",
    "Ingen karta att spara.": "No map to save.",
    "Offline-sparning fungerar i appen på mobilen, inte lokalt.":
      "Offline saving works in the app on your phone, not locally.",

    // Kartunderlag-namn
    "Terräng": "Terrain",
    "Satellit": "Satellite",
    "Fjällkarta": "Mountain map",

    // Datalager
    "Boende & service": "Stay & services",
    "Hotell, stugor, camping, mat, affärer & mackar (OpenStreetMap)":
      "Hotels, cabins, camping, food, shops & fuel (OpenStreetMap)",
    "Vandringsleder": "Hiking trails",
    "Utmärkta leder från OpenStreetMap — tryck på en led för namn":
      "Marked trails from OpenStreetMap — tap a trail for its name",
    "Statliga leder": "State trails",
    "Officiella leder & anordningar i skyddade områden (Länsstyrelsen)":
      "Official trails & facilities in protected areas (County Board)",
    "Fler leder & stigar": "More trails & paths",
    "Alla markerade leder & stigar från OpenStreetMap (Waymarked Trails)":
      "All marked trails & paths from OpenStreetMap (Waymarked Trails)",
    "Laddar leder & stigar…": "Loading trails & paths…",
    "Fornlämningar": "Ancient remains",
    "Live från Riksantikvarieämbetet — tryck på en lämning för info":
      "Live from the Swedish National Heritage Board — tap a site for info",

    // Platskort
    "Historia": "History",
    "🧭 Vägbeskrivning": "🧭 Directions",
    "Visa på kartan": "Show on map",
    "Redigera": "Edit",
    "Ta bort": "Remove",
    "Ta bort tips": "Remove tip",
    "⚑ Rapportera": "⚑ Report",
    "Hämtar väder…": "Fetching weather…",
    "härifrån": "from here",
    "Stämningsbild": "Mood image",
    "✓ Varit här": "✓ Been here",
    "❤ Favorit": "❤ Favourite",
    "Fornlämning": "Ancient site",
    "Källa: Riksantikvarieämbetet (Fornsök)": "Source: Swedish National Heritage Board",
    "Lämning": "Site",
    "lämningar här": "sites here",
    "Källa": "Source",

    // Kommentarer
    "Kommentarer": "Comments",
    "Inga kommentarer än — bli först!": "No comments yet — be the first!",
    "Skriv en kommentar…": "Write a comment…",
    "Skicka": "Send",
    "Logga in för att kommentera": "Sign in to comment",
    "Du · ": "You · ",
    "ta bort": "delete",

    // Nytt tips-formulär
    "Nytt tips": "New tip",
    "Redigera tips": "Edit tip",
    "Namn": "Name",
    "T.ex. Fin badvik": "E.g. Nice swimming spot",
    "Kategori": "Category",
    "Ort (by)": "Village",
    "Närmaste (automatiskt)": "Nearest (automatic)",
    "Året runt": "All year",
    "Beskrivning": "Description",
    "Berätta om platsen…": "Tell us about the place…",
    "Foto (valfritt)": "Photo (optional)",
    "📷 Ta foto eller välj bild": "📷 Take a photo or choose an image",
    "📷 Byt foto": "📷 Change photo",
    "Spara tips": "Save tip",
    "Spara ändringar": "Save changes",
    "Ditt tips delas med andra via molnet.": "Your tip is shared with others via the cloud.",

    // Rutter
    "Rutter": "Routes",
    "Rutt": "Route",
    "📥 Importera GPX-fil": "📥 Import GPX file",
    "Inga sparade rutter än. Importera en GPX-fil från din klocka eller telefon — t.ex. vägen upp på en topp.":
      "No saved routes yet. Import a GPX file from your watch or phone — e.g. the way up a peak.",
    "‹ Alla rutter": "‹ All routes",
    "Turer och GPX-rutter är tips — färd sker på egen risk. Se Info & fjällvett.":
      "Tours and GPX routes are tips — travel at your own risk. See Info & mountain safety.",
    "Längd": "Distance",
    "Stigning": "Ascent",
    "Utför": "Descent",
    "Högsta": "Highest",
    "Höjdprofil": "Elevation profile",
    "Spara rutt": "Save route",
    "Dela / exportera": "Share / export",

    // Konto
    "Logga in": "Sign in",
    "Logga in för att dela tips och foton med andra i dalen.":
      "Sign in to share tips and photos with others in the valley.",
    "Logga in med Google": "Sign in with Google",
    "eller": "or",
    "Inloggningslänk på mejlen": "Sign-in link by email",
    "din@epost.se": "you@email.com",
    "Skicka länk": "Send link",
    "Genom att bidra godkänner du att bilder du laddar upp visas i appen, att du har rätt till dem, och att inga identifierbara personer syns utan medgivande.":
      "By contributing you agree that images you upload may be shown in the app, that you hold the rights to them, and that no identifiable people appear without consent.",
    "Inloggad som": "Signed in as",
    "🛡️ Moderering": "🛡️ Moderation",
    "Logga ut": "Sign out",
    "Konto": "Account",
    "Moderering": "Moderation",

    // Admin — redigera plats
    "Redigera plats": "Edit place",
    "✏️ Redigera plats": "✏️ Edit place",
    "Kort beskrivning": "Short description",
    "Fakta (en per rad: Rubrik: värde)": "Facts (one per line: Label: value)",
    "Bilder": "Images",
    "📷 Ladda upp bild": "📷 Upload image",
    "Inga bilder än.": "No images yet.",
    "Dölj eller ta bort bilder som inte passar. Bilder du laddar upp måste du ha rätt till.":
      "Hide or remove images that don't fit. You must hold the rights to images you upload.",
    "Grundbild": "Base image",

    // Byhub
    "‹ Byar": "‹ Villages",
    "Att göra här": "Things to do",
    "platser": "places",
    "Inga registrerade platser nära byn än.": "No registered places near the village yet.",
    "+ Lägg till plats i listan": "+ Add a place to the list",
    "Bo & äta": "Stay & eat",
    "Boka ↗": "Book ↗",
    "Inget boende registrerat nära byn än.": "No accommodation registered near the village yet.",
    "Från besökare": "From visitors",
    "Inga besökartips än — bli först!": "No visitor tips yet — be the first!",
    "Lägg till tips vid byn": "Add a tip at this village",
    "På kartan": "On the map",
    "Visa byn på kartan": "Show village on the map",
    "Läs mer": "Read more",
    "Tipset placeras vid byn. Du kan flytta det på kartan sen.":
      "The tip is placed at the village. You can move it on the map later.",
    "Turer från byn": "Tours from the village",
    "Inga turer från byn än.": "No tours from the village yet.",
    "Importera GPX-tur": "Import GPX tour",
    "på din enhet": "on your device",
    "Lägg till bild": "Add photo",
    "Dela till byn": "Share to village",
    "Turen delad till byn!": "Tour shared to the village!",
    "Turen saknar spårdata.": "The tour has no track data.",
    "Boende & länkar (en per rad: Namn | länk | valfri notis)":
      "Lodging & links (one per line: Name | link | optional note)",
    "Visa": "Show",
    "Dölj": "Hide",
    "Ta bort bilden?": "Remove this image?",
    "Bild tillagd.": "Image added.",
    "Startsidans bakgrund uppdaterad.": "Start page background updated.",
    "Välkomstbilden uppdaterad.": "Welcome image updated.",
    "Logga in som admin.": "Sign in as admin.",

    // Info & fjällvett
    "Info & fjällvett": "Info & mountain safety",
    "Praktiskt inför besöket och vett i fjällen.": "Practical tips for your visit and sense in the mountains.",

    // Toaster & meddelanden
    "GPS stöds inte i den här webbläsaren.": "GPS is not supported in this browser.",
    "Söker din position…": "Locating you…",
    "Kunde inte hämta position. Tillåt platsåtkomst.": "Couldn't get your position. Allow location access.",
    "Tryck på kartan där platsen ligger.": "Tap the map where the place is.",
    "Ge platsen ett namn.": "Give the place a name.",
    "Laddar upp foto…": "Uploading photo…",
    "Förbereder foto…": "Preparing photo…",
    "Kunde inte läsa bilden.": "Couldn't read the image.",
    "Ändringar sparade.": "Changes saved.",
    "Tips delat! Nu syns det för alla.": "Tip shared! It's now visible to everyone.",
    "Tips delat!": "Tip shared!",
    "Tips sparat lokalt.": "Tip saved locally.",
    "Tips borttaget.": "Tip removed.",
    "Ta bort det här tipset?": "Remove this tip?",
    "Logga in för att dela tips.": "Sign in to share tips.",
    "Logga in för att reagera.": "Sign in to react.",
    "Logga in för att rapportera.": "Sign in to report.",
    "Tack, rapporten är skickad.": "Thanks, your report was sent.",
    "Varför rapporterar du?\n(t.ex. olämpligt, fel plats, personuppgifter, upphovsrätt)":
      "Why are you reporting this?\n(e.g. inappropriate, wrong location, personal data, copyright)",
    "Namn på rutten:": "Route name:",
    "Kunde inte skicka rapport.": "Couldn't send the report.",
    "Kunde inte spara reaktion.": "Couldn't save reaction.",
    "Kolla mejlen — inloggningslänk skickad!": "Check your email — sign-in link sent!",
    "Ange din e-post.": "Enter your email.",
    "Utloggad.": "Signed out.",
    "Söker lämning…": "Searching for a site…",
    "Ingen registrerad lämning just där — pröva att zooma in.": "No registered site right there — try zooming in.",
    "Kunde inte nå Riksantikvarieämbetet.": "Couldn't reach the National Heritage Board.",
    "Laddar boende & service…": "Loading stay & services…",
    "Laddar vandringsleder…": "Loading hiking trails…",
    "Laddar statliga leder från Länsstyrelsen…": "Loading state trails from the County Board…",
    "Fornlämningar laddas från Riksantikvarieämbetet…": "Loading ancient remains from the National Heritage Board…",
    "Vinterläge — skid/skoterleder & lavininfo.": "Winter mode — ski/snowmobile trails & avalanche info.",
    "Sommarläge.": "Summer mode.",
    "Rutt sparad.": "Route saved.",
    "Rutt borttagen.": "Route removed.",
    "Ta bort rutten?": "Remove this route?",
    "Inga spårpunkter i filen.": "No track points in the file.",
    "Kunde inte läsa GPX-filen.": "Couldn't read the GPX file.",
    "GPX exporterad.": "GPX exported.",

    // Språkväxlare
    "Språk / Language": "Language / Språk",
    "Platsbeskrivningar visas på svenska tills de översatts.":
      "Place descriptions are shown in Swedish until translated.",
  },
};

// Översätt en svensk källsträng till aktivt språk (fallback: svenskan själv).
function t(sv) {
  const m = I18N[LANG];
  return (m && m[sv]) || sv;
}

// Byt språk och ladda om (så allt renderas i det nya språket).
function setLang(l) {
  if (l === LANG) return;
  localStorage.setItem("vik_lang", l);
  location.reload();
}

// Byt statiska texter i HTML som är märkta med data-i18n / data-i18n-ph.
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  document.documentElement.lang = LANG;
}
