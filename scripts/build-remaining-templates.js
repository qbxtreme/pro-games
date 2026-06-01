#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TPL = path.join(ROOT, "games/_templates");
const GAMES = path.join(ROOT, "games");

function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return rel;
}

function htmlShell(opts) {
  const {
    title,
    css,
    hud,
    bodyExtra = "",
    scripts,
    chatRoom,
    features,
    tagline,
    playBtn = "Play Now!",
    hint = "👥 Multiplayer · Joystick · All Out style!",
  } = opts;
  const featHtml = (features || [])
    .map((f) => `<li>${f}</li>`)
    .join("\n            ");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>${title}</title>
  <link rel="stylesheet" href="${css}">
  <link rel="stylesheet" href="../../game-chat.css">
  <link rel="stylesheet" href="../../game-multiplayer.css">
</head>
<body>
  <div id="app">
    <header id="game-header">
      <button id="settings-btn" class="icon-btn" type="button" title="Settings">⚙️</button>
      <div class="hud-top">${hud}</div>
    </header>
    <div id="game-wrap">
      <canvas id="game-canvas"></canvas>
      <div id="start-overlay" class="overlay">
        <div class="panel monster-panel">
          <h1 id="game-title">${title}</h1>
          <p id="game-tagline" class="tagline">${tagline}</p>
          <ul class="feature-list" id="feature-list">
            ${featHtml}
          </ul>
          <input id="name-input" type="text" maxlength="14" placeholder="Your name..." value="Player">
          <p class="pick-label">Pick your blob:</p>
          <div class="style-row">
            <button type="button" class="style-pick selected" data-style="cute">🔴 Red</button>
            <button type="button" class="style-pick" data-style="cool">🔵 Blue</button>
            <button type="button" class="style-pick" data-style="wild">🩵 Teal</button>
          </div>
          <button id="play-btn" class="big-btn">${playBtn}</button>
          <p class="hint">${hint}</p>
        </div>
      </div>
      ${bodyExtra}
      <div class="joystick-wrap">
        <div id="joystick-base" class="joystick-base"><div id="joystick-knob" class="joystick-knob"></div></div>
      </div>
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
  ${scripts}
  <script src="../../game-chat.js"></script>
  <script src="../../game-multiplayer.js"></script>
  <script src="../_templates/base/game-mp-bootstrap.js"></script>
  <script>
    GameChat.init({
      room: window.GAME_CONFIG?.chatRoom || "${chatRoom}",
      getName: () => document.getElementById("name-input")?.value.trim() || undefined,
    });
  </script>
</body>
</html>`;
}

function gameIndex(template, game, extra = {}) {
  const cfgPath = `../_templates/${template}/`;
  const defaultsScript = extra.defaults
    ? `  <script src="${cfgPath}config-defaults.js"></script>\n`
    : "";
  const brandingScript = extra.brandingScript !== false
    ? `  <script>
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
        document.getElementById("feature-list").innerHTML = C.features.map((f) => "<li>" + f + "</li>").join("");
      }
    })();
  </script>\n`
    : "";
  const sprites = extra.sprites || "../_templates/shared/sprites.js";
  const bodyExtra = extra.bodyExtra || "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Game</title>
  <link rel="stylesheet" href="${cfgPath}style.css">
  <link rel="stylesheet" href="../../game-chat.css">
  <link rel="stylesheet" href="../../game-multiplayer.css">
</head>
<body>
  <div id="app">
    <header id="game-header">
      <button id="settings-btn" class="icon-btn" type="button" title="Settings">⚙️</button>
      <div class="hud-top">${extra.hud || ""}</div>
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
          <p class="hint">👥 Multiplayer · All Out style!</p>
        </div>
      </div>
      ${bodyExtra}
      <div class="joystick-wrap">
        <div id="joystick-base" class="joystick-base"><div id="joystick-knob" class="joystick-knob"></div></div>
      </div>
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
${defaultsScript}  <script src="config.js"></script>
${brandingScript}  <script src="${sprites}"></script>
  <script src="${cfgPath}engine.js"></script>
  <script src="../../game-chat.js"></script>
  <script src="../../game-multiplayer.js"></script>
  <script src="../_templates/base/game-mp-bootstrap.js"></script>
  <script>
    GameChat.init({
      room: window.GAME_CONFIG?.chatRoom || "${game.id}",
      getName: () => document.getElementById("name-input")?.value.trim() || undefined,
    });
  </script>
</body>
</html>`;
}

