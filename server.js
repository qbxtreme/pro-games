require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const Stripe = require("stripe");

const PORT = parseInt(process.env.PORT || "8080", 10);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ROOT = __dirname;

const STRIPE_PACKS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "stripe-packs.json"), "utf8")
);

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey) : null;

function paymentsConfigured() {
  if (!stripe) return false;
  return Object.values(STRIPE_PACKS).every((pack) => pack.stripePriceId);
}

const CHAT_ROOMS = {};
let CHAT_NEXT_ID = 1;
const CHAT_MAX = 100;
const CHAT_MAX_TEXT = 120;
const CHAT_MAX_NAME = 16;

const GAME_REQUESTS_FILE = path.join(ROOT, "game-requests.jsonl");
const GAME_REQUEST_MAX = 500;
const PROGRESS_DIR = path.join(ROOT, "data", "player-progress");
const PROGRESS_MAX_BYTES = 512000;

function sanitizeGameRequestText(text) {
  return String(text || "").trim().slice(0, GAME_REQUEST_MAX);
}

function handleGameRequestApi(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return Promise.resolve(true);
  }

  return readBody(req).then((body) => {
    let data = {};
    try { data = JSON.parse(body || "{}"); } catch (_) {}
    const text = sanitizeGameRequestText(data.text);
    if (!text) return sendJson(res, 400, { error: "Please describe the game you want to make." });

    const from = sanitizeChatText(data.from || "Player", CHAT_MAX_NAME) || "Player";
    const entry = {
      id: Date.now(),
      from,
      text,
      time: new Date().toISOString(),
    };

    try {
      fs.appendFileSync(GAME_REQUESTS_FILE, JSON.stringify(entry) + "\n", "utf8");
    } catch (err) {
      console.error("game-request save error:", err.message);
    }

    const when = new Date(entry.time).toLocaleString();
    console.log("");
    console.log("========================================");
    console.log("🛠️  NEW GAME IDEA REQUEST");
    console.log(`    From: ${from}`);
    console.log(`    Idea: "${text}"`);
    console.log(`    Time: ${when}`);
    console.log(`    File: ${GAME_REQUESTS_FILE}`);
    console.log("========================================");
    console.log("");

    return sendJson(res, 200, { ok: true, request: entry });
  }).catch(() => sendJson(res, 400, { error: "Bad request." }));
}

function getChatRoom(room) {
  const key = String(room || "hub").replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "hub";
  if (!CHAT_ROOMS[key]) CHAT_ROOMS[key] = [];
  return CHAT_ROOMS[key];
}

function sanitizeChatText(text, max) {
  return String(text || "").trim().slice(0, max);
}

function handleChatApi(req, res, pathname, searchParams) {
  if (pathname === "/api/chat" && req.method === "GET") {
    const room = sanitizeChatText(searchParams.get("room") || "hub", 32);
    const since = parseInt(searchParams.get("since") || "0", 10) || 0;
    const messages = getChatRoom(room).filter((m) => m.id > since);
    sendJson(res, 200, { messages });
    return true;
  }

  if (pathname === "/api/chat" && req.method === "POST") {
    return readBody(req).then((body) => {
      let data = {};
      try { data = JSON.parse(body || "{}"); } catch (_) {}
      const room = sanitizeChatText(data.room || "hub", 32);
      const name = sanitizeChatText(data.name || "Player", CHAT_MAX_NAME) || "Player";
      const text = sanitizeChatText(data.text, CHAT_MAX_TEXT);
      if (!text) return sendJson(res, 400, { error: "Empty message." });

      const msg = { id: CHAT_NEXT_ID++, name, text, time: Date.now() };
      const list = getChatRoom(room);
      list.push(msg);
      if (list.length > CHAT_MAX) list.splice(0, list.length - CHAT_MAX);
      return sendJson(res, 200, { message: msg });
    }).catch(() => sendJson(res, 400, { error: "Bad request." }));
  }

  return false;
}

// --- Multiplayer (in-memory rooms) ---
const MP_PLAYERS = new Map();
const MP_STALE_MS = 15000;
const MP_MAX_PER_ROOM = 10;

function mpId() {
  return Math.random().toString(36).slice(2, 10);
}

function mpSanitizeRoom(s) {
  return String(s || "default").replace(/[^a-z0-9-_]/gi, "").slice(0, 32) || "default";
}

function mpCleanup() {
  const now = Date.now();
  for (const [id, p] of MP_PLAYERS) {
    if (now - p.lastSeen > MP_STALE_MS) MP_PLAYERS.delete(id);
  }
}

setInterval(mpCleanup, 5000);

function mpCountRoom(game, subroom) {
  mpCleanup();
  let n = 0;
  for (const p of MP_PLAYERS.values()) {
    if (p.game === game && p.subroom === subroom) n++;
  }
  return n;
}

