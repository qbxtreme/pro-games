(function () {
  "use strict";

  const SAVE_KEY = "escapeTsunamiBrainrotSave";
  const WORLD_W = 3200;
  const WORLD_H = 520;
  const BASE_W = 340;
  const TRACK_Y = 180;
  const TRACK_H = 130;
  const TRENCH_DEPTH = 80;
  const PLAYER_R = 18;
  const BASE_SPEED = 220;
  const MAX_CARRY = 7;
  const MAX_BASE_SLOTS = 24;
  const WAVE_INTERVAL = 14;
  const PICKUP_R = 36;
  const DESPAWN_SEC = 45;

  const CATALOG = window.StealBrainrotCatalog;
  const RARITY = CATALOG?.RARITY || {};
  const ALL_BR = CATALOG?.LIST || [];

  const ZONES = [
    { name: "Common", x0: 360, x1: 900, rarities: ["common"] },
    { name: "Rare", x0: 900, x1: 1400, rarities: ["rare"] },
    { name: "Epic", x0: 1400, x1: 1900, rarities: ["epic"] },
    { name: "Legendary", x0: 1900, x1: 2400, rarities: ["legendary"] },
    { name: "Mythic+", x0: 2400, x1: WORLD_W - 40, rarities: ["mythic", "god", "secret", "og"] },
  ];

  const TRENCHES = [
    { x0: 520, x1: 620 },
    { x0: 980, x1: 1080 },
    { x0: 1440, x1: 1540 },
    { x0: 1900, x1: 2000 },
    { x0: 2360, x1: 2460 },
    { x0: 2720, x1: 2820 },
  ];

  const WAVE_TYPES = [
    { name: "Super Slow", speed: 95, color: "#4dd0e1" },
    { name: "Slow", speed: 140, color: "#26c6da" },
    { name: "Medium", speed: 210, color: "#00acc1" },
    { name: "Fast", speed: 300, color: "#00838f" },
    { name: "Lightning", speed: 420, color: "#ffd54f" },
    { name: "Beast", speed: 520, color: "#ef5350" },
  ];

  const WORLD_TO_3D = 0.045;

  let canvas, ctx, wrap;
  let playing = false;
  let viewW = 800;
  let viewH = 480;
  let canvasDpr = 1;
  let cam = { x: 0, y: 0 };
  let player = { x: 120, y: TRACK_Y, facing: 1, inTrench: false };
  let moveJoy = { dx: 0, dy: 0 };
  let keys = {};
  let animT = 0;
  let slowMode = false;
  let wave = null;
  let waveTimer = WAVE_INTERVAL;
  let trackBrainrots = [];
  let spawnTimer = 0;
  let toastTimer = 0;
  let incomeTimer = 0;
  let remotePlayers = [];

  let state = defaultState();

  function defaultState() {
    return {
      name: "Player",
      cash: 100,
      speedLevel: 0,
      carryLevel: 0,
      baseSlots: 8,
      rebirths: 0,
      deposited: [],
      upgrades: { speed: 0, carry: 0, base: 0 },
    };
  }

  function playerName() {
    const n = document.getElementById("name-input")?.value.trim();
    if (n) return n.slice(0, 14);
    try {
      const s = localStorage.getItem("becomeAProChatName");
      if (s && s.trim()) return s.trim().slice(0, 14);
    } catch (_) {}
    return state.name || "Player";
  }

  function speedMult() {
    return 1 + state.speedLevel * 0.22;
  }

  function carryCap() {
    return Math.min(MAX_CARRY, 1 + state.carryLevel);
  }

  function rebirthMult() {
    return 1 + state.rebirths * 0.25;
  }

  function incomeRate() {
    return state.deposited.reduce((s, b) => s + (b.income || 1), 0) * rebirthMult();
  }

  function formatCash(n) {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e4) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${Math.floor(n)}`;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
    } catch (_) {}
    return defaultState();
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
    toastTimer = 2.5;
  }

  function pickBrainrotForZone(x) {
    const zone = ZONES.find((z) => x >= z.x0 && x < z.x1) || ZONES[0];
    const pool = ALL_BR.filter((b) => zone.rarities.includes(b.rarity));
    if (!pool.length) return ALL_BR[0];
    const weights = pool.map((b) => RARITY[b.rarity]?.weight || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function spawnTrackBrainrot() {
    const x = 400 + Math.random() * (WORLD_W - 480);
    const def = pickBrainrotForZone(x);
    trackBrainrots.push({
      uid: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      def,
      x,
      y: TRACK_Y - 8,
      life: DESPAWN_SEC,
    });
  }

  function inTrenchAt(x, y) {
    if (y < TRACK_Y + TRACK_H * 0.28) return false;
    return TRENCHES.some((t) => x >= t.x0 && x <= t.x1);
  }

  function inBase() {
    return player.x <= BASE_W - PLAYER_R;
  }

  function trenchAt(x) {
    return TRENCHES.find((t) => x >= t.x0 && x <= t.x1);
  }

  function startWave() {
    const type = WAVE_TYPES[Math.floor(Math.random() * WAVE_TYPES.length)];
    wave = {
      x: WORLD_W + 40,
      w: 140,
      ...type,
    };
    document.getElementById("wave-warning")?.classList.remove("hidden");
    showToast(`🌊 ${type.name} tsunami!`);
  }

  function carriedList() {
    return state.carried || (state.carried = []);
  }

  function depositAtBase() {
    if (player.x > BASE_W - 20) return;
    const carried = carriedList();
    if (!carried.length) return;
    const room = state.baseSlots - state.deposited.length;
    if (room <= 0) {
      showToast("Base full — upgrade slots in shop!");
      return;
    }
    const toDeposit = carried.splice(0, room);
    state.deposited.push(...toDeposit);
    showToast(`Deposited ${toDeposit.length} BrainRot${toDeposit.length === 1 ? "" : "s"}! 🏠`);
    saveState();
    updateHud();
  }

  function tryPickup() {
    const carried = carriedList();
    if (carried.length >= carryCap()) return;
    let best = null;
    let bestD = PICKUP_R;
    trackBrainrots.forEach((b) => {
      const d = Math.hypot(b.x - player.x, b.y - player.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    });
    if (!best) return;
    trackBrainrots = trackBrainrots.filter((b) => b.uid !== best.uid);
    carried.push({ ...best.def, uid: best.uid });
    showToast(`Picked up ${best.def.emoji} ${best.def.name}!`);
    updateHud();
  }

  function dieToWave() {
    const lost = carriedList().length;
    state.carried = [];
    player.x = 80;
    player.y = TRACK_Y;
    player.inTrench = false;
    wave = null;
    waveTimer = WAVE_INTERVAL;
    document.getElementById("wave-warning")?.classList.add("hidden");
    showToast(lost ? `💀 Swept away! Lost ${lost} BrainRot${lost === 1 ? "" : "s"}.` : "💀 Tsunami got you! Back to base.");
    updateHud();
  }

  function upgradeCost(kind) {
    const lvl = state.upgrades[kind] || 0;
    if (kind === "speed") return Math.floor(150 * Math.pow(1.55, lvl));
    if (kind === "carry") return Math.floor(500 * Math.pow(2.1, lvl));
    if (kind === "base") return Math.floor(800 * Math.pow(1.85, lvl));
    return 999;
  }

  function buyUpgrade(kind) {
    const cost = upgradeCost(kind);
    if (state.cash < cost) {
      showToast(`Need ${formatCash(cost)}!`);
      return;
    }
    if (kind === "speed") {
      state.cash -= cost;
      state.upgrades.speed += 1;
      state.speedLevel += 1;
      showToast(`Speed up! Now ${speedMult().toFixed(1)}× 🏃`);
    } else if (kind === "carry") {
      if (state.carryLevel >= MAX_CARRY - 1) {
        showToast("Max carry reached!");
        return;
      }
      state.cash -= cost;
      state.upgrades.carry += 1;
      state.carryLevel += 1;
      showToast(`Carry ${carryCap()} BrainRots! 🎒`);
    } else if (kind === "base") {
      if (state.baseSlots >= MAX_BASE_SLOTS) {
        showToast("Max base slots!");
        return;
      }
      state.cash -= cost;
      state.upgrades.base += 1;
      state.baseSlots += 2;
      showToast(`Base holds ${state.baseSlots} BrainRots! 🏠`);
    }
    saveState();
    updateHud();
    renderShop();
  }

  function rebirthCost() {
    return Math.floor(5000 * Math.pow(1.8, state.rebirths));
  }

  function canRebirth() {
    return state.speedLevel >= 3 + state.rebirths * 2 && state.cash >= rebirthCost();
  }

  function doRebirth() {
    if (!canRebirth()) {
      showToast(`Need speed Lv ${3 + state.rebirths * 2}+ & ${formatCash(rebirthCost())}`);
      return;
    }
    state.cash -= rebirthCost();
    state.rebirths += 1;
    state.speedLevel = 0;
    state.upgrades.speed = 0;
    showToast(`♻️ Rebirth ${state.rebirths}! Money ×${rebirthMult().toFixed(2)}`);
    saveState();
    updateHud();
    renderShop();
  }

  function renderShop() {
    const list = document.getElementById("upgrade-list");
    if (!list) return;
    const rows = [
      { kind: "speed", label: `🏃 Speed (Lv ${state.speedLevel})`, desc: `${speedMult().toFixed(1)}× run speed` },
      { kind: "carry", label: `🎒 Carry (Lv ${state.carryLevel})`, desc: `${carryCap()} at a time` },
      { kind: "base", label: `🏠 Base slots`, desc: `${state.deposited.length}/${state.baseSlots} filled` },
    ];
    list.innerHTML = rows.map((r) => {
      const cost = upgradeCost(r.kind);
      const maxed = (r.kind === "carry" && state.carryLevel >= MAX_CARRY - 1)
        || (r.kind === "base" && state.baseSlots >= MAX_BASE_SLOTS);
      return `<div class="upgrade-row">
        <div><strong>${r.label}</strong><br><span style="font-size:0.75rem">${r.desc}</span></div>
        <button type="button" data-kind="${r.kind}" ${maxed || state.cash < cost ? "disabled" : ""}>${maxed ? "MAX" : formatCash(cost)}</button>
      </div>`;
    }).join("");
    list.querySelectorAll("button[data-kind]").forEach((btn) => {
      btn.addEventListener("click", () => buyUpgrade(btn.dataset.kind));
    });
  }

  function updateHud() {
    document.getElementById("cash-display").textContent = formatCash(state.cash);
    document.getElementById("income-display").textContent = `${formatCash(incomeRate())}/s`;
    document.getElementById("speed-display").textContent = `🏃 ${speedMult().toFixed(1)}`;
    document.getElementById("rebirth-display").textContent = `♻️ ×${rebirthMult().toFixed(1)}`;
    const carried = carriedList();
    const carryEl = document.getElementById("carry-hud");
    if (carryEl) {
      carryEl.textContent = carried.length
        ? `🎒 ${carried.map((c) => c.emoji).join(" ")} (${carried.length}/${carryCap()})`
        : "🎒 Carrying: none";
    }
    const rebirthBtn = document.getElementById("rebirth-btn");
    if (rebirthBtn) {
      rebirthBtn.textContent = canRebirth() ? `♻️ Rebirth ${formatCash(rebirthCost())}` : "♻️ Rebirth";
    }
  }

  function worldToScreen(x, y) {
    const ac = window.AllOutCamera;
    if (ac) return ac.worldToScreen(x, y, cam, viewW, viewH);
    return { x: x - cam.x + viewW / 2, y: y - cam.y + viewH / 2 };
  }

  function camViewOrigin() {
    const ac = window.AllOutCamera;
    if (ac) return ac.camOrigin(cam, viewW, viewH);
    return { x: cam.x - viewW / 2, y: cam.y - viewH / 2 };
  }

  function resize() {
    if (!wrap || !canvas || !ctx) return;
    const rect = wrap.getBoundingClientRect();
    viewW = Math.max(320, Math.floor(rect.width));
    viewH = Math.max(240, Math.floor(rect.height));
    canvasDpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.floor(viewW * canvasDpr));
    canvas.height = Math.max(1, Math.floor(viewH * canvasDpr));
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, "#81d4fa");
    g.addColorStop(0.45, "#4fc3f7");
    g.addColorStop(1, "#00838f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  function drawBrainrotSprite(ctx, x, y, def, size) {
    if (document.getElementById("app")?.classList.contains("game-3d-active")) return;
    if (window.BrainrotPortraits?.draw(ctx, x, y, def, size)) return;
    const col = RARITY[def?.rarity]?.color || "#9e9e9e";
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, (size || 32) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${Math.round((size || 32) * 0.45)}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(def?.emoji || "🧠", x, y + 4);
  }

  function drawWorld() {
    const origin = camViewOrigin();
    drawSky();

    const trackTop = worldToScreen(0, TRACK_Y - TRACK_H / 2);
    const trackBot = worldToScreen(WORLD_W, TRACK_Y + TRACK_H / 2 + TRENCH_DEPTH);
    const trackScreenW = trackBot.x - trackTop.x;

    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(trackTop.x, trackTop.y, trackScreenW, trackBot.y - trackTop.y);

    TRENCHES.forEach((t) => {
      const tl = worldToScreen(t.x0, TRACK_Y + 4);
      const br = worldToScreen(t.x1, TRACK_Y + TRENCH_DEPTH);
      ctx.fillStyle = "#4e342e";
      ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      ctx.fillStyle = "rgba(0,188,212,0.25)";
      ctx.fillRect(tl.x + 4, tl.y + 4, br.x - tl.x - 8, 16);
      ctx.font = "bold 9px system-ui,sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("SAFE", (tl.x + br.x) / 2, tl.y + 28);
    });

    const baseR = worldToScreen(BASE_W, TRACK_Y + TRACK_H / 2);
    const baseL = worldToScreen(0, TRACK_Y - TRACK_H / 2 - 40);
    ctx.fillStyle = "#546e7a";
    ctx.fillRect(baseL.x, baseL.y, baseR.x - baseL.x, baseR.y - baseL.y + 40);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏠 BASE", (baseL.x + baseR.x) / 2, baseL.y + 24);
    ctx.font = "600 9px system-ui,sans-serif";
    ctx.fillText("Deposit here", (baseL.x + baseR.x) / 2, baseL.y + 40);

    state.deposited.slice(0, 12).forEach((b, i) => {
      const px = 40 + (i % 4) * 70;
      const py = TRACK_Y - 50 - Math.floor(i / 4) * 28;
      const s = worldToScreen(px, py);
      drawBrainrotSprite(ctx, s.x, s.y, b, 28);
    });

    ZONES.forEach((z) => {
      const s = worldToScreen((z.x0 + z.x1) / 2, TRACK_Y - 70);
      if (s.x < -80 || s.x > viewW + 80) return;
      ctx.font = "bold 10px system-ui,sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.fillText(z.name, s.x, s.y);
    });

    trackBrainrots.forEach((b) => {
      const s = worldToScreen(b.x, b.y);
      if (s.x < -40 || s.x > viewW + 40) return;
      const col = RARITY[b.def.rarity]?.color || "#9e9e9e";
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      drawBrainrotSprite(ctx, s.x, s.y, b.def, 36);
      ctx.font = "bold 7px system-ui,sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(`${formatCash(b.def.income)}/s`, s.x, s.y - 24);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(`${Math.ceil(b.life)}s`, s.x, s.y + 28);
      ctx.restore();
    });

    if (wave) {
      const waveBack = wave.x - wave.w;
      const drawStart = Math.max(BASE_W, waveBack);
      const wl = worldToScreen(drawStart, TRACK_Y - TRACK_H * 0.55);
      const wr = worldToScreen(wave.x, TRACK_Y + TRACK_H / 2 + TRENCH_DEPTH + 20);
      if (wr.x > worldToScreen(BASE_W, 0).x) {
        const wg = ctx.createLinearGradient(wr.x, 0, wl.x, 0);
        wg.addColorStop(0, wave.color);
        wg.addColorStop(1, "rgba(255,255,255,0.15)");
        ctx.fillStyle = wg;
        ctx.fillRect(wl.x, wl.y, wr.x - wl.x, wr.y - wl.y);
        ctx.font = "bold 11px system-ui,sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(`🌊 ${wave.name}`, (wl.x + wr.x) / 2, wl.y + 20);
      }
    }

    remotePlayers.forEach((p) => {
      const st = p.state || {};
      drawPlayer(st.x ?? 120, st.y ?? TRACK_Y, "#ef5350", p.name || "Player", false);
    });
    drawPlayer(player.x, player.y, "#42a5f5", playerName(), true);
  }

  function drawPlayer(x, y, color, name, isYou) {
    const s = worldToScreen(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 12, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, isYou ? 16 : 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isYou ? "#fff176" : "#fff";
    ctx.lineWidth = isYou ? 3 : 2;
    ctx.stroke();
    ctx.font = "600 8px system-ui,sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(name.slice(0, 10), s.x, s.y - 22);
    if (isYou) {
      ctx.fillStyle = "#fff176";
      ctx.fillText("YOU", s.x, s.y + 26);
    }
  }

  function gameLoop(ts) {
    if (!playing) return;
    const dt = Math.min(0.05, (ts - (gameLoop.last || ts)) / 1000);
    gameLoop.last = ts;
    animT = ts / 1000;

    let mx = moveJoy.dx;
    let my = moveJoy.dy;
    if (keys.ArrowLeft || keys.a) mx -= 1;
    if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowUp || keys.w) my -= 1;
    if (keys.ArrowDown || keys.s) my += 1;
    const m = Math.hypot(mx, my);
    const spdMult = slowMode ? 0.45 : 1;
    if (m > 0.12) {
      const speed = BASE_SPEED * speedMult() * spdMult * dt;
      const nx = player.x + (mx / m) * speed;
      let ny = player.y + (my / m) * speed * 0.85;
      const trench = trenchAt(nx);
      const halfTrack = TRACK_H / 2;
      const minY = trench ? TRACK_Y + TRENCH_DEPTH - 8 : TRACK_Y - halfTrack + 14;
      const maxY = trench ? TRACK_Y + halfTrack * 0.4 : TRACK_Y + halfTrack - 14;
      ny = Math.max(minY, Math.min(maxY, ny));
      player.x = Math.max(24, Math.min(WORLD_W - 24, nx));
      player.y = ny;
      player.inTrench = inTrenchAt(player.x, player.y);
      player.facing = mx >= 0 ? 1 : -1;
    }

    if (window.AllOutCamera) {
      AllOutCamera.follow(cam, player.x, player.y, dt, mx, my, 10);
    } else {
      cam.x += (player.x - cam.x) * 0.12;
      cam.y += (player.y - cam.y) * 0.12;
    }

    depositAtBase();
    tryPickup();

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 2.2 + Math.random() * 1.5;
      if (trackBrainrots.length < 28) spawnTrackBrainrot();
    }

    trackBrainrots.forEach((b) => { b.life -= dt; });
    trackBrainrots = trackBrainrots.filter((b) => b.life > 0);

    waveTimer -= dt;
    if (!wave && waveTimer <= 0) startWave();

    if (wave) {
      wave.x -= wave.speed * dt;
      if (wave.x - wave.w < BASE_W) {
        wave.x = BASE_W + wave.w;
        wave.stopped = true;
      }
      const onTrack = player.y <= TRACK_Y + TRACK_H * 0.42;
      const safe = inBase() || (player.inTrench && player.y > TRACK_Y + TRACK_H * 0.3);
      if (!wave.stopped && wave.x - wave.w < player.x + PLAYER_R && wave.x > player.x - PLAYER_R && onTrack && !safe) {
        dieToWave();
      }
      if (wave.stopped) {
        wave.stuckTimer = (wave.stuckTimer || 0) + dt;
        if (wave.stuckTimer > 1.4) {
          wave = null;
          waveTimer = WAVE_INTERVAL;
          document.getElementById("wave-warning")?.classList.add("hidden");
        }
      } else if (wave.x < -80) {
        wave = null;
        waveTimer = WAVE_INTERVAL;
        document.getElementById("wave-warning")?.classList.add("hidden");
      }
    }

    incomeTimer += dt;
    if (incomeTimer >= 1) {
      const gain = incomeRate();
      if (gain > 0) state.cash += gain;
      incomeTimer = 0;
      updateHud();
    }

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) document.getElementById("toast")?.classList.add("hidden");
    }

    drawWorld();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    state.name = playerName();
    state.carried = [];
    saveState();
    playing = true;
    player = { x: 100, y: TRACK_Y, facing: 1, inTrench: false };
    cam = { x: player.x, y: player.y };
    wave = null;
    waveTimer = 8;
    trackBrainrots = [];
    for (let i = 0; i < 10; i++) spawnTrackBrainrot();
    document.getElementById("start-overlay")?.classList.add("hidden");
    document.getElementById("shop-btn")?.classList.remove("hidden");
    document.getElementById("rebirth-btn")?.classList.remove("hidden");
    document.getElementById("slow-btn")?.classList.remove("hidden");
    document.getElementById("joystick-wrap")?.classList.remove("hidden");
    updateHud();
    requestAnimationFrame(gameLoop);
  }

  function bindEvents() {
    document.getElementById("hub-btn")?.addEventListener("click", () => {
      if (window.GameMP) GameMP.stop();
      window.location.href = "../../index.html";
    });
    document.getElementById("play-btn")?.addEventListener("click", startGame);
    document.getElementById("shop-btn")?.addEventListener("click", () => {
      renderShop();
      document.getElementById("shop-overlay")?.classList.remove("hidden");
    });
    document.getElementById("shop-close-btn")?.addEventListener("click", () => {
      document.getElementById("shop-overlay")?.classList.add("hidden");
    });
    document.getElementById("rebirth-btn")?.addEventListener("click", doRebirth);
    document.getElementById("slow-btn")?.addEventListener("click", () => {
      slowMode = !slowMode;
      document.getElementById("slow-btn")?.classList.toggle("active", slowMode);
      showToast(slowMode ? "🐢 Slow mode ON" : "Slow mode off");
    });
    if (typeof AllOutControls !== "undefined") AllOutControls.bindJoystick(moveJoy, keys);
    window.addEventListener("resize", resize);
  }

  function startMultiplayer() {
    if (!window.GameMP) return;
    GameMP.init({
      game: "escape-tsunami-brainrot",
      subroom: "track",
      getName: playerName,
      getState: () => ({
        x: player.x,
        y: player.y,
        facing: player.facing,
        name: playerName(),
      }),
      onPeers: (peers) => { remotePlayers = peers; },
    });
    GameMP.start();
  }

  function cameraConfig3D() {
    const touchDevice = window.matchMedia?.("(pointer: coarse)")?.matches
      || /iPad|iPhone|iPod|Android/i.test(navigator.userAgent || "");
    return window.AllOutCamera?.standard3D({
      fov: touchDevice ? 48 : 44,
      height: touchDevice ? 14 : 13,
      distance: touchDevice ? 13 : 12,
      fogFar: 240,
      lookAtY: 0.55,
      lerp: 0.12,
    }) || {
      style: "fixed", height: 13, distance: 12, fov: 44, fogFar: 240, lookAtY: 0.55, lerp: 0.1,
    };
  }

  function brainrotModel(def) {
    return window.StealBrainrotModels?.modelId(def?.id) || "brainrot";
  }

  function brainrotColor(def) {
    return RARITY[def?.rarity]?.color || "#9e9e9e";
  }

  function buildTrackProps3D() {
    const trackScaleX = (WORLD_W * WORLD_TO_3D) / 1.75;
    const trackScaleZ = (TRACK_H * WORLD_TO_3D) / 2.4;
    const props = [
      {
        id: "track_main",
        x: WORLD_W / 2,
        y: TRACK_Y,
        model: "base_floor",
        color: "#8d6e63",
        scale: 1.2,
        scaleX: trackScaleX,
        scaleZ: trackScaleZ * 1.15,
        yLift: 0,
      },
      {
        id: "base_platform",
        x: BASE_W / 2,
        y: TRACK_Y - TRACK_H * 0.15,
        model: "base",
        color: "#546e7a",
        scale: (BASE_W * WORLD_TO_3D) / 3.8,
        scaleZ: trackScaleZ * 0.95,
        yLift: 0,
      },
    ];
    TRENCHES.forEach((t, i) => {
      const cx = (t.x0 + t.x1) / 2;
      const w = t.x1 - t.x0;
      props.push({
        id: `trench_${i}`,
        x: cx,
        y: TRACK_Y + TRENCH_DEPTH * 0.45,
        model: "trench",
        color: "#5d4037",
        scale: 1,
        scaleX: (w * WORLD_TO_3D) / 1.15,
        scaleZ: trackScaleZ * 0.85,
        yLift: -0.05,
      });
    });
    return props;
  }

  window.__escapeTsunamiBrainrot3D = function () {
    if (!canvas || !playing) return null;

    const trackScaleZ = (TRACK_H * WORLD_TO_3D) / 2.4;
    const props = buildTrackProps3D();

    if (wave && wave.x - wave.w < WORLD_W) {
      const waveDrawX = Math.max(BASE_W + (wave.w / 2), wave.x - wave.w / 2);
      props.push({
        id: "tsunami_wave",
        x: waveDrawX,
        y: TRACK_Y + TRENCH_DEPTH * 0.35,
        model: "wave",
        color: wave.color,
        scale: 1.15,
        scaleX: (wave.w * WORLD_TO_3D) / 0.55,
        scaleZ: trackScaleZ * 1.1,
        yLift: 0,
      });
    }

    state.deposited.slice(0, 12).forEach((b, i) => {
      props.push({
        id: `dep_${i}_${b.uid || b.id}`,
        x: 40 + (i % 4) * 70,
        y: TRACK_Y - 50 - Math.floor(i / 4) * 28,
        model: brainrotModel(b),
        color: brainrotColor(b),
        scale: 0.42,
        yLift: 0.15,
      });
    });

    const entities = [
      ...trackBrainrots.map((b) => ({
        id: `pick_${b.uid}`,
        x: b.x,
        y: b.y,
        model: brainrotModel(b.def),
        color: brainrotColor(b.def),
        scale: 0.5,
        facing: 1,
        yLift: 0.12,
      })),
      ...remotePlayers.map((p, i) => ({
        id: `peer_${p.id || i}`,
        x: p.state?.x ?? 120,
        y: p.state?.y ?? TRACK_Y,
        model: "lifter",
        color: "#ef5350",
        scale: 0.52,
        facing: p.state?.facing ?? 1,
        yLift: 0,
      })),
    ];

    return {
      worldW: WORLD_W,
      worldH: WORLD_H,
      ground: "#4fc3f7",
      defaultModel: "brainrot",
      camera: cameraConfig3D(),
      player: {
        x: player.x,
        y: player.y,
        facing: player.facing,
        model: "brainrot",
        color: "#42a5f5",
        scale: 0.55,
        yLift: player.inTrench ? -0.08 : 0,
      },
      props,
      entities,
    };
  };

  function init() {
    canvas = document.getElementById("game-canvas");
    wrap = document.getElementById("game-wrap");
    ctx = canvas.getContext("2d");
    state = loadState();
    const nameInput = document.getElementById("name-input");
    if (nameInput) nameInput.value = state.name;
    bindEvents();
    resize();
    updateHud();
    startMultiplayer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
