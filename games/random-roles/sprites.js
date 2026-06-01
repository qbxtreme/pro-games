(function () {
  "use strict";

  const SKIN_TONES = ["#f5d0b5", "#e8b896", "#c68642", "#8d5524", "#5c3d2e"];
  const HAIR_COLORS = ["#2c1810", "#4a3728", "#8b6914", "#1a1a1a", "#6b4423", "#d4a574"];

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

  function hash(a, b, c) {
    return ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) >>> 0;
  }

  function pickFromHash(h, arr) {
    return arr[h % arr.length];
  }

  function drawSoftShadow(ctx, x, y, rw, rh, alpha) {
    const a = alpha == null ? 0.28 : alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rw);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.6, `rgba(0,0,0,${a * 0.4})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rw, rh || rw * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNameTag(ctx, x, y, name, isYou, tagColor, alpha) {
    if (!name) return;
    const visibility = Math.max(0, Math.min(1, alpha == null ? 1 : alpha));
    if (visibility <= 0.02) return;
    ctx.font = "600 10px system-ui, -apple-system, 'Segoe UI', sans-serif";
    const tw = ctx.measureText(name).width;
    const tagW = tw + 14;
    const tagH = 15;
    const tagY = y - 52;

    const palettes = {
      red: { bg: `rgba(183,28,28,${0.92 * visibility})`, text: `rgba(255,255,255,${visibility})`, stroke: null },
      green: { bg: `rgba(46,125,50,${0.92 * visibility})`, text: `rgba(255,255,255,${visibility})`, stroke: null },
      yellow: { bg: `rgba(251,192,45,${0.94 * visibility})`, text: `rgba(26,26,26,${visibility})`, stroke: null },
    };
    const pal = palettes[tagColor] || null;
    const bg = pal
      ? pal.bg
      : isYou
        ? `rgba(33,33,33,${0.88 * visibility})`
        : `rgba(255,255,255,${0.9 * visibility})`;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x - tagW / 2, tagY, tagW, tagH, 4);
    ctx.fill();
    if (!pal && !isYou) {
      ctx.strokeStyle = `rgba(0,0,0,${0.12 * visibility})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = pal ? pal.text : isYou ? `rgba(255,255,255,${visibility})` : `rgba(33,33,33,${visibility})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, x, tagY + tagH / 2 + 0.5);
  }

  /** Betray (imposter) vision: green = Protect, red = Betray, yellow = Anarchist. */
  function nameTagColorForViewer(viewerFaction, target) {
    const targetFaction = target.role?.faction || target.faction;
    const targetRoleId = target.roleId || target.role?.id;

    if (viewerFaction === "betray") {
      if (targetFaction === "betray") return "red";
      if (targetRoleId === "anarchist") return "yellow";
      return "green";
    }

    if (viewerFaction === "protect") {
      if (targetFaction === "betray" || targetRoleId === "anarchist") return "green";
      return null;
    }

    return null;
  }

  function playerPalette(colorHex, seed) {
    const h = hash(seed, seed * 3, 7);
    return {
      skin: pickFromHash(h, SKIN_TONES),
      hair: pickFromHash(h >> 3, HAIR_COLORS),
      shirt: colorHex,
      pants: shade(colorHex, -0.35),
      shoes: "#2c2c2c",
    };
  }

  function drawWolfForm(ctx, x, y, opts) {
    opts = opts || {};
    const facing = opts.facing || 1;
    const moving = !!opts.moving;
    const walkPhase = opts.walkPhase || 0;
    const py = y;
    const bob = moving ? Math.sin(walkPhase * 1.4) * 2 : 0;
    const stride = moving ? Math.sin(walkPhase * 1.4) * 5 : 0;

    drawSoftShadow(ctx, x, py + 16, 22, 7, 0.38);

    ctx.save();
    ctx.translate(x, py + bob);
    ctx.scale(facing, 1);

    const fur = "#5d4037";
    const furDark = "#3e2723";
    const furLight = "#8d6e63";
    const belly = "#a1887f";

    // Tail
    ctx.strokeStyle = furDark;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.quadraticCurveTo(-18 - Math.sin(walkPhase) * 2, -2, -14, -10);
    ctx.stroke();

    // Hind legs
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(-7 + stride * 0.25, 10, 4, 8, 0.15, 0, Math.PI * 2);
    ctx.ellipse(-2 - stride * 0.25, 10, 4, 8, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyG = ctx.createLinearGradient(-12, -2, 12, 8);
    bodyG.addColorStop(0, furDark);
    bodyG.addColorStop(0.45, fur);
    bodyG.addColorStop(1, furLight);
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(2, 2, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(4, 4, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front legs
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(8 + stride * 0.3, 10, 3.5, 8, 0.1, 0, Math.PI * 2);
    ctx.ellipse(13 - stride * 0.3, 10, 3.5, 8, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Neck + head
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(12, -4, 7, 6, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = furLight;
    ctx.beginPath();
    ctx.ellipse(16, -5, 5.5, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.ellipse(19, -3, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(20.5, -3.5, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.moveTo(12, -10);
    ctx.lineTo(10, -17);
    ctx.lineTo(15, -11);
    ctx.closePath();
    ctx.moveTo(17, -10);
    ctx.lineTo(19, -18);
    ctx.lineTo(20, -10);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#ffeb3b";
    ctx.shadowColor = "rgba(255,235,59,0.7)";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(15, -6, 1.4, 0, Math.PI * 2);
    ctx.arc(18, -6.2, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(15.3, -6, 0.55, 0, Math.PI * 2);
    ctx.arc(18.2, -6.2, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    drawNameTag(ctx, x, py, opts.name || "", opts.isYou, opts.tagColor || null, opts.tagAlpha);

    if (opts.isYou) {
      ctx.strokeStyle = "rgba(180,80,255,0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.ellipse(x, py + 2, 20, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawRealisticPlayer(ctx, x, y, colorHex, opts) {
    opts = opts || {};
    if (opts.wolfForm && !opts.dead) {
      drawWolfForm(ctx, x, y, opts);
      return;
    }
    const dead = !!opts.dead;
    const facing = opts.facing || 1;
    const moving = !!opts.moving;
    const walkPhase = opts.walkPhase || 0;
    const seed = opts.seed || Math.abs(Math.round(x * 7 + y * 13)) || 1;
    const pal = playerPalette(colorHex, seed);
    const py = y + (dead ? 12 : 0);
    const scale = dead ? 0.92 : 1.08;

    drawSoftShadow(ctx, x, py + 18, 16 * scale, 6, dead ? 0.18 : 0.38);

    const bob = moving ? Math.sin(walkPhase) * 1.8 : 0;
    const legSwing = moving ? Math.sin(walkPhase) * 5 : 0;
    const armSwing = moving ? Math.sin(walkPhase + Math.PI) * 4.5 : 0;

    ctx.save();
    ctx.translate(x, py + bob);
    ctx.scale(facing * scale, scale);

    if (dead) {
      ctx.rotate(1.12);
      ctx.globalAlpha = 0.82;
    }

    const drawLimb = (lx, ly, w, h, rot, fill, stroke) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, shade(fill, 0.1));
      g.addColorStop(0.55, fill);
      g.addColorStop(1, shade(fill, -0.14));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.35);
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      ctx.restore();
    };

    // Legs + shoes
    drawLimb(-3.5 + legSwing * 0.35, 11, 5, 11, legSwing * 0.07, pal.pants, "rgba(0,0,0,0.15)");
    drawLimb(3.5 - legSwing * 0.35, 11, 5, 11, -legSwing * 0.07, pal.pants, "rgba(0,0,0,0.15)");
    ctx.fillStyle = pal.shoes;
    ctx.beginPath();
    ctx.ellipse(-3.5 + legSwing * 0.35, 17.5, 5, 2.8, 0.05, 0, Math.PI * 2);
    ctx.ellipse(3.5 - legSwing * 0.35, 17.5, 5, 2.8, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(pal.shoes, 0.15);
    ctx.fillRect(-6 + legSwing * 0.35, 16.2, 3, 1.2);
    ctx.fillRect(3 + legSwing * 0.35, 16.2, 3, 1.2);

    // Torso / jacket
    const torsoG = ctx.createLinearGradient(-9, -6, 9, 12);
    torsoG.addColorStop(0, shade(pal.shirt, 0.14));
    torsoG.addColorStop(0.45, pal.shirt);
    torsoG.addColorStop(1, shade(pal.shirt, -0.18));
    ctx.fillStyle = torsoG;
    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.lineTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.lineTo(9, -2);
    ctx.quadraticCurveTo(0, -6, -9, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = shade(pal.shirt, -0.22);
    ctx.fillRect(-1, -1, 2, 12);
    ctx.fillStyle = shade(pal.shirt, 0.08);
    ctx.beginPath();
    ctx.moveTo(-7, -3);
    ctx.lineTo(0, 0);
    ctx.lineTo(7, -3);
    ctx.stroke();

    // Arms + hands
    drawLimb(-10 + armSwing * 0.25, 1 + armSwing * 0.2, 4.5, 10, -0.35 + armSwing * 0.06, shade(pal.shirt, -0.06));
    drawLimb(10 - armSwing * 0.25, 1 - armSwing * 0.2, 4.5, 10, 0.35 - armSwing * 0.06, shade(pal.shirt, -0.06));
    const handG = ctx.createRadialGradient(0, 0, 0, 0, 0, 3);
    handG.addColorStop(0, shade(pal.skin, 0.08));
    handG.addColorStop(1, shade(pal.skin, -0.1));
    ctx.fillStyle = handG;
    ctx.beginPath();
    ctx.arc(-10 + armSwing * 0.25, 8 + armSwing * 0.2, 2.6, 0, Math.PI * 2);
    ctx.arc(10 - armSwing * 0.25, 8 - armSwing * 0.2, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = shade(pal.skin, -0.05);
    ctx.fillRect(-2.5, -8, 5, 4);

    // Head
    const headG = ctx.createRadialGradient(-2.5, -13, 1, 0, -11, 8.5);
    headG.addColorStop(0, shade(pal.skin, 0.12));
    headG.addColorStop(0.65, pal.skin);
    headG.addColorStop(1, shade(pal.skin, -0.14));
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.ellipse(0, -11, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = pal.hair;
    ctx.beginPath();
    ctx.ellipse(0, -13.5, 7.5, 5.5, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-5, -12, 3, 0, Math.PI * 2);
    ctx.arc(5, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    if (!dead) {
      ctx.fillStyle = "#fafafa";
      ctx.beginPath();
      ctx.ellipse(-2.5, -11.2, 2, 2.2, 0, 0, Math.PI * 2);
      ctx.ellipse(2.5, -11.2, 2, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(-2.3, -11, 1.1, 0, Math.PI * 2);
      ctx.arc(2.7, -11, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(-0.8, -9.2, 1.6, 1.2);
      ctx.strokeStyle = "rgba(120,80,60,0.35)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(0, -8.8, 1.2, 0.1, Math.PI - 0.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(180,40,40,0.5)";
      ctx.beginPath();
      ctx.ellipse(2, -10, 4, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (opts.roleEmoji && !dead && opts.isYou) {
      ctx.font = "11px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.9;
      ctx.fillText(opts.roleEmoji, x, py - 34);
      ctx.globalAlpha = 1;
    }

    drawNameTag(ctx, x, py, dead ? "" : opts.name, opts.isYou, opts.tagColor || null, opts.tagAlpha);

    if (opts.isYou && !dead) {
      const ring = ctx.createRadialGradient(x, py, 8, x, py, 22);
      ring.addColorStop(0, "rgba(255,255,255,0)");
      ring.addColorStop(0.7, "rgba(255,255,255,0.12)");
      ring.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.ellipse(x, py + 2, 20, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFloorTile(ctx, c, r, room, animT) {
    const x = c * RRMap.TILE;
    const y = r * RRMap.TILE;
    const T = RRMap.TILE;
    const base = room ? room.floor : "#9e9e9e";
    const h = hash(c, r, 1);
    const pattern = room ? room.floorPattern : "concrete";
    const wear = (h % 9) * 0.004;

    const floorG = ctx.createLinearGradient(x, y, x + T, y + T);
    floorG.addColorStop(0, shade(base, 0.03 + wear));
    floorG.addColorStop(0.5, shade(base, -0.01));
    floorG.addColorStop(1, shade(base, -0.04 - wear));
    ctx.fillStyle = floorG;
    ctx.fillRect(x, y, T, T);

    if (pattern === "linoleum") {
      const alt = (c + r) % 2 === 0;
      ctx.fillStyle = alt ? shade(base, 0.05) : shade(base, -0.04);
      ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(x + 3, y + 3, T - 8, 2);
    } else if (pattern === "tile") {
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(x + 2, y + 2, T - 4, 4);
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      ctx.fillRect(x + T / 2 - 0.5, y, 1, T);
      ctx.fillRect(x, y + T / 2 - 0.5, T, 1);
    } else if (pattern === "carpet") {
      const n = h % 7;
      for (let i = 0; i < 12; i++) {
        const px = x + (n + i * 11) % (T - 4) + 2;
        const py = y + (n + i * 7) % (T - 4) + 2;
        ctx.fillStyle = shade(base, ((n + i) % 5) * 0.012 - 0.02);
        ctx.fillRect(px, py, 1.5, 1.5);
      }
      ctx.fillStyle = "rgba(0,0,0,0.02)";
      ctx.fillRect(x, y, T, 2);
    } else if (pattern === "hardwood") {
      const plank = c % 3;
      ctx.fillStyle = shade(base, plank * 0.035 - 0.05);
      ctx.fillRect(x, y, T, T);
      ctx.strokeStyle = "rgba(0,0,0,0.14)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y + T * 0.5);
      ctx.lineTo(x + T, y + T * 0.5);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.07)";
      ctx.beginPath();
      ctx.moveTo(x + T * 0.33, y);
      ctx.lineTo(x + T * 0.33, y + T);
      ctx.moveTo(x + T * 0.66, y);
      ctx.lineTo(x + T * 0.66, y + T);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x + 2, y + 3 + plank * 2, T - 6, 2);
    } else if (pattern === "wood") {
      ctx.fillStyle = shade(base, ((c + r) % 3) * 0.028 - 0.035);
      ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
      const grain = ctx.createLinearGradient(x, y, x + T, y);
      grain.addColorStop(0, "rgba(0,0,0,0.04)");
      grain.addColorStop(0.5, "rgba(255,255,255,0.03)");
      grain.addColorStop(1, "rgba(0,0,0,0.03)");
      ctx.fillStyle = grain;
      ctx.fillRect(x + 2, y + 4, T - 4, T - 10);
    } else if (pattern === "marble") {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 3, y + 3, T - 6, T - 6);
      if ((c + r) % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        ctx.fillRect(x + 2, y + 2, T / 2 - 1, T / 2 - 1);
      }
    }

    const nearWall = RRMap.tiles[r * RRMap.COLS + c] === 0
      || (c > 0 && RRMap.tiles[r * RRMap.COLS + c - 1] === 0)
      || (c < RRMap.COLS - 1 && RRMap.tiles[r * RRMap.COLS + c + 1] === 0)
      || (r > 0 && RRMap.tiles[(r - 1) * RRMap.COLS + c] === 0)
      || (r < RRMap.ROWS - 1 && RRMap.tiles[(r + 1) * RRMap.COLS + c] === 0);
    if (nearWall) {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
    }
  }

  function drawMansionExteriorWall(ctx, c, r) {
    const x = c * RRMap.TILE;
    const y = r * RRMap.TILE;
    const T = RRMap.TILE;
    const h = hash(c, r, 9);

    const g = ctx.createLinearGradient(x, y, x + T * 0.3, y + T);
    g.addColorStop(0, "#6d6d6d");
    g.addColorStop(0.4, "#5a5a5a");
    g.addColorStop(1, "#424242");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, T, T);

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.strokeRect(x + 4 + i * 11, y + 6 + (h % 3) * 2, 9, 5);
    }
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x, y + T - 6, T, 6);

    if (h % 3 === 0) {
      const wx = x + 8;
      const wy = y + 10;
      const ww = T - 16;
      const wh = 14;
      ctx.fillStyle = "#1a237e";
      ctx.fillRect(wx, wy, ww, wh);
      const winG = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
      winG.addColorStop(0, "rgba(187,222,251,0.55)");
      winG.addColorStop(0.5, "rgba(144,202,249,0.35)");
      winG.addColorStop(1, "rgba(66,66,66,0.5)");
      ctx.fillStyle = winG;
      ctx.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
      ctx.strokeStyle = "#37474f";
      ctx.lineWidth = 2;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy + 2);
      ctx.lineTo(wx + ww / 2, wy + wh - 2);
      ctx.moveTo(wx + 2, wy + wh / 2);
      ctx.lineTo(wx + ww - 2, wy + wh / 2);
      ctx.stroke();
    }
  }

  function drawOuterGround(ctx, c, r) {
    const x = c * RRMap.TILE;
    const y = r * RRMap.TILE;
    const T = RRMap.TILE;
    const g = ctx.createLinearGradient(x, y, x + T, y + T);
    g.addColorStop(0, "#2e4a2e");
    g.addColorStop(1, "#1a331a");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, T, T);
  }

  function drawWallTile(ctx, c, r) {
    if (RRMap.isExteriorWall && RRMap.isExteriorWall(c, r)) {
      drawMansionExteriorWall(ctx, c, r);
    } else {
      drawOuterGround(ctx, c, r);
    }
  }

  function drawInteriorWallEdge(ctx, c, r, room) {
    if (!room) return;
    const x = c * RRMap.TILE;
    const y = r * RRMap.TILE;
    const T = RRMap.TILE;
    const onTop = r === room.r0;
    const onBottom = r === room.r1;
    const onLeft = c === room.c0;
    const onRight = c === room.c1;
    if (!onTop && !onBottom && !onLeft && !onRight) return;

    const wainG = ctx.createLinearGradient(x, y + T * 0.45, x, y + T);
    wainG.addColorStop(0, shade(room.accent || "#5d4037", 0.15));
    wainG.addColorStop(1, shade(room.accent || "#5d4037", -0.2));
    ctx.fillStyle = wainG;
    if (onTop) ctx.fillRect(x, y, T, Math.floor(T * 0.42));
    if (onBottom) ctx.fillRect(x, y + T - Math.floor(T * 0.42), T, Math.floor(T * 0.42));
    if (onLeft) ctx.fillRect(x, y, Math.floor(T * 0.42), T);
    if (onRight) ctx.fillRect(x + T - Math.floor(T * 0.42), y, Math.floor(T * 0.42), T);

    const trimG = ctx.createLinearGradient(x, y, x + T, y);
    trimG.addColorStop(0, "#f5f0e8");
    trimG.addColorStop(0.5, "#e8e0d4");
    trimG.addColorStop(1, "#d7cfc4");
    ctx.fillStyle = trimG;
    const trim = 6;
    if (onTop) ctx.fillRect(x, y, T, trim);
    if (onBottom) ctx.fillRect(x, y + T - trim, T, trim);
    if (onLeft) ctx.fillRect(x, y, trim, T);
    if (onRight) ctx.fillRect(x + T - trim, y, trim, T);

    ctx.fillStyle = "rgba(0,0,0,0.14)";
    if (onTop) ctx.fillRect(x, y + trim - 1, T, 1);
    if (onBottom) ctx.fillRect(x, y + T - trim, T, 1);
    if (onLeft) ctx.fillRect(x + trim - 1, y, 1, T);
    if (onRight) ctx.fillRect(x + T - trim, y, 1, T);
  }

  function drawDoorTile(ctx, c, r) {
    const x = c * RRMap.TILE;
    const y = r * RRMap.TILE;
    const T = RRMap.TILE;

    ctx.fillStyle = "#3e2723";
    ctx.fillRect(x + 1, y + 1, T - 2, T - 2);

    const doorG = ctx.createLinearGradient(x + 4, y, x + T - 4, y + T);
    doorG.addColorStop(0, "#6d4c41");
    doorG.addColorStop(0.35, "#5d4037");
    doorG.addColorStop(1, "#4e342e");
    ctx.fillStyle = doorG;
    ctx.fillRect(x + 4, y + 3, T - 8, T - 6);

    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 6, y + 5, T - 12, T - 10);
    ctx.strokeRect(x + 8, y + 8, T - 16, (T - 14) / 2 - 1);

    const hl = ctx.createLinearGradient(x + 8, y + 6, x + 14, y + T - 8);
    hl.addColorStop(0, "rgba(255,255,255,0.2)");
    hl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hl;
    ctx.fillRect(x + 8, y + 6, 5, T - 14);

    const knobG = ctx.createRadialGradient(x + T - 11, y + T / 2, 0, x + T - 11, y + T / 2, 4);
    knobG.addColorStop(0, "#ffe082");
    knobG.addColorStop(0.6, "#ffb300");
    knobG.addColorStop(1, "#ff8f00");
    ctx.fillStyle = knobG;
    ctx.beginPath();
    ctx.arc(x + T - 11, y + T / 2, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRoomLabel(ctx, room) {
    const cx = ((room.c0 + room.c1) / 2 + 0.5) * RRMap.TILE;
    const ty = room.r0 * RRMap.TILE + 14;
    ctx.font = "500 9px system-ui, -apple-system, sans-serif";
    const tw = ctx.measureText(room.label).width;
    ctx.fillStyle = "rgba(20,18,16,0.55)";
    ctx.beginPath();
    ctx.roundRect(cx - tw / 2 - 7, ty - 8, tw + 14, 12, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,248,240,0.88)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(room.label, cx, ty - 1);
  }

  function getPropsForRoom(room) {
    const list = [];
    const midC = Math.floor((room.c0 + room.c1) / 2);
    const midR = Math.floor((room.r0 + room.r1) / 2);

    if (room.id === "foyer") {
      list.push({ type: "chandelier", c: midC, r: room.r0 + 1 });
      list.push({ type: "statue", c: room.c0 + 1, r: midR });
      list.push({ type: "statue", c: room.c1 - 1, r: midR });
      list.push({ type: "rug", c: midC, r: room.r1 - 1 });
    } else if (room.id === "stairhall") {
      list.push({ type: "stairs", c: midC, r: midR });
      list.push({ type: "portrait", c: room.c0 + 1, r: room.r0 + 1 });
      list.push({ type: "portrait", c: room.c1 - 1, r: room.r0 + 1 });
    } else if (room.id === "main_hall") {
      list.push({ type: "chandelier", c: midC, r: room.r0 + 1 });
      list.push({ type: "fireplace", c: midC, r: room.r1 - 1 });
      list.push({ type: "rug", c: midC, r: midR });
    } else if (room.id === "ballroom") {
      list.push({ type: "chandelier", c: midC, r: room.r0 + 1 });
      list.push({ type: "chandelier", c: room.c0 + 2, r: room.r0 + 2 });
      list.push({ type: "chandelier", c: room.c1 - 2, r: room.r0 + 2 });
      list.push({ type: "piano", c: midC, r: room.r1 - 1 });
    } else if (room.id === "library") {
      list.push({ type: "bookshelf", c: room.c0 + 1, r: room.r0 + 1 });
      list.push({ type: "bookshelf", c: room.c1 - 1, r: room.r0 + 1 });
      list.push({ type: "bookshelf", c: room.c0 + 1, r: room.r1 - 1 });
      list.push({ type: "readingTable", c: midC, r: midR });
    } else if (room.id === "study") {
      list.push({ type: "desk", c: midC, r: midR });
      list.push({ type: "portrait", c: room.c1 - 1, r: room.r0 + 1 });
      list.push({ type: "filingCabinet", c: room.c0 + 1, r: midR });
    } else if (room.id === "lounge") {
      list.push({ type: "sofa", c: midC, r: midR });
      list.push({ type: "fireplace", c: room.c1 - 1, r: midR });
      list.push({ type: "lamp", c: room.c0 + 1, r: room.r0 + 1 });
    } else if (room.id === "conservatory") {
      list.push({ type: "plant", c: room.c0 + 1, r: midR });
      list.push({ type: "plant", c: room.c1 - 1, r: midR });
      list.push({ type: "fountain", c: midC, r: midR });
    } else if (room.id === "dining") {
      list.push({ type: "diningTable", c: midC, r: midR });
      list.push({ type: "chandelier", c: midC, r: room.r0 + 1 });
      list.push({ type: "chair", c: room.c0 + 2, r: midR + 1 });
      list.push({ type: "chair", c: room.c1 - 2, r: midR + 1 });
    } else if (room.id === "kitchen") {
      list.push({ type: "stove", c: midC, r: room.r0 + 1 });
      list.push({ type: "crate", c: room.c0 + 1, r: midR });
    } else if (room.id === "gallery") {
      list.push({ type: "portrait", c: room.c0 + 1, r: room.r0 + 2 });
      list.push({ type: "portrait", c: room.c1 - 1, r: room.r0 + 2 });
      list.push({ type: "portrait", c: midC, r: midR });
      list.push({ type: "statue", c: midC, r: room.r1 - 1 });
    } else if (room.id === "servants") {
      list.push({ type: "crate", c: midC, r: midR });
      list.push({ type: "lamp", c: room.c1 - 1, r: midR });
    }
    return list;
  }

  function drawProp(ctx, p, animT) {
    animT = animT || 0;
    const x = p.c * RRMap.TILE;
    const y = p.r * RRMap.TILE;
    const T = RRMap.TILE;
    const cx = x + T / 2;
    const cy = y + T - 6;
    drawSoftShadow(ctx, cx, cy, T * 0.32, 7, 0.3);

    if (p.type === "desk") {
      const topG = ctx.createLinearGradient(x + 8, y + 14, x + T - 8, y + 22);
      topG.addColorStop(0, "#a1887f");
      topG.addColorStop(0.5, "#8d6e63");
      topG.addColorStop(1, "#6d4c41");
      ctx.fillStyle = topG;
      ctx.fillRect(x + 8, y + 14, T - 16, 8);
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(x + 12, y + 22, 4, 6);
      ctx.fillRect(x + T - 16, y + 22, 4, 6);
    } else if (p.type === "chalkboard") {
      ctx.fillStyle = "#2e7d32";
      ctx.fillRect(x + 6, y + 6, T - 12, 14);
      ctx.fillStyle = "#1b5e20";
      ctx.fillRect(x + 8, y + 8, T - 16, 10);
      ctx.strokeStyle = "#795548";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 6, T - 12, 14);
    } else if (p.type === "lockers") {
      ctx.fillStyle = "#607d8b";
      ctx.fillRect(x + 4, y + 4, T - 8, T - 8);
      ctx.strokeStyle = "#455a64";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.strokeRect(x + 6 + i * 10, y + 6, 8, T - 12);
      }
    } else if (p.type === "bench") {
      ctx.fillStyle = "#795548";
      ctx.fillRect(x + 6, y + 18, T - 12, 5);
      ctx.fillRect(x + 10, y + 22, 3, 5);
      ctx.fillRect(x + T - 13, y + 22, 3, 5);
    } else if (p.type === "labBench") {
      ctx.fillStyle = "#78909c";
      ctx.fillRect(x + 4, y + 16, T - 8, 10);
      ctx.fillStyle = "#eceff1";
      ctx.fillRect(x + 8, y + 12, 8, 6);
      ctx.fillRect(x + T - 16, y + 12, 8, 6);
    } else if (p.type === "beaker") {
      ctx.fillStyle = "rgba(129,212,250,0.7)";
      ctx.fillRect(x + T / 2 - 4, y + 10, 8, 12);
      ctx.strokeStyle = "#455a64";
      ctx.strokeRect(x + T / 2 - 4, y + 10, 8, 12);
    } else if (p.type === "hoop") {
      ctx.strokeStyle = "#ff6f00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 8, y + 4, T - 16, 8);
      ctx.beginPath();
      ctx.arc(cx, y + 18, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === "ball") {
      ctx.fillStyle = "#ff7043";
      ctx.beginPath();
      ctx.arc(cx, y + 20, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#bf360c";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (p.type === "cafeteriaTable") {
      ctx.fillStyle = "#bdbdbd";
      ctx.fillRect(x + 4, y + 14, T - 8, 10);
      ctx.fillStyle = "#757575";
      ctx.fillRect(x + 8, y + 24, 3, 5);
      ctx.fillRect(x + T - 11, y + 24, 3, 5);
    } else if (p.type === "bookshelf") {
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(x + 6, y + 4, T - 12, T - 8);
      ctx.fillStyle = "#8d6e63";
      for (let row = 0; row < 3; row++) {
        ctx.fillRect(x + 8, y + 6 + row * 9, T - 16, 2);
      }
      const colors = ["#c62828", "#1565c0", "#2e7d32", "#6a1b9a"];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x + 9 + i * 4, y + 8, 3, 6);
      }
    } else if (p.type === "readingTable") {
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(x + 8, y + 16, T - 16, 8);
    } else if (p.type === "chair") {
      ctx.fillStyle = "#455a64";
      ctx.fillRect(x + 12, y + 16, T - 24, 8);
      ctx.fillRect(x + 14, y + 12, T - 28, 6);
    } else if (p.type === "filingCabinet") {
      ctx.fillStyle = "#78909c";
      ctx.fillRect(x + 10, y + 8, T - 20, T - 12);
      ctx.strokeStyle = "#546e7a";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 10, y + 8, T - 20, (T - 12) / 3);
      ctx.strokeRect(x + 10, y + 8 + (T - 12) / 3, T - 20, (T - 12) / 3);
    } else if (p.type === "chandelier") {
      const flicker = 0.82 + Math.sin(animT * 0.09 + p.c * 0.5) * 0.18;
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, y + 2);
      ctx.lineTo(cx, y + 12);
      ctx.stroke();
      const glow = ctx.createRadialGradient(cx, y + 14, 0, cx, y + 14, 14);
      glow.addColorStop(0, `rgba(255,248,220,${0.95 * flicker})`);
      glow.addColorStop(0.5, `rgba(255,213,79,${0.5 * flicker})`);
      glow.addColorStop(1, "rgba(255,213,79,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, y + 14, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,200,${flicker})`;
      ctx.beginPath();
      ctx.arc(cx - 5, y + 15, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 5, y + 15, 2.5, 0, Math.PI * 2);
      ctx.arc(cx, y + 17, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "fireplace") {
      ctx.fillStyle = "#37474f";
      ctx.fillRect(x + 6, y + 6, T - 12, T - 8);
      ctx.fillStyle = "#263238";
      ctx.fillRect(x + 10, y + 10, T - 20, T - 14);
      const flicker = 0.75 + Math.sin(animT * 0.14 + p.r) * 0.25;
      const fireG = ctx.createLinearGradient(x + 12, y + 18, x + T - 12, y + T - 6);
      fireG.addColorStop(0, `rgba(255,213,79,${0.9 * flicker})`);
      fireG.addColorStop(0.5, `rgba(255,87,34,${0.85 * flicker})`);
      fireG.addColorStop(1, `rgba(191,54,12,${0.6 * flicker})`);
      ctx.fillStyle = fireG;
      ctx.fillRect(x + 14, y + 16, T - 28, T - 22);
    } else if (p.type === "stairs") {
      ctx.fillStyle = "#5d4037";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 8 + i * 4, y + 10 + i * 5, T - 16 - i * 4, 5);
      }
    } else if (p.type === "portrait") {
      const frameG = ctx.createLinearGradient(x + 8, y + 6, x + T - 8, y + T - 6);
      frameG.addColorStop(0, "#d4af37");
      frameG.addColorStop(0.5, "#b8860b");
      frameG.addColorStop(1, "#8b6914");
      ctx.fillStyle = frameG;
      ctx.fillRect(x + 8, y + 6, T - 16, T - 10);
      ctx.fillStyle = "#1a237e";
      ctx.fillRect(x + 12, y + 10, T - 24, T - 16);
      const faceG = ctx.createRadialGradient(cx, y + 16, 2, cx, y + 18, 10);
      faceG.addColorStop(0, "#d7ccc8");
      faceG.addColorStop(1, "#8d6e63");
      ctx.fillStyle = faceG;
      ctx.beginPath();
      ctx.ellipse(cx, y + 18, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(cx - 7, y + 10, 14, 5);
    } else if (p.type === "piano") {
      const bodyG = ctx.createLinearGradient(x + 6, y + 12, x + T - 6, y + T);
      bodyG.addColorStop(0, "#424242");
      bodyG.addColorStop(1, "#212121");
      ctx.fillStyle = bodyG;
      ctx.fillRect(x + 6, y + 14, T - 12, 12);
      ctx.fillStyle = "#fafafa";
      for (let k = 0; k < 6; k++) ctx.fillRect(x + 9 + k * 4.5, y + 10, 2.5, 8);
      ctx.fillStyle = "#1a1a1a";
      for (let k = 0; k < 4; k++) ctx.fillRect(x + 11 + k * 5.5, y + 11, 3, 6);
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(x + 8, y + 24, 4, 3);
    } else if (p.type === "sofa") {
      const fabricG = ctx.createLinearGradient(x, y + 10, x + T, y + T);
      fabricG.addColorStop(0, "#7b1fa2");
      fabricG.addColorStop(0.5, "#6a1b9a");
      fabricG.addColorStop(1, "#4a148c");
      ctx.fillStyle = fabricG;
      ctx.fillRect(x + 6, y + 14, T - 12, 10);
      ctx.fillRect(x + 4, y + 10, 8, 10);
      ctx.fillRect(x + T - 12, y + 10, 8, 10);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(x + 8, y + 22, T - 16, 2);
    } else if (p.type === "rug") {
      const rugG = ctx.createRadialGradient(cx, cy - 4, 2, cx, cy - 4, 16);
      rugG.addColorStop(0, "rgba(183,28,28,0.65)");
      rugG.addColorStop(0.7, "rgba(136,14,79,0.45)");
      rugG.addColorStop(1, "rgba(74,20,140,0.2)");
      ctx.fillStyle = rugG;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 4, 15, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,215,64,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (p.type === "statue") {
      const stoneG = ctx.createLinearGradient(cx - 8, y + 8, cx + 8, y + T - 4);
      stoneG.addColorStop(0, "#b0bec5");
      stoneG.addColorStop(1, "#78909c");
      ctx.fillStyle = stoneG;
      ctx.fillRect(cx - 6, y + 10, 12, T - 14);
      ctx.beginPath();
      ctx.ellipse(cx, y + 12, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eceff1";
      ctx.fillRect(cx - 10, y + T - 8, 20, 4);
    } else if (p.type === "plant") {
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(cx - 5, y + 18, 10, 8);
      const leafG = ctx.createRadialGradient(cx, y + 12, 2, cx, y + 10, 12);
      leafG.addColorStop(0, "#66bb6a");
      leafG.addColorStop(1, "#2e7d32");
      ctx.fillStyle = leafG;
      ctx.beginPath();
      ctx.ellipse(cx - 6, y + 10, 8, 10, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + 6, y + 10, 8, 10, 0.3, 0, Math.PI * 2);
      ctx.ellipse(cx, y + 6, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "fountain") {
      ctx.fillStyle = "#78909c";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      const waterG = ctx.createRadialGradient(cx, cy - 2, 2, cx, cy, 12);
      waterG.addColorStop(0, "rgba(144,202,249,0.85)");
      waterG.addColorStop(1, "rgba(25,118,210,0.5)");
      ctx.fillStyle = waterG;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "diningTable") {
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(x + 4, y + 14, T - 8, 10);
      ctx.fillRect(x + 8, y + 22, 3, 6);
      ctx.fillRect(x + T - 11, y + 22, 3, 6);
    } else if (p.type === "lamp") {
      ctx.fillStyle = "#455a64";
      ctx.fillRect(cx - 2, y + 8, 4, 16);
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(cx, y + 8, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "stove") {
      ctx.fillStyle = "#424242";
      ctx.fillRect(x + 8, y + 10, T - 16, T - 12);
    } else if (p.type === "crate") {
      ctx.fillStyle = "#a1887f";
      ctx.fillRect(x + 8, y + 12, T - 16, T - 14);
      ctx.strokeStyle = "#5d4037";
      ctx.strokeRect(x + 8, y + 12, T - 16, T - 14);
    }
  }

  function drawMeetingSpot(ctx, s, animT, done) {
    const pulse = 0.4 + Math.sin(animT * 0.05) * 0.25;
    ctx.save();
    ctx.translate(s.x, s.y);
    drawSoftShadow(ctx, 0, 12, 20, 7, 0.28);
    const ring = ctx.createRadialGradient(0, 0, 8, 0, 0, 22);
    ring.addColorStop(0, done ? "rgba(76,175,80,0.35)" : `rgba(255,193,7,${pulse * 0.35})`);
    ring.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = done ? "rgba(56,142,60,0.9)" : `rgba(255,160,0,${0.55 + pulse * 0.3})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    const plate = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
    plate.addColorStop(0, "rgba(255,255,255,0.95)");
    plate.addColorStop(1, "rgba(230,230,230,0.88)");
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "17px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(done ? "✓" : s.emoji, 0, 1);
    ctx.restore();
  }

  function drawAmbientBackground(ctx, cam, w, h, isNight) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (isNight) {
      g.addColorStop(0, "#0a0e1a");
      g.addColorStop(0.45, "#141c2e");
      g.addColorStop(1, "#06080f");
    } else {
      g.addColorStop(0, "#2c3e6b");
      g.addColorStop(0.35, "#4a5f8c");
      g.addColorStop(0.7, "#6b7fa8");
      g.addColorStop(1, "#1e2a18");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (!isNight) {
      const moon = ctx.createRadialGradient(w * 0.78, h * 0.12, 4, w * 0.78, h * 0.12, 42);
      moon.addColorStop(0, "rgba(255,253,231,0.9)");
      moon.addColorStop(0.4, "rgba(255,249,196,0.35)");
      moon.addColorStop(1, "rgba(255,249,196,0)");
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.12, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 80; i++) {
      const a = isNight ? 0.015 + (i % 4) * 0.008 : 0.02 + (i % 3) * 0.01;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect((i * 97 + Math.floor(cam.x * 0.02)) % w, (i * 61) % h, 1, 1);
    }
  }

  function drawRoomCeilingLight(ctx, room, animT, isNight) {
    const cx = ((room.c0 + room.c1) / 2 + 0.5) * RRMap.TILE;
    const cy = ((room.r0 + room.r1) / 2 + 0.5) * RRMap.TILE;
    const rw = (room.c1 - room.c0 + 1) * RRMap.TILE;
    const rh = (room.r1 - room.r0 + 1) * RRMap.TILE;
    const flicker = isNight ? 0.82 + Math.sin(animT * 0.05 + room.c0 * 0.7) * 0.12 : 1;

    if (isNight) {
      const pool = ctx.createRadialGradient(cx, cy, 12, cx, cy, rw * 0.58);
      pool.addColorStop(0, `rgba(255,236,179,${0.2 * flicker})`);
      pool.addColorStop(0.35, `rgba(255,200,120,${0.08 * flicker})`);
      pool.addColorStop(0.65, `rgba(255,160,60,${0.02 * flicker})`);
      pool.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pool;
      ctx.fillRect(room.c0 * RRMap.TILE, room.r0 * RRMap.TILE, rw, rh);
    } else {
      const sun = ctx.createRadialGradient(cx - rw * 0.12, cy - rh * 0.2, 8, cx, cy, rw * 0.62);
      sun.addColorStop(0, "rgba(255,252,240,0.16)");
      sun.addColorStop(0.4, "rgba(255,248,220,0.07)");
      sun.addColorStop(0.75, "rgba(255,255,255,0.02)");
      sun.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(room.c0 * RRMap.TILE, room.r0 * RRMap.TILE, rw, rh);
    }

    const lx = cx;
    const ly = room.r0 * RRMap.TILE + 12;
    ctx.fillStyle = isNight ? "#eceff1" : "#fafafa";
    ctx.fillRect(lx - 22, ly, 44, 6);
    ctx.fillStyle = isNight ? `rgba(255,235,59,${0.5 * flicker})` : "rgba(255,255,255,0.9)";
    ctx.fillRect(lx - 18, ly + 1, 36, 3);
    if (isNight) {
      ctx.shadowColor = "#fff9c4";
      ctx.shadowBlur = 12 * flicker;
      ctx.fillRect(lx - 8, ly + 1, 16, 2);
      ctx.shadowBlur = 0;
    }
  }

  function drawCorridorFluorescents(ctx, c, r, animT, isNight) {
    const room = RRMap.ROOM_DEFS.find(
      (rm) => c >= rm.c0 && c <= rm.c1 && r >= rm.r0 && r <= rm.r1
    );
    const hallLike = room && ["main_hall", "stairhall", "foyer"].includes(room.id);
    if (!hallLike) return;
    if ((c + r) % 3 !== 0) return;
    const x = c * RRMap.TILE + RRMap.TILE / 2;
    const y = r * RRMap.TILE + 6;
    const flicker = isNight ? 0.9 + Math.sin(animT * 0.06 + c) * 0.1 : 1;
    ctx.fillStyle = "#cfd8dc";
    ctx.fillRect(x - 14, y, 28, 4);
    ctx.fillStyle = isNight ? `rgba(255,255,200,${0.65 * flicker})` : "rgba(255,255,255,0.85)";
    ctx.fillRect(x - 12, y + 1, 24, 2);
  }

  function drawBloodStain(ctx, x, y) {
    const g = ctx.createRadialGradient(x, y + 10, 1, x, y + 12, 26);
    g.addColorStop(0, "rgba(120,12,12,0.72)");
    g.addColorStop(0.35, "rgba(90,8,8,0.45)");
    g.addColorStop(0.7, "rgba(60,5,5,0.15)");
    g.addColorStop(1, "rgba(40,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 22, 11, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(100,10,10,0.4)";
    ctx.beginPath();
    ctx.ellipse(x - 8, y + 14, 10, 5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 10, y + 13, 7, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,0,0,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 10);
    ctx.quadraticCurveTo(x - 4, y + 18, x + 6, y + 8);
    ctx.stroke();
  }

  function visibleTileRange(cam, w, h) {
    const pad = 2;
    const minCol = Math.max(0, Math.floor((cam.x - w / 2) / RRMap.TILE) - pad);
    const maxCol = Math.min(RRMap.COLS - 1, Math.ceil((cam.x + w / 2) / RRMap.TILE) + pad);
    const minRow = Math.max(0, Math.floor((cam.y - h / 2) / RRMap.TILE) - pad);
    const maxRow = Math.min(RRMap.ROWS - 1, Math.ceil((cam.y + h / 2) / RRMap.TILE) + pad);
    return { minCol, maxCol, minRow, maxRow };
  }

  function drawWorld(ctx, cam, w, h, animT, taskFlags, bodies, players, remotePlayers, playerColors, opts) {
    opts = opts || {};
    const isNight = !!opts.isNight;
    const viewerFaction = opts.viewerFaction || null;
    const viewerX = opts.viewerX == null ? cam.x : opts.viewerX;
    const viewerY = opts.viewerY == null ? cam.y : opts.viewerY;
    const isMeeting = !!opts.isMeeting;

    function visibilityByDistance(targetX, targetY, isSelf) {
      if (isSelf || isMeeting) return 1;
      if (viewerFaction === "betray") return 1;
      const d = Math.hypot((targetX || 0) - viewerX, (targetY || 0) - viewerY);
      const full = isNight ? 90 : 140;
      const fade = isNight ? 220 : 320;
      if (d <= full) return 1;
      if (d >= fade) return 0;
      return 1 - (d - full) / (fade - full);
    }

    function nameForVisibility(p, tagAlpha) {
      if (viewerFaction === "betray") return p.name;
      if (tagAlpha >= 0.5) return p.name;
      return "";
    }

    drawAmbientBackground(ctx, cam, w, h, isNight);

    ctx.save();
    ctx.translate(w / 2 - cam.x, h / 2 - cam.y);

    const vis = visibleTileRange(cam, w, h);

    for (let r = vis.minRow; r <= vis.maxRow; r++) {
      for (let c = vis.minCol; c <= vis.maxCol; c++) {
        const t = RRMap.tiles[r * RRMap.COLS + c];
        if (t >= 1) {
          const room = RRMap.ROOM_DEFS.find((rm) => c >= rm.c0 && c <= rm.c1 && r >= rm.r0 && r <= rm.r1);
          drawFloorTile(ctx, c, r, room, animT);
          drawInteriorWallEdge(ctx, c, r, room);
          if (t === 2) drawDoorTile(ctx, c, r);
          drawCorridorFluorescents(ctx, c, r, animT, isNight);
        } else {
          drawWallTile(ctx, c, r);
        }
      }
    }

    RRMap.ROOM_DEFS.forEach((room) => {
      if (room.accentGlow) {
        const lx = (room.c0 + (room.c1 - room.c0) / 2 + 0.5) * RRMap.TILE;
        const ly = (room.r0 + (room.r1 - room.r0) / 2 + 0.5) * RRMap.TILE;
        const ag = ctx.createRadialGradient(lx, ly, 20, lx, ly, RRMap.TILE * 3.2);
        ag.addColorStop(0, room.accentGlow);
        ag.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ag;
        ctx.fillRect(
          room.c0 * RRMap.TILE,
          room.r0 * RRMap.TILE,
          (room.c1 - room.c0 + 1) * RRMap.TILE,
          (room.r1 - room.r0 + 1) * RRMap.TILE
        );
      }
      drawRoomCeilingLight(ctx, room, animT, isNight);
      drawRoomLabel(ctx, room);
      getPropsForRoom(room).forEach((p) => drawProp(ctx, p, animT));
    });

    RRMap.getTaskStations().forEach((s) => drawMeetingSpot(ctx, s, animT, !!taskFlags[s.taskId]));

    const entities = [];

    (bodies || []).forEach((b) => {
      entities.push({
        y: b.y,
        draw: () => {
          drawBloodStain(ctx, b.x, b.y);
          drawRealisticPlayer(ctx, b.x, b.y, b.color.hex, {
            dead: true,
            name: b.name,
            seed: hash(Math.round(b.x), Math.round(b.y), 1),
          });
        },
      });
    });

    (players || []).filter((p) => p.alive).forEach((p) => {
      const isSelf = p.id === "you";
      const tagAlpha = visibilityByDistance(p.x, p.y, isSelf);
      const tagColor = isSelf && viewerFaction === "betray"
        ? "red"
        : nameTagColorForViewer(viewerFaction, p);
      entities.push({
        y: p.y,
        draw: () => {
          drawRealisticPlayer(ctx, p.x, p.y, p.color.hex, {
            facing: p.facing || 1,
            moving: p.moving,
            walkPhase: p.walkPhase || 0,
            name: nameForVisibility(p, tagAlpha),
            isYou: isSelf,
            roleEmoji: p.role ? p.role.emoji : "",
            tagColor,
            tagAlpha,
            wolfForm: !!p.wolfForm,
            seed: hash(Math.round(p.x), Math.round(p.y), p.roleId ? p.roleId.length : 1),
          });
        },
      });
    });

    (remotePlayers || []).forEach((rp) => {
      if (!rp.state) return;
      const color = playerColors.find((c) => c.id === rp.state.colorId) || playerColors[0];
      const px = rp.state.fx || 260;
      const py = rp.state.fy || 220;
      const tagAlpha = visibilityByDistance(px, py, false);
      const tagColor = nameTagColorForViewer(viewerFaction, {
        faction: rp.state.faction,
        roleId: rp.state.roleId,
        role: rp.state.roleId ? { faction: rp.state.faction, id: rp.state.roleId } : null,
      });
      entities.push({
        y: py,
        draw: () => {
          drawRealisticPlayer(ctx, px, py, color.hex, {
            facing: rp.state.facing || 1,
            moving: !!rp.state.moving,
            walkPhase: rp.state.walkPhase || 0,
            name: nameForVisibility({ name: rp.name || "Player" }, tagAlpha),
            tagColor,
            tagAlpha,
            wolfForm: !!rp.state.wolfForm,
            seed: hash(Math.round(px), Math.round(py), 2),
          });
        },
      });
    });

    entities.sort((a, b) => a.y - b.y);
    entities.forEach((e) => e.draw());

    if (isNight) {
      ctx.fillStyle = "rgba(4,6,14,0.78)";
      ctx.fillRect(-200, -200, RRMap.WORLD_W + 400, RRMap.WORLD_H + 400);

      const sx = viewerX;
      const sy = viewerY;
      const torch = ctx.createRadialGradient(sx, sy, 16, sx, sy, 255);
      torch.addColorStop(0, "rgba(255,220,160,0.32)");
      torch.addColorStop(0.2, "rgba(255,190,120,0.12)");
      torch.addColorStop(0.45, "rgba(100,75,50,0.05)");
      torch.addColorStop(0.7, "rgba(0,0,0,0.42)");
      torch.addColorStop(1, "rgba(0,0,0,0.88)");
      ctx.fillStyle = torch;
      ctx.fillRect(-200, -200, RRMap.WORLD_W + 400, RRMap.WORLD_H + 400);

      RRMap.ROOM_DEFS.forEach((room) => {
        const lx = ((room.c0 + room.c1) / 2 + 0.5) * RRMap.TILE;
        const ly = room.r0 * RRMap.TILE + 20;
        const spill = ctx.createRadialGradient(lx, ly, 5, lx, ly, RRMap.TILE * 2);
        spill.addColorStop(0, "rgba(255,236,179,0.08)");
        spill.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = spill;
        ctx.fillRect(room.c0 * RRMap.TILE, room.r0 * RRMap.TILE, (room.c1 - room.c0 + 1) * RRMap.TILE, RRMap.TILE * 2);
      });
    } else {
      const dayWash = ctx.createLinearGradient(0, -200, RRMap.WORLD_W, RRMap.WORLD_H);
      dayWash.addColorStop(0, "rgba(255,252,240,0.06)");
      dayWash.addColorStop(0.5, "rgba(255,255,255,0.02)");
      dayWash.addColorStop(1, "rgba(100,120,140,0.08)");
      ctx.fillStyle = dayWash;
      ctx.fillRect(-200, -200, RRMap.WORLD_W + 400, RRMap.WORLD_H + 400);
    }

    ctx.restore();

    if (isNight) {
      ctx.fillStyle = "rgba(10,14,28,0.32)";
      ctx.fillRect(0, 0, w, h);
    } else if (isMeeting) {
      ctx.fillStyle = "rgba(255,248,240,0.06)";
      ctx.fillRect(0, 0, w, h);
    }
  }

  window.RRSprites = {
    drawHuman: drawRealisticPlayer,
    drawStickerPlayer: drawRealisticPlayer,
    drawRealisticPlayer,
    drawWorld,
    shade,
  };
})();
