/** Fallback 3D state for games without a custom __gameId3D hook. */
(function () {
  "use strict";

  function call(fn) {
    return typeof fn === "function" ? fn() : null;
  }

  function camel3D(id) {
    if (!id) return null;
    const fn = window[`__${id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}3D`];
    return fn ? call(fn) : null;
  }

  function readPlayer() {
    if (window.player && typeof window.player.x === "number") return window.player;
    if (window.state?.player && typeof window.state.player.x === "number") return window.state.player;
  if (window.you && typeof window.you.x === "number") return window.you;
    return null;
  }

  function cameraConfig() {
    const touch = window.ProGamesGraphics?.isTouchDevice?.();
    const cinematic = window.ProGamesGraphics?.getStyle?.()?.cinematic;
    const base = window.AllOutCamera?.standard3D({
      fov: touch ? 46 : cinematic ? 40 : 42,
      height: touch ? 13 : cinematic ? 14 : 12,
      distance: touch ? 12 : cinematic ? 13 : 11,
      fogFar: cinematic ? 280 : 220,
      lookAtY: 0.55,
      lerp: cinematic ? 0.08 : 0.12,
    });
    return base || { style: "fixed", height: 12, distance: 11, fov: 42, fogFar: 220, lookAtY: 0.55, lerp: 0.1 };
  }

  window.Game3DGeneric = function (gameId) {
    if (typeof window.getGame3DState === "function") {
      const custom = call(window.getGame3DState);
      if (custom) return custom;
    }

    const adapted = camel3D(gameId);
    if (adapted) return adapted;

    const player = readPlayer();
    if (!player) return null;

    const style = window.ProGamesGraphics?.getStyle?.() || {};
    const worldW = window.WORLD_W || 2400;
    const worldH = window.WORLD_H || 1800;
    const model = style.defaultPlayerModel || "brainrot";

    return {
      worldW,
      worldH,
      ground: style.groundColor || "#43a047",
      defaultModel: style.defaultEntityModel || model,
      camera: cameraConfig(),
      player: {
        x: player.x,
        y: player.y,
        facing: player.facing,
        rot: player.angle,
        model,
        color: player.color || "#42a5f5",
        scale: model === "brainrot" ? 0.55 : 0.58,
      },
      entities: [],
      props: [],
    };
  };
})();
