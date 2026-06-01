/** Pro Games launcher — every catalog game runs locally (never allout.game). */
(function () {
  "use strict";

  const LAST_GAME_KEY = "bapLastAllOutGame";

  const PATH_OVERRIDES = {
    "meme-car": "games/meme-car-race/",
    "fat-simulator": "games/fat-simulator/",
    "random-roles": "games/random-roles/",
    "raise-a-monster": "games/raise-a-monster/",
    fishermon: "games/fishermon/",
    "mob-battle": "games/mob-battle/",
    "hungry-snake-worm": "games/snake-io/",
  };

  function findCatalogEntry(gameId) {
    const catalog = window.ALL_OUT_GAMES || [];
    return catalog.find((g) => g.id === gameId) || null;
  }

  function localGamePath(gameId) {
    if (!gameId) return "/";
    if (PATH_OVERRIDES[gameId]) return PATH_OVERRIDES[gameId];
    const tpl = window.ALLOUT_TEMPLATE_MAP?.[gameId];
    if (tpl?.path) return tpl.path;
    return `games/${gameId}/`;
  }

  function recordPlayed(gameId) {
    try {
      sessionStorage.setItem(LAST_GAME_KEY, gameId);
    } catch (_) {}
  }

  function consumeLastPlayed() {
    try {
      const id = sessionStorage.getItem(LAST_GAME_KEY);
      sessionStorage.removeItem(LAST_GAME_KEY);
      return id;
    } catch (_) {
      return null;
    }
  }

  function launch(gameId) {
    if (!gameId) return false;
    recordPlayed(gameId);
    window.location.href = localGamePath(gameId);
    return true;
  }

  window.AllOutEngine = {
    localGamePath,
    playerPath: localGamePath,
    launch,
    recordPlayed,
    consumeLastPlayed,
    findCatalogEntry,
    isAllOutCatalogGame(gameId) {
      return !!findCatalogEntry(gameId);
    },
  };
})();
