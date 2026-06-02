#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DIR = __dirname;

function read(name) {
  return fs.readFileSync(path.join(DIR, name), "utf8");
}

function write(name, content) {
  fs.writeFileSync(path.join(DIR, name), content);
}

function loadWindowScript(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(read(file), sandbox);
  return sandbox.window;
}

// ── Roster: ~half the brawlers, always keep starters ──
const fullRoster = loadWindowScript("brawlers-roster.js").BS_ROSTER;
const mustKeep = new Set(["shelly", "colt", "nita", "bull", "brock", "jessie", "dynamike"]);
const miniRoster = [];
fullRoster.forEach((b, i) => {
  if (i % 2 === 0 || mustKeep.has(b.id)) miniRoster.push(b);
});
const seen = new Set();
const deduped = miniRoster.filter((b) => {
  if (seen.has(b.id)) return false;
  seen.add(b.id);
  return true;
});
while (deduped.length > 52) deduped.pop();
mustKeep.forEach((id) => {
  if (!deduped.some((b) => b.id === id)) {
    const found = fullRoster.find((b) => b.id === id);
    if (found) deduped.push(found);
  }
});
write(
  "brawlers-roster.js",
  `// Mini Brawl Stars — ${deduped.length} brawlers (half of full mod roster)\nwindow.BS_ROSTER = ${JSON.stringify(deduped, null, 2)};\n`
);

const keepIds = new Set(deduped.map((b) => b.id));

// ── Attacks: filter PROFILES only, keep rest of BS_ATTACKS ──
const atkSrc = read("brawler-attacks.js");
const atkMod = loadWindowScript("brawler-attacks.js");
const miniProfiles = {};
Object.keys(atkMod.BS_ATTACKS.PROFILES).forEach((id) => {
  if (keepIds.has(id)) miniProfiles[id] = atkMod.BS_ATTACKS.PROFILES[id];
});
const profileLines = Object.entries(miniProfiles)
  .map(([id, p]) => `  "${id}": ${JSON.stringify(p)},`)
  .join("\n");
const tailStart = atkSrc.indexOf("BULLET_COLORS:");
if (tailStart < 0) throw new Error("BULLET_COLORS not found");
const tail = atkSrc.slice(tailStart);
write(
  "brawler-attacks.js",
  `// Mini Brawl Stars — attack profiles for ${Object.keys(miniProfiles).length} brawlers\nwindow.BS_ATTACKS = {\n  PROFILES: {\n${profileLines}\n  },\n  ${tail}`
);

// ── game.js patches ──
let game = read("game.js");

game = game.replace(/brawlStarsMod/g, "miniBrawlStars");
game = game.replace(/Brawl Stars Mod/g, "Mini Brawl Stars");
game = game.replace(/Brawl Stars World/g, "Mini Brawl World");
game = game.replace(/MOD v2/g, "MINI");

// Remove mega quests block
game = game.replace(
  /\n  const MEGA_QUESTS = \[[\s\S]*?\];\n/,
  "\n  const MEGA_QUESTS = [];\n"
);

// Half the game modes (keep core Showdown + popular 3v3)
const miniModes = [
  `{ id: "showdown-solo", name: "Showdown", emoji: "☠️", cat: "Showdown", desc: "Solo — be the last brawler standing.", match: "solo", toast: "Solo Showdown — every brawler for themselves!", win: "Last brawler standing!" }`,
  `{ id: "showdown-duo", name: "Duo Showdown", emoji: "👥", cat: "Showdown", desc: "Pair up — last duo alive wins.", match: "duo", toast: "Duo Showdown — stick with your teammate!", win: "Your duo wins!" }`,
  `{ id: "showdown-trio", name: "Trio Showdown", emoji: "🧑‍🤝‍🧑", cat: "Showdown", desc: "Teams of three — last squad wins.", match: "trio", toast: "Trio Showdown — protect your squad!", win: "Your trio wins!" }`,
  `{ id: "gem-grab", name: "Gem Grab", emoji: "💎", cat: "3v3", desc: "Collect 10 gems before the enemy team.", match: "solo", toast: "Gem Grab — knockouts drop gems!", win: "Gem Grab victory!" }`,
  `{ id: "brawl-ball", name: "Brawl Ball", emoji: "⚽", cat: "3v3", desc: "Score 2 goals in the enemy net.", match: "solo", toast: "Brawl Ball — shoot to score!", win: "GOOOAL! Brawl Ball win!" }`,
  `{ id: "bounty", name: "Bounty", emoji: "⭐", cat: "3v3", desc: "Collect stars from knockouts.", match: "solo", toast: "Bounty — stars for every KO!", win: "Bounty stars collected!" }`,
  `{ id: "heist", name: "Heist", emoji: "🔐", cat: "3v3", desc: "Break the enemy safe before they break yours.", match: "solo", toast: "Heist — crack the safe!", win: "Safe destroyed — Heist win!" }`,
  `{ id: "hot-zone", name: "Hot Zone", emoji: "🔥", cat: "3v3", desc: "Hold capture zones to fill the bar.", match: "solo", toast: "Hot Zone — control the zone!", win: "Hot Zone captured!" }`,
  `{ id: "knockout", name: "Knockout", emoji: "🎯", cat: "3v3", desc: "Best of 3 rounds — no respawns.", match: "solo", toast: "Knockout — one life only!", win: "Knockout round won!" }`,
  `{ id: "wipeout", name: "Wipeout", emoji: "💥", cat: "3v3", desc: "First team to 8 knockouts wins.", match: "solo", toast: "Wipeout — rack up KOs!", win: "Wipeout — 8 KOs!" }`,
  `{ id: "boss-fight", name: "Boss Fight", emoji: "🐉", cat: "Co-op PvE", desc: "Team up to beat the mega boss.", match: "solo", toast: "Boss Fight — defeat the boss!", win: "Boss Fight cleared!" }`,
];
game = game.replace(
  /const BS_GAME_MODES = \[[\s\S]*?\];/,
  `const BS_GAME_MODES = [\n    ${miniModes.join(",\n    ")},\n  ];`
);
game = game.replace(
  /const BS_GAME_CATEGORIES = \[[^\]]+\];/,
  'const BS_GAME_CATEGORIES = ["Showdown", "3v3", "Co-op PvE"];'
);

