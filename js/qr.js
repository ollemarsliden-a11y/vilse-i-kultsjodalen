// ===================================================================
//  QR — ritar en QR-kod som SVG, helt lokalt
// ===================================================================
//  Ingen tjänst och inget bibliotek, så koden funkar även utan täckning
//  (och ingen adress läcker till en tredjepartsserver). Byte-läge enligt
//  ISO/IEC 18004: version 1–10, felkorrigering L/M/Q/H, Reed-Solomon och
//  de åtta standardmaskerna med vanlig poängsättning.
// ===================================================================

const QR = (() => {
  // Per version och felkorrigeringsnivå: [antal block, kodord/block,
  // datakodord/block]. Flera poster = block av olika längd.
  const ECB = {
    1:  { L: [[1, 26, 19]], M: [[1, 26, 16]], Q: [[1, 26, 13]], H: [[1, 26, 9]] },
    2:  { L: [[1, 44, 34]], M: [[1, 44, 28]], Q: [[1, 44, 22]], H: [[1, 44, 16]] },
    3:  { L: [[1, 70, 55]], M: [[1, 70, 44]], Q: [[2, 35, 17]], H: [[2, 35, 13]] },
    4:  { L: [[1, 100, 80]], M: [[2, 50, 32]], Q: [[2, 50, 24]], H: [[4, 25, 9]] },
    5:  { L: [[1, 134, 108]], M: [[2, 67, 43]], Q: [[2, 33, 15], [2, 34, 16]], H: [[2, 33, 11], [2, 34, 12]] },
    6:  { L: [[2, 86, 68]], M: [[4, 43, 27]], Q: [[4, 43, 19]], H: [[4, 43, 15]] },
    7:  { L: [[2, 98, 78]], M: [[4, 49, 31]], Q: [[2, 32, 14], [4, 33, 15]], H: [[4, 39, 13], [1, 40, 14]] },
    8:  { L: [[2, 121, 97]], M: [[2, 60, 38], [2, 61, 39]], Q: [[4, 40, 18], [2, 41, 19]], H: [[4, 40, 14], [2, 41, 15]] },
    9:  { L: [[2, 146, 116]], M: [[3, 58, 36], [2, 59, 37]], Q: [[4, 36, 16], [4, 37, 17]], H: [[4, 36, 12], [4, 37, 13]] },
    10: { L: [[2, 86, 68], [2, 87, 69]], M: [[4, 69, 43], [1, 70, 44]], Q: [[6, 43, 19], [2, 44, 20]], H: [[6, 43, 15], [2, 44, 16]] },
  };

  // Mittpunkter för justeringsmönstren (version 2 och uppåt).
  const ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };

  const ECL_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  // --- Galois-fältet GF(256), x^8 + x^4 + x^3 + x^2 + 1 -------------
  const EXP = new Uint8Array(256), LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  })();
  const mul = (a, b) => (a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0);

  function rsGenerator(degree) {
    let poly = [1], root = 1;
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) { next[j] ^= poly[j]; next[j + 1] ^= mul(poly[j], root); }
      poly = next; root = mul(root, 2);
    }
    return poly.slice(1); // monisk → utelämna ledande 1:an
  }

  function rsRemainder(data, gen) {
    const rest = new Array(gen.length).fill(0);
    for (const b of data) {
      const factor = b ^ rest.shift();
      rest.push(0);
      for (let i = 0; i < rest.length; i++) rest[i] ^= mul(gen[i], factor);
    }
    return rest;
  }

  // --- Kodord --------------------------------------------------------
  const dataCount = (v, ecl) => ECB[v][ecl].reduce((s, b) => s + b[0] * b[2], 0);

  function pickVersion(byteLen, ecl) {
    for (let v = 1; v <= 10; v++) {
      const need = 4 + (v < 10 ? 8 : 16) + byteLen * 8;
      if (need <= dataCount(v, ecl) * 8) return v;
    }
    throw new Error("Texten är för lång för en QR-kod (max ~200 tecken).");
  }

  function buildData(bytes, v, ecl) {
    const bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(0b0100, 4);                       // byte-läge
    push(bytes.length, v < 10 ? 8 : 16);
    for (const b of bytes) push(b, 8);
    const capacity = dataCount(v, ecl) * 8;
    push(0, Math.min(4, capacity - bits.length));   // avslutare
    while (bits.length % 8) bits.push(0);
    const out = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      out.push(byte);
    }
    for (let pad = 0xec; out.length < capacity / 8; pad ^= 0xec ^ 0x11) out.push(pad);
    return out;
  }

  // Data- och felkorrigeringsblock varvas enligt standarden.
  function interleave(data, v, ecl) {
    const specs = ECB[v][ecl];
    const ecLen = specs[0][1] - specs[0][2];
    const gen = rsGenerator(ecLen);
    const blocks = [], ecBlocks = [];
    let pos = 0;
    for (const [count, , dataLen] of specs) {
      for (let i = 0; i < count; i++) {
        const blk = data.slice(pos, pos + dataLen); pos += dataLen;
        blocks.push(blk); ecBlocks.push(rsRemainder(blk, gen));
      }
    }
    const out = [];
    const maxLen = Math.max(...blocks.map((b) => b.length));
    for (let i = 0; i < maxLen; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
    for (let i = 0; i < ecLen; i++) for (const b of ecBlocks) out.push(b[i]);
    return out;
  }

  // --- Rutnätet ------------------------------------------------------
  function buildMatrix(codewords, v, ecl, forceMask) {
    const size = v * 4 + 17;
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, dark) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      mod[y][x] = dark; fn[y][x] = true;
    };

    // Tidsmönster först — sökmönstren ritas ovanpå.
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    // Sökmönster i tre hörn + separator runt om.
    for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, d !== 2 && d !== 4);
      }
    }
    // Justeringsmönster (ej i sökmönstrens hörn).
    const ap = ALIGN[v];
    for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
        set(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    // Reserverade ytor för formatinfo (index 6 är tidsmönster, hoppas över)
    // + den alltid mörka modulen.
    for (let i = 0; i < 9; i++) { if (i === 6) continue; set(i, 8, false); set(8, i, false); }
    for (let i = 0; i < 8; i++) { set(size - 1 - i, 8, false); set(8, size - 1 - i, false); }
    set(8, size - 8, true);
    // Versionsinfo (version 7 och uppåt).
    if (v >= 7) {
      let rem = v;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const bits = (v << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const dark = ((bits >>> i) & 1) === 1;
        set(i % 3 + size - 11, Math.floor(i / 3), dark);
        set(Math.floor(i / 3), i % 3 + size - 11, dark);
      }
    }

    // Datamodulerna läggs i sicksack, två kolumner i taget, från höger.
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;                    // kolumn 6 är tidsmönster
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (fn[y][x] || i >= codewords.length * 8) continue;
          mod[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }

    // Välj den mask som ger lägst poäng.
    let best = null, bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      if (forceMask != null && mask !== forceMask) continue;
      const cand = mod.map((row) => row.slice());
      applyMask(cand, fn, mask, size);
      drawFormat(cand, ecl, mask, size);
      const score = penalty(cand, size);
      if (score < bestScore) { bestScore = score; best = cand; }
    }
    return { size, modules: best };
  }

  function applyMask(m, fn, mask, size) {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (fn[y][x]) continue;
      let invert = false;
      switch (mask) {
        case 0: invert = (x + y) % 2 === 0; break;
        case 1: invert = y % 2 === 0; break;
        case 2: invert = x % 3 === 0; break;
        case 3: invert = (x + y) % 3 === 0; break;
        case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
        case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
      }
      if (invert) m[y][x] = !m[y][x];
    }
  }

  function drawFormat(m, ecl, mask, size) {
    const data = (ECL_BITS[ecl] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) m[i][8] = ((bits >>> i) & 1) === 1;
    m[7][8] = ((bits >>> 6) & 1) === 1;
    m[8][8] = ((bits >>> 7) & 1) === 1;
    m[8][7] = ((bits >>> 8) & 1) === 1;
    for (let i = 9; i < 15; i++) m[8][14 - i] = ((bits >>> i) & 1) === 1;
    for (let i = 0; i < 8; i++) m[8][size - 1 - i] = ((bits >>> i) & 1) === 1;
    for (let i = 8; i < 15; i++) m[size - 15 + i][8] = ((bits >>> i) & 1) === 1;
    m[size - 8][8] = true;
  }

  // Standardens fyra straffregler — lägst summa vinner.
  function penalty(m, size) {
    let score = 0;
    const runScore = (run) => (run >= 5 ? run - 2 : 0);
    for (let y = 0; y < size; y++) {
      for (const horiz of [true, false]) {
        let run = 1, prev = horiz ? m[y][0] : m[0][y];
        for (let x = 1; x < size; x++) {
          const cur = horiz ? m[y][x] : m[x][y];
          if (cur === prev) run++;
          else { score += runScore(run); run = 1; prev = cur; }
        }
        score += runScore(run);
      }
    }
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
    // 1:1:3:1:1-mönstret med fyra ljusa moduler före eller efter (utanför
    // symbolen räknas som ljust — där ligger tysta zonen). Träffar räknas
    // inte överlappande: sökningen hoppar förbi mönstret.
    const PAT = [true, false, true, true, true, false, true];
    const at = (y, x, horiz) => (x < 0 || x >= size ? false : horiz ? m[y][x] : m[x][y]);
    const anyDark = (y, from, to, horiz) => {
      for (let x = Math.max(from, 0); x < Math.min(to, size); x++) if (at(y, x, horiz)) return true;
      return false;
    };
    for (let y = 0; y < size; y++) for (const horiz of [true, false]) {
      let x = 0;
      while (x <= size - 7) {
        let hit = true;
        for (let k = 0; k < 7; k++) if (at(y, x + k, horiz) !== PAT[k]) { hit = false; break; }
        if (!hit) { x++; continue; }
        if (!anyDark(y, x - 4, x, horiz) || !anyDark(y, x + 7, x + 11, horiz)) { score += 40; x += 7; }
        else x += 4;
      }
    }
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
    const pct = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return score;
  }

  // --- Publikt -------------------------------------------------------
  // mask är valfri och används bara av testet mot ett referensbibliotek —
  // normalt väljs masken automatiskt.
  function encode(text, ecl = "M", mask) {
    const bytes = Array.from(new TextEncoder().encode(text));
    const v = pickVersion(bytes.length, ecl);
    return buildMatrix(interleave(buildData(bytes, v, ecl), v, ecl), v, ecl, mask);
  }

  // Returnerar en fristående SVG-sträng (mörka moduler som en enda path).
  function svg(text, opts = {}) {
    const { ecl = "M", quiet = 2, dark = "#111", light = "#fff", title = "" } = opts;
    const { size, modules } = encode(text, ecl);
    const dim = size + quiet * 2;
    let d = "";
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (modules[y][x]) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" ` +
      `shape-rendering="crispEdges" role="img"${title ? ` aria-label="${title}"` : ' aria-hidden="true"'}>` +
      `<rect width="${dim}" height="${dim}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
  }

  return { encode, svg };
})();
