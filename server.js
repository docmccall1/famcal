const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, ".data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function bad(res, message) {
  sendJson(res, 400, { error: message });
}

function roomFile(room) {
  return path.join(DATA_DIR, `${room}.json`);
}

function validRoom(room) {
  return /^[a-z0-9_-]{4,64}$/i.test(room || "");
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "text/plain; charset=utf-8";
}

function serveFile(reqPath, res) {
  const cleanPath = reqPath === "/" ? "/index.html" : reqPath;
  const filePath = path.normalize(path.join(ROOT, cleanPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Cache-Control": "no-cache",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/state") {
    const room = url.searchParams.get("room");
    if (!validRoom(room)) {
      bad(res, "Invalid room id");
      return;
    }

    const file = roomFile(room);

    if (req.method === "GET") {
      fs.readFile(file, "utf8", (err, content) => {
        if (err) {
          if (err.code === "ENOENT") {
            res.writeHead(404);
            res.end();
            return;
          }
          sendJson(res, 500, { error: "Read failed" });
          return;
        }
        try {
          sendJson(res, 200, JSON.parse(content));
        } catch (_parseErr) {
          sendJson(res, 500, { error: "Corrupt room state" });
        }
      });
      return;
    }

    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 2 * 1024 * 1024) req.destroy();
      });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          if (typeof payload !== "object" || payload === null) {
            bad(res, "Invalid payload");
            return;
          }
          fs.writeFile(file, JSON.stringify(payload), "utf8", (err) => {
            if (err) {
              sendJson(res, 500, { error: "Write failed" });
              return;
            }
            sendJson(res, 200, { ok: true });
          });
        } catch (_err) {
          bad(res, "Invalid JSON");
        }
      });
      return;
    }

    res.writeHead(405);
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }

  serveFile(url.pathname, res);
});

server.listen(PORT, () => {
  console.log(`Family calendar server running on http://localhost:${PORT}`);
});
