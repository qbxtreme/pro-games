/**
 * Ensures every Pro Games page joins multiplayer when play starts.
 * Games with custom sync call GameMP.init themselves — bootstrap skips if already joined.
 */
(function () {
  "use strict";

  if (!window.BecomeAProSave) {
    const s = document.createElement("script");
    s.src = "/pro-save.js";
    s.async = false;
    document.head.appendChild(s);
  }

  if (!window.GameMP) return;

  const AUTO = "__bapMpAuto";

  function inferGameId() {
    if (window.GAME_CONFIG?.mpGame) return window.GAME_CONFIG.mpGame;
    if (window.GAME_CONFIG?.saveKey) return window.GAME_CONFIG.saveKey;
    const m = location.pathname.match(/\/games\/([^/]+)\//);
    return m ? m[1] : "game";
  }

  function playerName() {
    for (const id of ["name-input", "nickname-input"]) {
      const el = document.getElementById(id);
      if (el?.value?.trim()) return el.value.trim().slice(0, 16);
    }
    try {
      return localStorage.getItem("becomeAProChatName") || "Player";
    } catch (_) {
      return "Player";
    }
  }

  function subroom() {
    if (typeof window.getMpSubroom === "function") return window.getMpSubroom();
    if (window.GAME_CONFIG?.mpSubroom) return window.GAME_CONFIG.mpSubroom;
    if (typeof rankedMode === "boolean") return rankedMode ? "ranked" : "unranked";
    return "default";
  }

  function defaultState() {
    if (typeof window.getMpState === "function") return window.getMpState();
    if (typeof state !== "undefined" && state?.playerFx != null) {
      return {
        x: state.playerFx,
        y: state.playerFy,
        world: state.currentWorld,
      };
    }
    return { name: playerName(), t: Date.now() };
  }

  function startIfNeeded() {
    if (window[AUTO] === "custom") return;
    if (GameMP.getId && GameMP.getId()) return;

    GameMP.init({
      game: inferGameId(),
      subroom: subroom(),
      getName: playerName,
      getState: defaultState,
      onPeers(peers, count) {
        if (typeof window.onMpPeers === "function") window.onMpPeers(peers, count);
      },
    });
    window[AUTO] = "auto";
    GameMP.start();
  }

  function stopIfAuto() {
    if (window[AUTO] !== "auto") return;
    GameMP.stop();
    window[AUTO] = null;
  }

  window.markGameMpCustom = function () {
    window[AUTO] = "custom";
  };

  function bindPlayFlow() {
    const app = document.getElementById("app");
    if (app) {
      new MutationObserver(() => {
        if (app.classList.contains("playing")) startIfNeeded();
        else stopIfAuto();
      }).observe(app, { attributes: true, attributeFilter: ["class"] });
      if (app.classList.contains("playing")) startIfNeeded();
    }

    document.getElementById("play-btn")?.addEventListener("click", () => {
      setTimeout(startIfNeeded, 350);
    });

    const hub = document.getElementById("snake-main-hub");
    if (hub) {
      new MutationObserver(() => {
        if (hub.classList.contains("hidden")) startIfNeeded();
        else stopIfAuto();
      }).observe(hub, { attributes: true, attributeFilter: ["class"] });
    }

    if (document.body.classList.contains("world-play-mode")) startIfNeeded();
  }

  function bind() {
    bindPlayFlow();
    if (!document.getElementById("start-overlay") && !document.getElementById("snake-main-hub")) {
      setTimeout(startIfNeeded, 600);
    }
    if (document.body.classList.contains("world-play-mode")) startIfNeeded();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
