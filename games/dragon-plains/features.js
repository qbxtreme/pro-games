// Gym leaders, quests, food, special moves, cave

const SPECIAL_MOVES = {
  fire: { name: "Inferno Strike", mult: 1.85 },
  water: { name: "Aqua Jet", mult: 1.85 },
  earth: { name: "Nature Fury", mult: 1.85 },
  air: { name: "Hurricane", mult: 1.85 },
  ice: { name: "Blizzard Blast", mult: 1.9 },
  lava: { name: "Magma Eruption", mult: 1.9 },
  hurricane: { name: "Cyclone Fury", mult: 1.9 },
  madgreen: { name: "Toxic Wave", mult: 1.9 },
};

const GYM_LEADERS = [
  {
    id: "fire", name: "Blaze", title: "Fire Gym", building: "🔥 Fire Temple",
    row: Math.floor(MAP_SIZE * 0.85), col: Math.floor(MAP_SIZE / 2), element: "fire",
    legendary: { name: "Inferno King", element: "fire", level: 6, powerBonus: 28, eggTier: "legendary" },
  },
  {
    id: "water", name: "Marina", title: "Water Gym", building: "🌊 Lighthouse",
    row: Math.floor(MAP_SIZE * 0.55), col: Math.floor(MAP_SIZE * 0.65), element: "water",
    legendary: { name: "Tsunami Queen", element: "water", level: 6, powerBonus: 28, eggTier: "legendary" },
  },
  {
    id: "earth", name: "Oak", title: "Grass Gym", building: "🌲 Treehouse Gym",
    row: Math.floor(MAP_SIZE * 0.55), col: Math.floor(MAP_SIZE * 0.1), element: "earth",
    legendary: { name: "Forest Lord", element: "earth", level: 6, powerBonus: 28, eggTier: "legendary" },
  },
  {
    id: "air", name: "Gale", title: "Air Gym", building: "☁️ Cloud Arena",
    row: Math.floor(MAP_SIZE * 0.25), col: Math.floor(MAP_SIZE / 2), element: "air",
    legendary: { name: "Storm Legend", element: "air", level: 6, powerBonus: 28, eggTier: "legendary" },
  },
];

const BOSS_DRAGON = {
  name: "Shadow Dragon", element: "fire", level: 15, powerBonus: 40,
  row: Math.floor(MAP_SIZE * 0.1), col: Math.floor(MAP_SIZE / 2), hp: 120,
};

const QUEST_POOL = [
  { id: "win3", text: "Win 3 battles", type: "wins", goal: 3, reward: { coins: 10, wins: 1 } },
  { id: "win5", text: "Win 5 battles", type: "wins", goal: 5, reward: { coins: 15, wins: 2, food: 2 } },
  { id: "hatch1", text: "Hatch 1 egg", type: "hatch", goal: 1, reward: { coins: 12, food: 1 } },
  { id: "feed3", text: "Feed dragons 3 times", type: "feed", goal: 3, reward: { coins: 8, food: 3 } },
  { id: "explore", text: "Visit 3 different zones", type: "zones", goal: 3, reward: { wins: 2, coins: 10 } },
  { id: "spin2", text: "Spin the wheel 2 times", type: "spin", goal: 2, reward: { coins: 20 } },
  { id: "gym", text: "Beat a Gym Leader", type: "gym", goal: 1, reward: { wins: 5, coins: 25, food: 3 } },
];

function ensureFeatureState() {
  if (!state.trainerName) state.trainerName = "";
  if (!state.gymsBeaten) state.gymsBeaten = [];
  if (!state.bossBeaten) state.bossBeaten = false;
  if (!state.foodInventory) state.foodInventory = 0;
  if (!state.dailyQuestDate) state.dailyQuestDate = "";
  if (!state.dailyQuests) state.dailyQuests = [];
  if (!state.questProgress) state.questProgress = {};
  if (!state.zonesVisited) state.zonesVisited = [];
  if (!state.questStats) state.questStats = { wins: 0, hatch: 0, feed: 0, spin: 0, gym: 0 };
  if (!state.currentWorld) state.currentWorld = 1;
  if (state.worldTwoUnlocked == null) state.worldTwoUnlocked = false;
  if (!state.worlds) state.worlds = {};
}

