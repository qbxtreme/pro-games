(function () {
  "use strict";
  const C = Object.assign({}, window.INFECTION_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "infection";
  const W = 1000, H = 700, VEHICLE = { x: 500, y: 350, repair: 0, need: 100 };
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let player = { x: 200, y: 350, role: "human", style: "cute", facing: 1, walk: 0 };
  let bots = [], joy = {}, keys = {}, repairProgress = 0, roundTimer = 0, toastT = 0, won = false;
  let state = load(), remotePlayers = [];

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", humanWins: 0, infectedWins: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k) { return (C.ui && C.ui[k]) || k; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function startRound() {
    const isInfected = Math.random() < 0.25;
    player.role = isInfected ? "infected" : "human";
    player.x = 200 + Math.random() * 600; player.y = 150 + Math.random() * 400;
    repairProgress = 0; roundTimer = C.roundTime || 120; won = false;
    bots = [];
    for (let i = 0; i < 7; i++) {
      bots.push({ x: Math.random() * W, y: Math.random() * H, role: i === 0 && !isInfected ? "infected" : "human", name: "Bot" + i, speed: 100 + Math.random() * 40 });
    }
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("repair-btn")?.classList.toggle("hidden", player.role !== "human");
    playing = true;
    toast(player.role === "infected" ? ui("youInfected") : ui("youHuman"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "round", getName: () => state.name,
        getState: () => ({ x: player.x, y: player.y, role: player.role, style: state.style, repair: repairProgress }),
        onPeers: p => { remotePlayers = p; } });
      GameMP.start();
    }
  }

  function endRound(humanWin) {
    playing = false;
    if (humanWin) state.humanWins++; else state.infectedWins++;
    save();
    toast(humanWin ? ui("humansWin") : ui("infectedWin"));
    $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing");
  }

  function tick(dt) {
    if (!playing) return;
    roundTimer -= dt;
    if (roundTimer <= 0) endRound(player.role === "human");

    let mx = joy.dx || 0, my = joy.dy || 0;
    if (keys.ArrowLeft || keys.a) mx -= 1; if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowUp || keys.w) my -= 1; if (keys.ArrowDown || keys.s) my += 1;
    const len = Math.hypot(mx, my);
    if (len > 0.1) {
      player.x = Math.max(20, Math.min(W - 20, player.x + mx / len * 200 * dt));
      player.y = Math.max(20, Math.min(H - 20, player.y + my / len * 200 * dt));
      player.facing = mx >= 0 ? 1 : -1; player.walk += dt * 8;
    }

    if (player.role === "human" && Math.hypot(player.x - VEHICLE.x, player.y - VEHICLE.y) < 60) {
      repairProgress += dt * 12;
      if (repairProgress >= VEHICLE.need) endRound(true);
    }

    bots.forEach(b => {
      if (b.role === "infected") {
        const targets = [{ x: player.x, y: player.y, isYou: true }, ...bots.filter(x => x.role === "human").map(x => ({ x: x.x, y: x.y }))];
        const t = targets[0];
        const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy) || 1;
        b.x += dx / d * b.speed * dt; b.y += dy / d * b.speed * dt;
        if (t.isYou && d < 30 && player.role === "human") { player.role = "infected"; toast(ui("tagged")); $("repair-btn")?.classList.add("hidden"); }
      }
    });

    const humansLeft = (player.role === "human" ? 1 : 0) + bots.filter(b => b.role === "human").length;
    if (humansLeft === 0) endRound(false);

    $("repair-display").textContent = "🚐 " + Math.floor(repairProgress) + "%";
    $("role-display").textContent = player.role === "human" ? "🧑 Human" : "🧟 Infected";
    $("timer-display").textContent = "⏱ " + Math.ceil(roundTimer) + "s";
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawUrbanLot(ctx, w, h, animT, "industrial");
    TemplateSprites.drawEmojiMob(ctx, VEHICLE.x, VEHICLE.y, "🚐", "#fff", 1.3);
    bots.forEach(b => TemplateSprites.drawBlob(ctx, b.x, b.y, b.style || (b.role === "infected" ? "cute" : "cool"), b.facing || 1, b.walk || animT, 0.9));
    TemplateSprites.drawBlob(ctx, player.x, player.y, state.style, player.facing, player.walk, 1);
    if (player.role === "infected") { ctx.font = "20px system-ui"; ctx.textAlign = "center"; ctx.fillText("🧟", player.x, player.y - 32); }
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
    $("play-btn")?.addEventListener("click", startRound);
    $("repair-btn")?.addEventListener("click", () => toast(ui("repairHint")));
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
