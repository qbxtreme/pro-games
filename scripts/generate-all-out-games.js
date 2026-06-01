#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GAMES_DIR = path.join(ROOT, "games");

const EXISTING_FOLDERS = new Set([
  "fishermon",
  "raise-a-monster",
  "random-roles",
  "meme-car-race",
  "fat-simulator",
  "dragon-plains",
  "snake-io",
  "_all-out-explorer",
]);

const ID_TO_FOLDER = {
  "meme-car": "meme-car-race",
};

function loadCatalog() {
  const src = fs.readFileSync(path.join(ROOT, "all-out-games.js"), "utf8");
  const m = src.match(/window\.ALL_OUT_GAMES\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) throw new Error("Could not parse ALL_OUT_GAMES");
  return eval(m[1]);
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hsl(h, s, l) {
  return `hsl(${h % 360}, ${s}%, ${l}%)`;
}

function pickEmoji(title) {
  const m = title.match(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u);
  return m ? m[0] : "🎮";
}

function cleanTitle(title) {
  return title.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, "").trim();
}

function mobStat(i, tier) {
  const t = tier || 1;
  return {
    hp: Math.floor(35 + i * 8 + t * 12),
    atk: Math.floor(7 + i * 2 + t * 2),
    exp: Math.floor(12 + i * 4 + t * 5),
    coins: Math.floor(5 + i * 2 + t * 2),
    rx: 16 + (i % 4) * 4,
    ry: 14 + (i % 3) * 3,
  };
}

function buildMobTypes(gameId, title, palette) {
  const words = cleanTitle(title).split(/\s+/).filter((w) => w.length > 1);
  const names =
    words.length >= 4
      ? words
      : ["Scout", "Raider", "Guard", "Champion", "Elite", "Master", "Legend", "Mythic"];
  const emojis = ["⭐", "🔥", "💎", "🎯", "🛡️", "⚡", "🌟", "💥", "👾", "🦾", "🎪", "🎭", "🦑", "🛏️", "🧠"];
  const types = {};
  const keys = [];

  for (let i = 0; i < 16; i++) {
    const key = `mob${i}`;
    keys.push(key);
    const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : "");
    const s = mobStat(i, 1 + Math.floor(i / 5));
    types[key] = {
      name,
      emoji: emojis[i % emojis.length],
      color: palette[i % palette.length],
      kind: "unit",
      ...s,
    };
    if (i === 2) {
      types[key].evolve = "mobEvo0";
      types[key].evolveLv = 8;
    }
  }
  types.mobEvo0 = {
    name: `${names[0]} Prime`,
    emoji: emojis[0],
    color: palette[1],
    kind: "unit",
    ...mobStat(8, 3),
  };
  types.goldenRare = {
    name: `Golden ${names[0]}`,
    emoji: "⭐",
    color: "#ffd54f",
    kind: "unit",
    ...mobStat(6, 2),
    rare: true,
  };
  ["bossAlpha", "bossBeta", "bossGamma", "bossDelta", "bossOmega", "bossFinal"].forEach((k, i) => {
    types[k] = {
      name: `${names[i % names.length]} Boss`,
      emoji: i === 5 ? "👑" : emojis[(i + 3) % emojis.length],
      color: palette[(i + 2) % palette.length],
      kind: "boss",
      hp: 120 + i * 35,
      atk: 18 + i * 4,
      exp: 40 + i * 15,
      coins: 15 + i * 5,
      rx: 28 + i * 2,
      ry: 24 + i * 2,
      cursed: i === 3,
    };
  });
  types.fusionA = {
    name: `Fusion ${names[0]}`,
    emoji: "🧬",
    color: palette[2],
    kind: "fusion",
    ...mobStat(10, 3),
    hybrid: true,
  };
  types.fusionB = {
    name: `Fusion ${names[1] || "Pro"}`,
    emoji: "🧬",
    color: palette[4],
    kind: "fusion",
    ...mobStat(12, 3),
    hybrid: true,
  };
  return { types, starter: "mob0", rare: "goldenRare", keys };
}

