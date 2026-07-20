// ===================================================================
//  Ikoner — rena vektorglyfer per kategori (ersätter emoji)
// ===================================================================
//  Varje ikon ritas i ett 24×24-koordinatsystem med fill="currentColor",
//  så färgen ärvs från sammanhanget (vit i kartnål, kategorifärg i chip).
// ===================================================================

const ICON_GLYPHS = {
  // Fjäll / leder
  led: '<path d="M2 20h20L14.3 6.5 10.2 13.8 7.6 9.9z"/><path d="M13.2 8.1l1.1-1.6 1.1 1.9-1 .4z" fill="#fff" opacity=".65"/>',
  // Fisk
  fiske:
    '<path d="M21 12c-2.2-3.1-6.1-4.8-10-4.8-1.7 0-3.2.3-4.5 1L3 6.7v10.6l3.5-1.5c1.3.7 2.8 1 4.5 1 3.9 0 7.8-1.7 10-4.8z"/><circle cx="8.2" cy="10.6" r="1.1" fill="#fff"/>',
  // Bär / smultronställe (stjärna = pärla)
  smultron:
    '<path d="M12 2.5l2.9 6 6.6.7-4.9 4.4 1.3 6.5L12 16.8 6.1 20.1l1.3-6.5L2.5 9.2l6.6-.7z"/>',
  // Kultur (fjälltempel/monument)
  kultur:
    '<path d="M12 3 2.5 8.2V10h19V8.2zM5 11v6.5H4V20h16v-2.5h-1V11h-2.2v6.5h-2.7V11h-2.2v6.5H8.2V11z"/>',
  // Sevärt (öga/utsikt)
  sevart:
    '<path d="M12 5C6.4 5 2.3 9.6 1 12c1.3 2.4 5.4 7 11 7s9.7-4.6 11-7c-1.3-2.4-5.4-7-11-7zm0 11.2A4.2 4.2 0 1112 7.8a4.2 4.2 0 010 8.4z"/><circle cx="12" cy="12" r="2.1" fill="#fff"/>',
  // Boende (säng)
  boende:
    '<path d="M2 9a2 2 0 012-2h6a3 3 0 013 3v2h6a2 2 0 012 2v5h-2.2v-2.2H4.2V19H2zm2.4 1.6a1.9 1.9 0 103.8 0 1.9 1.9 0 00-3.8 0z"/>',
  // Mat & fik (gaffel + kniv)
  mat:
    '<path d="M6 2v6a2.2 2.2 0 001.6 2.1V22H9V10.1A2.2 2.2 0 0010.6 8V2H9.3v5H8.3V2H7.3v5H6.3V2zm10.4 0c-1.4 0-2.4 2.1-2.4 5.2 0 2.4 1 3.4 1.9 3.7V22h1.4V2z"/>',
  // Affär & service (kasse)
  service:
    '<path d="M6.5 7V6a3.5 3.5 0 017 0v1H20l-1 13H5L4 7zm2 0h4V6a1.5 1.5 0 00-3 0zm-.5 4a1 1 0 102 0h1a2 2 0 01-4 0zm6 0a1 1 0 102 0h1a2 2 0 01-4 0z"/>',
};

// SVG-sträng för en glyf i given färg och storlek.
function iconSvg(category, color = "currentColor", size = 20) {
  const g = ICON_GLYPHS[category] || ICON_GLYPHS.sevart;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}

// Kartnål (modern "droppe" med glyf) som Leaflet divIcon-HTML.
function pinHtml(category, color) {
  return `
    <div class="pin2" style="--pin:${color}">
      <div class="pin2-body">${iconSvg(category, "#fff", 18)}</div>
    </div>`;
}
