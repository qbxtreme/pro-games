(function () {
  "use strict";

  const SAVE_KEY = "stealABrainrotSave";
  const OG_WEEK_KEY = "stealBrainrotOgWeek";
  const CATALOG = window.StealBrainrotCatalog;
  const RARITY = CATALOG.RARITY;

  const WORLD_W = 1000;
  const WORLD_H = 1500;
  const TUNNEL_X = WORLD_W / 2;
  const TUNNEL_Y = 72;
  const BELT_W = 160;
  const BELT_X = TUNNEL_X - BELT_W / 2;
  const BELT_TOP = 110;
  const BELT_BOT = 1320;
  const BASES_PER_SIDE = 5;
  const TOTAL_BASES = 10;
  const BASE_W = 350;
  const BASE_H = 208;
  const BASE_GAP = 12;
  const WALL_PAD = 54;
  const LEFT_BASE_X = WALL_PAD + 4;
  const RIGHT_BASE_X = WORLD_W - WALL_PAD - BASE_W - 4;
  const WORLD_TO_3D = 0.045;
  const BASE_MODEL_W = 3.8;
  const BASE_MODEL_D = 2.6;
  const BASE_FLOOR_W = 3.6;
  const BASE_FLOOR_D = 2.4;
  const FLOOR_LIFT_WORLD = 34;
  const MAX_SLOTS = 8;
  const MAX_REBIRTHS = 20;
  const REBIRTH_FLOOR_STEP = 5;
  const PITY_LEGENDARY_MS = 5 * 60 * 1000;
  const PITY_MYTHIC_MS = 15 * 60 * 1000;
  const SPAWN_INTERVAL_MS = 2200;
  const BELT_NEAR_R = 130;
  const OWNED_NEAR_R = 52;

  function buildBaseLayout() {
    const layout = [];
    const startY = BELT_TOP + 18;
    for (let i = 0; i < BASES_PER_SIDE; i++) {
      const y = startY + i * (BASE_H + BASE_GAP);
      layout.push({ slot: i, side: "left", x: LEFT_BASE_X, y, w: BASE_W, h: BASE_H });
    }
    for (let i = 0; i < BASES_PER_SIDE; i++) {
      const y = startY + i * (BASE_H + BASE_GAP);
      layout.push({
        slot: BASES_PER_SIDE + i,
        side: "right",
        x: RIGHT_BASE_X,
        y,
        w: BASE_W,
        h: BASE_H,
      });
    }
    return layout;
  }

  const BASE_LAYOUT = buildBaseLayout();

  let canvas, ctx, wrap;
  let playing = false;
  let player = { x: BASE_LAYOUT[0].x + BASE_LAYOUT[0].w / 2, y: BASE_LAYOUT[0].y + BASE_LAYOUT[0].h / 2, facing: 1 };
  let cam = { x: player.x, y: player.y };
  let moveJoy = { dx: 0, dy: 0, active: false };
  let keys = {};
  let state = defaultState();
  let belt = [];
  let beltUid = 0;
  let lastSpawn = 0;
  let lastLegendaryPity = 0;
  let lastMythicPity = 0;
  let incomeTimer = null;
  let remotePlayers = [];
  let animT = 0;
  let sellTargetIndex = null;

  function defaultState() {
    return { name: "Player", cash: 100, owned: [], rebirths: 0, baseSlot: null };
  }

  function isoWeekKey() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  function ogSpawnedThisWeek() {
    try {
      return localStorage.getItem(OG_WEEK_KEY) === isoWeekKey();
    } catch (_) {
      return false;
    }
  }

  function markOgSpawned() {
    try { localStorage.setItem(OG_WEEK_KEY, isoWeekKey()); } catch (_) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = { ...defaultState(), ...JSON.parse(raw) };
        parsed.rebirths = Math.max(0, Math.min(MAX_REBIRTHS, parsed.rebirths || 0));
        if (parsed.baseSlot != null) {
          parsed.baseSlot = Math.max(0, Math.min(TOTAL_BASES - 1, parsed.baseSlot));
        }
        return parsed;
      }
    } catch (_) {}
    return defaultState();
  }

  function storyCount() {
    return 1 + Math.min(4, Math.floor(state.rebirths / REBIRTH_FLOOR_STEP));
  }

  function rebirthCost() {
    return Math.floor(5000 * Math.pow(2.15, state.rebirths));
  }

  function canRebirth() {
    return state.rebirths < MAX_REBIRTHS && state.cash >= rebirthCost();
  }

  function nextStoryRebirth() {
    const s = storyCount();
    if (s >= 5) return null;
    return s * REBIRTH_FLOOR_STEP;
  }

  function incomeMult() {
    return 1 + state.rebirths * 0.35;
  }

  function myBaseSlot() {
    const slot = state.baseSlot;
    if (slot == null || slot < 0 || slot >= TOTAL_BASES) return 0;
    return slot;
  }

  function baseRect(slot) {
    return BASE_LAYOUT[slot] || BASE_LAYOUT[0];
  }

  function myBaseRect() {
    return baseRect(myBaseSlot());
  }

  function baseOccupants() {
    const occupants = Array(TOTAL_BASES).fill(null);
    occupants[myBaseSlot()] = { name: state.name, isLocal: true };
    remotePlayers.forEach((p, i) => {
      let slot = p.state?.baseSlot;
      if (slot == null || slot < 0 || slot >= TOTAL_BASES || occupants[slot]) {
        slot = null;
        for (let s = 0; s < TOTAL_BASES; s++) {
          if (!occupants[s] && s !== myBaseSlot()) {
            slot = s;
            break;
          }
        }
      }
      if (slot != null && slot >= 0 && slot < TOTAL_BASES && !occupants[slot]) {
        occupants[slot] = { name: p.name || `Player ${i + 1}`, isLocal: false };
      }
    });
    return occupants;
  }

  function assignBaseSlot() {
    const taken = new Set();
    remotePlayers.forEach((p) => {
      const s = p.state?.baseSlot;
      if (s != null && s >= 0 && s < TOTAL_BASES) taken.add(s);
    });
    if (state.baseSlot != null && state.baseSlot >= 0 && state.baseSlot < TOTAL_BASES && !taken.has(state.baseSlot)) {
      return;
    }
    for (let i = 0; i < TOTAL_BASES; i++) {
      if (!taken.has(i)) {
        state.baseSlot = i;
        saveState();
        return;
      }
    }
    state.baseSlot = 0;
  }

  function baseLabel(slot, occupant) {
    return occupant ? occupant.name : "empty base";
  }

  function ownedSlotPos(index) {
    const b = myBaseRect();
    const col = index % 4;
    const row = Math.floor(index / 4);
    const padX = 52;
    const padY = 62;
    const innerW = b.w - padX * 2;
    const innerH = b.h - padY - 18;
    const cellW = innerW / 4;
    const cellH = innerH / 2;
    return {
      x: b.x + padX + col * cellW + cellW / 2,
      y: b.y + padY + row * cellH + cellH / 2,
    };
  }

  function nearBase() {
    const b = myBaseRect();
    return player.x >= b.x - 36 && player.x <= b.x + b.w + 36
      && player.y >= b.y - 36 && player.y <= b.y + b.h + 44;
  }

  function nearOwnedBrainrot() {
    let best = null;
    let bestD = Infinity;
    state.owned.forEach((o, i) => {
      const pos = ownedSlotPos(i);
      const d = Math.hypot(player.x - pos.x, player.y - pos.y);
      if (d < OWNED_NEAR_R && d < bestD) {
        bestD = d;
        best = { index: i, brainrot: o };
      }
    });
    return best;
  }

  function openSell() {
    const target = nearOwnedBrainrot();
    if (!target) return;
    sellTargetIndex = target.index;
    const o = target.brainrot;
    document.getElementById("sell-desc").textContent =
      `Sell ${o.emoji} ${o.name}? Type any price you want.`;
    const priceInput = document.getElementById("sell-price");
    if (priceInput) {
      priceInput.value = String(o.cost || 100);
    }
    document.getElementById("sell-overlay")?.classList.remove("hidden");
  }

  function closeSell() {
    sellTargetIndex = null;
    document.getElementById("sell-overlay")?.classList.add("hidden");
  }

  function doSell() {
    if (sellTargetIndex == null || sellTargetIndex < 0 || sellTargetIndex >= state.owned.length) {
      closeSell();
      return;
    }
    const raw = document.getElementById("sell-price")?.value.trim() || "";
    const price = Math.floor(Number(raw.replace(/[$,]/g, "")));
    if (!Number.isFinite(price) || price < 0) {
      flashHint("Enter a valid sell price!");
      return;
    }
    const sold = state.owned[sellTargetIndex];
    state.owned.splice(sellTargetIndex, 1);
    state.cash += price;
    saveState();
    closeSell();
    if (window.GameSFX?.play) GameSFX.play("coin");
    flashHint(`Sold ${sold.name} for ${formatCash(price)}!`);
    updateHud();
  }

  function openRebirth() {
    if (state.rebirths >= MAX_REBIRTHS) {
      flashHint("Max rebirths reached! (20/20)");
      return;
    }
    if (!canRebirth()) {
      flashHint(`Need ${formatCash(rebirthCost())} to rebirth!`);
      return;
    }
    const next = state.rebirths + 1;
    const nextFloor = 1 + Math.min(4, Math.floor(next / REBIRTH_FLOOR_STEP));
    const floorMsg = next % REBIRTH_FLOOR_STEP === 0
      ? ` Unlocks FLOOR ${nextFloor}!`
      : "";
    document.getElementById("rebirth-desc").textContent =
      `Pay ${formatCash(rebirthCost())} — keep your BrainRots & other cash.${floorMsg}`;
    document.getElementById("rebirth-multi").textContent =
      `Rebirth ${next}/${MAX_REBIRTHS} · Income x${(1 + next * 0.35).toFixed(2)} · ${storyCount()}→${nextFloor} ${nextFloor === 1 ? "story" : "stories"}`;
    document.getElementById("rebirth-confirm").value = "";
    document.getElementById("rebirth-overlay")?.classList.remove("hidden");
  }

  function closeRebirth() {
    document.getElementById("rebirth-overlay")?.classList.add("hidden");
  }

  function doRebirth() {
    const val = document.getElementById("rebirth-confirm")?.value.trim().toLowerCase();
    if (val !== "ok") {
      flashHint('Type "ok" to confirm rebirth!');
      return;
    }
    if (!canRebirth()) return;
    const prevStories = storyCount();
    const cost = rebirthCost();
    state.cash -= cost;
    state.rebirths += 1;
    saveState();
    closeRebirth();
    const newStories = storyCount();
    if (newStories > prevStories) {
      showBanner(`🏢 NEW FLOOR! ${newStories}-story base unlocked!`);
    }
    flashHint(`Rebirth ${state.rebirths}! Income x${incomeMult().toFixed(2)}`);
    updateHud();
  }

  function saveState() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function formatCash(n) {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${Math.floor(n)}`;
  }

  function totalIncome() {
    return state.owned.reduce((s, o) => s + (o.income || 0) * incomeMult(), 0);
  }

  function rollRarity(now) {
    if (now - lastMythicPity >= PITY_MYTHIC_MS) {
      lastMythicPity = now;
      return "mythic";
    }
    if (now - lastLegendaryPity >= PITY_LEGENDARY_MS) {
      lastLegendaryPity = now;
      return "legendary";
    }
    const order = ["common", "rare", "epic", "legendary", "mythic", "god", "secret"];
    let total = 0;
    order.forEach((r) => { total += RARITY[r].weight; });
    const ogAllowed = !ogSpawnedThisWeek();
    if (ogAllowed) total += RARITY.og.weight;
    const roll = Math.random() * total;
    let acc = 0;
    for (const r of order) {
      acc += RARITY[r].weight;
      if (roll < acc) return r;
    }
    if (ogAllowed) return "og";
    return "common";
  }

  function spawnBeltItem(forcedRarity) {
    const now = Date.now();
    const rarity = forcedRarity || rollRarity(now);
    const def = CATALOG.pickFromRarity(rarity);
    if (rarity === "og") markOgSpawned();
    beltUid += 1;
    belt.push({
      uid: beltUid,
      def,
      x: TUNNEL_X + (Math.random() - 0.5) * 40,
      y: BELT_TOP,
      price: def.cost,
    });
    if (rarity === "og") showBanner(`🌟 OG SPAWN: ${def.name}! Once per week!`);
    else if (rarity === "secret") showBanner(`✨ SECRET: ${def.name}!`);
    else if (rarity === "god") showBanner(`👑 BRAINROT GOD: ${def.name}!`);
  }

  function showBanner(msg) {
    const el = document.getElementById("spawn-banner");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => el.classList.add("hidden"), 4000);
  }

  function playerNearBeltItem(item) {
    return Math.hypot(player.x - item.x, player.y - item.y) < BELT_NEAR_R;
  }

  function nearBeltItem() {
    let best = null;
    let bestD = Infinity;
    belt.forEach((item) => {
      if (!playerNearBeltItem(item)) return;
      const d = Math.hypot(player.x - item.x, player.y - item.y);
      if (d < bestD) {
        bestD = d;
        best = item;
      }
    });
    return best;
  }

  let lastPickupHint = 0;

  function tryPurchaseBeltItem(item) {
    if (!item || !playerNearBeltItem(item)) return;
    const cost = item.price;
    if (state.owned.length >= MAX_SLOTS) {
      if (Date.now() - lastPickupHint > 1200) {
        flashHint(`Base full! (${MAX_SLOTS} slots)`);
        lastPickupHint = Date.now();
      }
      return;
    }
    if (state.cash < cost) {
      if (Date.now() - lastPickupHint > 1200) {
        flashHint(`Need ${formatCash(cost)}!`);
        lastPickupHint = Date.now();
      }
      return;
    }
    state.cash -= cost;
    state.owned.push({ ...item.def, uid: Date.now() + Math.random() });
    belt = belt.filter((b) => b.uid !== item.uid);
    saveState();
    if (window.GameSFX?.play) GameSFX.play("coin");
    flashHint(`Got ${item.def.name}! +${formatCash(item.def.income)}/s`);
    updateHud();
  }

  function buyBeltItem() {
    const item = nearBeltItem();
    if (item) tryPurchaseBeltItem(item);
  }

  function flashHint(msg) {
    const hint = document.getElementById("action-hint");
    if (hint) hint.textContent = msg;
  }

  function updateHud() {
    document.getElementById("cash-display").textContent = formatCash(state.cash);
    document.getElementById("income-display").textContent = `${formatCash(totalIncome())}/s`;
    document.getElementById("slots-display").textContent = `${state.owned.length}/${MAX_SLOTS}`;
    const rebEl = document.getElementById("rebirth-display");
    if (rebEl) {
      rebEl.textContent = `♻️ ${state.rebirths}/${MAX_REBIRTHS} · 🏢 ${storyCount()}F`;
    }
    const floorEl = document.getElementById("floor-display");
    if (floorEl) {
      const next = nextStoryRebirth();
      floorEl.textContent = next
        ? `Floor ${storyCount()} — next at rebirth ${next}`
        : `Floor ${storyCount()} — MAX`;
    }
    const buyBtn = document.getElementById("buy-btn");
    const sellBtn = document.getElementById("sell-btn");
    const rebirthBtn = document.getElementById("rebirth-btn");
    const item = nearBeltItem();
    const owned = nearOwnedBrainrot();
    if (buyBtn) {
      buyBtn.classList.toggle("hidden", !item);
      if (item) buyBtn.textContent = `💰 BUY ${formatCash(item.price)}`;
    }
    if (sellBtn) {
      sellBtn.classList.toggle("hidden", !owned);
      if (owned) {
        sellBtn.textContent = `💸 SELL ${owned.brainrot.emoji}`;
      }
    }
    if (rebirthBtn) {
      rebirthBtn.classList.toggle("hidden", !nearBase() || state.rebirths >= MAX_REBIRTHS);
      rebirthBtn.textContent = canRebirth() ? "♻️ REBIRTH" : `♻️ ${formatCash(rebirthCost())}`;
    }
    const ogEl = document.getElementById("og-timer");
    if (ogEl) {
      ogEl.textContent = ogSpawnedThisWeek()
        ? "OG this week: spawned ✓"
        : "OG this week: not yet spawned!";
    }
  }

  function tickIncome() {
    state.cash += totalIncome();
    saveState();
    updateHud();
  }

  function worldToScreen(x, y) {
    return { x: x - cam.x + canvas.width / 2, y: y - cam.y + canvas.height / 2 };
  }

  function drawGrass() {
    const tile = 48;
    const startX = Math.floor((cam.x - canvas.width / 2) / tile) * tile;
    const startY = Math.floor((cam.y - canvas.height / 2) / tile) * tile;
    for (let gy = startY; gy < cam.y + canvas.height / 2 + tile; gy += tile) {
      for (let gx = startX; gx < cam.x + canvas.width / 2 + tile; gx += tile) {
        const s = worldToScreen(gx, gy);
        const alt = ((Math.floor(gx / tile) + Math.floor(gy / tile)) & 1) === 0;
        ctx.fillStyle = alt ? "#66bb6a" : "#43a047";
        ctx.fillRect(s.x, s.y, tile + 1, tile + 1);
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(s.x, s.y + tile - 4, tile + 1, 4);
      }
    }
  }

  function drawWalls() {
    const tl = worldToScreen(WALL_PAD, WALL_PAD);
    const br = worldToScreen(WORLD_W - WALL_PAD, WORLD_H - WALL_PAD);
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    const thick = 14;
    ctx.fillStyle = "#424242";
    ctx.fillRect(tl.x - thick, tl.y - thick, w + thick * 2, thick);
    ctx.fillRect(tl.x - thick, br.y, w + thick * 2, thick);
    ctx.fillRect(tl.x - thick, tl.y, thick, h);
    ctx.fillRect(br.x, tl.y, thick, h);
    ctx.strokeStyle = "#212121";
    ctx.lineWidth = 2;
    ctx.strokeRect(tl.x - thick, tl.y - thick, w + thick * 2, h + thick * 2);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "600 9px system-ui,sans-serif";
    ctx.textAlign = "center";
    const edgeLabel = worldToScreen(WORLD_W / 2, WALL_PAD / 2);
    ctx.fillText("⛔ MAP EDGE", edgeLabel.x, edgeLabel.y);
  }

  function drawTunnel() {
    const s = worldToScreen(TUNNEL_X, TUNNEL_Y);
    ctx.save();
    ctx.fillStyle = "#37474f";
    ctx.beginPath();
    ctx.arc(s.x, s.y, 58, Math.PI, 0);
    ctx.lineTo(s.x + 58, s.y + 36);
    ctx.lineTo(s.x - 58, s.y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(s.x, s.y + 8, 38, 0, Math.PI * 2);
    ctx.fill();
    const pulse = 0.4 + Math.sin(animT * 4) * 0.15;
    ctx.fillStyle = `rgba(239, 83, 80, ${pulse})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y + 12, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BRAINROT TUNNEL", s.x, s.y - 48);
    ctx.restore();
  }

  function drawBelt() {
    const top = worldToScreen(BELT_X, BELT_TOP);
    const bot = worldToScreen(BELT_X + BELT_W, BELT_BOT);
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(top.x, top.y, bot.x - top.x, bot.y - top.y);
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 3;
    ctx.strokeRect(top.x, top.y, bot.x - top.x, bot.y - top.y);
    const stripe = 24;
    const offset = (animT * 60) % stripe;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let y = top.y - offset; y < bot.y; y += stripe) {
      ctx.fillRect(top.x, y, bot.x - top.x, stripe / 2);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "600 10px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CONVEYOR", top.x + (bot.x - top.x) / 2, top.y - 8);
  }

  function drawBase() {
    const occupants = baseOccupants();
    const mySlot = myBaseSlot();
    const myStories = storyCount();

    BASE_LAYOUT.forEach((rect, slot) => {
      const occupant = occupants[slot];
      const isMine = slot === mySlot;
      const stories = isMine ? myStories : 1;
      const label = baseLabel(slot, occupant);
      const fill = !occupant
        ? "rgba(120, 144, 156, 0.22)"
        : (isMine ? "rgba(66, 165, 245, 0.28)" : "rgba(239, 83, 80, 0.24)");
      const stroke = !occupant ? "#546e7a" : (isMine ? "#1565c0" : "#c62828");

      for (let f = 0; f < stories; f++) {
        const lift = f * 34;
        const tl = worldToScreen(rect.x, rect.y - lift);
        const br = worldToScreen(rect.x + rect.w, rect.y + rect.h - lift);
        let floorFill = fill;
        if (f > 0) {
          if (!occupant) floorFill = "rgba(120, 144, 156, 0.12)";
          else if (isMine) floorFill = "rgba(66, 165, 245, 0.16)";
          else floorFill = "rgba(239, 83, 80, 0.14)";
        }
        ctx.fillStyle = floorFill;
        ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = f === 0 ? 3 : 2;
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        if (f === 0) {
          ctx.fillStyle = occupant ? "#fff" : "rgba(255,255,255,0.75)";
          ctx.font = occupant ? "bold 11px system-ui,sans-serif" : "600 10px system-ui,sans-serif";
          ctx.textAlign = "center";
          const title = label.length > 18 ? `${label.slice(0, 17)}…` : label;
          ctx.fillText(title, tl.x + (br.x - tl.x) / 2, tl.y + 16);
          if (isMine && stories > 1) {
            ctx.font = "600 8px system-ui,sans-serif";
            ctx.fillText(`${stories} floors`, tl.x + (br.x - tl.x) / 2, tl.y + 28);
          }
        } else if (isMine) {
          ctx.fillStyle = "#fff";
          ctx.font = "600 9px system-ui,sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`Floor ${f + 1}`, tl.x + (br.x - tl.x) / 2, tl.y + 14);
        }
      }
    });

    state.owned.forEach((o, i) => {
      const pos = ownedSlotPos(i);
      const s = worldToScreen(pos.x, pos.y);
      const rc = RARITY[o.rarity] || RARITY.common;
      ctx.font = "22px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(o.emoji, s.x, s.y);
      ctx.font = "6px system-ui,sans-serif";
      ctx.fillStyle = rc.color;
      ctx.fillText(o.rarity.slice(0, 3).toUpperCase(), s.x, s.y + 8);
    });
  }

  function drawBeltItem(item) {
    if (!playerNearBeltItem(item)) {
      const s = worldToScreen(item.x, item.y);
      const rc = RARITY[item.def.rarity] || RARITY.common;
      ctx.save();
      ctx.shadowColor = rc.glow;
      ctx.shadowBlur = item.def.rarity === "og" ? 12 : 5;
      ctx.font = "22px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.def.emoji, s.x, s.y + 8);
      ctx.restore();
      return;
    }

    const s = worldToScreen(item.x, item.y);
    const rc = RARITY[item.def.rarity] || RARITY.common;
    const name = item.def.name.length > 18 ? `${item.def.name.slice(0, 17)}…` : item.def.name;
    const incomeText = `+${formatCash(item.def.income)}/s`;
    const moneyText = formatCash(item.price);

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 9px system-ui,sans-serif";
    const pw = Math.max(
      ctx.measureText(name).width,
      ctx.measureText(incomeText).width,
      ctx.measureText(moneyText).width
    ) + 14;
    const boxTop = s.y - 58;
    const boxH = 44;
    ctx.fillStyle = "rgba(0,0,0,0.88)";
    ctx.fillRect(s.x - pw / 2, boxTop, pw, boxH);
    ctx.strokeStyle = rc.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(s.x - pw / 2, boxTop, pw, boxH);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px system-ui,sans-serif";
    ctx.fillText(name, s.x, boxTop + 11);
    ctx.fillStyle = "#aed581";
    ctx.font = "600 8px system-ui,sans-serif";
    ctx.fillText(incomeText, s.x, boxTop + 24);
    ctx.fillStyle = "#fff176";
    ctx.fillText(moneyText, s.x, boxTop + 36);

    ctx.shadowColor = rc.glow;
    ctx.shadowBlur = item.def.rarity === "og" ? 18 : 8;
    ctx.font = "28px system-ui,sans-serif";
    ctx.fillText(item.def.emoji, s.x, s.y + 8);
    ctx.restore();
  }

  function isGame3DActive() {
    return document.getElementById("app")?.classList.contains("game-3d-active");
  }

  function updateBeltLabels() {
    const layer = document.getElementById("belt-labels");
    if (!layer) return;
    if (!playing || !isGame3DActive()) {
      layer.innerHTML = "";
      layer.classList.add("hidden");
      return;
    }
    const project = window.Game3DCore?.projectWorld;
    if (!project) {
      layer.classList.add("hidden");
      return;
    }
    layer.classList.remove("hidden");
    const seen = new Set();
    belt.forEach((item) => {
      const uid = String(item.uid);
      seen.add(uid);
      const near = playerNearBeltItem(item);
      const rc = RARITY[item.def.rarity] || RARITY.common;
      const money = formatCash(item.price);

      let label = layer.querySelector(`[data-uid="${uid}"]`);
      if (!label) {
        label = document.createElement("div");
        label.className = "belt-label";
        label.dataset.uid = uid;
        label.innerHTML =
          `<div class="belt-label-name"></div>`
          + `<div class="belt-label-income"></div>`
          + `<div class="belt-label-money"></div>`;
        layer.appendChild(label);
      }
      if (near) {
        label.style.display = "";
        label.style.borderColor = rc.color;
        label.querySelector(".belt-label-name").textContent = item.def.name;
        label.querySelector(".belt-label-income").textContent = `+${formatCash(item.def.income)}/s`;
        label.querySelector(".belt-label-money").textContent = money;
        const lift = 0.28 + rarityScale(item.def.rarity) * 0.38;
        const pos = project(item.x, item.y, WORLD_W, WORLD_H, lift);
        if (!pos?.visible) {
          label.style.display = "none";
        } else {
          label.style.transform = `translate(-50%, -100%) translate(${pos.x}px, ${pos.y - 8}px)`;
        }
      } else {
        label.style.display = "none";
      }
    });
    layer.querySelectorAll(".belt-label").forEach((el) => {
      if (!seen.has(el.dataset.uid)) el.remove();
    });
  }

  function updateBaseLabels() {
    const layer = document.getElementById("base-labels");
    if (!layer) return;
    if (!playing || !isGame3DActive()) {
      layer.innerHTML = "";
      layer.classList.add("hidden");
      return;
    }
    const project = window.Game3DCore?.projectWorld;
    if (!project) {
      layer.classList.add("hidden");
      return;
    }
    layer.classList.remove("hidden");
    const occupants = baseOccupants();
    const seen = new Set();
    BASE_LAYOUT.forEach((rect, slot) => {
      const uid = String(slot);
      seen.add(uid);
      const occupant = occupants[slot];
      let el = layer.querySelector(`[data-slot="${uid}"]`);
      const label = baseLabel(slot, occupant);
      if (!el) {
        el = document.createElement("div");
        el.className = `base-label${occupant ? " base-label-owned" : " base-label-empty"}`;
        el.dataset.slot = uid;
        layer.appendChild(el);
      }
      el.className = `base-label${occupant ? " base-label-owned" : " base-label-empty"}`;
      el.textContent = label;
      const pos = project(rect.x + rect.w / 2, rect.y, WORLD_W, WORLD_H, 0.35);
      if (!pos?.visible) {
        el.style.display = "none";
        return;
      }
      el.style.display = "";
      el.style.transform = `translate(-50%, -100%) translate(${pos.x}px, ${pos.y - 4}px)`;
    });
    layer.querySelectorAll(".base-label").forEach((el) => {
      if (!seen.has(el.dataset.slot)) el.remove();
    });
  }

  function drawPlayer(x, y, color, name) {
    const s = worldToScreen(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (name) {
      ctx.fillStyle = "#fff";
      ctx.font = "600 8px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name, s.x, s.y - 14);
    }
  }

  function drawWorld() {
    drawGrass();
    drawWalls();
    drawBelt();
    drawTunnel();
    drawBase();
    belt.forEach(drawBeltItem);
    remotePlayers.forEach((p, i) => {
      const st = p.state || {};
      const slot = st.baseSlot != null ? st.baseSlot : (i + 1) % TOTAL_BASES;
      const b = baseRect(slot);
      drawPlayer(st.x ?? b.x + b.w / 2, st.y ?? b.y + b.h / 2, "#ef5350", p.name);
    });
    drawPlayer(player.x, player.y, "#42a5f5", state.name);
  }

  function gameLoop(ts) {
    if (!playing) return;
    animT = ts / 1000;
    let mx = moveJoy.dx;
    let my = moveJoy.dy;
    if (keys.ArrowLeft || keys.a) mx -= 1;
    if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowUp || keys.w) my -= 1;
    if (keys.ArrowDown || keys.s) my += 1;
    const m = Math.hypot(mx, my);
    const load = 1 + belt.filter((b) => Math.hypot(player.x - b.x, player.y - b.y) < 120).length * 0.05;
    const speed = Math.max(1.8, 3.8 / load);
    if (m > 0.12) {
      player.x += (mx / m) * speed;
      player.y += (my / m) * speed;
      player.facing = mx >= 0 ? 1 : -1;
    }
    player.x = Math.max(WALL_PAD + 16, Math.min(WORLD_W - WALL_PAD - 16, player.x));
    player.y = Math.max(WALL_PAD + 16, Math.min(WORLD_H - WALL_PAD - 16, player.y));
    cam.x += (player.x - cam.x) * 0.1;
    cam.y += (player.y - cam.y) * 0.1;

    if (ts - lastSpawn > SPAWN_INTERVAL_MS) {
      lastSpawn = ts;
      spawnBeltItem();
    }
    belt.forEach((item) => {
      item.y += 1.8;
      item.x += (TUNNEL_X - item.x) * 0.02;
    });
    belt = belt.filter((item) => item.y < BELT_BOT + 40);

    drawWorld();
    updateHud();
    updateBeltLabels();
    updateBaseLabels();
    requestAnimationFrame(gameLoop);
  }

  function hubPlayerName() {
    return window.HubPlayer?.get?.() || state.name || "Player";
  }

  function startGame() {
    state.name = hubPlayerName();
    assignBaseSlot();
    saveState();
    const b = myBaseRect();
    player = { x: b.x + b.w / 2, y: b.y + b.h / 2, facing: 1 };
    cam = { x: player.x, y: player.y };
    belt = [];
    lastSpawn = 0;
    lastLegendaryPity = Date.now();
    lastMythicPity = Date.now();
    playing = true;
    document.getElementById("action-dock").classList.remove("hidden");
    document.getElementById("joystick-wrap").classList.remove("hidden");
    document.getElementById("app").classList.add("playing");
    resize();
    spawnBeltItem("common");
    spawnBeltItem("common");
    updateHud();
    incomeTimer = setInterval(tickIncome, 1000);
    requestAnimationFrame(gameLoop);
    if (window.GameMP) {
      GameMP.init({
        game: "steal-a-brainrot",
        subroom: "main",
        getName: () => state.name,
        getState: () => ({
          x: player.x,
          y: player.y,
          facing: player.facing,
          cash: state.cash,
          baseSlot: myBaseSlot(),
        }),
        onPeers: (peers) => {
          remotePlayers = peers;
          assignBaseSlot();
        },
      });
      GameMP.start();
    }
  }

  function stopGame() {
    playing = false;
    if (incomeTimer) clearInterval(incomeTimer);
    if (window.GameMP) GameMP.stop();
    document.getElementById("belt-labels")?.replaceChildren();
    document.getElementById("belt-labels")?.classList.add("hidden");
    document.getElementById("base-labels")?.replaceChildren();
    document.getElementById("base-labels")?.classList.add("hidden");
  }

  function resize() {
    if (!wrap || !canvas) return;
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width));
    canvas.height = Math.max(240, Math.floor(rect.height));
  }

  function bindEvents() {
    document.getElementById("buy-btn")?.addEventListener("click", buyBeltItem);
    document.getElementById("sell-btn")?.addEventListener("click", openSell);
    document.getElementById("sell-yes-btn")?.addEventListener("click", doSell);
    document.getElementById("sell-no-btn")?.addEventListener("click", closeSell);
    document.getElementById("rebirth-btn")?.addEventListener("click", openRebirth);
    document.getElementById("rebirth-yes-btn")?.addEventListener("click", doRebirth);
    document.getElementById("rebirth-no-btn")?.addEventListener("click", closeRebirth);
    document.getElementById("hub-btn")?.addEventListener("click", () => {
      stopGame();
      window.location.href = "../../index.html";
    });
    document.getElementById("menu-btn")?.addEventListener("click", () => {
      stopGame();
      window.location.href = "../../index.html";
    });
    if (typeof AllOutControls !== "undefined") AllOutControls.bindJoystick(moveJoy, keys);
    window.addEventListener("resize", resize);
  }

  function rarityScale(rarity) {
    const s = {
      common: 0.88, rare: 0.96, epic: 1.06, legendary: 1.18,
      mythic: 1.32, god: 1.52, secret: 1.68, og: 1.9,
    };
    return s[rarity] || 1;
  }

  function ownedScale(rarity) {
    return Math.min(0.82, rarityScale(rarity) * 0.44);
  }

  function cameraConfig() {
    return { height: 11, distance: 10, fov: 42, fogFar: 150, lookAtY: 0.55 };
  }

  function basePropScale(rect, isFloor) {
    const mw = isFloor ? BASE_FLOOR_W : BASE_MODEL_W;
    const md = isFloor ? BASE_FLOOR_D : BASE_MODEL_D;
    return {
      scale: 1,
      scaleX: (rect.w * WORLD_TO_3D) / mw,
      scaleZ: (rect.h * WORLD_TO_3D) / md,
    };
  }

  function buildWallProps() {
    const sx = WORLD_W * 0.045;
    const sy = WORLD_H * 0.045;
    return [
      { id: "wall_n", x: WORLD_W / 2, y: WALL_PAD, model: "wall", scaleX: sx, scaleZ: 1, yLift: 0 },
      { id: "wall_s", x: WORLD_W / 2, y: WORLD_H - WALL_PAD, model: "wall", scaleX: sx, scaleZ: 1, yLift: 0 },
      { id: "wall_w", x: WALL_PAD, y: WORLD_H / 2, model: "wall", rot: Math.PI / 2, scaleX: sy, scaleZ: 1, yLift: 0 },
      { id: "wall_e", x: WORLD_W - WALL_PAD, y: WORLD_H / 2, model: "wall", rot: Math.PI / 2, scaleX: sy, scaleZ: 1, yLift: 0 },
    ];
  }

  function buildGrassProps() {
    const props = [];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const dist = 100 + (i % 4) * 35;
      props.push({
        id: `grass_ring${i}`,
        x: TUNNEL_X + Math.cos(angle) * dist,
        y: TUNNEL_Y + 60 + Math.sin(angle) * dist * 0.35,
        model: "grass_clump",
        scale: 0.85 + (i % 3) * 0.2,
        yLift: 0,
      });
    }
    for (let i = 0; i < 24; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      props.push({
        id: `grass_side${i}`,
        x: TUNNEL_X + side * (BELT_W / 2 + 45 + (i % 6) * 28),
        y: BELT_TOP + 40 + i * ((BELT_BOT - BELT_TOP) / 24),
        model: "grass_clump",
        scale: 0.75 + (i % 4) * 0.15,
        yLift: 0,
      });
    }
    return props;
  }

  function brainrotModel(def) {
    return window.StealBrainrotModels?.modelId(def.id) || "brainrot";
  }

  function buildBaseProps() {
    const props = [];
    const occupants = baseOccupants();
    const mySlot = myBaseSlot();
    BASE_LAYOUT.forEach((rect, slot) => {
      const occupant = occupants[slot];
      const isMine = slot === mySlot;
      const stories = isMine ? storyCount() : 1;
      const color = !occupant ? "#78909c" : (isMine ? "#42a5f5" : "#ef5350");
      for (let f = 0; f < stories; f++) {
        const sizing = basePropScale(rect, f > 0);
        props.push({
          id: `base_${slot}_f${f}`,
          x: rect.x + rect.w / 2,
          y: rect.y + rect.h / 2,
          model: f === 0 ? "base" : "base_floor",
          color,
          ...sizing,
          yLift: f * (FLOOR_LIFT_WORLD * WORLD_TO_3D),
        });
      }
    });
    return props;
  }

  window.__stealABrainrot3D = function () {
    if (!playing) return null;
    const beltLen = (BELT_BOT - BELT_TOP) * 0.045;
    const props = [
      ...buildWallProps(),
      ...buildGrassProps(),
      {
        id: "tunnel",
        x: TUNNEL_X,
        y: TUNNEL_Y + 30,
        model: "tunnel",
        color: "#455a64",
        scale: 2.2,
        yLift: 0,
      },
      {
        id: "conveyor",
        x: TUNNEL_X,
        y: (BELT_TOP + BELT_BOT) / 2,
        model: "conveyor",
        color: "#5d4037",
        scale: 1,
        scaleZ: beltLen / 0.45,
        yLift: 0,
      },
      ...buildBaseProps(),
    ];
    const entities = [
      ...belt.map((item) => ({
        id: `belt${item.uid}`,
        x: item.x,
        y: item.y,
        model: brainrotModel(item.def),
        color: RARITY[item.def.rarity]?.color || "#9e9e9e",
        scale: rarityScale(item.def.rarity) * 0.68,
        facing: 1,
        yLift: 0.12,
      })),
      ...state.owned.map((o, i) => {
        const pos = ownedSlotPos(i);
        return {
          id: `owned${o.uid}`,
          x: pos.x,
          y: pos.y,
          model: brainrotModel(o),
          color: RARITY[o.rarity]?.color || "#9e9e9e",
          scale: ownedScale(o.rarity),
          facing: (i & 1) ? -1 : 1,
          yLift: 0.32,
        };
      }),
      ...remotePlayers.map((p, i) => {
        const slot = p.state?.baseSlot != null ? p.state.baseSlot : (i + 1) % TOTAL_BASES;
        const b = baseRect(slot);
        return {
          id: `remote${i}`,
          x: p.state?.x ?? b.x + b.w / 2,
          y: p.state?.y ?? b.y + b.h / 2,
          model: "lifter",
          color: "#ef5350",
          scale: 0.58,
          facing: p.state?.facing ?? 1,
        };
      }),
    ];
    return {
      worldW: WORLD_W,
      worldH: WORLD_H,
      ground: "#57d957",
      defaultModel: "brainrot",
      useCanvas: false,
      camera: cameraConfig(),
      player: {
        x: player.x,
        y: player.y,
        facing: player.facing,
        model: "lifter",
        color: "#42a5f5",
        scale: 0.58,
        yLift: 0,
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
    state.name = hubPlayerName();
    bindEvents();
    resize();
    updateHud();
    document.body.classList.add("hub-direct-entry");
    if (window.markGameMpCustom) window.markGameMpCustom();
    requestAnimationFrame(() => startGame());
  }

  init();
})();