function zoneSet(game, mobKeys, bossKeys, palette, h) {
  const home = game.tag === "Horror" ? "🏠 Safe Room" : game.tag === "RP" ? "🏙️ Downtown" : "🏠 Home Base";
  const decorByTag = {
    Horror: ["pier", "depths", "depths", "lava", "depths", "ice"],
    Party: ["pier", "park", "park", "grass", "forest", "rock"],
    PvP: ["pier", "ocean", "rock", "lava", "depths", "rock"],
    default: ["pier", "ocean", "coral", "lava", "depths", "ice"],
  };
  const decor = decorByTag[game.tag] || decorByTag.default;
  const zoneNames =
    game.tag === "Horror"
      ? ["", "🌑 Dark Hall", "👻 Haunted Wing", "🩸 Blood Floor", "🌀 Void", "❄️ Frozen Fear"]
      : game.tag === "Party"
        ? ["", "🎪 Main Stage", "🎭 Backstage", "🎉 Party Pit", "🌀 Wild Zone", "❄️ Chill Room"]
        : game.tag === "PvP"
          ? ["", "⚔️ Skirmish", "🏟️ Arena", "🔥 War Zone", "🌀 Deep Battle", "❄️ Ice Pit"]
          : ["", "🌍 Open Field", "🏝️ Outpost", "🌋 Hot Zone", "🌀 Depths", "❄️ Frost Land"];

  const zones = [
    {
      id: 0,
      name: home,
      mobLevel: 0,
      reqLevel: 1,
      isPier: true,
      floor: palette[0],
      floorAlt: palette[1],
      decor: decor[0],
      skyTop: hsl(h, 55, 45),
      skyBot: hsl(h + 30, 70, 75),
      mobs: [],
      bossColor: palette[2],
    },
  ];

  const wildGroups = [
    mobKeys.slice(0, 3),
    mobKeys.slice(3, 6),
    mobKeys.slice(6, 9),
    mobKeys.slice(9, 12),
    mobKeys.slice(12, 15),
  ];
  const levels = [1, 5, 10, 15, 20];
  const reqs = [1, 4, 8, 12, 16];

  wildGroups.forEach((mobs, i) => {
    zones.push({
      id: i + 1,
      name: zoneNames[i + 1],
      mobLevel: levels[i],
      reqLevel: reqs[i],
      floor: palette[(i + 1) % palette.length],
      floorAlt: palette[(i + 2) % palette.length],
      decor: decor[i + 1],
      skyTop: hsl(h + i * 20, 50, 40 + i * 3),
      skyBot: hsl(h + i * 25, 65, 70),
      mobs,
      bossType: bossKeys[i],
      bossColor: palette[(i + 3) % palette.length],
    });
  });

  zones.push({
    id: 6,
    name: "⚔️ Battle Bay",
    mobLevel: 0,
    reqLevel: 5,
    isPvp: true,
    floor: palette[3],
    floorAlt: palette[4],
    decor: "ocean",
    skyTop: hsl(h + 200, 45, 35),
    skyBot: hsl(h + 220, 55, 55),
    mobs: [],
    bossColor: "#880e4f",
  });

  return zones;
}

