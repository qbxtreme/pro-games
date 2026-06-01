(function () {
  "use strict";
  const C = Object.assign({}, window.SPORTS_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "schleem-soccer";
  const FIELD_W = 900, FIELD_H = 550, GOAL_W = 20;
  let canvas, ctx, w, h, playing, animT, lastFrame;
  let player = { x: 450, y: 400, team: "red", style: "cute", facing: 1, walk: 0 };
  let ball = { x: 450, y: 275, vx: 0, vy: 0 };
  let score = { red: 0, blue: 0 }, joy = {}, keys = {}, toastT = 0, state = load();
  let bots = [];

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", wins: 0, goals: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k) { return (C.ui && C.ui[k]) || k; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function startMatch() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    player.team = Math.random() < 0.5 ? "red" : "blue";
    player.x = player.team === "red" ? 200 : 700; player.y = 400;
    ball.x = 450; ball.y = 275; ball.vx = ball.vy = 0; score = { red: 0, blue: 0 };
    bots = [{ x: 700, y: 300, team: "blue" }, { x: 200, y: 300, team: "red" }, { x: 450, y: 150, team: "blue" }];
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("kick-btn")?.classList.remove("hidden");
    playing = true; toast(ui("startToast"));
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "match", getName: () => state.name,
        getState: () => ({ x: player.x, y: player.y, team: player.team, score }),
        onPeers: () => {} });
      GameMP.start();
    }
  }

  function kick() {
    const dx = ball.x - player.x, dy = ball.y - player.y, d = Math.hypot(dx, dy) || 1;
    if (d > 60) { toast(ui("tooFar")); return; }
    ball.vx = (dx / d) * 320; ball.vy = (dy / d) * 320;
  }

  function scoreGoal(team) {
    score[team]++;
    state.goals++;
    toast(ui("goal", { team }));
    ball.x = 450; ball.y = 275; ball.vx = ball.vy = 0;
    if (score.red >= 3 || score.blue >= 3) {
      playing = false;
      const won = score[player.team] > score[player.team === "red" ? "blue" : "red"];
      if (won) state.wins++;
      save(); toast(won ? ui("win") : ui("lose"));
      $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing");
    }
  }

  function tick(dt) {
    if (!playing) return;
    let mx = joy.dx || 0, my = joy.dy || 0;
    if (keys.ArrowLeft || keys.a) mx -= 1; if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowUp || keys.w) my -= 1; if (keys.ArrowDown || keys.s) my += 1;
    const len = Math.hypot(mx, my);
    if (len > 0.1) {
      player.x = Math.max(30, Math.min(FIELD_W - 30, player.x + mx / len * 240 * dt));
      player.y = Math.max(30, Math.min(FIELD_H - 30, player.y + my / len * 240 * dt));
      player.facing = mx >= 0 ? 1 : -1; player.walk += dt * 8;
    }

    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    ball.vx *= 0.98; ball.vy *= 0.98;
    if (ball.x < 30 || ball.x > FIELD_W - 30) ball.vx *= -0.8;
    if (ball.y < 30 || ball.y > FIELD_H - 30) ball.vy *= -0.8;
    ball.x = Math.max(20, Math.min(FIELD_W - 20, ball.x));
    ball.y = Math.max(20, Math.min(FIELD_H - 20, ball.y));

    if (ball.x < GOAL_W && ball.y > 200 && ball.y < 350) scoreGoal("red");
    if (ball.x > FIELD_W - GOAL_W && ball.y > 200 && ball.y < 350) scoreGoal("blue");

    bots.forEach(b => {
      const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy) || 1;
      b.x += dx / d * 120 * dt; b.y += dy / d * 120 * dt;
    });

    $("score-display").textContent = "🔴" + score.red + " - " + score.blue + "🔵";
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    TemplateSprites.drawSoccerField(ctx, w, h);
    const sx = w / FIELD_W, sy = h / FIELD_H;
    const bx = ball.x * sx, by = ball.y * sy;
    const bg = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, 12);
    bg.addColorStop(0, "#fff");
    bg.addColorStop(1, "#bdbdbd");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(bx, by, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.stroke();
    bots.forEach(b => TemplateSprites.drawBlob(ctx, b.x * sx, b.y * sy, b.team === "red" ? "cute" : "cool", 1, animT, 0.85));
    TemplateSprites.drawBlob(ctx, player.x * sx, player.y * sy, state.style, player.facing, player.walk, 0.9);
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
    $("kick-btn")?.addEventListener("click", kick);
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    window.addEventListener("keydown", e => { keys[e.key] = true; if (e.code === "Space") kick(); }); window.addEventListener("keyup", e => { keys[e.key] = false; });
    bindJoy();
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
