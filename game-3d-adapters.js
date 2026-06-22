(function () {
  "use strict";

  function call(fn) {
    return typeof fn === "function" ? fn() : null;
  }

  window.Game3DAdapters = {
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

    "steal-a-brainrot"() {
      return call(window.__stealABrainrot3D);
    },

    "steal-a-poop"() {
      return call(window.__stealAPoop3D);
    },

    generic(id) {
      if (!id) return null;
      const fn = window[`__${id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}3D`];
      return fn ? call(fn) : null;
    },
  };
})();
