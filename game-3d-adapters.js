(function () {
  "use strict";

  function call(fn) {
    return typeof fn === "function" ? fn() : null;
  }

  function ambientState(ground, model, color) {
    return {
      worldW: 2000,
      worldH: 2000,
      ground: ground || "#5a8f48",
      defaultModel: model || "trainer",
      player: { x: 1000, y: 1000, model: model || "trainer", color: color || "#42a5f5" },
      entities: [],
    };
  }

  window.Game3DAdapters = {
    "dragon-plains"() {
      return call(window.getGame3DState);
    },

    "snake-io"() {
      return call(window.__snakeIo3D);
    },

    "hungry-snake-worm"() {
      return call(window.__snakeIo3D);
    },

    "brawl-stars-mod"() {
      return call(window.__brawlStarsMod3D);
    },

    "mini-brawl-stars"() {
      return call(window.__miniBrawlStars3D);
    },

    "mob-battle"() {
      return call(window.__mobBattle3D);
    },

    fishermon() {
      return call(window.__fishermon3D);
    },

    "fat-simulator"() {
      return call(window.__fatSim3D);
    },

    "raise-a-monster"() {
      return call(window.__raiseMonster3D);
    },

    "murder-mystery"() {
      return call(window.__murder3D);
    },

    "save-a-brainrot"() {
      return call(window.__brainrot3D);
    },

    "100-buttons"() {
      return call(window.__buttons3D);
    },

    "strength-simulator"() {
      return call(window.__strengthSimulator3D);
    },

    "steal-a-brainrot"() {
      return call(window.__stealABrainrot3D);
    },

    generic(id) {
      const fn = window[`__${id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}3D`];
      if (fn) return call(fn);
      if (window.__brainrot3D) return call(window.__brainrot3D);
      if (window.__explorer3D) return call(window.__explorer3D);
      const app = document.getElementById("app");
      if (app?.classList.contains("playing")) {
        return ambientState("#7cb342", "trainer", "#ef5350");
      }
      return null;
    },
  };
})();
