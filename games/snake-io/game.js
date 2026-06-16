// Snake I.O. v3 — like real Slither.io

const VERSION = 3;
const WORLD_CX = 4000;
const WORLD_CY = 4000;
const WORLD_RX = 3600;
const WORLD_RY = 2600;
const WORLD_R = Math.max(WORLD_RX, WORLD_RY);

function arenaNorm(x, y) {
  return Math.hypot((x - WORLD_CX) / WORLD_RX, (y - WORLD_CY) / WORLD_RY);
}

function arenaPath(ctx, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(WORLD_CX, WORLD_CY, rx ?? WORLD_RX, ry ?? WORLD_RY, 0, 0, Math.PI * 2);
}
const BASE_SPEED = 3.1;
const BOOST_MULT = 1.85;
const BOT_COUNT = 28;
const FOOD_COUNT = 900;
const SAVE_KEY = "snakeIoBest";
const BEST_UNRANKED_KEY = "snakeIoBestUnranked";
const BEST_RANKED_KEY = "snakeIoBestRanked";
const HUB_STATS_KEY = "snakeIoHubStats";
const COINS_KEY = "snakeIoCoins";
const UNLOCKED_KEY = "snakeIoUnlockedSkins";
const FREE_SKIN_COUNT = 6;
const PEBBLE_COUNT = 1000;
const START_BIG_COST = 100;
const START_BIG_LENGTH = 1000;

const SNAKE_SKIN_OPTIONS = window.SNAKE_SKIN_OPTIONS || [
  { name: "Jungle Leaf", colors: ["#4caf50", "#2e7d32"], desc: "Default green snake." },
];

const SNAKE_COLORS = SNAKE_SKIN_OPTIONS.map((s) => s.colors);

const BOT_NAMES = [
  "Slither", "Viper", "Cobra", "Noodle", "Sigma", "Skibidi", "Rizz",
  "Coil", "Fang", "Glide", "Dash", "Loop", "Hiss", "Worm", "Scale",
  "Turbo", "Neon", "Ghost", "Zoom", "Mega", "Pro", "King", "Ace",
  "Bolt", "Flash", "Nova", "Byte", "Pixel",
];

let canvas, ctx, wrap;
let running = false;
let playerName = "You";
let playerColors = [...SNAKE_SKIN_OPTIONS[5].colors];
let pointer = { x: WORLD_CX, y: WORLD_CY };
let keysDown = {};
let cam = { x: 0, y: 0, zoom: 1 };
let snakes = [];
let foods = [];
let player = null;
let bestScore = 0;
let bestUnranked = 0;
let bestRanked = 0;
let hubStats = { games: 0, kills: 0 };
let lastDeathScore = 0;
let respawnStats = null;
let loopId = null;
let tick = 0;
let mouseBoost = false;
let moveJoy = { dx: 0, dy: 0, active: false };
let remoteSnakeIds = new Set();
let particles = [];
let pebbles = [];
let snakeCoins = 0;
let unlockedSkins = new Set([0, 1, 2, 3, 4, 5]);

let hubBgCanvas, hubBgCtx, hubAnimId = null, hubAnimating = false;
let hubDecorSnakes = [];
let hubDpr = 1;
let hubTick = 0;
let hubParticles = [];
let hubPebbles = [];
let selectedSkinIdx = 5;
let playerCosmetic = "none";
let rankedMode = false;
let highQuality = true;
let canvasDpr = 1;
let skinsGridBuilt = false;
const HQ_KEY = "snakeIoHighQuality";
const COSMETIC_KEY = "snakeIoCosmetic";
const RANKED_MODE_KEY = "snakeIoRankedMode";
const SERVER_KEY = "snakeIoServer";

let selectedServer = "na";
let partySubroom = "";
let settingsHome = null;

function spawnEatBurst(x, y, color) {
  const n = highQuality ? 14 : 8;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y, vx: Math.cos(a) * (2 + Math.random() * 4), vy: Math.sin(a) * (2 + Math.random() * 4),
      life: 0.5 + Math.random() * 0.35, t: 0, r: 2 + Math.random() * 3.5, color: color || "#fff",
    });
  }
}

function updateParticles() {
  particles = particles.filter((p) => {
    p.t += 0.016;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    return p.t < p.life;
  });
}

