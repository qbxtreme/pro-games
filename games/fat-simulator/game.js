(function () {
  "use strict";

  const SAVE_KEY = "dogFatSimulator";

  const FOODS = [
    { id: 0, name: "Kibble", emoji: "🥣", fatPerBite: 1, cost: 0 },
    { id: 1, name: "Treat", emoji: "🦴", fatPerBite: 4, cost: 75 },
    { id: 2, name: "Burger", emoji: "🍔", fatPerBite: 12, cost: 350 },
    { id: 3, name: "Hot Dog", emoji: "🌭", fatPerBite: 35, cost: 1200 },
    { id: 4, name: "Pizza", emoji: "🍕", fatPerBite: 90, cost: 4500 },
    { id: 5, name: "Steak", emoji: "🥩", fatPerBite: 250, cost: 18000 },
    { id: 6, name: "Mega Feast", emoji: "🍖", fatPerBite: 700, cost: 75000 },
    { id: 7, name: "Golden Bowl", emoji: "👑", fatPerBite: 2000, cost: 300000 },
  ];

  const UPGRADES = [
    { id: "chew", name: "Fast Chewing", emoji: "⚡", desc: "Eat faster", baseCost: 100, max: 20 },
    { id: "bite", name: "Bigger Bites", emoji: "🦷", desc: "+10% fat per bite", baseCost: 250, max: 15 },
    { id: "sell", name: "Better Sell Rate", emoji: "💵", desc: "+1 coin per 8 fat sold", baseCost: 500, max: 10 },
    { id: "auto", name: "Auto-Eat", emoji: "🤖", desc: "Unlock auto-eating!", baseCost: 2000, max: 1 },
  ];

  const BOSSES = [
    { id: 0, name: "Skinny Cat", emoji: "🐱", hp: 400, fatReq: 80, trophies: 1, coins: 150 },
    { id: 1, name: "Rival Pup", emoji: "🐕", hp: 1800, fatReq: 400, trophies: 3, coins: 600 },
    { id: 2, name: "Muscle Husky", emoji: "🐺", hp: 8000, fatReq: 2000, trophies: 8, coins: 2500 },
    { id: 3, name: "Giant Chow", emoji: "🦁", hp: 35000, fatReq: 10000, trophies: 20, coins: 12000 },
    { id: 4, name: "King Bulldog", emoji: "👑", hp: 150000, fatReq: 50000, trophies: 50, coins: 50000 },
  ];

  const EGG_TYPES = [
    { id: "basic", name: "Basic Egg", emoji: "🥚", cost: 5, pool: "common" },
    { id: "rare", name: "Rare Egg", emoji: "🥚", cost: 25, pool: "rare" },
    { id: "legend", name: "Legend Egg", emoji: "✨", cost: 100, pool: "legend" },
  ];

  const PETS = {
    common: [
      { name: "Puppy", emoji: "🐶", mult: 1.1 },
      { name: "Beagle", emoji: "🐕", mult: 1.15 },
      { name: "Terrier", emoji: "🐩", mult: 1.2 },
    ],
    rare: [
      { name: "Golden Retriever", emoji: "🦮", mult: 1.35 },
      { name: "Husky", emoji: "🐺", mult: 1.45 },
      { name: "Corgi", emoji: "🐕‍🦺", mult: 1.5 },
    ],
    legend: [
      { name: "Doge", emoji: "🐕", mult: 2.0 },
      { name: "Mega Floof", emoji: "🦁", mult: 2.5 },
      { name: "Cosmic Pup", emoji: "🌟", mult: 3.0 },
    ],
  };

  const BREEDS = {
    golden: { fur: "#d4a055", ear: "#b8860b", nose: "#3e2723", belly: "#f5deb3" },
    husky: { fur: "#eceff1", ear: "#78909c", nose: "#263238", belly: "#cfd8dc", patch: "#37474f" },
    corgi: { fur: "#e65100", ear: "#bf360c", nose: "#3e2723", belly: "#ffcc80" },
    pug: { fur: "#bcaaa4", ear: "#8d6e63", nose: "#212121", belly: "#d7ccc8" },
  };

  const ZONES = {
    eat: { label: "🏠 Home — Explore!", bg: ["#87ceeb", "#98d8a0"] },
    sell: { label: "💵 Sell Zone", bg: ["#fff9c4", "#ffe082"] },
    shop: { label: "🛒 Upgrade Shop", bg: ["#e1bee7", "#ce93d8"] },
    boss: { label: "⚔️ Boss Arena", bg: ["#ffcdd2", "#ef9a9a"] },
    eggs: { label: "🥚 Egg Hatchery", bg: ["#c8e6c9", "#a5d6a7"] },
    pvp: { label: "👊 PVP Zone", bg: ["#ffccbc", "#ffab91"] },
    rebirth: { label: "♻️ Rebirth Shrine", bg: ["#d1c4e9", "#b39ddb"] },
  };

  const REBIRTH_FAT_REQ = 10000;
  const SCREEN_FILL_FAT = 20000000;
  const REBIRTH_BONUS = 0.15;

  const WORLD_X_MIN = -1720;
  const WORLD_X_MAX = 1400;
  const WORLD_W = WORLD_X_MAX - WORLD_X_MIN;
  const WORLD_H = 1000;
  const PLAYER_R = 22;

  const SNACK_TYPES = [
    { emoji: "🍪", name: "Cookie", fat: 2, note: "Mom's cookies!" },
    { emoji: "🥨", name: "Pretzel", fat: 3, note: "From the snack bowl" },
    { emoji: "🍿", name: "Popcorn", fat: 2, note: "Movie night leftovers" },
    { emoji: "🍫", name: "Chocolate", fat: 5, note: "Hidden in the pantry" },
    { emoji: "🧀", name: "Cheese", fat: 4, note: "Dropped on the counter" },
    { emoji: "🥓", name: "Bacon", fat: 6, note: "Breakfast scraps!" },
    { emoji: "🧁", name: "Cupcake", fat: 8, note: "Party leftovers" },
    { emoji: "🍟", name: "Fries", fat: 5, note: "Fast food bag!" },
    { emoji: "🥪", name: "Sandwich", fat: 7, note: "Half-eaten lunch" },
    { emoji: "🍕", name: "Pizza crust", fat: 10, note: "Box on the table" },
    { emoji: "🥜", name: "Peanuts", fat: 1, note: "Spilled snack mix" },
    { emoji: "🍎", name: "Apple slice", fat: 1, note: "Kid dropped it" },
    { emoji: "🍩", name: "Donut", fat: 9, note: "Dad bought donuts!" },
    { emoji: "🌭", name: "Hot dog", fat: 6, note: "BBQ leftovers" },
    { emoji: "🥛", name: "Cereal", fat: 3, note: "Spilled from the bowl" },
    { emoji: "🍌", name: "Banana", fat: 2, note: "On the counter" },
    { emoji: "🍋", name: "Lemonade", fat: 3, note: "Porch cup left out" },
    { emoji: "🥐", name: "Croissant", fat: 5, note: "Neighbor's bake sale!" },
  ];

  const STREET_SNACK_TYPES = [
    { emoji: "🌭", name: "Street hot dog", fat: 8, note: "Dropped on the sidewalk!" },
    { emoji: "🍕", name: "Pizza slice", fat: 12, note: "Someone's lunch!" },
    { emoji: "🥤", name: "Soda cup", fat: 4, note: "Left on the curb" },
    { emoji: "🍩", name: "Donut", fat: 9, note: "Bakery box spill!" },
    { emoji: "🌮", name: "Taco", fat: 7, note: "Food truck drop!" },
    { emoji: "🍿", name: "Popcorn", fat: 5, note: "Street fair leftovers" },
    { emoji: "🥡", name: "Takeout box", fat: 14, note: "Forgotten delivery!" },
    { emoji: "🍦", name: "Ice cream", fat: 6, note: "Melted on the pavement" },
  ];

  const HOUSE_SNACK_TYPES = [
    { emoji: "🎂", name: "Birthday cake", fat: 22, note: "Kitchen counter!" },
    { emoji: "🍗", name: "Roast chicken", fat: 26, note: "Sunday dinner!" },
    { emoji: "🥧", name: "Pie", fat: 18, note: "Cooling on the windowsill" },
    { emoji: "🍝", name: "Spaghetti", fat: 20, note: "Dinner table!" },
    { emoji: "🧇", name: "Waffles", fat: 15, note: "Breakfast still out!" },
    { emoji: "🍪", name: "Cookie jar", fat: 12, note: "Raided the jar!" },
    { emoji: "🥞", name: "Pancakes", fat: 16, note: "Stack on the stove!" },
    { emoji: "🍖", name: "Ham hock", fat: 24, note: "Fridge raid!" },
  ];

  const NEIGHBOR_HOUSES = [
    { x: -1200, y: 120, w: 220, h: 200, floor: "#bbdefb", wall: "#1565c0", roof: "#0d47a1", label: "Blue House", floorType: "hardwood", neighborHouse: true, door: { side: "bottom", cx: 0.5, w: 100 } },
    { x: -920, y: 120, w: 220, h: 200, floor: "#ffcdd2", wall: "#c62828", roof: "#b71c1c", label: "Red House", floorType: "tile", neighborHouse: true, door: { side: "bottom", cx: 0.5, w: 100 } },
    { x: -640, y: 120, w: 220, h: 200, floor: "#fff9c4", wall: "#f9a825", roof: "#f57f17", label: "Yellow House", floorType: "carpet", neighborHouse: true, door: { side: "bottom", cx: 0.5, w: 100 } },
  ];

  function houseDoorRect(h) {
    const doorW = h.door?.w || 120;
    const cx = h.x + h.w / 2;
    return {
      x: cx - doorW / 2 - 8,
      y: h.y + h.h - 24,
      w: doorW + 16,
      h: 90,
    };
  }

  function inHouseDoorway(wx, wy, r) {
    return NEIGHBOR_HOUSES.some((h) => {
      const d = houseDoorRect(h);
      return wx + r > d.x && wx - r < d.x + d.w && wy + r > d.y && wy - r < d.y + d.h;
    });
  }

  function buildHouseWalls(houses) {
    const walls = [];
    const thick = 14;
    houses.forEach((h) => {
      const doorW = h.door?.w || 120;
      const doorX = h.x + h.w / 2 - doorW / 2;
      walls.push({ x: h.x, y: h.y, w: thick, h: h.h, solid: true });
      walls.push({ x: h.x + h.w - thick, y: h.y, w: thick, h: h.h, solid: true });
      walls.push({ x: h.x, y: h.y, w: h.w, h: thick, solid: true });
      walls.push({ x: h.x, y: h.y + h.h - thick, w: doorX - h.x, h: thick, solid: true });
      walls.push({ x: doorX + doorW, y: h.y + h.h - thick, w: h.x + h.w - (doorX + doorW), h: thick, solid: true });
    });
    return walls;
  }

  const HOUSE_WALLS = buildHouseWalls(NEIGHBOR_HOUSES);

  const ROOMS = [
    ...NEIGHBOR_HOUSES,
    { x: -1240, y: 320, w: 820, h: 80, floor: "#424242", wall: "#263238", label: "Main Street", floorType: "asphalt", outdoor: true, street: true },
    { x: -200, y: 280, w: 360, h: 160, floor: "#7cb342", wall: "#558b2f", label: "Front Yard", floorType: "grass", outdoor: true },
    { x: 160, y: 0, w: 380, h: 320, floor: "#c4a574", wall: "#6d4c41", label: "Kitchen", floorType: "tile" },
    { x: 540, y: 0, w: 400, h: 340, floor: "#8d6e63", wall: "#4e342e", label: "Living Room", floorType: "hardwood" },
    { x: 940, y: 0, w: 380, h: 320, floor: "#9e8fb8", wall: "#5e35b1", label: "Bedroom", floorType: "carpet" },
    { x: 160, y: 320, w: 1160, h: 120, floor: "#a1887f", wall: "#5d4037", label: "Hallway", floorType: "hardwood" },
    { x: 160, y: 440, w: 520, h: 420, floor: "#90a4ae", wall: "#455a64", label: "Garage", floorType: "concrete" },
    { x: 680, y: 440, w: 640, h: 420, floor: "#558b2f", wall: "#33691e", label: "Backyard", floorType: "grass", outdoor: true },
  ];

  const FURNITURE = [
    { x: -10, y: 330, w: 55, h: 45, emoji: "📬", solid: true },
    { x: 110, y: 345, w: 90, h: 55, emoji: "🪴", solid: true },
    { x: 230, y: 365, w: 85, h: 50, emoji: "🍋", solid: false },
    { x: 0, y: 405, w: 110, h: 40, emoji: "🧸", solid: false },
    { x: 310, y: 345, w: 75, h: 50, emoji: "📰", solid: false },
    { x: 370, y: 355, w: 45, h: 55, emoji: "🏮", solid: false },
    { x: 200, y: 40, w: 90, h: 130, emoji: "🧊", solid: true },
    { x: 340, y: 60, w: 220, h: 55, emoji: "", solid: true },
    { x: 220, y: 220, w: 130, h: 70, emoji: "🗑️", solid: true },
    { x: 440, y: 240, w: 70, h: 50, emoji: "🥣", solid: false, bowl: true, bx: 475, by: 265 },
    { x: 600, y: 80, w: 220, h: 90, emoji: "🛋️", solid: true },
    { x: 860, y: 50, w: 110, h: 65, emoji: "📺", solid: true },
    { x: 620, y: 240, w: 90, h: 55, emoji: "☕", solid: true },
    { x: 760, y: 200, w: 70, h: 50, emoji: "🍿", solid: false },
    { x: 990, y: 60, w: 220, h: 150, emoji: "🛏️", solid: true },
    { x: 1240, y: 240, w: 80, h: 60, emoji: "👟", solid: true },
    { x: 1020, y: 280, w: 60, h: 40, emoji: "🎒", solid: false },
    { x: 280, y: 360, w: 80, h: 50, emoji: "🚪", solid: false },
    { x: 780, y: 360, w: 160, h: 50, emoji: "🖼️", solid: true },
    { x: 240, y: 500, w: 200, h: 90, emoji: "🚗", solid: true },
    { x: 540, y: 520, w: 120, h: 80, emoji: "📦", solid: true },
    { x: 820, y: 520, w: 100, h: 70, emoji: "🪴", solid: true },
    { x: 1050, y: 580, w: 140, h: 80, emoji: "🍖", solid: false },
    { x: 1180, y: 680, w: 90, h: 60, emoji: "⚽", solid: false },
    { x: -1140, y: 170, w: 70, h: 50, emoji: "🛋️", solid: true },
    { x: -1020, y: 230, w: 55, h: 40, emoji: "🍪", solid: false },
    { x: -840, y: 180, w: 80, h: 55, emoji: "🍳", solid: true },
    { x: -760, y: 240, w: 50, h: 40, emoji: "🥧", solid: false },
    { x: -540, y: 170, w: 75, h: 50, emoji: "🛏️", solid: true },
    { x: -450, y: 230, w: 60, h: 45, emoji: "🎂", solid: false },
  ];

  const BOWL = { x: 475, y: 265, r: 55 };

  let canvas, ctx, w, h;
  let playing = false;
  let zone = "eat";
  let autoEat = false;
  let eatTimer = 0;
  let animT = 0;
  let bitePops = [];
  let remotePlayers = [];
  let bossFight = null;
  let player = { x: 700, y: 480, facing: 1 };
  let camSmooth = { x: 700, y: 480 };
  let snacks = [];
  let crumbs = [];
  let dustMotes = [];
  let footprints = [];
  let keys = { up: false, down: false, left: false, right: false };
  let nearBowl = false;
  let snackToastTimer = 0;
  let lastFrame = 0;
  let playerMoving = false;

  let state = defaultState();

  function defaultState() {
    return {
      name: "Good Boy",
      breed: "golden",
      fat: 0,
      coins: 0,
      trophies: 0,
      rebirths: 0,
      foodTier: 0,
      upgrades: { chew: 0, bite: 0, sell: 0, auto: 0 },
      pets: [],
      bossesBeaten: [],
      bestFat: 0,
      totalFat: 0,
    };
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

  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e4) return (n / 1e3).toFixed(1) + "K";
    return Math.floor(n).toLocaleString();
  }

  function petMult() {
    if (!state.pets.length) return 1;
    return state.pets.reduce((m, p) => m * p.mult, 1);
  }

  function rebirthMult() {
    return 1 + state.rebirths * REBIRTH_BONUS;
  }

  function fatPerBite() {
    const food = FOODS[state.foodTier] || FOODS[0];
    const biteLvl = state.upgrades.bite || 0;
    return Math.floor(food.fatPerBite * (1 + biteLvl * 0.1) * petMult() * rebirthMult());
  }

  function eatInterval() {
    const chew = state.upgrades.chew || 0;
    return Math.max(0.12, 0.55 - chew * 0.02);
  }

  function sellRate() {
    const sellLvl = state.upgrades.sell || 0;
    return 10 - Math.min(8, sellLvl);
  }

  function dogScale(fat, opts) {
    opts = opts || {};
    if (fat >= SCREEN_FILL_FAT && opts.topDown && opts.viewW && opts.viewH) {
      const bodyW = 86;
      const bodyH = 58;
      const sc = Math.max((opts.viewW * 0.98) / bodyW, (opts.viewH * 0.98) / bodyH);
      return sc / 0.62;
    }
    return Math.min(3.2, 0.55 + Math.log10(Math.max(1, fat + 1)) * 0.38);
  }

  function isScreenFillPet(fat) {
    return fat >= SCREEN_FILL_FAT;
  }

  function moveSpeed() {
    const base = 210;
    const slow = Math.max(0.55, 1 - Math.log10(Math.max(1, state.fat + 1)) * 0.08);
    return base * slow;
  }

  function worldToScreen(wx, wy) {
    return { x: wx - camSmooth.x + w * 0.5, y: wy - camSmooth.y + h * 0.52 };
  }

  function screenToWorld(sx, sy) {
    return { x: sx + camSmooth.x - w * 0.5, y: sy + camSmooth.y - h * 0.52 };
  }

  function initDust() {
    dustMotes = [];
    for (let i = 0; i < 55; i++) {
      dustMotes.push({
        x: WORLD_X_MIN + Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: 0.5 + Math.random() * 1.5,
        a: Math.random() * Math.PI * 2,
        sp: 0.2 + Math.random() * 0.4,
      });
    }
  }

  function spawnCrumbs(wx, wy) {
    for (let i = 0; i < 6; i++) {
      crumbs.push({
        x: wx + (Math.random() - 0.5) * 20,
        y: wy + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 80,
        vy: -20 - Math.random() * 60,
        life: 0.6 + Math.random() * 0.4,
        t: 0,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function drawFloorTile(sx, sy, tw, th, base, floorType, seed) {
    FSSprites.drawFloorTile(ctx, sx, sy, tw, th, base, floorType || "tile", seed || 0);
  }

  function drawCeilingLight(room, camX, camY) {
    const sx = room.x - camX;
    const sy = room.y - camY;
    FSSprites.drawRoomWalls(ctx, sx, sy, room);
  }

  function drawWindowLight() {}

  function shadeColor(hex, amt) {
    return FSSprites.shadeColor(hex, amt);
  }

  function draw3DBox(sx, sy, bw, bh, depth, topColor, sideColor, frontColor) {
    FSSprites.draw3DBox(ctx, sx, sy, bw, bh, depth, topColor, sideColor, frontColor);
  }

  function drawSoftShadow(sx, sy, rw, rh) {
    FSSprites.drawSoftShadow(ctx, sx, sy, rw, rh);
  }

  function drawFurnitureDetail() {}

  function getRoomAt(wx, wy) {
    return ROOMS.find((r) => wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h);
  }

  function collides(wx, wy, r) {
    if (wx - r < WORLD_X_MIN + 20 || wy - r < 20 || wx + r > WORLD_X_MAX - 20 || wy + r > WORLD_H - 20) return true;
    for (const f of FURNITURE) {
      if (!f.solid) continue;
      if (wx + r > f.x && wx - r < f.x + f.w && wy + r > f.y && wy - r < f.y + f.h) return true;
    }
    for (const wall of HOUSE_WALLS) {
      if (!wall.solid) continue;
      if (wx + r > wall.x && wx - r < wall.x + wall.w && wy + r > wall.y && wy - r < wall.y + wall.h) {
        if (inHouseDoorway(wx, wy, r)) continue;
        return true;
      }
    }
    return false;
  }

  function randomSnackPoint() {
    const streetRooms = ROOMS.filter((r) => r.street);
    const houseRooms = ROOMS.filter((r) => r.neighborHouse);
    const homeRooms = ROOMS.filter((r) => !r.street && !r.neighborHouse);
    let pool = homeRooms;
    const roll = Math.random();
    if (roll < 0.38 && streetRooms.length) pool = streetRooms;
    else if (roll < 0.78 && houseRooms.length) pool = houseRooms;

    for (let i = 0; i < 40; i++) {
      const room = pool[Math.floor(Math.random() * pool.length)];
      const x = room.x + 40 + Math.random() * (room.w - 80);
      const y = room.y + 40 + Math.random() * (room.h - 80);
      if (!collides(x, y, 12)) return { x, y, room };
    }
    return { x: 700, y: 480, room: null };
  }

  function spawnSnack() {
    const pt = randomSnackPoint();
    let type;
    if (pt.room?.street) {
      type = STREET_SNACK_TYPES[Math.floor(Math.random() * STREET_SNACK_TYPES.length)];
    } else if (pt.room?.neighborHouse) {
      type = HOUSE_SNACK_TYPES[Math.floor(Math.random() * HOUSE_SNACK_TYPES.length)];
    } else {
      type = SNACK_TYPES[Math.floor(Math.random() * SNACK_TYPES.length)];
    }
    snacks.push({
      id: Date.now() + Math.random(),
      x: pt.x,
      y: pt.y,
      ...type,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function initSnacks() {
    snacks = [];
    const count = 26 + Math.floor(state.foodTier * 2);
    for (let i = 0; i < count; i++) spawnSnack();
  }

  function snackFat(base) {
    const biteLvl = state.upgrades.bite || 0;
    return Math.max(1, Math.floor(base * (1 + biteLvl * 0.05) * petMult() * rebirthMult()));
  }

  function addFat(gain, wx, wy, label) {
    const wasBelowScreenFill = state.fat < SCREEN_FILL_FAT;
    state.fat += gain;
    state.totalFat += gain;
    if (state.fat > state.bestFat) state.bestFat = state.fat;
    if (wasBelowScreenFill && state.fat >= SCREEN_FILL_FAT) {
      showSnackToast("20 MILLION FAT!", 0);
      setTimeout(() => {
        showSnackToast("Your pet fills the whole screen! 🥥", 0);
      }, 2400);
    }
    eatTimer = 0.2;
    const s = worldToScreen(wx, wy);
    bitePops.push({ x: s.x, y: s.y - 20, amount: gain, t: 0 });
    if (label) showSnackToast(label, gain);
    updateHud();
    saveState();
  }

  function showSnackToast(text, gain) {
    const el = document.getElementById("snack-toast");
    if (!el) return;
    el.textContent = gain > 0
      ? `😋 Devoured ${text}! +${fmt(gain)} fat`
      : text;
    el.classList.remove("hidden");
    snackToastTimer = 2.2;
  }

  function collectSnacks() {
    snacks = snacks.filter((s) => {
      const dx = s.x - player.x;
      const dy = s.y - player.y;
      if (dx * dx + dy * dy < (PLAYER_R + 18) * (PLAYER_R + 18)) {
        addFat(snackFat(s.fat), s.x, s.y, s.name);
        spawnCrumbs(s.x, s.y);
        setTimeout(spawnSnack, 800 + Math.random() * 2000);
        return false;
      }
      return true;
    });
  }

  function updateHome(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const spd = moveSpeed() * dt;
      const nx = player.x + dx * spd;
      const ny = player.y + dy * spd;
      if (!collides(nx, player.y, PLAYER_R)) player.x = nx;
      if (!collides(player.x, ny, PLAYER_R)) player.y = ny;
      player.facing = dx >= 0 ? 1 : -1;
      playerMoving = true;
      if (Math.random() < 0.35) {
        footprints.push({
          x: player.x - dx * 8,
          y: player.y - dy * 8,
          a: Math.atan2(dy, dx),
          life: 4,
          t: 0,
        });
        if (footprints.length > 40) footprints.shift();
      }
    } else {
      playerMoving = false;
    }

    const bdx = BOWL.x - player.x;
    const bdy = BOWL.y - player.y;
    nearBowl = bdx * bdx + bdy * bdy < BOWL.r * BOWL.r;

    camSmooth.x += (player.x - camSmooth.x) * Math.min(1, dt * 9);
    camSmooth.y += (player.y - camSmooth.y) * Math.min(1, dt * 9);

    dustMotes.forEach((d) => {
      d.x += Math.cos(d.a) * d.sp;
      d.y += Math.sin(d.a) * d.sp * 0.3;
      d.a += 0.002;
      if (d.x < WORLD_X_MIN) d.x = WORLD_X_MAX;
      if (d.x > WORLD_X_MAX) d.x = WORLD_X_MIN;
      if (d.y < 0) d.y = WORLD_H;
      if (d.y > WORLD_H) d.y = 0;
    });

    crumbs = crumbs.filter((c) => {
      c.t += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 120 * dt;
      return c.t < c.life;
    });

    footprints.forEach((fp) => { fp.t += dt; });
    footprints = footprints.filter((fp) => fp.t < fp.life);

    collectSnacks();

    if (snackToastTimer > 0) {
      snackToastTimer -= dt;
      if (snackToastTimer <= 0) document.getElementById("snack-toast")?.classList.add("hidden");
    }
  }

  function drawDogTopDown(wx, wy, fat, breed, facing, munch, forceScreenCenter) {
    FSSprites.drawDogTopDown(ctx, {
      wx,
      wy,
      fat,
      breed,
      facing,
      munch,
      moving: playerMoving,
      animT,
      worldToScreen,
      breeds: BREEDS,
      dogScaleFn: (f) => dogScale(f, { topDown: true, viewW: w, viewH: h }),
      screenFillFat: SCREEN_FILL_FAT,
      forceScreenCenter: !!forceScreenCenter,
      viewW: w,
      viewH: h,
    });
  }

  function resize() {
    const wrap = document.getElementById("game-wrap");
    if (!wrap) return;
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function drawDog(x, y, fat, breed, facing, munch) {
    FSSprites.drawDogSide(ctx, x, y, fat, breed, facing, munch, animT, BREEDS, dogScale);
  }

  function drawHomeHudHints() {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(8, h - 28, 230, 20);
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText("🐾 Walk into snacks to devour!", 14, h - 14);
    if (inHouseDoorway(player.x, player.y, PLAYER_R)) {
      ctx.fillStyle = "rgba(46,125,50,0.85)";
      ctx.fillRect(8, h - 52, 220, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText("🚪 Walk up to go inside!", 14, h - 38);
    } else if (nearBowl) {
      const food = FOODS[state.foodTier] || FOODS[0];
      ctx.fillStyle = "rgba(46,125,50,0.85)";
      ctx.fillRect(8, h - 52, 250, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(`${food.emoji} Bowl: +${fmt(fatPerBite())}/bite`, 14, h - 38);
    }
  }

  function getFurnitureColors(f) {
    if (f.emoji === "🧊") return { top: "#eceff1", side: "#b0bec5", front: "#cfd8dc" };
    if (f.emoji === "🛋️") return { top: "#5d4037", side: "#3e2723", front: "#6d4c41" };
    if (f.emoji === "🛏️") return { top: "#7e57c2", side: "#5e35b1", front: "#9575cd" };
    if (f.emoji === "🚗") return { top: "#78909c", side: "#546e7a", front: "#607d8b" };
    if (f.emoji === "📺") return { top: "#263238", side: "#000", front: "#37474f" };
    if (f.emoji === "📦") return { top: "#a1887f", side: "#795548", front: "#8d6e63" };
    return { top: "#8d6e63", side: "#6d4c41", front: "#a1887f" };
  }

  function drawFurnitureItem(f, camX, camY) {
    const sx = f.x - camX;
    const sy = f.y - camY;
    if (sx + f.w < -60 || sx > w + 60 || sy + f.h < -60 || sy > h + 60) return;

    if (f.bowl) {
      const food = FOODS[state.foodTier] || FOODS[0];
      FSSprites.drawFoodBowl(ctx, sx, sy, f, food.emoji, nearBowl, fmt(fatPerBite()));
      return;
    }

    if (FSSprites.drawRealisticProp(ctx, f, sx, sy)) return;

    const depth = f.solid && f.w > 30 ? Math.min(14, f.h * 0.18) : 0;
    if (f.solid && f.w > 30) {
      const c = getFurnitureColors(f);
      drawSoftShadow(sx + f.w / 2, sy + f.h + depth, f.w * 0.42, 10);
      draw3DBox(sx, sy, f.w, f.h, depth, c.top, c.side, c.front);
    } else {
      drawSoftShadow(sx + f.w / 2, sy + f.h, f.w * 0.35, 6);
    }

    if (f.emoji && !f.solid) {
      ctx.font = `${Math.min(f.w, f.h, 32)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(f.emoji, sx + f.w * 0.5, sy + f.h * 0.68);
    }
  }

  function drawSnackItem(s, camX, camY) {
    const dist = Math.hypot(s.x - player.x, s.y - player.y);
    if (dist < 90) {
      const sx = s.x - camX;
      const sy = s.y - camY;
      ctx.fillStyle = "rgba(255,193,7,0.18)";
      ctx.beginPath();
      ctx.arc(sx, sy, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    FSSprites.drawSnack(ctx, s, camX, camY, snackFat);
  }

  function drawOutdoorSky(room, camX, camY) {
    const ox = room.x - camX;
    const oy = room.y - camY;
    const skyH = room.h + 120;
    const skyGrd = ctx.createLinearGradient(ox, oy - 100, ox, oy + room.h * 0.4);
    if (room.street) {
      skyGrd.addColorStop(0, "#546e7a");
      skyGrd.addColorStop(0.4, "#78909c");
      skyGrd.addColorStop(0.75, "#b0bec5");
      skyGrd.addColorStop(1, "#cfd8dc");
    } else {
      skyGrd.addColorStop(0, "#1565c0");
      skyGrd.addColorStop(0.35, "#42a5f5");
      skyGrd.addColorStop(0.7, "#90caf9");
      skyGrd.addColorStop(1, "#c8e6c9");
    }
    ctx.fillStyle = skyGrd;
    ctx.fillRect(ox - 30, oy - 90, room.w + 60, skyH);

    for (let c = 0; c < 4; c++) {
      const cx = ox + 40 + c * (room.w * 0.22) + Math.sin(animT * 0.15 + c * 2 + room.x) * 8;
      const cy = oy - 30 + (c % 2) * 18;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + (c % 2) * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 28 + c * 4, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 22, cy + 4, 22, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 18, cy + 6, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const sunX = ox + room.w * (room.label === "Front Yard" ? 0.22 : 0.78);
    const sunY = oy - 28;
    const sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 18);
    sunCore.addColorStop(0, "rgba(255,253,231,1)");
    sunCore.addColorStop(0.5, "rgba(255,236,179,0.85)");
    sunCore.addColorStop(1, "rgba(255,213,79,0)");
    ctx.fillStyle = sunCore;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fill();
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 90);
    sunGlow.addColorStop(0, "rgba(255,248,220,0.35)");
    sunGlow.addColorStop(0.4, "rgba(255,236,179,0.12)");
    sunGlow.addColorStop(1, "rgba(255,236,179,0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFrontYardDecor(camX, camY) {
    const room = ROOMS.find((r) => r.label === "Front Yard");
    if (!room) return;
    const fx = room.x - camX;
    const fy = room.y - camY;
    if (fx + room.w < -50 || fx > w + 50) return;

    ctx.fillStyle = "#efebe9";
    ctx.fillRect(fx + room.w - 95, fy + 55, 95, room.h - 55);
    ctx.fillStyle = "#bcaaa4";
    for (let s = 0; s < 4; s++) {
      ctx.fillRect(fx + room.w - 88, fy + 68 + s * 14, 74, 8);
    }

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(fx + room.w - 72, fy + room.h - 28, 52, 10);
    ctx.fillStyle = "#8d6e63";
    ctx.font = "9px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WELCOME", fx + room.w - 46, fy + room.h - 20);

    const pathY = fy + room.h - 38;
    ctx.fillStyle = "#bdbdbd";
    ctx.fillRect(fx + 60, pathY, room.w - 60, 28);
    ctx.fillStyle = "#9e9e9e";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(fx + 80 + i * 58, pathY + 4, 44, 20);
    }
    ctx.fillStyle = "#bdbdbd";
    ctx.fillRect(fx - 1180, pathY + 2, 1180, 24);
    ctx.fillStyle = "#9e9e9e";
    for (let i = 0; i < 18; i++) {
      ctx.fillRect(fx - 1160 + i * 62, pathY + 6, 46, 16);
    }

    ctx.fillStyle = "#fafafa";
    for (let i = 0; i < Math.floor(room.h / 24); i++) {
      const px = fx - 6;
      const py = fy + 8 + i * 24;
      ctx.fillRect(px, py, 8, 18);
      if (i % 2 === 0) ctx.fillRect(px - 2, py + 6, 12, 4);
    }
    ctx.fillRect(fx - 8, fy, room.w + 8, 6);

    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.arc(fx + 30, fy + room.h - 50, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx + room.w - 130, fy + 30, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHouseFacade(h, camX, camY) {
    const fx = h.x - camX;
    const fy = h.y + h.h - camY;
    if (fx + h.w < -80 || fx > w + 80) return;

    const facadeH = 44;
    const roofH = 34;
    const doorW = h.door?.w || 120;
    const doorX = fx + h.w * 0.5 - doorW * 0.5;

    ctx.fillStyle = h.roof || "#5d4037";
    ctx.beginPath();
    ctx.moveTo(fx - 6, fy);
    ctx.lineTo(fx + h.w * 0.5, fy - roofH);
    ctx.lineTo(fx + h.w + 6, fy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const wallG = ctx.createLinearGradient(fx, fy, fx, fy + facadeH);
    wallG.addColorStop(0, shadeColor(h.wall, 0.12));
    wallG.addColorStop(1, shadeColor(h.wall, -0.08));
    ctx.fillStyle = wallG;
    ctx.fillRect(fx, fy, h.w, facadeH);

    ctx.fillStyle = wallG;
    ctx.fillRect(fx, fy, doorX - fx, facadeH);
    ctx.fillRect(doorX + doorW, fy, fx + h.w - (doorX + doorW), facadeH);

    ctx.fillStyle = "#1a1410";
    ctx.fillRect(doorX + 4, fy + 8, doorW - 8, facadeH - 4);
    ctx.fillStyle = "rgba(255,248,220,0.12)";
    ctx.fillRect(doorX + 10, fy + 14, doorW - 20, facadeH - 18);

    ctx.fillStyle = "#5d4037";
    ctx.fillRect(doorX + doorW - 18, fy + 18, 4, facadeH - 22);
    ctx.fillRect(doorX + doorW - 18, fy + 18, 14, 4);
    ctx.fillRect(doorX + doorW - 18, fy + facadeH - 14, 14, 4);

    const winW = 36;
    const winH = 28;
    ctx.fillStyle = "rgba(135,206,250,0.65)";
    ctx.fillRect(fx + 28, fy + 10, winW, winH);
    ctx.fillRect(fx + h.w - 28 - winW, fy + 10, winW, winH);
    ctx.strokeStyle = "#fafafa";
    ctx.lineWidth = 2;
    ctx.strokeRect(fx + 28, fy + 10, winW, winH);
    ctx.strokeRect(fx + h.w - 28 - winW, fy + 10, winW, winH);

    ctx.fillStyle = "#efebe9";
    ctx.fillRect(fx - 4, fy + facadeH, h.w + 8, 8);

    const matX = h.x + h.w / 2 - camX;
    const matY = fy + facadeH + 2;
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(matX - 34, matY, 68, 10);
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🚪", matX, matY + 9);
  }

  function drawNeighborStreet(camX, camY) {
    const street = ROOMS.find((r) => r.street);
    if (!street) return;
    const sx = street.x - camX;
    const sy = street.y - camY;
    if (sx + street.w < -80 || sx > w + 80) return;

    ctx.fillStyle = "#cfd8dc";
    ctx.fillRect(sx - 8, sy - 14, street.w + 16, 12);

    NEIGHBOR_HOUSES.forEach((h) => drawHouseFacade(h, camX, camY));

    for (let i = 0; i < Math.floor(street.w / 220); i++) {
      const lx = sx + 80 + i * 220;
      ctx.fillStyle = "#37474f";
      ctx.fillRect(lx, sy - 52, 6, 38);
      ctx.fillStyle = "#fff59d";
      ctx.beginPath();
      ctx.arc(lx + 3, sy - 54, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "600 10px system-ui,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = "center";
    ctx.fillText("🍔 Snacks on the street · 🚪 Walk up to the door mat to go inside!", sx + street.w * 0.5, sy + street.h * 0.72);
  }

  function drawBackyardFence(camX, camY) {
    const backyard = ROOMS.find((r) => r.label === "Backyard");
    if (!backyard) return;
    const bx = backyard.x - camX;
    const by = backyard.y - camY;
    const fenceY = by + backyard.h * 0.15;
    ctx.fillStyle = "#6d4c41";
    for (let i = 0; i < Math.floor(backyard.w / 28); i++) {
      const fx = bx + 8 + i * 28;
      ctx.fillRect(fx, fenceY, 6, 36);
      if (i % 3 === 0) ctx.fillRect(fx - 2, fenceY + 8, 10, 4);
    }
    ctx.fillRect(bx, fenceY + 4, backyard.w, 5);
  }

  function drawHomeWorld() {
    const camX = camSmooth.x - w * 0.5;
    const camY = camSmooth.y - h * 0.52;

    ctx.fillStyle = "#1a1410";
    ctx.fillRect(0, 0, w, h);

    ROOMS.filter((r) => r.outdoor).forEach((room) => drawOutdoorSky(room, camX, camY));

    ctx.fillStyle = "#2c241c";
    ctx.fillRect(WORLD_X_MIN - camX - 10, -camY - 10, WORLD_W + 20, WORLD_H + 20);

    ROOMS.forEach((room, idx) => {
      const sx = room.x - camX;
      const sy = room.y - camY;
      if (sx + room.w < -50 || sx > w + 50 || sy + room.h < -50 || sy > h + 50) return;

      drawFloorTile(sx, sy, room.w, room.h, room.floor, room.floorType, idx);
      if (room.label === "Kitchen") {
        ctx.fillStyle = "rgba(255,183,77,0.08)";
        ctx.fillRect(sx + 8, sy + room.h - 42, room.w - 16, 32);
      }
      drawCeilingLight(room, camX, camY);

      ctx.font = "600 11px system-ui,sans-serif";
      const lw = ctx.measureText(room.label).width + 16;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.roundRect(sx + room.w / 2 - lw / 2, sy + 8, lw, 18, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "center";
      ctx.fillText(room.label, sx + room.w * 0.5, sy + 21);
    });

    drawFrontYardDecor(camX, camY);
    drawNeighborStreet(camX, camY);
    drawBackyardFence(camX, camY);

    const liv = ROOMS.find((r) => r.label === "Living Room");
    const rugX = liv.x - camX + liv.w * 0.22;
    const rugY = liv.y - camY + liv.h * 0.42;
    if (rugX > -200 && rugX < w + 50) {
      const rugG = ctx.createRadialGradient(rugX + 100, rugY + 55, 20, rugX + 100, rugY + 55, 130);
      rugG.addColorStop(0, "#6d4c41");
      rugG.addColorStop(0.7, "#5d4037");
      rugG.addColorStop(1, "#4e342e");
      ctx.fillStyle = rugG;
      ctx.fillRect(rugX, rugY, 200, 110);
      ctx.strokeStyle = "rgba(255,215,0,0.25)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.strokeRect(rugX + 8 + i * 38, rugY + 8, 32, 94);
      }
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(rugX + 4, rugY + 4, 192, 102);
    }

    dustMotes.forEach((d) => {
      const sx = d.x - camX;
      const sy = d.y - camY;
      if (sx < 0 || sx > w || sy < 0 || sy > h) return;
      ctx.fillStyle = `rgba(255,248,220,${0.1 + Math.sin(animT * 2 + d.a) * 0.06})`;
      ctx.beginPath();
      ctx.arc(sx, sy, d.r, 0, Math.PI * 2);
      ctx.fill();
    });

    FURNITURE.forEach((f) => drawFurnitureItem(f, camX, camY));

    footprints.forEach((fp) => {
      const sx = fp.x - camX;
      const sy = fp.y - camY;
      const alpha = 1 - fp.t / fp.life;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(fp.a);
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = "#4e342e";
      ctx.beginPath();
      ctx.ellipse(-5, 0, 4, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(5, 2, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const entities = [];
    snacks.forEach((s) => entities.push({ type: "snack", y: s.y, s }));
    remotePlayers.forEach((p) => {
      const st = p.state || {};
      if (st.zone && st.zone !== "eat") return;
      entities.push({
        type: "remote",
        y: typeof st.y === "number" ? st.y : 500,
        p,
        st,
      });
    });
    entities.push({ type: "player", y: player.y });
    entities.sort((a, b) => a.y - b.y);

    entities.forEach((e) => {
      if (e.type === "snack") drawSnackItem(e.s, camX, camY);
      else if (e.type === "remote") {
        const rx = typeof e.st.x === "number" ? e.st.x : 720;
        const ry = typeof e.st.y === "number" ? e.st.y : 500;
        drawDogTopDown(rx, ry, e.st.fat || 10, e.st.breed || "golden", e.st.facing || 1, false);
        const rs = worldToScreen(rx, ry - 32);
        ctx.font = "600 9px system-ui,sans-serif";
        const nm = (e.p.name || "Dog").slice(0, 10);
        const nw = ctx.measureText(nm).width + 12;
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.beginPath();
        ctx.roundRect(rs.x - nw / 2, rs.y - 11, nw, 14, 3);
        ctx.fill();
        ctx.fillStyle = "#90caf9";
        ctx.textAlign = "center";
        ctx.fillText(nm, rs.x, rs.y);
      } else {
        if (!isScreenFillPet(state.fat)) {
          drawDogTopDown(player.x, player.y, state.fat, state.breed, player.facing, eatTimer > 0);
        }
      }
    });

    if (isScreenFillPet(state.fat)) {
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.52, 20, w * 0.5, h * 0.52, Math.min(w, h) * 0.55);
      glow.addColorStop(0, "rgba(255, 235, 59, 0.18)");
      glow.addColorStop(0.55, "rgba(255, 193, 7, 0.08)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      drawDogTopDown(player.x, player.y, state.fat, state.breed, player.facing, eatTimer > 0, true);
    }

    crumbs.forEach((c) => {
      const sx = c.x - camX;
      const sy = c.y - camY;
      ctx.globalAlpha = 1 - c.t / c.life;
      ctx.fillStyle = "#a1887f";
      ctx.beginPath();
      ctx.ellipse(sx, sy, c.size, c.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    drawHomeHudHints();

    FSSprites.drawHomePostFX(ctx, w, h, animT, player.x - camX, player.y - camY);
  }

  function drawEatZone() {
    drawHomeWorld();
  }

  function drawSceneFloor(cx, cy, inner, outer) {
    const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(w, h) * 0.42);
    grd.addColorStop(0, inner);
    grd.addColorStop(1, outer);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.44, h * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawSellZone() {
    const cx = w * 0.5;
    const cy = h * 0.58;
    drawSceneFloor(cx, cy, "rgba(255,249,196,0.5)", "rgba(255,224,130,0.15)");
    ctx.font = "3rem sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("💵", cx, cy - 30);
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#33691e";
    ctx.fillText("Sell your fat for coins!", cx, cy + 10);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#558b2f";
    const rate = sellRate();
    ctx.fillText(`Rate: 1 coin per ${rate} fat`, cx, cy + 34);
    ctx.fillText(`You have ${fmt(state.fat)} fat → ${fmt(Math.floor(state.fat / rate))} coins`, cx, cy + 56);
    drawDog(cx, cy + 100, state.fat, state.breed, 1, false);
  }

  function drawShopZone() {
    const cx = w * 0.5;
    drawSceneFloor(cx, h * 0.72, "rgba(225,190,231,0.4)", "rgba(106,27,154,0.1)");
    let y = 48;
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#4a148c";
    ctx.textAlign = "center";
    ctx.fillText("🛒 Upgrade Shop", cx, y);
    y += 28;

    // Food tiers
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = "#6a1b9a";
    ctx.fillText("── Foods ──", cx, y);
    y += 8;
    const startY = y;
    FOODS.forEach((f, i) => {
      if (i === 0) return;
      const row = i - 1;
      const unlocked = state.foodTier >= i;
      const canBuy = !unlocked && state.coins >= f.cost && state.foodTier === i - 1;
      const yy = startY + row * 36;
      if (yy > h - 60) return;
      ctx.font = "1.2rem sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(f.emoji, 16, yy + 16);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = unlocked ? "#2e7d32" : canBuy ? "#e65100" : "#757575";
      ctx.fillText(
        unlocked ? `${f.name} ✓` : `${f.name} — ${fmt(f.cost)}💰 (+${f.fatPerBite}/bite)`,
        44,
        yy + 16
      );
      if (canBuy) {
        ctx.fillStyle = "#ff6f00";
        ctx.fillRect(w - 72, yy - 4, 56, 24);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BUY", w - 44, yy + 12);
      }
    });

    // Upgrades section
    const uy = Math.min(startY + FOODS.length * 36, h * 0.55);
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = "#6a1b9a";
    ctx.textAlign = "center";
    ctx.fillText("── Upgrades ──", cx, uy);
    UPGRADES.forEach((u, i) => {
      const lvl = state.upgrades[u.id] || 0;
      const maxed = lvl >= u.max;
      const cost = Math.floor(u.baseCost * Math.pow(1.55, lvl));
      const canBuy = !maxed && state.coins >= cost;
      const yy = uy + 20 + i * 32;
      if (yy > h - 40) return;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = maxed ? "#2e7d32" : "#4a148c";
      ctx.fillText(`${u.emoji} ${u.name} Lv.${lvl}/${u.max}`, 16, yy);
      if (!maxed) {
        ctx.fillStyle = canBuy ? "#e65100" : "#9e9e9e";
        ctx.textAlign = "right";
        ctx.fillText(`${fmt(cost)}💰`, w - 16, yy);
      }
    });
  }

  function drawBossZone() {
    const cx = w * 0.5;
    drawSceneFloor(cx, h * 0.62, "rgba(255,205,210,0.45)", "rgba(183,28,28,0.12)");
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#b71c1c";
    ctx.textAlign = "center";
    ctx.fillText("⚔️ Boss Arena", cx, 40);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#4e342e";
    ctx.fillText("Beat bosses for trophies & coins!", cx, 62);

    BOSSES.forEach((b, i) => {
      const beaten = state.bossesBeaten.includes(b.id);
      const canFight = !beaten && state.fat >= b.fatReq;
      const yy = 90 + i * 58;
      if (yy > h - 30) return;
      ctx.font = "2rem sans-serif";
      ctx.fillText(b.emoji, 40, yy);
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = beaten ? "#2e7d32" : canFight ? "#c62828" : "#757575";
      ctx.fillText(beaten ? `${b.name} ✓ BEATEN` : b.name, 72, yy - 8);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#5d4037";
      ctx.fillText(`Need ${fmt(b.fatReq)} fat · 🏆${b.trophies} · 💰${fmt(b.coins)}`, 72, yy + 12);
      if (canFight) {
        ctx.fillStyle = "#d84315";
        ctx.fillRect(w - 80, yy - 22, 64, 28);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("FIGHT", w - 48, yy - 4);
      }
    });
    drawDog(cx, h - 80, state.fat, state.breed, 1, false);
  }

  function drawEggsZone() {
    const cx = w * 0.5;
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#33691e";
    ctx.textAlign = "center";
    ctx.fillText("🥚 Egg Hatchery", cx, 40);
    ctx.font = "12px sans-serif";
    ctx.fillText(`Spend trophies to hatch pets! (${state.trophies} 🏆)`, cx, 62);

    EGG_TYPES.forEach((e, i) => {
      const canBuy = state.trophies >= e.cost;
      const yy = 100 + i * 70;
      ctx.font = "2.5rem sans-serif";
      ctx.fillText(e.emoji, cx - 80, yy);
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#33691e";
      ctx.fillText(e.name, cx - 30, yy - 10);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = canBuy ? "#e65100" : "#9e9e9e";
      ctx.fillText(`Cost: ${e.cost} 🏆`, cx - 30, yy + 12);
      if (canBuy) {
        ctx.fillStyle = "#558b2f";
        ctx.fillRect(cx + 60, yy - 28, 70, 32);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("HATCH", cx + 95, yy - 8);
      }
    });

    // Pet collection
    const py = h - 100;
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "#33691e";
    ctx.textAlign = "center";
    ctx.fillText(`Your Pets (${state.pets.length}) · ${petMult().toFixed(2)}x fat`, cx, py);
    state.pets.slice(0, 8).forEach((p, i) => {
      ctx.font = "1.5rem sans-serif";
      ctx.fillText(p.emoji, 30 + i * 36, py + 30);
    });
  }

  function drawPvpZone() {
    const cx = w * 0.5;
    drawSceneFloor(cx, h * 0.58, "rgba(255,224,178,0.45)", "rgba(191,54,12,0.12)");
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#bf360c";
    ctx.textAlign = "center";
    ctx.fillText("👊 PVP — Fattest Dog Wins!", cx, 40);

    const all = [
      { name: state.name, fat: state.fat, you: true },
      ...remotePlayers.map((p) => ({ name: p.name, fat: (p.state || {}).fat || 0, remote: true })),
    ].sort((a, b) => b.fat - a.fat);

    all.slice(0, 6).forEach((p, i) => {
      const yy = 70 + i * 36;
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = p.you ? "#2e7d32" : p.remote ? "#1565c0" : "#5d4037";
      ctx.fillText(`#${i + 1} ${p.name}${p.you ? " (you)" : p.remote ? " 🌐" : ""}`, 24, yy);
      ctx.textAlign = "right";
      ctx.fillText(fmt(p.fat) + " fat", w - 24, yy);
    });

    if (all.length > 1 && all[0].you) {
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#ff6f00";
      ctx.textAlign = "center";
      ctx.fillText("🏆 YOU WIN! Fattest dog!", cx, h - 60);
    }

    drawDog(cx, h - 120, state.fat, state.breed, 1, false);
  }

  function drawRebirthZone() {
    const cx = w * 0.5;
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#4527a0";
    ctx.textAlign = "center";
    ctx.fillText("♻️ Rebirth Shrine", cx, 50);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#5e35b1";
    ctx.fillText(`Rebirths: ${state.rebirths} · Bonus: +${Math.round(state.rebirths * REBIRTH_BONUS * 100)}% fat`, cx, 78);
    ctx.fillText(`Need ${fmt(REBIRTH_FAT_REQ)} fat to rebirth`, cx, 100);
    ctx.fillText("Resets fat, coins & upgrades — keeps pets & trophies!", cx, 122);
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = state.fat >= REBIRTH_FAT_REQ ? "#2e7d32" : "#c62828";
    ctx.fillText(state.fat >= REBIRTH_FAT_REQ ? "✓ Ready to rebirth!" : `Need ${fmt(REBIRTH_FAT_REQ - state.fat)} more fat`, cx, 150);
    drawDog(cx, h * 0.6, state.fat, state.breed, 1, false);
  }

  function drawZone() {
    if (zone !== "eat") {
      const z = ZONES[zone] || ZONES.eat;
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, z.bg[0]);
      grd.addColorStop(1, z.bg[1]);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(76, 175, 80, 0.35)";
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
    }

    switch (zone) {
      case "eat": drawEatZone(); break;
      case "sell": drawSellZone(); break;
      case "shop": drawShopZone(); break;
      case "boss": drawBossZone(); break;
      case "eggs": drawEggsZone(); break;
      case "pvp": drawPvpZone(); break;
      case "rebirth": drawRebirthZone(); break;
    }

    bitePops = bitePops.filter((p) => {
      p.t += 0.016;
      p.y -= 1.2;
      ctx.globalAlpha = 1 - p.t;
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#ff5722";
      ctx.textAlign = "center";
      ctx.fillText("+" + fmt(p.amount), p.x, p.y);
      ctx.globalAlpha = 1;
      return p.t < 1;
    });

    if (zone === "eat") {
      const fg = ctx.createRadialGradient(w * 0.5, h * 0.72, 20, w * 0.5, h * 0.72, w * 0.55);
      fg.addColorStop(0, "rgba(129,199,132,0.12)");
      fg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);
    }

    window.GameRealism?.postFrame(ctx, w, h, {
      animT,
      focusX: w * 0.5,
      focusY: h * 0.55,
      decor: zone,
      vignette: 0.22,
    });
  }

  function updateHud() {
    document.getElementById("fat-display").textContent = "🍔 " + fmt(state.fat) + " Fat";
    document.getElementById("coin-display").textContent = "💰 " + fmt(state.coins);
    document.getElementById("trophy-display").textContent = "🏆 " + fmt(state.trophies);
    document.getElementById("zone-label").textContent = (ZONES[zone] || ZONES.eat).label;
    if (playing) updateLeaderboard();
  }

  function updateLeaderboard() {
    const el = document.getElementById("leaderboard");
    const rows = [
      { name: state.name, fat: state.fat, you: true },
      ...remotePlayers.map((p) => ({
        name: p.name || "Dog",
        fat: (p.state || {}).fat || 0,
        remote: true,
      })),
    ]
      .sort((a, b) => b.fat - a.fat)
      .slice(0, 8);

    el.innerHTML =
      "<h4>🏆 Fattest Dogs</h4>" +
      rows
        .map(
          (r, i) =>
            `<div class="lb-row ${r.you ? "you" : r.remote ? "remote" : ""}"><span>#${i + 1} ${r.name.slice(0, 10)}</span><span>${fmt(r.fat)}</span></div>`
        )
        .join("");
  }

  function updateActionBar() {
    const eatBtn = document.getElementById("eat-btn");
    const autoBtn = document.getElementById("auto-eat-btn");
    const sellBtn = document.getElementById("sell-btn");
    const rebirthBtn = document.getElementById("rebirth-btn");
    const movePad = document.getElementById("move-pad");
    const atBowl = zone === "eat" && nearBowl;
    eatBtn.classList.toggle("hidden", !atBowl);
    eatBtn.textContent = atBowl ? "🍔 EAT FROM BOWL!" : "🍔 EAT!";
    sellBtn.classList.toggle("hidden", zone !== "sell");
    rebirthBtn.classList.toggle("hidden", zone !== "rebirth" || state.fat < REBIRTH_FAT_REQ);
    movePad?.classList.toggle("hidden", zone !== "eat");
    const hasAuto = (state.upgrades.auto || 0) >= 1;
    autoBtn.classList.toggle("hidden", !atBowl || !hasAuto);
    autoBtn.classList.toggle("on", autoEat);
    autoBtn.textContent = autoEat ? "⚡ Auto ON" : "⚡ Auto-Eat";
  }

  function doEat() {
    if (zone !== "eat" || !nearBowl) return;
    window.GameSFX?.play("eat");
    const gain = fatPerBite();
    addFat(gain, player.x, player.y - 20, null);
    spawnCrumbs(player.x, player.y);
  }

  function doSell() {
    if (state.fat <= 0) return;
    const rate = sellRate();
    const coins = Math.floor(state.fat / rate);
    state.coins += coins;
    state.fat = 0;
    updateHud();
    saveState();
  }

  function buyFood(tier) {
    const f = FOODS[tier];
    if (!f || tier !== state.foodTier + 1 || state.coins < f.cost) return;
    state.coins -= f.cost;
    state.foodTier = tier;
    updateHud();
    saveState();
  }

  function buyUpgrade(id) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u) return;
    const lvl = state.upgrades[id] || 0;
    if (lvl >= u.max) return;
    const cost = Math.floor(u.baseCost * Math.pow(1.55, lvl));
    if (state.coins < cost) return;
    state.coins -= cost;
    state.upgrades[id] = lvl + 1;
    updateHud();
    updateActionBar();
    saveState();
  }

  function startBoss(id) {
    const b = BOSSES[id];
    if (!b || state.bossesBeaten.includes(id) || state.fat < b.fatReq) return;
    bossFight = { boss: b, bossHp: b.hp, youHp: state.fat };
    window.GameSFX?.play("battle");
    document.getElementById("boss-title").textContent = "⚔️ vs " + b.name;
    document.getElementById("boss-enemy-emoji").textContent = b.emoji;
    document.getElementById("boss-enemy-name").textContent = b.name;
    document.getElementById("boss-you-emoji").textContent =
      state.breed === "husky" ? "🐺" : state.breed === "corgi" ? "🐶" : "🐕";
    updateBossBars();
    document.getElementById("boss-overlay").classList.remove("hidden");
  }

  function updateBossBars() {
    if (!bossFight) return;
    const youPct = Math.max(0, (bossFight.youHp / state.fat) * 100);
    const bossPct = Math.max(0, (bossFight.bossHp / bossFight.boss.hp) * 100);
    document.getElementById("boss-you-hp").style.width = youPct + "%";
    document.getElementById("boss-enemy-hp").style.width = bossPct + "%";
    document.getElementById("boss-you-fat").textContent = fmt(bossFight.youHp) + " fat";
  }

  function bossAttack() {
    if (!bossFight) return;
    const dmg = Math.floor(state.fat * 0.08 * petMult());
    bossFight.bossHp -= dmg;
    bossFight.youHp -= Math.floor(bossFight.boss.hp * 0.04);
    updateBossBars();
    if (bossFight.bossHp <= 0) {
      window.GameSFX?.play("win");
      state.trophies += bossFight.boss.trophies;
      state.coins += bossFight.boss.coins;
      state.bossesBeaten.push(bossFight.boss.id);
      bossFight = null;
      document.getElementById("boss-overlay").classList.add("hidden");
      updateHud();
      saveState();
    } else if (bossFight.youHp <= 0) {
      window.GameSFX?.play("lose");
      bossFight = null;
      document.getElementById("boss-overlay").classList.add("hidden");
    }
  }

  function hatchEgg(typeId) {
    const egg = EGG_TYPES.find((e) => e.id === typeId);
    if (!egg || state.trophies < egg.cost) return;
    state.trophies -= egg.cost;
    const pool = PETS[egg.pool];
    const pet = pool[Math.floor(Math.random() * pool.length)];
    state.pets.push({ ...pet });

    const overlay = document.getElementById("egg-overlay");
    const result = document.getElementById("egg-result");
    const closeBtn = document.getElementById("egg-close-btn");
    overlay.classList.remove("hidden");
    result.textContent = "";
    closeBtn.classList.add("hidden");
    setTimeout(() => {
      result.textContent = `You got ${pet.emoji} ${pet.name}! (${pet.mult}x fat)`;
      closeBtn.classList.remove("hidden");
    }, 1500);
    updateHud();
    saveState();
  }

  function doRebirth() {
    if (state.fat < REBIRTH_FAT_REQ) return;
    state.rebirths += 1;
    state.fat = 0;
    state.coins = 0;
    state.foodTier = 0;
    state.upgrades = { chew: 0, bite: 0, sell: 0, auto: state.upgrades.auto || 0 };
    document.getElementById("rebirth-overlay").classList.add("hidden");
    updateHud();
    updateActionBar();
    saveState();
  }

  function openRebirthOverlay() {
    document.getElementById("rebirth-msg").textContent =
      "Reset fat & coins for a permanent +" + Math.round(REBIRTH_BONUS * 100) + "% fat boost!";
    document.getElementById("rebirth-level").textContent = "Rebirths: " + state.rebirths;
    document.getElementById("rebirth-overlay").classList.remove("hidden");
  }

  function canvasClick(x, y) {
    if (zone === "shop") {
      FOODS.forEach((f, i) => {
        if (i === 0 || state.foodTier >= i) return;
        const row = i - 1;
        const yy = 76 + row * 36;
        if (y >= yy - 20 && y <= yy + 16 && x >= w - 80 && state.foodTier === i - 1 && state.coins >= f.cost) {
          buyFood(i);
        }
      });
      const uy = Math.min(76 + FOODS.length * 36, h * 0.55);
      UPGRADES.forEach((u, i) => {
        const yy = uy + 20 + i * 32;
        const lvl = state.upgrades[u.id] || 0;
        const cost = Math.floor(u.baseCost * Math.pow(1.55, lvl));
        if (y >= yy - 14 && y <= yy + 6 && x >= w - 100 && lvl < u.max && state.coins >= cost) {
          buyUpgrade(u.id);
        }
      });
    }
    if (zone === "boss") {
      BOSSES.forEach((b, i) => {
        const yy = 90 + i * 58;
        const canFight = !state.bossesBeaten.includes(b.id) && state.fat >= b.fatReq;
        if (canFight && y >= yy - 28 && y <= yy + 8 && x >= w - 90) startBoss(b.id);
      });
    }
    if (zone === "eggs") {
      EGG_TYPES.forEach((e, i) => {
        const yy = 100 + i * 70;
        const btnX = w * 0.5 + 60;
        if (state.trophies >= e.cost && x >= btnX && x <= btnX + 70 && y >= yy - 28 && y <= yy + 4) {
          hatchEgg(e.id);
        }
      });
    }
  }

  function gameLoop(now) {
    if (!playing) return;
    const dt = Math.min(0.05, ((now || performance.now()) - lastFrame) / 1000 || 0.016);
    lastFrame = now || performance.now();
    animT += dt;
    if (eatTimer > 0) eatTimer -= dt;

    if (zone === "eat") {
      updateHome(dt);
      if (autoEat && nearBowl && (state.upgrades.auto || 0) >= 1) {
        eatTimer -= dt;
        if (eatTimer <= 0) {
          doEat();
          eatTimer = eatInterval();
        }
      }
      updateActionBar();
    }

    drawZone();
    requestAnimationFrame(gameLoop);
  }

  function setZone(z) {
    zone = z;
    document.querySelectorAll(".zone-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.zone === z);
    });
    if (z === "eat" && snacks.length === 0) initSnacks();
    if (z === "rebirth" && state.fat >= REBIRTH_FAT_REQ) {
      document.getElementById("rebirth-msg").textContent =
        "Reset fat & coins for a permanent +" + Math.round(REBIRTH_BONUS * 100) + "% fat boost!";
      document.getElementById("rebirth-level").textContent = "Rebirths: " + state.rebirths;
    }
    updateHud();
    updateActionBar();
  }

  function startGame() {
    state.name = document.getElementById("name-input").value.trim().slice(0, 14) || "Good Boy";
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("zone-nav").classList.remove("hidden");
    document.getElementById("action-bar").classList.remove("hidden");
    document.getElementById("app").classList.add("playing");
    playing = true;
    initSnacks();
    initDust();
    player = { x: 700, y: 480, facing: 1 };
    camSmooth = { x: 700, y: 480 };
    crumbs = [];
    lastFrame = performance.now();
    updateHud();
    updateActionBar();
    resize();
    gameLoop();

    if (typeof markGameMpCustom === "function") markGameMpCustom();
    GameMP.init({
      game: "fat-simulator",
      subroom: "world",
      getName: () => state.name,
      getState: () => ({
        fat: state.fat,
        breed: state.breed,
        zone,
        x: player.x,
        y: player.y,
        facing: player.facing,
        trophies: state.trophies,
        rebirths: state.rebirths,
      }),
      onPeers: (peers) => {
        remotePlayers = peers;
        updateLeaderboard();
      },
    });
    GameMP.start();
  }

  function bindEvents() {
    document.getElementById("play-btn").addEventListener("click", startGame);

    document.querySelectorAll(".dog-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".dog-pick").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.breed = btn.dataset.breed;
        saveState();
      });
    });

    document.querySelectorAll(".zone-btn").forEach((btn) => {
      btn.addEventListener("click", () => setZone(btn.dataset.zone));
    });

    const eatBtn = document.getElementById("eat-btn");
    let eatHold = null;

    function startEatHold() {
      doEat();
      eatTimer = eatInterval();
      eatHold = setInterval(() => {
        doEat();
        eatTimer = eatInterval();
      }, eatInterval() * 1000);
      eatBtn.classList.add("eating");
    }

    function stopEatHold() {
      if (eatHold) clearInterval(eatHold);
      eatHold = null;
      eatBtn.classList.remove("eating");
    }

    eatBtn.addEventListener("mousedown", startEatHold);
    eatBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startEatHold(); });
    eatBtn.addEventListener("mouseup", stopEatHold);
    eatBtn.addEventListener("mouseleave", stopEatHold);
    eatBtn.addEventListener("touchend", stopEatHold);

    document.getElementById("auto-eat-btn").addEventListener("click", () => {
      autoEat = !autoEat;
      updateActionBar();
    });

    document.getElementById("sell-btn").addEventListener("click", doSell);
    document.getElementById("rebirth-btn").addEventListener("click", openRebirthOverlay);

    document.getElementById("boss-attack-btn").addEventListener("click", bossAttack);
    document.getElementById("boss-flee-btn").addEventListener("click", () => {
      bossFight = null;
      document.getElementById("boss-overlay").classList.add("hidden");
    });

    document.getElementById("egg-close-btn").addEventListener("click", () => {
      document.getElementById("egg-overlay").classList.add("hidden");
    });

    document.getElementById("rebirth-confirm-btn").addEventListener("click", doRebirth);
    document.getElementById("rebirth-cancel-btn").addEventListener("click", () => {
      document.getElementById("rebirth-overlay").classList.add("hidden");
    });

    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      canvasClick(e.clientX - rect.left, e.clientY - rect.top);
    });

    document.getElementById("settings-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.remove("hidden");
    });
    document.getElementById("close-settings-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.add("hidden");
    });
    document.getElementById("leave-game-btn").addEventListener("click", () => {
      GameMP.stop();
      window.location.href = "../../index.html";
    });

    window.addEventListener("resize", resize);

    const keyMap = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
    };
    window.addEventListener("keydown", (e) => {
      const k = keyMap[e.key];
      if (k) { keys[k] = true; e.preventDefault(); }
    });
    window.addEventListener("keyup", (e) => {
      const k = keyMap[e.key];
      if (k) keys[k] = false;
    });

    function bindMoveBtn(id, dir) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("mousedown", () => { keys[dir] = true; });
      btn.addEventListener("mouseup", () => { keys[dir] = false; });
      btn.addEventListener("mouseleave", () => { keys[dir] = false; });
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); keys[dir] = true; });
      btn.addEventListener("touchend", () => { keys[dir] = false; });
    }
    bindMoveBtn("move-up", "up");
    bindMoveBtn("move-down", "down");
    bindMoveBtn("move-left", "left");
    bindMoveBtn("move-right", "right");
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    state = loadState();
    document.getElementById("name-input").value = state.name;
    document.querySelectorAll(".dog-pick").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.breed === state.breed);
    });
    bindEvents();
    resize();
  }

  init();

  window.__fatSim3D = function () {
    if (!playing) return null;
    return {
      worldW: WORLD_W,
      worldH: WORLD_H,
      ground: "#8bc34a",
      defaultModel: "worm",
      player: {
        x: player.x - WORLD_X_MIN,
        y: player.y,
        facing: player.facing,
        model: "worm",
        color: "#8d6e63",
        scale: 1 + (state.fat || 0) * 0.002,
      },
      entities: snacks.slice(0, 40).map((s, i) => ({
        id: `snack${i}`,
        x: s.x - WORLD_X_MIN,
        y: s.y,
        model: "mob",
        color: "#ff9800",
        scale: 0.5,
      })),
    };
  };
})();