function thinConfig(template, game, overrides) {
  const base = overrides.defaultsGlobal || `${template.toUpperCase().replace(/-/g, "_")}_DEFAULTS`;
  const lines = [`window.GAME_CONFIG = Object.assign({}, window.${base}, {`];
  lines.push(`  variant: "${overrides.variant || ""}",`);
  lines.push(`  saveKey: "${game.id}",`);
  lines.push(`  mpGame: "${game.id}",`);
  lines.push(`  chatRoom: "${game.id}",`);
  if (overrides.extra) lines.push(overrides.extra);
  lines.push(`  features: ${JSON.stringify(overrides.features, null, 4).replace(/\n/g, "\n  ")},`);
  lines.push(`  branding: ${JSON.stringify(overrides.branding, null, 4).replace(/\n/g, "\n  ")},`);
  if (overrides.ui) {
    lines.push(`  ui: Object.assign({}, window.${base}.ui || {}, ${JSON.stringify(overrides.ui, null, 4).replace(/\n/g, "\n  ")}),`);
  }
  lines.push("});");
  lines.push("");
  return lines.join("\n");
}

// Load catalog descriptions
const catalogSrc = fs.readFileSync(path.join(ROOT, "all-out-games.js"), "utf8");
const catalog = eval(catalogSrc.match(/window\.ALL_OUT_GAMES\s*=\s*(\[[\s\S]*?\]);/)[1]);
const byId = Object.fromEntries(catalog.map((g) => [g.id, g]));

const WIRED = [];

function wireGame(template, gameId, opts = {}) {
  const game = byId[gameId];
  if (!game) return;
  const dir = path.join(GAMES, gameId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "config.js"), thinConfig(template, game, {
    variant: opts.variant,
    defaultsGlobal: opts.defaultsGlobal,
    features: opts.features || [
      "👥 Multiplayer with up to 8 players!",
      game.description,
      "🎮 Bright cartoon All Out style!",
      "💬 Chat with friends in-game!",
    ],
    branding: {
      title: game.title,
      description: game.description,
      playBtn: opts.playBtn || "Play Now!",
    },
    ui: opts.ui,
    extra: opts.extra,
  }));
  fs.writeFileSync(path.join(dir, "index.html"), gameIndex(template, game, opts.html || {}));
  WIRED.push(gameId);
}

// --- Template index HTML files ---
const created = [];

created.push(write("games/_templates/horror/index.html", htmlShell({
  title: "Horror Survival",
  css: "style.css",
  hud: `<span id="night-display" class="stat-pill level-pill">🌙 Night 1</span>
        <span id="power-display" class="stat-pill coin-pill">⚡ 100%</span>
        <span id="sanity-display" class="stat-pill exp-pill">🧠 100%</span>
        <span id="time-display" class="stat-pill coin-pill">🕐 12 AM</span>`,
  bodyExtra: `<button id="hide-btn" class="action-float hidden" type="button">🚪 Hide</button>
      <button id="use-btn" class="action-float hidden" type="button">📹 Cameras</button>
      <div class="shop-stack"><div id="leaderboard" class="leaderboard"></div></div>`,
  tagline: "Survive the night — manage power and hide from threats!",
  scripts: `<script src="config-defaults.js"></script>
  <script src="config.js"></script>
  <script src="../shared/sprites.js"></script>
  <script src="engine.js"></script>`,
  chatRoom: "horror",
})));

// Run wiring after engines exist - listed in main()

module.exports = { write, wireGame, WIRED, created, byId, gameIndex, thinConfig, htmlShell };

if (require.main === module) {
  console.log("Use build-remaining-templates.js as library from main builder");
}
