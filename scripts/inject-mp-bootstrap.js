#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GAMES = path.join(ROOT, "games");
const TAG = "game-mp-bootstrap.js";
const SNIPPET = '  <script src="{{BOOT}}"></script>';

function bootstrapPath(htmlFile) {
  const dir = path.dirname(htmlFile);
  const base = path.join(GAMES, "_templates", "base", TAG);
  return path.relative(dir, base).split(path.sep).join("/");
}

function injectFile(htmlFile) {
  let src = fs.readFileSync(htmlFile, "utf8");
  if (src.includes(TAG)) return false;

  const boot = bootstrapPath(htmlFile);
  const line = SNIPPET.replace("{{BOOT}}", boot);

  if (src.includes("game-multiplayer.js")) {
    src = src.replace(
      /(<script src="[^"]*game-multiplayer\.js"><\/script>)/,
      `$1\n${line}`,
    );
  } else {
    const chatMatch = src.match(/<script src="[^"]*game-chat\.js"><\/script>/);
    if (chatMatch) {
      src = src.replace(chatMatch[0], `${chatMatch[0]}\n  <script src="../../game-multiplayer.js"></script>\n${line}`);
      if (!src.includes("game-multiplayer.css")) {
        src = src.replace("</head>", '  <link rel="stylesheet" href="../../game-multiplayer.css">\n</head>');
      }
    } else {
      src = src.replace("</body>", `  <script src="../../game-multiplayer.js"></script>\n${line}\n</body>`);
      if (!src.includes("game-multiplayer.css")) {
        src = src.replace("</head>", '  <link rel="stylesheet" href="../../game-multiplayer.css">\n</head>');
      }
    }
  }

  fs.writeFileSync(htmlFile, src);
  return true;
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (name === "index.html") out.push(p);
  }
  return out;
}

let n = 0;
for (const file of walk(GAMES)) {
  if (injectFile(file)) {
    console.log("Injected:", path.relative(ROOT, file));
    n++;
  }
}

console.log("Done:", n, "files updated");