function drawParticles() {
  particles.forEach((p) => {
    const alpha = 1 - p.t / p.life;
    ctx.globalAlpha = alpha;
    if (highQuality) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.6);
      g.addColorStop(0, p.color);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = p.color;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawEntityShadow(x, y, rx, ry) {
  const soft = highQuality ? 1.35 : 1;
  const g = ctx.createRadialGradient(x + 3, y + 6, 0, x + 3, y + 6, rx * 1.55 * soft);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(0.45, "rgba(0,0,0,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 7, rx * soft, (ry || rx * 0.42) * soft, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnakeBodySphere(x, y, sr, base, alt, i, isHead) {
  if (highQuality && (isHead || i % 2 === 0)) {
    drawEntityShadow(x, y, sr * 1.05, sr * 0.42);
  }
  const lightX = x - sr * 0.38;
  const lightY = y - sr * 0.42;
  const grd = ctx.createRadialGradient(lightX, lightY, sr * 0.08, x + sr * 0.08, y + sr * 0.12, sr * 1.05);
  grd.addColorStop(0, shadeColor(base, isHead ? 55 : 42));
  grd.addColorStop(0.28, base);
  grd.addColorStop(0.72, shadeColor(i % 3 === 0 ? alt : base, -28));
  grd.addColorStop(1, shadeColor(alt, -58));
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, sr, 0, Math.PI * 2);
  ctx.fill();

  if (highQuality) {
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = Math.max(0.5, sr * 0.07);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(x - sr * 0.28, y - sr * 0.32, sr * 0.24, 0, Math.PI * 2);
    ctx.fill();
    if (i % 3 === 0 && sr > 3.5) {
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, sr * 0.82, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
}

function shadeColor(hex, amt) {
  if (!hex || !hex.startsWith("#")) return hex;
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt;
  let g = ((n >> 8) & 255) + amt;
  let b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

function skinPrice(idx) {
  if (idx < FREE_SKIN_COUNT) return 0;
  return 50 + (idx - FREE_SKIN_COUNT) * 40;
}

function isSkinUnlocked(idx) {
  return idx < FREE_SKIN_COUNT || unlockedSkins.has(idx);
}

function loadSnakeEconomy() {
  try {
    snakeCoins = parseInt(localStorage.getItem(COINS_KEY) || "0", 10) || 0;
    const raw = localStorage.getItem(UNLOCKED_KEY);
    if (raw) {
      unlockedSkins = new Set(JSON.parse(raw).map((n) => parseInt(n, 10)));
    } else {
      unlockedSkins = new Set([0, 1, 2, 3, 4, 5]);
    }
    for (let i = 0; i < FREE_SKIN_COUNT; i++) unlockedSkins.add(i);
  } catch (_) {
    snakeCoins = 0;
    unlockedSkins = new Set([0, 1, 2, 3, 4, 5]);
  }
}

function saveSnakeEconomy() {
  try {
    localStorage.setItem(COINS_KEY, String(snakeCoins));
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...unlockedSkins].sort((a, b) => a - b)));
  } catch (_) {}
  updateCoinDisplay();
}

function showHubToast(msg) {
  const el = document.getElementById("hub-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showHubToast._timer);
  showHubToast._timer = setTimeout(() => el.classList.add("hidden"), 2600);
}

function updateStartBigBtn() {
  const btn = document.getElementById("start-big-btn");
  const costEl = document.getElementById("start-big-cost");
  if (!btn) return;
  if (costEl) costEl.textContent = `${START_BIG_COST} 🪙`;
  const cantAfford = rankedMode && snakeCoins < START_BIG_COST;
  btn.classList.toggle("cant-afford", cantAfford);
  btn.title = cantAfford
    ? `Need ${START_BIG_COST} pebbles (you have ${snakeCoins})`
    : `Start ranked at ${START_BIG_LENGTH} length for ${START_BIG_COST} pebbles`;
}

function tryStartBig() {
  if (!rankedMode) return;
  if (snakeCoins < START_BIG_COST) {
    showHubToast(`Need ${START_BIG_COST} pebbles to Start Big — you have ${snakeCoins}`);
    return;
  }
  snakeCoins -= START_BIG_COST;
  saveSnakeEconomy();
  initGame({ startBig: true });
}

function updateCoinDisplay() {
  const text = `🪙 ${snakeCoins.toLocaleString()} pebbles`;
  document.getElementById("hub-score-pebbles")?.replaceChildren(document.createTextNode(String(snakeCoins)));
  document.getElementById("top-score-pebbles")?.replaceChildren(document.createTextNode(String(snakeCoins)));
  const shopEl = document.getElementById("snake-skins-coins");
  if (shopEl) shopEl.textContent = `Your pebbles: ${snakeCoins.toLocaleString()} 🪙`;
  updateStartBigBtn();
}

function showSkinShopToast(msg) {
  const el = document.getElementById("snake-skins-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showSkinShopToast._timer);
  showSkinShopToast._timer = setTimeout(() => el.classList.add("hidden"), 2600);
}

function makePebble() {
  const p = randInCircle();
  return {
    x: p.x,
    y: p.y,
    r: 3.2,
    rot: Math.random() * Math.PI,
    tone: ["#9e9e9e", "#a1887f", "#b0bec5", "#90a4ae"][Math.floor(Math.random() * 4)],
  };
}

function spawnPebbles() {
  pebbles = [];
  if (!rankedMode) return;
  for (let i = 0; i < PEBBLE_COUNT; i++) pebbles.push(makePebble());
}

function drawCollectiblePebble(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  const r = p.r;
  if (highQuality) {
    drawEntityShadow(0, 1, r * 1.15, r * 0.5);
    const rock = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15);
    rock.addColorStop(0, shadeColor(p.tone, 35));
    rock.addColorStop(0.45, p.tone);
    rock.addColorStop(1, shadeColor(p.tone, -45));
    ctx.fillStyle = rock;
  } else {
    ctx.fillStyle = p.tone;
  }
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.12, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = highQuality ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.28, -r * 0.3, r * 0.38, r * 0.22, -0.35, 0, Math.PI * 2);
  ctx.fill();
  if (highQuality) {
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();
}

function rebuildRemoteSnake(snake, x, y) {
  snake.syncX = x;
  snake.syncY = y;
  syncSnakeSegments(snake);
  const spacing = snakeRadiusFromSlither(snake) * 0.42;
  snake.segments = [];
  for (let i = 0; i < slitherSegmentsForSnake(snake); i++) {
    snake.segments.push({
      x: x - Math.cos(snake.angle) * spacing * i,
      y: y - Math.sin(snake.angle) * spacing * i,
    });
  }
}

function syncRemoteSnakes(peers) {
  const peerIds = new Set(peers.map((p) => p.id));
  snakes = snakes.filter((s) => !s.isRemote || peerIds.has(s.mpId));
  remoteSnakeIds = peerIds;

  peers.forEach((p) => {
    const st = p.state || {};
    if (st.alive === false) return;
    let snake = snakes.find((s) => s.mpId === p.id);
    if (!snake) {
      snake = createSnake(p.name || "Player", st.colors || randColorPair(), false);
      snake.isRemote = true;
      snake.mpId = p.id;
      snakes.push(snake);
    }
    snake.name = p.name || snake.name;
    if (st.colors) snake.colors = st.colors;
    snake.angle = st.angle ?? snake.angle;
    snake.targetAngle = snake.angle;
    if (st.sct != null) snake.sct = st.sct;
    if (st.fam != null) snake.fam = st.fam;
    if (st.rsc != null) snake.rsc = st.rsc;
    if (st.score != null && st.sct == null) {
      const tmp = newSlitherStats();
      addSlitherLength(tmp, Math.max(0, st.score - 10));
      snake.sct = tmp.sct;
      snake.fam = tmp.fam;
      snake.rsc = tmp.rsc;
    }
    snake.alive = true;
    snake.boosting = !!st.boosting;
    rebuildRemoteSnake(snake, st.x ?? WORLD_CX, st.y ?? WORLD_CY);
  });

  adjustBotsForMultiplayer(peers.length);
}

function adjustBotsForMultiplayer(peerCount) {
  const targetBots = Math.max(10, BOT_COUNT - peerCount);
  let bots = snakes.filter((s) => !s.isPlayer && !s.isRemote);
  while (bots.length > targetBots) {
    const s = bots.pop();
    snakes.splice(snakes.indexOf(s), 1);
  }
  while (snakes.filter((s) => !s.isPlayer && !s.isRemote).length < targetBots) {
    snakes.push(createSnake(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], randColorPair(), false));
  }
}

function getSnakeMpState() {
  if (!player?.alive) return { alive: false };
  const h = player.segments[0];
  return {
    x: h.x, y: h.y, angle: player.angle,
    sct: player.sct, fam: player.fam, rsc: player.rsc,
    score: getSlitherScore(player),
    colors: player.colors, alive: true, boosting: player.boosting,
  };
}

function loadHubStats() {
  try {
    const raw = localStorage.getItem(HUB_STATS_KEY);
    if (raw) hubStats = { games: 0, kills: 0, ...JSON.parse(raw) };
  } catch (_) {}
}

function saveHubStats() {
  try {
    localStorage.setItem(HUB_STATS_KEY, JSON.stringify(hubStats));
  } catch (_) {}
}

function updateScoreboard() {
  const yourScore = running && player?.alive ? getSlitherScore(player) : lastDeathScore;
  [
    ["hub-score-your", "hub-score-unranked", "hub-score-ranked", "hub-score-unranked-row", "hub-score-ranked-row"],
    ["top-score-your", "top-score-unranked", "top-score-ranked", "top-score-unranked-row", "top-score-ranked-row"],
  ].forEach(([yourId, unrankedId, rankedId, unrankedRowId, rankedRowId]) => {
    const yourEl = document.getElementById(yourId);
    const unrankedEl = document.getElementById(unrankedId);
    const rankedEl = document.getElementById(rankedId);
    if (yourEl) yourEl.textContent = String(yourScore);
    if (unrankedEl) unrankedEl.textContent = String(bestUnranked);
    if (rankedEl) rankedEl.textContent = String(bestRanked);
    document.getElementById(unrankedRowId)?.classList.toggle("active", !rankedMode);
    document.getElementById(rankedRowId)?.classList.toggle("active", rankedMode);
  });
  document.getElementById("hub-score-pebbles-row")?.classList.toggle("hidden", !rankedMode);
  document.getElementById("top-score-pebbles-row")?.classList.toggle("hidden", !rankedMode);
}

function updateHubDisplay() {
  const gamesEl = document.getElementById("hub-games-display");
  const killsEl = document.getElementById("hub-kills-display");
  if (gamesEl) gamesEl.textContent = `🎮 Runs: ${hubStats.games}`;
  if (killsEl) killsEl.textContent = `💀 Kills: ${hubStats.kills}`;
  updateCoinDisplay();
  updateScoreboard();
  drawSkinPreview();
}

function drawHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function hubDrawSize() {
  return { w: hubBgCanvas.width / hubDpr, h: hubBgCanvas.height / hubDpr };
}

function initHubAmbience(w, h) {
  hubParticles = [];
  const nPart = Math.floor((w * h) / 18000);
  for (let i = 0; i < Math.min(90, Math.max(40, nPart)); i++) {
    hubParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.08 - Math.random() * 0.35,
      alpha: 0.03 + Math.random() * 0.07,
      tw: Math.random() * Math.PI * 2,
    });
  }
  hubPebbles = [];
  const nPebb = Math.floor((w * h) / 28000);
  for (let i = 0; i < Math.min(50, Math.max(20, nPebb)); i++) {
    hubPebbles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.5 + Math.random() * 3.5,
      rot: Math.random() * Math.PI,
      tone: ["#90a4ae", "#78909c", "#8d6e63", "#b0bec5"][i % 4],
      drift: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
    });
  }
}

function updateHubAmbience(w, h) {
  hubParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -20) {
      p.y = h + 20;
      p.x = Math.random() * w;
    }
    if (p.x < -20) p.x = w + 20;
    if (p.x > w + 20) p.x = -20;
  });
  hubPebbles.forEach((p) => {
    p.x += Math.cos(p.drift + hubTick * 0.008) * p.speed * 0.3;
    p.y += Math.sin(p.drift + hubTick * 0.006) * p.speed * 0.25;
    if (p.x < -30) p.x = w + 30;
    if (p.x > w + 30) p.x = -30;
    if (p.y < -30) p.y = h + 30;
    if (p.y > h + 30) p.y = -30;
  });
}