function rollDailyQuests() {
  ensureFeatureState();
  if (state.dailyQuestDate === todayString() && state.dailyQuests.length === 5) return;
  state.dailyQuestDate = todayString();
  state.questProgress = {};
  state.questStats = { wins: 0, hatch: 0, feed: 0, spin: 0, gym: 0 };
  state.zonesVisited = [];
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  state.dailyQuests = shuffled.slice(0, 5).map((q) => ({ ...q, done: false }));
  saveState();
}

function trackQuest(type, amount = 1) {
  ensureFeatureState();
  rollDailyQuests();
  if (state.questStats[type] != null) state.questStats[type] += amount;
  if (type === "wins") state.questStats.wins += amount - 1; // wins tracked separately
  checkQuestsComplete();
}

function trackZoneVisit(biome) {
  ensureFeatureState();
  rollDailyQuests();
  if (!state.zonesVisited.includes(biome)) {
    state.zonesVisited.push(biome);
    state.questStats.zones = state.zonesVisited.length;
    checkQuestsComplete();
  }
}

function checkQuestsComplete() {
  state.dailyQuests.forEach((q) => {
    if (q.done) return;
    let prog = 0;
    if (q.type === "wins") prog = state.questStats.wins || 0;
    else if (q.type === "hatch") prog = state.questStats.hatch || 0;
    else if (q.type === "feed") prog = state.questStats.feed || 0;
    else if (q.type === "zones") prog = state.zonesVisited.length;
    else if (q.type === "spin") prog = state.questStats.spin || 0;
    else if (q.type === "gym") prog = state.questStats.gym || 0;

    if (prog >= q.goal) {
      q.done = true;
      const r = q.reward;
      if (r.coins) state.coins += r.coins;
      if (r.wins) state.wins += r.wins;
      if (r.food) state.foodInventory += r.food;
      showToast(`Quest done: ${q.text}! 🎁`);
      playSound("win");
    }
  });
  saveState();
  renderQuests();
}

function getGymAt(row, col) {
  return GYM_LEADERS.find((g) => g.row === row && g.col === col);
}

function isBossTile(row, col) {
  return row === BOSS_DRAGON.row && col === BOSS_DRAGON.col && !state.bossBeaten;
}

function makeLegendaryPet(data, customName) {
  return {
    id: Date.now() + Math.random(),
    emoji: DRAGON_EMOJI[data.element],
    element: data.element,
    species: DRAGON_NAMES[data.element],
    name: customName || data.name,
    level: data.level,
    stars: 1,
    xp: 0,
    powerBonus: data.powerBonus,
    eggTier: data.eggTier || "legendary",
    isLegendary: true,
    shiny: false,
  };
}

function startGymBattle(gym) {
  if (state.gymsBeaten.includes(gym.id)) {
    showToast("You already beat this gym!");
    return;
  }
  const leg = gym.legendary;
  startBattle(
    { emoji: "👑", name: leg.name, element: leg.element },
    null,
    { isGym: true, gymId: gym.id, hp: 50 + leg.level * 12, power: leg.level + leg.powerBonus }
  );
}

function startBossBattle() {
  if (state.bossBeaten) return;
  startBattle(
    { emoji: "🐲", name: BOSS_DRAGON.name, element: BOSS_DRAGON.element },
    null,
    { isBoss: true, hp: BOSS_DRAGON.hp, power: BOSS_DRAGON.level + BOSS_DRAGON.powerBonus }
  );
}

function onGymWin(gymId) {
  const gym = GYM_LEADERS.find((g) => g.id === gymId);
  if (!gym || state.gymsBeaten.includes(gymId)) return;
  state.gymsBeaten.push(gymId);
  const pet = makeLegendaryPet(gym.legendary, gym.legendary.name);
  state.pets.push(pet);
  state.questStats.gym = (state.questStats.gym || 0) + 1;
  checkQuestsComplete();
  showToast(`You got ${pet.name}! 🏅`);
  addPlayerXP(50);
  if (typeof checkWorldTwoUnlock === "function") checkWorldTwoUnlock();
}

function onBossWin() {
  state.bossBeaten = true;
  state.wins += 50;
  state.coins += 30;
  state.foodInventory += 5;
  state.eggInventory.divine = (state.eggInventory.divine || 0) + 1;
  const pet = makeLegendaryPet(
    { name: "Shadow Fang", element: "fire", level: 10, powerBonus: 35, eggTier: "divine" },
    "Shadow Fang"
  );
  state.pets.push(pet);
  showToast("Boss beaten! +50 wins, Divine egg, Shadow Fang! 👑");
  addPlayerXP(100);
  if (typeof checkWorldTwoUnlock === "function") checkWorldTwoUnlock();
}

