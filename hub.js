const HUB_SAVE_KEY = "becomeAProHub";
const TOKEN_SAVE_KEY = "becomeAProTokens";
const GAMES_PER_ROW = 5;
const DAILY_FREE_TOKENS = 5;
const DAILY_AD_TOKENS = 15;
const AD_DURATION_SEC = 5;

const TOKEN_PACKS = [
  { id: "pack100", tokens: 100, price: 0.99, label: "Starter Pack", badge: null },
  { id: "pack500", tokens: 500, price: 3.99, label: "Pro Pack", badge: "Popular" },
  { id: "pack1200", tokens: 1200, price: 7.99, label: "Mega Pack", badge: "Best Value" },
  { id: "pack3000", tokens: 3000, price: 14.99, label: "Ultra Pack", badge: null },
];

function getCheckoutUrl(packId) {
  const links = window.BECOME_A_PRO_PAYMENTS || {};
  return (links[packId] || "").trim();
}

function usePaymentApi() {
  return !!(window.BECOME_A_PRO_PAYMENTS && window.BECOME_A_PRO_PAYMENTS.useApi);
}

let paymentsReady = false;

async function refreshPaymentsReady() {
  if (usePaymentApi()) {
    try {
      const res = await fetch("/api/payments-ready");
      const data = await res.json();
      paymentsReady = !!data.ready;
      return;
    } catch (_) {
      paymentsReady = false;
      return;
    }
  }
  paymentsReady = TOKEN_PACKS.some((pack) => !!getCheckoutUrl(pack.id));
}

function isPackCheckoutReady(packId) {
  if (usePaymentApi()) return paymentsReady;
  return !!getCheckoutUrl(packId);
}

const BAP_ORIGINALS = [
  {
    id: "dragon-plains",
    title: "Dragon Upgrade",
    emoji: "🐉",
    description: "Casey's original — explore, battle & raise dragons!",
    path: "games/dragon-plains/",
    tag: "Multi",
    engine: "local",
    available: true,
  },
  {
    id: "dragon-racers",
    title: "Dragon Racers",
    emoji: "🏁",
    description: "Blaze through the sky — dodge cliffs, snatch gems, beat your best run!",
    path: "games/dragon-racers/",
    tag: "Action",
    engine: "local",
    available: true,
  },
  {
    id: "hungry-snake-worm",
    title: "Snake.io",
    emoji: "🐍",
    description: "Eat, grow, and outlast rivals — ranked & unranked modes!",
    path: "games/snake-io/",
    tag: "Multi",
    engine: "local",
    available: true,
  },
  {
    id: "brawl-stars-mod",
    title: "Brawl Stars Mod",
    emoji: "⭐",
    description: "Showdown brawler — poison cloud, night map, SUPER MOD & online!",
    path: "games/brawl-stars-mod/",
    tag: "Multi",
    engine: "local",
    available: true,
  },
  {
    id: "mini-brawl-stars",
    title: "Mini Brawl Stars",
    emoji: "💥",
    description: "Fast 3v3 brawls, showdown chaos, and pocket-sized mayhem!",
    path: "games/mini-brawl-stars/",
    tag: "PvP",
    engine: "local",
    available: false,
    comingSoon: true,
  },
];

/** Catalog games hidden from the main hub (played elsewhere). */
const HUB_HIDDEN_GAME_IDS = new Set(["hungry-snake-worm"]);

/** All Out catalog ids that use a custom full implementation folder. */
const ALLOUT_PATH_OVERRIDES = {
  "fat-simulator": "games/fat-simulator/",
  "raise-a-monster": "games/raise-a-monster/",
  "fishermon": "games/fishermon/",
  "mob-battle": "games/mob-battle/",
  "hungry-snake-worm": "games/snake-io/",
};

function resolveGamePath(gameId) {
  if (window.AllOutEngine?.localGamePath) return window.AllOutEngine.localGamePath(gameId);
  if (ALLOUT_PATH_OVERRIDES[gameId]) return ALLOUT_PATH_OVERRIDES[gameId];
  return `games/${gameId}/`;
}

const ALLOUT_TITLE_OVERRIDES = {
  "fat-simulator": "Coco Devouring",
  "raise-a-monster": "Raising a Monster",
};