function drawHubEntityShadow(ctx, x, y, rw, rh) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + rh * 0.55, rw, rh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHubSnakeSphere(ctx, x, y, sr, base, alt, i, isHead) {
  if (isHead || i % 2 === 0) drawHubEntityShadow(ctx, x, y, sr * 1.05, sr * 0.38);
  const lightX = x - sr * 0.38;
  const lightY = y - sr * 0.42;
  const grd = ctx.createRadialGradient(lightX, lightY, sr * 0.08, x + sr * 0.08, y + sr * 0.12, sr * 1.08);
  grd.addColorStop(0, shadeColor(base, isHead ? 55 : 42));
  grd.addColorStop(0.28, base);
  grd.addColorStop(0.72, shadeColor(i % 3 === 0 ? alt : base, -28));
  grd.addColorStop(1, shadeColor(alt, -58));
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, sr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = Math.max(0.5, sr * 0.07);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.arc(x - sr * 0.28, y - sr * 0.32, sr * 0.24, 0, Math.PI * 2);
  ctx.fill();
  if (isHead) {
    const ex = x + sr * 0.42;
    const ey1 = y - sr * 0.32;
    const ey2 = y + sr * 0.32;
    const er = sr * 0.26;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex, ey1, er, 0, Math.PI * 2);
    ctx.arc(ex, ey2, er, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(ex + sr * 0.1, ey1, er * 0.42, 0, Math.PI * 2);
    ctx.arc(ex + sr * 0.1, ey2, er * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHubSky(w, h) {
  const grd = hubBgCtx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, "#040c1f");
  grd.addColorStop(0.28, "#0a2459");
  grd.addColorStop(0.52, "#0d47a1");
  grd.addColorStop(0.78, "#1565c0");
  grd.addColorStop(1, "#031020");
  hubBgCtx.fillStyle = grd;
  hubBgCtx.fillRect(0, 0, w, h);

  const sunX = w * 0.68 + Math.sin(hubTick * 0.004) * 12;
  const sunY = h * 0.16 + Math.cos(hubTick * 0.003) * 8;
  const sun = hubBgCtx.createRadialGradient(sunX, sunY, 2, sunX, sunY, w * 0.48);
  sun.addColorStop(0, "rgba(255,252,230,0.35)");
  sun.addColorStop(0.12, "rgba(255,224,130,0.18)");
  sun.addColorStop(0.35, "rgba(100,181,246,0.12)");
  sun.addColorStop(1, "rgba(0,0,0,0)");
  hubBgCtx.fillStyle = sun;
  hubBgCtx.fillRect(0, 0, w, h);

  hubBgCtx.save();
  hubBgCtx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const ang = -0.4 + i * 0.18 + Math.sin(hubTick * 0.01 + i) * 0.04;
    hubBgCtx.beginPath();
    hubBgCtx.moveTo(sunX, sunY);
    hubBgCtx.lineTo(sunX + Math.cos(ang) * w * 1.2, sunY + Math.sin(ang) * h * 1.2);
    hubBgCtx.lineTo(sunX + Math.cos(ang + 0.08) * w * 1.2, sunY + Math.sin(ang + 0.08) * h * 1.2);
    hubBgCtx.closePath();
    hubBgCtx.fillStyle = `rgba(255,248,220,${0.018 + i * 0.004})`;
    hubBgCtx.fill();
  }
  hubBgCtx.restore();
}

function drawHubArenaGlow(w, h) {
  const cx = w * 0.5;
  const cy = h * 0.52;
  const arenaR = Math.min(w, h) * 0.36;
  hubBgCtx.save();
  const water = hubBgCtx.createRadialGradient(cx, cy, arenaR * 0.1, cx, cy, arenaR);
  water.addColorStop(0, "rgba(79,195,247,0.28)");
  water.addColorStop(0.55, "rgba(21,101,192,0.22)");
  water.addColorStop(0.85, "rgba(13,71,161,0.08)");
  water.addColorStop(1, "rgba(0,0,0,0)");
  hubBgCtx.fillStyle = water;
  hubBgCtx.beginPath();
  hubBgCtx.arc(cx, cy, arenaR, 0, Math.PI * 2);
  hubBgCtx.fill();

  hubBgCtx.strokeStyle = "rgba(144,202,249,0.25)";
  hubBgCtx.lineWidth = 2;
  hubBgCtx.beginPath();
  hubBgCtx.arc(cx, cy, arenaR, 0, Math.PI * 2);
  hubBgCtx.stroke();

  hubBgCtx.strokeStyle = "rgba(255,255,255,0.08)";
  hubBgCtx.lineWidth = 1;
  hubBgCtx.beginPath();
  hubBgCtx.arc(cx, cy, arenaR - 6, 0, Math.PI * 2);
  hubBgCtx.stroke();
  hubBgCtx.restore();
}

function drawHubHexGrid(w, h) {
  const size = 28;
  const hexH = size * Math.sqrt(3);
  const pulse = 0.5 + Math.sin(hubTick * 0.015) * 0.08;
  for (let row = -1; row < h / (hexH * 0.5) + 2; row++) {
    for (let col = -1; col < w / (size * 1.5) + 2; col++) {
      const x = col * size * 1.5 + (row % 2 ? size * 0.75 : 0);
      const y = row * hexH * 0.5;
      const dist = Math.hypot(x - w * 0.5, y - h * 0.52) / Math.min(w, h);
      const depth = (0.15 + (x / w) * 0.14 + (y / h) * 0.1) * (1 - dist * 0.35 * pulse);
      drawHex(hubBgCtx, x, y, size * 0.47);
      const lift = Math.sin(x * 0.04 + y * 0.03 + hubTick * 0.02) * 0.04;
      hubBgCtx.fillStyle = `rgba(25, 118, 210, ${depth + lift})`;
      hubBgCtx.fill();
      hubBgCtx.strokeStyle = `rgba(144, 202, 249, ${0.2 + depth * 0.45})`;
      hubBgCtx.lineWidth = 0.85;
      hubBgCtx.stroke();
    }
  }
}

function drawHubCaustics(w, h) {
  hubBgCtx.save();
  hubBgCtx.globalCompositeOperation = "screen";
  hubBgCtx.globalAlpha = 0.22;
  const cx = w * 0.5;
  const cy = h * 0.52;
  for (let i = 0; i < 6; i++) {
    const t = hubTick * 0.012 + i * 1.7;
    const px = cx + Math.sin(t) * w * 0.28 + Math.cos(t * 0.7) * 40;
    const py = cy + Math.cos(t * 0.85) * h * 0.22 + Math.sin(t * 0.5) * 30;
    const r = 60 + Math.sin(t * 1.3) * 25;
    const cg = hubBgCtx.createRadialGradient(px, py, 0, px, py, r);
    cg.addColorStop(0, "rgba(129,212,250,0.5)");
    cg.addColorStop(0.5, "rgba(79,195,247,0.15)");
    cg.addColorStop(1, "rgba(0,0,0,0)");
    hubBgCtx.fillStyle = cg;
    hubBgCtx.beginPath();
    hubBgCtx.arc(px, py, r, 0, Math.PI * 2);
    hubBgCtx.fill();
  }
  hubBgCtx.restore();
}

function drawHubAmbience(w, h) {
  hubPebbles.forEach((p) => {
    hubBgCtx.save();
    hubBgCtx.translate(p.x, p.y);
    hubBgCtx.rotate(p.rot + hubTick * 0.003);
    hubBgCtx.fillStyle = p.tone;
    hubBgCtx.globalAlpha = 0.35;
    hubBgCtx.beginPath();
    hubBgCtx.ellipse(0, 0, p.r * 1.1, p.r * 0.85, 0, 0, Math.PI * 2);
    hubBgCtx.fill();
    hubBgCtx.globalAlpha = 0.2;
    hubBgCtx.fillStyle = "#fff";
    hubBgCtx.beginPath();
    hubBgCtx.arc(-p.r * 0.25, -p.r * 0.2, p.r * 0.22, 0, Math.PI * 2);
    hubBgCtx.fill();
    hubBgCtx.restore();
  });

  hubBgCtx.save();
  hubBgCtx.globalCompositeOperation = "lighter";
  hubParticles.forEach((p) => {
    const a = p.alpha * (0.7 + Math.sin(hubTick * 0.04 + p.tw) * 0.3);
    hubBgCtx.fillStyle = `rgba(200, 230, 255, ${a})`;
    hubBgCtx.beginPath();
    hubBgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    hubBgCtx.fill();
  });
  hubBgCtx.restore();
}

function drawHubVignette(w, h) {
  const vg = hubBgCtx.createRadialGradient(
    w * 0.5, h * 0.45, Math.min(w, h) * 0.2,
    w * 0.5, h * 0.5, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(0.55, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  hubBgCtx.fillStyle = vg;
  hubBgCtx.fillRect(0, 0, w, h);

  const topFade = hubBgCtx.createLinearGradient(0, 0, 0, h * 0.18);
  topFade.addColorStop(0, "rgba(0,0,0,0.35)");
  topFade.addColorStop(1, "rgba(0,0,0,0)");
  hubBgCtx.fillStyle = topFade;
  hubBgCtx.fillRect(0, 0, w, h * 0.18);
}

function drawHubPostFX(w, h) {
  hubBgCtx.save();
  hubBgCtx.globalAlpha = 0.035;
  hubBgCtx.fillStyle = "#000";
  for (let y = 0; y < h; y += 3) {
    hubBgCtx.fillRect(0, y, w, 1);
  }
  hubBgCtx.restore();
}

function drawHubBackground(w, h) {
  drawHubSky(w, h);
  drawHubHexGrid(w, h);
  drawHubArenaGlow(w, h);
  drawHubCaustics(w, h);
  drawHubAmbience(w, h);
  drawHubVignette(w, h);
}

let hubLastW = 0;
let hubLastH = 0;
let skinPreviewAnimId = null;

function initHubDecorSnakes(w, h) {
  hubDecorSnakes = [];
  for (let i = 0; i < 10; i++) {
    const colors = SNAKE_COLORS[i % SNAKE_COLORS.length];
    const segs = [];
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    const angle = Math.random() * Math.PI * 2;
    const spacing = 8 + Math.random() * 3;
    for (let j = 0; j < 16 + Math.floor(Math.random() * 14); j++) {
      segs.push({
        x: sx - Math.cos(angle) * j * spacing,
        y: sy - Math.sin(angle) * j * spacing,
      });
    }
    hubDecorSnakes.push({
      segs,
      angle,
      speed: 0.7 + Math.random() * 1.4,
      turn: (Math.random() - 0.5) * 0.04,
      colors,
      wobble: Math.random() * Math.PI * 2,
      sizeMul: 0.85 + Math.random() * 0.35,
    });
  }
}

function updateHubDecorSnakes(w, h) {
  hubDecorSnakes.forEach((s) => {
    s.angle += s.turn + Math.sin(hubTick * 0.02 + s.wobble) * 0.008;
    const head = s.segs[0];
    const nx = head.x + Math.cos(s.angle) * s.speed;
    const ny = head.y + Math.sin(s.angle) * s.speed;
    s.segs.unshift({ x: nx, y: ny });
    s.segs.pop();
    if (nx < -80 || nx > w + 80 || ny < -80 || ny > h + 80) {
      s.angle += Math.PI * 0.5 + (Math.random() - 0.5);
    }
  });
}

function drawHubDecorSnake(s) {
  s.segs.forEach((seg, i) => {
    const t = i / s.segs.length;
    const r = (8 - t * 3.5) * s.sizeMul;
    const base = i % 3 === 0 ? s.colors[0] : s.colors[1];
    const alt = i % 3 === 0 ? s.colors[1] : s.colors[0];
    drawHubSnakeSphere(hubBgCtx, seg.x, seg.y, Math.max(3.5, r), base, alt, i, i === 0);
  });
}

function hubBgLoop() {
  if (!hubAnimating || !hubBgCtx || !hubBgCanvas) return;
  hubTick++;
  hubBgCtx.setTransform(hubDpr, 0, 0, hubDpr, 0, 0);
  const { w, h } = hubDrawSize();
  drawHubBackground(w, h);
  updateHubDecorSnakes(w, h);
  updateHubAmbience(w, h);
  hubDecorSnakes.forEach(drawHubDecorSnake);
  drawHubPostFX(w, h);
  hubBgCtx.setTransform(1, 0, 0, 1, 0, 0);
  hubAnimId = requestAnimationFrame(hubBgLoop);
}

function resizeHubBg() {
  if (!hubBgCanvas) return;
  hubDpr = Math.min(window.devicePixelRatio || 1, 2);
  hubBgCanvas.width = Math.round(window.innerWidth * hubDpr);
  hubBgCanvas.height = Math.round(window.innerHeight * hubDpr);
  hubBgCanvas.style.width = `${window.innerWidth}px`;
  hubBgCanvas.style.height = `${window.innerHeight}px`;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!hubDecorSnakes.length || Math.abs(w - hubLastW) > 50 || Math.abs(h - hubLastH) > 50) {
    initHubDecorSnakes(w, h);
    hubLastW = w;
    hubLastH = h;
  }
  initHubAmbience(w, h);
}

function skinPreviewLoop() {
  if (!hubAnimating) {
    skinPreviewAnimId = null;
    return;
  }
  drawSkinPreview();
  skinPreviewAnimId = requestAnimationFrame(skinPreviewLoop);
}

function startHubAnim() {
  hubAnimating = true;
  resizeHubBg();
  if (hubAnimId) cancelAnimationFrame(hubAnimId);
  hubBgLoop();
  if (!skinPreviewAnimId) skinPreviewLoop();
}

function stopHubAnim() {
  hubAnimating = false;
  if (hubAnimId) {
    cancelAnimationFrame(hubAnimId);
    hubAnimId = null;
  }
  if (skinPreviewAnimId) {
    cancelAnimationFrame(skinPreviewAnimId);
    skinPreviewAnimId = null;
  }
}

function drawMiniSnake(pctx, colors, w, h, t = 0) {
  pctx.clearRect(0, 0, w, h);
  const bg = pctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0a2f6e");
  bg.addColorStop(0.5, "#1565c0");
  bg.addColorStop(1, "#0d357a");
  pctx.fillStyle = bg;
  pctx.fillRect(0, 0, w, h);

  pctx.save();
  pctx.globalCompositeOperation = "screen";
  pctx.globalAlpha = 0.35;
  const cx = w * 0.5 + Math.sin(t * 0.03) * 8;
  const cg = pctx.createRadialGradient(cx, h * 0.4, 0, cx, h * 0.5, w * 0.6);
  cg.addColorStop(0, "rgba(129,212,250,0.4)");
  cg.addColorStop(1, "rgba(0,0,0,0)");
  pctx.fillStyle = cg;
  pctx.fillRect(0, 0, w, h);
  pctx.restore();

  pctx.strokeStyle = "rgba(144,202,249,0.25)";
  pctx.lineWidth = 1.5;
  pctx.strokeRect(1, 1, w - 2, h - 2);

  const segs = [];
  const count = Math.max(12, Math.floor(w / 10));
  for (let i = 0; i < count; i++) {
    const prog = i / (count - 1);
    segs.push({
      x: 14 + prog * (w - 28),
      y: h / 2 + Math.sin(prog * 4.2 + t * 0.04) * (h * 0.18),
    });
  }
  segs.forEach((seg, i) => {
    const sr = Math.max(5, h * 0.28 - i * 0.35);
    const base = i % 3 === 0 ? colors[0] : colors[1];
    const alt = i % 3 === 0 ? colors[1] : colors[0];
    drawHubSnakeSphere(pctx, seg.x, seg.y, sr, base, alt, i, i === 0);
  });
}

function drawSkinPreview() {
  const c = document.getElementById("skin-preview-canvas");
  if (!c) return;
  drawMiniSnake(c.getContext("2d"), playerColors, c.width, c.height, hubTick);
}

function selectSkinIdx(idx) {
  idx = ((idx % SNAKE_SKIN_OPTIONS.length) + SNAKE_SKIN_OPTIONS.length) % SNAKE_SKIN_OPTIONS.length;
  if (!isSkinUnlocked(idx)) {
    const price = skinPrice(idx);
    if (snakeCoins >= price) {
      snakeCoins -= price;
      unlockedSkins.add(idx);
      saveSnakeEconomy();
      showSkinShopToast(`Unlocked ${SNAKE_SKIN_OPTIONS[idx].name}!`);
    } else {
      showSkinShopToast(`Need ${price} pebbles — you have ${snakeCoins}`);
      return;
    }
  }
  selectedSkinIdx = idx;
  playerColors = [...SNAKE_SKIN_OPTIONS[selectedSkinIdx].colors];
  localStorage.setItem("snakeIoColorIdx", String(selectedSkinIdx));
  refreshSnakeSkinCards();
  document.querySelectorAll(".snake-skin-pick, .color-pick").forEach((btn) => {
    btn.classList.toggle("selected", parseInt(btn.dataset.idx, 10) === selectedSkinIdx);
  });
  drawSkinPreview();
}

function mountSettingsBesideChat() {
  const chatRoot = document.querySelector(".game-chat-root");
  const settingsBtn = document.getElementById("settings-btn");
  const toggle = document.getElementById("game-chat-toggle");
  const header = document.getElementById("game-header");
  if (!settingsBtn || !header) return;
  if (!settingsHome) settingsHome = header;
  if (chatRoot && toggle && settingsBtn.parentElement !== chatRoot) {
    chatRoot.insertBefore(settingsBtn, toggle);
  }
}

function restoreSettingsToHeader() {
  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn && settingsHome && settingsBtn.parentElement !== settingsHome) {
    settingsHome.appendChild(settingsBtn);
  }
}

function syncSettingsPanel() {
  const hqToggle = document.getElementById("hq-toggle");
  if (hqToggle) hqToggle.checked = highQuality;
}

function refreshSnakeSkinCards() {
  document.querySelectorAll(".snake-skin-card").forEach((btn) => {
    const idx = parseInt(btn.dataset.idx, 10);
    const unlocked = isSkinUnlocked(idx);
    const price = skinPrice(idx);
    btn.classList.toggle("selected", idx === selectedSkinIdx);
    btn.classList.toggle("locked", !unlocked);
    let tag = btn.querySelector(".snake-skin-tag");
    if (!tag) {
      tag = document.createElement("span");
      btn.querySelector(".snake-skin-card-body")?.prepend(tag);
    }
    if (idx < FREE_SKIN_COUNT) {
      tag.className = "snake-skin-tag free";
      tag.textContent = "FREE";
    } else if (unlocked) {
      tag.className = "snake-skin-tag owned";
      tag.textContent = "OWNED";
    } else {
      tag.className = "snake-skin-tag price";
      tag.textContent = `${price} 🪙`;
    }
  });
}

function openSnakeSkinsMenu() {
  if (!skinsGridBuilt) {
    populateSnakeSkinsGrid();
    skinsGridBuilt = true;
  }
  updateCoinDisplay();
  refreshSnakeSkinCards();
  openOverlay("snake-skins-overlay");
}

function openOverlay(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

function closeOverlay(id) {
  document.getElementById(id)?.classList.add("hidden");
}

function populateSnakeSkinsGrid() {
  const grid = document.getElementById("snake-skins-grid");
  if (!grid) return;
  grid.innerHTML = "";
  SNAKE_SKIN_OPTIONS.forEach((skin, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "snake-skin-card" + (idx === selectedSkinIdx ? " selected" : "") + (!isSkinUnlocked(idx) ? " locked" : "");
    btn.dataset.idx = String(idx);
    const tagText =
      idx < FREE_SKIN_COUNT ? "FREE" : isSkinUnlocked(idx) ? "OWNED" : `${skinPrice(idx)} 🪙`;
    const tagClass =
      idx < FREE_SKIN_COUNT ? "free" : isSkinUnlocked(idx) ? "owned" : "price";
    btn.innerHTML =
      `<canvas class="snake-skin-preview" width="160" height="52" aria-hidden="true"></canvas>` +
      `<span class="snake-skin-card-body">` +
      `<span class="snake-skin-tag ${tagClass}">${tagText}</span>` +
      `<strong class="snake-skin-card-name">${skin.name}</strong>` +
      `<span class="snake-skin-card-desc">${skin.desc}</span>` +
      `</span>`;
    btn.addEventListener("click", () => selectSkinIdx(idx));
    grid.appendChild(btn);
    const canvas = btn.querySelector(".snake-skin-preview");
    if (canvas) drawMiniSnake(canvas.getContext("2d"), skin.colors, canvas.width, canvas.height);
  });
}

function populateSkinSwatches(container) {
  if (!container) return;
  container.innerHTML = "";
  SNAKE_SKIN_OPTIONS.forEach((skin, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-pick" + (idx === selectedSkinIdx ? " selected" : "");
    btn.dataset.idx = String(idx);
    btn.style.background = `linear-gradient(135deg, ${skin.colors[0]}, ${skin.colors[1]})`;
    btn.title = skin.name;
    btn.addEventListener("click", () => selectSkinIdx(idx));
    container.appendChild(btn);
  });
}

function applyCanvasQuality() {
  if (!canvas) return;
  canvas.style.imageRendering = highQuality ? "auto" : "pixelated";
  canvas.style.filter = highQuality
    ? "contrast(1.12) saturate(1.18) brightness(0.98)"
    : "contrast(1) saturate(0.95) brightness(0.92)";
  resize();
}

function setupSlitherHub() {
  hubBgCanvas = document.getElementById("hub-bg-canvas");
  hubBgCtx = hubBgCanvas?.getContext("2d");

  try {
    highQuality = localStorage.getItem(HQ_KEY) !== "0";
    if (localStorage.getItem(HQ_KEY) == null) {
      highQuality = true;
      localStorage.setItem(HQ_KEY, "1");
    }
    playerCosmetic = localStorage.getItem(COSMETIC_KEY) || "none";
    selectedServer = localStorage.getItem(SERVER_KEY) || "na";
  } catch (_) {}

  populateSkinSwatches(document.getElementById("skin-swatches"));
  populateSkinSwatches(document.getElementById("build-color-row"));

  applyCanvasQuality();

  document.getElementById("snake-skins-btn")?.addEventListener("click", openSnakeSkinsMenu);
  document.getElementById("reset-unranked-btn")?.addEventListener("click", () => resetUnrankedBest());
  document.getElementById("snake-skins-close-btn")?.addEventListener("click", () => closeOverlay("snake-skins-overlay"));
  document.getElementById("skin-close-btn")?.addEventListener("click", () => closeOverlay("skin-overlay"));
  document.getElementById("skin-prev-btn")?.addEventListener("click", () => selectSkinIdx(selectedSkinIdx - 1));
  document.getElementById("skin-next-btn")?.addEventListener("click", () => selectSkinIdx(selectedSkinIdx + 1));

  document.getElementById("server-close-btn")?.addEventListener("click", () => closeOverlay("server-overlay"));
  document.querySelectorAll(".server-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.server === selectedServer);
    btn.addEventListener("click", () => {
      selectedServer = btn.dataset.server || "na";
      try { localStorage.setItem(SERVER_KEY, selectedServer); } catch (_) {}
      document.querySelectorAll(".server-option").forEach((b) => {
        b.classList.toggle("selected", b.dataset.server === selectedServer);
      });
    });
  });

  document.getElementById("code-close-btn")?.addEventListener("click", () => closeOverlay("code-overlay"));
  document.getElementById("code-join-btn")?.addEventListener("click", () => {
    const code = document.getElementById("party-code-input")?.value.trim().slice(0, 12) || "";
    partySubroom = code;
    closeOverlay("code-overlay");
    initGame();
  });

  document.getElementById("build-close-btn")?.addEventListener("click", () => closeOverlay("build-overlay"));

  document.getElementById("cosmetic-close-btn")?.addEventListener("click", () => closeOverlay("cosmetic-overlay"));
  document.querySelectorAll(".cosmetic-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.cosmetic === playerCosmetic);
    btn.addEventListener("click", () => {
      playerCosmetic = btn.dataset.cosmetic;
      localStorage.setItem(COSMETIC_KEY, playerCosmetic);
      document.querySelectorAll(".cosmetic-option").forEach((b) => {
        b.classList.toggle("selected", b.dataset.cosmetic === playerCosmetic);
      });
      drawSkinPreview();
    });
  });

  ["skin-overlay", "snake-skins-overlay", "server-overlay", "code-overlay", "build-overlay", "cosmetic-overlay"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", (e) => {
      if (e.target.id === id) closeOverlay(id);
    });
  });

  window.addEventListener("resize", () => {
    if (hubAnimating) resizeHubBg();
  });

  document.getElementById("rank-mode-btn")?.addEventListener("click", () => {
    rankedMode = !rankedMode;
    try { localStorage.setItem(RANKED_MODE_KEY, rankedMode ? "1" : "0"); } catch (_) {}
    updateRankModeBtn();
  });
  updateRankModeBtn();

  ["privacy-link", "terms-link", "contact-link"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", (e) => {
      e.preventDefault();
      showHubToast("Coming soon.");
    });
  });
}