function feedWithFood(petId) {
  const pet = state.pets.find((p) => p.id === petId);
  if (!pet || state.foodInventory <= 0) {
    showToast("No food! Win battles to get food.");
    return;
  }
  if (isMaxLevel(pet.level)) {
    showToast(`${pet.name} is already max level!`);
    return;
  }
  state.foodInventory--;
  ensureFeatureState();
  state.questStats.feed = (state.questStats.feed || 0) + 1;
  checkQuestsComplete();

  const gained = applyPetXP(pet, 50);
  if (gained > 0) {
    showToast(`${pet.name} reached level ${formatLevel(pet.level)}!`);
    playSound("level");
    addPlayerXP(10);
  }
  saveState();
  renderAll();
}

function renderQuests() {
  const el = document.getElementById("quest-list");
  if (!el) return;
  rollDailyQuests();
  el.innerHTML = state.dailyQuests.map((q) => {
    let prog = 0;
    if (q.type === "wins") prog = state.questStats.wins || 0;
    else if (q.type === "hatch") prog = state.questStats.hatch || 0;
    else if (q.type === "feed") prog = state.questStats.feed || 0;
    else if (q.type === "zones") prog = state.zonesVisited.length;
    else if (q.type === "spin") prog = state.questStats.spin || 0;
    else if (q.type === "gym") prog = state.questStats.gym || 0;

    const rewardParts = [];
    const r = q.reward;
    if (r.coins) rewardParts.push(`🪙${r.coins}`);
    if (r.wins) rewardParts.push(`🏆${r.wins}`);
    if (r.food) rewardParts.push(`🍖${r.food}`);

    return `
      <div class="quest-card${q.done ? " done" : ""}">
        <div class="quest-text">${q.done ? "✅" : "📋"} ${q.text}</div>
        <div class="quest-meta">${Math.min(prog, q.goal)} / ${q.goal} · Reward: ${rewardParts.join(" ")}</div>
      </div>`;
  }).join("");
}

function doSpecialMove() {
  if (!battle || battle.moveCooldown > 0) return;
  const move = SPECIAL_MOVES[battle.pet.element];
  if (!move) return;
  playSound("attack");
  battle.moveCooldown = 3;

  const petSprite = document.getElementById("battle-pet-sprite");
  petSprite.classList.add("lunge");
  setTimeout(() => petSprite.classList.remove("lunge"), 300);

  let dmg;
  if (isOwnerGoodie(battle.pet)) {
    dmg = battle.wildHp;
  } else {
    dmg = Math.floor((8 + petPower(battle.pet) + Math.floor(Math.random() * 10)) * move.mult);
    let isCrit = hasAdvantage(battle.pet.element, battle.wild.element);
    if (isCrit) dmg = Math.floor(dmg * 1.4);
    if (hasAdvantage(battle.wild.element, battle.pet.element)) dmg = Math.floor(dmg * 0.75);
  }

  battle.wildHp -= dmg;
  showDamage(isOwnerGoodie(battle.pet) ? "-Infinity" : `-${dmg}`, true);
  document.getElementById("battle-wild-sprite").classList.add("hit");
  setTimeout(() => document.getElementById("battle-wild-sprite").classList.remove("hit"), 300);
  document.getElementById("battle-msg").textContent = `${move.name}!`;
  updateBattleBars();
  updateMoveButton();

  if (battle.wildHp <= 0) { endBattle(true); return; }
  setTimeout(enemyCounterAttack, 550);
}

