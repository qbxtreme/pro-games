// Dragon Plains — your game saves in the browser on your iPad!

const PET_MAX_LEVEL = Infinity;
const NORMAL_PET_MAX_LEVEL = 99;
const WILD_LEVEL_CAP = 99;

function isInfinityLevel(n) {
  return n === Infinity || n === "Infinity";
}

function normalizeLevel(n) {
  if (isInfinityLevel(n)) return Infinity;
  const num = Number(n);
  return Number.isFinite(num) && num > 0 ? num : 1;
}

function isOwnerBoostActive() {
  return window.BecomeAProOwner?.isActive(state?.trainerName) || false;
}

function isOwnerSave(s) {
  return window.BecomeAProOwner?.isActive(s?.trainerName) || false;
}

function getPetMaxLevel() {
  return isOwnerBoostActive() ? Infinity : NORMAL_PET_MAX_LEVEL;
}

function isMaxLevel(n) {
  if (isInfinityLevel(n)) return isOwnerBoostActive();
  return normalizeLevel(n) >= getPetMaxLevel();
}

function formatLevel(n) {
  if (isInfinityLevel(n)) return "Infinity";
  return Number(n).toLocaleString();
}

const DAILY_COINS = 5;
const WHEEL_SPINS_MAX = 3;
const WHEEL_PERIOD_MS = 6 * 60 * 60 * 1000;
const XP_PER_LEVEL = 50;
const MAP_SIZE = 120;
const MAP_VERSION = 7;
const MAP_CENTER = Math.floor(MAP_SIZE / 2);
const CAVE_ROWS = Math.floor(MAP_SIZE * 0.2);
const SKY_ROWS = Math.floor(MAP_SIZE * 0.4);
const VOLCANO_START = Math.floor(MAP_SIZE * 0.8);
const FOREST_COLS = Math.floor(MAP_SIZE * 0.2);
const OCEAN_START = Math.floor(MAP_SIZE * 0.55);
const MOB_COUNT = 35;
const WILD_SPAWN_CHANCE = 0.45;
const PLANT_REGROW_MS = 45000;
const BLOCKED_TILES = new Set(["tree", "water", "lava", "rock", "void"]);

const BIOME_INFO = {
  plains: { name: "Plains", icon: "🌾", element: null },
  forest: { name: "Forest", icon: "🌲", element: "earth" },
  ocean: { name: "Ocean", icon: "🌊", element: "water" },
  volcano: { name: "Volcano", icon: "🌋", element: "fire" },
  sky: { name: "Sky Island", icon: "☁️", element: "air" },
  cave: { name: "Dark Cave", icon: "🕳️", element: null },
  hub: { name: "Crystal Rift", icon: "💎", element: null },
  ice: { name: "Ice Lands", icon: "❄️", element: "ice" },
  hurricane: { name: "Hurricane Zone", icon: "🌀", element: "hurricane" },
  madgreen: { name: "Mad Green", icon: "🧪", element: "madgreen" },
  lavazone: { name: "Lava Pits", icon: "🔥", element: "lava" },
};

const PLANTS_BY_BIOME = {
  plains: ["🌾", "🌻", "🌿", "🪻"],
  forest: ["🌿", "🍀", "🪴", "🌱"],
  ocean: ["🐚", "🪸", "🦀", "⭐"],
  volcano: ["💎", "🌋", "🪨", "🔥"],
  sky: ["⭐", "✨", "🌸", "☁️"],
  hub: ["💎", "✨", "🔮", "⭐"],
  ice: ["❄️", "🧊", "⛄", "💠"],
  hurricane: ["🌪️", "⚡", "🌩️", "💨"],
  madgreen: ["🧪", "☠️", "🦠", "🍀"],
  lavazone: ["🔥", "🌋", "💎", "🪨"],
};

const ELEMENTS = ["fire", "water", "earth", "air"];
const WORLD2_ELEMENTS = ["ice", "lava", "hurricane", "madgreen"];
const ELEMENT_BEATS = {
  fire: "earth", earth: "air", air: "water", water: "fire",
  ice: "hurricane", hurricane: "madgreen", madgreen: "lava", lava: "ice",
};

const DRAGON_EMOJI = {
  fire: "🔥", water: "💧", earth: "🌿", air: "💨",
  ice: "❄️", lava: "🌋", hurricane: "🌀", madgreen: "🧪",
};
const DRAGON_NAMES = {
  fire: "Fire Dragon", water: "Water Dragon", earth: "Earth Dragon", air: "Air Dragon",
  ice: "Ice Dragon", lava: "Lava Dragon", hurricane: "Hurricane Dragon", madgreen: "Mad Green Dragon",
};

const EGG_TIERS = [
  { id: "common", name: "Common", icon: "🥚", wins: 1, startStars: 1, powerBonus: 0, startLevel: 1 },
  { id: "rare", name: "Rare", icon: "🥚", wins: 5, startStars: 1, powerBonus: 5, startLevel: 1 },
  { id: "epic", name: "Epic", icon: "🌟", wins: 15, startStars: 1, powerBonus: 10, startLevel: 1 },
  { id: "legendary", name: "Legendary", icon: "✨", wins: 30, startStars: 1, powerBonus: 15, startLevel: 1 },
  { id: "mythic", name: "Mythic", icon: "💜", wins: 60, startStars: 1, powerBonus: 20, startLevel: 1 },
  { id: "divine", name: "Divine", icon: "👑", wins: 120, startStars: 1, powerBonus: 35, startLevel: 5 },
];

const SHINY_CHANCE = 1 / 20;

const BLOB_NAMES = ["Gooey", "Blinky", "Squish", "Ploop", "Wobble", "Glop", "Oozey", "Bloop", "Gloop", "Slurp"];
const WILD_ANIMALS = BLOB_NAMES.map((name, i) => ({
  emoji: "👾",
  name,
  element: ELEMENTS[i % ELEMENTS.length],
  isBlob: true,
}));

const SHOP_ITEMS = [
  { id: "snack", icon: "🍪", title: "Pet Snack", desc: "+50 XP to a dragon", cost: 8 },
  { id: "star-dust", icon: "✨", title: "Star Dust", desc: "+1 star — bigger dragon! (max 5)", cost: 40 },
];

const STARTERS = [
  { element: "fire" },
  { element: "water" },
  { element: "earth" },
  { element: "air" },
];

function maybeResetGame() {
  if (new URLSearchParams(window.location.search).get("reset") === "1") {
    localStorage.removeItem("dragonForestSave");
    window.history.replaceState({}, "", window.location.pathname);
  }
}
maybeResetGame();

let state = loadState();
saveState();
let selectedPetId = null;
let battle = null;
let nameCallback = null;
let starterStep = 0;
let audioCtx = null;
let hatching = false;

function defaultState() {
  return {
    coins: 10,
    wins: 0,
    lastDailyClaim: "",
    playerLevel: 1,
    playerXP: 0,
    pets: [],
    eggInventory: {},
    snackInventory: 0,
    starDustInventory: 0,
    startersDone: false,
    battlePetId: null,
    searchedPlants: {},
    mapGenerated: false,
    mapVersion: 0,
    mapGrid: null,
    mapBiomes: null,
    playerX: MAP_CENTER,
    playerY: Math.floor(MAP_SIZE * 0.55),
    playerFx: MAP_CENTER + 0.5,
    playerFy: Math.floor(MAP_SIZE * 0.55) + 0.5,
    mobs: [],
    wheelSpinsUsed: 0,
    wheelPeriodEnd: 0,
    currentWorld: 1,
    worldTwoUnlocked: false,
    worldTwoUnlockShown: false,
    worlds: {},
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem("dragonForestSave");
    if (saved) {
      const parsed = JSON.parse(saved, (_, v) => (v === "Infinity" ? Infinity : v));
      return patchFireDragonMega({ ...defaultState(), ...parsed });
    }
  } catch (e) {}
  return patchFireDragonMega(defaultState());
}

function saveState() {
  localStorage.setItem(
    "dragonForestSave",
    JSON.stringify(state, (_, v) => (v === Infinity ? "Infinity" : v))
  );
}

function todayString() {
  return new Date().toDateString();
}

function maxLevelForStars() {
  return getPetMaxLevel();
}

function applyPetXP(pet, amount) {
  if (isMaxLevel(pet.level)) return 0;
  pet.xp += amount;
  let levelsGained = 0;
  let safety = 0;
  while (pet.xp >= xpNeeded(pet.level) && !isMaxLevel(pet.level) && safety++ < 500) {
    pet.xp -= xpNeeded(pet.level);
    pet.level++;
    levelsGained++;
  }
  if (isMaxLevel(pet.level)) {
    pet.level = Infinity;
    pet.xp = 0;
  }
  return levelsGained;
}