/** Emoji shown on hub play tiles (replaces thumbnail images). */
const GAME_EMOJIS = {
  "dragon-plains": "🐉",
  "dragon-racers": "🏁",
  "brawl-stars-mod": "⭐",
  "mini-brawl-stars": "💥",
  fishermon: "🎣",
  "murder-mystery": "🔪",
  "mob-battle": "⚔️",
  "hungry-snake-worm": "🐍",
  "fat-simulator": "🐶",
  "raise-a-monster": "👾",
};

const TAG_EMOJIS = {
  Party: "🎉",
  PvP: "⚔️",
  Multi: "👥",
  Horror: "👻",
  Action: "💥",
  RP: "🏠",
  Sports: "⚽",
  Tycoon: "💼",
  Strategy: "♟️",
  Official: "🎮",
  Original: "⭐",
  GBA: "🎮",
};

function pickGameEmoji(id, title, description, tag) {
  if (GAME_EMOJIS[id]) return GAME_EMOJIS[id];
  const start = title.match(/^(\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:\uFE0F?\u200D\p{Extended_Pictographic})*)/u);
  if (start) return start[1];
  const end = title.match(/(\p{Extended_Pictographic}\uFE0F?)\s*$/u);
  if (end) return end[1];
  const desc = description?.match(/(\p{Extended_Pictographic}\uFE0F?)/u);
  if (desc) return desc[1];
  return TAG_EMOJIS[tag] || "🎮";
}

function buildAllOutHubGames() {
  const catalog = window.ALL_OUT_GAMES || [];
  return catalog
    .filter((g) => !HUB_HIDDEN_GAME_IDS.has(g.id))
    .map((g) => ({
    id: g.id,
    title: ALLOUT_TITLE_OVERRIDES[g.id] || g.title,
    description: g.description,
    tag: "Multi",
    emoji: pickGameEmoji(g.id, g.title, g.description, g.tag),
    allOut: true,
    engine: "local",
    path: resolveGamePath(g.id),
    available: true,
  }));
}

function getGamesList() {
  return [...BAP_ORIGINALS, ...buildAllOutHubGames()];
}

function getHubItems() {
  return getGamesList().map((g) => ({ ...g, comingSoon: !!g.comingSoon }));
}

function loadHubState() {
  try {
    const saved = localStorage.getItem(HUB_SAVE_KEY);
    const fromKey = loadTokenBalance();
    if (saved) {
      const data = JSON.parse(saved);
      const hubTokens = typeof data.tokens === "number" ? data.tokens : 0;
      data.tokens = Math.max(hubTokens, fromKey);
      if (!data.gamesPlayed) data.gamesPlayed = {};
      if (!data.completedPurchases) data.completedPurchases = [];
      return data;
    }
    return {
      gamesPlayed: {},
      proLevel: 1,
      tokens: fromKey,
      lastDailyRewardDate: null,
      wheelSpinsUsed: 0,
      wheelPeriodEnd: 0,
      completedPurchases: [],
    };
  } catch (_) {}
  return { gamesPlayed: {}, proLevel: 1, tokens: loadTokenBalance(), lastDailyRewardDate: null, wheelSpinsUsed: 0, wheelPeriodEnd: 0, completedPurchases: [] };
}

function syncTokenBalance() {
  const fromKey = loadTokenBalance();
  const fromHub = typeof hubState.tokens === "number" ? hubState.tokens : 0;
  const merged = Math.max(fromKey, fromHub);
  hubState.tokens = merged;
  localStorage.setItem(TOKEN_SAVE_KEY, String(merged));
  saveHubState();
  return merged;
}

function loadTokenBalance() {
  try {
    return parseInt(localStorage.getItem(TOKEN_SAVE_KEY) || "0", 10) || 0;
  } catch (_) {
    return 0;
  }
}

function getTokens() {
  return hubState.tokens ?? 0;
}

function setTokens(amount) {
  hubState.tokens = Math.max(0, Math.floor(amount));
  localStorage.setItem(TOKEN_SAVE_KEY, String(hubState.tokens));
  saveHubState();
}

function addTokens(amount) {
  setTokens(getTokens() + amount);
}

function resetAllTokens() {
  setTokens(0);
  renderHubStats();
}

