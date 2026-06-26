/** Hub-wide graphics style for every Pro Game. */
(function () {
  "use strict";

  const STORAGE_KEY = "proGamesGraphicsStyle";

  const STYLES = {
    "3d-roblox": {
      id: "3d-roblox",
      label: "3D Roblox-style",
      description: "Voxel BrainRot characters, 3D tracks & bases, fixed follow camera.",
      use3D: true,
      force3DOnTouch: true,
      defaultPlayerModel: "brainrot",
      defaultEntityModel: "brainrot",
      groundColor: "#43a047",
      cinematic: false,
    },
    "all-out-2d": {
      id: "all-out-2d",
      label: "All Out 2D cartoon",
      description: "Bright Comic Sans UI and hand-drawn top-down sprites.",
      use3D: false,
      force3DOnTouch: false,
      defaultPlayerModel: "trainer",
      defaultEntityModel: "mob",
      groundColor: "#7cb342",
      cinematic: false,
    },
    "cinematic-3d": {
      id: "cinematic-3d",
      label: "Cinematic 3D",
      description: "Full 3D worlds with lighting, fog, shadows & realism effects.",
      use3D: true,
      force3DOnTouch: true,
      defaultPlayerModel: "brainrot",
      defaultEntityModel: "dragon",
      groundColor: "#5a8f48",
      cinematic: true,
    },
    "sharp-2d": {
      id: "sharp-2d",
      label: "Sharp 2D performance",
      description: "Clean flat 2D canvas — fast on iPad and low-end devices.",
      use3D: false,
      force3DOnTouch: false,
      defaultPlayerModel: "trainer",
      defaultEntityModel: "mob",
      groundColor: "#43a047",
      cinematic: false,
    },
    "hybrid-auto": {
      id: "hybrid-auto",
      label: "Hybrid auto",
      description: "3D on desktop; crisp 2D portraits on phones & tablets.",
      use3D: true,
      force3DOnTouch: false,
      defaultPlayerModel: "brainrot",
      defaultEntityModel: "brainrot",
      groundColor: "#43a047",
      cinematic: false,
    },
  };

  const SKIP_3D_GAMES = new Set(["steal-a-poop"]);
  const ALWAYS_3D_GAMES = new Set(["steal-a-brainrot"]);

  function getStyleId() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && STYLES[saved]) return saved;
    } catch (_) {}
    return "3d-roblox";
  }

  function getStyle() {
    return STYLES[getStyleId()] || STYLES["3d-roblox"];
  }

  function setStyleId(id) {
    if (!STYLES[id]) return false;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (_) {}
    return true;
  }

  function isTouchDevice() {
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const mobileUa = /iPad|iPhone|iPod|Android|Mobile/i.test(navigator.userAgent || "");
    return coarse || mobileUa || (navigator.maxTouchPoints > 1 && window.innerWidth < 1180);
  }

  function shouldUse3D(gameId) {
    const style = getStyle();
    if (!gameId || SKIP_3D_GAMES.has(gameId)) return false;
    if (ALWAYS_3D_GAMES.has(gameId)) {
      return style.id !== "sharp-2d" && style.id !== "all-out-2d";
    }
    if (!style.use3D) return false;
    if (!style.force3DOnTouch && isTouchDevice()) return false;
    return true;
  }

  function listStyles() {
    return Object.values(STYLES);
  }

  window.ProGamesGraphics = {
    STORAGE_KEY,
    STYLES,
    getStyleId,
    getStyle,
    setStyleId,
    shouldUse3D,
    isTouchDevice,
    listStyles,
  };
})();