function starsDisplay(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function xpNeeded(level) {
  return level * XP_PER_LEVEL;
}

function elementLabel(el) {
  if (el === "madgreen") return "Mad Green";
  return el.charAt(0).toUpperCase() + el.slice(1);
}

function getActiveElements() {
  return state.currentWorld === 2 ? WORLD2_ELEMENTS : ELEMENTS;
}

function getWorldSpawn() {
  return {
    x: MAP_CENTER,
    y: Math.floor(MAP_SIZE * 0.55),
  };
}

function isWorldOneComplete() {
  ensureFeatureState();
  return state.gymsBeaten.length >= 4 && state.bossBeaten;
}

function persistCurrentWorld() {
  state.worlds[state.currentWorld || 1] = {
    playerX: state.playerX,
    playerY: state.playerY,
    playerFx: state.playerFx,
    playerFy: state.playerFy,
    mapGrid: state.mapGrid,
    mapBiomes: state.mapBiomes,
    mobs: state.mobs,
    searchedPlants: state.searchedPlants,
    mapGenerated: state.mapGenerated,
    mapVersion: state.mapVersion,
  };
}

function loadWorldData(worldNum) {
  const saved = state.worlds[worldNum];
  if (saved) {
    state.playerX = saved.playerX;
    state.playerY = saved.playerY;
    state.playerFx = saved.playerFx;
    state.playerFy = saved.playerFy;
    state.mapGrid = saved.mapGrid;
    state.mapBiomes = saved.mapBiomes;
    state.mobs = saved.mobs || [];
    state.searchedPlants = saved.searchedPlants || {};
    state.mapGenerated = saved.mapGenerated;
    state.mapVersion = saved.mapVersion;
    return;
  }
  const spawn = getWorldSpawn();
  state.playerX = spawn.x;
  state.playerY = spawn.y;
  state.playerFx = spawn.x + 0.5;
  state.playerFy = spawn.y + 0.5;
  state.mapGrid = null;
  state.mapBiomes = null;
  state.mobs = [];
  state.searchedPlants = {};
  state.mapGenerated = false;
  state.mapVersion = 0;
}

function switchWorld(worldNum) {
  if (worldNum === 2 && !state.worldTwoUnlocked) {
    showToast("Beat ALL gyms and the Cave Boss first!");
    return;
  }
  if (worldNum === state.currentWorld) return;
  persistCurrentWorld();
  state.currentWorld = worldNum;
  loadWorldData(worldNum);
  ensureMap();
  saveState();
  renderAll();
  playSound("win");
  showToast(worldNum === 2 ? "Welcome to World Two! ❄️🌀🧪🌋" : "Back to World One! 🌾");
  if (window.GameMP) {
    GameMP.setSubroom("world-" + worldNum);
  }
}

function checkWorldTwoUnlock() {
  if (!isWorldOneComplete() || state.worldTwoUnlocked) return;
  state.worldTwoUnlocked = true;
  saveState();
  if (!state.worldTwoUnlockShown) {
    state.worldTwoUnlockShown = true;
    document.getElementById("world-two-overlay")?.classList.remove("hidden");
  }
  showToast("WORLD TWO UNLOCKED! ❄️🌀🧪🌋");
  playSound("level");
  renderWorldUI();
}

function petPower(pet) {
  const lv = normalizeLevel(pet.level);
  if (lv === Infinity) return Infinity;
  return lv + (pet.powerBonus || 0);
}

function hasAdvantage(attacker, defender) {
  return ELEMENT_BEATS[attacker] === defender;
}

function showToast(msg) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function playSound(kind) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.15;

    const freqs = {
      tap: 440,
      win: 660,
      lose: 220,
      hatch: 880,
      spin: 520,
      level: 740,
      attack: 300,
    };
    osc.frequency.value = freqs[kind] || 440;
    osc.type = kind === "lose" ? "sawtooth" : "square";
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
}

function addPlayerXP(amount) {
  if (isMaxLevel(state.playerLevel)) return;
  state.playerXP += amount;
  while (state.playerXP >= state.playerLevel * 100 && !isMaxLevel(state.playerLevel)) {
    state.playerXP -= state.playerLevel * 100;
    state.playerLevel++;
    showToast(`🎉 Player level ${formatLevel(state.playerLevel)}!`);
    playSound("level");
  }
}

function makeDragon(element, tier, customName, shiny = false) {
  const tierData = EGG_TIERS.find((t) => t.id === tier) || EGG_TIERS[0];
  return {
    id: Date.now() + Math.random(),
    emoji: shiny ? "✨" : DRAGON_EMOJI[element],
    element,
    species: DRAGON_NAMES[element],
    name: customName || DRAGON_NAMES[element],
    level: tierData.startLevel,
    stars: 1,
    xp: 0,
    powerBonus: tierData.powerBonus,
    eggTier: tier,
    shiny: !!shiny,
  };
}

/** Casey Pro boost — dragon Goodie @ Divine level Infinity */
function isGoodiePet(p) {
  return p.name && String(p.name).toLowerCase().includes("goodie");
}

function isOwnerGoodie(p) {
  return isOwnerBoostActive() && isGoodiePet(p);
}

function capWildLevel(level) {
  const n = normalizeLevel(level);
  if (isInfinityLevel(n)) {
    return Math.min(normalizeLevel(state?.playerLevel || 1) + 3, WILD_LEVEL_CAP);
  }
  return Math.min(n, WILD_LEVEL_CAP);
}

function randomWildLevel(wild) {
  const hash = String(wild?.name || "mob").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const playerLv = Math.min(normalizeLevel(state?.playerLevel || 1), WILD_LEVEL_CAP);
  const offset = (hash % 5) - 2;
  return Math.max(1, Math.min(WILD_LEVEL_CAP, playerLv + offset));
}

function getBattlePetHp(pet) {
  if (isOwnerGoodie(pet)) return Infinity;
  const power = petPower(pet);
  if (!Number.isFinite(power)) return 40 + normalizeLevel(state.playerLevel) * 3;
  return 40 + power * 2;
}

function getWildBattleLevel(wild, opts) {
  if (opts?.isGym || opts?.isBoss) return capWildLevel(wild?.level || opts?.power || 1);
  return capWildLevel(wild?.level || randomWildLevel(wild));
}

function wildBattleHp(wild, opts, mobId) {
  if (opts?.hp) return opts.hp;
  const level = getWildBattleLevel(wild, opts);
  let hp = 28 + level * 4 + Math.floor(Math.random() * 12);
  if (mobId) {
    const mob = state.mobs.find((m) => m.id === mobId);
    if (mob?.caveMob) hp = Math.floor(hp * 1.35);
  }
  return hp;
}

function wildBattleLabel(wild, opts) {
  const label = opts?.isGym ? "Gym Leader's" : opts?.isBoss ? "BOSS" : "Wild";
  const level = formatLevel(getWildBattleLevel(wild, opts));
  return `${label} ${wild.name} · Lv ${level}`;
}

function patchFireDragonMega(s) {
  if (!isOwnerSave(s)) return s;
  if (!s.pets) s.pets = [];
  let goodie = s.pets.find(isGoodiePet);
  if (!goodie) {
    goodie = s.pets.find((p) => p.element === "fire");
    if (goodie) goodie.name = "Goodie";
    else {
      goodie = makeDragon("fire", "divine", "Goodie");
      s.pets.push(goodie);
    }
  }
  goodie.eggTier = "divine";
  goodie.powerBonus = 35;
  goodie.level = Infinity;
  goodie.xp = 0;
  goodie.stars = 5;
  goodie.species = goodie.species || DRAGON_NAMES[goodie.element] || "Fire Dragon";
  goodie.emoji = goodie.shiny ? "✨" : (DRAGON_EMOJI[goodie.element] || DRAGON_EMOJI.fire);
  s.playerLevel = Infinity;
  s.playerXP = 0;
  s.battlePetId = goodie.id;
  if (!s.startersDone && s.pets.length) s.startersDone = true;
  return s;
}

function askName(title, preview, callback) {
  document.getElementById("name-title").textContent = title;
  document.getElementById("name-preview").textContent = preview;
  document.getElementById("name-input").value = "";
  document.getElementById("name-overlay").classList.remove("hidden");
  nameCallback = callback;
  setTimeout(() => document.getElementById("name-input").focus(), 100);
}

function closeNameOverlay() {
  document.getElementById("name-overlay").classList.add("hidden");
  nameCallback = null;
}

function startStarterFlow() {
  document.getElementById("starter-overlay").classList.add("hidden");
  askName("What is YOUR trainer name?", "🧒", (name) => {
    state.trainerName = name;
    if (window.BecomeAProOwner?.isActive(name)) window.BecomeAProOwner.markOwner();
    saveState();
    starterStep = 0;
    nameNextStarter();
  });
}

