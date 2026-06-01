(function () {
  "use strict";
  const C = Object.assign({}, window.SURVIVE_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "survive";
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let player = { x: 400, y: 300, style: "cute", facing: 1, walk: 0, hp: 100 };
  let joy = { dx: 0, dy: 0 }, keys = {}, hazards = [], score = 0, time = 0, remotePlayers = [], toastT = 0;
  let state = load();

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", best: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k) { return (C.ui && C.ui[k]) || k; }
  function toast(m) { const el = $("toast"); el.textContent = m; el.classList.remove("hidden"); toastT = 2.5; }

  function spawnHazard() {
    const types = C.hazardTypes || [{ emoji: "🔥", speed: 120, dmg: 15 }, { emoji: "⚡", speed: 180, dmg: 10 }, { emoji: "🪨", speed: 90, dmg: 20 }];
    const t = types[Math.floor(Math.random() * types.length)];
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    if (side === 0) { x = Math.random() * 900; y = -20; vx = (Math.random() - 0.5) * 40; vy = t.speed; }
    else if (side === 1) { x = 920; y = Math.random() * 700; vx = -t.speed; vy = (Math.random() - 0.5) * 40; }
    else if (side === 2) { x = Math.random() * 900; y = 720; vx = (Math.random() - 0.5) * 40; vy = -t.speed; }
    else { x = -20; y = Math.random() * 700; vx = t.speed; vy = (Math.random() - 0.5) * 40; }
    hazards.push({ x, y, vx, vy, ...t, r: 22 });
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    state.style = document.querySelector(".style-pick.selected")?.dataset.style || "cute";
    score = 0; time = 0; player.hp = 100; player.x = 450; player.y = 350; hazards = [];
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    playing = true; toast(ui("startToast"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "arena", getName: () => state.name,
        getState: () => ({ x: player.x, y: player.y, style: state.style, score: Math.floor(score) }),
        onPeers: p => { remotePlayers = p; } });
      GameMP.start();
    }
  }

  function tick(dt) {
    if (!playing) return;
    time += dt; score += dt * 10;
    let mx = joy.dx;
    let my = joy.dy;
    const move = window.AllOutControls?.moveSpeed(260, dt, mx, my, keys);
    if (move) {
      player.x = Math.max(20, Math.min(880, player.x + move.vx));
      player.y = Math.max(20, Math.min(680, player.y + move.vy));
      player.facing = move.facing;
      player.walk += dt * 8;
    }
    if (Math.random() < dt * (0.55 + time * 0.008)) spawnHazard();
    hazards = hazards.filter(hz => {
      hz.x += hz.vx * dt; hz.y += hz.vy * dt;
      if (Math.hypot(hz.x - player.x, hz.y - player.y) < hz.r + 18) {
        player.hp -= hz.dmg * dt * 1.8;
        if (player.hp <= 0) {
          playing = false; state.best = Math.max(state.best, Math.floor(score)); save();
          toast(ui("gameOver") + " " + Math.floor(score));
          $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing");
        }
      }
      return hz.x > -60 && hz.x < 960 && hz.y > -60 && hz.y < 760;
    });
    $("score-display").textContent = "⭐ " + Math.floor(score);
    $("time-display").textContent = "⏱ " + Math.floor(time) + "s";
    $("hp-display").textContent = "❤️ " + Math.floor(player.hp);
    $("best-display").textContent = "🏆 " + state.best;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawWorld(ctx, w, h, { skyTop: "#ff8a65", skyBot: "#ffcc80", floor: "#aed581", floorAlt: "#9ccc65", time: animT, seed: 55, density: 12 });
    hazards.forEach(hz => TemplateSprites.drawEmojiMob(ctx, hz.x, hz.y, hz.emoji, "#fff", 1));
    TemplateSprites.drawBlob(ctx, player.x, player.y, state.style, player.facing, player.walk, 1);
    remotePlayers.forEach(p => { const s = p.state || {}; TemplateSprites.drawBlob(ctx, s.x, s.y, s.style || "cool", 1, animT, 0.85); });
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
    document.querySelectorAll(".style-pick").forEach(b => b.addEventListener("click", () => { document.querySelectorAll(".style-pick").forEach(x => x.classList.remove("selected")); b.classList.add("selected"); }));
    bindJoy();
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