function mpCount(game) {
  mpCleanup();
  let n = 0;
  for (const p of MP_PLAYERS.values()) {
    if (!game || p.game === game) n++;
  }
  return n;
}

function handleMultiplayerApi(req, res, pathname) {
  if (pathname === "/api/mp/join" && req.method === "POST") {
    return readBody(req).then((body) => {
      let data = {};
      try { data = JSON.parse(body || "{}"); } catch (_) {}
      const id = mpId();
      const game = mpSanitizeRoom(data.game);
      const subroom = mpSanitizeRoom(data.subroom);
      const roomCount = mpCountRoom(game, subroom);
      if (roomCount >= MP_MAX_PER_ROOM) {
        sendJson(res, 403, {
          error: "Server full",
          full: true,
          count: roomCount,
          max: MP_MAX_PER_ROOM,
        });
        return true;
      }
      const name = sanitizeChatText(data.name || "Player", CHAT_MAX_NAME) || "Player";
      MP_PLAYERS.set(id, {
        id, game, subroom, name,
        state: {},
        lastSeen: Date.now(),
      });
      sendJson(res, 200, { id, count: roomCount + 1, max: MP_MAX_PER_ROOM });
      return true;
    }).catch(() => { sendJson(res, 400, { error: "Bad request." }); return true; });
  }

  if (pathname === "/api/mp/update" && req.method === "POST") {
    return readBody(req).then((body) => {
      let data = {};
      try { data = JSON.parse(body || "{}"); } catch (_) {}
      const p = MP_PLAYERS.get(data.id);
      if (p) {
        p.state = data.state && typeof data.state === "object" ? data.state : {};
        if (data.subroom) p.subroom = mpSanitizeRoom(data.subroom);
        p.lastSeen = Date.now();
      }
      sendJson(res, 200, { ok: true });
      return true;
    }).catch(() => { sendJson(res, 400, { error: "Bad request." }); return true; });
  }

  if (pathname === "/api/mp/leave" && req.method === "POST") {
    return readBody(req).then((body) => {
      let data = {};
      try { data = JSON.parse(body || "{}"); } catch (_) {}
      if (data.id) MP_PLAYERS.delete(data.id);
      sendJson(res, 200, { ok: true });
      return true;
    }).catch(() => { sendJson(res, 400, { error: "Bad request." }); return true; });
  }

  return false;
}

async function handleMultiplayerGet(req, res, pathname, searchParams) {
  if (pathname === "/api/mp/peers" && req.method === "GET") {
    const game = mpSanitizeRoom(searchParams.get("game"));
    const subroom = mpSanitizeRoom(searchParams.get("subroom"));
    const except = searchParams.get("except") || "";
    const peers = [];
    for (const p of MP_PLAYERS.values()) {
      if (p.game !== game || p.subroom !== subroom || p.id === except) continue;
      peers.push({
        id: p.id,
        name: p.name,
        state: p.state,
        lastSeen: p.lastSeen,
      });
    }
    sendJson(res, 200, { peers, count: peers.length + (except ? 1 : 0), max: MP_MAX_PER_ROOM });
    return true;
  }

  if (pathname === "/api/mp/count" && req.method === "GET") {
    const game = searchParams.get("game");
    sendJson(res, 200, { count: mpCount(game ? mpSanitizeRoom(game) : null) });
    return true;
  }

  return false;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) reject(new Error("Body too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function ensureProgressDir() {
  fs.mkdirSync(PROGRESS_DIR, { recursive: true });
}

function progressFileForPlayer(player) {
  const id = crypto
    .createHash("sha256")
    .update(sanitizeChatText(player, CHAT_MAX_NAME).toLowerCase())
    .digest("hex")
    .slice(0, 24);
  return path.join(PROGRESS_DIR, `${id}.json`);
}

async function handleProgressApi(req, res, searchParams) {
  ensureProgressDir();

  if (req.method === "GET") {
    const player = searchParams.get("player");
    if (!player) {
      sendJson(res, 400, { error: "Missing player name." });
      return true;
    }
    const file = progressFileForPlayer(player);
    if (!fs.existsSync(file)) {
      sendJson(res, 200, { snapshot: null });
      return true;
    }
    try {
      const entry = JSON.parse(fs.readFileSync(file, "utf8"));
      sendJson(res, 200, { snapshot: entry.snapshot || null, savedAt: entry.savedAt || null });
    } catch (err) {
      console.error("progress read error:", err.message);
      sendJson(res, 200, { snapshot: null });
    }
    return true;
  }

  if (req.method === "POST") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}");
      const player = sanitizeChatText(body.player, CHAT_MAX_NAME);
      if (!player) return sendJson(res, 400, { error: "Missing player name." });
      const snapshot = body.snapshot;
      if (!snapshot || typeof snapshot !== "object") {
        return sendJson(res, 400, { error: "Missing snapshot." });
      }

      const encoded = JSON.stringify(snapshot);
      if (encoded.length > PROGRESS_MAX_BYTES) {
        return sendJson(res, 413, { error: "Save too large." });
      }

      const file = progressFileForPlayer(player);
      let keep = true;
      let existingAt = 0;
      if (fs.existsSync(file)) {
        try {
          const existing = JSON.parse(fs.readFileSync(file, "utf8"));
          existingAt = existing.savedAt || existing.snapshot?.savedAt || 0;
        } catch (_) {}
        const incomingAt = snapshot.savedAt || Date.now();
        if (incomingAt < existingAt - 2000) keep = false;
      }

      const savedAt = Date.now();
      if (keep) {
        fs.writeFileSync(
          file,
          JSON.stringify({ player, savedAt, snapshot: { ...snapshot, savedAt: snapshot.savedAt || savedAt } }),
          "utf8"
        );
      }

      sendJson(res, 200, { ok: true, savedAt: keep ? savedAt : existingAt, stored: keep });
      return true;
    } catch (err) {
      console.error("progress save error:", err.message);
      sendJson(res, 400, { error: "Bad request." });
      return true;
    }
  }

  return false;
}