function nameNextStarter() {
  if (starterStep >= STARTERS.length) {
    state.startersDone = true;
    if (state.pets.length > 0) state.battlePetId = state.pets[0].id;
    saveState();
    renderAll();
    showToast("Your four dragons are ready! Explore the plains!");
    return;
  }
  const s = STARTERS[starterStep];
  askName(
    `Name your ${elementLabel(s.element)} dragon!`,
    DRAGON_EMOJI[s.element],
    (name) => {
      const dragon = makeDragon(s.element, "common", name);
      state.pets.push(dragon);
      starterStep++;
      saveState();
      nameNextStarter();
    }
  );
}

function renderHeader() {
  ensureFeatureState();
  document.getElementById("wins").textContent = `🏆 ${state.wins}`;
  document.getElementById("coins").textContent = `🪙 ${state.coins}`;
  document.getElementById("player-level").textContent = `⭐ Lv ${formatLevel(state.playerLevel)}`;
  const foodEl = document.getElementById("food-count");
  if (foodEl) foodEl.textContent = `🍖 ${state.foodInventory || 0}`;
  const nameEl = document.getElementById("trainer-name");
  if (nameEl && state.trainerName) nameEl.textContent = state.trainerName;
  renderWorldUI();
  renderHotbar();
}

function getProTokens() {
  if (typeof window.BecomeAPro?.getTokens === "function") return window.BecomeAPro.getTokens();
  try {
    return parseInt(localStorage.getItem("becomeAProTokens") || "0", 10) || 0;
  } catch (_) {
    return 0;
  }
}

function renderHotbar() {
  const tokens = getProTokens();
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set("hotbar-tokens", `✨ Pro ${tokens}`);
  set("hotbar-coins", `🪙 ${state.coins}`);
  set("hotbar-wins", `🏆 ${state.wins}`);
  set("hotbar-food", `🍖 ${state.foodInventory || 0}`);
  set("hotbar-level", `⭐ Lv ${formatLevel(state.playerLevel)}`);

  const worldsBtn = document.getElementById("hotbar-worlds-btn");
  if (worldsBtn) {
    if (state.worldTwoUnlocked) {
      worldsBtn.textContent = state.currentWorld === 2 ? "🌍 World 1" : "🌌 World 2";
    } else {
      const gyms = state.gymsBeaten?.length || 0;
      worldsBtn.textContent = `🌌 ${gyms}/4`;
    }
  }
}

function setWorldPlayMode(on) {
  document.body.classList.toggle("world-play-mode", !!on);
  document.getElementById("app")?.classList.toggle("playing", !!on);
  if (on) closeGameMenu(false);
  if (typeof scheduleResizeCanvas === "function") {
    scheduleResizeCanvas();
  } else if (typeof resizeCanvas === "function") {
    resizeCanvas();
    requestAnimationFrame(resizeCanvas);
  }
}

function closeGameMenu(resize = true) {
  document.querySelectorAll(".game-menu-panel").forEach((p) => p.classList.remove("menu-open"));
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === "forest");
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("active", p.id === "tab-forest");
  });
  if (resize && typeof resizeCanvas === "function") resizeCanvas();
}

function openGameMenu(tabName) {
  closeGameMenu(false);
  setWorldPlayMode(true);
  const panel = document.getElementById(`tab-${tabName}`);
  const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (panel) {
    panel.classList.add("menu-open");
    panel.classList.add("active");
  }
  if (tab) tab.classList.add("active");
  document.getElementById("tab-forest")?.classList.add("active");

  if (tabName === "pets") {
    selectedPetId = null;
    renderPets();
  }
  if (tabName === "eggs") renderEggs();
  if (tabName === "shop") renderShop();
  if (tabName === "quests" && typeof renderQuests === "function") renderQuests();
  playSound("tap");
}

function setupHotbar() {
  document.querySelectorAll("[data-hotbar-menu]").forEach((btn) => {
    btn.addEventListener("click", () => openGameMenu(btn.dataset.hotbarMenu));
  });

  document.getElementById("hotbar-worlds-btn")?.addEventListener("click", () => {
    if (state.worldTwoUnlocked) {
      switchWorld(state.currentWorld === 2 ? 1 : 2);
      renderHotbar();
    } else {
      const gyms = state.gymsBeaten?.length || 0;
      showToast(`Beat 4 gyms + cave boss to unlock World Two! (${gyms}/4 gyms)`);
    }
    playSound("tap");
  });

  document.getElementById("hotbar-settings-btn")?.addEventListener("click", () => {
    openSettings();
  });

  document.querySelectorAll(".game-menu-back").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeGameMenu();
      playSound("tap");
    });
  });
}

function renderWorldUI() {
  const title = document.getElementById("game-title");
  const hint = document.getElementById("world-hint");
  const switchBtn = document.getElementById("world-switch-btn");
  const progress = document.getElementById("world-progress");
  if (title) {
    title.textContent = state.currentWorld === 2 ? "🌌 World Two" : "🐉 Dragon";
  }
  if (hint) {
    hint.textContent = state.currentWorld === 2
      ? "Explore Ice, Hurricane, Mad Green, and Lava!"
      : "Explore the plains and visit each elemental zone!";
  }
  if (switchBtn) {
    if (state.worldTwoUnlocked) {
      switchBtn.classList.remove("hidden");
      switchBtn.textContent = state.currentWorld === 2 ? "🌍 Go World One" : "🌌 Go World Two";
    } else {
      switchBtn.classList.add("hidden");
    }
  }
  if (progress && !state.worldTwoUnlocked) {
    const gyms = state.gymsBeaten?.length || 0;
    progress.textContent = `World Two unlock: ${gyms}/4 gyms + ${state.bossBeaten ? "✓" : "✗"} cave boss`;
    progress.classList.remove("hidden");
  } else if (progress) {
    progress.classList.add("hidden");
  }
}

function renderDailyBanner() {
  const banner = document.getElementById("daily-banner");
  banner.classList.toggle("hidden", state.lastDailyClaim === todayString());
}

function getEquippedPet() {
  return state.pets.find((p) => p.id === state.battlePetId) || null;
}

function equipPet(id) {
  const pet = state.pets.find((p) => p.id === id);
  if (!pet) return;

  state.battlePetId = pet.id;
  saveState();
  playSound("tap");
  showToast(`${pet.name} is equipped for battle! ⚔️`);
  renderAll();
}

function tileKey(row, col) {
  return `${row}-${col}`;
}

function isInBounds(row, col) {
  return row >= 0 && row < MAP_SIZE && col >= 0 && col < MAP_SIZE;
}

function isWalkable(row, col) {
  if (!isInBounds(row, col) || !state.mapGrid) return false;
  return !BLOCKED_TILES.has(state.mapGrid[row][col]);
}

function getBiomeAt(row, col) {
  if (!state.mapBiomes) return "plains";
  return state.mapBiomes[row][col];
}

function getBiomeForPosition(row, col) {
  if (state.currentWorld === 2) {
    if (row < CAVE_ROWS) return "ice";
    if (row < SKY_ROWS) return "hurricane";
    if (row >= VOLCANO_START) return "lavazone";
    if (col < FOREST_COLS && row >= SKY_ROWS) return "madgreen";
    return "hub";
  }
  if (row < CAVE_ROWS) return "cave";
  if (row < SKY_ROWS) return "sky";
  if (row >= VOLCANO_START) return "volcano";
  if (col < FOREST_COLS) return "forest";
  if (col >= OCEAN_START) return "ocean";
  return "plains";
}

function generateCell(biome, row, col) {
  const r = Math.random();
  if (biome === "plains") {
    if (r < 0.22) return "plant";
    return "grass";
  }
  if (biome === "forest") {
    if (r < 0.16) return "tree";
    if (r < 0.42) return "plant";
    return "grass";
  }
  if (biome === "ocean") {
    if (r < 0.22) return "water";
    if (r < 0.42) return "plant";
    return "sand";
  }
  if (biome === "volcano") {
    if (r < 0.14) return "lava";
    if (r < 0.24) return "rock";
    if (r < 0.44) return "plant";
    return "ground";
  }
  if (biome === "sky") {
    if (r < 0.1) return "void";
    if (r < 0.32) return "plant";
    return "cloud";
  }
  if (biome === "cave") {
    if (r < 0.12) return "rock";
    if (r < 0.22) return "lava";
    if (r < 0.38) return "plant";
    return "ground";
  }
  if (biome === "hub") {
    if (r < 0.2) return "plant";
    return "grass";
  }
  if (biome === "ice") {
    if (r < 0.14) return "rock";
    if (r < 0.28) return "plant";
    return "cloud";
  }
  if (biome === "hurricane") {
    if (r < 0.12) return "void";
    if (r < 0.35) return "plant";
    return "cloud";
  }
  if (biome === "madgreen") {
    if (r < 0.18) return "tree";
    if (r < 0.45) return "plant";
    return "grass";
  }
  if (biome === "lavazone") {
    if (r < 0.2) return "lava";
    if (r < 0.32) return "rock";
    if (r < 0.48) return "plant";
    return "ground";
  }
  return "grass";
}

