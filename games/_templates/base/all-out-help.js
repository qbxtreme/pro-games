(function () {
  "use strict";

  const HINTS = {
    default: "🕹️ Drag the joystick to move · Tap action buttons on the right · WASD works too!",
    shooter: "🕹️ Left stick = move · Right stick = aim · Tap FIRE to shoot!",
    murder: "🕹️ Walk with the joystick · Tap USE near clues · REPORT bodies you find!",
    horror: "🕹️ Move around · Tap HIDE when danger is close · Watch power & sanity!",
    tycoon: "🕹️ Walk to plots · Tap SHOP to buy · Upgrade for more income!",
    buttons: "👆 Tap safe buttons · Avoid traps · Climb tiers to win!",
    merge: "👆 Tap cells to merge · Spawn units · Defend against waves!",
    digging: "👆 Tap DIG to go deeper · Upgrade drill for faster digs!",
    sigma: "🕹️ Follow each mini-game rule on screen · Last one standing wins!",
    capture: "🕹️ Walk to wild mobs · Tap TRANQ to capture · Feed & breed at stations!",
    party: "🕹️ Joystick to move · Context buttons appear when you get close!",
    snake: "🕹️ Joystick or mouse to steer · Hold click / ⚡ to boost · WASD works too!",
    morush: "👆 Drag left & right · Pick green gates · Avoid red gates · Beat the boss!",
    brawlmod: "👊 Showdown! WASD move · 🔫 Shoot · A / ⚔️ Sirius sword · S = SUPER · T = Tranquilizer",
  };

  function detectFamily() {
    const path = location.pathname;
    if (path.includes("snake-io")) return "snake";
    if (path.includes("mo-rush")) return "morush";
    if (path.includes("brawl-stars-mod")) return "brawlmod";
    if (path.includes("gun") || path.includes("banner-battles") || path.includes("battlegrounds")) return "shooter";
    if (path.includes("murder") || path.includes("who-killed")) return "murder";
    if (path.includes("five-nights") || path.includes("mimicer") || path.includes("backrooms") || path.includes("99-nights") || path.includes("blood-rain") || path.includes("red-sun")) return "horror";
    if (path.includes("tycoon") || path.includes("millionaire") || path.includes("meme-zoo")) return "tycoon";
    if (path.includes("100-buttons")) return "buttons";
    if (path.includes("merge-zombie")) return "merge";
    if (path.includes("digging")) return "digging";
    if (path.includes("sigma")) return "sigma";
    if (path.includes("dino-park") || path.includes("fishermon") || path.includes("mob-battle") || path.includes("ant-army") || path.includes("brainrot") || path.includes("raise-a-monster")) return "capture";
    if (path.includes("infection") || path.includes("hide-and-seek") || path.includes("random-roles")) return "party";
    return "default";
  }

  function ensureHint() {
    const wrap = document.getElementById("game-wrap");
    if (!wrap || document.getElementById("ao-controls-hint")) return;
    const el = document.createElement("div");
    el.id = "ao-controls-hint";
    el.className = "ao-controls-hint hidden";
    el.textContent = HINTS[detectFamily()] || HINTS.default;
    wrap.appendChild(el);
  }

  function showHint() {
    const el = document.getElementById("ao-controls-hint");
    if (!el) return;
    el.classList.remove("hidden");
    clearTimeout(window.__aoHintTimer);
    window.__aoHintTimer = setTimeout(() => el.classList.add("hidden"), 5000);
  }

  function watchPlay() {
    const app = document.getElementById("app");
    if (!app) return;
    const obs = new MutationObserver(() => {
      if (app.classList.contains("playing")) showHint();
    });
    obs.observe(app, { attributes: true, attributeFilter: ["class"] });
    document.getElementById("play-btn")?.addEventListener("click", () => {
      setTimeout(showHint, 400);
    });
  }

  function init() {
    ensureHint();
    watchPlay();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
