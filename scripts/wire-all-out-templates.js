#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GAMES = path.join(ROOT, "games");

const catalogSrc = fs.readFileSync(path.join(ROOT, "all-out-games.js"), "utf8");
const catalog = eval(catalogSrc.match(/window\.ALL_OUT_GAMES\s*=\s*(\[[\s\S]*?\]);/)[1]);
const byId = Object.fromEntries(catalog.map((g) => [g.id, g]));

const WIRE = [
  { template: "buttons", games: ["100-buttons"], defaults: "BUTTONS_DEFAULTS", hud: `<span id="tier-display" class="stat-pill level-pill">🏔️ Tier 1</span><span id="chaos-display" class="stat-pill coin-pill">💥 0%</span><span id="pressed-display" class="stat-pill exp-pill">🔘 0/100</span><span id="best-display" class="stat-pill coin-pill">🏆 T0</span>`, extra: `<div id="button-grid" class="button-grid"></div>`, features: ["🔘 100 buttons per tier!", "💣 Avoid trap buttons!", "🏔️ Climb tiers for glory!", "👥 Last one standing wins!"], noJoystick: true },
];

function buildIndex(w) {
  const tpl = `../_templates/${w.template}/`;
  const joy = w.noJoystick ? "" : `<div class="joystick-wrap"><div id="joystick-base" class="joystick-base"><div id="joystick-knob" class="joystick-knob"></div></div></div>`;
  const captureExtra = w.isCapture ? `
      <button id="fight-btn" class="action-float hidden" type="button">Fight</button>
      <button id="boss-btn" class="action-float boss-float hidden" type="button">Boss</button>
      <button id="portal-btn" class="action-float portal-float hidden" type="button">Travel</button>
      <button id="feed-btn" class="action-float feed-float hidden" type="button">Feed</button>
      <button id="breed-btn" class="action-float breed-float hidden" type="button">Fuse</button>
      <button id="ride-btn" class="action-float ride-float hidden" type="button">Boost</button>
      <button id="pvp-btn" class="action-float pvp-float hidden" type="button">PvP</button>
      <div class="shop-stack"><button id="upgrade-btn" class="action-float upgrade-float" type="button">Shop</button><div id="leaderboard" class="leaderboard"></div></div>
      <nav id="zone-nav" class="zone-nav hidden"></nav>
      <div id="battle-overlay" class="overlay hidden"><div class="battle-arena"><p id="battle-banner" class="battle-banner"></p><div class="battle-hud"><div class="fighter you-side"><span id="battle-you-name"></span><div class="hp-bar-wrap"><div id="battle-you-hp" class="hp-bar"></div></div><span id="battle-you-hp-text"></span></div><span class="vs">VS</span><div class="fighter foe-side"><span id="battle-foe-name"></span><div class="hp-bar-wrap"><div id="battle-foe-hp" class="hp-bar foe"></div></div><span id="battle-foe-hp-text"></span></div></div><canvas id="battle-canvas" width="320" height="140"></canvas><p id="special-status" class="special-status hidden"></p><div class="battle-actions"><button id="attack-btn" class="battle-btn attack-btn" type="button">Attack</button><button id="special-btn" class="battle-btn special-btn hidden" type="button">Special</button><button id="flee-btn" class="battle-btn flee-btn" type="button">Run</button></div></div></div>
      <div id="upgrade-overlay" class="overlay hidden"><div class="panel monster-panel upgrade-panel"><h2>Shop</h2><p class="sub"></p><div id="upgrade-list" class="upgrade-list"></div><button id="upgrade-close-btn" class="small-btn" type="button">Back</button></div></div>` : "";
  const captureHud = w.isCapture ? `<span id="level-display" class="stat-pill level-pill">Lv 1</span><span id="exp-display" class="stat-pill exp-pill">✨ 0 / 50</span><span id="coin-display" class="stat-pill coin-pill">🪙 25</span>` : w.hud;
  const sprites = w.isCapture ? `${tpl}sprites.js` : (w.sprites || "../_templates/shared/sprites.js");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Game</title>
  <link rel="stylesheet" href="${tpl}style.css">
  <link rel="stylesheet" href="../../game-realism.css">
  <link rel="stylesheet" href="../_templates/base/all-out-base.css">
  <link rel="stylesheet" href="../../game-chat.css">
  <link rel="stylesheet" href="../../game-multiplayer.css">
</head>
<body>
  <div id="app">
    <header id="game-header">
      <button id="settings-btn" class="icon-btn" type="button" title="Settings">⚙️</button>
      <div class="hud-top">${captureHud}</div>
    </header>
    <div id="game-wrap">
      <canvas id="game-canvas"></canvas>
      <div id="start-overlay" class="overlay">
        <div class="panel monster-panel">
          <h1 id="game-title">Game</h1>
          <p id="game-tagline" class="tagline"></p>
          <ul class="feature-list" id="feature-list"></ul>
          <input id="name-input" type="text" maxlength="14" placeholder="Your name..." value="Player">
          <p class="pick-label">Pick your blob:</p>
          <div class="style-row">
            <button type="button" class="style-pick selected" data-style="cute">🔴 Red</button>
            <button type="button" class="style-pick" data-style="cool">🔵 Blue</button>
            <button type="button" class="style-pick" data-style="wild">🩵 Teal</button>
          </div>
          <button id="play-btn" class="big-btn">Play Now!</button>
          <p class="hint">🕹️ Joystick to move · Buttons on the right · WASD works too!</p>
        </div>
      </div>
      ${w.extra || ""}${captureExtra}
      ${joy}
      <div id="world-label" class="world-label"></div>
      <div id="toast" class="toast hidden"></div>
    </div>
  </div>
  <div id="settings-overlay" class="overlay fixed-overlay hidden">
    <div class="settings-box">
      <h2>⚙️ Settings</h2>
      <button id="leave-game-btn" class="big-btn leave-btn">🏠 Leave Game</button>
      <button id="close-settings-btn" class="small-btn">Close</button>
    </div>
  </div>
  <script src="${tpl}config-defaults.js"></script>
  <script src="config.js"></script>
  <script>
    (function () {
      const C = window.GAME_CONFIG;
      if (!C?.branding) return;
      document.title = C.branding.title || document.title;
      const t = document.getElementById("game-title");
      const g = document.getElementById("game-tagline");
      const p = document.getElementById("play-btn");
      if (t && C.branding.title) t.textContent = C.branding.title;
      if (g && C.branding.description) g.textContent = C.branding.description;
      if (p && C.branding.playBtn) p.textContent = C.branding.playBtn;
      if (C.features && document.getElementById("feature-list")) {
        document.getElementById("feature-list").innerHTML = C.features.map(function (f) { return "<li>" + f + "</li>"; }).join("");
      }
    })();
  </script>
  <script src="${sprites}"></script>
  <script src="../_templates/base/all-out-controls.js"></script>
  <script src="../_templates/base/all-out-easy.js"></script>
  <script src="../_templates/base/all-out-help.js"></script>
  <script src="${tpl}engine.js"></script>
  <script src="../../game-chat.js"></script>
  <script src="../../game-realism.js"></script>
  <script src="../_templates/base/game-realism-bootstrap.js"></script>
  <script src="../../game-multiplayer.js"></script>
  <script src="../_templates/base/game-mp-bootstrap.js"></script>
  <script>
    GameChat.init({
      room: window.GAME_CONFIG?.chatRoom || "game",
      getName: function () { var el = document.getElementById("name-input"); return el && el.value.trim() || undefined; },
    });
  </script>
</body>
</html>`;
}

function buildConfig(w, gameId) {
  const game = byId[gameId];
  const oldPath = path.join(GAMES, gameId, "config.js");
  let oldCfg = {};
  if (fs.existsSync(oldPath)) {
    try {
      const src = fs.readFileSync(oldPath, "utf8");
      const m = src.match(/window\.GAME_CONFIG\s*=\s*(\{[\s\S]*\});/);
      if (m) oldCfg = eval("(" + m[1] + ")");
    } catch (_) {}
  }

  if (w.isCapture) {
    const lines = [
      `window.GAME_CONFIG = Object.assign({}, window.${w.defaults}, {`,
      `  variant: "${w.variant || ""}",`,
      `  saveKey: "${gameId}",`,
      `  mpGame: "${gameId}",`,
      `  chatRoom: "${gameId}",`,
    ];
    ["zones", "mobTypes", "fusionRecipes", "gear", "loadingTips", "starterMob", "rareMobType", "specialGearId", "ui"].forEach((k) => {
      if (oldCfg[k] != null) lines.push(`  ${k}: ${JSON.stringify(oldCfg[k], null, 2).replace(/\n/g, "\n  ")},`);
    });
    lines.push(`  features: ${JSON.stringify(w.features, null, 2).replace(/\n/g, "\n  ")},`);
    lines.push(`  branding: ${JSON.stringify({ title: game.title, description: game.description, playBtn: "Play Now!" }, null, 2).replace(/\n/g, "\n  ")},`);
    lines.push("});");
    lines.push("");
    return lines.join("\n");
  }

  return `window.GAME_CONFIG = Object.assign({}, window.${w.defaults}, {
  variant: "${w.variant || ""}",
  saveKey: "${gameId}",
  mpGame: "${gameId}",
  chatRoom: "${gameId}",
  features: ${JSON.stringify(w.features, null, 2).replace(/\n/g, "\n  ")},
  branding: {
    title: ${JSON.stringify(game.title)},
    description: ${JSON.stringify(game.description)},
    playBtn: "Play Now!",
  },
});
`;
}

const wired = [];
WIRE.forEach((w) => {
  w.games.forEach((gameId) => {
    const dir = path.join(GAMES, gameId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildIndex(w));
    fs.writeFileSync(path.join(dir, "config.js"), buildConfig(w, gameId));
    wired.push(gameId);
    console.log("Wired", gameId, "->", w.template, w.variant || "");
  });
});

console.log("Done:", wired.length, "games wired");
