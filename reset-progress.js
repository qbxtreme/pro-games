// Clears saved game progress (levels, scores, coins, saves) — keeps nicknames & skin picks.
(function () {
  "use strict";

  /** Keys that are preferences, not progress — never deleted. */
  const PRESERVE_KEYS = new Set([
    "becomeAProChatName",
    "becomeAProMakeGameName",
    "snakeIoName",
    "snakeIoColorIdx",
    "snakeIoHighQuality",
    "snakeIoCosmetic",
    "becomeAProOwnerBoostV1",
  ]);

  const EXTRA_PROGRESS_KEYS = [
    "becomeAProHub",
    "becomeAProTokens",
    "proMaxGearAppliedV1",
    "dragonForestSave",
    "dragon-racers",
    "dogFatSimulator",
    "dinoPark",
    "fishermon",
    "mob-battle",
    "raisingAMonster",
    "snakeIoBest",
    "snakeIoBestUnranked",
    "snakeIoBestRanked",
    "snakeIoHubStats",
    "snakeIoCoins",
    "snakeIoUnlockedSkins",
  ];

  function gameSaveKeys() {
    const ids = new Set(EXTRA_PROGRESS_KEYS);
    if (Array.isArray(window.ALL_OUT_GAMES)) {
      window.ALL_OUT_GAMES.forEach((g) => {
        if (g?.id) ids.add(g.id);
      });
    }
    ids.add("dragon-plains");
    ids.add("murder-3");
    return [...ids];
  }

  function collectProgressKeys() {
    const keys = new Set(gameSaveKeys());
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || PRESERVE_KEYS.has(key)) continue;
        if (key.startsWith("becomeAProChatOffline:")) keys.add(key);
      }
    } catch (_) {}
    return [...keys];
  }

  function resetAllProgress() {
    const keys = collectProgressKeys();
    let removed = 0;
    keys.forEach((key) => {
      try {
        if (localStorage.getItem(key) != null) {
          localStorage.removeItem(key);
          removed += 1;
        }
      } catch (_) {}
    });
    return { removed, keys };
  }

  window.BecomeAProReset = {
    reset: resetAllProgress,
    collectProgressKeys,
    PRESERVE_KEYS,
  };
})();
