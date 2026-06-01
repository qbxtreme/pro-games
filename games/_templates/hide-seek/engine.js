(function () {
  "use strict";
  const C = Object.assign({}, window.HIDE_SEEK_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "hide-seek";
  const W = 1100, H = 800;
  const PROPS = ["🪑", "📦", "🌵", "🗿", "🪴", "🛢️", "📺", "🧸"];
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let player = { x: 400, y: 400, role: "hider", style: "cute", facing: 1, walk: 0, disguised: false, prop: "🪑" };
  let bots = [], joy = {}, keys = {}, roundTimer = 0, toastT = 0, state = load();

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", hiderWins: 0, seekerWins: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k) { return (C.ui && C.ui[k]) || k; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function startRound() {
    player.role = Math.random() < 0.7 ? "hider" : "seeker";
    player.disguised = false; player.prop = PROPS[Math.floor(Math.random() * PROPS.length)];
    player.x = 200 + Math.random() * 700; player.y = 150 + Math.random() * 500;
    roundTimer = C.roundTime || 90;
    bots = [];
    for (let i = 0; i < 8; i++) {
      bots.push({ x: Math.random() * W, y: Math.random() * H, role: i < 6 ? "hider" : "seeker", disguised: Math.random() < 0.5, prop: PROPS[i % PROPS.length], speed: 90 + Math.random() * 30, tagged: false });
    }
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("disguise-btn")?.classList.toggle("hidden", player.role !== "hider");
    playing = true;
    toast(player.role === "hider" ? ui("youHider") : ui("youSeeker"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "round", getName: () => state.name,
        getState: () => ({ x: player.x, y: player.y, role: player.role, disguised: player.disguised, prop: player.prop }),
        onPeers: () => {} });
      GameMP.start();
    }
  }

  function endRound(hidersWin) {
    playing = false;
    if (hidersWin) state.hiderWins++; else state.seekerWins++;
    save(); toast(hidersWin ? ui("hidersWin") : ui("seekersWin"));
    $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing");
  }

  function tick(dt) {
    if (!playing) return;
    roundTimer -= dt;
    if (roundTimer <= 0) endRound(true);

    let mx = joy.dx || 0, my = joy.dy || 0;
    if (keys.ArrowLeft || keys.a) mx -= 1; if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowUp || keys.w) my -= 1; if (keys.ArrowDown || keys.s) my += 1;
    const len = Math.hypot(mx, my);
    if (len > 0.1) {
      player.x = Math.max(20, Math.min(W - 20, player.x + mx / len * 210 * dt));
      player.y = Math.max(20, Math.min(H - 20, player.y + my / len * 210 * dt));
      player.facing = mx >= 0 ? 1 : -1; player.walk += dt * 8;
    }

    if (player.role === "seeker") {
      bots.filter(b => b.role === "hider" && !b.tagged).forEach(b => {
        const dx = b.x - player.x, dy = b.y - player.y, d = Math.hypot(dx, dy);
        if (d < 35 && (!b.disguised || Math.random() < 0.3)) { b.tagged = true; toast(ui("tagged", { prop: b.prop })); }
      });
    }

    bots.filter(b => b.role === "seeker").forEach(b => {
      const hiders = bots.filter(x => x.role === "hider" && !x.tagged);
      if (!hiders.length) return;
      const t = hiders[0];
      const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy) || 1;
      b.x += dx / d * b.speed * dt; b.y += dy / d * b.speed * dt;
      if (d < 30 && player.role === "hider" && !player.tagged) { player.tagged = true; toast(ui("youTagged")); endRound(false); }
    });

    const hidersLeft = (player.role === "hider" && !player.tagged ? 1 : 0) + bots.filter(b => b.role === "hider" && !b.tagged).length;
    if (hidersLeft === 0) endRound(false);

    $("role-display").textContent = player.role === "hider" ? "🙈 Hider" : "👀 Seeker";
    $("timer-display").textContent = "⏱ " + Math.ceil(roundTimer) + "s";
    $("hiders-display").textContent = "🙈 " + hidersLeft;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawUrbanLot(ctx, w, h, animT, "warehouse");
    PROPS.forEach((p, i) => TemplateSprites.drawEmojiMob(ctx, 100 + (i % 4) * 250, 120 + Math.floor(i / 4) * 180, p, "#fff", 1));
    bots.filter(b => !b.tagged).forEach(b => {
      if (b.disguised) TemplateSprites.drawEmojiMob(ctx, b.x, b.y, b.prop, "#fff", 0.95);
      else TemplateSprites.drawBlob(ctx, b.x, b.y, b.role === "seeker" ? "cute" : "cool", 1, animT, 0.85);
    });
    if (player.disguised && player.role === "hider") TemplateSprites.drawEmojiMob(ctx, player.x, player.y, player.prop, "#fff", 1.05);
    else TemplateSprites.drawBlob(ctx, player.x, player.y, state.style, player.facing, player.walk, 1);
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
    $("disguise-btn")?.addEventListener("click", () => { player.disguised = !player.disguised; player.prop = PROPS[Math.floor(Math.random() * PROPS.length)]; toast(player.disguised ? ui("disguised") : ui("revealed")); });
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
