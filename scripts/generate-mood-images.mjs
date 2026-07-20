// ===================================================================
//  Generera stämningsbilder för Vilse i Kultsjödalen
// ===================================================================
//  Använder Azure gpt-image (v1-API). Nyckel/endpoint läses från
//  sagostund-projektets .env så inga hemligheter hamnar i detta repo.
//
//  Kör:  node scripts/generate-mood-images.mjs
// ===================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ENV_PATH = "C:/dev/sagostund/.env";
const OUT_DIR = path.join(process.cwd(), "images");
const SIZE = "1536x1024"; // liggande stämningsbild
const QUALITY = "medium";

// Enkel .env-parser (bara det vi behöver).
async function loadEnv(p) {
  const txt = await readFile(p, "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const IMAGES = [
  {
    name: "hero-kultsjon",
    prompt:
      "A serene ultra-wide landscape of a long narrow sub-arctic mountain lake in " +
      "northern Sweden at golden hour. Calm mirror-like water reflecting rounded " +
      "bare fjäll peaks, low warm sunlight grazing the ridges, scattered birch and " +
      "pine along the shore, soft drifting mist. No people, no text, no buildings. " +
      "Photorealistic, cinematic, tranquil and vast mood.",
  },
  {
    name: "autumn-heath",
    prompt:
      "Autumn on a Swedish mountain heath. Foreground of glowing red and orange low " +
      "birch shrubs and lingonberry heath, a small clear stream winding through, " +
      "distant bare rounded fjäll peaks under crisp clear light. No people, no text. " +
      "Photorealistic, atmospheric, rich autumn colours.",
  },
  {
    name: "aurora-winter",
    prompt:
      "Northern lights over a snowy mountain valley in northern Sweden at night. " +
      "Green and faint violet aurora reflecting on a frozen lake, silhouettes of low " +
      "rounded mountains, deep blue starry winter sky, untouched snow. No people, no " +
      "text. Photorealistic, calm and magical mood.",
  },
  {
    name: "waterfall-summer",
    prompt:
      "A stepped waterfall cascading over rock ledges through a birch forest in the " +
      "northern Swedish wilderness in summer. Lush green foliage, rising mist, soft " +
      "overcast daylight, mossy boulders. No people, no text. Photorealistic, fresh " +
      "and wild mood.",
  },
];

async function genImage({ endpoint, key, deployment }, prompt) {
  const res = await fetch(`${endpoint.replace(/\/+$/, "")}/images/generations`, {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: deployment,
      prompt,
      size: SIZE,
      quality: QUALITY,
      n: 1,
      output_format: "png",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Inget bilddata i svaret.");
  return Buffer.from(b64, "base64");
}

async function main() {
  const env = await loadEnv(ENV_PATH);
  const cfg = {
    endpoint: env.AZURE_IMAGE_ENDPOINT,
    key: env.AZURE_IMAGE_KEY,
    deployment: env.AZURE_IMAGE_DEPLOYMENT || "gpt-image-1.5",
  };
  if (!cfg.endpoint || !cfg.key) throw new Error("Saknar AZURE_IMAGE_* i .env");

  await mkdir(OUT_DIR, { recursive: true });
  for (const img of IMAGES) {
    process.stdout.write(`Genererar ${img.name}… `);
    try {
      const buf = await genImage(cfg, img.prompt);
      const file = path.join(OUT_DIR, `${img.name}.png`);
      await writeFile(file, buf);
      console.log(`klar (${(buf.length / 1024).toFixed(0)} kB)`);
    } catch (e) {
      console.log(`FEL: ${e.message}`);
    }
  }
  console.log("Färdigt. Bilderna ligger i images/.");
}

main().catch((e) => {
  console.error("Fel:", e.message);
  process.exit(1);
});
