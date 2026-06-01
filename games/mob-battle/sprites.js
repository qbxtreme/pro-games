(function () {
  "use strict";

  const OUTLINE = 4;

  const STYLES = {
    cute: { body: "#ef5350", dark: "#c62828", eye: "#fff" },
    cool: { body: "#42a5f5", dark: "#1565c0", eye: "#fff" },
    wild: { body: "#26c6da", dark: "#00838f", eye: "#fff" },
  };

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

  function stickerStroke(ctx, drawFn) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = OUTLINE + 5;
    drawFn(true);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = OUTLINE;
    drawFn(true);
    drawFn(false);
    ctx.restore();
  }

  function drawSoftShadow(ctx, x, y, rw, rh) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rw);
    g.addColorStop(0, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rw, rh || rw * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawZoneSky(ctx, w, h, camX, camY, zone, animT) {
    const top = zone.skyTop || "#42a5f5";
    const bot = zone.skyBot || "#81d4fa";
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    g.addColorStop(0, top);
    g.addColorStop(0.55, bot);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.6);

    const sunX = w * 0.78;
    const sunY = h * 0.11;
    const sunG = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 52);
    sunG.addColorStop(0, "rgba(255,253,231,0.92)");
    sunG.addColorStop(0.35, "rgba(255,235,59,0.35)");
    sunG.addColorStop(1, "rgba(255,235,59,0)");
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
    ctx.fill();

    for (let c = 0; c < 5; c++) {
      const cx = ((c * 173 + camX * 0.08 + animT * 10) % (w + 120)) - 60;
      const cy = 28 + (c % 3) * 22;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 36 + c * 4, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 24, cy + 4, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (zone.decor === "volcano" || zone.decor === "lava") {
      ctx.fillStyle = "rgba(255,87,34,0.12)";
      ctx.fillRect(0, h * 0.25, w, h * 0.25);
    }

    const mountG = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.55);
    mountG.addColorStop(0, "rgba(66,165,245,0.35)");
    mountG.addColorStop(1, "rgba(129,199,132,0.2)");
    ctx.fillStyle = mountG;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w * 0.2, h * 0.32);
    ctx.lineTo(w * 0.45, h * 0.42);
    ctx.lineTo(w * 0.7, h * 0.28);
    ctx.lineTo(w, h * 0.48);
    ctx.lineTo(w, h * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  function drawPalmTree(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#795548";
    ctx.fillRect(-4, 0, 8, 28);
    ctx.fillStyle = "#43a047";
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i / 5) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(18, -8, 28, 0);
      ctx.quadraticCurveTo(18, 4, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawWorldTile(ctx, sx, sy, tw, th, zone, seed) {
    const base = zone.floor;
    const alt = zone.floorAlt || shade(base, -0.08);
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, shade(base, 0.12));
    g.addColorStop(0.5, base);
    g.addColorStop(1, alt);
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);

    if (zone.decor === "grass" || zone.decor === "forest" || zone.decor === "park") {
      for (let i = 0; i < 3; i++) {
        const gx = sx + ((seed + i * 47) % (tw - 8)) + 4;
        const gy = sy + th - 6 - ((seed + i * 19) % 8);
        ctx.strokeStyle = shade(base, i % 2 ? 0.1 : -0.08);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx + 2, gy - 10, gx + 1, gy - 16);
        ctx.stroke();
      }
    }

    if (zone.decor === "park") {
      const pathW = Math.max(10, tw * 0.32);
      ctx.fillStyle = shade(base, 0.2);
      if ((seed % 3) === 0) ctx.fillRect(sx + (tw - pathW) / 2, sy, pathW, th);
      else if ((seed % 3) === 1) ctx.fillRect(sx, sy + (th - pathW) / 2, tw, pathW);
    }

    if (zone.decor === "lava" && (seed % 7) === 0) {
      ctx.fillStyle = "rgba(255,87,34,0.4)";
      ctx.fillRect(sx + 8, sy + 8, tw - 16, 4);
    }

    if (zone.decor === "ice" || zone.decor === "crystal") {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(sx + 4, sy + 4, tw - 8, 3);
    }

    if ((seed % 17) === 0 && (zone.decor === "grass" || zone.decor === "forest" || zone.decor === "park")) {
      drawPalmTree(ctx, sx + tw * 0.5, sy + th - 4, 0.55);
    }

    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.strokeRect(sx + 0.5, sy + 0.5, tw - 1, th - 1);
  }

  function drawBlockyDinoBody(ctx, c, dark, rx, ry, animT, opts) {
    opts = opts || {};
    const plates = opts.plates !== false;
    const eyeGlow = opts.eyeGlow !== false;

    stickerStroke(ctx, (strokeOnly) => {
      ctx.beginPath();
      ctx.moveTo(-rx * 0.7, ry * 0.1);
      ctx.lineTo(-rx * 0.55, -ry * 0.35);
      ctx.lineTo(-rx * 0.1, -ry * 0.45);
      ctx.lineTo(rx * 0.35, -ry * 0.35);
      ctx.lineTo(rx * 0.75, -ry * 0.05);
      ctx.lineTo(rx * 0.65, ry * 0.35);
      ctx.lineTo(rx * 0.1, ry * 0.5);
      ctx.lineTo(-rx * 0.45, ry * 0.4);
      ctx.closePath();
      if (strokeOnly) ctx.stroke();
      else {
        ctx.fillStyle = c;
        ctx.fill();
      }
    });

    if (plates) {
      ctx.fillStyle = dark;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-rx * 0.35 + i * rx * 0.22, -ry * 0.42);
        ctx.lineTo(-rx * 0.22 + i * rx * 0.22, -ry * 0.62);
        ctx.lineTo(-rx * 0.08 + i * rx * 0.22, -ry * 0.42);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (eyeGlow) {
      ctx.fillStyle = "#ff1744";
      ctx.beginPath();
      ctx.ellipse(rx * 0.45, -ry * 0.12, rx * 0.12, ry * 0.1, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffcdd2";
      ctx.beginPath();
      ctx.ellipse(rx * 0.47, -ry * 0.14, rx * 0.04, ry * 0.035, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (opts.mouthOpen) {
      ctx.fillStyle = "#fff";
      for (let t = 0; t < 4; t++) {
        ctx.beginPath();
        ctx.moveTo(rx * 0.55 + t * 5, ry * 0.05);
        ctx.lineTo(rx * 0.58 + t * 5, ry * 0.18);
        ctx.lineTo(rx * 0.61 + t * 5, ry * 0.05);
        ctx.fill();
      }
    }

    const legSwing = Math.sin(animT * 8) * 3;
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-rx * 0.15, ry * 0.42);
    ctx.lineTo(-rx * 0.12 + legSwing * 0.2, ry * 0.72);
    ctx.moveTo(rx * 0.05, ry * 0.45);
    ctx.lineTo(rx * 0.08 - legSwing * 0.2, ry * 0.75);
    ctx.stroke();
  }

  function dinoColors(type) {
    const c = type.color || "#4db6ac";
    return { main: c, dark: shade(c, -0.22) };
  }

  function drawWildDino(ctx, x, y, type, animT, mobLevel, opts) {
    opts = opts || {};
    const bob = Math.sin(animT * 4 + x * 0.01) * 2;
    const sc = (1 + Math.min(0.35, (mobLevel - 1) * 0.025)) * (opts.scale || 1);
    const { main, dark } = dinoColors(type);
    const rx = (type.rx || 20) * (1 + (mobLevel - 1) * 0.03);
    const ry = (type.ry || 18) * (1 + (mobLevel - 1) * 0.03);

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(sc, sc);
    drawSoftShadow(ctx, 0, 20 * sc, 22 * sc, 7);
    drawBlockyDinoBody(ctx, main, dark, rx, ry, animT, { mouthOpen: !!type.rare });

    if (type.rare) {
      ctx.font = "bold 10px 'Comic Sans MS', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffeb3b";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.strokeText("★ RARE", 0, -ry - 14);
      ctx.fillText("★ RARE", 0, -ry - 14);
    }

    ctx.font = "bold 9px 'Comic Sans MS', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.strokeText("Lv " + mobLevel, 0, -ry - 2);
    ctx.fillText("Lv " + mobLevel, 0, -ry - 2);
    ctx.restore();
  }

  function drawAlphaDino(ctx, x, y, animT, zone, mobLevel) {
    const pulse = 1 + Math.sin(animT * 3) * 0.04;
    const sc = (1.35 + Math.min(0.45, (mobLevel - 1) * 0.02)) * pulse;
    const c = zone.bossColor || "#00897b";
    const dark = shade(c, -0.25);
    const glow = 0.45 + Math.sin(animT * 4) * 0.2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    drawSoftShadow(ctx, 0, 48, 54, 14);

    const aura = ctx.createRadialGradient(0, -10, 8, 0, 0, 58);
    aura.addColorStop(0, `rgba(255,235,59,${0.4 * glow})`);
    aura.addColorStop(0.5, `rgba(255,152,0,${0.2 * glow})`);
    aura.addColorStop(1, "rgba(255,152,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    drawBlockyDinoBody(ctx, c, dark, 44, 36, animT, { mouthOpen: true });

    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(-8, -40);
    ctx.lineTo(8, -40);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 11px 'Comic Sans MS', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffeb3b";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.strokeText(`ALPHA Lv ${mobLevel}`, 0, 58);
    ctx.fillText(`ALPHA Lv ${mobLevel}`, 0, 58);
    ctx.restore();
  }

  function drawBlob(ctx, x, y, s, animT, opts) {
    opts = opts || {};
    const bounce = opts.bounce ? Math.sin(animT * 8) * 2 : 0;
    const walk = Math.sin(animT * 10) * 3;

    ctx.save();
    ctx.translate(x, y + bounce);
    if (opts.facing < 0) ctx.scale(-1, 1);

    drawSoftShadow(ctx, 0, 28, 24, 8);

    stickerStroke(ctx, (strokeOnly) => {
      ctx.beginPath();
      ctx.ellipse(0, 4, 16, 18, 0, 0, Math.PI * 2);
      if (strokeOnly) ctx.stroke();
      else {
        const g = ctx.createRadialGradient(-4, -2, 2, 0, 4, 20);
        g.addColorStop(0, shade(s.body, 0.15));
        g.addColorStop(1, s.body);
        ctx.fillStyle = g;
        ctx.fill();
      }
    });

    ctx.fillStyle = s.eye;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6 + walk * 0.1, -2, 5.5, 0, Math.PI * 2);
    ctx.arc(6 - walk * 0.1, -2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-5 + walk * 0.1, -2, 2.2, 0, Math.PI * 2);
    ctx.arc(7 - walk * 0.1, -2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (opts.panicked) {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-6, -2, 7, 0.3, Math.PI - 0.3);
      ctx.arc(6, -2, 7, 0.3, Math.PI - 0.3);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 4, 5, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }

    const legSwing = Math.sin(animT * 10) * 4;
    ctx.strokeStyle = s.dark;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(-6 + legSwing * 0.3, 26);
    ctx.moveTo(6, 16);
    ctx.lineTo(6 - legSwing * 0.3, 26);
    ctx.stroke();

    if (opts.upgrades && opts.upgrades.includes("aura")) {
      ctx.strokeStyle = `rgba(255,235,59,${0.4 + Math.sin(animT * 4) * 0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 4, 24, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawTrainer(ctx, x, y, scale, style, facing, animT, opts) {
    opts = opts || {};
    const s = STYLES[style] || STYLES.cute;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale || 1, scale || 1);

    if (opts.riding && opts.dinoType) {
      const { main, dark } = dinoColors(opts.dinoType);
      drawSoftShadow(ctx, 0, 18, 26, 9);
      drawBlockyDinoBody(ctx, main, dark, 22, 18, animT, { eyeGlow: false, plates: true });
      drawBlob(ctx, 0, -22, s, animT, { facing, bounce: true, upgrades: opts.upgrades });
    } else {
      if (!opts.hideCompanion) {
        const { main, dark } = dinoColors({ color: s.dark });
        drawBlockyDinoBody(ctx, main, dark, 10, 8, animT, { eyeGlow: false, plates: false });
        ctx.translate(18, -6);
      }
      drawBlob(ctx, 0, 0, s, animT, { facing, bounce: opts.bounce, panicked: opts.panicked, upgrades: opts.upgrades });
    }
    ctx.restore();
  }

  function drawBattleArena(ctx, w, h, zone, animT) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, zone.skyTop || "#42a5f5");
    sky.addColorStop(0.55, zone.skyBot || "#81d4fa");
    sky.addColorStop(1, zone.floor || "#7cb342");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    drawPalmTree(ctx, 24, h - 20, 0.7);
    drawPalmTree(ctx, w - 24, h - 18, 0.65);

    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(80, h - 16, 48, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(240, h - 16, 48, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPostFX(ctx, w, h, animT, focusX, focusY) {
    const warm = ctx.createLinearGradient(0, 0, w, h);
    warm.addColorStop(0, "rgba(255,255,255,0.04)");
    warm.addColorStop(1, "rgba(255,200,100,0.05)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);

    const light = ctx.createRadialGradient(focusX, focusY, 40, focusX, focusY, Math.max(w, h) * 0.55);
    light.addColorStop(0, "rgba(255,255,255,0.06)");
    light.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);
  }

  function drawZonePortal(ctx, x, y, label, animT) {
    const glow = 0.5 + Math.sin(animT * 3) * 0.2;
    stickerStroke(ctx, (strokeOnly) => {
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      if (strokeOnly) ctx.stroke();
      else {
        ctx.fillStyle = `rgba(186,104,255,${0.35 * glow})`;
        ctx.fill();
      }
    });
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🌀", x, y + 6);
    ctx.font = "bold 9px 'Comic Sans MS', system-ui, sans-serif";
    ctx.fillStyle = "#111";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeText(label, x, y + 38);
    ctx.fillText(label, x, y + 38);
  }

  window.DPSprites = {
    drawTrainer,
    drawWildDino,
    drawAlphaDino,
    drawWorldTile,
    drawZoneSky,
    drawSoftShadow,
    drawBattleArena,
    drawPostFX,
    drawZonePortal,
    drawBlob,
    drawBlockyDinoBody,
    shade,
  };
})();
