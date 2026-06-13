#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GAMES = path.join(ROOT, "games");
const SKIP = new Set(["ranked-battling", "_templates", "_all-out-explorer"]);

const LINKS = `
  <link rel="stylesheet" href="../../game-3d.css">`;

const SCRIPTS = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="../../game-3d-core.js"></script>
  <script src="../../game-3d-adapters.js"></script>
  <script src="../../game-3d-bridge.js"></script>`;

function depthToRoot(file) {
  const rel = path.relative(GAMES, path.dirname(file));
  const depth = rel.split(path.sep).filter(Boolean).length;
  return "../".repeat(depth + 1);
}

function inject(file) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("game-3d-bridge.js")) return false;

  const prefix = depthToRoot(file);
  const css = LINKS.replace(/\.\.\/\.\.\//g, prefix);
  const scripts = SCRIPTS.replace(/\.\.\/\.\.\//g, prefix);

  if (html.includes("game-realism.css")) {
    html = html.replace(
      /(<link rel="stylesheet" href="[^"]*game-realism\.css">)/,
      `$1${css}`
    );
  } else if (html.includes("</head>")) {
    html = html.replace("</head>", `${css}\n</head>`);
  }

  if (html.includes("game-chat.js")) {
    html = html.replace(
      /(<script src="[^"]*game-chat\.js"><\/script>)/,
      `${scripts}\n  $1`
    );
  } else {
    html = html.replace("</body>", `${scripts}\n</body>`);
  }

  fs.writeFileSync(file, html);
  return true;
}

function walk(dir) {
  let n = 0;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith("_")) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) n += walk(p);
    else if (name === "index.html") {
      if (inject(p)) {
        console.log("3D:", path.relative(ROOT, p));
        n++;
      }
    }
  }
  return n;
}

console.log(`Injected 3D into ${walk(GAMES)} games.`);
