(function () {
  "use strict";

  const SAVE_PREFIX = "dragon-racers-hub-";
  const LEVEL_KEY = SAVE_PREFIX + "level";
  const SCALES_KEY = SAVE_PREFIX + "scales";
  const FOOD_KEY = SAVE_PREFIX + "food";
  const LEGACY_BLING_KEY = SAVE_PREFIX + "bling";
  const LEGACY_ENERGY_KEY = SAVE_PREFIX + "energy";
  const PASS_XP_KEY = SAVE_PREFIX + "pass-xp";
  const MODE_KEY = SAVE_PREFIX + "mode";
  const CHAR_XP_KEY = SAVE_PREFIX + "char-xp";
  const CHAR_RANK_KEY = SAVE_PREFIX + "char-rank";

  const DRAGON_SHOP_COST = 100;
  const SKY_RACE_WIN_COINS = 50;

  const MAX_PLAYER_LEVEL = 100;
  const LEVEL_BASE_COST = 20;
  const LEVEL_COST_STEP = 10;
  const PASS_TIER_XP = 300;
  const CHAR_XP_PER_STAR = 80;

  const RARITY_LABELS = {
    common: "Common",
    rare: "Rare",
    superRare: "Super Rare",
  };

  const RANK_TIERS = ["Wood", "Bronze", "Silver", "Gold", "Diamond"];

  const DRAGON_ROSTER = [
    { id: "ember", name: "Ember", emoji: "🔥", rarity: "common", role: "Balanced speed" },
    { id: "storm", name: "Storm", emoji: "⚡", rarity: "common", role: "Fastest dragon" },
    { id: "frost", name: "Frost", emoji: "❄️", rarity: "common", role: "Smooth control" },
    { id: "mossy", name: "Mossy", emoji: "🌿", rarity: "common", role: "Forest glider" },
    { id: "blaze", name: "Blaze", emoji: "💥", rarity: "common", role: "Turbo burst" },
    { id: "coral", name: "Coral", emoji: "🪸", rarity: "common", role: "Reef rider" },
    { id: "slate", name: "Slate", emoji: "🪨", rarity: "common", role: "Rock steady" },
    { id: "sunny", name: "Sunny", emoji: "☀️", rarity: "common", role: "Sun streak" },
    { id: "dusk", name: "Dusk", emoji: "🌙", rarity: "common", role: "Night flyer" },
    { id: "pebble", name: "Pebble", emoji: "🐚", rarity: "common", role: "Desert dash" },
    { id: "tide", name: "Tide", emoji: "🌊", rarity: "common", role: "Ocean surge" },
    { id: "vine", name: "Vine", emoji: "🍃", rarity: "common", role: "Jungle zip" },
  ];

  const DR_GAME_MODES = [
    { id: "sky-race", name: "Sky Race", emoji: "🏁", cat: "Races", desc: "Race a CPU rival — win for 500 XP and 50 coins!" },
    { id: "gem-rush", name: "Gem Rush", emoji: "💎", cat: "Races", desc: "Extra gems spawn along the route." },
    { id: "storm-sprint", name: "Storm Sprint", emoji: "⛈️", cat: "Challenges", desc: "Higher speed from the start." },
  ];
  const DR_GAME_CATEGORIES = ["Races", "Challenges"];

  let selectedGameModeId = "sky-race";
  let menuHeroCtx = null;
  let menuHeroW = 0;
  let menuHeroH = 0;
  let callbacks = {};

  function getNum(key, fallback) {
    try {
      const n = parseInt(localStorage.getItem(key) || String(fallback), 10);
      return Number.isFinite(n) ? n : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setNum(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (_) {}
  }

  function migrateLegacyCurrency() {
    try {
      if (localStorage.getItem(SCALES_KEY) == null) {
        const legacy = localStorage.getItem(LEGACY_BLING_KEY);
        if (legacy != null) localStorage.setItem(SCALES_KEY, legacy);
      }
      if (localStorage.getItem(FOOD_KEY) == null) {
        const legacy = localStorage.getItem(LEGACY_ENERGY_KEY);
        if (legacy != null) localStorage.setItem(FOOD_KEY, legacy);
      }
    } catch (_) {}
  }

  function getScales() {
    return getNum(SCALES_KEY, 0);
  }

  function addScales(n) {
    setNum(SCALES_KEY, Math.max(0, getScales() + n));
  }

  function getFood() {
    return getNum(FOOD_KEY, 0);
  }

  function addFood(n) {
    setNum(FOOD_KEY, Math.max(0, getFood() + n));
  }

  function isDragonUnlocked(id) {
    const state = callbacks.getState?.() || {};
    return Array.isArray(state.unlockedDragons) && state.unlockedDragons.includes(id);
  }

  function hasPickedStarter() {
    const state = callbacks.getState?.() || {};
    return !!state.pickedStarter;
  }

  function showDragonLocked(id) {
    return hasPickedStarter() && !isDragonUnlocked(id);
  }

  function unlockDragon(id) {
    const state = callbacks.getState?.();
    if (!state) return;
    if (!Array.isArray(state.unlockedDragons)) state.unlockedDragons = [];
    if (!state.unlockedDragons.includes(id)) state.unlockedDragons.push(id);
    callbacks.saveState?.();
    updateDragonUnlockUI();
  }

  function ensureUnlockState() {
    const state = callbacks.getState?.();
    if (!state) return;
    if (!Array.isArray(state.unlockedDragons)) state.unlockedDragons = [];
    if (state.coins == null) state.coins = 0;
    if (state.pickedStarter == null) state.pickedStarter = false;
    if (state.dragon && state.unlockedDragons.length === 0 && !state.pickedStarter) {
      state.unlockedDragons.push(state.dragon);
      state.pickedStarter = true;
      callbacks.saveState?.();
    }
  }

  function addCoins(n) {
    const state = callbacks.getState?.();
    if (!state) return;
    state.coins = Math.max(0, (state.coins || 0) + n);
    callbacks.saveState?.();
  }

  function spendCoins(n) {
    const state = callbacks.getState?.();
    if (!state || (state.coins || 0) < n) return false;
    state.coins -= n;
    callbacks.saveState?.();
    return true;
  }

  function getCoins() {
    const state = callbacks.getState?.() || {};
    return state.coins || 0;
  }

  function getLevel() {
    return Math.min(MAX_PLAYER_LEVEL, Math.max(1, getNum(LEVEL_KEY, 1)));
  }

  function setLevel(level) {
    setNum(LEVEL_KEY, Math.min(MAX_PLAYER_LEVEL, Math.max(1, level)));
    updatePlayerLevelUI();
  }

  function levelUpCost(level) {
    if (level >= MAX_PLAYER_LEVEL) return null;
    return LEVEL_BASE_COST + (Math.max(1, level) - 1) * LEVEL_COST_STEP;
  }

  function getPassXp() {
    return getNum(PASS_XP_KEY, 0);
  }

  function getPassTier() {
    return Math.floor(getPassXp() / PASS_TIER_XP) + 1;
  }

  function getCharRank() {
    return Math.min(RANK_TIERS.length - 1, Math.max(0, getNum(CHAR_RANK_KEY, 0)));
  }

  function getCharXp() {
    return getNum(CHAR_XP_KEY, 0);
  }

  function setCharXp(xp) {
    setNum(CHAR_XP_KEY, Math.max(0, xp));
  }

  function getActiveGameMode() {
    return DR_GAME_MODES.find((m) => m.id === selectedGameModeId) || DR_GAME_MODES[0];
  }

  function loadGameModeId() {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved && DR_GAME_MODES.some((m) => m.id === saved)) return saved;
    } catch (_) {}
    return "sky-race";
  }

  function selectGameMode(id) {
    if (!DR_GAME_MODES.some((m) => m.id === id)) return;
    selectedGameModeId = id;
    try {
      localStorage.setItem(MODE_KEY, id);
    } catch (_) {}
    updateGameModeUI();
  }

  function syncCurrencyFromState(state) {
    if (!state) return;
    const scalesTarget = Math.floor((state.best || 0) / 10);
    setNum(SCALES_KEY, Math.max(getScales(), scalesTarget));
    const foodTarget = Math.floor((state.totalGems || 0) / 5);
    setNum(FOOD_KEY, Math.max(getFood(), foodTarget));
    const passXp = Math.floor(state.best || 0) + (state.totalGems || 0) * 2;
    setNum(PASS_XP_KEY, Math.max(getPassXp(), passXp % (PASS_TIER_XP * 50)));
  }

  function updateMenuCoins() {
    const state = callbacks.getState?.() || {};
    syncCurrencyFromState(state);
    const coinsEl = document.getElementById("menu-coins-count");
    const scalesEl = document.getElementById("menu-scales-count");
    const foodEl = document.getElementById("menu-food-count");
    if (coinsEl) coinsEl.textContent = String(getCoins());
    if (scalesEl) scalesEl.textContent = String(getScales());
    if (foodEl) foodEl.textContent = String(getFood());
    updatePlayerLevelUI();
    updatePassMenuHint();
    updateCharRankUI();
  }

  function updatePassMenuHint() {
    const tier = getPassTier();
    const xp = getPassXp() % PASS_TIER_XP;
    const hint = document.querySelector(".hub-pass-hint");
    if (hint) hint.textContent = `Tier ${tier} · ${xp} / ${PASS_TIER_XP}`;
    const label = document.getElementById("brawl-pass-progress-label");
    const fill = document.getElementById("brawl-pass-progress-fill");
    if (label) label.textContent = `Working on Tier ${tier} · ${xp} / ${PASS_TIER_XP} XP`;
    if (fill) fill.style.width = `${Math.min(100, (xp / PASS_TIER_XP) * 100)}%`;
  }

  function updateQuestMenuHint() {
    const hint = document.querySelector(".hub-quests-hint");
    if (hint) hint.textContent = "Fly 500 m";
  }

  function updateGameModeUI() {
    const mode = getActiveGameMode();
    const emojiEl = document.getElementById("selected-game-mode-emoji");
    const labelEl = document.getElementById("selected-game-mode-label");
    const descEl = document.getElementById("selected-game-mode-desc");
    if (emojiEl) emojiEl.textContent = mode.emoji;
    if (labelEl) labelEl.textContent = mode.name;
    if (descEl) descEl.textContent = mode.desc;
    const tagline = document.querySelector(".menu-tagline");
    if (tagline) tagline.textContent = `${mode.emoji} ${mode.name} · Gems · Rings · Canyon Dodge`;
  }

  function updateCharRankUI() {
    const rank = getCharRank();
    const xp = getCharXp();
    const label = document.getElementById("char-rank-label");
    const fill = document.getElementById("char-xp-fill");
    const xpLabel = document.getElementById("char-xp-label");
    const stars = "★".repeat(rank + 1) + "☆".repeat(Math.max(0, 4 - rank));
    if (label) {
      label.textContent = `${RANK_TIERS[rank]} ${stars}`;
      label.className = `char-rank-label rank-tier-${rank}`;
    }
    const need = CHAR_XP_PER_STAR;
    const pct = Math.min(100, (xp / need) * 100);
    if (fill) fill.style.width = `${pct}%`;
    if (xpLabel) xpLabel.textContent = `${xp} / ${need} XP to next ★`;
  }

  function updatePlayerLevelUI() {
    const level = getLevel();
    const cost = levelUpCost(level);
    const numEl = document.getElementById("player-level-num");
    const costEl = document.getElementById("player-level-cost");
    const scalesFill = document.getElementById("player-level-scales-fill");
    const foodFill = document.getElementById("player-level-food-fill");
    const scalesLabel = document.getElementById("player-level-scales-label");
    const foodLabel = document.getElementById("player-level-food-label");
    const btn = document.getElementById("level-up-btn");

    if (numEl) numEl.textContent = String(level);

    if (cost == null) {
      if (costEl) costEl.textContent = `MAX LEVEL ${MAX_PLAYER_LEVEL}`;
      if (scalesFill) scalesFill.style.width = "100%";
      if (foodFill) foodFill.style.width = "100%";
      if (scalesLabel) scalesLabel.textContent = "🦎 Max";
      if (foodLabel) foodLabel.textContent = "🍖 Max";
      if (btn) btn.classList.add("hidden");
      return;
    }

    const scales = getScales();
    const food = getFood();
    const scalesPct = Math.min(100, (scales / cost) * 100);
    const foodPct = Math.min(100, (food / cost) * 100);
    if (costEl) costEl.textContent = `Level ${level + 1}: ${cost} 🦎 Scales · ${cost} 🍖 Food`;
    if (scalesFill) scalesFill.style.width = `${scalesPct}%`;
    if (foodFill) foodFill.style.width = `${foodPct}%`;
    if (scalesLabel) scalesLabel.textContent = `🦎 ${scales} / ${cost}`;
    if (foodLabel) foodLabel.textContent = `🍖 ${food} / ${cost}`;
    if (btn) {
      btn.classList.toggle("hidden", !(scales >= cost && food >= cost));
      btn.classList.toggle("level-up-btn-ready", scales >= cost && food >= cost);
    }
  }

  function tryLevelUp() {
    const level = getLevel();
    const cost = levelUpCost(level);
    if (cost == null) {
      callbacks.showToast?.(`Max level ${MAX_PLAYER_LEVEL} reached!`);
      return false;
    }
    if (getScales() < cost || getFood() < cost) {
      callbacks.showToast?.(`Need ${cost} Scales 🦎 and ${cost} Food 🍖 for Level ${level + 1}!`);
      return false;
    }
    addScales(-cost);
    addFood(-cost);
    setLevel(level + 1);
    callbacks.showToast?.(`🎉 Level ${level + 1}!`);
    updateMenuCoins();
    return true;
  }

  function rarityCardClass(rarity) {
    if (rarity === "common") return "brawler-card-common";
    if (rarity === "rare") return "brawler-card-rare";
    return "brawler-card-super-rare";
  }

  function getSelectedDragonId() {
    const state = callbacks.getState?.() || {};
    const id = state.dragon;
    if (id && isDragonUnlocked(id)) return id;
    return "";
  }

  function selectDragon(id) {
    const dragon = DRAGON_ROSTER.find((d) => d.id === id);
    if (!dragon) return;
    const state = callbacks.getState?.();
    if (!state) return;

    if (!hasPickedStarter()) {
      unlockDragon(id);
      state.pickedStarter = true;
      state.dragon = id;
      callbacks.saveState?.();
      document.querySelectorAll(".brawler-card").forEach((b) => {
        b.classList.toggle("selected", b.dataset.brawler === id);
      });
      updateMenuHeroLabels();
      updateDragonUnlockUI();
      callbacks.showToast?.(`${dragon.emoji} ${dragon.name} unlocked — your starter dragon!`);
      return;
    }

    if (!isDragonUnlocked(id)) {
      callbacks.showToast?.(`Unlock ${dragon.name} in the Shop for ${DRAGON_SHOP_COST} 🪙!`);
      return;
    }

    state.dragon = id;
    callbacks.saveState?.();
    document.querySelectorAll(".brawler-card").forEach((b) => {
      b.classList.toggle("selected", b.dataset.brawler === id);
    });
    updateMenuHeroLabels();
    callbacks.showToast?.(`${dragon.emoji} ${dragon.name} is your dragon!`);
  }

  function updateDragonUnlockUI() {
    DRAGON_ROSTER.forEach((entry) => {
      const card = document.getElementById(`${entry.id}-card`);
      if (!card) return;
      const locked = showDragonLocked(entry.id);
      card.classList.toggle("locked", locked);
      const roleEl = card.querySelector(".brawler-role");
      if (roleEl) {
        roleEl.textContent = locked ? `${DRAGON_SHOP_COST} 🪙` : entry.role;
      }
    });
  }

  function buildRosterUI() {
    const scroll = document.getElementById("brawler-roster-scroll");
    if (!scroll || scroll.dataset.built === "1") return;
    scroll.dataset.built = "1";

    const byRarity = {};
    DRAGON_ROSTER.forEach((d) => {
      if (!byRarity[d.rarity]) byRarity[d.rarity] = [];
      byRarity[d.rarity].push(d);
    });

    Object.keys(byRarity).forEach((rarity) => {
      const entries = byRarity[rarity];
      const section = document.createElement("div");
      section.className = "brawler-rarity-section";
      const heading = document.createElement("p");
      heading.className = "menu-section-label menu-section-label-sub";
      heading.textContent = `Common Dragons (${entries.length})`;
      section.appendChild(heading);
      const row = document.createElement("div");
      row.className = `brawler-cards brawler-cards-scroll ${rarity}-brawler-row`;
      const selectedId = getSelectedDragonId();
      entries.forEach((entry) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const locked = showDragonLocked(entry.id);
        btn.className = `brawler-card ${rarityCardClass(rarity)}${locked ? " locked" : ""}`;
        btn.dataset.brawler = entry.id;
        btn.id = `${entry.id}-card`;
        if (entry.id === selectedId) btn.classList.add("selected");
        btn.innerHTML = `<span class="brawler-portrait ${entry.id}-portrait">${entry.emoji}</span>
          <span class="brawler-name">${entry.name}</span>
          <span class="brawler-role">${locked ? `${DRAGON_SHOP_COST} 🪙` : entry.role}</span>
          <span class="brawler-lock-tag">🔒</span>`;
        row.appendChild(btn);
      });
      section.appendChild(row);
      scroll.appendChild(section);
    });

    scroll.addEventListener("click", (e) => {
      const btn = e.target.closest(".brawler-card");
      if (btn?.dataset.brawler) selectDragon(btn.dataset.brawler);
    });
  }

  function updateMenuHeroLabels() {
    const id = getSelectedDragonId();
    const emojiEl = document.getElementById("menu-hero-emoji");
    const nameEl = document.getElementById("menu-hero-name");
    const rarityEl = document.getElementById("menu-hero-rarity");
    if (!id) {
      if (emojiEl) emojiEl.textContent = "🐲";
      if (nameEl) nameEl.textContent = "Pick one!";
      if (rarityEl) rarityEl.textContent = "Starter";
      return;
    }
    const d = DRAGON_ROSTER.find((x) => x.id === id) || DRAGON_ROSTER[0];
    if (emojiEl) emojiEl.textContent = d.emoji;
    if (nameEl) nameEl.textContent = d.name;
    if (rarityEl) rarityEl.textContent = RARITY_LABELS[d.rarity] || d.rarity;
  }

  function resizeMenuHeroCanvas() {
    const panel = document.getElementById("menu-hero-panel");
    const heroCanvas = document.getElementById("menu-brawler-canvas");
    if (!panel || !heroCanvas || document.getElementById("main-menu")?.classList.contains("hidden")) return;
    const hdpr = Math.min(window.devicePixelRatio || 1, 2.5);
    menuHeroW = heroCanvas.clientWidth || panel.clientWidth;
    menuHeroH = heroCanvas.clientHeight || Math.max(180, panel.clientHeight - 72);
    heroCanvas.width = Math.round(menuHeroW * hdpr);
    heroCanvas.height = Math.round(menuHeroH * hdpr);
    heroCanvas.style.width = menuHeroW + "px";
    heroCanvas.style.height = menuHeroH + "px";
    menuHeroCtx = heroCanvas.getContext("2d");
    menuHeroCtx.setTransform(hdpr, 0, 0, hdpr, 0, 0);
    menuHeroCtx.imageSmoothingEnabled = true;
  }

  function drawMenuHeroDragon(now) {
    const panel = document.getElementById("menu-hero-panel");
    if (!panel || document.getElementById("main-menu")?.classList.contains("hidden")) return;
    if (!menuHeroCtx || !menuHeroW || !menuHeroH) resizeMenuHeroCanvas();
    if (!menuHeroCtx || !menuHeroW || !menuHeroH || !window.DRSprites) return;

    const id = getSelectedDragonId() || "ember";
    const t = (now || performance.now()) / 1000;
    const bob = Math.sin(t * 2.2) * 10;
    const hctx = menuHeroCtx;

    hctx.clearRect(0, 0, menuHeroW, menuHeroH);

    const glow = hctx.createRadialGradient(menuHeroW * 0.5, menuHeroH * 0.42, 16, menuHeroW * 0.5, menuHeroH * 0.5, Math.max(menuHeroW, menuHeroH) * 0.72);
    glow.addColorStop(0, "rgba(255,248,220,0.16)");
    glow.addColorStop(0.45, "rgba(255,255,255,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    hctx.fillStyle = glow;
    hctx.fillRect(0, 0, menuHeroW, menuHeroH);

    hctx.fillStyle = "rgba(0,0,0,0.35)";
    hctx.beginPath();
    hctx.ellipse(menuHeroW * 0.5, menuHeroH * 0.8 + bob * 0.15, menuHeroW * 0.24, menuHeroH * 0.045, 0, 0, Math.PI * 2);
    hctx.fill();

    const scale = Math.min(menuHeroW, menuHeroH) / 118;
    DRSprites.drawDragon(hctx, menuHeroW * 0.52, menuHeroH * 0.56 + bob, scale * 1.08, 1, id, t, {
      boost: true,
      speed: 280,
      bank: Math.sin(t * 0.75) * 0.1,
    });
  }

  function openHubPanel(title, html) {
    const overlay = document.getElementById("hub-panel-overlay");
    const titleEl = document.getElementById("hub-panel-title");
    const bodyEl = document.getElementById("hub-panel-body");
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = html;
    overlay.classList.remove("hidden");
  }

  function closeHubPanel() {
    document.getElementById("hub-panel-overlay")?.classList.add("hidden");
  }

  function buildGamesPanelHtml() {
    let html = `<p class="quest-page-note">Pick a race mode — then hit Play!</p><div class="bs-games-scroll">`;
    DR_GAME_CATEGORIES.forEach((cat) => {
      const modes = DR_GAME_MODES.filter((m) => m.cat === cat);
      if (!modes.length) return;
      html += `<p class="bs-games-cat-label">${cat}</p>`;
      modes.forEach((m) => {
        const sel = m.id === selectedGameModeId ? " bs-game-mode-selected" : "";
        html += `<button type="button" class="hub-game-link bs-game-mode-btn${sel}" data-game-mode="${m.id}">
          <span class="bs-game-mode-row">
            <span class="bs-game-mode-emoji">${m.emoji}</span>
            <span class="bs-game-mode-text"><strong>${m.name}</strong><small>${m.desc}</small></span>
          </span>
        </button>`;
      });
    });
    html += `</div>
      <button type="button" class="hub-game-link bs-game-play-btn" id="hub-play-mode-btn">▶ Play ${getActiveGameMode().name}</button>
      <a href="../../index.html" class="hub-game-link bs-games-hub-link">🎮 Pro Games Hub</a>`;
    return html;
  }

  function bindGamesPanel() {
    document.querySelectorAll(".bs-game-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectGameMode(btn.dataset.gameMode);
        openGamesPanel();
      });
    });
    document.getElementById("hub-play-mode-btn")?.addEventListener("click", () => {
      closeHubPanel();
      callbacks.startGame?.();
    });
  }

  function openGamesPanel() {
    openHubPanel("Dragon Racers Modes", buildGamesPanelHtml());
    bindGamesPanel();
  }

  function buildQuestsPanelHtml() {
    const state = callbacks.getState?.() || {};
    const best = Math.floor(state.best || 0);
    return `<p class="quest-page-note">Complete quests by racing!</p>
      <ul class="quest-list">
        <li class="quest-item${best >= 500 ? " quest-done" : ""}">🏁 Fly 500 m — ${Math.min(best, 500)} / 500</li>
        <li class="quest-item${(state.totalGems || 0) >= 50 ? " quest-done" : ""}">💎 Collect 50 gems — ${Math.min(state.totalGems || 0, 50)} / 50</li>
        <li class="quest-item">⭐ Win a race — keep flying!</li>
      </ul>`;
  }

  function openQuestsPanel() {
    openHubPanel("Quests", buildQuestsPanelHtml());
  }

  function buildShopPanelHtml() {
    let html = `<p class="quest-page-note">Win Sky Races for ${SKY_RACE_WIN_COINS} 🪙 each. Dragons cost ${DRAGON_SHOP_COST} 🪙.</p>`;
    DRAGON_ROSTER.forEach((d) => {
      const unlocked = isDragonUnlocked(d.id);
      if (unlocked) {
        html += `<button type="button" class="hub-game-link" disabled>${d.emoji} ${d.name} — Unlocked ✓</button>`;
      } else {
        html += `<button type="button" class="hub-game-link shop-unlock-btn" data-unlock-dragon="${d.id}">${d.emoji} Unlock ${d.name} — ${DRAGON_SHOP_COST} 🪙</button>`;
      }
    });
    html += `<p class="quest-page-note">You have ${getCoins()} 🪙 coins.</p>`;
    return html;
  }

  function tryBuyDragon(id) {
    const dragon = DRAGON_ROSTER.find((d) => d.id === id);
    if (!dragon || isDragonUnlocked(id)) return;
    if (getCoins() < DRAGON_SHOP_COST) {
      callbacks.showToast?.(`Need ${DRAGON_SHOP_COST} 🪙 — win Sky Races for coins!`);
      return;
    }
    if (!spendCoins(DRAGON_SHOP_COST)) {
      callbacks.showToast?.(`Need ${DRAGON_SHOP_COST} 🪙 — win Sky Races for coins!`);
      return;
    }
    unlockDragon(id);
    selectDragon(id);
    callbacks.showToast?.(`${dragon.emoji} ${dragon.name} unlocked!`);
    updateMenuCoins();
    openShopPanel();
  }

  function bindShopPanel() {
    document.querySelectorAll(".shop-unlock-btn").forEach((btn) => {
      btn.addEventListener("click", () => tryBuyDragon(btn.dataset.unlockDragon));
    });
  }

  function openShopPanel() {
    openHubPanel("Shop", buildShopPanelHtml());
    bindShopPanel();
  }

  function buildPassTiersHtml() {
    const tier = getPassTier();
    let html = "";
    for (let i = 1; i <= 10; i++) {
      const done = i < tier;
      const current = i === tier;
      html += `<div class="brawl-pass-tier${done ? " brawl-pass-tier-done" : ""}${current ? " brawl-pass-tier-current" : ""}">
        <span class="brawl-pass-tier-num">Tier ${i}</span>
        <span class="brawl-pass-tier-reward">${i % 3 === 0 ? "💎 Gems" : "🪙 Coins"}</span>
      </div>`;
    }
    return html;
  }

  function openBrawlPass() {
    const scroll = document.getElementById("brawl-pass-scroll");
    if (scroll) scroll.innerHTML = buildPassTiersHtml();
    updatePassMenuHint();
    document.getElementById("brawl-pass-overlay")?.classList.remove("hidden");
  }

  function closeBrawlPass() {
    document.getElementById("brawl-pass-overlay")?.classList.add("hidden");
  }

  function awardRunRewards(dist, gems) {
    addScales(Math.floor(dist / 50));
    addFood(Math.max(1, Math.floor(gems / 3)));
    setNum(PASS_XP_KEY, getPassXp() + Math.floor(dist / 2) + gems * 3);
    addCharXp(Math.floor(dist / 20) + gems);
  }

  function addCharXp(amount) {
    let xp = getCharXp() + amount;
    while (xp >= CHAR_XP_PER_STAR && getCharRank() < RANK_TIERS.length - 1) {
      xp -= CHAR_XP_PER_STAR;
      setNum(CHAR_RANK_KEY, getCharRank() + 1);
    }
    setCharXp(xp);
    updateCharRankUI();
  }

  function awardRaceWin(xp) {
    addCharXp(xp);
    addCoins(SKY_RACE_WIN_COINS);
    setNum(PASS_XP_KEY, getPassXp() + xp);
    updatePassMenuHint();
    updateMenuCoins();
    return SKY_RACE_WIN_COINS;
  }

  function bindHubButtons() {
    document.getElementById("brawl-pass-btn")?.addEventListener("click", openBrawlPass);
    document.getElementById("brawl-pass-close")?.addEventListener("click", closeBrawlPass);
    document.getElementById("hub-quests-top-btn")?.addEventListener("click", openQuestsPanel);
    document.getElementById("hub-quests-btn")?.addEventListener("click", openQuestsPanel);
    document.getElementById("hub-bs-quests-btn")?.addEventListener("click", openQuestsPanel);
    document.getElementById("hub-shop-btn")?.addEventListener("click", openShopPanel);
    document.getElementById("hub-games-btn")?.addEventListener("click", openGamesPanel);
    document.getElementById("selected-game-mode-btn")?.addEventListener("click", openGamesPanel);
    document.getElementById("hub-panel-close")?.addEventListener("click", closeHubPanel);
    document.getElementById("level-up-btn")?.addEventListener("click", tryLevelUp);
    document.getElementById("play-world-btn")?.addEventListener("click", () => {
      callbacks.showToast?.("Sky World — explore mode coming soon!");
    });
  }

  function showMainMenu() {
    document.getElementById("main-menu")?.classList.remove("hidden");
    ensureUnlockState();
    updateMenuCoins();
    updateMenuHeroLabels();
    updateGameModeUI();
    updateDragonUnlockUI();
    document.querySelectorAll(".brawler-card").forEach((b) => {
      b.classList.toggle("selected", b.dataset.brawler === getSelectedDragonId());
    });
    resizeMenuHeroCanvas();
  }

  function hideMainMenu() {
    document.getElementById("main-menu")?.classList.add("hidden");
    closeHubPanel();
    closeBrawlPass();
  }

  function init(opts) {
    callbacks = opts || {};
    migrateLegacyCurrency();
    ensureUnlockState();
    selectedGameModeId = loadGameModeId();
    buildRosterUI();
    updateDragonUnlockUI();
    bindHubButtons();
    updateQuestMenuHint();
    updateGameModeUI();
    showMainMenu();
    if (!hasPickedStarter()) {
      callbacks.showToast?.("Choose your first dragon!");
    }
  }

  window.DRHub = {
    init,
    showMainMenu,
    hideMainMenu,
    updateMenuCoins,
    drawMenuHeroDragon,
    resizeMenuHeroCanvas,
    getActiveGameMode,
    getSelectedDragonId,
    isDragonUnlocked,
    awardRunRewards,
    awardRaceWin,
  };
})();
