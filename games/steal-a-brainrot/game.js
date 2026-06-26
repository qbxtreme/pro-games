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
  const FLOOR_LIFT_WORLD = BASE_H + 10;
  const MAX_SLOTS = 8;
  const MAX_REBIRTHS = 20;
  const REBIRTH_FLOOR_STEP = 5;
  const PITY_LEGENDARY_MS = 5 * 60 * 1000;
  const PITY_MYTHIC_MS = 15 * 60 * 1000;
  const SPAWN_INTERVAL_MS = 2200;
  const BELT_NEAR_R = 130;
  const OWNED_NEAR_R = 52;

  const BUILD_VERSION = "4CA9";

  window.__stealBrainrotPrefer2D = false;

  function prefer2DMode() {
    const gfx = window.ProGamesGraphics?.getStyleId?.();
    return gfx === "sharp-2d" || gfx === "all-out-2d";
  }

  function setRenderModeClass() {
    const app = document.getElementById("app");
    if (!app) return;
    if (prefer2DMode()) {
      app.classList.add("steal-brainrot-2d");
      app.classList.remove("game-3d-active");
    } else {
      app.classList.remove("steal-brainrot-2d");
    }
  }

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
  let player = { x: BASE_LAYOUT[0].x + BASE_LAYOUT[0].w / 2, y: BASE_LAYOUT[0].y + BASE_LAYOUT[0].h / 2, facing: 1, floor: 0 };
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
  let canvasDpr = 1;
  let viewW = 800;
  let viewH = 600;

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

  function applyDevParams(st) {
    try {
      const p = new URLSearchParams(location.search);
      if (p.has("rebirths")) {
        st.rebirths = Math.max(0, Math.min(MAX_REBIRTHS, parseInt(p.get("rebirths"), 10) || 0));
      }
    } catch (_) {}
    return st;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = applyDevParams({ ...defaultState(), ...JSON.parse(raw) });
        parsed.rebirths = Math.max(0, Math.min(MAX_REBIRTHS, parsed.rebirths || 0));
        if (parsed.baseSlot != null) {
          parsed.baseSlot = Math.max(0, Math.min(TOTAL_BASES - 1, parsed.baseSlot));
        }
        return parsed;
      }
    } catch (_) {}
    return applyDevParams(defaultState());
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

  function floorLift(floor) {
    return floor * FLOOR_LIFT_WORLD;
  }

  function baseFloorRect(b, floor) {
    const lift = floorLift(floor);
    return { x: b.x, y: b.y - lift, w: b.w, h: b.h };
  }

  function myBaseSide() {
    return myBaseSlot() < BASES_PER_SIDE ? "left" : "right";
  }

  function onMyBaseFloor(floor) {
    const f = floor != null ? floor : (player.floor || 0);
    return insideBaseFloor(myBaseRect(), f, player.x, player.y);
  }

  function stairsRect(floor) {
    const b = myBaseRect();
    const fr = baseFloorRect(b, floor);
    const w = 120;
    const h = 96;
    const x = fr.x + (fr.w - w) / 2;
    const y = fr.y + fr.h - h - 12;
    return { x, y, w, h };
  }

  function onStairs() {
    if (storyCount() <= 1) return false;
    const s = stairsRect(player.floor || 0);
    return player.x >= s.x && player.x <= s.x + s.w
      && player.y >= s.y && player.y <= s.y + s.h;
  }

  function canUseFloorControls() {
    if (storyCount() <= 1) return false;
    if (nearBase()) return true;
    for (let f = 0; f < storyCount(); f++) {
      if (insideBaseFloor(myBaseRect(), f, player.x, player.y)) return true;
    }
    return false;
  }

  function groundPlaneY(y, floor) {
    return y + floorLift(floor || 0);
  }

  function canvasView() {
    return { w: viewW, h: viewH };
  }

  function screenToWorld(sx, sy) {
    const { w, h } = canvasView();
    const ac = window.AllOutCamera;
    if (ac && canvas) return ac.screenToWorld(sx, sy, cam, w, h);
    return {
      x: sx + cam.x - w / 2,
      y: sy + cam.y - h / 2,
    };
  }

  function stairsAtWorld(x, y) {
    if (storyCount() <= 1) return null;
    for (let f = 0; f < storyCount(); f++) {
      const s = stairsRect(f);
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return f;
    }
    return null;
  }

  function goFloor(delta) {
    player.floor = player.floor || 0;
    const stories = storyCount();
    if (stories <= 1) {
      const need = REBIRTH_FLOOR_STEP - (state.rebirths % REBIRTH_FLOOR_STEP || 0);
      flashHint(`Need ${need} more rebirth${need === 1 ? "" : "s"} for floor 2 (5 total)`);
      return false;
    }
    if (!canUseFloorControls()) {
      flashHint("Walk to your base to use the stairs");
      return false;
    }
    const max = stories - 1;
    const next = player.floor + delta;
    if (next < 0 || next > max) return false;
    player.floor = next;
    const walk = floorWalkRect(next);
    player.x = walk.x + walk.w / 2;
    player.y = walk.y + walk.h / 2;
    cam.x = player.x;
    cam.y = player.y;
    floorChangeCd = 0.4;
    updateHud();
    flashHint(`🏢 Floor ${player.floor + 1}`);
    return true;
  }

  function insideBaseFloor(b, floor, x, y) {
    const fr = baseFloorRect(b, floor);
    const pad = 10;
    return x >= fr.x + pad && x <= fr.x + fr.w - pad
      && y >= fr.y + pad && y <= fr.y + fr.h - pad;
  }

  function floorWalkRect(floor) {
    const b = myBaseRect();
    const fr = baseFloorRect(b, floor);
    const pad = 18;
    return {
      x: fr.x + pad,
      y: fr.y + pad,
      w: fr.w - pad * 2,
      h: fr.h - pad * 2,
    };
  }

  function clampPlayerPosition() {
    player.floor = player.floor || 0;
    if (player.floor > 0) {
      const walk = floorWalkRect(player.floor);
      player.x = Math.max(walk.x, Math.min(walk.x + walk.w, player.x));
      player.y = Math.max(walk.y, Math.min(walk.y + walk.h, player.y));
      return;
    }
    player.x = Math.max(WALL_PAD + 16, Math.min(WORLD_W - WALL_PAD - 16, player.x));
    player.y = Math.max(WALL_PAD + 16, Math.min(WORLD_H - WALL_PAD - 16, player.y));
  }

  function enforcePlayerFloor() {
    player.floor = player.floor || 0;
    const stories = storyCount();
    if (player.floor >= stories) player.floor = Math.max(0, stories - 1);
    if (player.floor <= 0) {
      player.floor = 0;
      return;
    }
    clampPlayerPosition();
  }

  function drawStairs(floor) {
    const s = stairsRect(floor);
    const tl = worldToScreen(s.x, s.y);
    const br = worldToScreen(s.x + s.w, s.y + s.h);
    const active = player.floor === floor && onStairs();
    ctx.fillStyle = active ? "rgba(255,235,59,0.5)" : "rgba(255,255,255,0.28)";
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.strokeStyle = active ? "#fdd835" : "rgba(255,255,255,0.65)";
    ctx.lineWidth = 2;
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.fillStyle = "#fff";
    ctx.font = "600 9px system-ui,sans-serif";
    ctx.textAlign = "center";
    const label = floor < storyCount() - 1 ? "⬆ STAIRS" : "⬇ STAIRS";
    ctx.fillText(label, tl.x + (br.x - tl.x) / 2, tl.y + (br.y - tl.y) / 2 + 3);
  }

  function ownedFloor(index) {
    const stories = storyCount();
    if (stories <= 1) return 0;
    return Math.min(Math.floor(index / 4), stories - 1);
  }

  function ownedSlotPos(index) {
    const b = myBaseRect();
    const stories = storyCount();
    const floor = ownedFloor(index);
    const lift = floor * FLOOR_LIFT_WORLD;
    const padX = 52;
    const padY = 62;
    const innerW = b.w - padX * 2;
    const innerH = b.h - padY - 18;
    const cellW = innerW / 4;
    let col;
    let row;
    if (stories <= 1) {
      col = index % 4;
      row = Math.floor(index / 4);
    } else {
      col = index % 4;
      row = 0;
    }
    const rowsOnFloor = stories <= 1 ? 2 : 1;
    const cellH = innerH / rowsOnFloor;
    return {
      x: b.x + padX + col * cellW + cellW / 2,
      y: b.y - lift + padY + row * cellH + cellH / 2,
      floor,
    };
  }

  function nearBase() {
    const b = myBaseRect();
    const fr = baseFloorRect(b, player.floor);
    return player.x >= fr.x - 36 && player.x <= fr.x + fr.w + 36
      && player.y >= fr.y - 36 && player.y <= fr.y + fr.h + 44;
  }

  function nearOwnedBrainrot() {
    let best = null;
    let bestD = Infinity;
    state.owned.forEach((o, i) => {
      const pos = ownedSlotPos(i);
      if (pos.floor !== player.floor) return;
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
      rebirthBtn.classList.toggle("hidden", player.floor !== 0 || !nearBase() || state.rebirths >= MAX_REBIRTHS);
      rebirthBtn.textContent = canRebirth() ? "♻️ REBIRTH" : `♻️ ${formatCash(rebirthCost())}`;
    }
    const floorUpBtn = document.getElementById("floor-up-btn");
    const floorDownBtn = document.getElementById("floor-down-btn");
    const multiStory = storyCount() > 1;
    const canFloor = canUseFloorControls();
    if (floorUpBtn) {
      floorUpBtn.classList.toggle("hidden", !canFloor || player.floor >= storyCount() - 1);
      floorUpBtn.textContent = `⬆️ FLOOR ${player.floor + 2}`;
    }
    if (floorDownBtn) {
      floorDownBtn.classList.toggle("hidden", !canFloor || player.floor <= 0);
      floorDownBtn.textContent = player.floor === 1 ? "⬇️ GROUND" : `⬇️ FLOOR ${player.floor}`;
    }
    if (floorEl) {
      const next = nextStoryRebirth();
      const baseInfo = next
        ? `${storyCount()} stories · next at rebirth ${next}`
        : `${storyCount()} stories · MAX`;
      floorEl.textContent = multiStory
        ? `You: Floor ${(player.floor || 0) + 1} · ${baseInfo}${canFloor ? " · tap ⬆️ or 🪜" : ""}`
        : (next ? `Floor ${storyCount()} — next at rebirth ${next}` : `Floor ${storyCount()} — MAX`);
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
    const { w, h } = canvasView();
    const ac = window.AllOutCamera;
    if (ac) return ac.worldToScreen(x, y, cam, w, h);
    return { x: x - cam.x + w / 2, y: y - cam.y + h / 2 };
  }

  function camViewOrigin() {
    const { w, h } = canvasView();
    const ac = window.AllOutCamera;
    if (ac) return ac.camOrigin(cam, w, h);
    return { x: cam.x - w / 2, y: cam.y - h / 2 };
  }

  function drawGrass() {
    const tile = 48;
    const { w, h } = canvasView();
    const origin = camViewOrigin();
    const startX = Math.floor(origin.x / tile) * tile;
    const startY = Math.floor(origin.y / tile) * tile;
    for (let gy = startY; gy < origin.y + h + tile; gy += tile) {
      for (let gx = startX; gx < origin.x + w + tile; gx += tile) {
        const s = worldToScreen(gx, gy);
        const alt = ((Math.floor(gx / tile) + Math.floor(gy / tile)) & 1) === 0;
        ctx.fillStyle = alt ? "#7dff7d" : "#32ef32";
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

  function drawFloorPillars(rect, stories, stroke) {
    if (stories <= 1) return;
    const px = 28;
    const pillars = [rect.x + px, rect.x + rect.w - px];
    pillars.forEach((x) => {
      for (let f = 0; f < stories - 1; f++) {
        const yTop = rect.y - (f + 1) * FLOOR_LIFT_WORLD;
        const yBot = rect.y - f * FLOOR_LIFT_WORLD + rect.h;
        const tl = worldToScreen(x - 8, yTop);
        const br = worldToScreen(x + 8, yBot);
        ctx.fillStyle = "rgba(55, 71, 79, 0.55)";
        ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      }
    });
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
        const lift = f * FLOOR_LIFT_WORLD;
        const tl = worldToScreen(rect.x, rect.y - lift);
        const br = worldToScreen(rect.x + rect.w, rect.y + rect.h - lift);
        let floorFill = fill;
        if (f > 0) {
          if (!occupant) floorFill = "rgba(120, 144, 156, 0.18)";
          else if (isMine) floorFill = "rgba(66, 165, 245, 0.22)";
          else floorFill = "rgba(239, 83, 80, 0.18)";
        }
        ctx.fillStyle = floorFill;
        ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = f === 0 ? 3 : 2;
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        if (isMine && f > 0) {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.fillRect(tl.x + 4, tl.y + 4, br.x - tl.x - 8, 10);
        }
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
          ctx.font = prefer2DMode() ? "bold 11px system-ui,sans-serif" : "600 9px system-ui,sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`🏢 FLOOR ${f + 1}`, tl.x + (br.x - tl.x) / 2, tl.y + 16);
        }

        if (isMine) {
          state.owned.forEach((o, i) => {
            if (ownedFloor(i) !== f) return;
            const pos = ownedSlotPos(i);
            const s = worldToScreen(pos.x, pos.y);
            const rc = RARITY[o.rarity] || RARITY.common;
            const spriteSize = prefer2DMode() ? 34 : 28;
            drawBrainrotSprite(ctx, s.x, s.y, o, spriteSize);
            ctx.font = "6px system-ui,sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = rc.color;
            ctx.fillText(o.rarity.slice(0, 3).toUpperCase(), s.x, s.y + spriteSize * 0.45);
          });
          if (stories > 1) {
            drawStairs(f);
            if (f === player.floor) {
              const s = stairsRect(f);
              const st = worldToScreen(s.x + s.w / 2, s.y + s.h / 2);
              ctx.fillStyle = "rgba(255,235,59,0.22)";
              ctx.beginPath();
              ctx.arc(st.x, st.y, 28, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
      if (isMine && stories > 1) drawFloorPillars(rect, stories, stroke);
    });
  }

  function drawBeltItem(item) {
    if (!playerNearBeltItem(item)) {
      const s = worldToScreen(item.x, item.y);
      const rc = RARITY[item.def.rarity] || RARITY.common;
      ctx.save();
      ctx.shadowColor = rc.glow;
      ctx.shadowBlur = item.def.rarity === "og" ? 12 : 5;
      drawBrainrotSprite(ctx, s.x, s.y + 8, item.def, 30);
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
    drawBrainrotSprite(ctx, s.x, s.y + 8, item.def, prefer2DMode() ? 36 : 32);
    ctx.restore();
  }

  function isGame3DActive() {
    return document.getElementById("app")?.classList.contains("game-3d-active");
  }

  function drawBrainrotSprite(ctx, x, y, def, size, opts) {
    if (isGame3DActive()) return;
    if (window.BrainrotPortraits?.draw(ctx, x, y, def, size, opts)) return;
    const emojiSize = Math.round((size || 28) * 0.65);
    ctx.font = `${emojiSize}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(def?.emoji || "🧠", x, y + emojiSize * 0.15);
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
    if (player.floor > 0) {
      const s = worldToScreen(player.x, player.y - 12);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 7px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`F${player.floor + 1}`, s.x, s.y);
    }
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
    clampPlayerPosition();
    enforcePlayerFloor();

    if (floorChangeCd > 0) floorChangeCd -= 0.016;
    if (floorChangeCd <= 0 && canUseFloorControls()) {
      if (keys.e || keys.E) goFloor(1);
      else if (keys.q || keys.Q) goFloor(-1);
      else if (onStairs() && Math.abs(mx) < 0.3) {
        if (my < -0.45) goFloor(1);
        else if (my > 0.45) goFloor(-1);
      }
    }

    if (window.AllOutCamera) {
      AllOutCamera.follow(cam, player.x, player.y, 0.016, mx, my, 10);
    } else {
      cam.x += (player.x - cam.x) * 0.1;
      cam.y += (player.y - cam.y) * 0.1;
    }

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
    try {
      const chat = localStorage.getItem("becomeAProChatName");
      if (chat && chat.trim()) return chat.trim().slice(0, 16);
    } catch (_) {}
    return window.HubPlayer?.get?.() || state.name || "Player";
  }

  function startGame() {
    state.name = hubPlayerName();
    assignBaseSlot();
    saveState();
    setRenderModeClass();
    const b = myBaseRect();
    player = { x: b.x + b.w / 2, y: b.y + b.h / 2, facing: 1, floor: 0 };
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
    if (storyCount() <= 1 && state.rebirths < REBIRTH_FLOOR_STEP) {
      flashHint(`♻️ Rebirth ${REBIRTH_FLOOR_STEP} times to unlock floor 2`);
    } else if (storyCount() > 1) {
      flashHint(`🏢 ${storyCount()} floors unlocked · walk to base · tap ⬆️`);
    }
    if (window.PRO_GAMES?.staticHost && state.rebirths < 1) {
      setTimeout(() => {
        flashHint("Tip: open from your home server to sync creator progress");
      }, 3200);
    }
    if (window.GameMP) {
      GameMP.init({
        game: "steal-a-brainrot",
        subroom: "main",
        getName: () => state.name,
        getState: () => ({
          x: player.x,
          y: player.y,
          facing: player.facing,
          floor: player.floor,
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
    ctx.imageSmoothingEnabled = true;
  }

  function bindTouchMove() {
    if (!wrap || wrap.dataset.touchMove) return;
    wrap.dataset.touchMove = "1";
    let pid = null;
    let origin = null;
    const cap = 56;
    const ignoreTarget = (el) => el?.closest?.(
      "#joystick-base, .action-dock, .world-overlay, button, input, a, label, #game-header, .floor-btn"
    );

    const setFromPointer = (e) => {
      if (!origin) return;
      let dx = e.clientX - origin.x;
      let dy = e.clientY - origin.y;
      const m = Math.hypot(dx, dy);
      if (m > cap) {
        dx = (dx / m) * cap;
        dy = (dy / m) * cap;
      }
      moveJoy.dx = dx / cap;
      moveJoy.dy = dy / cap;
      moveJoy.active = true;
    };

    const endTouch = () => {
      pid = null;
      origin = null;
      moveJoy.dx = 0;
      moveJoy.dy = 0;
      moveJoy.active = false;
    };

    wrap.addEventListener("pointerdown", (e) => {
      if (ignoreTarget(e.target)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.clientX > window.innerWidth * 0.58) return;
      pid = e.pointerId;
      origin = { x: e.clientX, y: e.clientY };
      try { wrap.setPointerCapture(pid); } catch (_) { /* ignore */ }
      e.preventDefault();
      setFromPointer(e);
    }, { passive: false });

    wrap.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      e.preventDefault();
      setFromPointer(e);
    }, { passive: false });

    wrap.addEventListener("pointerup", (e) => {
      if (e.pointerId !== pid) return;
      try { wrap.releasePointerCapture(pid); } catch (_) { /* ignore */ }
      endTouch();
    });
    wrap.addEventListener("pointercancel", (e) => {
      if (e.pointerId !== pid) return;
      endTouch();
    });
  }

  function bindStairsTap() {
    if (!wrap || wrap.dataset.stairsTap) return;
    wrap.dataset.stairsTap = "1";
    wrap.addEventListener("pointerup", (e) => {
      if (!playing || storyCount() <= 1) return;
      if (e.target.closest(".action-dock, .world-overlay, button, input, #joystick-base")) return;
      const rect = canvas.getBoundingClientRect();
      const p = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const stairFloor = stairsAtWorld(p.x, p.y);
      if (stairFloor == null) return;
      player.floor = player.floor || 0;
      if (stairFloor > player.floor) goFloor(stairFloor - player.floor);
      else if (stairFloor < player.floor) goFloor(stairFloor - player.floor);
    });
  }

  function bindEvents() {
    document.getElementById("buy-btn")?.addEventListener("click", buyBeltItem);
    document.getElementById("sell-btn")?.addEventListener("click", openSell);
    document.getElementById("sell-yes-btn")?.addEventListener("click", doSell);
    document.getElementById("sell-no-btn")?.addEventListener("click", closeSell);
    document.getElementById("rebirth-btn")?.addEventListener("click", openRebirth);
    document.getElementById("floor-up-btn")?.addEventListener("click", () => goFloor(1));
    document.getElementById("floor-down-btn")?.addEventListener("click", () => goFloor(-1));
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
    bindTouchMove();
    bindStairsTap();
    window.addEventListener("resize", () => {
      resize();
      setRenderModeClass();
    });
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
    const touchDevice = window.matchMedia?.("(pointer: coarse)")?.matches
      || /iPad|iPhone|iPod|Android/i.test(navigator.userAgent || "");
    return window.AllOutCamera?.standard3D({
      fov: touchDevice ? 48 : 42,
      height: touchDevice ? 13 : 11,
      distance: touchDevice ? 12 : 10,
      fogFar: 200,
      lookAtY: 0.55,
      lerp: touchDevice ? 0.14 : 0.12,
    }) || {
      style: "fixed", height: 11, distance: 10, fov: 42, fogFar: 200, lookAtY: 0.55, lerp: 0.1,
    };
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
        color: "#69ff69",
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
        color: "#69ff69",
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
        if (isMine && stories > 1) {
          const stair = stairsRect(f);
          props.push({
            id: `stairs_${slot}_f${f}`,
            x: stair.x + stair.w / 2,
            y: groundPlaneY(stair.y + stair.h / 2, f),
            model: "prop",
            color: f < stories - 1 ? "#fdd835" : "#ce93d8",
            scale: 0.55,
            yLift: f * (FLOOR_LIFT_WORLD * WORLD_TO_3D) + 0.08,
          });
        }
      }
    });
    return props;
  }

  window.__stealABrainrot3D = function () {
    if (!playing || prefer2DMode()) return null;
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
        const floorLift = pos.floor * (FLOOR_LIFT_WORLD * WORLD_TO_3D);
        return {
          id: `owned${o.uid}`,
          x: pos.x,
          y: groundPlaneY(pos.y, pos.floor),
          model: brainrotModel(o),
          color: RARITY[o.rarity]?.color || "#9e9e9e",
          scale: ownedScale(o.rarity),
          facing: (i & 1) ? -1 : 1,
          yLift: floorLift + 0.32,
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
      ground: "#38ef38",
      defaultModel: "brainrot",
      useCanvas: false,
      camera: cameraConfig(),
      player: {
        x: player.x,
        y: groundPlaneY(player.y, player.floor || 0),
        facing: player.facing,
        model: "lifter",
        color: "#42a5f5",
        scale: 0.58,
        yLift: (player.floor || 0) * (FLOOR_LIFT_WORLD * WORLD_TO_3D),
      },
      props,
      entities,
    };
  };

  function reloadSavedState() {
    state = loadState();
    state.name = hubPlayerName();
    updateHud();
  }

  if (window.BecomeAProSave) {
    BecomeAProSave.registerGameSave(SAVE_KEY, () => state);
    BecomeAProSave.registerGameReload(SAVE_KEY, reloadSavedState);
    BecomeAProSave.onRestore(reloadSavedState);
  }
  if (window.__bapWatchSave) {
    __bapWatchSave(SAVE_KEY, reloadSavedState);
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    wrap = document.getElementById("game-wrap");
    ctx = canvas.getContext("2d");
    window.getGameRealismOpts = function () {
      if (prefer2DMode()) return false;
      if (document.getElementById("app")?.classList.contains("game-3d-active")) return false;
      const { w, h } = canvasView();
      return {
        focusX: w * 0.5,
        focusY: h * 0.52,
        vignette: 0.2,
        grain: false,
        haze: false,
      };
    };
    state = loadState();
    state.name = hubPlayerName();
    bindEvents();
    setRenderModeClass();
    resize();
    updateHud();
    document.body.classList.add("hub-direct-entry");
    if (window.markGameMpCustom) window.markGameMpCustom();
    requestAnimationFrame(() => startGame());
  }

  __bapDeferInit(init);
})();
