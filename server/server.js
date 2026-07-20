// ===================================================================
//  Vilse i Kultsjödalen — delad tips-backend
// ===================================================================
//  Minimal REST-server UTAN externa beroenden (Node inbyggda moduler).
//  Lagrar delade tips i en JSON-fil. Tänkt som referens/utvecklingsserver
//  — kan deployas som den är till t.ex. Azure App Service (Node), eller
//  bytas mot en riktig databas + blob storage senare.
//
//  Endpoints:
//    GET    /api/pois        -> alla delade tips
//    POST   /api/pois        -> skapa tips (server sätter id)
//    DELETE /api/pois/:id    -> ta bort tips
//    GET    /api/health      -> status
// ===================================================================

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "pois.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const MAX_UPLOAD = 8 * 1024 * 1024; // 8 MB rå-body

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

const IMG_EXT = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function readPois() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}
function writePois(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    // CORS — tillåt appen (som serveras från annan port) att anropa API:t.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    let tooBig = false;
    req.on("data", (c) => {
      data += c;
      if (data.length > MAX_UPLOAD) {
        tooBig = true;
        req.destroy();
      }
    });
    req.on("end", () => {
      if (tooBig) return resolve({ __tooBig: true });
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") return send(res, 204);

  // GET /api/health
  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, count: readPois().length });
  }

  // GET /api/pois
  if (req.method === "GET" && url.pathname === "/api/pois") {
    return send(res, 200, readPois());
  }

  // POST /api/pois
  if (req.method === "POST" && url.pathname === "/api/pois") {
    const poi = await readBody(req);
    if (!poi.name || !poi.coord) {
      return send(res, 400, { error: "name och coord krävs" });
    }
    const saved = {
      id: "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: String(poi.name).slice(0, 120),
      category: poi.category || "sevart",
      description: String(poi.description || "").slice(0, 2000),
      image: String(poi.image || "").slice(0, 500),
      coord: poi.coord,
      userAdded: true,
      createdAt: new Date().toISOString(),
    };
    const list = readPois();
    list.push(saved);
    writePois(list);
    return send(res, 201, saved);
  }

  // POST /api/uploads  { data: "data:image/webp;base64,..." } -> { url }
  if (req.method === "POST" && url.pathname === "/api/uploads") {
    const body = await readBody(req);
    if (body.__tooBig) return send(res, 413, { error: "bilden är för stor" });
    const match = /^data:(image\/(?:webp|jpeg|png));base64,(.+)$/.exec(body.data || "");
    if (!match) return send(res, 400, { error: "ogiltig bilddata" });
    const ext = IMG_EXT[match[1]];
    const buf = Buffer.from(match[2], "base64");
    const file = "img-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) + "." + ext;
    fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
    return send(res, 201, { url: "/uploads/" + file });
  }

  // GET /uploads/:file  -> serverar uppladdade foton
  const up = url.pathname.match(/^\/uploads\/([A-Za-z0-9._-]+)$/);
  if (req.method === "GET" && up) {
    const file = path.join(UPLOAD_DIR, up[1]);
    if (!fs.existsSync(file)) return send(res, 404, { error: "not found" });
    const ext = path.extname(file).slice(1);
    const mime = Object.keys(IMG_EXT).find((k) => IMG_EXT[k] === ext) || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mime,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000",
    });
    return fs.createReadStream(file).pipe(res);
  }

  // DELETE /api/pois/:id
  const m = url.pathname.match(/^\/api\/pois\/([^/]+)$/);
  if (req.method === "DELETE" && m) {
    const id = decodeURIComponent(m[1]);
    const list = readPois().filter((p) => p.id !== id);
    writePois(list);
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Vilse i Kultsjödalen — tips-API på http://localhost:${PORT}`);
});