function buildConfig(game) {
  const h = hash(game.id);
  const palette = [0, 1, 2, 3, 4, 5].map((i) => hsl(h + i * 37, 55, 42 + (i % 3) * 8));
  const { types, starter, rare } = buildMobTypes(game.id, game.title, palette);
  const bossKeys = ["bossAlpha", "bossBeta", "bossGamma", "bossDelta", "bossOmega"];
  const zones = zoneSet(game, Object.keys(types).filter((k) => k.startsWith("mob") && k !== "mobEvo0"), bossKeys, palette, h);
  const emoji = pickEmoji(game.title);
  const unit = game.tag === "Party" ? "players" : game.tag === "Horror" ? "survivors" : "fighters";
  const shopName = game.tag === "Tycoon" ? "Upgrade Shop" : game.tag === "Sports" ? "Gear Shop" : "Pro Shop";

  return {
    saveKey: game.id,
    mpGame: game.id,
    chatRoom: game.id,
    starterMob: starter,
    rareMobType: rare,
    specialGearId: "special1",
    loadingTips: [
      game.description,
      `Explore every zone in ${cleanTitle(game.title)}!`,
      `Upgrade gear in the ${shopName} to get stronger!`,
      `Team up with friends — up to 8 players online!`,
      `Beat mythic bosses to unlock new worlds!`,
    ],
    zones,
    mobTypes: types,
    fusionRecipes: [
      { parents: ["mob0", "mob1"], result: "fusionA" },
      { parents: ["mob3", "mob4"], result: "fusionB" },
      { parents: ["fusionA", "mob0"], result: "fusionA" },
      { parents: ["fusionB", "mob3"], result: "fusionB" },
    ],
    gear: [
      { id: "gear1", name: "Pro Gear Mk1", emoji: "⚙️", desc: "+25% catch power!", cost: 60, catch: 0.25 },
      { id: "gear2", name: "Legend Gear", emoji: "⚙️", desc: "+50% catch power total", cost: 140, catch: 0.25, req: "gear1" },
      { id: "income1", name: "Snack Stand", emoji: "🍿", desc: "+2 base coins/sec", cost: 50, income: 2 },
      { id: "income2", name: "Mega Stand", emoji: "🏪", desc: "+4 base coins/sec", cost: 120, income: 4 },
      { id: "hp1", name: "Armor Pack", emoji: "🛡️", desc: "+20 max HP", cost: 80, hp: 20 },
      { id: "special1", name: "Power Move", emoji: "💥", desc: "Unlock special attack — 1 in 3 turns", cost: 150, special: true },
    ],
    ui: {
      fightBtn: game.tag === "Party" ? "🎯 PLAY!" : "⚔️ BATTLE!",
      bossBtn: "👑 MYTHIC!",
      portalBtn: "🌀 Travel",
      feedBtn: "🍖 Feed",
      breedBtn: "🧬 Fuse",
      rideBtn: game.tag === "Sports" ? "🏃 Sprint" : "🚀 Boost",
      pvpBtn: "⚔️ PvP!",
      shopBtn: `🛒 ${shopName}`,
      shopTitle: `🛒 ${shopName}`,
      shopSubtitle: `Buy upgrades and gear for ${cleanTitle(game.title)}!`,
      shopClose: "Back to Base",
      battleAttack: "⚔️ Attack",
      battleSpecial: "💥 Power Move",
      battleFlee: "🏃 Run",
      defaultName: "Player",
      starterNickname: "Buddy",
      trainerFallback: "Player",
      levelEmoji: emoji,
      leaderboardTitle: `${emoji} Top ${unit.charAt(0).toUpperCase() + unit.slice(1)}`,
      pierName: zones[0].name,
      pierIncome: "base income",
      feedStation: "🍖 Feed Station",
      fusionStation: "🧬 Fusion Lab",
      feedSuccess: "Fed your team! +{exp} EXP 🍖",
      breedNeedCoins: "Need {cost} coins to fuse! 🪙",
      breedSuccess: "Fused a {emoji} {name}! 🧬",
      rideOn: "Boost mode on! 🚀",
      rideOff: "Boost off.",
      buyReqFirst: "Buy Pro Gear Mk1 first!",
      buyOwned: "Owned",
      buyLocked: "Locked",
      bought: "Got {name}! {emoji}",
      playBtn: "Play Now!",
    },
    branding: {
      title: game.title,
      description: game.description,
      playBtn: "Play Now!",
    },
  };
}