function enemyCounterAttack() {
  if (!battle) return;
  if (isOwnerGoodie(battle.pet)) {
    document.getElementById("battle-wild-sprite").classList.add("lunge");
    setTimeout(() => document.getElementById("battle-wild-sprite").classList.remove("lunge"), 300);
    document.getElementById("battle-msg").textContent = `${battle.wild.name} can't hurt Goodie!`;
    if (battle.moveCooldown > 0) battle.moveCooldown--;
    updateMoveButton();
    return;
  }
  let counter;
  if (battle.isGym || battle.isBoss) {
    counter = 5 + Math.floor(Math.random() * 12) + (battle.extraPower || 0);
  } else {
    counter = 5 + Math.floor(Math.random() * 12) + getWildBattleLevel(battle.wild, battle);
  }
  if (battle.extraPower) counter += 5;
  if (hasAdvantage(battle.wild.element, battle.pet.element)) counter = Math.floor(counter * 1.3);
  battle.petHp -= counter;
  document.getElementById("battle-wild-sprite").classList.add("lunge");
  setTimeout(() => document.getElementById("battle-wild-sprite").classList.remove("lunge"), 300);
  showDamage(`-${counter}`, false, "ally");
  document.getElementById("battle-pet-sprite").classList.add("hit");
  setTimeout(() => document.getElementById("battle-pet-sprite").classList.remove("hit"), 300);
  document.getElementById("battle-msg").textContent = `${battle.wild.name} fought back!`;
  if (battle.moveCooldown > 0) battle.moveCooldown--;
  updateBattleBars();
  updateMoveButton();
  if (battle.petHp <= 0) endBattle(false);
}

function updateMoveButton() {
  const btn = document.getElementById("special-btn");
  if (!btn || !battle) return;
  const move = SPECIAL_MOVES[battle.pet.element];
  const icon = btn.querySelector(".ability-icon");
  const label = btn.querySelector(".ability-label");
  if (battle.moveCooldown > 0) {
    if (icon) icon.textContent = "⏳";
    if (label) label.textContent = `${battle.moveCooldown}`;
    btn.disabled = true;
  } else {
    if (icon) icon.textContent = "💥";
    if (label) label.textContent = move ? move.name.split(" ")[0].toUpperCase() : "SPECIAL";
    btn.disabled = false;
  }
}

function spawnWorld2ZoneMobs() {
  let added = 0;
  let tries = 0;
  const iceRows = typeof CAVE_ROWS !== "undefined" ? CAVE_ROWS : Math.floor(MAP_SIZE * 0.2);
  const target = Math.max(8, Math.floor(MAP_SIZE / 12));
  while (added < target && tries < 500) {
    tries++;
    const row = Math.floor(Math.random() * iceRows);
    const col = Math.floor(Math.random() * MAP_SIZE);
    if (!isWalkable(row, col)) continue;
    if (getMobAt(row, col)) continue;
    const animal = WILD_ANIMALS[Math.floor(Math.random() * WILD_ANIMALS.length)];
    state.mobs.push({
      id: Date.now() + Math.random(), row, col, x: col + 0.5, y: row + 0.5,
      vx: 0, vy: 0, animal: { ...animal, element: "ice", level: randomWildLevel(animal) }, caveMob: true,
    });
    added++;
  }
}

let musicStarted = false;

function spawnCaveMobs() {
  let added = 0;
  let tries = 0;
  const caveRows = typeof CAVE_ROWS !== "undefined" ? CAVE_ROWS : Math.floor(MAP_SIZE * 0.2);
  const target = Math.max(8, Math.floor(MAP_SIZE / 12));
  while (added < target && tries < 500) {
    tries++;
    const row = Math.floor(Math.random() * caveRows);
    const col = Math.floor(Math.random() * MAP_SIZE);
    if (!isWalkable(row, col)) continue;
    if (getMobAt(row, col)) continue;
    if (state.mapGrid[row][col] === "gym" || state.mapGrid[row][col] === "boss") continue;
    const animal = WILD_ANIMALS[Math.floor(Math.random() * WILD_ANIMALS.length)];
    state.mobs.push({
      id: Date.now() + Math.random(), row, col, x: col + 0.5, y: row + 0.5,
      vx: 0, vy: 0, animal: { ...animal, level: randomWildLevel(animal) }, caveMob: true,
    });
    added++;
  }
}

function startMusic() {
  if (musicStarted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    musicStarted = true;
    playMusicLoop();
  } catch (e) {}
}

function playMusicLoop() {
  if (!audioCtx) return;
  const notes = [262, 294, 330, 349, 392, 349, 330, 294];
  let i = 0;
  setInterval(() => {
    if (!document.getElementById("tab-forest")?.classList.contains("active")) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = notes[i % notes.length];
    osc.type = "triangle";
    gain.gain.value = 0.03;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.stop(audioCtx.currentTime + 0.4);
    i++;
  }, 500);
}
