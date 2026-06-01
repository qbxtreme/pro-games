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
  let flushTimer = null;
  let cloudSyncPromise = null;

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

  function shouldSkipKey(key) {
    if (!key) return true;
    return SKIP_PREFIXES.some((prefix) => key.startsWith(prefix));
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

  function applySnapshot(snap, opts) {
    opts = opts || {};
    if (!snap || typeof snap !== "object") return false;

    const localMeta = readJson(META_KEY, {});
    const localAt = localMeta.cloudSavedAt || localMeta.savedAt || 0;
    const incomingAt = snap.savedAt || 0;
    if (!opts.force && incomingAt > 0 && localAt > incomingAt + 5000) {
      return false;
    }

    const localTokens = parseInt(safeGet(TOKEN_KEY) || "0", 10) || 0;
    const mergedTokens = Math.max(localTokens, snap.tokens || 0, snap.hub?.tokens || 0);

    safeSet(TOKEN_KEY, String(mergedTokens));

    if (snap.hub && typeof snap.hub === "object") {
      const hub = { ...snap.hub, tokens: mergedTokens };
      safeSet(HUB_KEY, JSON.stringify(hub));
    } else {
      const hub = readJson(HUB_KEY, {});
      hub.tokens = mergedTokens;
      safeSet(HUB_KEY, JSON.stringify(hub));
    }

    if (snap.games && typeof snap.games === "object") {
      Object.keys(snap.games).forEach((key) => {
        if (shouldSkipKey(key)) return;
        const val = snap.games[key];
        if (val == null) return;
        safeSet(key, typeof val === "string" ? val : JSON.stringify(val));
      });
    }

    writeMeta({ savedAt: Date.now(), cloudSavedAt: incomingAt || Date.now(), restored: true });
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

  function restoreFromCloudIfNewer() {
    const name = playerName();
    if (!name || name === "Player") return Promise.resolve(false);

    return fetch(`/api/progress?player=${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.snapshot) return false;
        return applySnapshot(data.snapshot);
      })
      .catch(() => false);
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
    syncProTokens,
    flushAll,
    registerGameSave,
    collectLocalSnapshot,
    applySnapshot,
    restoreFromCloudIfNewer,
    queueCloudSave,
    playerName,
  };

  syncProTokens();
  bindAutoSave();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      restoreFromCloudIfNewer().then((restored) => {
        if (restored) syncProTokens();
      });
    });
  } else {
    restoreFromCloudIfNewer().then((restored) => {
      if (restored) syncProTokens();
    });
  }
})();
