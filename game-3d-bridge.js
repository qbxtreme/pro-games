(function () {
  "use strict";

  const LEGACY_3D = new Set([
    "steal-a-poop",
    "steal-a-brainrot",
    "ranked-battling",
    "mini-brawl-stars",
    "brawl-stars-mod",
    "snake-io",
    "players",
    "escape-tsunami-brainrot",
  ]);

  function gameId() {
    const m = location.pathname.match(/games\/([^/]+)/);
    return m ? m[1] : "";
  }

  function touchPrefer2D() {
    if (window.__stealBrainrotPrefer2D === true) return true;
    if (window.__stealBrainrotPrefer2D === false) return false;
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const mobileUa = /iPad|iPhone|iPod|Android|Mobile/i.test(navigator.userAgent || "");
    return coarse || mobileUa || (navigator.maxTouchPoints > 1 && window.innerWidth < 1180);
  }

  function shouldUse3D(id) {
    if (window.ProGamesGraphics?.shouldUse3D) {
      return ProGamesGraphics.shouldUse3D(id);
    }
    if (id === "steal-a-brainrot" && touchPrefer2D()) return false;
    return LEGACY_3D.has(id);
  }

  function mount() {
    const id = gameId();
    if (!shouldUse3D(id) || !window.THREE || !window.Game3DCore) return;

    const wrap = document.getElementById("game-wrap") || document.getElementById("world-wrap");
    if (!wrap || document.getElementById("game3d-layer")) return;

    const layer = document.createElement("div");
    layer.id = "game3d-layer";
    wrap.insertBefore(layer, wrap.firstChild);

    if (!Game3DCore.init(layer)) return;

    const app = document.getElementById("app");
    let active = false;

    function tick() {
      const gid = gameId();
      const getter = window.getGame3DState || window.Game3DAdapters?.[gid];
      let state = getter ? getter() : null;
      if (!state && gid && window.Game3DAdapters?.generic) {
        state = Game3DAdapters.generic(gid);
      }
      if (state) {
        Game3DCore.syncState(state);
        const mode = Game3DCore.getRenderMode?.();
        const use3d = mode === "canvas" || mode === "entities";
        if (use3d && !active) {
          active = true;
          app?.classList.add("game-3d-active");
        } else if (!use3d && active) {
          active = false;
          app?.classList.remove("game-3d-active");
        }
      } else if (active) {
        active = false;
        app?.classList.remove("game-3d-active");
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener("resize", () => Game3DCore.resize());
    tick();
  }

  function boot() {
    if (document.querySelector('script[src*="three.min.js"]')) {
      if (window.THREE) mount();
      else window.addEventListener("load", mount);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
