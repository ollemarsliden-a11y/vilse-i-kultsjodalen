// ===================================================================
//  Enkel statisk dev-server MED no-cache
// ===================================================================
//  python -m http.server saknar Cache-Control, vilket får webbläsaren att
//  servera gammal JS/CSS utan att revalidera. Denna server skickar
//  "Cache-Control: no-store" så att kodändringar alltid syns direkt.
//
//  Kör:  node server/dev-static.js      (serverar projektroten på :5177)
// ===================================================================

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5177;
const ROOT = path.join(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gpx": "application/gpx+xml",
};

http
  .createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (pathname === "/") pathname = "/index.html";

    // Förhindra att man tar sig ut ur projektroten.
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-store", // aldrig cacha under utveckling
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Dev-server (no-cache) på http://localhost:${PORT}`));