function getSignTile(biome, row, col) {
  const mid = Math.floor(MAP_SIZE * 0.55);
  const signs = state.currentWorld === 2 ? {
    ice: { row: Math.floor(MAP_SIZE * 0.05), col: MAP_CENTER, text: "❄️ ICE" },
    hurricane: { row: Math.floor(MAP_SIZE * 0.25), col: MAP_CENTER, text: "🌀 STORM" },
    madgreen: { row: mid, col: FOREST_COLS, text: "🧪 MAD GREEN" },
    lavazone: { row: Math.floor(MAP_SIZE * 0.85), col: MAP_CENTER, text: "🌋 LAVA" },
    hub: { row: mid, col: MAP_CENTER, text: "💎 RIFT" },
  } : {
    forest: { row: mid, col: FOREST_COLS, text: "🌲🌿 Grass" },
    ocean: { row: mid, col: OCEAN_START, text: "🌊💧 Water" },
    volcano: { row: Math.floor(MAP_SIZE * 0.85), col: MAP_CENTER, text: "🌋🔥 Fire" },
    sky: { row: Math.floor(MAP_SIZE * 0.25), col: MAP_CENTER, text: "☁️💨 Air" },
    cave: { row: Math.floor(MAP_SIZE * 0.05), col: MAP_CENTER, text: "🕳️ CAVE" },
  };
  const s = signs[biome];
  return s && s.row === row && s.col === col ? s.text : null;
}

function isNearPlayer(row, col) {
  syncPlayerFloatFromState();
  return Math.abs(row + 0.5 - state.playerFy) + Math.abs(col + 0.5 - state.playerFx) <= 1.2;
}

function isPlantSearched(row, col) {
  const key = tileKey(row, col);
  const searchedAt = state.searchedPlants[key];
  if (!searchedAt) return false;
  if (Date.now() - searchedAt > PLANT_REGROW_MS) {
    delete state.searchedPlants[key];
    return false;
  }
  return true;
}

function getMobAt(row, col) {
  return getMobAtTile(row, col);
}

function spawnMobs(count) {
  const mobs = [];
  let tries = 0;
  while (mobs.length < count && tries < 2000) {
    tries++;
    const row = Math.floor(Math.random() * MAP_SIZE);
    const col = Math.floor(Math.random() * MAP_SIZE);
    if (!isWalkable(row, col)) continue;
    if (Math.abs(row - state.playerY) + Math.abs(col - state.playerX) < Math.floor(MAP_SIZE / 4)) continue;
    if (getMobAt(row, col)) continue;
    if (state.mapGrid[row][col] === "plant") continue;

    const biome = getBiomeAt(row, col);
    const element = BIOME_INFO[biome].element;
    let pool = WILD_ANIMALS;
    if (element) {
      const matched = WILD_ANIMALS.filter((a) => a.element === element);
      if (matched.length > 0) pool = matched;
    }
    const animal = pool[Math.floor(Math.random() * pool.length)];
    const x = col + 0.5;
    const y = row + 0.5;
    mobs.push({
      id: Date.now() + Math.random(),
      row,
      col,
      x,
      y,
      vx: 0,
      vy: 0,
      animal: { ...animal, level: randomWildLevel(animal) },
    });
  }
  return mobs;
}

function carveWorldPaths() {
  if (state.currentWorld !== 1) return;
  const mid = Math.floor(MAP_SIZE * 0.55);

  // Sandy boardwalk from plains into the ocean (east)
  for (let col = OCEAN_START - 4; col < MAP_SIZE - 2; col++) {
    for (let dr = -1; dr <= 1; dr++) {
      const row = mid + dr;
      if (!isInBounds(row, col)) continue;
      if (getBiomeForPosition(row, col) === "ocean" || col >= OCEAN_START - 2) {
        state.mapGrid[row][col] = "sand";
      }
    }
  }

  // Path north–south through the ocean so you can explore the beach
  for (let row = SKY_ROWS + 2; row < VOLCANO_START - 2; row++) {
    state.mapGrid[row][OCEAN_START + 2] = "sand";
    state.mapGrid[row][OCEAN_START + 5] = "sand";
  }

  // Clear walkable tiles at zone signs and gyms
  if (typeof GYM_LEADERS !== "undefined") {
    GYM_LEADERS.forEach((g) => {
      if (isInBounds(g.row, g.col)) {
        const b = getBiomeForPosition(g.row, g.col);
        state.mapGrid[g.row][g.col] = b === "ocean" ? "sand" : "grass";
      }
    });
  }
  if (typeof BOSS_DRAGON !== "undefined" && !state.bossBeaten) {
    state.mapGrid[BOSS_DRAGON.row][BOSS_DRAGON.col] = "ground";
  }

  const signCols = [
    { row: mid, col: FOREST_COLS },
    { row: mid, col: OCEAN_START },
    { row: Math.floor(MAP_SIZE * 0.85), col: MAP_CENTER },
    { row: Math.floor(MAP_SIZE * 0.25), col: MAP_CENTER },
  ];
  signCols.forEach(({ row, col }) => {
    if (!isInBounds(row, col)) return;
    const b = getBiomeForPosition(row, col);
    if (b === "ocean") state.mapGrid[row][col] = "sand";
    else if (b === "forest") state.mapGrid[row][col] = "grass";
    else if (b === "sky") state.mapGrid[row][col] = "cloud";
    else if (b === "volcano") state.mapGrid[row][col] = "ground";
  });
}

function ensureMap() {
  const mapKey = `${state.currentWorld || 1}-${MAP_VERSION}`;
  if (state.mapGenerated && state.mapGrid && state.mapVersion === mapKey
      && state.mapGrid.length === MAP_SIZE) return;

  if (!state.worlds[state.currentWorld]?.mapGenerated) {
    const spawn = getWorldSpawn();
    state.playerX = spawn.x;
    state.playerY = spawn.y;
    state.playerFx = spawn.x + 0.5;
    state.playerFy = spawn.y + 0.5;
  }

  state.mapGrid = [];
  state.mapBiomes = [];
  state.searchedPlants = state.searchedPlants || {};

  for (let row = 0; row < MAP_SIZE; row++) {
    state.mapGrid[row] = [];
    state.mapBiomes[row] = [];
    for (let col = 0; col < MAP_SIZE; col++) {
      const biome = getBiomeForPosition(row, col);
      state.mapBiomes[row][col] = biome;

      const sign = getSignTile(biome, row, col);
      if (sign) {
        state.mapGrid[row][col] = generateCell(biome, row, col);
      } else if (row === state.playerY && col === state.playerX) {
        state.mapGrid[row][col] = "grass";
      } else {
        state.mapGrid[row][col] = generateCell(biome, row, col);
      }
    }
  }

  carveWorldPaths();

  if (state.currentWorld === 1) {
    if (typeof GYM_LEADERS !== "undefined") {
      GYM_LEADERS.forEach((g) => {
        state.mapGrid[g.row][g.col] = "gym";
      });
    }
    if (typeof BOSS_DRAGON !== "undefined" && !state.bossBeaten) {
      state.mapGrid[BOSS_DRAGON.row][BOSS_DRAGON.col] = "boss";
    }
    state.mobs = spawnMobs(MOB_COUNT);
    if (typeof spawnCaveMobs === "function") spawnCaveMobs();
  } else {
    state.mobs = spawnMobs(MOB_COUNT);
    if (typeof spawnWorld2ZoneMobs === "function") spawnWorld2ZoneMobs();
  }

  state.mapGenerated = true;
  state.mapVersion = mapKey;
  persistCurrentWorld();
  saveState();
}

function canExplore() {
  if (state.pets.length === 0) {
    showToast("You need a dragon first!");
    return false;
  }
  if (!getEquippedPet()) {
    showToast("Equip a dragon first! Go to Pets and tap Equip ⚔️");
    return false;
  }
  return true;
}

function movePlayer(dRow, dCol) {
  if (battle) return;
  ensureMap();
  syncPlayerFloatFromState();

  const newRow = state.playerY + dRow;
  const newCol = state.playerX + dCol;

  if (!isWalkable(newRow, newCol)) {
    playSound("tap");
    return;
  }

  const mob = getMobAtTile(newRow, newCol);
  if (mob) {
    startBattle(mob.animal, mob.id);
    return;
  }

  state.playerFy = newRow + 0.5;
  state.playerFx = newCol + 0.5;
  state.playerX = newCol;
  state.playerY = newRow;
  playSound("tap");
  saveState();
}

