(function () {
  "use strict";
  const C = Object.assign({}, window.DIGGING_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "digging";
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let depth = 0, gems = 0, coins = 0, drill = 1, digPower = 1, digging = false, toastT = 0;
  let state = load(), remotePlayers = [];

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", bestDepth: 0, drill: 1, gems: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify({ ...state, bestDepth: Math.max(state.bestDepth, depth), drill, gems })); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k, v) { let s = (C.ui && C.ui[k]) || k; if (v) Object.entries(v).forEach(([a, b]) => { s = s.replace("{" + a + "}", b); }); return s; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function gemValue(d) {
    const tiers = C.gemTiers || [{ min: 0, emoji: "🪨", val: 1 }, { min: 50, emoji: "💎", val: 5 }, { min: 150, emoji: "👑", val: 15 }];
    const t = tiers.slice().reverse().find(t => d >= t.min) || tiers[0];
    return t;
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    drill = state.drill || 1; depth = 0; gems = state.gems || 0;
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("dig-btn")?.classList.remove("hidden"); $("upgrade-btn")?.classList.remove("hidden");
    playing = true; toast(ui("startToast"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "mine", getName: () => state.name,
        getState: () => ({ depth: Math.floor(depth), drill }),
        onPeers: p => { remotePlayers = p; } });
      GameMP.start();
    }
  }

  function dig() {
    if (!playing) return;
    depth += digPower * drill * 0.8;
    const tier = gemValue(depth);
    if (Math.random() < 0.35 + drill * 0.05) { gems += tier.val; toast(tier.emoji + " +" + tier.val); save(); }
    updateHud();
  }

  function upgrade() {
    const cost = Math.floor(50 * Math.pow(1.6, drill - 1));
    if (gems < cost) { toast(ui("needGems", { cost: String(cost) })); return; }
    gems -= cost; drill++; state.drill = drill; digPower = 1 + drill * 0.3; save();
    toast(ui("upgraded", { level: String(drill) }));
    updateHud();
  }

  function updateHud() {
    $("depth-display").textContent = "⬇️ " + Math.floor(depth) + "m";
    $("gems-display").textContent = "💎 " + gems;
    $("drill-display").textContent = "⛏️ Lv" + drill;
    $("best-display").textContent = "🏆 " + state.bestDepth + "m";
  }

  function tick(dt) {
    if (!playing) return;
    if (digging) dig();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawDigSite(ctx, w, h, depth, animT);
    const tier = gemValue(depth);
    TemplateSprites.drawEmojiMob(ctx, w / 2, h * 0.5, tier.emoji, "#fff", 1.2);
    ctx.font = "bold 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.strokeText("⬇️ " + Math.floor(depth) + "m deep", w / 2, h * 0.62);
    ctx.fillText("⬇️ " + Math.floor(depth) + "m deep", w / 2, h * 0.62);
    remotePlayers.forEach((p, i) => {
      ctx.font = "12px system-ui";
      ctx.fillStyle = "#fff";
      ctx.fillText((p.name || "P").slice(0, 8) + ": " + ((p.state || {}).depth || 0) + "m", w / 2, h * 0.7 + i * 18);
    });
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
    $("play-btn")?.addEventListener("click", startGame);
    $("dig-btn")?.addEventListener("pointerdown", () => { digging = true; });
    $("dig-btn")?.addEventListener("pointerup", () => { digging = false; });
    $("dig-btn")?.addEventListener("pointerleave", () => { digging = false; });
    $("upgrade-btn")?.addEventListener("click", upgrade);
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
