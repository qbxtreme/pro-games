(function () {
  "use strict";

  window.AllOutEasy = {
    apply(config) {
      if (!config || config.easyApplied) return config;
      const c = Object.assign({}, config);
      c.easyApplied = true;

      if (c.hazardTypes) {
        c.hazardTypes = c.hazardTypes.map((h) => ({
          ...h,
          speed: Math.round((h.speed || 100) * 0.72),
          dmg: Math.round((h.dmg || 10) * 0.55),
        }));
      }

      if (c.variants && typeof c.variants === "object") {
        const next = {};
        Object.keys(c.variants).forEach((k) => {
          const v = { ...c.variants[k] };
          if (v.nightLength) v.nightLength = Math.round(v.nightLength * 1.35);
          if (v.powerDrain) v.powerDrain = v.powerDrain * 0.65;
          if (v.sanityDrain) v.sanityDrain = v.sanityDrain * 0.6;
          if (v.threatCount) v.threatCount = Math.max(1, v.threatCount - 1);
          next[k] = v;
        });
        c.variants = next;
      }

      if (c.roundSeconds) c.roundSeconds = Math.round(c.roundSeconds * 1.25);
      if (c.seekTime) c.seekTime = Math.round(c.seekTime * 1.2);
      if (c.repairRate) c.repairRate = (c.repairRate || 1) * 1.4;
      if (c.spawnInterval) c.spawnInterval = (c.spawnInterval || 1) * 1.35;
      if (c.botAccuracy) c.botAccuracy = (c.botAccuracy || 0.5) * 0.75;
      if (c.zoneShrinkRate) c.zoneShrinkRate = (c.zoneShrinkRate || 1) * 0.7;

      c.playerHpBonus = (c.playerHpBonus || 0) + 25;
      c.captureRateBonus = (c.captureRateBonus || 0) + 0.15;
      c.coinBonus = (c.coinBonus || 0) + 0.2;

      return c;
    },
  };

  const wrapConfig = () => {
    if (window.GAME_CONFIG) {
      window.GAME_CONFIG = window.AllOutEasy.apply(window.GAME_CONFIG);
    }
  };

  wrapConfig();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wrapConfig);
  }
})();
