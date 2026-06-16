(function () {
  "use strict";

  const SKIP = new Set(["ranked-battling", "brawl-stars-mod", "mini-brawl-stars"]);

  function gameId() {
    const m = location.pathname.match(/games\/([^/]+)/);
    return m ? m[1] : "";
  }

  function mount() {
    const id = gameId();
    if (SKIP.has(id) || !window.THREE || !window.Game3DCore) return;

    const wrap = document.getElementById("game-wrap") || document.getElementById("world-wrap");
    if (!wrap || document.getElementById("game3d-layer")) return;

    const layer = document.createElement("div");
    layer.id = "game3d-layer";
    wrap.insertBefore(layer, wrap.firstChild);

    if (!Game3DCore.init(layer)) return;

    const app = document.getElementById("app");
    let active = false;

    function tick() {
      const id = gameId();
      const getter = window.getGame3DState || window.Game3DAdapters?.[id];
      let state = getter ? getter() : null;
      if (!state && id && window.Game3DAdapters?.generic) {
        state = Game3DAdapters.generic(id);
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