function syncPlayerFloatFromState() {
  if (state.playerFx == null) state.playerFx = state.playerX + 0.5;
  if (state.playerFy == null) state.playerFy = state.playerY + 0.5;
}

function getMobAtTile(row, col) {
  return state.mobs.find((m) => Math.floor(m.y) === row && Math.floor(m.x) === col);
}

function renderBiomeDisplay() {
  syncPlayerFloatFromState();
  const biome = getBiomeAt(Math.floor(state.playerFy), Math.floor(state.playerFx));
  const info = BIOME_INFO[biome];
  const el = document.getElementById("biome-display");
  const elementTag = info.element
    ? ` <span class="element-tag element-${info.element}">${elementLabel(info.element)}</span>`
    : "";
  if (el) el.innerHTML = `📍 You are in: <strong>${info.icon} ${info.name}</strong>${elementTag}`;
  const hotbarBiome = document.getElementById("hotbar-biome");
  if (hotbarBiome) hotbarBiome.textContent = `${info.icon} ${info.name}`;
}
function renderEquippedDisplay() {
  const el = document.getElementById("equipped-pet");
  const pet = getEquippedPet();
  const hotbarEquip = document.getElementById("hotbar-equip");
  if (pet) {
    const text = `${pet.shiny ? "✨" : pet.emoji} ${pet.name} (Lv ${formatLevel(pet.level)})`;
    if (el) el.textContent = text;
    if (hotbarEquip) hotbarEquip.textContent = `⚔️ ${text}`;
  } else {
    const empty = "No dragon equipped — go to Pets!";
    if (el) el.textContent = empty;
    if (hotbarEquip) hotbarEquip.textContent = "⚔️ No dragon equipped";
  }
}

function shakeBattleArena() {
  const arena = document.getElementById("battle-arena-shake");
  if (!arena) return;
  arena.classList.remove("shake");
  void arena.offsetWidth;
  arena.classList.add("shake");
  setTimeout(() => arena.classList.remove("shake"), 350);
}

function showEncounterBanner(text) {
  const banner = document.getElementById("encounter-banner");
  const txt = document.getElementById("encounter-text");
  if (!banner || !txt) return;
  txt.textContent = text;
  banner.classList.remove("hidden", "show");
  void banner.offsetWidth;
  banner.classList.add("show");
}

function startBattle(wildAnimal = null, mobId = null, opts = null) {
  if (!canExplore()) return;
  const pet = getBattlePet();
  if (!pet) return;

  const wild = { ...(wildAnimal || WILD_ANIMALS[Math.floor(Math.random() * WILD_ANIMALS.length)]) };
  if (!opts?.isGym && !opts?.isBoss && !wild.level) {
    wild.level = randomWildLevel(wild);
  }
  const wildHp = wildBattleHp(wild, opts, mobId);
  const petHp = getBattlePetHp(pet);

  battle = {
    pet,
    wild,
    mobId,
    petHp,
    petMaxHp: petHp,
    wildHp,
    wildMaxHp: wildHp,
    isGym: opts?.isGym || false,
    gymId: opts?.gymId || null,
    isBoss: opts?.isBoss || false,
    moveCooldown: 0,
    extraPower: opts?.power || 0,
  };

  const setSprites = () => {
    if (typeof setBattlePetSprite === "function") {
      setBattlePetSprite(document.getElementById("battle-pet-sprite"), pet.element, pet.stars || 1, pet.shiny);
      const wildEl = document.getElementById("battle-wild-sprite");
      if (wild.isBlob) setBattlePetSprite(wildEl, wild.element, 1, false, true);
      else setBattlePetSprite(wildEl, wild.element, wild.stars || 1, wild.shiny);
    } else {
      setDragonSprite(document.getElementById("battle-pet-sprite"), pet.element, pet.stars || 1, pet.shiny);
    }
  };

  document.getElementById("battle-pet-name").textContent = pet.name + (pet.shiny ? " ✨" : "");
  document.getElementById("battle-wild-name").textContent = wildBattleLabel(wild, opts);
  document.getElementById("battle-msg").textContent = "";
  document.getElementById("battle-turn-msg").textContent = "Choose your move!";
  document.getElementById("battle-swap-picker")?.classList.add("hidden");
  updateBattleBars();
  document.getElementById("attack-btn").disabled = true;
  document.getElementById("swap-btn")?.classList.toggle("hidden", getSwapCandidates().length === 0);
  if (typeof updateMoveButton === "function") updateMoveButton();

  const overlay = document.getElementById("battle-overlay");
  overlay.classList.remove("hidden");
  setSprites();
  if (typeof flashBattleScreen === "function") flashBattleScreen();

  const encounterText = opts?.isBoss
    ? `👹 ${wild.name} blocks your path!`
    : opts?.isGym
      ? `🏛️ Gym battle!`
      : `Wild ${wild.name} · Lv ${formatLevel(getWildBattleLevel(wild, opts))} appeared!`;
  showEncounterBanner(encounterText);
  playSound("attack");
  if (typeof startBattleSpriteLoop === "function") startBattleSpriteLoop();

  setTimeout(() => {
    if (!battle) return;
    document.getElementById("attack-btn").disabled = false;
    document.getElementById("battle-msg").textContent = `${wild.name} wants to fight!`;
  }, 700);
}

function getSwapCandidates() {
  if (!battle) return [];
  return state.pets.filter((p) => p.id !== battle.pet.id);
}

function showSwapPicker() {
  if (!battle) return;
  const picker = document.getElementById("battle-swap-picker");
  const candidates = getSwapCandidates();
  if (candidates.length === 0) {
    showToast("No other dragons to swap!");
    return;
  }
  picker.innerHTML = candidates.map((p) => `
    <button class="swap-pick-btn" data-id="${p.id}">
      ${p.shiny ? "✨" : p.emoji} ${p.name} · Lv ${formatLevel(p.level)} ${starsDisplay(p.stars)}
    </button>`).join("");
  picker.classList.remove("hidden");
  picker.querySelectorAll(".swap-pick-btn").forEach((btn) => {
    btn.addEventListener("click", () => swapBattlePet(Number(btn.dataset.id)));
  });
}

function swapBattlePet(petId) {
  if (!battle) return;
  const pet = state.pets.find((p) => p.id === petId);
  if (!pet || pet.id === battle.pet.id) return;

  battle.pet = pet;
  const petHp = getBattlePetHp(pet);
  battle.petHp = petHp;
  battle.petMaxHp = petHp;
  battle.moveCooldown = 0;

  if (typeof setBattlePetSprite === "function") {
    setBattlePetSprite(document.getElementById("battle-pet-sprite"), pet.element, pet.stars || 1, pet.shiny);
  } else {
    setDragonSprite(document.getElementById("battle-pet-sprite"), pet.element, pet.stars || 1, pet.shiny);
  }
  document.getElementById("battle-pet-name").textContent = pet.name + (pet.shiny ? " ✨" : "");
  document.getElementById("battle-swap-picker").classList.add("hidden");
  document.getElementById("battle-msg").textContent = `${pet.name} switched in with full HP! 💚`;
  updateBattleBars();
  if (typeof updateMoveButton === "function") updateMoveButton();
  playSound("tap");

  setTimeout(() => {
    if (battle) {
      if (typeof enemyCounterAttack === "function") enemyCounterAttack();
    }
  }, 550);
}

function spawnWinConfetti() {
  const box = document.getElementById("battle-confetti");
  if (!box) return;
  box.innerHTML = "";
  const colors = ["#ffeb3b", "#ef5350", "#42a5f5", "#66bb6a", "#ab47bc", "#ff9800"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.background = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 30;
    const dist = 80 + Math.random() * 120;
    p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--ty", `${Math.sin(angle) * dist - 60}px`);
    p.style.animationDelay = `${Math.random() * 0.2}s`;
    box.appendChild(p);
  }
}

function showDamage(text, isCrit, targetSide = "enemy") {
  if (typeof spawnFloatingDamage === "function") {
    spawnFloatingDamage(text, isCrit, targetSide);
  } else {
    const pop = document.getElementById("damage-popup");
    if (pop) {
      pop.textContent = text;
      pop.className = "damage-popup" + (isCrit ? " crit" : "");
      pop.classList.remove("hidden");
      setTimeout(() => pop.classList.add("hidden"), 600);
    }
  }
  if (typeof spawnBattleImpact === "function") {
    spawnBattleImpact(targetSide);
  }
  if (typeof flashHpBar === "function") {
    flashHpBar(targetSide === "enemy" ? "battle-wild-hp" : "battle-pet-hp");
  }
  shakeBattleArena();
}

