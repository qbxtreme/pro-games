#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GAMES = path.join(ROOT, "games");
const TAG = "game-realism-bootstrap.js";
const CSS = "game-realism.css";
const JS = "game-realism.js";

function relBootstrap(htmlFile) {
  const dir = path.dirname(htmlFile);
  const base = path.join(GAMES, "_templates", "base", TAG);
  return path.relative(dir, base).split(path.sep).join("/");
}

function relAsset(htmlFile, file) {
  const dir = path.dirname(htmlFile);
  const base = path.join(ROOT, file);
  return path.relative(dir, base).split(path.sep).join("/");
}

function injectFile(htmlFile) {
  let src = fs.readFileSync(htmlFile, "utf8");
  let changed = false;
  const cssPath = relAsset(htmlFile, CSS);
  const jsPath = relAsset(htmlFile, JS);
  const bootPath = relBootstrap(htmlFile);

  if (!src.includes(CSS)) {
    src = src.replace("</head>", `  <link rel="stylesheet" href="${cssPath}">\n</head>`);
    changed = true;
  }

  if (!src.includes(JS)) {
    src = src.replace("</body>", `  <script src="${jsPath}"></script>\n</body>`);
    changed = true;
  }

  if (!src.includes(TAG)) {
    if (src.includes(JS)) {
      src = src.replace(
        new RegExp(`(<script src="[^"]*${JS.replace(".", "\\.")}"><\\/script>)`),
        `$1\n  <script src="${bootPath}"></script>`,
      );
    } else {
      src = src.replace("</body>", `  <script src="${bootPath}"></script>\n</body>`);
    }
    changed = true;
  }

  if (changed) fs.writeFileSync(htmlFile, src);
  return changed;
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
    console.log("Injected realism:", path.relative(ROOT, file));
    n++;
  }
}

const hubIndex = path.join(ROOT, "index.html");
if (fs.existsSync(hubIndex)) {
  let hub = fs.readFileSync(hubIndex, "utf8");
  if (!hub.includes("gr-enhanced")) {
    hub = hub.replace("<body>", '<body class="gr-enhanced">');
    fs.writeFileSync(hubIndex, hub);
    console.log("Updated hub body class");
    n++;
  }
}

console.log("Done:", n, "files updated");
