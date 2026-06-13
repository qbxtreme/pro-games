/** Shared 3D state export helpers for Pro Games */
(function () {
  "use strict";

  window.Game3DHook = {
    mobBattle(player, state, running, mobs, zones) {
      window.__mobBattle3D = function () {
        if (!running || !player) return null;
        const zone = zones[state.zone] || zones[0];
        return {
          worldW: 2600,
          worldH: 1800,
          ground: zone.floor || "#7cb342",
          defaultModel: "trainer",
          player: {
            x: player.x,
            y: player.y,
            facing: player.facing,
            model: "trainer",
            color: state.style === "cool" ? "#42a5f5" : state.style === "wild" ? "#26a69a" : "#ef5350",
          },
          entities: (mobs || []).map((m, i) => ({
            id: m.id || `mob${i}`,
            x: m.x,
            y: m.y,
            model: "mob",
            color: m.color || "#ab47bc",
            scale: 0.7 + (m.level || 1) * 0.05,
          })),
        };
      };
    },

    fishermon(player, running, fish, worldW, worldH, ground) {
      window.__fishermon3D = function () {
        if (!running || !player) return null;
        return {
          worldW: worldW || 2400,
          worldH: worldH || 1800,
          ground: ground || "#4fc3f7",
          defaultModel: "fish",
          player: {
            x: player.x,
            y: player.y,
            facing: player.facing,
            model: "trainer",
            color: "#1565c0",
          },
          entities: (fish || []).map((f, i) => ({
            id: f.id || `fish${i}`,
            x: f.x,
            y: f.y,
            model: "fish",
            color: f.color || "#ff9800",
          })),
        };
      };
    },

    brawl(player, running, entities, worldW, worldH, ground, model) {
      const fn = function () {
        if (!running || !player) return null;
        return {
          worldW: worldW || 3000,
          worldH: worldH || 3000,
          ground: ground || "#7cb342",
          defaultModel: model || "brawler",
          player: {
            x: player.x,
            y: player.y,
            rot: player.angle || 0,
            model: model || "brawler",
            color: player.color || "#ef5350",
          },
          entities: (entities || []).map((e, i) => ({
            id: e.id || `ent${i}`,
            x: e.x,
            y: e.y,
            model: e.model || "brawler",
            color: e.color || "#78909c",
          })),
        };
      };
      return fn;
    },
  };
})();