function updateRankModeBtn() {
  const btn = document.getElementById("rank-mode-btn");
  const startBigBtn = document.getElementById("start-big-btn");
  if (!btn) return;
  btn.textContent = rankedMode ? "Switch to Unranked" : "Switch to Ranked";
  btn.classList.toggle("ranked", rankedMode);
  btn.setAttribute("aria-pressed", rankedMode ? "true" : "false");
  startBigBtn?.classList.toggle("hidden", !rankedMode);
  updateStartBigBtn();
  updateScoreboard();
}

function showHub() {
  running = false;
  if (typeof GameMP !== "undefined") GameMP.stop();
  restoreSettingsToHeader();
  setJoystickVisible(false);
  moveJoy.dx = 0;
  moveJoy.dy = 0;
  moveJoy.active = false;
  mouseBoost = false;
  document.body.classList.add("snake-hub-active");
  document.getElementById("snake-main-hub")?.classList.remove("hidden");
  document.getElementById("app")?.classList.add("arena-hidden");
  document.getElementById("death-overlay")?.classList.add("hidden");
  document.getElementById("app")?.classList.remove("playing");
  document.getElementById("leaderboard")?.classList.add("hidden");
  document.getElementById("arena-settings-overlay")?.classList.add("hidden");
  updateHubDisplay();
  startHubAnim();
}