function updateBattleBars() {
  if (!battle) return;
  const petPct = battle.petMaxHp === Infinity ? 100 : (battle.petHp / battle.petMaxHp) * 100;
  const wildPct = (battle.wildHp / battle.wildMaxHp) * 100;
  document.getElementById("battle-pet-hp").style.width = `${petPct}%`;
  document.getElementById("battle-wild-hp").style.width = `${wildPct}%`;
  document.getElementById("battle-pet-hp-text").textContent =
    battle.petMaxHp === Infinity ? "Infinity / Infinity" : `${Math.max(0, battle.petHp)} / ${battle.petMaxHp}`;
  document.getElementById("battle-wild-hp-text").textContent =
    `${Math.max(0, battle.wildHp)} / ${battle.wildMaxHp}`;
}

function doAttack() {
  if (!battle) return;
  playSound("attack");

  const petSprite = document.getElementById("battle-pet-sprite");
  const wildSprite = document.getElementById("battle-wild-sprite");
  petSprite.classList.add("lunge");
  setTimeout(() => petSprite.classList.remove("lunge"), 300);

  let dmg;
  let isCrit = false;
  if (isOwnerGoodie(battle.pet)) {
    dmg = battle.wildHp;
    isCrit = true;
    document.getElementById("battle-msg").textContent = "INFINITY DAMAGE!";
  } else {
    dmg = 8 + petPower(battle.pet) + Math.floor(Math.random() * 10);
    if (hasAdvantage(battle.pet.element, battle.wild.element)) {
      dmg = Math.floor(dmg * 1.5);
      isCrit = true;
      document.getElementById("battle-msg").textContent = "Super effective hit!";
    } else if (hasAdvantage(battle.wild.element, battle.pet.element)) {
      dmg = Math.floor(dmg * 0.7);
      document.getElementById("battle-msg").textContent = "Not very effective...";
    } else {
      document.getElementById("battle-msg").textContent = `${battle.pet.name} attacked!`;
    }
  }

  battle.wildHp -= dmg;
  showDamage(isOwnerGoodie(battle.pet) ? "-Infinity" : `-${dmg}`, isCrit);
  wildSprite.classList.add("hit");
  setTimeout(() => wildSprite.classList.remove("hit"), 300);
  updateBattleBars();

  if (battle.wildHp <= 0) {
    endBattle(true);
    return;
  }

  setTimeout(() => {
    if (!battle) return;
    if (typeof enemyCounterAttack === "function") enemyCounterAttack();
  }, 550);
}

function searchPlant(row, col) {
  if (state.mapGrid[row][col] !== "plant") return;
  if (isPlantSearched(row, col)) return;
  if (!isNearPlayer(row, col)) {
    showToast("Walk closer to the plant first!");
    playSound("tap");
    return;
  }
  if (!canExplore()) return;

  playSound("tap");
  state.searchedPlants[tileKey(row, col)] = Date.now();

  if (Math.random() < WILD_SPAWN_CHANCE) {
    startBattle();
  } else {
    const biome = getBiomeAt(row, col);
    showToast(`Nothing here in the ${BIOME_INFO[biome].name}... keep exploring!`);
  }

  saveState();
}

function getBattlePet() {
  return getEquippedPet() || state.pets[0] || null;
}

function endBattle(won) {
  document.getElementById("attack-btn").disabled = true;
  ensureFeatureState();

  if (won) {
    addPlayerXP(15);
    playSound("win");
    if (battle.isGym) {
      onGymWin(battle.gymId);
      document.getElementById("battle-msg").textContent = "Gym Leader defeated! 🏅";
      spawnWinConfetti();
    } else if (battle.isBoss) {
      onBossWin();
      document.getElementById("battle-msg").textContent = "BOSS DEFEATED! 👑";
      spawnWinConfetti();
    } else {
      state.wins++;
      state.foodInventory = (state.foodInventory || 0) + 1;
      state.questStats.wins = (state.questStats.wins || 0) + 1;
      checkQuestsComplete();
      document.getElementById("battle-msg").textContent = "YOU WIN! +1 🏆 +1 🍖 food!";
      showToast("Victory! +1 win +1 food! 🎉");
      spawnWinConfetti();
      if (battle.mobId) {
        state.mobs = state.mobs.filter((m) => m.id !== battle.mobId);
        if (state.mobs.length < MOB_COUNT) {
          state.mobs.push(...spawnMobs(1));
        }
      }
    }
  } else {
    playSound("lose");
    document.getElementById("battle-msg").textContent = "You lost! The animal fled away!";
    showToast("The wild animal fled... no win this time.");
  }

  saveState();
  renderHeader();

  setTimeout(() => {
    document.getElementById("battle-overlay").classList.add("hidden");
    document.getElementById("battle-confetti")?.replaceChildren();
    document.getElementById("battle-swap-picker")?.classList.add("hidden");
    if (typeof stopBattleSpriteLoop === "function") stopBattleSpriteLoop();
    battle = null;
  }, 1500);
}

function fleeBattle() {
  document.getElementById("battle-overlay").classList.add("hidden");
  document.getElementById("battle-confetti")?.replaceChildren();
  document.getElementById("battle-swap-picker")?.classList.add("hidden");
  battle = null;
  showToast("You ran away safely.");
}

function renderEggShopHTML() {
  return EGG_TIERS.map((tier) => {
    const canAfford = state.wins >= tier.wins;
    return `
    <div class="egg-item${canAfford ? "" : " cant-afford"}">
      <span class="icon">${tier.icon}</span>
      <div class="details">
        <div class="title">${tier.name} Egg</div>
        <div class="desc">${starsDisplay(1)} · Power +${tier.powerBonus}${tier.id === "divine" ? " · STRONGEST!" : ""}</div>
      </div>
      <button class="buy-btn" data-tier="${tier.id}">
        BUY 🏆${tier.wins}
      </button>
    </div>`;
  }).join("");
}

function bindEggShopButtons(container) {
  container.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => buyEgg(btn.dataset.tier));
  });
}

function renderEggs() {
  const winsEl = document.getElementById("wins-display");
  if (winsEl) winsEl.textContent = `You have 🏆 ${state.wins} wins`;

  const shopHTML = renderEggShopHTML();
  const shop = document.getElementById("egg-shop");
  shop.innerHTML = shopHTML;
  bindEggShopButtons(shop);

  const mini = document.getElementById("egg-shop-mini");
  if (mini) {
    mini.innerHTML = shopHTML;
    bindEggShopButtons(mini);
  }

  const inv = document.getElementById("egg-inventory");
  const entries = EGG_TIERS.flatMap((tier) => {
    const count = state.eggInventory[tier.id] || 0;
    return count > 0 ? [{ tier, count }] : [];
  });

  if (entries.length === 0) {
    inv.innerHTML = '<p class="empty-msg">No eggs yet — buy one above! Win battles for 🏆 wins.</p>';
    return;
  }

  inv.innerHTML = entries.map(({ tier, count }) =>
    `<button class="egg-chip" data-tier="${tier.id}">${tier.icon} ${tier.name} x${count} — TAP TO HATCH</button>`
  ).join("");

  inv.querySelectorAll(".egg-chip").forEach((chip) => {
    chip.addEventListener("click", () => hatchEgg(chip.dataset.tier));
  });
}

function buyEgg(tierId) {
  const tier = EGG_TIERS.find((t) => t.id === tierId);
  if (!tier) return;
  if (state.wins < tier.wins) {
    showToast(`Need ${tier.wins} wins! Go to Plains, fight mobs, and win battles!`);
    playSound("tap");
    return;
  }

  state.wins -= tier.wins;
  state.eggInventory[tierId] = (state.eggInventory[tierId] || 0) + 1;
  playSound("win");
  showToast(`You bought a ${tier.name} egg! Tap it below to hatch!`);
  saveState();
  renderAll();
}

function spawnHatchConfetti() {
  const box = document.getElementById("hatch-confetti");
  box.innerHTML = "";
  const colors = ["#ffeb3b", "#ef5350", "#42a5f5", "#66bb6a", "#ab47bc", "#ff9800"];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.background = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 24;
    const dist = 60 + Math.random() * 100;
    p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--ty", `${Math.sin(angle) * dist - 40}px`);
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    box.appendChild(p);
  }
}

