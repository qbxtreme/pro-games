#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GAMES = path.join(ROOT, "games");
const SKIP = new Set(["steal-a-poop"]);

function depthToRoot(file) {
  const rel = path.relative(GAMES, path.dirname(file));
  const depth = rel.split(path.sep).filter(Boolean).length;
  return "../".repeat(depth + 1);
}

function brainrotModelsPrefix(file) {
  const rel = path.relative(GAMES, path.dirname(file));
  const depth = rel.split(path.sep).filter(Boolean).length;
  if (depth === 0) return "../steal-a-brainrot/";
  return "../".repeat(depth) + "steal-a-brainrot/";
}

function gameFolder(file) {
  return path.relative(GAMES, path.dirname(file)).split(path.sep)[0] || "";
}

function inject(file) {
  const folder = gameFolder(file);
  if (SKIP.has(folder)) return false;

  let html = fs.readFileSync(file, "utf8");
  if (html.includes("coming-soon.css") && !html.includes("id=\"game-canvas\"") && !html.includes("id=\"world-canvas\"")) {
    return false;
  }

  const prefix = depthToRoot(file);
  const brPrefix = brainrotModelsPrefix(file);
  let changed = false;

  if (!html.includes("game-3d.css")) {
    const css = `  <link rel="stylesheet" href="${prefix}game-3d.css">`;
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${css}\n</head>`);
      changed = true;
    }
  }

  const coreScripts = [
    `  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`,
    `  <script src="${brPrefix}brainrot-models.js"></script>`,
    `  <script src="${prefix}game-3d-dragon.js"></script>`,
    `  <script src="${prefix}game-3d-core.js"></script>`,
    `  <script src="${prefix}pro-games-graphics.js"></script>`,
    `  <script src="${prefix}game-3d-adapters.js"></script>`,
    `  <script src="${prefix}game-3d-generic.js"></script>`,
    `  <script src="${prefix}game-3d-bridge.js"></script>`,
  ];

  coreScripts.forEach((tag) => {
    const src = tag.match(/src="([^"]+)"/)[1];
    const base = src.split("/").pop();
    if (!html.includes(base)) {
      html = html.replace("</body>", `${tag}\n</body>`);
      changed = true;
    }
  });

  if (!html.includes("pro-games-graphics.js")) return false;

  if (changed) fs.writeFileSync(file, html);
  return changed;
}

function walk(dir) {
  let n = 0;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith("_")) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) n += walk(p);
    else if (name === "index.html" && inject(p)) {
      console.log("3D:", path.relative(ROOT, p));
      n++;
    }
  }
  return n;
}

console.log(`Updated 3D stack in ${walk(GAMES)} games.`);
