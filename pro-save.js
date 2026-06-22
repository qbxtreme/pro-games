/**
 * Pro Games — keep Pro Tokens & progress when you leave and come back.
 * Syncs localStorage, auto-saves on tab close, and backs up to the server by player name.
 */
(function () {
  "use strict";

  const HUB_KEY = "becomeAProHub";
  const TOKEN_KEY = "becomeAProTokens";
  const META_KEY = "becomeAProSaveMeta";
  const NAME_KEYS = ["becomeAProChatName", "becomeAProMakeGameName", "snakeIoName"];
  const SAVE_VERSION = 1;
  const FLUSH_INTERVAL_MS = 20000;
  const SKIP_PREFIXES = ["becomeAProChatOffline:"];

  const gameSavers = new Map();
  const gameReloaders = new Map();
  const restoreListeners = [];
  let flushTimer = null;
  let cloudSyncPromise = null;
  let readyDone = false;
  let resolveReady;

  const whenReady = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function finishReady(restored) {
    if (readyDone) return;
    readyDone = true;
    resolveReady(restored);
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function readJson(key, fallback) {
    try {
      const raw = safeGet(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function playerName() {
    for (let i = 0; i < NAME_KEYS.length; i++) {
      const n = safeGet(NAME_KEYS[i]);
      if (n && String(n).trim()) return String(n).trim().slice(0, 16);
    }
    return "Player";
  }

  function resolvePlayerName() {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("player") || params.get("name");
      if (fromUrl) {
        const n = String(fromUrl).trim().slice(0, 16);
        if (n && n !== "Player") {
          safeSet("becomeAProChatName", n);
          return n;
        }
      }
    } catch (_) {}
    return playerName();
  }

  function persistNameFromSnapshot(snap) {
    if (!snap || typeof snap !== "object") return;
    let name = snap.player;
    if ((!name || name === "Player") && snap.games?.becomeAProChatName) {
      name = snap.games.becomeAProChatName;
    }
    name = String(name || "").trim().slice(0, 16);
    if (name && name !== "Player") safeSet("becomeAProChatName", name);
  }

  function shouldSkipKey(key) {
    if (!key) return true;
    return SKIP_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  function isEmptySaveValue(val) {
    if (val == null || val === "") return true;
    if (val === "{}" || val === "null" || val === "[]") return true;
    return false;
  }

  function saveRichness(val) {
    if (val == null || val === "") return 0;
    const text = typeof val === "string" ? val : JSON.stringify(val);
    try {
      const o = JSON.parse(text);
      if (Array.isArray(o)) return o.length * 10 + text.length;
      if (o && typeof o === "object") {
        let score = Object.keys(o).length * 5 + text.length;
        if (Array.isArray(o.owned)) score += o.owned.length * 50;
        if (Array.isArray(o.pets)) score += o.pets.length * 50;
        if (Array.isArray(o.plots)) score += o.plots.length * 20;
        if (typeof o.coins === "number") score += Math.min(500, Math.log10(o.coins + 1) * 100);
        if (typeof o.cash === "number") score += Math.min(500, Math.log10(o.cash + 1) * 100);
        if (typeof o.fat === "number") score += Math.min(200, Math.log10(o.fat + 1) * 50);
        if (typeof o.wins === "number") score += Math.min(200, o.wins);
        if (typeof o.level === "number") score += o.level * 10;
        if (typeof o.rebirths === "number") score += o.rebirths * 25;
        if (o.weightsOwned && typeof o.weightsOwned === "object") {
          score += Object.keys(o.weightsOwned).length * 15;
        }
        return score;
      }
    } catch (_) {}
    return text.length;
  }

  function shouldUseCloudSave(localVal, incomingVal) {
    if (isEmptySaveValue(localVal)) return true;
    return saveRichness(incomingVal) > saveRichness(localVal);
  }

  function collectLocalSnapshot() {
    syncProTokens();
    const games = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || shouldSkipKey(key)) continue;
        if (key === META_KEY) continue;
        const val = safeGet(key);
        if (val != null) games[key] = val;
      }
    } catch (_) {}

    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      player: playerName(),
      tokens: parseInt(safeGet(TOKEN_KEY) || "0", 10) || 0,
      hub: readJson(HUB_KEY, null),
      games,
    };
  }

  function notifyRestore(restored) {
    if (!restored) return;
    gameReloaders.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
    restoreListeners.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
    try {
      document.dispatchEvent(new CustomEvent("bap-saves-restored"));
    } catch (_) {}
  }

  function applySnapshot(snap, opts) {
    opts = opts || {};
    if (!snap || typeof snap !== "object") return false;

    const localMeta = readJson(META_KEY, {});
    const localAt = localMeta.cloudSavedAt || localMeta.savedAt || 0;
    const incomingAt = snap.savedAt || 0;
    const localIsNewer = !opts.force && incomingAt > 0 && localAt > incomingAt + 5000;

    const localTokens = parseInt(safeGet(TOKEN_KEY) || "0", 10) || 0;
    const mergedTokens = Math.max(localTokens, snap.tokens || 0, snap.hub?.tokens || 0);
    let changed = false;

    if (!localIsNewer || mergedTokens > localTokens) {
      safeSet(TOKEN_KEY, String(mergedTokens));
      changed = true;
    }

    if (snap.hub && typeof snap.hub === "object") {
      const localHub = readJson(HUB_KEY, {});
      const cloudHub = { ...snap.hub, tokens: mergedTokens };
      const useCloudHub = opts.force || !localIsNewer
        || (cloudHub.proLevel || 0) > (localHub.proLevel || 0)
        || Object.keys(localHub.gamesPlayed || {}).length < Object.keys(cloudHub.gamesPlayed || {}).length;
      if (useCloudHub) {
        safeSet(HUB_KEY, JSON.stringify(cloudHub));
        changed = true;
      }
    } else if (!localIsNewer || opts.force) {
      const hub = readJson(HUB_KEY, {});
      hub.tokens = mergedTokens;
      safeSet(HUB_KEY, JSON.stringify(hub));
      changed = true;
    } else if (mergedTokens > localTokens) {
      const hub = readJson(HUB_KEY, {});
      hub.tokens = mergedTokens;
      safeSet(HUB_KEY, JSON.stringify(hub));
      changed = true;
    }

    if (snap.games && typeof snap.games === "object") {
      Object.keys(snap.games).forEach((key) => {
        if (shouldSkipKey(key)) return;
        const val = snap.games[key];
        if (val == null) return;
        const incomingVal = typeof val === "string" ? val : JSON.stringify(val);
        const localVal = safeGet(key);
        if (!opts.force && localIsNewer && !shouldUseCloudSave(localVal, incomingVal)) return;
        safeSet(key, incomingVal);
        changed = true;
      });
    }

    if (!changed) return false;

    writeMeta({ savedAt: Date.now(), cloudSavedAt: incomingAt || Date.now(), restored: true });
    notifyRestore(true);
    return true;
  }

  function writeMeta(extra) {
    const meta = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      ...readJson(META_KEY, {}),
      ...extra,
    };
    safeSet(META_KEY, JSON.stringify(meta));
  }

  function syncProTokens() {
    const hub = readJson(HUB_KEY, {});
    const fromKey = parseInt(safeGet(TOKEN_KEY) || "0", 10) || 0;
    const fromHub = typeof hub.tokens === "number" ? hub.tokens : 0;
    const merged = Math.max(0, fromKey, fromHub);
    hub.tokens = merged;
    safeSet(TOKEN_KEY, String(merged));
    safeSet(HUB_KEY, JSON.stringify(hub));
    return merged;
  }

  function flushAll() {
    syncProTokens();

    gameSavers.forEach((fn, storageKey) => {
      try {
        const data = fn();
        if (data == null) return;
        safeSet(storageKey, typeof data === "string" ? data : JSON.stringify(data));
      } catch (_) {}
    });

    writeMeta({ flushedAt: Date.now() });
    queueCloudSave();
  }

  function registerGameSave(storageKey, getSnapshot) {
    if (!storageKey || typeof getSnapshot !== "function") return;
    gameSavers.set(storageKey, getSnapshot);
  }

  function registerGameReload(storageKey, reloadFn) {
    if (!storageKey || typeof reloadFn !== "function") return;
    gameReloaders.set(storageKey, reloadFn);
  }

  function onRestore(fn) {
    if (typeof fn !== "function") return;
    restoreListeners.push(fn);
  }

  function deferUntilRestored(fn) {
    if (typeof fn !== "function") return;
    whenReady.then(fn);
  }

  function queueCloudSave() {
    const name = playerName();
    if (!name || name === "Player") return;

    if (cloudSyncPromise) return;
    cloudSyncPromise = fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player: name, snapshot: collectLocalSnapshot() }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok) writeMeta({ cloudSavedAt: Date.now() });
      })
      .catch(() => {})
      .finally(() => {
        cloudSyncPromise = null;
      });
  }

  function restoreFromCloudIfNewer(force, explicitName) {
    const name = explicitName || resolvePlayerName();
    if (!name || name === "Player") return Promise.resolve(false);

    return fetch(`/api/progress?player=${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.snapshot) return false;
        persistNameFromSnapshot(data.snapshot);
        return applySnapshot(data.snapshot, { force: !!force });
      })
      .catch(() => false);
  }

  function restoreLatestBackup(force) {
    if (window.PRO_GAMES?.staticHost) return Promise.resolve(false);
    return fetch("/api/progress/latest")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.snapshot) return false;
        if (data.player) safeSet("becomeAProChatName", String(data.player).slice(0, 16));
        persistNameFromSnapshot(data.snapshot);
        return applySnapshot(data.snapshot, { force: !!force });
      })
      .catch(() => false);
  }

  function runInitialRestore() {
    const params = new URLSearchParams(window.location.search);
    const force = params.get("restore") === "1";
    const name = resolvePlayerName();

    const firstTry = (name && name !== "Player")
      ? restoreFromCloudIfNewer(force, name)
      : Promise.resolve(false);

    firstTry
      .then((restored) => {
        if (restored) return restored;
        if (window.PRO_GAMES?.staticHost) return false;
        return restoreLatestBackup(true);
      })
      .then((restored) => {
        if (restored) {
          syncProTokens();
          if (force) {
            try {
              params.delete("restore");
              const qs = params.toString();
              window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
            } catch (_) {}
          }
        }
        finishReady(restored);
      })
      .catch(() => finishReady(false));
  }

  function bindAutoSave() {
    window.addEventListener("pagehide", flushAll);
    window.addEventListener("beforeunload", flushAll);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushAll();
    });

    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(flushAll, FLUSH_INTERVAL_MS);
  }

  window.BecomeAProSave = {
    HUB_KEY,
    TOKEN_KEY,
    whenReady,
    syncProTokens,
    flushAll,
    registerGameSave,
    registerGameReload,
    onRestore,
    deferUntilRestored,
    collectLocalSnapshot,
    applySnapshot,
    restoreFromCloudIfNewer,
    restoreLatestBackup,
    resolvePlayerName,
    queueCloudSave,
    playerName,
  };

  syncProTokens();
  bindAutoSave();
  runInitialRestore();
})();