function resetAllProgress() {
  if (!window.BecomeAProReset?.reset) return { removed: 0 };
  const result = window.BecomeAProReset.reset();
  hubState = {
    gamesPlayed: {},
    proLevel: 1,
    tokens: 0,
    lastDailyRewardDate: null,
    wheelSpinsUsed: 0,
    wheelPeriodEnd: 0,
    completedPurchases: [],
  };
  saveHubState();
  setTokens(0);
  updateProLevel();
  renderHubStats();
  renderWheelUI();
  return result;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hasClaimedDailyToday() {
  return hubState.lastDailyRewardDate === todayKey();
}

function markDailyClaimed(type) {
  hubState.lastDailyRewardDate = todayKey();
  hubState.lastDailyRewardType = type;
  saveHubState();
}

function showDailyRewardModal() {
  document.getElementById("daily-overlay")?.classList.remove("hidden");
}

function closeDailyRewardModal() {
  document.getElementById("daily-overlay")?.classList.add("hidden");
}

function claimDailyFree() {
  if (hasClaimedDailyToday()) return;
  addTokens(DAILY_FREE_TOKENS);
  markDailyClaimed("free");
  closeDailyRewardModal();
  renderHubStats();
  showHubToast(`+${DAILY_FREE_TOKENS} Pro Tokens! Come back tomorrow 🪙`);
}

function playAd() {
  return new Promise((resolve) => {
    const overlay = document.getElementById("ad-overlay");
    const bar = document.getElementById("ad-progress-bar");
    const countdown = document.getElementById("ad-countdown");
    if (!overlay || !bar || !countdown) {
      resolve();
      return;
    }
    overlay.classList.remove("hidden");
    let left = AD_DURATION_SEC;
    countdown.textContent = String(left);
    bar.style.width = "0%";
    const tick = setInterval(() => {
      left--;
      countdown.textContent = String(Math.max(0, left));
      bar.style.width = `${((AD_DURATION_SEC - left) / AD_DURATION_SEC) * 100}%`;
      if (left <= 0) {
        clearInterval(tick);
        overlay.classList.add("hidden");
        resolve();
      }
    }, 1000);
  });
}

async function claimDailyAd() {
  if (hasClaimedDailyToday()) return;
  closeDailyRewardModal();
  await playAd();
  if (hasClaimedDailyToday()) return;
  addTokens(DAILY_AD_TOKENS);
  markDailyClaimed("ad");
  renderHubStats();
  showHubToast(`+${DAILY_AD_TOKENS} Pro Tokens for watching the ad! 🪙`);
}

function setupDailyRewards() {
  document.getElementById("daily-free-btn")?.addEventListener("click", claimDailyFree);
  document.getElementById("daily-ad-btn")?.addEventListener("click", claimDailyAd);
}

function maybeShowDailyReward() {
  if (!hasClaimedDailyToday()) showDailyRewardModal();
}

function saveHubState() {
  localStorage.setItem(HUB_SAVE_KEY, JSON.stringify(hubState));
}

function recordCompletedPurchase(sessionId) {
  if (!hubState.completedPurchases) hubState.completedPurchases = [];
  if (hubState.completedPurchases.includes(sessionId)) return false;
  hubState.completedPurchases.push(sessionId);
  saveHubState();
  return true;
}

let hubState = loadHubState();

function countGamesPlayed() {
  return Object.keys(hubState.gamesPlayed).filter((id) => hubState.gamesPlayed[id]).length;
}

function updateProLevel() {
  const played = countGamesPlayed();
  hubState.proLevel = Math.max(1, played + 1);
}

function renderHubStats() {
  const playedEl = document.getElementById("hub-games-played");
  const levelEl = document.getElementById("hub-pro-level");
  const tokenEl = document.getElementById("hub-token-balance");
  const settingsTokenEl = document.getElementById("settings-token-count");
  const played = countGamesPlayed();
  const tokens = getTokens();
  if (playedEl) playedEl.textContent = `🎮 Games played: ${played} / ${getGamesList().length}`;
  if (levelEl) levelEl.textContent = `⭐ Pro Level ${hubState.proLevel}`;
  if (tokenEl) tokenEl.textContent = `🪙 Pro Tokens: ${tokens}`;
  if (settingsTokenEl) settingsTokenEl.textContent = tokens.toLocaleString();
}

function getPostPurchaseTab() {
  return window.HUB_CONFIG?.snakeIoHub ? "play" : "settings";
}

function switchTab(tabId) {
  document.querySelectorAll(".hub-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.getElementById("panel-games")?.classList.toggle("hidden", tabId !== "games");
  document.getElementById("panel-play")?.classList.toggle("hidden", tabId !== "play");
  document.getElementById("panel-settings")?.classList.toggle("hidden", tabId !== "settings");
}

function createTokenPackCard(pack) {
  const card = document.createElement("button");
  const checkoutReady = isPackCheckoutReady(pack.id);
  card.type = "button";
  card.className = "token-pack" + (checkoutReady ? "" : " token-pack-disabled");
  card.disabled = !checkoutReady;
  card.innerHTML = `
    ${pack.badge ? `<span class="token-pack-badge">${pack.badge}</span>` : ""}
    <span class="token-pack-amount">🪙 ${pack.tokens.toLocaleString()}</span>
    <span class="token-pack-label">${pack.label}</span>
    <span class="token-pack-price">$${pack.price.toFixed(2)}</span>
    ${checkoutReady ? "" : `<span class="token-pack-setup">Ask parent to set up Stripe</span>`}
  `;
  card.addEventListener("click", () => openBuyModal(pack));
  return card;
}

let pendingPack = null;

function openBuyModal(pack) {
  pendingPack = pack;
  document.getElementById("buy-modal-title").textContent = pack.label;
  document.getElementById("buy-modal-desc").textContent =
    `Get ${pack.tokens.toLocaleString()} Pro Tokens to spend in your games.`;
  document.getElementById("buy-modal-price").textContent = `$${pack.price.toFixed(2)} USD`;
  const payBtn = document.getElementById("buy-pay-btn");
  if (payBtn) {
    payBtn.textContent = `Pay $${pack.price.toFixed(2)}`;
    payBtn.disabled = !isPackCheckoutReady(pack.id);
  }
  document.getElementById("buy-overlay").classList.remove("hidden");
}

function closeBuyModal() {
  pendingPack = null;
  document.getElementById("buy-overlay").classList.add("hidden");
}

async function startRealPurchase() {
  if (!pendingPack) return;

  const payBtn = document.getElementById("buy-pay-btn");
  const pack = pendingPack;

  if (!usePaymentApi()) {
    const checkoutUrl = getCheckoutUrl(pack.id);
    if (!checkoutUrl) {
      showHubToast("Checkout is not set up yet. Ask a parent to add payment links.");
      return;
    }
    window.location.href = checkoutUrl;
    return;
  }

  if (payBtn) {
    payBtn.disabled = true;
    payBtn.textContent = "Opening checkout...";
  }

  try {
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId: pack.id }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    showHubToast(data.error || "Could not start checkout.");
  } catch (_) {
    showHubToast("Could not connect. Run npm start (not python server).");
  } finally {
    if (payBtn) {
      payBtn.disabled = !isPackCheckoutReady(pack.id);
      payBtn.textContent = `Pay $${pack.price.toFixed(2)}`;
    }
  }
}

function handlePurchaseReturn() {
  const params = new URLSearchParams(window.location.search);
  const purchase = params.get("purchase");

  if (purchase === "cancelled") {
    window.history.replaceState({}, "", window.location.pathname);
    switchTab(getPostPurchaseTab());
    showHubToast("Purchase cancelled.");
    return;
  }

  if (purchase !== "success") return;

  const packId = params.get("pack");
  const sessionId = params.get("session_id");

  window.history.replaceState({}, "", window.location.pathname);
  switchTab(getPostPurchaseTab());

  if (!sessionId) {
    showHubToast("Payment finished, but tokens could not be added. Ask a parent for help.");
    return;
  }

  if (!recordCompletedPurchase(sessionId)) {
    showHubToast("Your tokens are already in your account! 🪙");
    return;
  }

  verifyAndCreditPurchase(sessionId, packId);
}

async function verifyAndCreditPurchase(sessionId, packId) {
  try {
    const res = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();

    if (data.paid && data.tokens) {
      addTokens(data.tokens);
      renderHubStats();
      showHubToast(`Payment complete! +${data.tokens.toLocaleString()} Pro Tokens 🪙`);
      return;
    }

    hubState.completedPurchases = (hubState.completedPurchases || []).filter((id) => id !== sessionId);
    saveHubState();
    showHubToast(data.error || "Payment was not confirmed. No tokens added.");
  } catch (_) {
    hubState.completedPurchases = (hubState.completedPurchases || []).filter((id) => id !== sessionId);
    saveHubState();
    showHubToast("Could not verify payment. Make sure npm start is running.");
  }
}

function renderTokenShop() {
  const shop = document.getElementById("token-shop");
  if (!shop) return;
  shop.innerHTML = "";
  TOKEN_PACKS.forEach((pack) => shop.appendChild(createTokenPackCard(pack)));
}

function setupHubTabs() {
  document.querySelectorAll(".hub-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function setupBuyModal() {
  document.getElementById("buy-pay-btn")?.addEventListener("click", startRealPurchase);
  document.getElementById("buy-cancel-btn")?.addEventListener("click", closeBuyModal);
  document.getElementById("buy-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "buy-overlay") closeBuyModal();
  });
}

/** Games can call: window.BecomeAPro.getTokens() / spendTokens(n) */
window.BecomeAPro = {
  getTokens,
  saveNow() {
    syncTokenBalance();
    window.BecomeAProSave?.flushAll?.();
  },
  spendTokens(amount) {
    if (amount > getTokens()) return false;
    setTokens(getTokens() - amount);
    renderHubStats();
    window.BecomeAProSave?.flushAll?.();
    return true;
  },
  resetAllTokens,
  resetAllProgress,
  recordGamePlayed(gameId) {
    hubState.gamesPlayed[gameId] = true;
    updateProLevel();
    saveHubState();
    renderHubStats();
  },
};

function createGameTile(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "game-tile"
    + (item.comingSoon ? " coming-soon" : "")
    + (item.singlePlayer ? " single-player" : "")
    + (item.allOut ? " allout-tile" : "");

  const emoji = item.emoji || pickGameEmoji(item.id, item.title, item.description, item.tag);
  card.innerHTML = `
    <div class="game-tile-icon">${emoji}</div>
    <div class="game-tile-title">${item.title}</div>
    <span class="game-tile-tag">${item.comingSoon ? "Soon" : item.tag}</span>
    <span class="game-tile-play">${item.comingSoon ? "Coming Soon" : "PLAY"}</span>
  `;

  if (!item.comingSoon && item.available) {
    card.addEventListener("click", () => launchGame(item));
  } else if (item.comingSoon) {
    card.addEventListener("click", () => {
      if (item.path) {
        window.location.href = item.path;
        return;
      }
      const msg = item.description
        ? `${item.title} is coming soon! ${item.description}`
        : `${item.title} is coming soon! ${item.emoji || "🎮"}`;
      showHubToast(msg);
    });
  }

  return card;
}

function launchGame(game) {
  hubState.gamesPlayed[game.id] = true;
  updateProLevel();
  saveHubState();
  if (window.AllOutEngine?.recordPlayed && window.AllOutEngine.isAllOutCatalogGame?.(game.id)) {
    window.AllOutEngine.recordPlayed(game.id);
  }
  const dest = game.path || resolveGamePath(game.id);
  if (game.external || /^https?:\/\//i.test(dest)) {
    window.open(dest, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.href = dest;
}

function showHubToast(msg) {
  const toast = document.getElementById("hub-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(showHubToast._timer);
  showHubToast._timer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

const MAKE_GAME_NAME_KEY = "becomeAProMakeGameName";
const MAKE_GAME_COST = 200;

function setupMakeGameRequest() {
  const btn = document.getElementById("make-game-btn");
  const overlay = document.getElementById("make-game-overlay");
  const balanceEl = document.getElementById("make-game-balance");
  const fromEl = document.getElementById("make-game-from");
  const textEl = document.getElementById("make-game-text");
  const sendBtn = document.getElementById("make-game-send-btn");
  const cancelBtn = document.getElementById("make-game-cancel-btn");
  if (!btn || !overlay || !fromEl || !textEl || !sendBtn || !cancelBtn) return;

  try {
    const savedName = localStorage.getItem(MAKE_GAME_NAME_KEY);
    if (savedName) fromEl.value = savedName;
  } catch (_) {}

  function refreshMakeGameBalance() {
    if (!balanceEl) return;
    const tokens = getTokens();
    balanceEl.textContent = `Your balance: 🪙 ${tokens}`;
    balanceEl.classList.toggle("not-enough", tokens < MAKE_GAME_COST);
    sendBtn.disabled = tokens < MAKE_GAME_COST;
  }

  function openMakeGameModal() {
    refreshMakeGameBalance();
    overlay.classList.remove("hidden");
    textEl.focus();
  }

  function closeMakeGameModal() {
    overlay.classList.add("hidden");
  }

  btn.addEventListener("click", openMakeGameModal);
  cancelBtn.addEventListener("click", closeMakeGameModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMakeGameModal();
  });

  sendBtn.addEventListener("click", async () => {
    const text = textEl.value.trim();
    const from = fromEl.value.trim() || "Player";
    if (!text) {
      showHubToast("Write your game idea first! ✏️");
      textEl.focus();
      return;
    }

    if (getTokens() < MAKE_GAME_COST) {
      showHubToast(`You need ${MAKE_GAME_COST} Pro Tokens! Get more in Settings 🪙`);
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
      const res = await fetch("/api/game-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from, paidTokens: MAKE_GAME_COST }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send.");

      if (!window.BecomeAPro.spendTokens(MAKE_GAME_COST)) {
        throw new Error(`You need ${MAKE_GAME_COST} Pro Tokens!`);
      }

      try { localStorage.setItem(MAKE_GAME_NAME_KEY, from); } catch (_) {}
      textEl.value = "";
      closeMakeGameModal();
      renderHubStats();
      showHubToast("Sent! We got your game idea on the computer 🎮");
    } catch (err) {
      const msg = window.PRO_GAMES?.staticHost
        ? "Game ideas need the full server — run npm start locally."
        : err.message || "Run npm start so we can receive your idea!";
      showHubToast(msg);
      refreshMakeGameBalance();
    } finally {
      sendBtn.disabled = getTokens() < MAKE_GAME_COST;
      sendBtn.textContent = `Pay ${MAKE_GAME_COST} 🪙 & Send`;
    }
  });
}

function renderGameGrid() {
  const grid = document.getElementById("game-grid");
  if (!grid || window.HUB_CONFIG?.snakeIoHub) return;
  grid.innerHTML = "";
  getHubItems().forEach((item) => grid.appendChild(createGameTile(item)));
}

const WHEEL_SPINS_MAX = 3;
const WHEEL_PERIOD_MS = 6 * 60 * 60 * 1000;
const WHEEL_PRIZES = [
  { label: "+5 tokens", emoji: "🪙", amount: 5, color: "#ffe082", weight: 4 },
  { label: "+10 tokens", emoji: "🪙", amount: 10, color: "#ffca28", weight: 4 },
  { label: "+15 tokens", emoji: "🪙", amount: 15, color: "#ffb300", weight: 3 },
  { label: "+20 tokens", emoji: "🪙", amount: 20, color: "#ffa000", weight: 3 },
  { label: "+25 tokens", emoji: "🪙", amount: 25, color: "#ff8f00", weight: 2 },
  { label: "+50 tokens", emoji: "🪙", amount: 50, color: "#ff6f00", weight: 1 },
  { label: "+100 tokens", emoji: "🪙", amount: 100, color: "#e65100", weight: 1 },
  { label: "+3 tokens", emoji: "🪙", amount: 3, color: "#fff59d", weight: 2 },
];

let wheelCanvas, wheelCtx, wheelRotation = 0, wheelSpinning = false;

function formatWaitTime(ms) {
  if (ms <= 0) return "now!";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.ceil((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

function ensureWheelPeriod() {
  const now = Date.now();
  if (!hubState.wheelPeriodEnd || now >= hubState.wheelPeriodEnd) {
    hubState.wheelPeriodEnd = now + WHEEL_PERIOD_MS;
    hubState.wheelSpinsUsed = 0;
    saveHubState();
  }
}

function getWheelSpinsLeft() {
  ensureWheelPeriod();
  return Math.max(0, WHEEL_SPINS_MAX - (hubState.wheelSpinsUsed || 0));
}

function pickWheelPrizeIndex() {
  const total = WHEEL_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    roll -= WHEEL_PRIZES[i].weight;
    if (roll <= 0) return i;
  }
  return 0;
}

function drawWheelCanvas(rotation) {
  if (!wheelCtx || !wheelCanvas) return;
  const ctxW = wheelCtx;
  const size = wheelCanvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 6;
  const segCount = WHEEL_PRIZES.length;
  const segAngle = (Math.PI * 2) / segCount;

  ctxW.clearRect(0, 0, size, size);
  ctxW.save();
  ctxW.translate(cx, cy);
  ctxW.rotate(rotation);

  for (let i = 0; i < segCount; i++) {
    const prize = WHEEL_PRIZES[i];
    const start = i * segAngle - Math.PI / 2;
    const end = start + segAngle;

    ctxW.beginPath();
    ctxW.moveTo(0, 0);
    ctxW.arc(0, 0, radius, start, end);
    ctxW.closePath();
    ctxW.fillStyle = prize.color;
    ctxW.fill();
    ctxW.strokeStyle = "rgba(255,255,255,0.55)";
    ctxW.lineWidth = 2;
    ctxW.stroke();

    ctxW.save();
    ctxW.rotate(start + segAngle / 2);
    ctxW.textAlign = "right";
    ctxW.fillStyle = "#3e2723";
    ctxW.font = "bold 11px system-ui,sans-serif";
    ctxW.fillText(prize.emoji, radius - 14, 4);
    ctxW.font = "600 9px system-ui,sans-serif";
    ctxW.fillText(prize.label, radius - 14, 16);
    ctxW.restore();
  }

  ctxW.restore();

  ctxW.beginPath();
  ctxW.arc(cx, cy, 18, 0, Math.PI * 2);
  ctxW.fillStyle = "#fff8e1";
  ctxW.fill();
  ctxW.strokeStyle = "#f57c00";
  ctxW.lineWidth = 3;
  ctxW.stroke();
  ctxW.font = "bold 16px system-ui,sans-serif";
  ctxW.textAlign = "center";
  ctxW.textBaseline = "middle";
  ctxW.fillStyle = "#e65100";
  ctxW.fillText("🎡", cx, cy + 1);
}

function renderWheelUI() {
  ensureWheelPeriod();
  const left = getWheelSpinsLeft();
  const spinsEl = document.getElementById("wheel-spins-left");
  const spinBtn = document.getElementById("wheel-spin-btn");
  if (spinsEl) {
    spinsEl.textContent = left > 0
      ? `Spins left: ${left} / ${WHEEL_SPINS_MAX}`
      : `New spins in: ${formatWaitTime(hubState.wheelPeriodEnd - Date.now())}`;
  }
  if (spinBtn) spinBtn.disabled = wheelSpinning || left <= 0;
}

function openWheelOverlay() {
  ensureWheelPeriod();
  document.getElementById("wheel-overlay")?.classList.remove("hidden");
  drawWheelCanvas(wheelRotation);
  renderWheelUI();
}

function closeWheelOverlay() {
  document.getElementById("wheel-overlay")?.classList.add("hidden");
}

function spinWheel() {
  if (wheelSpinning) return;
  ensureWheelPeriod();
  const left = getWheelSpinsLeft();
  if (left <= 0) {
    showHubToast(`No spins left! New spins in ${formatWaitTime(hubState.wheelPeriodEnd - Date.now())}`);
    renderWheelUI();
    return;
  }

  const prizeIndex = pickWheelPrizeIndex();
  const prize = WHEEL_PRIZES[prizeIndex];
  const segAngle = (Math.PI * 2) / WHEEL_PRIZES.length;
  const targetMod = ((Math.PI * 2) - (prizeIndex * segAngle + segAngle / 2)) % (Math.PI * 2);
  const currentMod = ((wheelRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let deltaMod = targetMod - currentMod;
  if (deltaMod < 0) deltaMod += Math.PI * 2;
  const extraSpins = 5 + Math.floor(Math.random() * 3);
  const targetRotation = wheelRotation + deltaMod + extraSpins * Math.PI * 2;

  wheelSpinning = true;
  renderWheelUI();
  document.getElementById("wheel-result").textContent = "Spinning...";

  const startRotation = wheelRotation;
  const delta = targetRotation - startRotation;
  const duration = 4200;
  const startTime = performance.now();

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateWheel(now) {
    const t = Math.min(1, (now - startTime) / duration);
    wheelRotation = startRotation + delta * easeOutQuart(t);
    drawWheelCanvas(wheelRotation);
    if (t < 1) {
      requestAnimationFrame(animateWheel);
      return;
    }

    wheelSpinning = false;
    hubState.wheelSpinsUsed = (hubState.wheelSpinsUsed || 0) + 1;
    addTokens(prize.amount);
    saveHubState();
    document.getElementById("wheel-result").textContent = `You won ${prize.emoji} ${prize.label}!`;
    showHubToast(`🎡 Wheel win: +${prize.amount} Pro Tokens!`);
    renderWheelUI();
  }

  requestAnimationFrame(animateWheel);
}

function setupWheel() {
  wheelCanvas = document.getElementById("wheel-canvas");
  wheelCtx = wheelCanvas ? wheelCanvas.getContext("2d") : null;
  drawWheelCanvas(0);
  renderWheelUI();

  document.getElementById("wheel-open-btn")?.addEventListener("click", openWheelOverlay);
  document.getElementById("wheel-close-btn")?.addEventListener("click", closeWheelOverlay);
  document.getElementById("wheel-spin-btn")?.addEventListener("click", spinWheel);
  document.getElementById("wheel-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "wheel-overlay") closeWheelOverlay();
  });
}

async function initHub() {
  if (window.PRO_GAMES?.staticHost) {
    document.getElementById("static-host-banner")?.classList.remove("hidden");
  }
  if (window.BecomeAProSave) {
    BecomeAProSave.syncProTokens();
    hubState = loadHubState();
    const restored = await BecomeAProSave.restoreFromCloudIfNewer();
    if (restored) {
      hubState = loadHubState();
      showHubToast("Welcome back — your Pro Tokens & progress were restored! 🪙");
    }
  }
  syncTokenBalance();
  if (!hubState.completedPurchases) hubState.completedPurchases = [];

  if (new URLSearchParams(window.location.search).get("resetTokens") === "1") {
    resetAllTokens();
    window.history.replaceState({}, "", window.location.pathname);
    switchTab(getPostPurchaseTab());
    showHubToast("All Pro Tokens removed. Balance: 0 🪙");
  }

  if (new URLSearchParams(window.location.search).get("resetProgress") === "1") {
    const result = resetAllProgress();
    window.history.replaceState({}, "", window.location.pathname);
    switchTab("settings");
    showHubToast(`All game progress reset (${result.removed} saves cleared). Fresh start!`);
  }

  updateProLevel();
  const lastAllOut = window.AllOutEngine?.consumeLastPlayed();
  if (lastAllOut) {
    hubState.gamesPlayed[lastAllOut] = true;
    updateProLevel();
    saveHubState();
  }
  await refreshPaymentsReady();
  renderHubStats();
  renderGameGrid();
  renderTokenShop();
  setupHubTabs();
  setupBuyModal();
  setupDailyRewards();
  handlePurchaseReturn();
  maybeShowDailyReward();
  setupMakeGameRequest();
  setupWheel();
  setupMaxGear();
  setupResetProgress();
  if (window.BecomeAProOwner) BecomeAProOwner.isActive();
  if (window.ProMaxGear && !localStorage.getItem(ProMaxGear.FLAG_KEY)) {
    ProMaxGear.applyIfNeeded(showHubToast);
  }
}

function setupMaxGear() {
  document.getElementById("max-gear-btn")?.addEventListener("click", () => {
    if (!window.ProMaxGear) return;
    const result = ProMaxGear.applyAll();
    showHubToast(`⚡ Max gear applied to ${result.count} games! Reload any open game to see it.`);
  });
}

function setupResetProgress() {
  document.getElementById("reset-progress-btn")?.addEventListener("click", () => {
    const ok = window.confirm(
      "Reset ALL game progress on this device?\n\nThis clears levels, scores, coins, tokens, and saves in every game.\n\nYour nicknames and snake skin choice are kept.\n\nThis cannot be undone."
    );
    if (!ok) return;
    const result = resetAllProgress();
    showHubToast(`All game progress reset (${result.removed} saves cleared). Fresh start!`);
  });
}

if (document.getElementById("hub-app") && !window.HUB_CONFIG?.snakeIoHub) {
  initHub();
}
