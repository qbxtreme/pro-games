// Shared multiplayer client — HTTP sync (works with npm start)
(function () {
  const SYNC_MS = 120;
  const POLL_MS = 150;
  const NAME_KEY = "becomeAProChatName";
  const MAX_PLAYERS = 10;

  let playerId = null;
  let active = false;
  let game = "";
  let subroom = "default";
  let syncTimer = null;
  let pollTimer = null;
  let getStateFn = null;
  let getNameFn = null;
  let onPeersFn = null;
  let badgeEl = null;
  let badgeMounted = false;
  let online = false;
  let serverFull = false;

  function getPlayerName() {
    if (getNameFn) {
      const n = getNameFn();
      if (n && String(n).trim()) return String(n).trim().slice(0, 16);
    }
    try {
      return localStorage.getItem(NAME_KEY) || "Player";
    } catch (_) {
      return "Player";
    }
  }

  function mountBadgeNearSettings() {
    if (badgeMounted || !badgeEl) return;
    const btn = document.getElementById("settings-btn");
    if (!btn || btn.closest(".settings-mp-cluster")) return;

    const parent = btn.parentNode;
    if (!parent) return;

    const styles = window.getComputedStyle(btn);
    const cluster = document.createElement("div");
    cluster.className = "settings-mp-cluster";

    parent.insertBefore(cluster, btn);
    cluster.appendChild(btn);
    cluster.appendChild(badgeEl);

    if (styles.position === "fixed") {
      cluster.classList.add("settings-mp-cluster--fixed");
      cluster.style.top = styles.top;
      cluster.style.left = styles.left;
      if (styles.right !== "auto") cluster.style.right = styles.right;
    } else if (
      styles.position === "absolute" &&
      (styles.right === "0px" || parseFloat(styles.right) === 0)
    ) {
      cluster.classList.add("settings-mp-cluster--header-right");
    }

    badgeMounted = true;
  }

  function ensureBadge() {
    if (!badgeEl) {
      badgeEl = document.createElement("div");
      badgeEl.id = "mp-online-badge";
      badgeEl.className = "mp-online-badge hidden";
    }
    mountBadgeNearSettings();
    if (!badgeMounted && !badgeEl.parentNode) {
      document.body.appendChild(badgeEl);
    }
  }

  function updateBadge(count, full) {
    ensureBadge();
    if (!active) {
      badgeEl.classList.add("hidden");
      return;
    }
    badgeEl.classList.remove("hidden");
    const n = Math.max(1, count || 1);
    if (full || serverFull) {
      badgeEl.textContent = `👥 Room full`;
      badgeEl.classList.remove("mp-live");
      badgeEl.classList.add("mp-full");
    } else {
      badgeEl.classList.remove("mp-full");
      badgeEl.textContent = online
        ? (n > 1 ? `👥 ${n} online` : `👥 Multiplayer`)
        : `👥 Solo · offline mode`;
      badgeEl.classList.toggle("mp-live", online);
    }
  }

  async function api(path, body) {
    const res = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "mp api fail");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function join() {
    serverFull = false;
    const data = await api("/api/mp/join", {
      game,
      subroom,
      name: getPlayerName(),
    });
    playerId = data.id;
    online = true;
    updateBadge(data.count || 1, false);
  }

  async function syncState() {
    if (!playerId || !active || !getStateFn) return;
    try {
      await api("/api/mp/update", {
        id: playerId,
        subroom,
        state: getStateFn(),
      });
    } catch (_) {}
  }

  async function pollPeers() {
    if (!playerId || !active) return;
    try {
      const q = `/api/mp/peers?game=${encodeURIComponent(game)}&subroom=${encodeURIComponent(subroom)}&except=${encodeURIComponent(playerId)}`;
      const data = await api(q);
      online = true;
      serverFull = false;
      updateBadge(data.count || (data.peers?.length || 0) + 1, false);
      if (onPeersFn) onPeersFn(data.peers || [], data.count || 1);
    } catch (_) {
      online = false;
      if (onPeersFn) onPeersFn([], 1);
      updateBadge(1, false);
    }
  }

  function leave() {
    if (playerId) {
      const body = JSON.stringify({ id: playerId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/mp/leave", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/mp/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    }
    playerId = null;
    active = false;
    online = false;
    serverFull = false;
    clearInterval(syncTimer);
    clearInterval(pollTimer);
    syncTimer = null;
    pollTimer = null;
    if (badgeEl) badgeEl.classList.add("hidden");
  }

  window.GameMP = {
    init(opts = {}) {
      game = opts.game || "hub";
      subroom = opts.subroom || "default";
      getStateFn = opts.getState || null;
      getNameFn = opts.getName || null;
      onPeersFn = opts.onPeers || null;
      ensureBadge();
    },

    setSubroom(room) {
      subroom = room || "default";
      if (playerId && active) syncState();
    },

    async start() {
      leave();
      active = true;
      try {
        await join();
        await syncState();
        await pollPeers();
        syncTimer = setInterval(syncState, SYNC_MS);
        pollTimer = setInterval(pollPeers, POLL_MS);
      } catch (err) {
        online = false;
        if (err.data && err.data.full) {
          serverFull = true;
          updateBadge(err.data.count || MAX_PLAYERS, true);
        } else {
          updateBadge(1, false);
        }
        if (onPeersFn) onPeersFn([], 1);
      }
    },

    stop() {
      leave();
    },

    isOnline() {
      return online && active && !serverFull;
    },

    isFull() {
      return serverFull;
    },

    getMaxPlayers() {
      return MAX_PLAYERS;
    },

    getId() {
      return playerId;
    },
  };

  window.addEventListener("pagehide", () => leave());
})();