function resetHatchScene() {
  const egg = document.getElementById("hatch-egg");
  const pet = document.getElementById("hatch-pet");
  const cracks = document.getElementById("hatch-cracks");
  const flash = document.getElementById("hatch-flash");
  const glow = document.getElementById("hatch-glow");
  egg.className = "hatch-egg";
  pet.className = "hatch-pet hidden";
  cracks.classList.add("hidden");
  flash.className = "hatch-flash hidden";
  glow.classList.remove("active");
  document.getElementById("hatch-confetti").innerHTML = "";
}

function playHatchAnimation(tier, element, isShiny, onDone) {
  const overlay = document.getElementById("hatch-overlay");
  const egg = document.getElementById("hatch-egg");
  const pet = document.getElementById("hatch-pet");
  const cracks = document.getElementById("hatch-cracks");
  const flash = document.getElementById("hatch-flash");
  const glow = document.getElementById("hatch-glow");
  const status = document.getElementById("hatch-status");
  const tierLabel = document.getElementById("hatch-tier-label");

  resetHatchScene();
  egg.classList.add(`tier-${tier.id}`);
  egg.querySelector(".hatch-egg-body").textContent = tier.icon;
  pet.textContent = isShiny ? "✨" : DRAGON_EMOJI[element];
  if (isShiny) {
    egg.classList.add("tier-divine");
    status.textContent = "Something sparkly is inside... ✨";
  } else {
    status.textContent = "The egg is wiggling...";
  }
  tierLabel.textContent = `${tier.name} Egg`;
  if (!isShiny) status.textContent = "An egg appeared!";
  overlay.classList.remove("hidden");

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  (async () => {
    egg.classList.add("drop-in");
    playSound("tap");
    await wait(700);

    status.textContent = "...";
    egg.classList.remove("drop-in");
    egg.classList.add("wiggle-1");
    playSound("tap");
    await wait(900);

    status.textContent = "It's moving more!";
    egg.classList.remove("wiggle-1");
    egg.classList.add("wiggle-2");
    glow.classList.add("active");
    playSound("tap");
    await wait(900);

    status.textContent = "Something's coming!";
    egg.classList.remove("wiggle-2");
    egg.classList.add("wiggle-3");
    cracks.classList.remove("hidden");
    playSound("tap");
    await wait(900);

    status.textContent = "It's hatching!";
    egg.classList.remove("wiggle-3");
    egg.classList.add("breaking");
    flash.classList.remove("hidden");
    flash.classList.add("boom");
    playSound("attack");
    await wait(400);

    egg.style.display = "none";
    pet.classList.remove("hidden");
    pet.classList.add("pop-out");
    spawnHatchConfetti();
    playSound("hatch");
    status.textContent = isShiny ? "✨ A SHINY dragon hatched!" : "🎉 It hatched!";
    tierLabel.textContent = isShiny
      ? `✨ SHINY ${elementLabel(element)} Dragon!`
      : `${elementLabel(element)} Dragon!`;
    await wait(1400);

    overlay.classList.add("hidden");
    egg.style.display = "";
    resetHatchScene();
    onDone();
  })();
}

function hatchEgg(tierId) {
  if (hatching) return;
  if (!state.eggInventory[tierId] || state.eggInventory[tierId] <= 0) return;

  const tier = EGG_TIERS.find((t) => t.id === tierId);
  const element = getActiveElements()[Math.floor(Math.random() * getActiveElements().length)];
  const isShiny = Math.random() < SHINY_CHANCE;

  hatching = true;
  state.eggInventory[tierId]--;
  saveState();
  renderEggs();

  playHatchAnimation(tier, element, isShiny, () => {
    hatching = false;
    askName(
      isShiny
        ? `Name your ✨ SHINY ${tier.name} ${elementLabel(element)} dragon!`
        : `Name your new ${tier.name} ${elementLabel(element)} dragon!`,
      isShiny ? "✨" : DRAGON_EMOJI[element],
      (name) => {
      const dragon = makeDragon(element, tierId, name, isShiny);
      state.pets.push(dragon);
      addPlayerXP(20);
      ensureFeatureState();
      state.questStats.hatch = (state.questStats.hatch || 0) + 1;
      checkQuestsComplete();
      playSound("hatch");

      const result = document.getElementById("hatch-result");
      result.classList.remove("hidden");
      result.innerHTML = `
        <p>${isShiny ? "✨ SHINY hatch!" : "🎉 It hatched!"}</p>
        <div class="new-pet">${dragon.emoji}</div>
        <p><strong>${dragon.name}</strong> joined you!${isShiny ? " ✨ Shiny!" : ""}</p>
        <p>${starsDisplay(dragon.stars)} · Lv ${formatLevel(dragon.level)} · Power +${dragon.powerBonus}</p>
      `;

      saveState();
      renderAll();
      if (typeof startMusic === "function") startMusic();
      setTimeout(() => result.classList.add("hidden"), 5000);
    });
  });
}

function renderPets() {
  const list = document.getElementById("pet-list");
  const detail = document.getElementById("pet-detail");

  if (selectedPetId) {
    list.classList.add("hidden");
    detail.classList.remove("hidden");
    renderPetDetail(selectedPetId);
    return;
  }

  list.classList.remove("hidden");
  detail.classList.add("hidden");

  if (state.pets.length === 0) {
    list.innerHTML = '<p class="empty-msg">No dragons yet!</p>';
    return;
  }

  list.innerHTML = state.pets.map((p) => {
    const tier = EGG_TIERS.find((t) => t.id === p.eggTier);
    const isEquipped = state.battlePetId === p.id;
    return `
      <div class="pet-card${isEquipped ? " equipped" : ""}" data-id="${p.id}">
        <span class="emoji">${p.emoji}</span>
        <div class="info">
          <div class="name">${p.name}${p.shiny ? '<span class="shiny-badge">✨ SHINY</span>' : ""}${isEquipped ? '<span class="equipped-badge">⚔️ EQUIPPED</span>' : ""}</div>
          <div class="meta">
            Lv ${formatLevel(p.level)}
            · <span class="element-tag element-${p.element}">${elementLabel(p.element)}</span>
            · <span class="stars">${starsDisplay(p.stars)}</span>
            ${tier ? ` · ${tier.name}` : ""}
          </div>
        </div>
        <button class="equip-mini${isEquipped ? " equipped-already" : ""}" data-equip-id="${p.id}">
          ${isEquipped ? "✓ Equipped" : "⚔️ Equip"}
        </button>
      </div>`;
  }).join("");

  list.querySelectorAll(".pet-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedPetId = Number(card.dataset.id);
      renderPets();
    });
  });

  list.querySelectorAll(".equip-mini").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!btn.classList.contains("equipped-already")) {
        equipPet(Number(btn.dataset.equipId));
      }
    });
  });
}

function renderPetDetail(id) {
  const pet = state.pets.find((p) => p.id === id);
  if (!pet) { selectedPetId = null; renderPets(); return; }

  const maxLv = getPetMaxLevel();
  const atMax = isMaxLevel(pet.level);
  const atMaxStars = pet.stars >= 5;
  const xpNeed = isMaxLevel(pet.level) ? 0 : xpNeeded(pet.level);
  const xpPct = atMax ? 100 : Math.min(100, (pet.xp / xpNeed) * 100);
  const tier = EGG_TIERS.find((t) => t.id === pet.eggTier);
  const isEquipped = state.battlePetId === pet.id;

  document.getElementById("pet-detail-content").innerHTML = `
    <div id="pet-dragon-canvas" class="pet-big"></div>
    <div class="pet-name">${pet.name}${pet.shiny ? " ✨" : ""}</div>
    <div class="pet-stats">
      ${pet.species}${tier ? ` · ${tier.name}` : " · Starter"}<br>
      <span class="element-tag element-${pet.element}">${elementLabel(pet.element)}</span><br>
      Level ${formatLevel(pet.level)} / ${formatLevel(maxLv)}<br>
      Power: ${formatLevel(petPower(pet))}<br>
      <span class="stars">${starsDisplay(pet.stars)}</span>
    </div>
    <button class="action-btn equip${isEquipped ? " equipped-already" : ""}" id="equip-pet" ${isEquipped ? "disabled" : ""}>
      ${isEquipped ? "✓ Equipped for battle!" : "⚔️ Equip for battle!"}
    </button>
    <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
    <p>${atMax ? "Max level reached! 🏆" : `${formatLevel(pet.xp)} / ${formatLevel(xpNeed)} XP`}</p>
    <button class="action-btn feed" id="feed-food" ${atMax ? "disabled" : ""}>
      🍖 Feed Food ${state.foodInventory > 0 ? `(${state.foodInventory})` : "(win battles!)"}
    </button>
    <button class="action-btn feed" id="feed-pet" ${atMax ? "disabled" : ""}>
      🍪 Feed Snack ${state.snackInventory > 0 ? `(${state.snackInventory})` : "(buy in shop)"}
    </button>
    <button class="action-btn star" id="star-pet" ${atMaxStars ? "disabled" : ""}>
      ✨ Star Upgrade ${state.starDustInventory > 0 ? `(${state.starDustInventory})` : "(buy in shop)"}
    </button>
    <button class="action-btn rename" id="rename-pet">✏️ Rename</button>
  `;

  setDragonSprite(document.getElementById("pet-dragon-canvas"), pet.element, pet.stars || 1, pet.shiny);
  document.getElementById("equip-pet").addEventListener("click", () => equipPet(pet.id));
  document.getElementById("feed-food").addEventListener("click", () => feedWithFood(pet.id));
  document.getElementById("feed-pet").addEventListener("click", () => feedPet(pet.id));
  document.getElementById("star-pet").addEventListener("click", () => upgradeStar(pet.id));
  document.getElementById("rename-pet").addEventListener("click", () => {
    askName("New name for your dragon?", pet.emoji, (name) => {
      pet.name = name;
      saveState();
      renderAll();
    });
  });
}

