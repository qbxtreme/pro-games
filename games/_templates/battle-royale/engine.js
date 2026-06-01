(function () {
  "use strict";
  const C = Object.assign({}, window.BR_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "hunger-games";
  const MAP = 1200, ZONE_START = 500;
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let player = { x: 600, y: 600, style: "cute", facing: 1, walk: 0, hp: 100, loot: 0 };
  let zone = { r: ZONE_START }, bots = [], loots = [], joy = {}, keys = {}, toastT = 0, state = load();

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", wins: 0, kills: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k) { return (C.ui && C.ui[k]) || k; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function spawnLoot() {
    loots = [];
    for (let i = 0; i < 12; i++) loots.push({ x: 100 + Math.random() * 1000, y: 100 + Math.random() * 1000, emoji: ["🗡️", "🛡️", "💊", "🎒"][Math.floor(Math.random() * 4)], taken: false });
  }

  function startMatch() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    player.x = 600; player.y = 600; player.hp = 100; player.loot = 0;
    zone.r = ZONE_START; spawnLoot();
    bots = [];
    for (let i = 0; i < 9; i++) bots.push({ x: Math.random() * MAP, y: Math.random() * MAP, hp: 80, alive: true, name: "Trib" + i, speed: 80 + Math.random() * 40 });
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("loot-btn")?.classList.remove("hidden");
    playing = true; toast(ui("startToast"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "arena", getName: () => state.name,
        getState: () => ({ x: player.x, y: player.y, hp: player.hp, alive: player.hp > 0 }),
        onPeers: () => {} });
      GameMP.start();
    }
  }

  function inZone(x, y) { return Math.hypot(x - MAP / 2, y - MAP / 2) < zone.r; }

  function tick(dt) {
    if (!playing) return;
    zone.r = Math.max(120, zone.r - dt * 18);

    let mx = joy.dx || 0, my = joy.dy || 0;
    if (keys.ArrowLeft || keys.a) mx -= 1; if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowUp || keys.w) my -= 1; if (keys.ArrowDown || keys.s) my += 1;
    const len = Math.hypot(mx, my);
    if (len > 0.1) {
      player.x = Math.max(20, Math.min(MAP - 20, player.x + mx / len * 220 * dt));
      player.y = Math.max(20, Math.min(MAP - 20, player.y + my / len * 220 * dt));
      player.facing = mx >= 0 ? 1 : -1; player.walk += dt * 8;
    }

    if (!inZone(player.x, player.y)) player.hp -= dt * 25;
    loots.forEach(l => {
      if (!l.taken && Math.hypot(l.x - player.x, l.y - player.y) < 35) {
        l.taken = true; player.loot++; player.hp = Math.min(100, player.hp + 15);
        toast(l.emoji + " Loot!");
      }
    });

    bots.filter(b => b.alive).forEach(b => {
      if (!inZone(b.x, b.y)) b.hp -= dt * 30;
      const dx = player.x - b.x, dy = player.y - b.y, d = Math.hypot(dx, dy) || 1;
      if (d < 400) { b.x += dx / d * b.speed * dt; b.y += dy / d * b.speed * dt; }
      if (d < 35) { player.hp -= dt * 20; b.hp -= dt * 15; }
      if (b.hp <= 0) { b.alive = false; state.kills++; toast(ui("eliminated")); }
    });

    const alive = 1 + bots.filter(b => b.alive).length;
    if (player.hp <= 0) { playing = false; toast(ui("defeat")); $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing"); }
    else if (alive === 1) { playing = false; state.wins++; save(); toast(ui("victory")); $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing"); }

    $("hp-display").textContent = "❤️ " + Math.floor(player.hp);
    $("alive-display").textContent = "👥 " + alive;
    $("zone-display").textContent = "⭕ " + Math.floor(zone.r);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const sx = w / MAP, sy = h / MAP;
    TemplateSprites.drawForestArena(ctx, w, h, zone.r * sx, animT);
    loots.filter(l => !l.taken).forEach(l => TemplateSprites.drawEmojiMob(ctx, l.x * sx, l.y * sy, l.emoji, "#fff", 0.8));
    bots.filter(b => b.alive).forEach(b => TemplateSprites.drawBlob(ctx, b.x * sx, b.y * sy, "cute", 1, animT, 0.82));
    TemplateSprites.drawBlob(ctx, player.x * sx, player.y * sy, state.style, player.facing, player.walk, 0.85);
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
    $("play-btn")?.addEventListener("click", startMatch);
    $("loot-btn")?.addEventListener("click", () => toast(ui("lootHint")));
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
