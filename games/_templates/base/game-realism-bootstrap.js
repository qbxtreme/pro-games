/**
 * Ensures every Pro Games page gets atmosphere + auto canvas grading when playing.
 * Games with custom postFrame call GameRealism.postFrame — auto hook skips that frame.
 */
(function () {
  "use strict";

  if (!window.GameRealism) return;

  GameRealism.installUI?.();
  if (!window.GR_DISABLE_AUTO) {
    GameRealism.setAutoEnabled?.(true);
  }

  if (typeof window.getGameRealismOpts !== "function") {
    window.getGameRealismOpts = function () {
      return undefined;
    };
  }
})();
