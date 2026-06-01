(function () {
  "use strict";
  const C = Object.assign({}, window.MERGE_TD_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "merge-td";
  const GRID = 5, TS = 64;
  const UNITS = C.unitTiers || [{ tier: 1, emoji: "🧑", dmg: 5 }, { tier: 2, emoji: "🏹", dmg: 12 }, { tier: 3, emoji: "🛡️", dmg: 25 }, { tier: 4, emoji: "💣", dmg: 50 }, { tier: 5, emoji: "🚀", dmg: 100 }];
  let grid = [], wave = 1, zombies = [], coins = 100, lives = 10, playing = false, toastT = 0, state = load();
  let selected = null;

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", bestWave: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k, v) { let s = (C.ui && C.ui[k]) || k; if (v) Object.entries(v).forEach(([a, b]) => { s = s.replace("{" + a + "}", b); }); return s; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function emptyGrid() {
    grid = [];
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) grid.push({ c, r, unit: null });
  }

  function spawnWave() {
    zombies = [];
    const n = 3 + wave * 2;
    for (let i = 0; i < n; i++) zombies.push({ x: Math.random() * GRID * TS, y: -20 - i * 30, hp: 20 + wave * 8, maxHp: 20 + wave * 8, speed: 30 + wave * 3 });
    toast(ui("wave", { n: String(wave) }));
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    emptyGrid(); wave = 1; coins = 100; lives = 10; spawnWave();
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("spawn-btn")?.classList.remove("hidden"); $("merge-btn")?.classList.remove("hidden");
    playing = true;
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "wave-" + wave, getName: () => state.name,
        getState: () => ({ wave, lives }), onPeers: () => {} });
      GameMP.start();
    }
  }

  function cellAt(c, r) { return grid.find(g => g.c === c && g.r === r); }

  function spawnUnit() {
    if (coins < 20) { toast(ui("needCoins")); return; }
    coins -= 20;
    const empty = grid.filter(g => !g.unit);
    if (!empty.length) { toast(ui("gridFull")); return; }
    const cell = empty[Math.floor(Math.random() * empty.length)];
    cell.unit = { tier: 1, ...UNITS[0] };
    toast(ui("spawned"));
  }

  function mergeSelected() {
    if (!selected) { toast(ui("selectFirst")); return; }
    const neighbors = grid.filter(g => g.unit && g.unit.tier === selected.unit.tier && (Math.abs(g.c - selected.c) + Math.abs(g.r - selected.r) === 1));
    if (!neighbors.length) { toast(ui("noMerge")); return; }
    const n = neighbors[0];
    const nextTier = Math.min(UNITS.length, selected.unit.tier + 1);
    selected.unit = { tier: nextTier, ...UNITS[nextTier - 1] };
    n.unit = null;
    toast(ui("merged", { tier: String(nextTier) }));
  }

  function tick(dt) {
    if (!playing) return;
    let totalDmg = grid.reduce((s, g) => s + (g.unit ? g.unit.dmg : 0), 0);
    zombies.forEach(z => {
      z.y += z.speed * dt;
      z.hp -= totalDmg * dt * 0.15;
      if (z.y > GRID * TS + 40) { lives--; z.hp = 0; }
    });
    zombies = zombies.filter(z => z.hp > 0);
    if (zombies.length === 0) {
      wave++; coins += 30 + wave * 5; state.bestWave = Math.max(state.bestWave, wave);
      spawnWave(); save();
      if (window.GameMP) GameMP.setSubroom("wave-" + wave);
    }
    if (lives <= 0) { playing = false; toast(ui("gameOver")); $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing"); }
    $("wave-display").textContent = "🌊 W" + wave;
    $("lives-display").textContent = "❤️ " + lives;
    $("coins-display").textContent = "🪙 " + coins;
  }

  function draw() {
    const canvas = $("game-canvas"); if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth, h = canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawIndoorScene(ctx, w, h, { floor: "#37474f", wall: "#263238", lights: true });
    const ox = (w - GRID * TS) / 2, oy = (h - GRID * TS) / 2;
    grid.forEach(g => {
      const x = ox + g.c * TS, y = oy + g.r * TS;
      const g2 = ctx.createLinearGradient(x, y, x + TS, y + TS);
      g2.addColorStop(0, "#455a64");
      g2.addColorStop(1, "#37474f");
      ctx.fillStyle = g2;
      ctx.fillRect(x + 1, y + 1, TS - 2, TS - 2);
      ctx.strokeStyle = "#546e7a";
      ctx.strokeRect(x, y, TS, TS);
      if (g.unit) TemplateSprites.drawEmojiMob(ctx, x + TS / 2, y + TS / 2, g.unit.emoji, "#fff", 0.85);
      if (selected === g) { ctx.strokeStyle = "#ffeb3b"; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, TS - 4, TS - 4); ctx.lineWidth = 1; }
    });
    zombies.forEach(z => TemplateSprites.drawEmojiMob(ctx, ox + z.x, oy + z.y, "🧟", "#fff", 0.9));
  }

  function onGridClick(e) {
    if (!playing) return;
    const canvas = $("game-canvas");
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const ox = (w - GRID * TS) / 2, oy = (h - GRID * TS) / 2;
    const sx = (e.clientX - rect.left) * (w / rect.width);
    const sy = (e.clientY - rect.top) * (h / rect.height);
    const c = Math.floor((sx - ox) / TS), r = Math.floor((sy - oy) / TS);
    if (c >= 0 && c < GRID && r >= 0 && r < GRID) selected = cellAt(c, r);
  }

  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    const dt = Math.min(0.05, (ts - lastFrame) / 1000); lastFrame = ts;
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast")?.classList.add("hidden"); }
    tick(dt); draw(); requestAnimationFrame(loop);
  }
  let lastFrame = 0;

  function init() {
    $("play-btn")?.addEventListener("click", startGame);
    $("spawn-btn")?.addEventListener("click", spawnUnit);
    $("merge-btn")?.addEventListener("click", mergeSelected);
    $("game-canvas")?.addEventListener("click", onGridClick);
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