function feedPet(id) {
  const pet = state.pets.find((p) => p.id === id);
  if (!pet || state.snackInventory <= 0) {
    showToast("Buy a snack in the shop first!");
    return;
  }
  if (isMaxLevel(pet.level)) {
    showToast(`${pet.name} is already max level!`);
    return;
  }

  state.snackInventory--;
  const gained = applyPetXP(pet, 50);
  if (gained > 0) {
    showToast(`${pet.name} reached level ${formatLevel(pet.level)}!`);
    playSound("level");
    addPlayerXP(10);
  }

  saveState();
  renderAll();
}

function upgradeStar(id) {
  const pet = state.pets.find((p) => p.id === id);
  if (!pet || state.starDustInventory <= 0) {
    showToast("Buy Star Dust in the shop first!");
    return;
  }
  if (pet.stars >= 5) return;

  state.starDustInventory--;
  pet.stars++;
  showToast(`${pet.name} is now ${pet.stars} stars!${pet.stars === 3 || pet.stars === 5 ? " Your dragon grew bigger!" : ""}`);
  playSound("level");
  addPlayerXP(25);
  saveState();
  renderAll();
}

function formatWaitTime(ms) {
  if (ms <= 0) return "now!";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.ceil((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

function ensureWheelPeriod() {
  const now = Date.now();
  if (!state.wheelPeriodEnd || now >= state.wheelPeriodEnd) {
    state.wheelPeriodEnd = now + WHEEL_PERIOD_MS;
    state.wheelSpinsUsed = 0;
  }
}

function getWheelSpinsLeft() {
  ensureWheelPeriod();
  return Math.max(0, WHEEL_SPINS_MAX - (state.wheelSpinsUsed || 0));
}

function renderWheel() {
  ensureWheelPeriod();
  const left = getWheelSpinsLeft();
  const spinsEl = document.getElementById("wheel-spins-left");
  const btn = document.getElementById("spin-btn");
  if (left > 0) {
    spinsEl.textContent = `Spins left: ${left} / ${WHEEL_SPINS_MAX}`;
    btn.disabled = false;
  } else {
    spinsEl.textContent = `New spins in: ${formatWaitTime(state.wheelPeriodEnd - Date.now())}`;
    btn.disabled = true;
  }
}

function renderShop() {
  document.getElementById("shop-list").innerHTML = SHOP_ITEMS.map((item) => `
    <div class="shop-item">
      <span class="icon">${item.icon}</span>
      <div class="details">
        <div class="title">${item.title}</div>
        <div class="desc">${item.desc}</div>
      </div>
      <button data-id="${item.id}" ${state.coins < item.cost ? "disabled" : ""}>
        🪙 ${item.cost}
      </button>
    </div>
  `).join("");

  document.getElementById("shop-list").querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => buyShopItem(btn.dataset.id));
  });

  renderWheel();
}

function buyShopItem(id) {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (!item || state.coins < item.cost) return;

  state.coins -= item.cost;
  if (id === "snack") state.snackInventory++;
  if (id === "star-dust") state.starDustInventory++;

  playSound("tap");
  showToast("Bought!");
  saveState();
  renderAll();
}

function spinWheel() {
  ensureWheelPeriod();
  const left = getWheelSpinsLeft();
  if (left <= 0) {
    showToast(`No spins left! New spins in ${formatWaitTime(state.wheelPeriodEnd - Date.now())}`);
    renderWheel();
    return;
  }

  state.wheelSpinsUsed = (state.wheelSpinsUsed || 0) + 1;
  ensureFeatureState();
  state.questStats.spin = (state.questStats.spin || 0) + 1;
  checkQuestsComplete();
  playSound("spin");
  const lucky = Math.random() < 1 / 15;
  const prize = lucky ? 15 : 1;
  state.coins += prize;

  const result = document.getElementById("wheel-result");
  result.textContent = lucky ? "🎉 15 COINS!" : "🪙 1 coin";
  if (lucky) playSound("win");

  saveState();
  renderHeader();
  renderWheel();
}

function claimDaily() {
  state.coins += DAILY_COINS;
  state.lastDailyClaim = todayString();
  playSound("win");
  showToast(`You got ${DAILY_COINS} coins!`);
  saveState();
  renderAll();
}

function renderAll() {
  if (typeof ensureFeatureState === "function") ensureFeatureState();
  renderHeader();
  renderDailyBanner();
  renderForest();
  renderEggs();
  renderPets();
  renderShop();
  if (typeof renderQuests === "function") renderQuests();
}

function openSettings() {
  document.getElementById("settings-overlay")?.classList.remove("hidden");
  playSound("tap");
}

function closeSettings() {
  document.getElementById("settings-overlay")?.classList.add("hidden");
}

function leaveGame() {
  saveState();
  window.location.href = "../../index.html";
}

// Events
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (document.body.classList.contains("world-play-mode") && tab.dataset.tab !== "forest") {
      openGameMenu(tab.dataset.tab);
      return;
    }
    closeGameMenu(false);
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    setWorldPlayMode(tab.dataset.tab === "forest");
    if (tab.dataset.tab === "pets") {
      selectedPetId = null;
      renderPets();
    }
    if (tab.dataset.tab === "forest") {
      renderForest();
    }
  });
});

document.getElementById("world-switch-btn")?.addEventListener("click", () => {
  switchWorld(state.currentWorld === 2 ? 1 : 2);
});
document.getElementById("enter-world-two")?.addEventListener("click", () => {
  document.getElementById("world-two-overlay")?.classList.add("hidden");
  switchWorld(2);
});
document.getElementById("stay-world-one")?.addEventListener("click", () => {
  document.getElementById("world-two-overlay")?.classList.add("hidden");
});

document.getElementById("swap-btn")?.addEventListener("click", showSwapPicker);
document.getElementById("attack-btn").addEventListener("click", doAttack);
document.getElementById("special-btn")?.addEventListener("click", () => {
  if (typeof doSpecialMove === "function") doSpecialMove();
});
document.getElementById("gym-btn")?.addEventListener("click", () => {
  if (nearGym) startGymBattle(nearGym);
});
document.getElementById("boss-btn")?.addEventListener("click", () => {
  if (nearBoss) startBossBattle();
});
document.getElementById("flee-btn").addEventListener("click", fleeBattle);
document.getElementById("spin-btn").addEventListener("click", spinWheel);
document.getElementById("claim-daily").addEventListener("click", claimDaily);
document.getElementById("close-pet").addEventListener("click", () => {
  selectedPetId = null;
  renderPets();
});

document.getElementById("name-confirm").addEventListener("click", () => {
  const name = document.getElementById("name-input").value.trim();
  if (!name) {
    showToast("Type a name first!");
    return;
  }
  const cb = nameCallback;
  closeNameOverlay();
  if (cb) cb(name);
});

document.getElementById("name-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("name-confirm").click();
});

document.getElementById("starter-begin").addEventListener("click", startStarterFlow);
document.getElementById("settings-btn")?.addEventListener("click", openSettings);
document.getElementById("close-settings-btn")?.addEventListener("click", closeSettings);
document.getElementById("leave-game-btn")?.addEventListener("click", leaveGame);
document.getElementById("settings-overlay")?.addEventListener("click", (e) => {
  if (e.target.id === "settings-overlay") closeSettings();
});

// Boot
if (state.startersDone) {
  document.getElementById("starter-overlay").classList.add("hidden");
  if (!state.battlePetId && state.pets.length > 0) {
    state.battlePetId = state.pets[0].id;
  }
} else {
  document.getElementById("starter-overlay").classList.remove("hidden");
}

setupHotbar();
setWorldPlayMode(true);

// Boot runs after features.js and world.js load (see bottom of world.js)