function resetUnrankedBest() {
  bestUnranked = 0;
  try {
    localStorage.setItem(BEST_UNRANKED_KEY, "0");
  } catch (_) {}
  bestScore = Math.max(bestUnranked, bestRanked);
  updateScoreboard();
  showHubToast("Highest unranked reset to 0.");
}

function loadBest() {
  loadSnakeEconomy();
  try {
    bestUnranked = parseInt(localStorage.getItem(BEST_UNRANKED_KEY) || "0", 10);
    bestRanked = parseInt(localStorage.getItem(BEST_RANKED_KEY) || "0", 10);
    if (localStorage.getItem(BEST_UNRANKED_KEY) == null) {
      const legacy = parseInt(localStorage.getItem(SAVE_KEY) || "0", 10);
      if (legacy > bestUnranked) bestUnranked = legacy;
    }
    bestScore = Math.max(bestUnranked, bestRanked);
  } catch (_) {}
  const savedName = localStorage.getItem("snakeIoName");
  const savedColor = localStorage.getItem("snakeIoColorIdx");
  if (savedName) document.getElementById("name-input").value = savedName;
  if (savedColor != null) {
    selectedSkinIdx = parseInt(savedColor, 10) % SNAKE_SKIN_OPTIONS.length;
    if (!isSkinUnlocked(selectedSkinIdx)) selectedSkinIdx = 5;
    playerColors = [...SNAKE_SKIN_OPTIONS[selectedSkinIdx].colors];
  }
  try {
    rankedMode = localStorage.getItem(RANKED_MODE_KEY) === "1";
  } catch (_) {}
  updateCoinDisplay();
}

function saveBest(n) {
  if (rankedMode) {
    if (n > bestRanked) {
      bestRanked = n;
      localStorage.setItem(BEST_RANKED_KEY, String(n));
    }
  } else if (n > bestUnranked) {
    bestUnranked = n;
    localStorage.setItem(BEST_UNRANKED_KEY, String(n));
  }
  bestScore = Math.max(bestUnranked, bestRanked);
  localStorage.setItem(SAVE_KEY, String(bestScore));
  updateScoreboard();
}

function randInCircle() {
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * 0.9;
  return { x: WORLD_CX + Math.cos(a) * WORLD_RX * r, y: WORLD_CY + Math.sin(a) * WORLD_RY * r };
}

function randColorPair() {
  return SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)];
}

function snakeRadius(snake) {
  return snakeRadiusFromSlither(snake);
}

function createSnake(name, colors, isPlayer) {
  const pos = randInCircle();
  const angle = Math.random() * Math.PI * 2;
  const stats = isPlayer ? newSlitherStats() : randomSlitherStats();
  const segments = [];
  const segCount = slitherSegmentsForSnake(stats);
  for (let i = 0; i < segCount; i++) {
    segments.push({
      x: pos.x - Math.cos(angle) * 6 * i,
      y: pos.y - Math.sin(angle) * 6 * i,
    });
  }
  return {
    name, colors, isPlayer, segments, angle, targetAngle: angle,
    sct: stats.sct, fam: stats.fam, rsc: stats.rsc,
    alive: true, boosting: false,
  };
}

function spawnFoods() {
  foods = [];
  for (let i = 0; i < FOOD_COUNT; i++) foods.push(makeFood());
}

function makeFood(big = false, color = null, pos = null, slitherLen = null) {
  const p = pos || randInCircle();
  const hue = Math.floor(Math.random() * 360);
  return {
    x: p.x, y: p.y,
    r: big ? 7 + Math.random() * 3 : 3.5 + Math.random() * 2.5,
    slitherLen: slitherLen ?? foodSlitherLength(big),
    color: color || `hsl(${hue}, 88%, 58%)`,
  };
}

function mpSubroom() {
  const base = rankedMode ? "ranked" : "unranked";
  const parts = [base, selectedServer];
  if (partySubroom) parts.push(partySubroom);
  return parts.join("-");
}

function startGameMultiplayer() {
  if (typeof GameMP === "undefined") return;
  if (typeof markGameMpCustom === "function") markGameMpCustom();
  GameMP.init({
    game: "snake-io",
    subroom: mpSubroom(),
    getName: () => playerName,
    getState: getSnakeMpState,
    onPeers: (peers) => { if (running) syncRemoteSnakes(peers); },
  });
  GameMP.start();
}

function savePlayerStatsForRespawn(snake) {
  respawnStats = {
    sct: snake.sct,
    fam: snake.fam,
    rsc: snake.rsc || 0,
    score: getSlitherScore(snake),
  };
}

function respawnPlayer() {
  if (rankedMode || !respawnStats) return;

  const idx = snakes.findIndex((s) => s.isPlayer);
  player = createSnake(playerName, playerColors, true);
  player.sct = respawnStats.sct;
  player.fam = respawnStats.fam;
  player.rsc = respawnStats.rsc;
  syncSnakeSegments(player);

  if (idx >= 0) snakes[idx] = player;
  else snakes.push(player);

  running = true;
  keysDown = {};
  mouseBoost = false;
  moveJoy.dx = 0;
  moveJoy.dy = 0;
  moveJoy.active = false;

  document.getElementById("death-overlay")?.classList.add("hidden");
  document.getElementById("app")?.classList.add("playing");
  document.getElementById("leaderboard")?.classList.remove("hidden");
  document.getElementById("slither-hud")?.classList.remove("hidden");
  setJoystickVisible(true);
  mountSettingsBesideChat();
  startGameMultiplayer();
  if (!loopId) loopId = requestAnimationFrame(gameLoop);
  updateScoreboard();
}

function initGame({ startBig = false, fromDeath = false } = {}) {
  if (fromDeath && rankedMode) return;
  if (startBig && !rankedMode) startBig = false;
  respawnStats = null;
  playerName = document.getElementById("name-input").value.trim() || "You";
  localStorage.setItem("snakeIoName", playerName);
  localStorage.setItem("snakeIoColorIdx", String(selectedSkinIdx));

  snakes = [];
  spawnFoods();
  spawnPebbles();
  player = createSnake(playerName, playerColors, true);
  if (startBig) {
    addSlitherLength(player, START_BIG_LENGTH);
    syncSnakeSegments(player);
  }
  snakes.push(player);
  for (let i = 0; i < BOT_COUNT; i++) {
    snakes.push(createSnake(BOT_NAMES[i % BOT_NAMES.length], randColorPair(), false));
  }

  running = true;
  keysDown = {};
  mouseBoost = false;
  moveJoy.dx = 0;
  moveJoy.dy = 0;
  moveJoy.active = false;
  tick = 0;
  stopHubAnim();
  document.body.classList.remove("snake-hub-active");
  document.getElementById("snake-main-hub")?.classList.add("hidden");
  document.getElementById("app")?.classList.remove("arena-hidden");
  document.getElementById("death-overlay")?.classList.add("hidden");
  document.getElementById("respawn-btn")?.classList.add("hidden");
  document.getElementById("death-ranked-note")?.classList.add("hidden");
  document.getElementById("app")?.classList.add("playing");
  if (!fromDeath) {
    hubStats.games += 1;
    saveHubStats();
  }
  document.getElementById("leaderboard")?.classList.remove("hidden");
  document.getElementById("slither-hud")?.classList.remove("hidden");
  document.getElementById("top-scoreboard")?.classList.remove("hidden");
  setJoystickVisible(true);
  // Canvas is first sized while #app is hidden (0×0); re-size once arena is visible.
  resize();
  requestAnimationFrame(resize);
  mountSettingsBesideChat();
  startGameMultiplayer();
  if (!loopId) loopId = requestAnimationFrame(gameLoop);
  updateScoreboard();
}

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function turnToward(cur, target, rate) {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + Math.max(-rate, Math.min(rate, d));
}