async function handleApi(req, res, pathname, searchParams) {
  if (pathname === "/api/progress") {
    const handled = await handleProgressApi(req, res, searchParams);
    if (handled !== false) return;
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (pathname.startsWith("/api/chat")) {
    const handled = await handleChatApi(req, res, pathname, searchParams);
    if (handled !== false) return;
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  if (pathname.startsWith("/api/mp/")) {
    if (req.method === "GET") {
      const got = await handleMultiplayerGet(req, res, pathname, searchParams);
      if (got) return;
    } else {
      const result = await handleMultiplayerApi(req, res, pathname);
      if (result) return;
    }
    return sendJson(res, 404, { error: "Not found." });
  }

  if (pathname === "/api/game-request") {
    await handleGameRequestApi(req, res);
    return;
  }

  if (pathname === "/api/payments-ready" && req.method === "GET") {
    return sendJson(res, 200, { ready: paymentsConfigured() });
  }

  if (pathname === "/api/create-checkout" && req.method === "POST" && !stripe) {
    return sendJson(res, 503, {
      error: "Payments not configured. Add STRIPE_SECRET_KEY to a .env file and restart the server.",
    });
  }

  if (pathname === "/api/verify-session" && req.method === "GET" && !stripe) {
    return sendJson(res, 503, {
      error: "Payments not configured. Add STRIPE_SECRET_KEY to a .env file and restart the server.",
    });
  }

  if (!stripe) {
    return sendJson(res, 503, {
      error: "Payments not configured. Add STRIPE_SECRET_KEY to a .env file and restart the server.",
    });
  }

  if (pathname === "/api/create-checkout" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req) || "{}");
      const packId = body.packId;
      const pack = STRIPE_PACKS[packId];
      if (!pack) return sendJson(res, 400, { error: "Unknown token pack." });
      if (!pack.stripePriceId) {
        return sendJson(res, 503, { error: `Missing stripePriceId for ${packId} in stripe-packs.json.` });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: pack.stripePriceId, quantity: 1 }],
        success_url: `${BASE_URL}/?purchase=success&pack=${packId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/?purchase=cancelled`,
        metadata: {
          packId,
          tokens: String(pack.tokens),
        },
      });

      return sendJson(res, 200, { url: session.url });
    } catch (err) {
      console.error("create-checkout error:", err.message);
      return sendJson(res, 500, { error: "Could not start checkout. Check your Stripe key." });
    }
  }

  if (pathname === "/api/verify-session" && req.method === "GET") {
    try {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) return sendJson(res, 400, { error: "Missing session_id." });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const paid = session.payment_status === "paid";
      const packId = session.metadata?.packId;
      const pack = STRIPE_PACKS[packId];
      const tokens = pack ? pack.tokens : parseInt(session.metadata?.tokens || "0", 10);

      return sendJson(res, 200, {
        paid,
        packId,
        tokens,
        amountTotal: session.amount_total,
      });
    } catch (err) {
      console.error("verify-session error:", err.message);
      return sendJson(res, 400, { error: "Could not verify payment." });
    }
  }

  sendJson(res, 404, { error: "Not found." });
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(ROOT, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, "index.html");

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        return res.end("Not found");
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE_URL);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith("/api/")) {
    return handleApi(req, res, pathname, url.searchParams);
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`All Out running at ${BASE_URL}`);
  console.log("Multiplayer ON — max 10 players per server room.");
  console.log(`Game ideas save to ${GAME_REQUESTS_FILE}`);
  console.log(`Player progress backups in ${PROGRESS_DIR}`);
  if (!paymentsConfigured()) {
    console.log("Payments OFF — add STRIPE_SECRET_KEY to .env and stripePriceId values in stripe-packs.json.");
  } else {
    console.log("Payments ON — Pro Token checkout is ready.");
  }
});
