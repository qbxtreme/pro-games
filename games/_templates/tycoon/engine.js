(function () {
  "use strict";
  const C = Object.assign({}, window.TYCOON_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const V = C.variant || "city";
  const VAR = (C.variants && C.variants[V]) || {};
  const SAVE = C.saveKey || "tycoon";
  const COLS = 6, ROWS = 5, TS = 100;
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let plots = [], coins = 100, income = 0, joy = {}, keys = {}, remotePlayers = [], toastT = 0;
  let state = load();

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r), plots: JSON.parse(r).plots || [] }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", coins: 100, plots: [], income: 0, raids: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify({ ...state, coins, plots, income })); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k, v) { let s = (C.ui && C.ui[k]) || k; if (v) Object.entries(v).forEach(([a, b]) => { s = s.replace("{" + a + "}", b); }); return s; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function initPlots() {
    plots = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const owned = state.plots.find(p => p.c === c && p.r === r);
      plots.push({ c, r, owned: !!owned, level: owned?.level || 0, type: owned?.type || null, x: c * TS + 80, y: r * TS + 100 });
    }
  }

  function plotCost(p) {
    const base = (VAR.plotCost || 50) + (p.c + p.r) * 15;
    return p.owned ? Math.floor(base * 0.5 * (p.level + 1)) : base;
  }

  function incomeFor(p) {
    if (!p.owned || !p.type) return 0;
    const b = (VAR.buildings || {})[p.type] || { income: 2 };
    return (b.income || 2) * (1 + p.level * 0.5);
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    coins = state.coins || 100; income = state.income || 0;
    initPlots(); recalcIncome();
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("shop-btn")?.classList.remove("hidden"); $("raid-btn")?.classList.remove("hidden");
    playing = true; toast(ui("startToast"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "base", getName: () => state.name,
        getState: () => ({ coins: Math.floor(coins), income, plots: plots.filter(p => p.owned).length }),
        onPeers: p => { remotePlayers = p; renderLb(); } });
      GameMP.start();
    }
  }

  function recalcIncome() { income = plots.reduce((s, p) => s + incomeFor(p), 0); }

  function buyPlot(p) {
    const cost = plotCost(p);
    if (coins < cost) { toast(ui("needCoins", { cost: String(cost) })); return; }
    coins -= cost;
    if (!p.owned) { p.owned = true; p.type = VAR.defaultBuilding || "shop"; p.level = 1; }
    else { p.level++; }
    recalcIncome(); save(); toast(ui("bought", { name: p.type || "plot" }));
  }

  function doRaid() {
    if (coins < 30) { toast(ui("raidNeed")); return; }
    coins -= 30;
    const loot = Math.floor(Math.random() * 80 + 40);
    coins += loot; state.raids++; toast(ui("raidWin", { loot: String(loot) })); save();
  }

  function renderLb() {
    const el = $("leaderboard"); if (!el || !playing) return;
    const rows = [{ name: state.name, coins: Math.floor(coins), you: true }, ...remotePlayers.map(p => ({ name: p.name, coins: (p.state || {}).coins || 0 }))]
      .sort((a, b) => b.coins - a.coins).slice(0, 6);
    el.innerHTML = "<h4>" + ui("leaderboardTitle") + "</h4>" + rows.map((r, i) =>
      `<div class="lb-row ${r.you ? "you" : ""}"><span>#${i + 1} ${(r.name || "?").slice(0, 8)}</span><span>🪙${r.coins}</span></div>`).join("");
  }

  function tick(dt) {
    if (!playing) return;
    coins += income * dt;
    $("coin-display").textContent = "🪙 " + Math.floor(coins);
    $("income-display").textContent = "📈 " + income.toFixed(1) + "/s";
    $("plots-display").textContent = "🏠 " + plots.filter(p => p.owned).length + "/" + plots.length;
    renderLb();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawWorld(ctx, w, h, { skyTop: VAR.skyTop || "#81d4fa", skyBot: VAR.skyBot || "#fff9c4", floor: "#8bc34a", floorAlt: "#689f38", time: animT, seed: 99, density: 6 });
    plots.forEach(p => {
      const b = (VAR.buildings || {})[p.type] || { emoji: "🏠" };
      TemplateSprites.drawBuildingPlot(ctx, p.x, p.y, TS - 8, p.owned, p.owned ? (b.emoji || "🏠") : null, p.level || 1, p.owned ? null : plotCost(p));
    });
  }

  function onTap(e) {
    if (!playing) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (w / rect.width);
    const sy = (e.clientY - rect.top) * (h / rect.height);
    const hit = plots.find(p => sx >= p.x && sx <= p.x + TS && sy >= p.y && sy <= p.y + TS);
    if (hit) buyPlot(hit);
  }

  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    const dt = Math.min(0.05, (ts - lastFrame) / 1000); lastFrame = ts; animT += dt;
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast")?.classList.add("hidden"); }
    tick(dt); draw(); requestAnimationFrame(loop);
  }

  function init() {
    canvas = $("game-canvas"); ctx = canvas.getContext("2d");
    const resize = () => { w = canvas.width = canvas.clientWidth; h = canvas.height = canvas.clientHeight; };
    resize(); window.addEventListener("resize", resize);
    canvas.addEventListener("click", onTap);
    canvas.addEventListener("touchend", e => { e.preventDefault(); if (e.changedTouches[0]) onTap(e.changedTouches[0]); });
    $("play-btn")?.addEventListener("click", startGame);
    $("shop-btn")?.addEventListener("click", () => toast(ui("shopHint")));
    $("raid-btn")?.addEventListener("click", doRaid);
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
