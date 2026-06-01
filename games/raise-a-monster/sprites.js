(function () {
  "use strict";

  const SKIN = "#f5d0b5";
  const HAIR = "#3e2723";
  /** World + battle draw scale for wild mobs (pet uses game monsterScale). */
  const MOB_SCALE_BASE = 1.18;
  const MOB_SCALE_PER_LEVEL = 0.048;
  const MOB_SCALE_LEVEL_CAP = 0.72;
  const BOSS_SCALE_BASE = 2.05;

  function shade(hex, amt) {
    if (!hex || hex.startsWith("rgb")) return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
    g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
    b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
    return `rgb(${r},${g},${b})`;
  }

  function hashSeed(s) {
    let h = 0;
    const str = String(s || 0);
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  const WORLD_CX = 900;
  const WORLD_CY = 1100;

  const BOSS_KIND_BY_DECOR = {
    mushroom: "fuzzy",
    forest: "fuzzy",
    candy: "rock",
    lava: "fire",
    beach: "bat",
    frost: "yeti",
    ice: "frost",
    crystal: "crystal",
    peak: "yeti",
    yard: "slime",
  };

  function islandDist(wx, wy, rx, ry) {
    const dx = (wx - WORLD_CX) / rx;
    const dy = (wy - WORLD_CY) / ry;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Soft filled shape (no thick cartoon outline). */
  function stickerStroke(ctx, drawFn) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    drawFn(false);
    ctx.restore();
  }

  function drawSoftShadow(ctx, x, y, rw, rh, alpha) {
    const a = alpha == null ? 0.32 : alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rw);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.55, `rgba(0,0,0,${a * 0.35})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rw, rh || rw * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackyardSky(ctx, w, h, camX, animT) {
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    g.addColorStop(0, "#7ec8f8");
    g.addColorStop(0.55, "#b8e4ff");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.55);

    for (let i = 0; i < 4; i++) {
      const cx = ((i * 210 + camX * 0.06 + animT * 8) % (w + 140)) - 70;
      const cy = 36 + (i % 2) * 28;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 42, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 28, cy + 4, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBackyardTile(ctx, sx, sy, tw, th, seed) {
    const g = ctx.createLinearGradient(sx, sy, sx, sy + th);
    g.addColorStop(0, "#8fd068");
    g.addColorStop(0.5, "#7cb342");
    g.addColorStop(1, "#689f38");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);

    if ((seed % 11) === 0) {
      ctx.strokeStyle = shade("#558b2f", 0.05);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const gx = sx + 8 + i * 14;
        ctx.beginPath();
        ctx.moveTo(gx, sy + th - 4);
        ctx.quadraticCurveTo(gx + 2, sy + th - 18, gx, sy + th - 26);
        ctx.stroke();
      }
    }
  }

  function drawBackyardProps(ctx, camX, camY, w, h, animT) {
    const houseX = 1180 - camX;
    const houseY = 180 - camY;
    if (houseX > -200 && houseX < w + 100) {
      ctx.fillStyle = "#d7ccc8";
      ctx.fillRect(houseX, houseY, 180, 120);
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.moveTo(houseX - 20, houseY + 10);
      ctx.lineTo(houseX + 90, houseY - 50);
      ctx.lineTo(houseX + 200, houseY + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#81d4fa";
      ctx.fillRect(houseX + 30, houseY + 35, 40, 35);
      ctx.fillRect(houseX + 100, houseY + 35, 40, 35);
    }

    const treeX = 220 - camX;
    const treeY = 260 - camY;
    if (treeX > -80 && treeX < w + 80) {
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(treeX, treeY, 18, 70);
      ctx.fillStyle = "#43a047";
      ctx.beginPath();
      ctx.arc(treeX + 9, treeY - 10, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#66bb6a";
      ctx.beginPath();
      ctx.arc(treeX - 10, treeY - 18, 24, 0, Math.PI * 2);
      ctx.arc(treeX + 28, treeY - 22, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let fx = 0; fx < 14; fx++) {
      const px = 60 + fx * 120 - camX;
      const py = 420 - camY;
      if (px < -40 || px > w + 40) continue;
      ctx.fillStyle = "#424242";
      ctx.fillRect(px, py, 8, 55);
      ctx.fillRect(px - 2, py + 48, 12, 8);
      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.moveTo(px - 4, py + 8);
      ctx.lineTo(px + 4, py - 6);
      ctx.lineTo(px + 12, py + 8);
      ctx.closePath();
      ctx.fill();
    }

    const patioX = 760 - camX;
    const patioY = 560 - camY;
    ctx.fillStyle = "#9e9e9e";
    ctx.fillRect(patioX, patioY, 320, 140);
    ctx.fillStyle = "#757575";
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        if ((r + c) % 2) continue;
        ctx.fillRect(patioX + c * 46 + 4, patioY + r * 34 + 4, 40, 28);
      }
    }
  }

  function drawFeedBowl(ctx, x, y, animT, highlight) {
    drawSoftShadow(ctx, x, y + 20, 40, 11, 0.38);
    const bowlG = ctx.createLinearGradient(x - 30, y - 8, x + 30, y + 14);
    bowlG.addColorStop(0, "#bdbdbd");
    bowlG.addColorStop(0.4, "#eeeeee");
    bowlG.addColorStop(1, "#9e9e9e");
    ctx.fillStyle = bowlG;
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 36, 13, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#757575";
    ctx.beginPath();
    ctx.ellipse(x, y, 32, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bowlG;
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!highlight) {
      const foodG = ctx.createRadialGradient(x, y + 4, 2, x, y + 4, 24);
      foodG.addColorStop(0, "#ffb74d");
      foodG.addColorStop(1, "#e65100");
      ctx.fillStyle = foodG;
      ctx.beginPath();
      ctx.ellipse(x, y + 3, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? "#ffcc80" : "#ffa726";
        ctx.beginPath();
        ctx.arc(x - 14 + i * 5, y + 2 + Math.sin(animT * 3 + i) * 1.2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (highlight) {
      ctx.strokeStyle = `rgba(255,235,59,${0.75 + Math.sin(animT * 5) * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, y, 40, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawCaretaker(ctx, x, y, facing, animT, opts) {
    opts = opts || {};
    const walk = opts.walk ? Math.sin(animT * 10) * 2 : 0;
    const feed = opts.feeding ? Math.sin(animT * 12) * 0.08 : 0;
    const legSwing = opts.walk ? Math.sin(animT * 10) * 5 : 0;
    const jacket = { cute: "#00897b", cool: "#1565c0", wild: "#558b2f" }[opts.style] || "#00897b";
    const pants = "#37474f";

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    ctx.rotate(feed);
    drawSoftShadow(ctx, 0, 24, 20, 7, 0.38);

    const drawLimb = (lx, ly, w, h, rot, fill) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, shade(fill, 0.08));
      g.addColorStop(1, shade(fill, -0.12));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.3);
      ctx.fill();
      ctx.restore();
    };

    drawLimb(-4 + legSwing * 0.3, 14, 5, 11, legSwing * 0.06, pants);
    drawLimb(5 - legSwing * 0.3, 14, 5, 11, -legSwing * 0.06, pants);
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.ellipse(-4 + legSwing * 0.3, 20, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(5 - legSwing * 0.3, 20, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const torsoG = ctx.createLinearGradient(-10, -4, 10, 14);
    torsoG.addColorStop(0, shade(jacket, 0.12));
    torsoG.addColorStop(0.5, jacket);
    torsoG.addColorStop(1, shade(jacket, -0.18));
    ctx.fillStyle = torsoG;
    ctx.beginPath();
    ctx.moveTo(-11, -2);
    ctx.lineTo(-10, 12);
    ctx.lineTo(10, 12);
    ctx.lineTo(11, -2);
    ctx.quadraticCurveTo(0, -6, -11, -2);
    ctx.closePath();
    ctx.fill();

    drawLimb(-11, 2, 4, 9, -0.3, shade(jacket, -0.05));
    drawLimb(11, 2, 4, 9, 0.3, shade(jacket, -0.05));
    ctx.fillStyle = shade(SKIN, -0.05);
    ctx.beginPath();
    ctx.arc(-11, 8, 2.5, 0, Math.PI * 2);
    ctx.arc(11, 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shade(SKIN, -0.05);
    ctx.fillRect(-2.5, -10, 5, 4);
    const headG = ctx.createRadialGradient(-2, -14, 1, 0, -12, 9);
    headG.addColorStop(0, shade(SKIN, 0.1));
    headG.addColorStop(1, shade(SKIN, -0.12));
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.ellipse(0, -12, 7.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(0, -14.5, 8, 5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#fafafa";
    ctx.beginPath();
    ctx.ellipse(-2.5, -12.5, 2, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(2.5, -12.5, 2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(-2.3, -12.3, 1.1, 0, Math.PI * 2);
    ctx.arc(2.7, -12.3, 1.1, 0, Math.PI * 2);
    ctx.fill();

    if (opts.feeding || opts.holdSpoon) {
      drawSpoon(ctx, 22, -6, animT, true);
    }

    ctx.restore();
  }

  function drawSpoon(ctx, x, y, animT, withFood) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.35 + Math.sin(animT * 8) * 0.06);
    const metalG = ctx.createLinearGradient(-6, -20, 6, 20);
    metalG.addColorStop(0, "#eceff1");
    metalG.addColorStop(0.5, "#9e9e9e");
    metalG.addColorStop(1, "#757575");
    ctx.fillStyle = metalG;
    ctx.beginPath();
    ctx.ellipse(0, -22, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-3.5, -8, 7, 32);
    if (withFood) {
      ctx.fillStyle = "#ff9800";
      ctx.beginPath();
      ctx.arc(0, -24, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb74d";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(-10 + i * 4, -30 + (i % 2) * 3, 3, 3);
      }
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 6; i++) {
        const a = animT * 4 + i;
        ctx.fillRect(Math.cos(a) * 18, -24 + Math.sin(a) * 12, 2, 2);
      }
    }
    ctx.restore();
  }

  function beginMonsterDraw(ctx, x, y, scale, animT, opts) {
    const sc = scale * (opts.facing || 1);
    const bounce = Math.sin(animT * 5 + (opts.seed || 0) * 0.1) * (opts.happy ? 3 : 1.5);
    const munch = opts.munch ? Math.sin(animT * 16) * 0.08 : 0;
    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.scale(Math.abs(sc), scale);
    ctx.rotate(munch);
    drawSoftShadow(ctx, 0, 38 * scale, 36 * scale, 12 * scale);
    return { sc, scale };
  }

  function drawMonsterEyes(ctx, angry) {
    if (angry) {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(-6, -2);
      ctx.moveTo(14, -6);
      ctx.lineTo(6, -2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-10, -4, 8, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(12, -4, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-8, -2, 3, 0, Math.PI * 2);
    ctx.arc(14, -2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMonsterUpgrades(ctx, animT, opts) {
    if (opts.upgrades && opts.upgrades.includes("horns")) {
      ctx.fillStyle = "#7e57c2";
      ctx.beginPath();
      ctx.moveTo(-12, -28);
      ctx.lineTo(-16, -44);
      ctx.lineTo(-6, -30);
      ctx.moveTo(12, -28);
      ctx.lineTo(16, -44);
      ctx.lineTo(6, -30);
      ctx.fill();
    }
    if (opts.upgrades && opts.upgrades.includes("crown")) {
      ctx.fillStyle = "#ffd54f";
      ctx.beginPath();
      ctx.moveTo(-16, -34);
      ctx.lineTo(-10, -48);
      ctx.lineTo(-4, -36);
      ctx.lineTo(0, -50);
      ctx.lineTo(4, -36);
      ctx.lineTo(10, -48);
      ctx.lineTo(16, -34);
      ctx.closePath();
      ctx.fill();
    }
    if (opts.upgrades && opts.upgrades.includes("aura")) {
      ctx.strokeStyle = `rgba(255,215,64,${0.45 + Math.sin(animT * 4) * 0.15})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 46, 40, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawPetMonster(ctx, x, y, scale, animT, opts) {
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    const bodyG = ctx.createRadialGradient(-8, -8, 4, 0, 0, 38);
    bodyG.addColorStop(0, "rgba(255,255,255,0.98)");
    bodyG.addColorStop(0.55, "rgba(250,250,250,0.95)");
    bodyG.addColorStop(1, "rgba(220,220,220,0.9)");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(-34, -10);
    ctx.quadraticCurveTo(-38, -34, -18, -42);
    ctx.lineTo(18, -42);
    ctx.quadraticCurveTo(38, -34, 34, -10);
    ctx.quadraticCurveTo(36, 18, 0, 24);
    ctx.quadraticCurveTo(-36, 18, -34, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(-28, -36, 10, 28, -0.25, 0, Math.PI * 2);
    ctx.ellipse(28, -36, 10, 28, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const bellyG = ctx.createRadialGradient(0, 0, 2, 0, -2, 22);
    bellyG.addColorStop(0, "#fce4ec");
    bellyG.addColorStop(1, "#f48fb1");
    ctx.fillStyle = bellyG;
    ctx.beginPath();
    ctx.ellipse(0, -2, 24, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    drawMonsterEyes(ctx, false);
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.moveTo(-14, 10);
    ctx.lineTo(-8, 16);
    ctx.lineTo(-2, 10);
    ctx.lineTo(4, 16);
    ctx.lineTo(10, 10);
    ctx.lineTo(16, 16);
    ctx.lineTo(20, 10);
    ctx.fill();
    ctx.fillStyle = "#ec407a";
    ctx.beginPath();
    ctx.ellipse(18, 12, 8, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    const bibG = ctx.createLinearGradient(-18, 8, 18, 24);
    bibG.addColorStop(0, "#81d4fa");
    bibG.addColorStop(1, "#4fc3f7");
    ctx.fillStyle = bibG;
    ctx.beginPath();
    ctx.moveTo(-20, 8);
    ctx.lineTo(20, 8);
    ctx.lineTo(18, 24);
    ctx.lineTo(-18, 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#ff9800";
    ctx.fillRect(-4, 14, 8, 10);
    ctx.fillStyle = "#43a047";
    ctx.fillRect(-3, 10, 6, 5);
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawSlimeMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#9575cd";
    const wobble = Math.sin(animT * 6) * 3;
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : shade(c, 0.1);
      ctx.beginPath();
      ctx.moveTo(-30 + wobble * 0.2, 8);
      ctx.quadraticCurveTo(-34, -28, 0, -32);
      ctx.quadraticCurveTo(34, -28, 30 - wobble * 0.2, 8);
      ctx.quadraticCurveTo(32, 26, 0, 28 + wobble * 0.3);
      ctx.quadraticCurveTo(-32, 26, -30 + wobble * 0.2, 8);
      fn();
    });
    const g = ctx.createRadialGradient(-8, -8, 4, 0, 0, 28);
    g.addColorStop(0, shade(c, 0.25));
    g.addColorStop(0.6, c);
    g.addColorStop(1, shade(c, -0.2));
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(-10, -10, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    drawMonsterEyes(ctx, !opts.happy);
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawFuzzyMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#f48fb1";
    const h = hashSeed(opts.seed || "fuzzy");
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + animT * 0.02;
      const r = 26 + (h % 5);
      stickerStroke(ctx, (strokeOnly) => {
        const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
        ctx.fillStyle = strokeOnly ? "transparent" : shade(c, ((i % 3) - 1) * 0.08);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.85 - 4, 10, 0, Math.PI * 2);
        fn();
      });
    }
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : c;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      fn();
    });
    drawMonsterEyes(ctx, !opts.happy);
    ctx.fillStyle = shade(c, -0.15);
    ctx.beginPath();
    ctx.ellipse(0, 8, 10, 6, 0, 0, Math.PI);
    ctx.fill();
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawRockMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#90a4ae";
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : shade(c, -0.05);
      ctx.beginPath();
      ctx.moveTo(-28, 12);
      ctx.lineTo(-22, -24);
      ctx.lineTo(-8, -30);
      ctx.lineTo(10, -28);
      ctx.lineTo(26, -18);
      ctx.lineTo(30, 14);
      ctx.lineTo(12, 26);
      ctx.lineTo(-14, 24);
      ctx.closePath();
      fn();
    });
    ctx.strokeStyle = shade(c, -0.25);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-18 + i * 10, -20);
      ctx.lineTo(-14 + i * 10, 16);
      ctx.stroke();
    }
    drawMonsterEyes(ctx, true);
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawFireMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#ff7043";
    const flicker = Math.sin(animT * 14) * 4;
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      const g = ctx.createLinearGradient(0, 20, 0, -40 - flicker);
      g.addColorStop(0, strokeOnly ? "transparent" : "#ffeb3b");
      g.addColorStop(0.4, strokeOnly ? "transparent" : c);
      g.addColorStop(1, strokeOnly ? "transparent" : shade(c, -0.2));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.lineTo(-22, 8);
      ctx.lineTo(-14, -20 - flicker);
      ctx.lineTo(0, -36 - flicker);
      ctx.lineTo(14, -20 - flicker);
      ctx.lineTo(22, 8);
      ctx.closePath();
      fn();
    });
    ctx.fillStyle = `rgba(255,235,59,${0.5 + Math.sin(animT * 10) * 0.2})`;
    ctx.beginPath();
    ctx.arc(0, -8, 10, 0, Math.PI * 2);
    ctx.fill();
    drawMonsterEyes(ctx, true);
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawBatMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#5d4037";
    const flap = Math.sin(animT * 12) * 0.15;
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : shade(c, 0.05);
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.lineTo(-38, -18 + flap * 20);
      ctx.lineTo(-28, 4);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      fn();
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.lineTo(38, -18 + flap * 20);
      ctx.lineTo(28, 4);
      ctx.lineTo(12, 8);
      ctx.closePath();
      fn();
    });
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : c;
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 16, 0, 0, Math.PI * 2);
      fn();
    });
    drawMonsterEyes(ctx, true);
    ctx.fillStyle = shade(c, -0.2);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-4, 16);
    ctx.lineTo(4, 16);
    ctx.closePath();
    ctx.fill();
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawFrostMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#4fc3f7";
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : shade(c, 0.12);
      ctx.beginPath();
      ctx.ellipse(0, 2, 30, 26, 0, 0, Math.PI * 2);
      fn();
    });
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 10 - 8);
      ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 22 - 18);
      ctx.lineTo(Math.cos(a + 0.25) * 14, Math.sin(a + 0.25) * 12 - 10);
      ctx.closePath();
      ctx.fill();
    }
    drawMonsterEyes(ctx, false);
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawCrystalMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#7e57c2";
    const pulse = Math.sin(animT * 5) * 2;
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : shade(c, 0.1);
      ctx.beginPath();
      ctx.moveTo(0, -32 - pulse);
      ctx.lineTo(22, 0);
      ctx.lineTo(14, 28);
      ctx.lineTo(-14, 28);
      ctx.lineTo(-22, 0);
      ctx.closePath();
      fn();
    });
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.lineTo(0, -8);
    ctx.lineTo(6, -18);
    ctx.fill();
    drawMonsterEyes(ctx, !opts.happy);
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  function drawYetiMonster(ctx, x, y, scale, animT, opts) {
    const c = opts.color || "#eceff1";
    beginMonsterDraw(ctx, x, y, scale, animT, opts);
    stickerStroke(ctx, (strokeOnly) => {
      const fn = strokeOnly ? ctx.stroke.bind(ctx) : ctx.fill.bind(ctx);
      ctx.fillStyle = strokeOnly ? "transparent" : c;
      ctx.beginPath();
      ctx.ellipse(0, 4, 32, 30, 0, 0, Math.PI * 2);
      fn();
      ctx.beginPath();
      ctx.ellipse(0, -18, 26, 22, 0, 0, Math.PI * 2);
      fn();
    });
    ctx.fillStyle = shade(c, -0.12);
    ctx.beginPath();
    ctx.ellipse(0, 6, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    drawMonsterEyes(ctx, false);
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(c, -0.2);
    ctx.beginPath();
    ctx.moveTo(-10, -32);
    ctx.lineTo(-6, -22);
    ctx.lineTo(-14, -24);
    ctx.moveTo(10, -32);
    ctx.lineTo(6, -22);
    ctx.lineTo(14, -24);
    ctx.fill();
    drawMonsterUpgrades(ctx, animT, opts);
    ctx.restore();
  }

  const MONSTER_DRAWERS = {
    pet: drawPetMonster,
    slime: drawSlimeMonster,
    fuzzy: drawFuzzyMonster,
    rock: drawRockMonster,
    fire: drawFireMonster,
    bat: drawBatMonster,
    frost: drawFrostMonster,
    crystal: drawCrystalMonster,
    yeti: drawYetiMonster,
  };

  function drawMonster(ctx, x, y, scale, animT, opts) {
    opts = opts || {};
    const kind = opts.kind || "pet";
    const drawer = MONSTER_DRAWERS[kind] || drawSlimeMonster;
    drawer(ctx, x, y, scale, animT, opts);
  }

  function mobDrawScale(mobLevel) {
    const lv = Math.max(1, mobLevel || 1);
    return MOB_SCALE_BASE + Math.min(MOB_SCALE_LEVEL_CAP, (lv - 1) * MOB_SCALE_PER_LEVEL);
  }

  function drawMob(ctx, x, y, type, animT, mobLevel) {
    const bob = Math.sin(animT * 4 + x * 0.01) * 2;
    const sc = mobDrawScale(mobLevel);
    drawMonster(ctx, x, y + bob, sc, animT, {
      kind: type.kind || "slime",
      color: type.color,
      seed: type.name + mobLevel,
      facing: 1,
      happy: false,
    });
    ctx.font = "bold 11px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    const labelY = y - 58 * sc - 8;
    ctx.strokeText(type.emoji + " Lv" + mobLevel, x, labelY);
    ctx.fillText(type.emoji + " Lv" + mobLevel, x, labelY);
  }

  const FROST_BOSS_SCALE = 2.75;

  /** Colossal ice yeti — Frost Fields finale boss. */
  function drawFrostFieldsBoss(ctx, x, y, animT, zone, mobLevel) {
    const pulse = 1 + Math.sin(animT * 2.2) * 0.035;
    const sc = FROST_BOSS_SCALE * pulse;
    const breath = Math.sin(animT * 4) * 6;
    const sway = Math.sin(animT * 1.4) * 3;

    drawSoftShadow(ctx, x, y + 38 * sc, 72 * sc, 28 * sc, 0.42);

    ctx.save();
    ctx.translate(x + sway, y);

    // Ground frost aura
    const aura = ctx.createRadialGradient(0, 28 * sc, 8, 0, 32 * sc, 95 * sc);
    aura.addColorStop(0, "rgba(129,212,250,0.55)");
    aura.addColorStop(0.45, "rgba(3,169,244,0.22)");
    aura.addColorStop(1, "rgba(3,169,244,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 32 * sc, 88 * sc, 22 * sc, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting snow crystals
    for (let i = 0; i < 14; i++) {
      const a = animT * 1.8 + (i / 14) * Math.PI * 2;
      const dist = (58 + (i % 3) * 8) * sc;
      const sx = Math.cos(a) * dist;
      const sy = Math.sin(a) * dist * 0.35 - 18 * sc;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 3) * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 5 * sc);
      ctx.lineTo(sx + 3 * sc, sy);
      ctx.lineTo(sx, sy + 5 * sc);
      ctx.lineTo(sx - 3 * sc, sy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.scale(sc, sc);

    // Legs
    const legBob = Math.sin(animT * 3) * 2;
    const furDark = "#b0bec5";
    const furMid = "#eceff1";
    const furLight = "#ffffff";
    [-22, 22].forEach((lx, i) => {
      const lg = ctx.createLinearGradient(lx, 8, lx, 42);
      lg.addColorStop(0, furLight);
      lg.addColorStop(0.55, furMid);
      lg.addColorStop(1, furDark);
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.ellipse(lx, 28 + legBob * (i ? -1 : 1), 14, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#455a64";
      ctx.beginPath();
      ctx.ellipse(lx, 40, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Torso
    const bodyG = ctx.createRadialGradient(-8, 0, 12, 0, 4, 52);
    bodyG.addColorStop(0, furLight);
    bodyG.addColorStop(0.5, furMid);
    bodyG.addColorStop(1, shade(furMid, -0.18));
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, 2, 46, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ice-plate armor (shoulders + chest)
    const ice = (zone && zone.bossColor) || "#0288d1";
    [-34, 34].forEach((sx) => {
      const plate = ctx.createLinearGradient(sx, -18, sx, 8);
      plate.addColorStop(0, "#e1f5fe");
      plate.addColorStop(0.4, ice);
      plate.addColorStop(1, shade(ice, -0.35));
      ctx.fillStyle = plate;
      ctx.beginPath();
      ctx.moveTo(sx, -22);
      ctx.lineTo(sx + (sx < 0 ? -14 : 14), 6);
      ctx.lineTo(sx + (sx < 0 ? 6 : -6), 14);
      ctx.lineTo(sx, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.moveTo(sx + (sx < 0 ? -4 : 4), -14);
      ctx.lineTo(sx + (sx < 0 ? -8 : 8), 0);
      ctx.lineTo(sx, -6);
      ctx.closePath();
      ctx.fill();
    });
    const chestPlate = ctx.createLinearGradient(0, -8, 0, 18);
    chestPlate.addColorStop(0, "#b3e5fc");
    chestPlate.addColorStop(0.5, ice);
    chestPlate.addColorStop(1, "#01579b");
    ctx.fillStyle = chestPlate;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(18, 10);
    ctx.lineTo(0, 20);
    ctx.lineTo(-18, 10);
    ctx.closePath();
    ctx.fill();

    // Arms
    [-38, 38].forEach((ax, i) => {
      const armSwing = Math.sin(animT * 2.5 + i) * 4;
      ctx.save();
      ctx.translate(ax, -6 + armSwing);
      ctx.rotate((i ? 0.35 : -0.35) + Math.sin(animT * 2) * 0.08);
      const ag = ctx.createLinearGradient(0, -8, 0, 28);
      ag.addColorStop(0, furLight);
      ag.addColorStop(1, furDark);
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.ellipse(0, 10, 12, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#37474f";
      ctx.beginPath();
      ctx.ellipse(0, 32, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Icicle claws
      ctx.fillStyle = "rgba(179,229,252,0.95)";
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.moveTo(-8 + c * 8, 28);
        ctx.lineTo(-4 + c * 8, 42 + c * 2);
        ctx.lineTo(0 + c * 8, 28);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    // Head
    const headY = -38 + Math.sin(animT * 1.8) * 2;
    const headG = ctx.createRadialGradient(-6, headY - 6, 8, 0, headY, 34);
    headG.addColorStop(0, furLight);
    headG.addColorStop(0.65, furMid);
    headG.addColorStop(1, furDark);
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.ellipse(0, headY, 34, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = shade(furMid, -0.1);
    ctx.beginPath();
    ctx.ellipse(0, headY + 10, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#37474f";
    ctx.beginPath();
    ctx.ellipse(0, headY + 12, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.ellipse(0, headY + 10, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes
    [-12, 12].forEach((ex) => {
      const eyeGlow = ctx.createRadialGradient(ex, headY - 4, 1, ex, headY - 4, 10);
      eyeGlow.addColorStop(0, "#e1f5fe");
      eyeGlow.addColorStop(0.35, "#00bcd4");
      eyeGlow.addColorStop(1, "rgba(0,188,212,0)");
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(ex, headY - 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#006064";
      ctx.beginPath();
      ctx.ellipse(ex, headY - 4, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex + 1.5, headY - 6, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Horns / ice crown
    const crownPulse = 0.85 + Math.sin(animT * 5) * 0.15;
    [-20, 0, 20].forEach((hx, i) => {
      const h = 28 + (i === 1 ? 14 : 0);
      const spike = ctx.createLinearGradient(hx, headY - h, hx, headY - 4);
      spike.addColorStop(0, "#ffffff");
      spike.addColorStop(0.35, "#81d4fa");
      spike.addColorStop(1, shade(ice, -0.2));
      ctx.fillStyle = spike;
      ctx.globalAlpha = crownPulse;
      ctx.beginPath();
      ctx.moveTo(hx, headY - 6);
      ctx.lineTo(hx + (i === 1 ? 0 : i === 0 ? -8 : 8), headY - h);
      ctx.lineTo(hx + (i === 1 ? 0 : i === 0 ? 6 : -6), headY - 8);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Frost breath
    const bx = 0;
    const by = headY + 18 + breath;
    for (let p = 0; p < 5; p++) {
      const t = p / 5;
      const px = bx + Math.sin(animT * 6 + p) * (4 + p * 2);
      const py = by + t * 28;
      const mist = ctx.createRadialGradient(px, py, 0, px, py, 12 + p * 4);
      mist.addColorStop(0, `rgba(255,255,255,${0.55 - t * 0.35})`);
      mist.addColorStop(1, "rgba(129,212,250,0)");
      ctx.fillStyle = mist;
      ctx.beginPath();
      ctx.ellipse(px, py, 10 + p * 3, 8 + p * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Boss label
    const label = "❄️ Glacier Tyrant";
    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(13,71,161,0.85)";
    ctx.fillRect(x - 72, y - FROST_BOSS_SCALE * 58 - 22, 144, 18);
    ctx.fillStyle = "#e3f2fd";
    ctx.fillText(label, x, y - FROST_BOSS_SCALE * 58 - 9);
    ctx.font = "bold 10px system-ui,sans-serif";
    ctx.fillStyle = "#81d4fa";
    const hpLabel = (zone && zone.bossHp) || 1000;
    ctx.fillText("BOSS · " + hpLabel + " HP · Lv " + mobLevel, x, y - FROST_BOSS_SCALE * 58 + 4);
  }

  const CRYSTAL_BOSS_SCALE = 2.7;

  /** Amethyst crystal titan — Crystal Peak finale boss. */
  function drawCrystalPeakBoss(ctx, x, y, animT, zone, mobLevel) {
    const pulse = 1 + Math.sin(animT * 2.5) * 0.04;
    const sc = CRYSTAL_BOSS_SCALE * pulse;
    const sway = Math.sin(animT * 1.6) * 2;
    const ice = (zone && zone.bossColor) || "#512da8";
    const hpLabel = (zone && zone.bossHp) || 1000;
    const name = (zone && zone.bossName) || "Prism Overlord";

    drawSoftShadow(ctx, x, y + 36 * sc, 70 * sc, 26 * sc, 0.45);

    ctx.save();
    ctx.translate(x + sway, y);

    const aura = ctx.createRadialGradient(0, 30 * sc, 6, 0, 34 * sc, 92 * sc);
    aura.addColorStop(0, "rgba(186,104,200,0.5)");
    aura.addColorStop(0.5, "rgba(126,87,194,0.25)");
    aura.addColorStop(1, "rgba(49,27,146,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 30 * sc, 86 * sc, 20 * sc, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 12; i++) {
      const a = animT * 2.2 + (i / 12) * Math.PI * 2;
      const dist = (52 + (i % 4) * 10) * sc;
      const sx = Math.cos(a) * dist;
      const sy = Math.sin(a) * dist * 0.4 - 22 * sc;
      const shard = ctx.createLinearGradient(sx, sy - 12 * sc, sx, sy + 8 * sc);
      shard.addColorStop(0, "#e1bee7");
      shard.addColorStop(0.5, ice);
      shard.addColorStop(1, shade(ice, -0.35));
      ctx.fillStyle = shard;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 14 * sc);
      ctx.lineTo(sx + 8 * sc, sy + 6 * sc);
      ctx.lineTo(sx - 8 * sc, sy + 6 * sc);
      ctx.closePath();
      ctx.fill();
    }

    ctx.scale(sc, sc);

    const coreG = ctx.createRadialGradient(0, -8, 4, 0, 6, 58);
    coreG.addColorStop(0, "#f3e5f5");
    coreG.addColorStop(0.35, "#ce93d8");
    coreG.addColorStop(0.7, ice);
    coreG.addColorStop(1, shade(ice, -0.4));

    ctx.fillStyle = coreG;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(38, -8);
    ctx.lineTo(28, 42);
    ctx.lineTo(-28, 42);
    ctx.lineTo(-38, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(-8, -38);
    ctx.lineTo(0, -18);
    ctx.lineTo(10, -36);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill();

    const facetPulse = 0.7 + Math.sin(animT * 6) * 0.3;
    [-24, 0, 24].forEach((fx, i) => {
      ctx.globalAlpha = facetPulse;
      const fg = ctx.createLinearGradient(fx, -58, fx, -20);
      fg.addColorStop(0, "#ffffff");
      fg.addColorStop(0.4, "#b39ddb");
      fg.addColorStop(1, ice);
      ctx.fillStyle = fg;
      const h = 36 + i * 6;
      ctx.beginPath();
      ctx.moveTo(fx, -14);
      ctx.lineTo(fx + (i === 1 ? 0 : i === 0 ? -10 : 10), -h);
      ctx.lineTo(fx + (i === 1 ? 0 : i === 0 ? 8 : -8), -18);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    const eyeY = -6;
    [-14, 14].forEach((ex) => {
      const eg = ctx.createRadialGradient(ex, eyeY, 1, ex, eyeY, 12);
      eg.addColorStop(0, "#ffffff");
      eg.addColorStop(0.4, "#ea80fc");
      eg.addColorStop(1, "rgba(234,128,252,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ex, eyeY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a148c";
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ex + 2, eyeY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let p = 0; p < 6; p++) {
      const t = p / 6;
      const px = Math.sin(animT * 5 + p * 1.2) * (6 + p * 2);
      const py = 44 + t * 22 + Math.sin(animT * 4 + p) * 3;
      const spark = ctx.createRadialGradient(px, py, 0, px, py, 8);
      spark.addColorStop(0, `rgba(255,255,255,${0.6 - t * 0.4})`);
      spark.addColorStop(1, "rgba(186,104,200,0)");
      ctx.fillStyle = spark;
      ctx.beginPath();
      ctx.arc(px, py, 6 + p, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(49,27,146,0.88)";
    ctx.fillRect(x - 68, y - CRYSTAL_BOSS_SCALE * 56 - 22, 136, 18);
    ctx.fillStyle = "#f3e5f5";
    ctx.fillText("💎 " + name, x, y - CRYSTAL_BOSS_SCALE * 56 - 9);
    ctx.font = "bold 10px system-ui,sans-serif";
    ctx.fillStyle = "#ce93d8";
    ctx.fillText("BOSS · " + hpLabel + " HP · Lv " + mobLevel, x, y - CRYSTAL_BOSS_SCALE * 56 + 4);
  }

  const APEX_BOSS_SCALE = 2.85;

  /** Void monarch — Apex Realm finale boss. */
  function drawApexRealmBoss(ctx, x, y, animT, zone, mobLevel) {
    const pulse = 1 + Math.sin(animT * 2) * 0.04;
    const sc = APEX_BOSS_SCALE * pulse;
    const sway = Math.sin(animT * 1.2) * 4;
    const crimson = (zone && zone.bossColor) || "#880e4f";
    const hpLabel = (zone && zone.bossHp) || 1000;
    const name = (zone && zone.bossName) || "Apex Sovereign";
    const emoji = (zone && zone.bossEmoji) || "👑";
    const hover = Math.sin(animT * 1.8) * 5;

    drawSoftShadow(ctx, x, y + 40 * sc, 78 * sc, 30 * sc, 0.55);

    ctx.save();
    ctx.translate(x + sway, y + hover);

    // Void rift beneath
    const rift = ctx.createRadialGradient(0, 38 * sc, 4, 0, 40 * sc, 100 * sc);
    rift.addColorStop(0, "rgba(255,193,7,0.35)");
    rift.addColorStop(0.25, "rgba(136,14,79,0.45)");
    rift.addColorStop(0.6, "rgba(26,10,46,0.55)");
    rift.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rift;
    ctx.beginPath();
    ctx.ellipse(0, 38 * sc, 95 * sc, 26 * sc, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden orbit rings
    for (let ring = 0; ring < 3; ring++) {
      const ra = animT * (1.4 - ring * 0.2) + ring * 0.9;
      const rx = (62 + ring * 14) * sc;
      const ry = (22 + ring * 6) * sc;
      ctx.strokeStyle = `rgba(255,213,79,${0.35 - ring * 0.08})`;
      ctx.lineWidth = 2 + ring;
      ctx.beginPath();
      ctx.ellipse(0, -8 * sc, rx, ry, ra, 0, Math.PI * 2);
      ctx.stroke();
      for (let g = 0; g < 6; g++) {
        const ga = ra + (g / 6) * Math.PI * 2;
        const gx = Math.cos(ga) * rx;
        const gy = -8 * sc + Math.sin(ga) * ry;
        ctx.fillStyle = g % 2 === 0 ? "#ffd54f" : "#ff8f00";
        ctx.beginPath();
        ctx.arc(gx, gy, (3 - ring * 0.5) * sc, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Ascending void embers
    for (let i = 0; i < 16; i++) {
      const a = animT * 2.5 + (i / 16) * Math.PI * 2;
      const dist = (48 + (i % 5) * 9) * sc;
      const ex = Math.cos(a) * dist;
      const ey = Math.sin(a) * dist * 0.42 - 28 * sc - ((animT * 30 + i * 20) % 40);
      ctx.fillStyle = `rgba(255,${100 + (i % 3) * 40},${80 + (i % 4) * 30},${0.45 + (i % 3) * 0.15})`;
      ctx.beginPath();
      ctx.arc(ex, ey, (2 + (i % 3)) * sc, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.scale(sc, sc);

    // Shadow wings
    [-1, 1].forEach((side) => {
      const flap = Math.sin(animT * 3 + side) * 8;
      ctx.save();
      ctx.scale(side, 1);
      const wingG = ctx.createLinearGradient(20, -30, 70, 20);
      wingG.addColorStop(0, "rgba(74,20,140,0.9)");
      wingG.addColorStop(0.5, "rgba(136,14,79,0.75)");
      wingG.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wingG;
      ctx.beginPath();
      ctx.moveTo(18, -20 + flap);
      ctx.quadraticCurveTo(55, -35 + flap, 72, 5);
      ctx.quadraticCurveTo(48, 25, 22, 18);
      ctx.quadraticCurveTo(8, 8, 18, -20 + flap);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,213,79,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });

    // Main body — void torso
    const bodyG = ctx.createRadialGradient(0, -6, 8, 0, 8, 50);
    bodyG.addColorStop(0, "#4a148c");
    bodyG.addColorStop(0.45, "#311b92");
    bodyG.addColorStop(0.85, "#1a0a2e");
    bodyG.addColorStop(1, "#0d0220");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, 6, 42, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crimson core sigil
    const corePulse = 0.75 + Math.sin(animT * 5) * 0.25;
    ctx.globalAlpha = corePulse;
    const sigil = ctx.createRadialGradient(0, 4, 2, 0, 6, 28);
    sigil.addColorStop(0, "#ff8a80");
    sigil.addColorStop(0.4, crimson);
    sigil.addColorStop(1, "rgba(136,14,79,0)");
    ctx.fillStyle = sigil;
    ctx.beginPath();
    ctx.arc(0, 6, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(12, 10);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();

    // Shoulder armor plates
    [-32, 32].forEach((sx) => {
      const plate = ctx.createLinearGradient(sx, -20, sx, 12);
      plate.addColorStop(0, "#ffd54f");
      plate.addColorStop(0.35, crimson);
      plate.addColorStop(1, "#4a148c");
      ctx.fillStyle = plate;
      ctx.beginPath();
      ctx.moveTo(sx, -18);
      ctx.lineTo(sx + (sx < 0 ? -16 : 16), 8);
      ctx.lineTo(sx + (sx < 0 ? 4 : -4), 14);
      ctx.lineTo(sx, 2);
      ctx.closePath();
      ctx.fill();
    });

    // Arms with claw energy
    [-40, 40].forEach((ax, i) => {
      const armWave = Math.sin(animT * 2.8 + i) * 5;
      ctx.save();
      ctx.translate(ax, -4 + armWave);
      ctx.rotate((i ? 0.4 : -0.4) + Math.sin(animT * 2) * 0.1);
      ctx.fillStyle = "#311b92";
      ctx.beginPath();
      ctx.ellipse(0, 14, 11, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = crimson;
      for (let c = 0; c < 4; c++) {
        ctx.beginPath();
        ctx.moveTo(-6 + c * 4, 34);
        ctx.lineTo(-2 + c * 4, 48 + (c % 2) * 4);
        ctx.lineTo(2 + c * 4, 34);
        ctx.fill();
      }
      ctx.restore();
    });

    // Head / mask
    const headY = -42 + Math.sin(animT * 2.2) * 2;
    const headG = ctx.createRadialGradient(0, headY, 4, 0, headY, 30);
    headG.addColorStop(0, "#6a1b9a");
    headG.addColorStop(0.6, "#311b92");
    headG.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.ellipse(0, headY, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes
    [-11, 11].forEach((ex) => {
      const eg = ctx.createRadialGradient(ex, headY - 2, 1, ex, headY - 2, 14);
      eg.addColorStop(0, "#ffeb3b");
      eg.addColorStop(0.35, "#ff5252");
      eg.addColorStop(1, "rgba(255,82,82,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ex, headY - 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b71c1c";
      ctx.beginPath();
      ctx.ellipse(ex, headY - 2, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ex + 2, headY - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Floating crown
    const crownY = headY - 38 + Math.sin(animT * 3.5) * 3;
    const crownG = ctx.createLinearGradient(0, crownY - 20, 0, crownY + 6);
    crownG.addColorStop(0, "#fff9c4");
    crownG.addColorStop(0.35, "#ffd54f");
    crownG.addColorStop(0.7, "#ff8f00");
    crownG.addColorStop(1, "#e65100");
    ctx.fillStyle = crownG;
    ctx.beginPath();
    ctx.moveTo(-22, crownY + 4);
    ctx.lineTo(-18, crownY - 16);
    ctx.lineTo(-8, crownY - 4);
    ctx.lineTo(0, crownY - 28);
    ctx.lineTo(8, crownY - 4);
    ctx.lineTo(18, crownY - 16);
    ctx.lineTo(22, crownY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = crimson;
    [-14, 0, 14].forEach((gx) => {
      ctx.beginPath();
      ctx.arc(gx, crownY - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    const crownGlow = ctx.createRadialGradient(0, crownY, 2, 0, crownY, 40);
    crownGlow.addColorStop(0, "rgba(255,213,79,0.5)");
    crownGlow.addColorStop(1, "rgba(255,213,79,0)");
    ctx.fillStyle = crownGlow;
    ctx.beginPath();
    ctx.arc(0, crownY, 38, 0, Math.PI * 2);
    ctx.fill();

    // Void breath / energy beam
    for (let p = 0; p < 6; p++) {
      const t = p / 6;
      const px = Math.sin(animT * 7 + p) * (5 + p);
      const py = headY + 20 + t * 32;
      const beam = ctx.createRadialGradient(px, py, 0, px, py, 14);
      beam.addColorStop(0, `rgba(255,82,82,${0.5 - t * 0.35})`);
      beam.addColorStop(1, "rgba(74,20,140,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.ellipse(px, py, 12 + p * 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(26,10,46,0.92)";
    ctx.fillRect(x - 72, y - APEX_BOSS_SCALE * 60 - 22, 144, 18);
    ctx.fillStyle = "#fff9c4";
    ctx.fillText(emoji + " " + name, x, y - APEX_BOSS_SCALE * 60 - 9);
    ctx.font = "bold 10px system-ui,sans-serif";
    ctx.fillStyle = "#ffd54f";
    ctx.fillText("BOSS · " + hpLabel + " HP · Lv " + mobLevel, x, y - APEX_BOSS_SCALE * 60 + 4);
  }

  function drawBoss(ctx, x, y, animT, zone, mobLevel) {
    const decor = zone && zone.decor ? zone.decor : "yard";
    if (decor === "frost") {
      drawFrostFieldsBoss(ctx, x, y, animT, zone, mobLevel);
      return;
    }
    if (decor === "crystal") {
      drawCrystalPeakBoss(ctx, x, y, animT, zone, mobLevel);
      return;
    }
    if (decor === "peak") {
      drawApexRealmBoss(ctx, x, y, animT, zone, mobLevel);
      return;
    }
    const pulse = 1 + Math.sin(animT * 3) * 0.04;
    drawMonster(ctx, x, y, BOSS_SCALE_BASE * pulse, animT, {
      kind: BOSS_KIND_BY_DECOR[decor] || "rock",
      color: (zone && zone.bossColor) || "#c62828",
      seed: "boss-" + decor,
      facing: 1,
      happy: true,
      upgrades: ["horns", "crown", "aura"],
      munch: true,
    });
    ctx.font = "bold 11px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffeb3b";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    const labelY = y - BOSS_SCALE_BASE * 48 - 10;
    ctx.strokeText("👹 BOSS Lv " + mobLevel, x, labelY);
    ctx.fillText("👹 BOSS Lv " + mobLevel, x, labelY);
  }

  function drawBattleArena(ctx, w, h, zone, animT) {
    const decor = (zone && zone.decor) || "yard";
    const top = (zone && zone.skyTop) || "#81d4fa";
    const bot = (zone && zone.skyBot) || "#b3e5fc";
    const floor = (zone && zone.floor) || "#7cb342";
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(0.55, bot);
    g.addColorStop(1, floor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (decor === "beach") {
      ctx.fillStyle = (zone && zone.water) || "#01579b";
      ctx.fillRect(0, h - 50, w, 50);
      const moonX = w * 0.82;
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.arc(moonX, 28, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bot;
      ctx.beginPath();
      ctx.arc(moonX + 9, 26, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (decor === "lava") {
      ctx.fillStyle = (zone && zone.lava) || "#ff5722";
      ctx.fillRect(0, h - 40, w, 40);
    } else if (decor === "crystal") {
      const cryG = ctx.createLinearGradient(0, h - 70, 0, h);
      cryG.addColorStop(0, shade(floor, 0.1));
      cryG.addColorStop(1, shade(floor, -0.15));
      ctx.fillStyle = cryG;
      ctx.fillRect(0, h - 70, w, 70);
      for (let i = 0; i < 10; i++) {
        const cx = (i * 88 + animT * 6) % (w + 30) - 15;
        const cg = ctx.createLinearGradient(cx, h - 55, cx, h - 18);
        cg.addColorStop(0, "#e1bee7");
        cg.addColorStop(0.5, (zone && zone.bossColor) || "#7e57c2");
        cg.addColorStop(1, "#4527a0");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.moveTo(cx, h - 52);
        ctx.lineTo(cx + 10, h - 20);
        ctx.lineTo(cx - 10, h - 20);
        ctx.closePath();
        ctx.fill();
      }
      for (let i = 0; i < 45; i++) {
        const fy = ((i * 43 + animT * (14 + (i % 4) * 3)) % (h * 0.7));
        ctx.fillStyle = `rgba(225,190,231,${0.2 + (i % 3) * 0.15})`;
        ctx.fillRect((i * 71 + animT * 18) % w, fy, 2, 2);
      }
    } else if (decor === "peak") {
      const apexG = ctx.createLinearGradient(0, h - 90, 0, h);
      apexG.addColorStop(0, shade(floor, 0.08));
      apexG.addColorStop(0.5, floor);
      apexG.addColorStop(1, "#1a0a2e");
      ctx.fillStyle = apexG;
      ctx.fillRect(0, h - 90, w, 90);
      ctx.strokeStyle = "rgba(255,213,79,0.25)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const px = (i * 110 + animT * 4) % (w + 40) - 20;
        ctx.beginPath();
        ctx.moveTo(px, h);
        ctx.lineTo(px + 18, h - 70 - (i % 3) * 12);
        ctx.lineTo(px - 18, h - 65);
        ctx.stroke();
      }
      for (let i = 0; i < 50; i++) {
        const fy = ((i * 31 + animT * (20 + (i % 6) * 5)) % (h * 0.8));
        const fx = (i * 79 + animT * 25) % w;
        const gold = i % 3 === 0;
        ctx.fillStyle = gold
          ? `rgba(255,213,79,${0.3 + (i % 4) * 0.12})`
          : `rgba(255,82,82,${0.2 + (i % 3) * 0.1})`;
        ctx.beginPath();
        ctx.arc(fx, fy, gold ? 2 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      const voidOrb = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.35, 120);
      voidOrb.addColorStop(0, "rgba(136,14,79,0.2)");
      voidOrb.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = voidOrb;
      ctx.fillRect(0, 0, w, h);
    } else if (decor === "frost") {
      const iceG = ctx.createLinearGradient(0, h - 80, 0, h);
      iceG.addColorStop(0, shade(floor, 0.06));
      iceG.addColorStop(0.5, floor);
      iceG.addColorStop(1, shade(floor, -0.12));
      ctx.fillStyle = iceG;
      ctx.fillRect(0, h - 80, w, 80);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let i = 0; i < 8; i++) {
        const ix = (i * 97 + animT * 12) % (w + 40) - 20;
        ctx.beginPath();
        ctx.moveTo(ix, h - 50);
        ctx.lineTo(ix + 6, h - 20);
        ctx.lineTo(ix - 6, h - 20);
        ctx.closePath();
        ctx.fill();
      }
      for (let i = 0; i < 55; i++) {
        const fy = ((i * 37 + animT * (18 + (i % 5) * 4)) % (h * 0.75));
        const fx = (i * 83 + animT * 22) % w;
        ctx.fillStyle = `rgba(255,255,255,${0.25 + (i % 4) * 0.15})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 1 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = shade(floor, -0.08);
      ctx.fillRect(0, h - 36, w, 36);
    }
  }

  function drawPostFX(ctx, w, h, animT, focusX, focusY) {
    const warm = ctx.createRadialGradient(focusX, focusY, 30, focusX, focusY, Math.max(w, h) * 0.65);
    warm.addColorStop(0, "rgba(255,255,255,0.04)");
    warm.addColorStop(1, "rgba(255,200,120,0.03)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);
  }

  function fillTileGradient(ctx, sx, sy, tw, th, top, mid, bot) {
    const g = ctx.createLinearGradient(sx, sy, sx, sy + th);
    g.addColorStop(0, top);
    g.addColorStop(0.5, mid);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);
  }

  function drawWaterTile(ctx, sx, sy, tw, th, zone, seed, animT) {
    const deep = (zone && zone.water) || "#0277bd";
    const wave = Math.sin(seed * 0.1 + animT * 0.08) * 0.04;
    fillTileGradient(ctx, sx, sy, tw, th, shade(deep, 0.12 + wave), deep, shade(deep, -0.1));
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(sx + (seed % 20), sy + 8 + (seed % 12), tw * 0.4, 3);
  }

  function drawThemedTile(ctx, sx, sy, tw, th, zone, seed, wx, wy, animT) {
    animT = animT || 0;
    const decor = (zone && zone.decor) || "yard";
    const cx = wx + tw * 0.5;
    const cy = wy + th * 0.5;

    if (decor === "mushroom") {
      const d = islandDist(cx, cy, 620, 500);
      if (d > 1.05) {
        drawWaterTile(ctx, sx, sy, tw, th, zone, seed, animT);
        return;
      }
      if (d > 0.92) {
        fillTileGradient(ctx, sx, sy, tw, th, "#80cbc4", "#4dd0e1", "#26c6da");
        return;
      }
      const base = (zone && zone.floor) || "#dcedc8";
      const alt = (zone && zone.floorAlt) || "#aed581";
      fillTileGradient(ctx, sx, sy, tw, th, shade(base, 0.08), base, shade(alt, -0.06));
      if (seed % 7 === 0) {
        const colors = ["#e53935", "#8e24aa", "#fb8c00", "#43a047"];
        const col = colors[seed % colors.length];
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(sx + 18, sy + 14, 9, 7, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = shade(col, 0.15);
        ctx.fillRect(sx + 16, sy + 14, 4, 10);
      }
      return;
    }

    if (decor === "lava") {
      const dist = Math.hypot(cx - WORLD_CX, cy - WORLD_CY);
      const lavaCol = (zone && zone.lava) || "#ff5722";
      if (dist > 480) {
        const flicker = Math.sin(animT * 0.12 + seed) * 0.06;
        fillTileGradient(
          ctx, sx, sy, tw, th,
          shade(lavaCol, 0.15 + flicker),
          lavaCol,
          shade(lavaCol, -0.2)
        );
        if (seed % 5 === 0) {
          ctx.fillStyle = `rgba(255,235,59,${0.35 + flicker})`;
          ctx.beginPath();
          ctx.arc(sx + tw / 2, sy + th / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      if (dist > 200) {
        fillTileGradient(ctx, sx, sy, tw, th, "#6d4c41", "#4e342e", "#3e2723");
        return;
      }
      fillTileGradient(ctx, sx, sy, tw, th, "#5d4037", "#4e342e", "#37474f");
      return;
    }

    if (decor === "beach") {
      const d = islandDist(cx, cy, 700, 580);
      if (d > 1.02) {
        drawWaterTile(ctx, sx, sy, tw, th, zone, seed, animT);
        return;
      }
      const sand = (zone && zone.floor) || "#ffe082";
      const sandD = (zone && zone.floorAlt) || "#ffca28";
      fillTileGradient(ctx, sx, sy, tw, th, shade(sand, 0.1), sand, shade(sandD, -0.08));
      if (seed % 9 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.ellipse(sx + 24, sy + 20, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (decor === "candy") {
      const hill = Math.sin(wx * 0.014) * Math.cos(wy * 0.011) * 0.5 + 0.5;
      const base = (zone && zone.floor) || "#f8bbd0";
      const alt = (zone && zone.floorAlt) || "#f48fb1";
      const top = shade(base, 0.12 + hill * 0.1);
      const mid = shade(base, -0.02 + hill * 0.05);
      const bot = shade(alt, -0.08 - hill * 0.05);
      fillTileGradient(ctx, sx, sy, tw, th, top, mid, bot);
      if (seed % 6 === 0) {
        const colors = ["#f06292", "#ba68c8", "#4fc3f7", "#fff176", "#81c784"];
        ctx.fillStyle = colors[seed % colors.length];
        ctx.beginPath();
        ctx.arc(sx + 12 + (seed % 28), sy + 16 + (seed % 20), 5 + (seed % 4), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (hill > 0.72 && seed % 11 === 0) {
        ctx.fillStyle = shade(alt, 0.1);
        ctx.beginPath();
        ctx.moveTo(sx, sy + th);
        ctx.lineTo(sx + tw / 2, sy + 4);
        ctx.lineTo(sx + tw, sy + th);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }

    if (decor === "frost") {
      const base = (zone && zone.floor) || "#eceff1";
      const alt = (zone && zone.floorAlt) || "#cfd8dc";
      const drift = Math.sin(wx * 0.02 + wy * 0.015) * 0.5 + 0.5;
      fillTileGradient(
        ctx, sx, sy, tw, th,
        shade("#ffffff", drift * 0.08),
        shade(base, drift * 0.03),
        shade(alt, -0.06)
      );
      if (seed % 4 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(sx + 8, sy + 10, tw - 16, 4);
      }
      return;
    }

    const base = (zone && zone.floor) || "#7cb342";
    const alt = (zone && zone.floorAlt) || "#558b2f";
    fillTileGradient(ctx, sx, sy, tw, th, shade(base, 0.06), base, shade(alt, -0.05));
    if (decor === "crystal" && seed % 6 === 0) {
      ctx.fillStyle = "rgba(186,104,200,0.35)";
      ctx.beginPath();
      ctx.moveTo(sx + 24, sy + 8);
      ctx.lineTo(sx + 32, sy + 24);
      ctx.lineTo(sx + 16, sy + 24);
      ctx.closePath();
      ctx.fill();
    } else if (decor === "peak" && seed % 11 === 0) {
      ctx.fillStyle = "rgba(156,39,176,0.25)";
      ctx.beginPath();
      ctx.arc(sx + tw / 2, sy + th / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWorldTile(ctx, sx, sy, tw, th, zone, seed, wx, wy, animT) {
    if (zone && zone.isYard) {
      drawBackyardTile(ctx, sx, sy, tw, th, seed);
      return;
    }
    drawThemedTile(ctx, sx, sy, tw, th, zone, seed, wx || 0, wy || 0, animT || 0);
  }

  function drawMushroomProp(ctx, x, y, scale, capColor) {
    ctx.fillStyle = "#efebe9";
    ctx.fillRect(x - 3 * scale, y, 6 * scale, 22 * scale);
    ctx.fillStyle = capColor || "#e53935";
    ctx.beginPath();
    ctx.ellipse(x, y - 4 * scale, 22 * scale, 16 * scale, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(x - 8 * scale, y - 8 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.arc(x + 6 * scale, y - 6 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPalmTree(ctx, x, y, animT) {
    const sway = Math.sin(animT * 0.04 + x * 0.01) * 4;
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(x - 5, y, 10, 55);
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.quadraticCurveTo(x + sway - 28, y - 20, x + sway - 42, y - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 15);
    ctx.quadraticCurveTo(x + sway + 30, y - 15, x + sway + 38, y + 2);
    ctx.stroke();
    ctx.fillStyle = "#2e7d32";
    for (let i = 0; i < 5; i++) {
      const a = -0.8 + i * 0.35 + sway * 0.02;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 8, y - 18 + Math.sin(a) * 6, 28, 10, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawVolcanoProp(ctx, x, y, animT) {
    const flicker = 0.85 + Math.sin(animT * 0.14) * 0.15;
    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.moveTo(x - 120, y + 40);
    ctx.lineTo(x - 70, y - 80);
    ctx.lineTo(x + 70, y - 80);
    ctx.lineTo(x + 120, y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.moveTo(x - 50, y + 40);
    ctx.lineTo(x - 25, y - 30);
    ctx.lineTo(x + 25, y - 30);
    ctx.lineTo(x + 50, y + 40);
    ctx.closePath();
    ctx.fill();
    const fireG = ctx.createLinearGradient(x, y - 90, x, y - 20);
    fireG.addColorStop(0, `rgba(255,213,79,${flicker})`);
    fireG.addColorStop(0.5, `rgba(255,87,34,${flicker})`);
    fireG.addColorStop(1, `rgba(191,54,12,${0.7 * flicker})`);
    ctx.fillStyle = fireG;
    ctx.beginPath();
    ctx.moveTo(x - 22, y - 28);
    ctx.lineTo(x, y - 95 - flicker * 15);
    ctx.lineTo(x + 22, y - 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(120,120,120,${0.35 + flicker * 0.2})`;
    for (let i = 0; i < 6; i++) {
      const px = x - 80 + i * 28 + Math.sin(animT * 0.1 + i) * 8;
      ctx.beginPath();
      ctx.ellipse(px, y - 60 - (i % 3) * 20, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSnowHut(ctx, x, y) {
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(x - 35, y - 10, 70, 45);
    ctx.fillStyle = "#eceff1";
    ctx.beginPath();
    ctx.moveTo(x - 48, y - 8);
    ctx.lineTo(x, y - 55);
    ctx.lineTo(x + 48, y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(x - 12, y + 10, 24, 25);
    ctx.fillStyle = "#81d4fa";
    ctx.fillRect(x + 18, y - 2, 14, 12);
  }

  function drawDeadBush(ctx, x, y) {
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const a = -1.2 + i * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 18 - 10);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCandyHill(ctx, x, y, color) {
    ctx.fillStyle = color || "#f48fb1";
    ctx.beginPath();
    ctx.moveTo(x - 50, y + 30);
    ctx.quadraticCurveTo(x, y - 70, x + 50, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y - 55, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color || "#f48fb1";
    ctx.fillRect(x - 4, y - 30, 8, 55);
  }

  function drawZonePropIfVisible(ctx, wx, wy, camX, camY, w, h, drawFn) {
    const sx = wx - camX;
    const sy = wy - camY;
    if (sx < -180 || sx > w + 180 || sy < -180 || sy > h + 180) return;
    drawFn(sx, sy);
  }

  function drawZoneProps(ctx, camX, camY, w, h, zone, animT) {
    if (!zone || zone.isYard) return;
    const decor = zone.decor;

    if (decor === "mushroom") {
      const caps = ["#e53935", "#8e24aa", "#fb8c00", "#43a047", "#1e88e5"];
      [
        [420, 520, 1.2],
        [1380, 720, 1.5],
        [720, 1580, 1],
        [1250, 420, 1.3],
        [900, 980, 1.8],
      ].forEach((p, i) => {
        drawZonePropIfVisible(ctx, p[0], p[1], camX, camY, w, h, (sx, sy) => {
          drawMushroomProp(ctx, sx, sy, p[2], caps[i % caps.length]);
        });
      });
    } else if (decor === "candy") {
      [
        [350, 480, "#f48fb1"],
        [1200, 600, "#ce93d8"],
        [650, 1400, "#fff176"],
        [1500, 1200, "#81c784"],
      ].forEach((p) => {
        drawZonePropIfVisible(ctx, p[0], p[1], camX, camY, w, h, (sx, sy) => {
          drawCandyHill(ctx, sx, sy, p[2]);
        });
      });
      for (let i = 0; i < 8; i++) {
        const wx = 200 + i * 200;
        const wy = 900 + (i % 3) * 300;
        drawZonePropIfVisible(ctx, wx, wy, camX, camY, w, h, (sx, sy) => {
          ctx.fillStyle = ["#f06292", "#ba68c8", "#4fc3f7"][i % 3];
          ctx.fillRect(sx - 3, sy - 40, 6, 40);
          ctx.beginPath();
          ctx.arc(sx, sy - 42, 14, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else if (decor === "lava") {
      drawZonePropIfVisible(ctx, WORLD_CX, WORLD_CY - 40, camX, camY, w, h, (sx, sy) => {
        drawVolcanoProp(ctx, sx, sy, animT);
      });
    } else if (decor === "beach") {
      [
        [280, 380],
        [1520, 520],
        [420, 1750],
        [1480, 1680],
        [900, 350],
      ].forEach((p) => {
        drawZonePropIfVisible(ctx, p[0], p[1], camX, camY, w, h, (sx, sy) => {
          drawPalmTree(ctx, sx, sy, animT);
        });
      });
    } else if (decor === "frost") {
      drawZonePropIfVisible(ctx, 220, 280, camX, camY, w, h, (sx, sy) => {
        drawSnowHut(ctx, sx, sy);
      });
      for (let i = 0; i < 16; i++) {
        const wx = 150 + (i * 107) % 1500;
        const wy = 200 + (i * 131) % 1800;
        drawZonePropIfVisible(ctx, wx, wy, camX, camY, w, h, (sx, sy) => {
          drawDeadBush(ctx, sx, sy);
        });
      }
      for (let i = 0; i < 6; i++) {
        const wx = 400 + i * 260;
        const wy = 600 + (i % 2) * 400;
        drawZonePropIfVisible(ctx, wx, wy, camX, camY, w, h, (sx, sy) => {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.ellipse(sx, sy, 45, 18, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  }

  function drawZoneSky(ctx, w, h, camX, camY, zone, animT) {
    if (zone && zone.isYard) {
      drawBackyardSky(ctx, w, h, camX, animT);
      return;
    }
    const decor = (zone && zone.decor) || "yard";
    const top = (zone && zone.skyTop) || "#7ec8f8";
    const bot = (zone && zone.skyBot) || "#b8e4ff";

    if (decor === "beach") {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, top);
      g.addColorStop(0.45, bot);
      g.addColorStop(0.75, "#2d4a6f");
      g.addColorStop(1, "rgba(1,87,155,0.4)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h * 0.72);
      for (let i = 0; i < 55; i++) {
        const tw = ((i * 43 + animT * 0.5) % 120) / 120;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 5) * 0.12})`;
        ctx.fillRect((i * 97) % w, (i * 61) % (h * 0.55), 1 + (i % 2), 1 + (i % 2));
      }
      const moonX = w * 0.78;
      const moonY = h * 0.14;
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bot;
      ctx.beginPath();
      ctx.arc(moonX + 14, moonY - 4, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,236,${0.12 + Math.sin(animT * 0.03) * 0.04})`;
      ctx.beginPath();
      ctx.arc(moonX - 8, moonY, 42, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const g = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    g.addColorStop(0, top);
    g.addColorStop(0.55, bot);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.65);

    if (decor === "mushroom") {
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 220 + camX * 0.04 + animT * 6) % (w + 120)) - 60;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.ellipse(cx, 32 + (i % 2) * 22, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (decor === "lava") {
      ctx.fillStyle = "rgba(255,87,34,0.15)";
      ctx.fillRect(0, h * 0.35, w, h * 0.3);
      for (let i = 0; i < 18; i++) {
        const px = (i * 73 + animT * 8) % w;
        const py = h * 0.12 + (i % 5) * 14;
        ctx.fillStyle = `rgba(255,193,7,${0.2 + (i % 3) * 0.1})`;
        ctx.fillRect(px, py, 4, 4);
      }
      ctx.fillStyle = "rgba(66,66,66,0.35)";
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse((i * 140 + animT * 3) % w, h * 0.2, 50, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (decor === "frost") {
      for (let i = 0; i < 50; i++) {
        const fy = ((i * 41 + animT * (1 + (i % 3) * 0.5)) % (h * 0.65));
        ctx.fillStyle = `rgba(255,255,255,${0.5 + (i % 4) * 0.15})`;
        ctx.fillRect((i * 67) % w, fy, 2, 2);
      }
    } else if (decor === "candy") {
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 160 + animT * 4) % (w + 60)) - 30;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.arc(cx, 28 + (i % 2) * 18, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (decor === "crystal" || decor === "ice") {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 4) * 0.1})`;
        ctx.fillRect((i * 61 + animT * 2) % w, (i * 37) % (h * 0.4), 2, 2);
      }
    } else if (decor === "peak") {
      for (let i = 0; i < 6; i++) {
        const mx = ((i * 180 + animT * 5) % (w + 80)) - 40;
        const g = ctx.createRadialGradient(mx, 40, 4, mx, 40, 55);
        g.addColorStop(0, "rgba(255,213,79,0.35)");
        g.addColorStop(1, "rgba(74,20,140,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, 40, 50, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 60; i++) {
        const fy = ((i * 29 + animT * (16 + (i % 5) * 4)) % (h * 0.85));
        ctx.fillStyle =
          i % 4 === 0
            ? `rgba(255,213,79,${0.35 + (i % 3) * 0.1})`
            : `rgba(255,82,82,${0.15 + (i % 4) * 0.08})`;
        ctx.fillRect((i * 53 + animT * 20) % w, fy, 2, 2);
      }
    }
  }

  window.RMSprites = {
    drawMonster,
    mobDrawScale,
    drawCaretaker,
    drawMob,
    drawBoss,
    drawFeedBowl,
    drawSpoon,
    drawBackyardProps,
    drawZoneProps,
    drawWorldTile,
    drawZoneSky,
    drawBattleArena,
    drawPostFX,
    drawSoftShadow,
    shade,
  };
})();