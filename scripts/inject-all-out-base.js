#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const GAMES = path.join(ROOT, "games");

const BASE_JS = ["all-out-controls.js", "all-out-easy.js", "all-out-help.js"];

function relBase(fromDir) {
  const rel = path.relative(GAMES, fromDir);
  const depth = rel.split(path.sep).filter(Boolean).length;
  return "../".repeat(Math.max(1, depth)) + "_templates/base/";
}

function injectHtml(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  const base = relBase(path.dirname(filePath));

  html = html.replace(/\s*<link rel="stylesheet" href="[^"]*all-out-base\.css">\s*/g, "\n");
  html = html.replace(/\s*<script src="[^"]*all-out-(controls|easy|help)\.js"><\/script>\s*/g, "");

  const cssLink = `  <link rel="stylesheet" href="${base}all-out-base.css">`;
  if (!html.includes("all-out-base.css")) {
    const styleMatch = html.match(/<link rel="stylesheet" href="[^"]+style\.css">/);
    if (styleMatch) {
      html = html.replace(styleMatch[0], styleMatch[0] + "\n" + cssLink);
    } else {
      html = html.replace("</head>", cssLink + "\n</head>");
    }
  }

  const baseScripts = BASE_JS.map((n) => `  <script src="${base}${n}"></script>`).join("\n");
  const mainScript = html.match(/<script src="[^"]+(engine\.js|game\.js|world\.js)"><\/script>/);
  if (mainScript && !html.includes("all-out-controls.js")) {
    html = html.replace(mainScript[0], baseScripts + "\n" + mainScript[0]);
  }

  html = html.replace(/><script/g, ">\n  <script");
  fs.writeFileSync(filePath, html);
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "base") continue;
      walk(full);
    } else if (name === "index.html") {
      injectHtml(full);
    }
  }
}

walk(GAMES);
console.log("Fixed All Out base injection order");