function getKeyAngle() {
  let dx = 0, dy = 0;
  if (keysDown.ArrowUp || keysDown.w || keysDown.W) dy -= 1;
  if (keysDown.ArrowDown || keysDown.s || keysDown.S) dy += 1;
  if (keysDown.ArrowLeft || keysDown.a || keysDown.A) dx -= 1;
  if (keysDown.ArrowRight || keysDown.d || keysDown.D) dx += 1;
  if (!dx && !dy) return null;
  return Math.atan2(dy, dx);
}

function getJoyAngle() {
  const m = Math.hypot(moveJoy.dx, moveJoy.dy);
  if (m < 0.12) return null;
  return Math.atan2(moveJoy.dy, moveJoy.dx);
}

function setJoystickVisible(visible) {
  document.getElementById("snake-joystick-wrap")?.classList.toggle("hidden", !visible);
  document.getElementById("snake-boost-btn")?.classList.toggle("hidden", !visible);
}

function distToCircleEdge(x, y) {
  const n = arenaNorm(x, y);
  if (n >= 1) return 0;
  return Math.min(WORLD_RX, WORLD_RY) * (1 - n);
}

function updateBot(snake) {
  const head = snake.segments[0];
  let nearest = null, bestD = Infinity;
  foods.forEach((f) => {
    const d = (f.x - head.x) ** 2 + (f.y - head.y) ** 2;
    if (d < bestD) { bestD = d; nearest = f; }
  });

  let flee = null;
  snakes.forEach((o) => {
    if (o === snake || !o.alive) return;
    for (let i = 0; i < Math.min(o.segments.length, 30); i += 2) {
      const s = o.segments[i];
      const d = Math.hypot(head.x - s.x, head.y - s.y);
      if (d < snakeRadius(snake) + snakeRadius(o) + 60) {
        flee = angleTo(s, head);
        break;
      }
    }
  });

  if (flee != null) snake.targetAngle = flee;
  else if (nearest && bestD < 500 ** 2) snake.targetAngle = angleTo(head, nearest);
  else snake.targetAngle += (Math.random() - 0.5) * 0.1;

  if (distToCircleEdge(head.x, head.y) < 120) {
    snake.targetAngle = angleTo(head, { x: WORLD_CX, y: WORLD_CY });
  }

  snake.boosting = Math.random() < 0.006 && getSlitherScore(snake) > 25;
}

function dropBoostPellet(snake) {
  const tail = snake.segments[snake.segments.length - 1];
  if (!tail || getSlitherScore(snake) <= 10) return;
  removeSlitherLength(snake, 0.75);
  foods.push(makeFood(false, snake.colors[0], { x: tail.x, y: tail.y }, 1 + Math.random() * 2));
  syncSnakeSegments(snake);
}

function updateSnake(snake) {
  if (!snake.alive || snake.isRemote) return;

  if (snake.isPlayer) {
    const joyAng = getJoyAngle();
    const keyAng = getKeyAngle();
    if (joyAng != null) snake.targetAngle = joyAng;
    else if (keyAng != null) snake.targetAngle = keyAng;
    else {
      const head = snake.segments[0];
      snake.targetAngle = angleTo(head, pointer);
    }
    snake.boosting = keysDown[" "] || keysDown.Shift || mouseBoost;
  } else {
    updateBot(snake);
  }

  snake.angle = turnToward(snake.angle, snake.targetAngle, snake.boosting ? 0.11 : 0.085);
  const score = getSlitherScore(snake);
  let speed = BASE_SPEED + Math.min(score * 0.008, 1.8);
  if (snake.boosting && score > 10) {
    speed *= BOOST_MULT;
    if (tick % 3 === 0) dropBoostPellet(snake);
  }

  const head = snake.segments[0];
  let nx = head.x + Math.cos(snake.angle) * speed;
  let ny = head.y + Math.sin(snake.angle) * speed;

  if (distToCircleEdge(nx, ny) < snakeRadius(snake) * 0.5) {
    killSnake(snake);
    return;
  }

  snake.segments.unshift({ x: nx, y: ny });
  const spacing = snakeRadius(snake) * 0.42;
  let dist = 0, i = 1;
  while (i < snake.segments.length) {
    const prev = snake.segments[i - 1];
    const seg = snake.segments[i];
    const dx = prev.x - seg.x, dy = prev.y - seg.y;
    const d = Math.hypot(dx, dy);
    dist += d;
    if (dist > spacing) {
      const t = spacing / d;
      seg.x = prev.x - dx * t;
      seg.y = prev.y - dy * t;
      dist = 0;
      i++;
    } else {
      snake.segments.splice(i, 1);
    }
  }

  const eatR = snakeRadius(snake);
  if (snake.isPlayer && rankedMode) {
    for (let pi = 0; pi < pebbles.length; pi++) {
      const p = pebbles[pi];
      if (Math.hypot(p.x - nx, p.y - ny) < eatR + p.r) {
        snakeCoins += 1;
        addSlitherLength(snake, 0.25);
        if (snake.isPlayer) window.GameSFX?.play("eat");
        spawnEatBurst(p.x, p.y, p.tone);
        saveSnakeEconomy();
        syncSnakeSegments(snake);
        pebbles[pi] = makePebble();
      }
    }
  }

  foods.forEach((f, fi) => {
    if (Math.hypot(f.x - nx, f.y - ny) < eatR + f.r) {
      addSlitherLength(snake, f.slitherLen);
      if (snake.isPlayer) window.GameSFX?.play("eat");
      spawnEatBurst(f.x, f.y, f.color);
      syncSnakeSegments(snake);
      foods[fi] = makeFood(Math.random() < 0.06);
    }
  });
}

function checkCollisions() {
  snakes.forEach((snake) => {
    if (!snake.alive) return;
    const head = snake.segments[0];
    const hr = snakeRadius(snake) * 0.42;
    snakes.forEach((other) => {
      if (!other.alive) return;
      // Pass through your own body — only other snakes can kill you.
      if (other === snake) return;
      for (let i = 0; i < other.segments.length; i++) {
        const seg = other.segments[i];
        const sr = snakeRadius(other) * 0.4;
        if (Math.hypot(head.x - seg.x, head.y - seg.y) < hr + sr) {
          killSnake(snake, other !== snake ? other : null);
          return;
        }
      }
    });
  });
}

function killSnake(snake, killer) {
  if (!snake.alive) return;
  snake.alive = false;
  if (killer?.isPlayer && !snake.isPlayer) {
    hubStats.kills += 1;
    saveHubStats();
  }
  const deadScore = getSlitherScore(snake);
  const drops = Math.min(30, Math.max(8, Math.floor(deadScore * 0.15)));
  for (let i = 0; i < drops; i++) {
    const seg = snake.segments[Math.floor(i * snake.segments.length / drops)] || snake.segments[0];
    const chunkLen = Math.max(1, deadScore / drops);
    foods.push(makeFood(i % 4 === 0, snake.colors[0], {
      x: seg.x + (Math.random() - 0.5) * 40,
      y: seg.y + (Math.random() - 0.5) * 40,
    }, chunkLen));
  }
  if (snake.isPlayer) onPlayerDeath();
}

function onPlayerDeath() {
  running = false;
  window.GameSFX?.play("lose");
  if (typeof GameMP !== "undefined") GameMP.stop();
  const score = getSlitherScore(player);
  lastDeathScore = score;
  saveBest(score);
  if (!rankedMode) savePlayerStatsForRespawn(player);
  const exc = score > 1000 ? "!" : "";
  const deathMsg = document.getElementById("death-msg");
  const respawnBtn = document.getElementById("respawn-btn");
  if (rankedMode) {
    if (deathMsg) {
      deathMsg.innerHTML = `<span style="opacity:.45;">Your final length was </span><b>${score}</b>${exc}`;
    }
    respawnBtn?.classList.add("hidden");
  } else {
    if (deathMsg) {
      deathMsg.innerHTML =
        `<span style="opacity:.45;">You died at length </span><b>${score}</b>${exc}` +
        `<span style="opacity:.45;"> — respawn to keep going with the same length.</span>`;
    }
    respawnBtn?.classList.remove("hidden");
  }
  document.getElementById("death-ranked-note")?.classList.toggle("hidden", !rankedMode);
  document.getElementById("share-toast")?.classList.add("hidden");
  document.getElementById("death-overlay").classList.remove("hidden");
  document.getElementById("app").classList.remove("playing");
  document.getElementById("leaderboard").classList.add("hidden");
  document.getElementById("slither-hud")?.classList.add("hidden");
  setJoystickVisible(false);
  updateScoreboard();
}

function getShareText() {
  const url = window.location.href.split("#")[0];
  const best = rankedMode ? bestRanked : bestUnranked;
  return {
    title: "Snake I.O. Score",
    text: `🐍 ${playerName} scored ${lastDeathScore} length in Snake.io! Best: ${best}. Can you beat me?`,
    url,
  };
}