// Half the map presets
game = game.replace(
  /const MAP_PRESETS = \[[\s\S]*?\];/,
  `const MAP_PRESETS = [
    { id: "scatter", name: "Scattered Grove" },
    { id: "ring", name: "Stone Ring" },
    { id: "maze", name: "Bush Maze" },
    { id: "fortress", name: "Fortress Clash" },
  ];`
);

// Remove unused map layout builders
const layoutFns = [
  "buildIslandsLayout",
  "buildCanyonLayout",
  "buildCrossroadsLayout",
  "buildPitLayout",
  "buildGridLayout",
];
layoutFns.forEach((fn) => {
  const re = new RegExp(`\\n  function ${fn}\\(rnd\\) \\{[\\s\\S]*?\\n  \\}\\n`, "m");
  game = game.replace(re, "\n");
});

game = game.replace(
  /function buildLayout\(presetId, rnd\) \{[\s\S]*?\n  \}/,
  `function buildLayout(presetId, rnd) {
    if (presetId === "ring") buildRingLayout(rnd);
    else if (presetId === "maze") buildMazeLayout(rnd);
    else if (presetId === "fortress") buildFortressLayout(rnd);
    else buildScatterLayout(rnd);
  }`
);

game = game.replace(/game: "brawl-stars-mod"/g, 'game: "mini-brawl-stars"');
write("game.js", game);

// ── index.html ──
let html = read("index.html");
html = html.replace(/<title>Brawl Stars Mod<\/title>/, "<title>Mini Brawl Stars</title>");
html = html.replace(/MOD v2/g, "MINI");
html = html.replace(/STARS MOD/g, "MINI STARS");
html = html.replace(/Brawl Stars Mod/g, "Mini Brawl Stars");
html = html.replace(/GameChat\.init\(\{ room: "brawl-stars-mod" \}\)/, 'GameChat.init({ room: "mini-brawl-stars" })');
write("index.html", html);

// ── style.css header ──
let css = read("style.css");
if (!css.startsWith("/* Mini Brawl Stars")) {
  css = "/* Mini Brawl Stars — hub & arena (trimmed from Brawl Stars Mod) */\n" + css;
  write("style.css", css);
}

write(
  "README.md",
  `# Mini Brawl Stars

**Hub ID:** \`mini-brawl-stars\`  
**Path:** \`games/mini-brawl-stars/\`  
**Status:** Playable

A pocket-sized fork of **Brawl Stars Mod** — same hub, showdown, and modded game modes, with about half the code (fewer brawlers, modes, and maps). The full **Brawl Stars Mod** is unchanged.

## Play

\`\`\`bash
npm start
# http://localhost:8080/games/mini-brawl-stars/
\`\`\`

## What's included

- Brawl-style hub (Pass, Quests, Shop, brawler roster)
- Showdown (Solo / Duo / Trio) with shrinking poison
- 10 modded modes (Gem Grab, Brawl Ball, Bounty, Heist, Hot Zone, Knockout, Wipeout, Boss Fight)
- 4 arena map layouts
- ~${deduped.length} brawlers

## Rebuild trim from Mod

\`\`\`bash
cp ../brawl-stars-mod/{game.js,style.css,index.html,brawlers-roster.js,brawler-attacks.js} .
node build-mini.js
\`\`\`
`
);

console.log(`Mini Brawl Stars: ${deduped.length} brawlers, ${Object.keys(miniProfiles).length} attack profiles`);
