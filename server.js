const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const HOST = "0.0.0.0";
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function firstTextFromResponse(apiData) {
  if (typeof apiData?.output_text === "string" && apiData.output_text.trim()) {
    return apiData.output_text;
  }
  const out = apiData?.output;
  if (!Array.isArray(out)) return "";
  const chunks = [];
  for (const item of out) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

async function handleDateIdeas(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: "OPENAI_API_KEY is not configured" });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (_err) {
    bad(res, "Invalid JSON");
    return;
  }

  const location = String(payload.location || "").trim();
  const preferences = String(payload.preferences || "").trim();
  const existingEvents = Array.isArray(payload.existingEvents) ? payload.existingEvents : [];
  if (!location) {
    bad(res, "Location is required");
    return;
  }

  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 28);

  const prompt = [
    `Create 6 local date ideas for ${location}.`,
    `Use dates between ${today.toISOString().slice(0, 10)} and ${end.toISOString().slice(0, 10)}.`,
    "Avoid conflicts with these existing events (best effort):",
    JSON.stringify(existingEvents),
    `Preferences: ${preferences || "No special preferences provided"}`,
    "Return strict JSON only as {\"ideas\":[{\"title\":string,\"date\":\"YYYY-MM-DD\",\"start_time\":\"HH:MM\",\"end_time\":\"HH:MM\",\"place\":string,\"notes\":string}]}",
  ].join("\n");

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      sendJson(res, 500, { error: `OpenAI request failed: ${errText}` });
      return;
    }

    const apiData = await openaiRes.json();
    const text = firstTextFromResponse(apiData).trim();
    const jsonStart = text.indexOf("{");
    const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
    const parsed = JSON.parse(jsonText || "{}");
    const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : [];

    sendJson(res, 200, { ideas: ideas.slice(0, 10) });
  } catch (err) {
    sendJson(res, 500, { error: `Could not generate ideas: ${err.message}` });
  }
}

async function handleState(req, res, url) {
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
    try {
      const body = await readJsonBody(req);
      if (typeof body !== "object" || body === null) {
        bad(res, "Invalid payload");
        return;
      }
      fs.writeFile(file, JSON.stringify(body), "utf8", (err) => {
        if (err) {
          sendJson(res, 500, { error: "Write failed" });
          return;
        }
        sendJson(res, 200, { ok: true });
      });
    } catch (_err) {
      bad(res, "Invalid JSON");
    }
    return;
  }

  res.writeHead(405);
  res.end();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/state") {
    await handleState(req, res, url);
    return;
  }

  if (url.pathname === "/api/date-ideas" && req.method === "POST") {
    await handleDateIdeas(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }

  serveFile(url.pathname, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Family calendar server running on http://${HOST}:${PORT}`);
});
