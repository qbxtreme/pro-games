(function () {
  "use strict";
  const C = Object.assign({}, window.HORROR_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const V = C.variant || "fnaf";
  const VAR = (C.variants && C.variants[V]) || {};
  const SAVE = C.saveKey || "horror";
  const W = 1200, H = 900, PR = 20, SPD = 180;
  const HIDES = [{ x: 180, y: 220, w: 80, h: 60 }, { x: 520, y: 400, w: 90, h: 70 }, { x: 900, y: 280, w: 80, h: 60 }, { x: 640, y: 680, w: 100, h: 70 }];
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let player = { x: 600, y: 450, style: "cute", facing: 1, walk: 0 };
  let joy = { dx: 0, dy: 0 }, keys = {}, remotePlayers = [], toastT = 0;
  let night = 1, power = 100, sanity = 100, clock = 0, hiding = false, camMode = false;
  let threats = [], waveTimer = 0, won = false, lost = false;
  let state = load();

  function load() {
    try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {}
    return def();
  }
  function def() { return { name: "Player", style: "cute", bestNight: 0, wins: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k, v) {
    let s = (C.ui && C.ui[k]) || k;
    if (v) Object.entries(v).forEach(([a, b]) => { s = s.replace(new RegExp("\\{" + a + "\\}", "g"), b); });
    return s;
  }
  function toast(m) { const el = $("toast"); if (!el) return; el.textContent = m; el.classList.remove("hidden"); toastT = 2.5; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function inHide(x, y) { return HIDES.some(h => x > h.x && x < h.x + h.w && y > h.y && y < h.y + h.h); }

  function spawnThreats() {
    threats = [];
    const n = (VAR.threatCount || 2) + Math.floor(night / 2);
    const emojis = VAR.threatEmojis || ["👹", "👻", "🤡"];
    for (let i = 0; i < n; i++) {
      threats.push({
        x: Math.random() * W, y: Math.random() * H, emoji: emojis[i % emojis.length],
        speed: 55 + night * 8 + Math.random() * 30, angle: Math.random() * Math.PI * 2, hunt: true,
      });
    }
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    state.style = document.querySelector(".style-pick.selected")?.dataset.style || "cute";
    save();
    night = 1; power = 100; sanity = 100; clock = 0; hiding = false; camMode = false;
    won = false; lost = false;
    player.x = 600; player.y = 450;
    spawnThreats();
    $("start-overlay")?.classList.add("hidden");
    $("app")?.classList.add("playing");
    $("hide-btn")?.classList.remove("hidden");
    $("use-btn")?.classList.remove("hidden");
    playing = true;
    toast(ui("startToast", { night: String(night) }));
    initMP();
    updateHud();
  }

  function initMP() {
    if (!window.GameMP) return;
    GameMP.init({
      game: C.mpGame, subroom: "night-" + night,
      getName: () => state.name,
      getState: () => ({ x: player.x, y: player.y, style: state.style, night, hiding, power: Math.floor(power) }),
      onPeers: (peers) => { remotePlayers = peers; renderLb(); },
    });
    GameMP.start();
  }

  function updateHud() {
    $("night-display").textContent = ui("nightLabel", { night: String(night), max: String(VAR.maxNights || 5) });
    $("power-display").textContent = "⚡ " + Math.floor(power) + "%";
    $("sanity-display").textContent = "🧠 " + Math.floor(sanity) + "%";
    const hrs = Math.floor(clock / 60) % 12 || 12;
    $("time-display").textContent = "🕐 " + hrs + " AM";
    $("world-label").textContent = VAR.zoneName || C.branding?.title || "Horror";
  }

  function renderLb() {
    const el = $("leaderboard"); if (!el || !playing) return;
    const rows = [{ name: state.name, night, you: true }, ...remotePlayers.map(p => ({ name: p.name, night: (p.state || {}).night || 1 }))]
      .sort((a, b) => b.night - a.night).slice(0, 6);
    el.innerHTML = "<h4>" + ui("leaderboardTitle") + "</h4>" + rows.map((r, i) =>
      `<div class="lb-row ${r.you ? "you" : ""}"><span>#${i + 1} ${(r.name || "P").slice(0, 8)}</span><span>N${r.night}</span></div>`).join("");
  }

  function endNight(survived) {
    if (survived) {
      if (night >= (VAR.maxNights || 5)) {
        won = true; state.wins++; state.bestNight = Math.max(state.bestNight, night); save();
        toast(ui("winToast")); playing = false;
        $("start-overlay")?.classList.remove("hidden");
        $("app")?.classList.remove("playing");
        return;
      }
      night++; clock = 0; power = Math.min(100, power + 25); sanity = Math.min(100, sanity + 15);
      spawnThreats(); toast(ui("nightClear", { night: String(night) }));
      if (window.GameMP) GameMP.setSubroom("night-" + night);
    } else {
      lost = true; playing = false;
      toast(ui("loseToast"));
      $("start-overlay")?.classList.remove("hidden");
      $("app")?.classList.remove("playing");
    }
    updateHud(); renderLb();
  }

  function tick(dt) {
    if (!playing || won || lost) return;
    clock += dt;
    if (clock >= (VAR.nightLength || 90)) { endNight(true); return; }
    const drain = (camMode ? 1.8 : 1) * (hiding ? 0.4 : 1) * dt * (VAR.powerDrain || 0.12);
    power = Math.max(0, power - drain);
    if (VAR.sanityDrain && !hiding) sanity = Math.max(0, sanity - dt * VAR.sanityDrain * 0.05);
    if (power <= 0 || sanity <= 0) { endNight(false); return; }

    if (!hiding && !camMode) {
      let mx = joy.dx, my = joy.dy;
      if (keys["ArrowLeft"] || keys.a) mx -= 1;
      if (keys["ArrowRight"] || keys.d) mx += 1;
      if (keys["ArrowUp"] || keys.w) my -= 1;
      if (keys["ArrowDown"] || keys.s) my += 1;
      const len = Math.hypot(mx, my);
      if (len > 0.1) {
        player.x = Math.max(PR, Math.min(W - PR, player.x + (mx / len) * SPD * dt));
        player.y = Math.max(PR, Math.min(H - PR, player.y + (my / len) * SPD * dt));
        player.facing = mx >= 0 ? 1 : -1;
        player.walk += dt * 8;
      }
      hiding = inHide(player.x, player.y);
    }

    threats.forEach(t => {
      if (hiding && inHide(player.x, player.y)) return;
      const dx = player.x - t.x, dy = player.y - t.y, d = Math.hypot(dx, dy) || 1;
      t.x += (dx / d) * t.speed * dt;
      t.y += (dy / d) * t.speed * dt;
      if (d < 28 && !hiding) { sanity -= dt * 35; if (sanity <= 0) endNight(false); }
    });

    waveTimer += dt;
    if (waveTimer > 25) { waveTimer = 0; threats.push({ x: Math.random() * W, y: 0, emoji: "🩸", speed: 70 + night * 5, angle: 0, hunt: true }); }
    updateHud();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawIndoorScene(ctx, w, h, { floor: VAR.floor || "#2d2d44", wall: (VAR.sky && VAR.sky[0]) || "#1a1a2e" });
    HIDES.forEach(hd => {
      const active = hiding && inHide(player.x, player.y) && inHide(hd.x + 40, hd.y + 35);
      TemplateSprites.drawHideCloset(ctx, hd.x, hd.y, hd.w, hd.h, active);
    });
    if (camMode) {
      ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#0f0"; ctx.font = "bold 14px monospace"; ctx.textAlign = "left";
      ctx.fillText("📹 CAM FEED — threats highlighted", 20, 30);
      threats.forEach(t => { ctx.strokeStyle = "#f00"; ctx.lineWidth = 2; ctx.strokeRect(t.x - 20, t.y - 20, 40, 40); });
    }
    threats.forEach(t => TemplateSprites.drawEmojiMob(ctx, t.x, t.y, t.emoji, "#fff", 1.1));
    if (!camMode) TemplateSprites.drawBlob(ctx, player.x, player.y, state.style, player.facing, player.walk, 1);
    remotePlayers.forEach(p => {
      const s = p.state || {};
      if (s.hiding) return;
      TemplateSprites.drawBlob(ctx, s.x || 0, s.y || 0, s.style || "cool", 1, animT, 0.9);
    });
    if (VAR.overlay === "rain") TemplateSprites.drawRain(ctx, w, h, animT);
    if (VAR.overlay === "sun") TemplateSprites.drawRedTint(ctx, w, h, 0.15);
  }

  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    const dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts; animT += dt;
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast")?.classList.add("hidden"); }
    tick(dt); draw();
    requestAnimationFrame(loop);
  }

  function bindJoy() {
    if (window.AllOutControls) AllOutControls.bindJoystick(joy, keys);
  }

  function init() {
    canvas = $("game-canvas"); if (!canvas) return;
    ctx = canvas.getContext("2d");
    const resize = () => { w = canvas.width = canvas.clientWidth; h = canvas.height = canvas.clientHeight; };
    resize(); window.addEventListener("resize", resize);
    $("play-btn")?.addEventListener("click", startGame);
    $("hide-btn")?.addEventListener("click", () => { hiding = !hiding; toast(hiding ? ui("hideOn") : ui("hideOff")); });
    $("use-btn")?.addEventListener("click", () => { camMode = !camMode; toast(camMode ? ui("camOn") : ui("camOff")); });
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    document.querySelectorAll(".style-pick").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll(".style-pick").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
    }));
    window.addEventListener("keydown", e => { keys[e.key] = true; });
    window.addEventListener("keyup", e => { keys[e.key] = false; });
    bindJoy();
    if (C.branding) {
      document.title = C.branding.title || document.title;
      if ($("game-title")) $("game-title").textContent = C.branding.title;
      if ($("game-tagline")) $("game-tagline").textContent = C.branding.description;
    }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
