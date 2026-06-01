(function () {
  "use strict";
  const C = Object.assign({}, window.CHASE_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const V = C.variant || "youtuber";
  const VAR = (C.variants && C.variants[V]) || {};
  const SAVE = C.saveKey || "chase";
  const W = 1400, H = 500;
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let player = { x: 80, y: 300, style: "cute", facing: 1, walk: 0 };
  let hazard = { x: -200, speed: 180 }, targets = [], rescued = 0, joy = {}, keys = {}, toastT = 0, state = load();

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", rescued: 0, best: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k, v) { let s = (C.ui && C.ui[k]) || k; if (v) Object.entries(v).forEach(([a, b]) => { s = s.replace("{" + a + "}", b); }); return s; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function spawnTargets() {
    targets = [];
    const emoji = VAR.targetEmoji || "📹";
    for (let i = 0; i < (VAR.targetCount || 5); i++) {
      targets.push({ x: 300 + i * 220 + Math.random() * 80, y: 200 + Math.random() * 200, emoji, saved: false });
    }
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    player.x = 80; player.y = 300; hazard.x = -200; hazard.speed = VAR.hazardSpeed || 180;
    rescued = 0; spawnTargets();
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    playing = true; toast(ui("startToast"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "run", getName: () => state.name,
        getState: () => ({ x: player.x, rescued }),
        onPeers: () => {} });
      GameMP.start();
    }
  }

  function tick(dt) {
    if (!playing) return;
    hazard.x += hazard.speed * dt;
    hazard.speed += dt * 2;

    let mx = joy.dx || 0;
    if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowLeft || keys.a) mx -= 1;
    if (Math.abs(mx) > 0.1) {
      player.x = Math.max(40, Math.min(W - 40, player.x + mx * 280 * dt));
      player.facing = mx >= 0 ? 1 : -1; player.walk += dt * 8;
    }

    targets.forEach(t => {
      if (!t.saved && Math.hypot(t.x - player.x, t.y - player.y) < 40) {
        t.saved = true; rescued++;
        toast(ui("rescued", { emoji: t.emoji }));
        if (rescued >= targets.length) {
          playing = false; state.rescued += rescued; state.best = Math.max(state.best, rescued); save();
          toast(ui("win")); $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing");
        }
      }
    });

    if (hazard.x > player.x - 30 && hazard.x < player.x + 30) {
      playing = false; toast(ui("caught"));
      $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing");
    }

    $("rescued-display").textContent = "💾 " + rescued + "/" + targets.length;
    $("hazard-display").textContent = (VAR.hazardEmoji || "🌊") + " " + Math.floor(hazard.speed);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawWorld(ctx, w, h, { skyTop: VAR.skyTop || "#ef5350", skyBot: VAR.skyBot || "#ffcc80", floor: "#7cb342", floorAlt: "#558b2f", time: animT, seed: 12, density: 8 });
    const grad = ctx.createLinearGradient(hazard.x - 80, 0, hazard.x + 80, 0);
    grad.addColorStop(0, "rgba(255,0,0,0)");
    grad.addColorStop(0.5, "rgba(255,50,50,0.35)");
    grad.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(hazard.x - 80, 0, 160, h);
    TemplateSprites.drawEmojiMob(ctx, hazard.x, h * 0.5, VAR.hazardEmoji || "🌊", "#fff", 1.4);
    targets.forEach(t => { if (!t.saved) TemplateSprites.drawEmojiMob(ctx, t.x, t.y, t.emoji, "#fff", 1); });
    TemplateSprites.drawBlob(ctx, player.x, player.y, state.style, player.facing, player.walk, 1);
  }

  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    const dt = Math.min(0.05, (ts - lastFrame) / 1000); lastFrame = ts; animT += dt;
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast")?.classList.add("hidden"); }
    tick(dt); draw(); requestAnimationFrame(loop);
  }

  function bindJoy() {
    if (window.AllOutControls) AllOutControls.bindJoystick(joy, keys);
  }

  function init() {
    canvas = $("game-canvas"); ctx = canvas.getContext("2d");
    const resize = () => { w = canvas.width = canvas.clientWidth; h = canvas.height = canvas.clientHeight; };
    resize(); window.addEventListener("resize", resize);
    $("play-btn")?.addEventListener("click", startGame);
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    window.addEventListener("keydown", e => { keys[e.key] = true; }); window.addEventListener("keyup", e => { keys[e.key] = false; });
    bindJoy();
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