function buildIndexHtml(game, config) {
  const title = game.title.replace(/</g, "&lt;");
  const desc = game.description.replace(/</g, "&lt;");
  const playBtn = config.branding.playBtn;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>${title}</title>
  <link rel="stylesheet" href="../_all-out-explorer/style.css">
  <link rel="stylesheet" href="../../game-chat.css">
  <link rel="stylesheet" href="../../game-multiplayer.css">
</head>
<body>
  <div id="app">
    <header id="game-header">
      <button id="settings-btn" class="icon-btn" type="button" title="Settings">⚙️</button>
      <div class="hud-top">
        <span id="level-display" class="stat-pill level-pill">Lv 1</span>
        <span id="exp-display" class="stat-pill exp-pill">✨ 0 / 50</span>
        <span id="coin-display" class="stat-pill coin-pill">🪙 25</span>
      </div>
    </header>
    <div id="game-wrap">
      <canvas id="game-canvas"></canvas>
      <div id="start-overlay" class="overlay">
        <div class="panel monster-panel">
          <h1>${title}</h1>
          <p class="tagline">${desc}</p>
          <ul class="feature-list">
            <li>👥 Multiplayer — walk around with up to 8 players!</li>
            <li>⚔️ Battle wild mobs, capture them, and level up!</li>
            <li>👑 Defeat mythic bosses to unlock new zones!</li>
            <li>🛒 Upgrade gear and dominate the leaderboard!</li>
          </ul>
          <input id="name-input" type="text" maxlength="14" placeholder="Your name..." value="Player">
          <p class="pick-label">Pick your blob:</p>
          <div class="style-row">
            <button type="button" class="style-pick selected" data-style="cute">🔴 Red</button>
            <button type="button" class="style-pick" data-style="cool">🔵 Blue</button>
            <button type="button" class="style-pick" data-style="wild">🩵 Teal</button>
          </div>
          <button id="play-btn" class="big-btn">${playBtn}</button>
          <p class="hint">👥 Multiplayer · Joystick to walk · All Out style!</p>
        </div>
      </div>
      <button id="fight-btn" class="action-float hidden" type="button">Fight</button>
      <button id="boss-btn" class="action-float boss-float hidden" type="button">Boss</button>
      <button id="portal-btn" class="action-float portal-float hidden" type="button">Travel</button>
      <button id="feed-btn" class="action-float feed-float hidden" type="button">Feed</button>
      <button id="breed-btn" class="action-float breed-float hidden" type="button">Fuse</button>
      <button id="ride-btn" class="action-float ride-float hidden" type="button">Boost</button>
      <button id="pvp-btn" class="action-float pvp-float hidden" type="button">PvP</button>
      <div class="shop-stack">
        <button id="upgrade-btn" class="action-float upgrade-float" type="button">Shop</button>
        <div id="leaderboard" class="leaderboard"></div>
      </div>
      <div class="joystick-wrap">
        <div id="joystick-base" class="joystick-base"><div id="joystick-knob" class="joystick-knob"></div></div>
      </div>
      <div id="world-label" class="world-label"></div>
      <div id="toast" class="toast hidden"></div>
    </div>
    <nav id="zone-nav" class="zone-nav hidden"></nav>
    <div id="battle-overlay" class="overlay hidden">
      <div class="battle-arena">
        <p id="battle-banner" class="battle-banner"></p>
        <div class="battle-hud">
          <div class="fighter you-side">
            <span id="battle-you-name"></span>
            <div class="hp-bar-wrap"><div id="battle-you-hp" class="hp-bar"></div></div>
            <span id="battle-you-hp-text"></span>
          </div>
          <span class="vs">VS</span>
          <div class="fighter foe-side">
            <span id="battle-foe-name"></span>
            <div class="hp-bar-wrap"><div id="battle-foe-hp" class="hp-bar foe"></div></div>
            <span id="battle-foe-hp-text"></span>
          </div>
        </div>
        <canvas id="battle-canvas" width="320" height="140"></canvas>
        <p id="special-status" class="special-status hidden"></p>
        <div class="battle-actions">
          <button id="attack-btn" class="battle-btn attack-btn" type="button">Attack</button>
          <button id="special-btn" class="battle-btn special-btn hidden" type="button">Special</button>
          <button id="flee-btn" class="battle-btn flee-btn" type="button">Run</button>
        </div>
      </div>
    </div>
    <div id="upgrade-overlay" class="overlay hidden">
      <div class="panel monster-panel upgrade-panel">
        <h2>Shop</h2>
        <p class="sub"></p>
        <div id="upgrade-list" class="upgrade-list"></div>
        <button id="upgrade-close-btn" class="small-btn" type="button">Back</button>
      </div>
    </div>
  </div>
  <div id="settings-overlay" class="overlay fixed-overlay hidden">
    <div class="settings-box">
      <h2>⚙️ Settings</h2>
      <button id="leave-game-btn" class="big-btn leave-btn">🏠 Leave Game</button>
      <button id="close-settings-btn" class="small-btn">Close</button>
    </div>
  </div>
  <script src="config.js"></script>
  <script src="../_all-out-explorer/sprites.js"></script>
  <script src="../_all-out-explorer/engine.js"></script>
  <script src="../../game-chat.js"></script>
  <script src="../../game-multiplayer.js"></script>
  <script src="../_templates/base/game-mp-bootstrap.js"></script>
  <script>
    GameChat.init({
      room: "${game.id}",
      getName: () => document.getElementById("name-input")?.value.trim() || undefined,
    });
  </script>
</body>
</html>`;
}

function main() {
  const catalog = loadCatalog();
  let created = 0;
  let skipped = 0;

  catalog.forEach((game) => {
    const folderName = ID_TO_FOLDER[game.id] || game.id;
    if (EXISTING_FOLDERS.has(folderName)) {
      skipped++;
      return;
    }
    const dir = path.join(GAMES_DIR, folderName);
    fs.mkdirSync(dir, { recursive: true });
    const config = buildConfig(game);
    fs.writeFileSync(path.join(dir, "config.js"), `window.GAME_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
    fs.writeFileSync(path.join(dir, "index.html"), buildIndexHtml(game, config));
    created++;
    console.log("Created", folderName);
  });

  console.log(`Done: ${created} generated, ${skipped} skipped (existing).`);
}

main();