function showShareToast(msg) {
  const el = document.getElementById("share-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showShareToast._timer);
  showShareToast._timer = setTimeout(() => el.classList.add("hidden"), 2500);
}

async function shareDeathScore() {
  const { title, text, url } = getShareText();
  const fullText = `${text}\n${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fullText);
      showShareToast("Score copied! Paste it to a friend.");
      return;
    } catch (_) {}
  }

  window.prompt("Copy your score and share it:", fullText);
}

function getLeaderboard() {
  return snakes.filter((s) => s.alive).sort((a, b) => getSlitherScore(b) - getSlitherScore(a)).slice(0, 10);
}

function updateHUD() {
  if (!player) return;
  const score = getSlitherScore(player);
  const alive = snakes.filter((s) => s.alive);
  const board = [...alive].sort((a, b) => getSlitherScore(b) - getSlitherScore(a));
  const rank = board.indexOf(player) + 1;
  const total = alive.length;

  const scoreEl = document.getElementById("score-display");
  const rankEl = document.getElementById("rank-display");
  if (scoreEl) {
    scoreEl.innerHTML =
      `<span class="slither-hud-label">Your length: </span><span class="slither-hud-value">${score}</span>`;
  }
  if (rankEl) {
    rankEl.innerHTML =
      `<span class="slither-hud-dim">Your rank: </span><span class="slither-hud-dim">${rank > 0 ? rank : "-"}</span>` +
      `<span class="slither-hud-dim"> of </span><span class="slither-hud-dim">${total}</span>`;
  }

  const lb = document.getElementById("leaderboard");
  if (!lb || !running) return;
  lb.innerHTML = getLeaderboard().map((s, i) =>
    `<div class="lb-row${s.isPlayer ? " you" : ""}${s.isRemote ? " remote" : ""}"><span class="lb-rank">${i + 1}.</span> ${s.name}${s.isRemote ? " 🌐" : ""} <span class="lb-score">${getSlitherScore(s)}</span></div>`
  ).join("");
  updateScoreboard();
}

function inView(x, y, pad = 80) {
  const z = cam.zoom;
  const { w, h } = canvasDisplaySize();
  return x > cam.x - pad && x < cam.x + w / z + pad
    && y > cam.y - pad && y < cam.y + h / z + pad;
}

function canvasDisplaySize() {
  return { w: canvas.width / canvasDpr, h: canvas.height / canvasDpr };
}

function drawArenaSkyBlue() {
  const pad = 220;
  const { w, h } = canvasDisplaySize();
  const vw = w / cam.zoom;
  const vh = h / cam.zoom;
  const gx = cam.x - pad;
  const gy = cam.y - pad;
  const grd = ctx.createLinearGradient(gx, gy, gx, gy + vh + pad * 2);
  grd.addColorStop(0, "#7ec8ff");
  grd.addColorStop(0.28, "#4da3f0");
  grd.addColorStop(0.62, "#2b7fd4");
  grd.addColorStop(1, "#0f4f8a");
  ctx.fillStyle = grd;
  ctx.fillRect(gx, gy, vw + pad * 2, vh + pad * 2);

  if (highQuality) {
    const haze = ctx.createRadialGradient(
      WORLD_CX, WORLD_CY - WORLD_R * 0.35, WORLD_R * 0.05,
      WORLD_CX, WORLD_CY, WORLD_R * 1.35
    );
    haze.addColorStop(0, "rgba(255,255,255,0.12)");
    haze.addColorStop(0.45, "rgba(180,220,255,0.06)");
    haze.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(gx, gy, vw + pad * 2, vh + pad * 2);
  }
}

function drawArenaBlueFloor() {
  const floorG = ctx.createRadialGradient(
    WORLD_CX - WORLD_R * 0.12, WORLD_CY - WORLD_R * 0.1, WORLD_R * 0.02,
    WORLD_CX, WORLD_CY, WORLD_R
  );
  floorG.addColorStop(0, "#a8e6ff");
  floorG.addColorStop(0.22, "#6ecff5");
  floorG.addColorStop(0.52, "#38b0e8");
  floorG.addColorStop(0.78, "#1289c7");
  floorG.addColorStop(1, "#065a8f");
  ctx.fillStyle = floorG;
  arenaPath(ctx);
  ctx.fill();

  if (highQuality) {
    for (let ring = 1; ring <= 8; ring++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.018 + ring * 0.004})`;
      ctx.lineWidth = 1.2;
      arenaPath(ctx, WORLD_RX * (ring / 8), WORLD_RY * (ring / 8));
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.11;
    for (let i = 0; i < 20; i++) {
      const a = tick * 0.012 + i * 1.17;
      const cx = WORLD_CX + Math.cos(a) * WORLD_RX * (0.08 + (i % 6) * 0.11);
      const cy = WORLD_CY + Math.sin(a * 0.93) * WORLD_RY * (0.07 + (i % 5) * 0.1);
      const rad = 90 + (i % 4) * 35;
      const caustic = ctx.createRadialGradient(cx, cy, 4, cx, cy, rad);
      caustic.addColorStop(0, "rgba(255,255,255,0.95)");
      caustic.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = caustic;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const shimmer = ctx.createRadialGradient(
    WORLD_CX - WORLD_R * 0.18,
    WORLD_CY - WORLD_R * 0.14,
    WORLD_R * 0.03,
    WORLD_CX,
    WORLD_CY,
    WORLD_R * 0.92
  );
  shimmer.addColorStop(0, "rgba(255,255,255,0.2)");
  shimmer.addColorStop(0.35, "rgba(187,222,251,0.1)");
  shimmer.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shimmer;
  arenaPath(ctx);
  ctx.fill();

  const edgeDepth = ctx.createRadialGradient(WORLD_CX, WORLD_CY, WORLD_R * 0.72, WORLD_CX, WORLD_CY, WORLD_R);
  edgeDepth.addColorStop(0, "rgba(0,0,0,0)");
  edgeDepth.addColorStop(0.75, "rgba(0,40,90,0.08)");
  edgeDepth.addColorStop(1, "rgba(0,25,60,0.35)");
  ctx.fillStyle = edgeDepth;
  arenaPath(ctx);
  ctx.fill();
}

function drawArenaVoid() {
  const pad = 4000;
  ctx.fillStyle = "#040b14";
  ctx.beginPath();
  ctx.rect(WORLD_CX - WORLD_RX - pad, WORLD_CY - WORLD_RY - pad, (WORLD_RX + pad) * 2, (WORLD_RY + pad) * 2);
  ctx.ellipse(WORLD_CX, WORLD_CY, WORLD_RX, WORLD_RY, 0, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
}

function drawFoodOrb(f) {
  const pulse = 1 + Math.sin(tick * 0.08 + f.x * 0.01) * (highQuality ? 0.1 : 0.08);
  const r = f.r * pulse;
  drawEntityShadow(f.x, f.y, r * 1.2, r * 0.5);
  const grd = ctx.createRadialGradient(f.x - r * 0.42, f.y - r * 0.45, r * 0.05, f.x + r * 0.05, f.y + r * 0.08, r * 1.08);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.18, shadeColor(f.color, 40));
  grd.addColorStop(0.55, f.color);
  grd.addColorStop(0.88, shadeColor(f.color, -35));
  grd.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.shadowColor = f.color;
  ctx.shadowBlur = highQuality ? 18 : 14;
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = highQuality ? 1 : 0.8;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(f.x - r * 0.34, f.y - r * 0.36, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  if (highQuality) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(f.x - r * 0.12, f.y - r * 0.5, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPostFX() {
  const { w, h } = canvasDisplaySize();
  const warm = ctx.createLinearGradient(0, 0, w, h);
  warm.addColorStop(0, "rgba(140,200,255,0.06)");
  warm.addColorStop(0.5, "rgba(80,140,220,0.03)");
  warm.addColorStop(1, "rgba(10,30,70,0.12)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);

  const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.06, w / 2, h / 2, h * 0.82);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(0.58, "rgba(0,0,0,0.1)");
  grd.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  const grainCount = highQuality ? 220 : 100;
  for (let i = 0; i < grainCount; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.004 + (i % 4) * 0.004})`;
    ctx.fillRect((i * 137 + tick * 0.35) % w, (i * 89 + tick * 0.22) % h, 1, 1);
  }

  if (highQuality) {
    ctx.fillStyle = "rgba(120,180,255,0.025)";
    ctx.fillRect(0, 0, w, h * 0.35);
  }
  window.GameRealism?.postFrame(ctx, w, h, { animT: tick, vignette: 0.16 });
}

function drawWorld() {
  if (!ctx || !canvas) return;
  ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
  const { w, h } = canvasDisplaySize();

  if (player?.alive) {
    cam.zoom = Math.max(0.38, slitherZoomScale(player));
    const vw = w / cam.zoom, vh = h / cam.zoom;
    const head = player.segments[0];
    cam.x += (head.x - vw / 2 - cam.x) * 0.09;
    cam.y += (head.y - vh / 2 - cam.y) * 0.09;
  }

  const skyGrd = ctx.createLinearGradient(0, 0, 0, h);
  skyGrd.addColorStop(0, "#6eb6ff");
  skyGrd.addColorStop(0.45, "#2d8fe8");
  skyGrd.addColorStop(1, "#0b4a82");
  ctx.fillStyle = skyGrd;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);

  drawArenaSkyBlue();
  drawArenaVoid();
  drawArenaBlueFloor();

  const depthG = ctx.createRadialGradient(WORLD_CX, WORLD_CY, WORLD_R * 0.55, WORLD_CX, WORLD_CY, WORLD_R);
  depthG.addColorStop(0, "rgba(0,0,0,0)");
  depthG.addColorStop(1, "rgba(0,35,80,0.18)");
  ctx.fillStyle = depthG;
  arenaPath(ctx);
  ctx.fill();

  const pulse = 0.65 + Math.sin(tick * 0.06) * 0.35;
  if (highQuality) {
    ctx.strokeStyle = `rgba(183,28,28,${0.25 + pulse * 0.2})`;
    ctx.lineWidth = 28;
    ctx.shadowColor = "#b71c1c";
    ctx.shadowBlur = 30 + pulse * 18;
    arenaPath(ctx, WORLD_RX + 4, WORLD_RY + 4);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = `rgba(239,83,80,${0.55 + pulse * 0.35})`;
  ctx.lineWidth = highQuality ? 14 : 16;
  ctx.shadowColor = "#e53935";
  ctx.shadowBlur = highQuality ? 18 + pulse * 12 : 22 + pulse * 16;
  arenaPath(ctx);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  arenaPath(ctx, WORLD_RX - 6, WORLD_RY - 6);
  ctx.stroke();

  if (rankedMode) {
    pebbles.forEach((p) => {
      if (!inView(p.x, p.y)) return;
      drawCollectiblePebble(p);
    });
  }

  foods.forEach((f) => {
    if (!inView(f.x, f.y)) return;
    drawFoodOrb(f);
  });

  snakes.filter((s) => s.alive).forEach((s) => {
    if (inView(s.segments[0].x, s.segments[0].y, 250)) drawSnake(s);
  });

  drawParticles();

  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (running) drawPostFX();
}

function drawSnake(snake) {
  const segs = snake.segments;
  if (segs.length < 2) return;
  const r = snakeRadius(snake);
  const [c1, c2] = snake.colors;

  for (let i = segs.length - 1; i >= 0; i--) {
    const t = i / Math.max(segs.length - 1, 1);
    const sr = r * (1 - t * 0.38);
    const base = i % 3 === 0 ? c1 : c2;
    const alt = i % 3 === 0 ? c2 : c1;
    drawSnakeBodySphere(segs[i].x, segs[i].y, sr, base, alt, i, false);
  }

  const head = segs[0];
  drawSnakeBodySphere(head.x, head.y, r, c1, c2, 0, true);

  if (snake.boosting) {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = highQuality ? 4 : 3;
    ctx.shadowColor = "rgba(120,220,255,0.65)";
    ctx.shadowBlur = highQuality ? 14 : 8;
    ctx.beginPath();
    ctx.moveTo(segs[0].x, segs[0].y);
    for (let i = 1; i < Math.min(14, segs.length); i++) {
      ctx.lineTo(segs[i].x, segs[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const ang = snake.angle;
  const eyeOff = r * 0.38;
  const eyeR = r * 0.28;
  const perpX = Math.cos(ang + Math.PI / 2) * eyeOff * 0.55;
  const perpY = Math.sin(ang + Math.PI / 2) * eyeOff * 0.55;
  const fwdX = Math.cos(ang) * eyeOff * 0.35;
  const fwdY = Math.sin(ang) * eyeOff * 0.35;

  [[-1, 1], [1, 1]].forEach(([sx]) => {
    const ex = head.x + fwdX + perpX * sx;
    const ey = head.y + fwdY + perpY;
    const eyeGrad = ctx.createRadialGradient(ex - eyeR * 0.2, ey - eyeR * 0.25, 1, ex, ey, eyeR);
    eyeGrad.addColorStop(0, "#ffffff");
    eyeGrad.addColorStop(1, "#dce8f5");
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(ex + Math.cos(ang) * eyeR * 0.35, ey + Math.sin(ang) * eyeR * 0.35, eyeR * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.22, ey - eyeR * 0.28, eyeR * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  if (highQuality) {
    ctx.font = `600 ${Math.max(11, r * 0.72)}px system-ui, "Segoe UI", Arial, sans-serif`;
  } else {
    ctx.font = `bold ${Math.max(11, r * 0.75)}px system-ui, Arial, sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(snake.name, head.x + 1, head.y - r - 9);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fillText(snake.name, head.x, head.y - r - 10);

  if (snake.isPlayer && playerCosmetic !== "none") {
    drawSnakeCosmetic(head, ang, r);
  }
}

function drawSnakeCosmetic(head, ang, r) {
  const fwdX = Math.cos(ang);
  const fwdY = Math.sin(ang);
  const perpX = Math.cos(ang + Math.PI / 2);
  const perpY = Math.sin(ang + Math.PI / 2);
  const eyeOff = r * 0.38;

  if (playerCosmetic === "glasses") {
    ctx.strokeStyle = "#111";
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(head.x + fwdX * eyeOff * 0.2 - perpX * eyeOff * 0.65, head.y + fwdY * eyeOff * 0.2 - perpY * eyeOff * 0.65);
    ctx.lineTo(head.x + fwdX * eyeOff * 0.2 + perpX * eyeOff * 0.65, head.y + fwdY * eyeOff * 0.2 + perpY * eyeOff * 0.65);
    ctx.stroke();
  } else if (playerCosmetic === "crown") {
    const topX = head.x - fwdX * r * 0.15;
    const topY = head.y - fwdY * r * 0.15 - r * 0.55;
    ctx.fillStyle = "#ffd54f";
    ctx.strokeStyle = "#f57f17";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(topX - r * 0.45, topY + r * 0.35);
    ctx.lineTo(topX - r * 0.25, topY);
    ctx.lineTo(topX, topY + r * 0.18);
    ctx.lineTo(topX + r * 0.25, topY);
    ctx.lineTo(topX + r * 0.45, topY + r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (playerCosmetic === "bow") {
    ctx.fillStyle = "#f48fb1";
    ctx.strokeStyle = "#ad1457";
    ctx.lineWidth = 1.2;
    const bx = head.x + perpX * r * 0.75;
    const by = head.y + perpY * r * 0.75;
    ctx.beginPath();
    ctx.ellipse(bx - perpX * r * 0.18, by - perpY * r * 0.18, r * 0.22, r * 0.16, ang, 0, Math.PI * 2);
    ctx.ellipse(bx + perpX * r * 0.18, by + perpY * r * 0.18, r * 0.22, r * 0.16, ang, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function gameLoop() {
  tick++;
  if (running) {
    snakes.forEach(updateSnake);
    checkCollisions();
    updateParticles();
    updateHUD();
    drawWorld();
  }
  loopId = requestAnimationFrame(gameLoop);
}

function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = (clientX - rect.left) * (canvas.width / rect.width);
  const sy = (clientY - rect.top) * (canvas.height / rect.height);
  return { x: sx / cam.zoom + cam.x, y: sy / cam.zoom + cam.y };
}

function resize() {
  if (!wrap || !canvas) return;
  let w = wrap.clientWidth;
  let h = wrap.clientHeight;
  if (w <= 0 || h <= 0) {
    w = window.innerWidth;
    h = window.innerHeight;
  }
  canvasDpr = highQuality ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  canvas.width = Math.round(w * canvasDpr);
  canvas.height = Math.round(h * canvasDpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

function setupInput() {
  const updatePtr = (cx, cy) => { pointer = screenToWorld(cx, cy); };

  if (typeof AllOutControls !== "undefined") {
    AllOutControls.bindJoystick(moveJoy);
  }

  document.getElementById("snake-boost-btn")?.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    mouseBoost = true;
  });
  document.getElementById("snake-boost-btn")?.addEventListener("pointerup", () => { mouseBoost = false; });
  document.getElementById("snake-boost-btn")?.addEventListener("pointerleave", () => { mouseBoost = false; });
  document.getElementById("snake-boost-btn")?.addEventListener("pointercancel", () => { mouseBoost = false; });

  canvas.addEventListener("pointermove", (e) => {
    if (running && !moveJoy.active) updatePtr(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (e.target !== canvas) return;
    canvas.setPointerCapture(e.pointerId);
    updatePtr(e.clientX, e.clientY);
    mouseBoost = true;
  });
  canvas.addEventListener("pointerup", () => { mouseBoost = false; });

  window.addEventListener("resize", resize);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !running) {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const dead = !document.getElementById("death-overlay")?.classList.contains("hidden");
      if (dead) {
        if (!rankedMode) respawnPlayer();
        return;
      }
      if (document.body.classList.contains("snake-hub-active")) initGame();
      return;
    }
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", " ", "Shift"];
    if (!keys.includes(e.key)) return;
    if (running && player?.alive) {
      e.preventDefault();
      keysDown[e.key] = true;
    }
  });
  document.addEventListener("keyup", (e) => { keysDown[e.key] = false; });
}

function init() {
  canvas = document.getElementById("game-canvas");
  wrap = document.getElementById("game-wrap");
  ctx = canvas.getContext("2d");
  const shouldResetUnranked = new URLSearchParams(window.location.search).get("resetUnranked") === "1";
  if (shouldResetUnranked) {
    const url = new URL(window.location.href);
    url.searchParams.delete("resetUnranked");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
  loadBest();
  if (shouldResetUnranked) resetUnrankedBest();
  loadHubStats();
  setupSlitherHub();
  resize();
  setupInput();
  updateRankModeBtn();
  updateHubDisplay();
  showHub();
  loopId = requestAnimationFrame(gameLoop);

  document.getElementById("pro-hub-link-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../../index.html";
  });
  document.getElementById("play-btn").addEventListener("click", () => {
    partySubroom = "";
    initGame();
  });
  document.getElementById("start-big-btn")?.addEventListener("click", () => tryStartBig());
  document.getElementById("respawn-btn")?.addEventListener("click", () => respawnPlayer());
  document.getElementById("next-btn").addEventListener("click", showHub);
  document.getElementById("share-score-btn").addEventListener("click", shareDeathScore);
  document.getElementById("hub-back-btn")?.addEventListener("click", showHub);
  document.getElementById("settings-btn").addEventListener("click", () => {
    syncSettingsPanel();
    document.getElementById("arena-settings-overlay")?.classList.remove("hidden");
  });
  document.getElementById("close-settings-btn").addEventListener("click", () => {
    document.getElementById("arena-settings-overlay")?.classList.add("hidden");
  });
  document.getElementById("hq-toggle")?.addEventListener("change", (e) => {
    highQuality = e.target.checked;
    try { localStorage.setItem(HQ_KEY, highQuality ? "1" : "0"); } catch (_) {}
    applyCanvasQuality();
  });
  document.getElementById("leave-game-btn").addEventListener("click", () => {
    window.location.href = "../../index.html";
  });
}

init();
