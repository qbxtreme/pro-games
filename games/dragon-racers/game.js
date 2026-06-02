(function () {
  "use strict";

  const SAVE_KEY = "dragon-racers";
  const RACE_GOAL = 1000;
  const CPU_DRAGONS = [
    "ember", "storm", "frost", "mossy", "blaze", "coral", "slate",
    "sunny", "dusk", "pebble", "tide", "vine",
  ];
  const DRAGONS = {
    ember: { name: "Ember", speed: 1, color: "#ef5350" },
    storm: { name: "Storm", speed: 1.08, color: "#5c6bc0" },
    frost: { name: "Frost", speed: 1.04, color: "#4fc3f7" },
    mossy: { name: "Mossy", speed: 1.06, color: "#43a047" },
    blaze: { name: "Blaze", speed: 1.07, color: "#ff5722" },
    coral: { name: "Coral", speed: 1.02, color: "#ff7043" },
    slate: { name: "Slate", speed: 0.98, color: "#78909c" },
    sunny: { name: "Sunny", speed: 1.05, color: "#ffb300" },
    dusk: { name: "Dusk", speed: 1.03, color: "#7e57c2" },
    pebble: { name: "Pebble", speed: 1.01, color: "#a1887f" },
    tide: { name: "Tide", speed: 1.04, color: "#00838f" },
    vine: { name: "Vine", speed: 1.06, color: "#689f38" },
  };

  let canvas, ctx, w, h, dpr = 1;
  let playing = false;
  let animT = 0;
  let lastFrame = 0;
  let joy = { dx: 0, dy: 0 };
  let keys = {};

  let state = {
    name: "Rider",
    dragon: "",
    best: 0,
    totalGems: 0,
    coins: 0,
    unlockedDragons: [],
    pickedStarter: false,
  };

  let player = { x: 0, y: 0, vy: 0 };
  let scroll = 0;
  let speed = 220;
  let distance = 0;
  let gems = 0;
  let entities = [];
  let particles = [];
  let spawnTimer = 0;
  let windTimer = 0;
  let toastTimer = 0;
  let bank = 0;
  let invincible = 0;
  let attractScroll = 0;
  let raceMode = false;
  let cpu = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (_) {}
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    toastTimer = 2.2;
  }

  function resize() {
    const wrap = document.getElementById("game-wrap");
    if (!canvas || !wrap) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (playing) {
      player.x = w * 0.28;
      if (cpu) cpu.x = w * 0.72;
    }
  }

  function updateHud() {
    if (raceMode && cpu) {
      document.getElementById("score-display").textContent =
        `🏁 You ${Math.floor(distance)} | CPU ${Math.floor(cpu.distance)}`;
    } else {
      document.getElementById("score-display").textContent = `🏁 ${Math.floor(distance)} m`;
    }
    document.getElementById("gem-display").textContent = `💎 ${gems}`;
    document.getElementById("best-display").textContent = `⭐ Best ${Math.floor(state.best)}`;
  }

  function spawnLaneEntity(lane) {
    const laneY = 80 + Math.random() * (h - 160);
    const roll = Math.random();
    if (roll < 0.22) {
      entities.push({ type: "gem", lane, x: w + 40, y: laneY, r: 18 });
    } else if (roll < 0.38) {
      entities.push({ type: "ring", lane, x: w + 40, y: laneY, r: 42, passed: false });
    } else {
      entities.push({
        type: "obstacle",
        lane,
        kind: Math.random() < 0.5 ? "rock" : "spire",
        x: w + 40,
        y: laneY,
        w: 56,
        h: 56,
      });
    }
  }

  function spawnEntity() {
    if (raceMode) {
      spawnLaneEntity("player");
      spawnLaneEntity("cpu");
      return;
    }
    const laneY = 80 + Math.random() * (h - 160);
    const roll = Math.random();
    if (roll < 0.22) {
      entities.push({ type: "gem", lane: "player", x: w + 40, y: laneY, r: 18 });
    } else if (roll < 0.38) {
      entities.push({ type: "ring", lane: "player", x: w + 40, y: laneY, r: 42, passed: false });
    } else {
      entities.push({
        type: "obstacle",
        lane: "player",
        kind: Math.random() < 0.5 ? "rock" : "spire",
        x: w + 40,
        y: laneY,
        w: 56,
        h: 56,
      });
    }
  }

  function resetRun() {
    raceMode = window.DRHub?.getActiveGameMode?.()?.id === "sky-race";
    player.x = w * 0.28;
    player.y = h * 0.5;
    player.vy = 0;
    scroll = 0;
    speed = 220 * (DRAGONS[state.dragon]?.speed || 1);
    distance = 0;
    gems = 0;
    entities = [];
    particles = [];
    spawnTimer = 0;
    windTimer = 0;
    bank = 0;
    invincible = 3;
    if (raceMode) {
      cpu = {
        x: w * 0.72,
        y: h * 0.5,
        vy: 0,
        bank: 0,
        distance: 0,
        dragon: CPU_DRAGONS[Math.floor(Math.random() * CPU_DRAGONS.length)],
        dead: false,
        name: "CPU Rival",
      };
      showToast("Sky Race! Beat the CPU to 1000 m!");
    } else {
      cpu = null;
      showToast("Take flight! Dodge obstacles!");
    }
    updateHud();
  }

  function startGame() {
    if (!state.dragon || !DRAGONS[state.dragon]) {
      showToast("Choose your first dragon!");
      return;
    }
    if (!window.DRHub?.isDragonUnlocked?.(state.dragon)) {
      showToast("Unlock this dragon in the Shop!");
      return;
    }
    state.name = document.getElementById("name-input").value.trim().slice(0, 14) || "Rider";
    saveState();
    window.DRHub?.hideMainMenu();
    document.getElementById("gameover-overlay").classList.add("hidden");
    document.getElementById("race-xp-msg")?.classList.add("hidden");
    document.getElementById("app").classList.add("playing");
    playing = true;
    resetRun();
    resize();
    canvas?.focus();
    window.GameSFX?.play("start");
    if (window.BecomeAPro?.recordGamePlayed) BecomeAPro.recordGamePlayed("dragon-racers");
    lastFrame = performance.now();
  }

  function endRun(result) {
    result = result || {};
    const won = result.won === true;
    playing = false;
    window.GameSFX?.play(won ? "win" : "lose");
    const dist = Math.floor(distance);
    const newBest = dist > state.best;
    if (newBest) state.best = dist;
    state.totalGems += gems;
    let coinsWon = 0;
    if (raceMode && won) {
      coinsWon = window.DRHub?.awardRaceWin(500) || 0;
    } else {
      window.DRHub?.awardRunRewards(dist, gems);
    }
    saveState();

    const titleEl = document.getElementById("gameover-title");
    const xpMsg = document.getElementById("race-xp-msg");
    if (titleEl) {
      if (won) titleEl.textContent = "🏆 Victory!";
      else if (result.reason === "cpu_finish") titleEl.textContent = "😤 CPU Wins!";
      else titleEl.textContent = "💥 Crash!";
    }
    if (xpMsg) xpMsg.classList.toggle("hidden", !(raceMode && won));

    if (raceMode && won) {
      document.getElementById("final-score").textContent = `You finished at ${dist} m!`;
    } else if (raceMode && result.reason === "cpu_finish") {
      document.getElementById("final-score").textContent = `CPU reached ${RACE_GOAL} m first`;
    } else {
      document.getElementById("final-score").textContent = `${dist} m`;
    }
    document.getElementById("final-gems").textContent = raceMode && won
      ? `🪙 +${coinsWon} coins · 💎 ${gems} gems this run`
      : `💎 ${gems} gems this run`;
    document.getElementById("new-best").classList.toggle("hidden", !newBest || raceMode);
    document.getElementById("gameover-overlay").classList.remove("hidden");
    document.getElementById("app").classList.remove("playing");
    updateHud();
    if (raceMode && won) showToast(`+500 XP & +${coinsWon} coins — Sky Race won!`);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function emitSpark(x, y, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        kind: "spark",
        x,
        y,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120,
        r: 2 + Math.random() * 3,
        life: 1,
      });
    }
  }

  function circleHit(px, py, pr, ex, ey, er) {
    const dx = px - ex;
    const dy = py - ey;
    return dx * dx + dy * dy < (pr + er) * (pr + er);
  }

  function emitThrust(x, y, spd) {
    if (Math.random() > 0.55) return;
    particles.push({
      kind: "mist",
      x: x - 28 - Math.random() * 10,
      y: y + (Math.random() - 0.5) * 12,
      vx: -spd * 0.15 - Math.random() * 40,
      vy: (Math.random() - 0.5) * 20,
      r: 6 + Math.random() * 8,
      life: 0.7 + Math.random() * 0.3,
    });
  }

  function updateParticles(dt, spd) {
    windTimer -= dt;
    if (windTimer <= 0) {
      windTimer = 0.08 + Math.random() * 0.12;
      particles.push({
        kind: "wind",
        x: w + 20,
        y: Math.random() * h,
        len: 30 + Math.random() * 50,
        wobble: (Math.random() - 0.5) * 4,
        vx: -(spd * 0.9 + 80),
        life: 1,
      });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      if (p.kind === "wind") p.life -= dt * 1.2;
      else p.life -= dt * (p.kind === "spark" ? 2.2 : 1.4);
      if (p.life <= 0 || p.x < -60) particles.splice(i, 1);
    }
    if (particles.length > 90) particles.splice(0, particles.length - 90);
  }

  function rectHit(px, py, pr, ex, ey, ew, eh) {
    return px + pr > ex - ew * 0.5 && px - pr < ex + ew * 0.5 && py + pr > ey - eh * 0.5 && py - pr < ey + eh * 0.5;
  }

  function keyActive(name) {
    return !!(keys[name] || keys[name.toLowerCase()]);
  }

  function readMoveInput() {
    let dx = joy.dx || 0;
    let dy = joy.dy || 0;
    if (keyActive("ArrowUp") || keyActive("KeyW") || keyActive("w")) dy -= 1;
    if (keyActive("ArrowDown") || keyActive("KeyS") || keyActive("s")) dy += 1;
    if (keyActive("ArrowLeft") || keyActive("KeyA") || keyActive("a")) dx -= 1;
    if (keyActive("ArrowRight") || keyActive("KeyD") || keyActive("d")) dx += 1;
    const len = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) + Math.abs(dy) > 0.05) {
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }

  function entityLane(e) {
    return e.lane || "player";
  }

  function updateCpu(dt) {
    if (!cpu || cpu.dead) return;

    let targetY = h * 0.5 + Math.sin(animT * 1.6) * 30;
    let steer = 0;
    const pr = 22;
    const lookAhead = 220;
    let nearest = null;
    let nearestDist = Infinity;

    for (const e of entities) {
      if (entityLane(e) !== "cpu") continue;
      if (e.type !== "obstacle") continue;
      const ahead = e.x - cpu.x;
      if (ahead < -30 || ahead > lookAhead) continue;
      const dy = Math.abs(e.y - cpu.y);
      if (dy < nearestDist) {
        nearestDist = dy;
        nearest = e;
      }
    }

    if (nearest) {
      steer = nearest.y > cpu.y ? -1 : 1;
      targetY = cpu.y + steer * 120;
    }

    cpu.vy += (targetY - cpu.y) * 6 * dt;
    cpu.vy += steer * 420 * dt;
    cpu.vy *= Math.pow(0.02, dt);
    cpu.y += cpu.vy * dt;
    cpu.y = Math.max(60, Math.min(h - 60, cpu.y));
    cpu.bank = lerp(cpu.bank || 0, cpu.vy * 0.0012, Math.min(1, dt * 10));
    cpu.distance += speed * dt * 0.05 * 0.96;

    emitThrust(cpu.x, cpu.y, speed);

    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      if (entityLane(e) !== "cpu") continue;
      if (e.type === "obstacle" && rectHit(cpu.x, cpu.y, pr, e.x, e.y, e.w, e.h)) {
        cpu.dead = true;
        showToast("CPU crashed! Race to the finish!");
        window.GameSFX?.play("attack");
        break;
      }
    }
  }

  function update(dt) {
    if (!playing) return;

    const { dx, dy } = readMoveInput();

    player.vy += dy * 520 * dt;
    player.vy *= Math.pow(0.02, dt);
    player.y += player.vy * dt;
    player.x += dx * 180 * dt;
    if (raceMode) {
      player.x = Math.max(w * 0.1, Math.min(w * 0.44, player.x));
    } else {
      player.x = Math.max(w * 0.12, Math.min(w * 0.42, player.x));
    }
    player.y = Math.max(60, Math.min(h - 60, player.y));

    bank = lerp(bank, player.vy * 0.0012, Math.min(1, dt * 10));

    speed += dt * 8;
    scroll += speed * dt;
    distance += speed * dt * 0.05;

    emitThrust(player.x, player.y, speed);
    updateParticles(dt, speed);

    if (invincible > 0) {
      invincible -= dt;
      if (invincible <= 0) invincible = 0;
    }

    if (raceMode) updateCpu(dt);

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEntity();
      const ramp = Math.max(0.65, 1.35 - distance * 0.0008);
      spawnTimer = invincible > 0 ? Math.max(ramp, 0.95) : ramp;
    }

    const pr = 22;
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      e.x -= speed * dt;
      if (e.x < -80) {
        entities.splice(i, 1);
        continue;
      }
      const lane = entityLane(e);
      if (lane !== "player") continue;
      if (e.type === "gem" && circleHit(player.x, player.y, pr, e.x, e.y, e.r)) {
        gems += 1;
        distance += 25;
        emitSpark(e.x, e.y, 10);
        window.GameSFX?.play("coin");
        entities.splice(i, 1);
        continue;
      }
      if (e.type === "ring" && !e.passed && circleHit(player.x, player.y, pr, e.x, e.y, e.r)) {
        e.passed = true;
        distance += 40;
        window.GameSFX?.play("level");
        showToast("Ring bonus +40 m!");
        continue;
      }
      if (e.type === "obstacle" && invincible <= 0 && rectHit(player.x, player.y, pr, e.x, e.y, e.w, e.h)) {
        endRun({ won: false, reason: "crash" });
        return;
      }
    }

    if (raceMode && cpu) {
      if (!cpu.dead && cpu.distance >= RACE_GOAL) {
        endRun({ won: false, reason: "cpu_finish" });
        return;
      }
      if (distance >= RACE_GOAL) {
        endRun({ won: true, reason: "finish" });
        return;
      }
    }

    updateHud();

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) document.getElementById("toast")?.classList.add("hidden");
    }
  }

  function drawAttract(dt) {
    if (w < 2 || h < 2) return;
    attractScroll += 90 * dt;
    animT += dt;
    ctx.clearRect(0, 0, w, h);
    DRSprites.drawSky(ctx, w, h, attractScroll, animT);
    DRSprites.drawTerrain(ctx, w, h, attractScroll, animT);
    const previewY = h * 0.48 + Math.sin(animT * 1.4) * 12;
    DRSprites.drawDragon(ctx, w * 0.32, previewY, 1.2, 1, state.dragon || "ember", animT, {
      boost: true,
      speed: 280,
      bank: Math.sin(animT * 1.2) * 0.08,
    });
    window.GameRealism?.postFrame(ctx, w, h, {
      animT,
      focusX: w * 0.32,
      focusY: previewY,
      vignette: 0.18,
      grainCount: 80,
      haze: true,
      horizon: 0.42,
    });
  }

  function drawRaceHud() {
    if (!raceMode || !cpu) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    const barW = w - 28;
    const barH = 10;
    const barY = 38;
    const youPct = Math.min(1, distance / RACE_GOAL);
    const cpuPct = Math.min(1, cpu.distance / RACE_GOAL);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(14, barY, barW, barH);
    ctx.fillStyle = "#42a5f5";
    ctx.fillRect(14, barY, barW * youPct, barH);
    ctx.fillStyle = cpu.dead ? "#78909c" : "#ef5350";
    ctx.fillRect(14, barY + 14, barW * cpuPct, barH);

    ctx.font = "700 11px system-ui,sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(`YOU → ${Math.floor(distance)} m`, 14, barY - 4);
    ctx.fillText(`${cpu.dead ? "CPU OUT" : "CPU"} → ${Math.floor(cpu.distance)} m`, 14, barY + 28);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    DRSprites.drawSky(ctx, w, h, scroll, animT);
    DRSprites.drawTerrain(ctx, w, h, scroll, animT);
    DRSprites.drawSpeedLines(ctx, w, h, speed, scroll, animT);

    const drawList = entities.map((e) => ({ ...e, sortY: e.y }));
    drawList.sort((a, b) => a.sortY - b.sortY);
    drawList.forEach((e) => {
      const depth = 0.85 + (e.y / h) * 0.2;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(depth, depth);
      ctx.translate(-e.x, -e.y);
      if (e.type === "gem") DRSprites.drawGem(ctx, e.x, e.y, animT + e.x * 0.01);
      else if (e.type === "ring") DRSprites.drawRing(ctx, e.x, e.y, e.passed, animT);
      else DRSprites.drawObstacle(ctx, e.x, e.y, e.kind, animT, scroll);
      ctx.restore();
    });

    DRSprites.drawParticles(ctx, particles.filter((p) => p.kind !== "spark"));

    if (raceMode && cpu && !cpu.dead) {
      DRSprites.drawDragon(ctx, cpu.x, cpu.y, 1.18, -1, cpu.dragon, animT + 0.4, {
        boost: true,
        speed,
        bank: cpu.bank || 0,
      });
    }

    DRSprites.drawDragon(ctx, player.x, player.y, 1.18, 1, state.dragon, animT, {
      boost: true,
      speed,
      bank,
      invincible: invincible > 0,
    });

    DRSprites.drawParticles(ctx, particles.filter((p) => p.kind === "spark"));

    drawRaceHud();

    const hud = raceMode
      ? `${DRAGONS[state.dragon].name} vs ${cpu?.dead ? "CPU (out)" : DRAGONS[cpu?.dragon]?.name || "CPU"} · ${Math.floor(speed)} km/h`
      : `${DRAGONS[state.dragon].name} · ${Math.floor(speed)} km/h · ${Math.floor(distance)} m`;
    ctx.font = "700 13px system-ui,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 3;
    ctx.textAlign = "left";
    ctx.strokeText(hud, 14, 28);
    ctx.fillText(hud, 14, 28);

    window.GameRealism?.postFrame(ctx, w, h, {
      animT,
      focusX: player.x,
      focusY: player.y,
      vignette: 0.22,
      grainCount: 120,
      haze: true,
      horizon: 0.42,
    });
  }

  function loop(now) {
    const t = typeof now === "number" ? now : performance.now();
    let dt = (t - lastFrame) / 1000;
    if (!Number.isFinite(dt) || dt <= 0) {
      requestAnimationFrame(loop);
      return;
    }
    dt = Math.min(0.05, dt);
    lastFrame = t;

    if (playing) {
      animT += dt;
      update(dt);
      draw();
    } else {
      drawAttract(dt);
      window.DRHub?.drawMenuHeroDragon(performance.now());
    }
    requestAnimationFrame(loop);
  }

  function setupJoystick() {
    if (window.AllOutControls) {
      AllOutControls.bindJoystick(joy, keys);
    } else {
      const base = document.getElementById("joystick-base");
      const knob = document.getElementById("joystick-knob");
      if (!base || !knob) return;
      let pid = null;
      base.addEventListener("pointerdown", (e) => {
        pid = e.pointerId;
        base.setPointerCapture(pid);
      });
      base.addEventListener("pointermove", (e) => {
        if (e.pointerId !== pid) return;
        const r = base.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let dx = e.clientX - cx;
        let dy = e.clientY - cy;
        const max = r.width * 0.35;
        const len = Math.hypot(dx, dy) || 1;
        if (len > max) {
          dx = (dx / len) * max;
          dy = (dy / len) * max;
        }
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        joy.dx = dx / max;
        joy.dy = dy / max;
      });
      const end = (e) => {
        if (e.pointerId !== pid) return;
        joy.dx = 0;
        joy.dy = 0;
        knob.style.transform = "translate(-50%, -50%)";
      };
      base.addEventListener("pointerup", end);
      base.addEventListener("pointercancel", end);
    }
  }

  function setKeyState(e, down) {
    keys[e.key] = down;
    keys[e.code] = down;
    keys[e.key.toLowerCase()] = down;
  }

  function bindEvents() {
    document.getElementById("play-btn")?.addEventListener("click", startGame);
    document.getElementById("retry-btn")?.addEventListener("click", startGame);
    document.getElementById("menu-btn")?.addEventListener("click", () => {
      playing = false;
      document.getElementById("gameover-overlay").classList.add("hidden");
      document.getElementById("app").classList.remove("playing");
      window.DRHub?.showMainMenu();
    });

    window.addEventListener("keydown", (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (playing && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      setKeyState(e, true);
      const k = e.key.toLowerCase();
      if ((k === " " || k === "enter") && !playing) {
        const menuVisible = !document.getElementById("main-menu")?.classList.contains("hidden");
        const gameOverVisible = !document.getElementById("gameover-overlay")?.classList.contains("hidden");
        if (menuVisible) startGame();
        else if (gameOverVisible) startGame();
      }
    });
    window.addEventListener("keyup", (e) => {
      setKeyState(e, false);
    });
    window.addEventListener("resize", () => {
      resize();
      window.DRHub?.resizeMenuHeroCanvas();
    });
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    canvas.setAttribute("tabindex", "0");
    canvas.style.outline = "none";
    loadState();
    document.getElementById("name-input").value = state.name;
    updateHud();
    setupJoystick();
    bindEvents();
    window.DRHub?.init({
      getState: () => state,
      saveState,
      startGame,
      showToast,
    });
    resize();
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }

  init();
})();
