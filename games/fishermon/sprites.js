(function () {
  "use strict";

  const OUTLINE = 4;

  const STYLES = {
    cute: { body: "#c62828", dark: "#8e0000", eye: "#fff" },
    cool: { body: "#1565c0", dark: "#0d47a1", eye: "#fff" },
    wild: { body: "#00838f", dark: "#006064", eye: "#fff" },
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

  function hash01(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function noise2D(x, y) {
    return hash01(x * 17.3, y * 23.7);
  }

  function fbm(x, y, octaves) {
    octaves = octaves || 4;
    let v = 0;
    let a = 0.5;
    let f = 1;
    for (let i = 0; i < octaves; i++) {
      v += a * noise2D(x * f, y * f);
      a *= 0.5;
      f *= 2.05;
    }
    return v;
  }

  function drawMicroTexture(ctx, sx, sy, tw, th, seed, strength) {
    strength = strength == null ? 0.045 : strength;
    for (let i = 0; i < 8; i++) {
      const tx = sx + hash01(seed, i * 3) * (tw - 1);
      const ty = sy + hash01(seed + 11, i * 5) * (th - 1);
      const a = strength * (0.45 + hash01(seed + 7, i) * 0.55);
      ctx.fillStyle = hash01(seed, i) > 0.52 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.65})`;
      ctx.fillRect(tx, ty, 1 + hash01(seed, i + 20), 1);
    }
  }

  function drawSunGodRays(ctx, sunX, sunY, w, h, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 6; i++) {
      const ang = -0.55 + i * 0.17;
      const len = h * 0.92;
      const ex = sunX + Math.cos(ang) * len;
      const ey = sunY + Math.sin(ang) * len * 0.62;
      const g = ctx.createLinearGradient(sunX, sunY, ex, ey);
      g.addColorStop(0, `rgba(255,250,230,${alpha * 0.42})`);
      g.addColorStop(0.25, `rgba(255,235,180,${alpha * 0.1})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(ang - 0.05) * len, sunY + Math.sin(ang - 0.05) * len * 0.58);
      ctx.lineTo(sunX + Math.cos(ang + 0.05) * len, sunY + Math.sin(ang + 0.05) * len * 0.58);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSunDisc(ctx, x, y, r, warm) {
    warm = warm !== false;
    const corona = ctx.createRadialGradient(x, y, r * 0.15, x, y, r * 4.5);
    corona.addColorStop(0, warm ? "rgba(255,248,220,0.72)" : "rgba(210,220,230,0.45)");
    corona.addColorStop(0.22, warm ? "rgba(255,220,120,0.28)" : "rgba(176,190,197,0.16)");
    corona.addColorStop(0.55, warm ? "rgba(255,180,80,0.08)" : "rgba(144,164,174,0.06)");
    corona.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(x, y, r * 4.5, 0, Math.PI * 2);
    ctx.fill();

    const halo = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 1.35);
    halo.addColorStop(0, "rgba(255,255,255,0.95)");
    halo.addColorStop(0.6, warm ? "rgba(255,236,179,0.35)" : "rgba(207,216,220,0.25)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    const disc = ctx.createRadialGradient(x - r * 0.22, y - r * 0.22, r * 0.02, x, y, r);
    disc.addColorStop(0, "#ffffff");
    disc.addColorStop(0.35, warm ? "#fff9c4" : "#eceff1");
    disc.addColorStop(0.72, warm ? "#ffca28" : "#b0bec5");
    disc.addColorStop(1, warm ? "#ff8f00" : "#78909c");
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRealisticCloud(ctx, cx, cy, cloudW, alpha, seed) {
    const puffs = [
      { ox: 0, oy: 8, rx: cloudW * 1.05, ry: cloudW * 0.3 },
      { ox: cloudW * 0.32, oy: 0, rx: cloudW * 0.58, ry: cloudW * 0.36 },
      { ox: -cloudW * 0.28, oy: 4, rx: cloudW * 0.46, ry: cloudW * 0.28 },
      { ox: cloudW * 0.1, oy: -6, rx: cloudW * 0.42, ry: cloudW * 0.24 },
      { ox: -cloudW * 0.08, oy: -2, rx: cloudW * 0.35, ry: cloudW * 0.2 },
    ];
    ctx.save();
    puffs.forEach((p, i) => {
      const g = ctx.createRadialGradient(cx + p.ox - p.rx * 0.25, cy + p.oy - p.ry * 0.35, 2, cx + p.ox, cy + p.oy, p.rx);
      g.addColorStop(0, `rgba(255,255,255,${alpha * (0.95 - i * 0.04)})`);
      g.addColorStop(0.55, `rgba(245,248,252,${alpha * 0.82})`);
      g.addColorStop(1, `rgba(210,220,235,${alpha * 0.15})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx + p.ox, cy + p.oy, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = `rgba(120,135,155,${alpha * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy + cloudW * 0.28, cloudW * 0.98, cloudW * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    if ((seed % 5) === 0) {
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.55})`;
      ctx.beginPath();
      ctx.ellipse(cx - cloudW * 0.12, cy - 4, cloudW * 0.24, cloudW * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFilmGrain(ctx, w, h, animT) {
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    for (let i = 0; i < 220; i++) {
      const gx = hash01(i, animT * 0.65) * w;
      const gy = hash01(i + 50, animT * 0.45) * h;
      const a = 0.012 + hash01(i, animT) * 0.022;
      ctx.fillStyle = hash01(i, 2) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.85})`;
      ctx.fillRect(gx, gy, 1.2, 1.2);
    }
    ctx.restore();
  }

  function drawCaustics(ctx, sx, sy, tw, th, animT, seed, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha || 0.18;
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i++) {
      const ox = ((seed + i * 17 + animT * 22) % 1) * tw;
      const oy = ((seed + i * 31 + animT * 14) % 1) * th;
      const wobble = Math.sin(animT * 2.5 + seed + i) * 4;
      ctx.strokeStyle = `rgba(255,255,255,${0.55 - i * 0.08})`;
      ctx.lineWidth = 1 + (i % 2) * 0.4;
      ctx.beginPath();
      ctx.moveTo(sx + ox, sy + oy);
      ctx.bezierCurveTo(sx + ox + 14 + wobble, sy + oy - 10, sx + ox + 28, sy + oy + 12, sx + ox + 42, sy + oy + wobble);
      ctx.bezierCurveTo(sx + ox + 56, sy + oy - 8, sx + ox + 38, sy + oy + 18, sx + ox + 18, sy + oy + 6);
      ctx.stroke();
    }
    for (let c = 0; c < 3; c++) {
      const cx = sx + tw * (0.2 + c * 0.28) + Math.sin(animT + seed + c) * 6;
      const cy = sy + th * (0.35 + c * 0.12);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, tw * 0.18);
      cg.addColorStop(0, "rgba(255,255,255,0.35)");
      cg.addColorStop(0.5, "rgba(200,240,255,0.12)");
      cg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(cx, cy, tw * 0.16, th * 0.08, animT * 0.2 + c, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLabel(ctx, text, x, y, opts) {
    opts = opts || {};
    ctx.font = opts.font || "600 10px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = opts.stroke || 3;
    ctx.strokeStyle = opts.strokeColor || "rgba(0,0,0,0.7)";
    ctx.fillStyle = opts.fill || "#fff";
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
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
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(0.35, "rgba(0,0,0,0.22)");
    g.addColorStop(0.62, "rgba(0,0,0,0.08)");
    g.addColorStop(0.85, "rgba(0,0,0,0.02)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y + rh * 0.15, rw, rh || rw * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWaterRipple(ctx, x, y, rx, animT) {
    const pulse = 0.85 + Math.sin(animT * 3 + x * 0.02) * 0.1;
    const pulse2 = 0.92 + Math.sin(animT * 2.2 + x * 0.015 + 1.4) * 0.06;
    ctx.strokeStyle = `rgba(255,255,255,${0.22 + Math.sin(animT * 4) * 0.08})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, rx * pulse, rx * 0.28 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(180,230,255,${0.12 + Math.sin(animT * 3.5 + 0.8) * 0.05})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(x, y + 6, rx * 0.72 * pulse2, rx * 0.2 * pulse2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawZoneSky(ctx, w, h, camX, camY, zone, animT) {
    const isLava = zone.decor === "lava" || zone.decor === "volcano";
    const isDepths = zone.decor === "depths";
    const isDepthsCave = !!zone.isDepthsCave;
    const isIce = zone.decor === "ice" || zone.decor === "crystal";
    const isHurricane = zone.decor === "hurricane";
    const isHorror = zone.decor === "horror";
    const top = zone.skyTop || "#1e88e5";
    const mid = zone.skyBot || "#64b5f6";

    const g = ctx.createLinearGradient(0, 0, 0, h * 0.78);
    if (isDepthsCave) {
      g.addColorStop(0, "#050508");
      g.addColorStop(0.35, "#12151c");
      g.addColorStop(0.7, "#1c2128");
      g.addColorStop(1, "#263238");
    } else if (isDepths) {
      g.addColorStop(0, "#0a1030");
      g.addColorStop(0.45, "#1a237e");
      g.addColorStop(1, "#283593");
    } else if (isLava) {
      g.addColorStop(0, "#4a148c");
      g.addColorStop(0.25, "#bf360c");
      g.addColorStop(0.55, "#ff6f00");
      g.addColorStop(1, "rgba(255,183,77,0.35)");
    } else if (isIce) {
      g.addColorStop(0, "#01579b");
      g.addColorStop(0.5, "#4fc3f7");
      g.addColorStop(1, "#e1f5fe");
    } else if (isHurricane) {
      g.addColorStop(0, "#263238");
      g.addColorStop(0.35, "#455a64");
      g.addColorStop(0.7, "#607d8b");
      g.addColorStop(1, "rgba(144,164,174,0.4)");
    } else if (isHorror) {
      g.addColorStop(0, "#0a0015");
      g.addColorStop(0.4, "#1a0a2e");
      g.addColorStop(0.75, "#311b92");
      g.addColorStop(1, "rgba(74,20,140,0.35)");
    } else {
      g.addColorStop(0, "#0a3d62");
      g.addColorStop(0.18, shade(top, -0.18));
      g.addColorStop(0.42, top);
      g.addColorStop(0.68, mid);
      g.addColorStop(0.88, "rgba(255,250,240,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0.2)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.78);

    if (!isDepths && !isDepthsCave && !isHorror) {
      const sunX = isLava ? w * 0.62 : isHurricane ? w * 0.5 : w * 0.78;
      const sunY = h * (isLava ? 0.2 : isHurricane ? 0.16 : 0.1);
      drawSunDisc(ctx, sunX, sunY, isLava ? 32 : isHurricane ? 24 : 30, !isHurricane);
      if (!isHurricane && !isLava) drawSunGodRays(ctx, sunX, sunY, w, h, 0.55);
    }

    if (isHorror) {
      for (let s = 0; s < 24; s++) {
        const sx = (s * 113 + camX * 0.08) % w;
        const sy = (s * 67) % (h * 0.55);
        ctx.fillStyle = `rgba(186,104,255,${0.08 + (s % 4) * 0.05})`;
      ctx.beginPath();
        ctx.arc(sx, sy, 2 + (s % 3), 0, Math.PI * 2);
      ctx.fill();
      }
    }

    if (isDepthsCave) {
      for (let s = 0; s < 18; s++) {
        const sx = (s * 83 + camX * 0.06) % w;
        const len = 18 + (s % 5) * 10;
        ctx.strokeStyle = `rgba(84,110,122,${0.35 + (s % 3) * 0.12})`;
        ctx.lineWidth = 2 + (s % 2);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + Math.sin(s * 0.7) * 6, len);
        ctx.stroke();
      }
      for (let s = 0; s < 28; s++) {
        const sx = (s * 61 + camX * 0.08) % w;
        const sy = (s * 37) % (h * 0.35);
        ctx.fillStyle = `rgba(144,164,174,${0.12 + (s % 4) * 0.06})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (s % 2), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (isDepths) {
      for (let s = 0; s < 40; s++) {
        const sx = (s * 97 + camX * 0.1) % w;
        const sy = (s * 53) % (h * 0.5);
        ctx.fillStyle = `rgba(255,255,255,${0.15 + (s % 5) * 0.08})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (s % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const cloudCount = isDepths || isDepthsCave ? 2 : isHorror ? 4 : isHurricane ? 10 : 8;
    for (let c = 0; c < cloudCount; c++) {
      const drift = animT * (5 + c * 1.8) + c * 137;
      const cx = ((c * 211 + camX * 0.04 + drift) % (w + 280)) - 140;
      const cy = 16 + (c % 4) * 28 + Math.sin(animT * 0.35 + c) * (isHurricane ? 10 : 4);
      const cloudW = 52 + c * 9;
      const cloudA = isDepths ? 0.22 : isHorror ? 0.32 : isLava ? 0.5 : isHurricane ? 0.65 : 0.82;
      if (isHorror) {
        ctx.fillStyle = `rgba(74,20,140,${cloudA})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, cloudW, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (isHurricane) {
        drawRealisticCloud(ctx, cx, cy, cloudW, cloudA, c);
      } else {
        drawRealisticCloud(ctx, cx, cy, cloudW, cloudA, c);
      }
    }

    if (!isDepths && !isDepthsCave && !isHorror) {
      for (let c = 0; c < 5; c++) {
        const drift = animT * (2.2 + c * 0.9) + c * 311;
        const cx = ((c * 397 + camX * 0.018 + drift) % (w + 420)) - 210;
        const cy = 42 + (c % 3) * 36 + Math.sin(animT * 0.22 + c * 1.7) * 6;
        const cloudW = 88 + c * 14;
        const cloudA = isLava ? 0.22 : isHurricane ? 0.28 : 0.38;
        drawRealisticCloud(ctx, cx, cy, cloudW, cloudA, c + 20);
      }
    }

    const haze = ctx.createLinearGradient(0, h * 0.28, 0, h * 0.82);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(0.45, isLava ? "rgba(255,200,120,0.12)" : isHorror ? "rgba(120,80,180,0.08)" : "rgba(200,225,245,0.16)");
    haze.addColorStop(0.72, isLava ? "rgba(255,140,60,0.16)" : "rgba(135,175,210,0.22)");
    haze.addColorStop(1, isLava ? "rgba(80,40,20,0.14)" : "rgba(100,140,180,0.26)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.28, w, h * 0.54);

    const horizonGlow = ctx.createLinearGradient(0, h * 0.48, 0, h * 0.62);
    horizonGlow.addColorStop(0, "rgba(255,255,255,0)");
    horizonGlow.addColorStop(0.5, isLava ? "rgba(255,180,80,0.15)" : isHorror ? "rgba(100,60,160,0.1)" : "rgba(255,240,200,0.18)");
    horizonGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, h * 0.48, w, h * 0.14);

    const horizon = h * 0.5;
    const mountG = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 50);
    mountG.addColorStop(0, isLava ? "rgba(62,39,35,0.65)" : isHorror ? "rgba(26,10,46,0.7)" : isHurricane ? "rgba(38,50,56,0.62)" : "rgba(46,125,50,0.58)");
    mountG.addColorStop(0.45, isLava ? "rgba(121,85,72,0.38)" : isHorror ? "rgba(74,20,140,0.32)" : isHurricane ? "rgba(69,90,100,0.35)" : "rgba(76,175,80,0.28)");
    mountG.addColorStop(0.78, isLava ? "rgba(80,50,40,0.12)" : "rgba(60,90,70,0.1)");
    mountG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mountG;
    ctx.beginPath();
    ctx.moveTo(0, horizon + 28);
    ctx.lineTo(w * 0.08, horizon - 38);
    ctx.lineTo(w * 0.22, horizon - 14);
    ctx.lineTo(w * 0.36, horizon - 48);
    ctx.lineTo(w * 0.5, horizon - 18);
    ctx.lineTo(w * 0.64, horizon - 42);
    ctx.lineTo(w * 0.78, horizon - 12);
    ctx.lineTo(w * 0.9, horizon - 32);
    ctx.lineTo(w, horizon + 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isLava ? "rgba(255,120,40,0.06)" : "rgba(180,210,230,0.08)";
    ctx.fillRect(0, horizon + 8, w, 28);
  }

  function drawPalmTree(ctx, x, y, scale, animT) {
    scale = scale || 1;
    animT = animT || 0;
    const sway = Math.sin(animT * 1.4 + x * 0.008) * 5 * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    drawSoftShadow(ctx, 0, 8, 18, 6);

    const trunkG = ctx.createLinearGradient(-5, 0, 5, -34);
    trunkG.addColorStop(0, "#5d4037");
    trunkG.addColorStop(0.5, "#6d4c41");
    trunkG.addColorStop(1, "#4e342e");
    ctx.strokeStyle = trunkG;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(4 + sway * 0.1, -20, sway * 0.14, -36);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.quadraticCurveTo(2, -18, sway * 0.1, -32);
    ctx.stroke();

    ctx.translate(sway * 0.18, -36);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + Math.sin(animT * 2 + i) * 0.1;
      const len = 28 + (i % 2) * 5;
      const leafG = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len * 0.5);
      leafG.addColorStop(0, "#1b5e20");
      leafG.addColorStop(0.5, i % 2 ? "#388e3c" : "#2e7d32");
      leafG.addColorStop(1, "#81c784");
      ctx.strokeStyle = leafG;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(ang) * len * 0.4, Math.sin(ang) * len * 0.32 - 5, Math.cos(ang) * len, Math.sin(ang) * len * 0.48);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWorldTile(ctx, sx, sy, tw, th, zone, seed) {
    const base = zone.floor;
    const alt = zone.floorAlt || shade(base, -0.08);
    const patch = ((seed * 17) % 100) / 100;
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, shade(base, 0.08 + patch * 0.06));
    g.addColorStop(0.45, base);
    g.addColorStop(1, shade(alt, -0.04));
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);

    if (zone.decor === "grass" || zone.decor === "forest" || zone.decor === "park" || zone.decor === "coral") {
      for (let i = 0; i < 5; i++) {
        const gx = sx + ((seed + i * 47) % (tw - 10)) + 5;
        const gy = sy + th - 8 - ((seed + i * 19) % 12);
        const len = 10 + (seed + i) % 8;
        ctx.strokeStyle = shade(base, i % 2 ? 0.12 : -0.1);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx + 2, gy - len * 0.6, gx + (i % 2 ? 2 : -1), gy - len);
        ctx.stroke();
      }
    }

    if (zone.decor === "park" || zone.decor === "pier") {
      const pathW = Math.max(12, tw * 0.34);
      const pathG = ctx.createLinearGradient(sx, sy, sx, sy + th);
      pathG.addColorStop(0, shade(base, zone.decor === "pier" ? 0.18 : 0.22));
      pathG.addColorStop(1, shade(base, 0.08));
      ctx.fillStyle = pathG;
      if ((seed % 3) === 0) ctx.fillRect(sx + (tw - pathW) / 2, sy, pathW, th);
      else if ((seed % 3) === 1) ctx.fillRect(sx, sy + (th - pathW) / 2, tw, pathW);
    }

    if (zone.decor === "ocean" || zone.decor === "depths" || zone.decor === "hurricane") {
      const wave = Math.sin(seed * 0.04) * 2;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + th * 0.55 + wave);
      ctx.quadraticCurveTo(sx + tw * 0.5, sy + th * 0.48 + wave, sx + tw - 4, sy + th * 0.58 + wave);
      ctx.stroke();
      if ((seed % 5) === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.ellipse(sx + tw * 0.5, sy + th * 0.62, tw * 0.22, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (zone.decor === "depths" && (seed % 9) === 0) {
      ctx.fillStyle = "rgba(103,58,183,0.3)";
      ctx.beginPath();
      ctx.arc(sx + tw * 0.5, sy + th * 0.5, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (zone.decor === "lava" && (seed % 7) === 0) {
      const lavaG = ctx.createLinearGradient(sx, sy + 8, sx, sy + 14);
      lavaG.addColorStop(0, "rgba(255,171,64,0.7)");
      lavaG.addColorStop(1, "rgba(255,87,34,0.35)");
      ctx.fillStyle = lavaG;
      ctx.fillRect(sx + 8, sy + 8, tw - 16, 6);
    }

    if (zone.decor === "ice" || zone.decor === "crystal") {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(sx + 4, sy + 4, tw - 8, 4);
      ctx.fillStyle = "rgba(200,230,255,0.12)";
      ctx.fillRect(sx + 10, sy + 14, tw - 20, 2);
    }

    if (zone.decor === "hurricane") {
      const gust = Math.sin(seed * 0.05) * 3;
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.moveTo(sx + 6 + r * 8, sy + th * 0.4 + gust);
        ctx.lineTo(sx + tw - 6, sy + th * 0.35 + gust + r * 4);
        ctx.stroke();
      }
      if ((seed % 6) === 0) {
        ctx.fillStyle = "rgba(176,190,197,0.18)";
        ctx.fillRect(sx + 8, sy + 10, tw - 16, 3);
      }
    }

    if (zone.decor === "horror") {
      if ((seed % 8) === 0) {
        const fog = ctx.createRadialGradient(sx + tw * 0.5, sy + th * 0.5, 0, sx + tw * 0.5, sy + th * 0.5, tw * 0.45);
        fog.addColorStop(0, "rgba(74,20,140,0.22)");
        fog.addColorStop(1, "rgba(74,20,140,0)");
        ctx.fillStyle = fog;
        ctx.fillRect(sx, sy, tw, th);
      }
      if ((seed % 11) === 0) {
        ctx.fillStyle = "rgba(186,104,255,0.2)";
        ctx.beginPath();
        ctx.arc(sx + tw * 0.35, sy + th * 0.45, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if ((seed % 17) === 0 && (zone.decor === "grass" || zone.decor === "forest" || zone.decor === "park" || zone.decor === "coral" || zone.decor === "pier")) {
      drawPalmTree(ctx, sx + tw * 0.5, sy + th - 4, 0.55, seed * 0.01);
    }
  }

  function drawFishBody(ctx, c, dark, rx, ry, animT, opts) {
    opts = opts || {};
    const tailSwing = Math.sin(animT * 5.5) * 0.12;
    const breathe = 1 + Math.sin(animT * 2) * 0.018;

    ctx.save();
    ctx.scale(breathe, 1);

    const bodyG = ctx.createLinearGradient(-rx * 0.6, -ry * 1.1, rx * 0.9, ry * 0.9);
    bodyG.addColorStop(0, shade(c, 0.35));
    bodyG.addColorStop(0.22, shade(c, 0.18));
    bodyG.addColorStop(0.48, c);
    bodyG.addColorStop(0.72, shade(c, -0.06));
    bodyG.addColorStop(1, dark);

      ctx.beginPath();
    ctx.moveTo(-rx * 0.82, ry * 0.05);
    ctx.bezierCurveTo(-rx * 0.65, -ry * 0.55, -rx * 0.05, -ry * 0.58, rx * 0.42, -ry * 0.38);
    ctx.bezierCurveTo(rx * 0.82, -ry * 0.18, rx * 0.88, ry * 0.28, rx * 0.52, ry * 0.48);
    ctx.bezierCurveTo(rx * 0.08, ry * 0.58, -rx * 0.48, ry * 0.52, -rx * 0.82, ry * 0.05);
      ctx.closePath();
    ctx.fillStyle = bodyG;
        ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    if (opts.plates !== false) {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 6; col++) {
          const sx = -rx * 0.38 + col * rx * 0.14;
          const sy = -ry * 0.3 + row * ry * 0.12;
          const sg = ctx.createRadialGradient(sx - 1, sy - 1, 0, sx, sy, rx * 0.06);
          sg.addColorStop(0, "rgba(255,255,255,0.22)");
          sg.addColorStop(0.5, "rgba(255,255,255,0.06)");
          sg.addColorStop(1, "rgba(0,0,0,0.12)");
          ctx.fillStyle = sg;
        ctx.beginPath();
          ctx.ellipse(sx, sy, rx * 0.052, ry * 0.042, 0.08, 0, Math.PI * 2);
        ctx.fill();
        }
      }
    }

    const sheen = ctx.createLinearGradient(-rx * 0.2, -ry * 0.5, rx * 0.6, ry * 0.3);
    sheen.addColorStop(0, "rgba(255,255,255,0.38)");
    sheen.addColorStop(0.45, "rgba(255,255,255,0.12)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
      ctx.beginPath();
    ctx.ellipse(rx * 0.05, -ry * 0.1, rx * 0.48, ry * 0.2, -0.18, 0, Math.PI * 2);
      ctx.fill();

    const irid = ctx.createLinearGradient(-rx * 0.3, 0, rx * 0.5, ry * 0.4);
    irid.addColorStop(0, "rgba(180,255,255,0)");
    irid.addColorStop(0.4, "rgba(200,240,255,0.08)");
    irid.addColorStop(0.7, "rgba(255,200,255,0.06)");
    irid.addColorStop(1, "rgba(255,255,200,0)");
    ctx.fillStyle = irid;
      ctx.beginPath();
    ctx.ellipse(0, ry * 0.05, rx * 0.55, ry * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

    ctx.fillStyle = shade(c, -0.05);
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.08, -ry * 0.42);
    ctx.lineTo(rx * 0.06, -ry * 0.72);
    ctx.lineTo(rx * 0.18, -ry * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    if (opts.eyeGlow !== false) {
      ctx.fillStyle = "#0d0d0d";
      ctx.beginPath();
      ctx.ellipse(rx * 0.48, -ry * 0.1, rx * 0.105, ry * 0.088, 0.15, 0, Math.PI * 2);
      ctx.fill();
      const iris = ctx.createRadialGradient(rx * 0.5, -ry * 0.11, 0.5, rx * 0.48, -ry * 0.1, rx * 0.075);
      iris.addColorStop(0, "#78909c");
      iris.addColorStop(0.45, "#455a64");
      iris.addColorStop(1, "#1a1a1a");
      ctx.fillStyle = iris;
      ctx.beginPath();
      ctx.ellipse(rx * 0.48, -ry * 0.1, rx * 0.068, ry * 0.058, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
        ctx.beginPath();
      ctx.arc(rx * 0.515, -ry * 0.135, rx * 0.024, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(rx * 0.455, -ry * 0.085, rx * 0.01, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(-rx * 0.05, ry * 0.1);
    ctx.quadraticCurveTo(-rx * 0.2, ry * 0.35, -rx * 0.08, ry * 0.48);
    ctx.quadraticCurveTo(-rx * 0.02, ry * 0.32, -rx * 0.05, ry * 0.1);
    ctx.fill();

    const tailG = ctx.createLinearGradient(-rx * 1.05, 0, -rx * 0.5, 0);
    tailG.addColorStop(0, dark);
    tailG.addColorStop(0.55, c);
    tailG.addColorStop(1, shade(c, 0.12));
    ctx.fillStyle = tailG;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.78, ry * 0.04);
    ctx.quadraticCurveTo(-rx * 1.08, ry * (0.38 + tailSwing), -rx * 1.02, ry * (0.1 + tailSwing * 0.5));
    ctx.quadraticCurveTo(-rx * 1.06, -ry * (0.08 + tailSwing * 0.3), -rx * 0.78, -ry * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function fishColors(type) {
    const c = type.color || "#4db6ac";
    return { main: c, dark: shade(c, -0.22) };
  }

  function drawWildFish(ctx, x, y, type, animT, mobLevel, opts) {
    opts = opts || {};
    const bob = Math.sin(animT * 4 + x * 0.01) * 2.5;
    const sc = (1 + Math.min(0.35, (mobLevel - 1) * 0.025)) * (opts.scale || 1);
    const { main, dark } = fishColors(type);
    const rx = (type.rx || 20) * (1 + (mobLevel - 1) * 0.03);
    const ry = (type.ry || 18) * (1 + (mobLevel - 1) * 0.03);

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(sc, sc);
    drawWaterRipple(ctx, 0, 20 * sc, 22 + rx * 0.35, animT);
    drawSoftShadow(ctx, 0, 22 * sc, 26 * sc, 9);
    drawFishBody(ctx, main, dark, rx, ry, animT, { mouthOpen: !!type.rare });
    const under = ctx.createLinearGradient(0, ry * 0.15, 0, ry * 0.55);
    under.addColorStop(0, "rgba(0,40,80,0)");
    under.addColorStop(0.55, "rgba(0,60,100,0.14)");
    under.addColorStop(1, "rgba(0,80,120,0.22)");
    ctx.fillStyle = under;
    ctx.fillRect(-rx * 1.1, ry * 0.05, rx * 2.2, ry * 0.5);

    if (type.rare) {
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, rx + 18);
      glow.addColorStop(0, "rgba(255,235,59,0.45)");
      glow.addColorStop(0.55, "rgba(255,193,7,0.18)");
      glow.addColorStop(1, "rgba(255,235,59,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, rx + 14, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, "★ RARE", 0, -ry - 14, { fill: "#ffeb3b" });
    }

    drawLabel(ctx, "Lv " + mobLevel, 0, -ry - 2);
    ctx.restore();
  }

  function drawMythicFish(ctx, x, y, animT, zone, mobLevel) {
    const pulse = 1 + Math.sin(animT * 3) * 0.04;
    const sc = (1.35 + Math.min(0.45, (mobLevel - 1) * 0.02)) * pulse;
    const c = zone.bossColor || "#00897b";
    const dark = shade(c, -0.25);
    const glow = 0.45 + Math.sin(animT * 4) * 0.2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    drawSoftShadow(ctx, 0, 48, 54, 14);

    const aura = ctx.createRadialGradient(0, -10, 8, 0, 0, 64);
    aura.addColorStop(0, `rgba(255,235,59,${0.52 * glow})`);
    aura.addColorStop(0.45, `rgba(255,152,0,${0.28 * glow})`);
    aura.addColorStop(0.75, `rgba(255,87,34,${0.12 * glow})`);
    aura.addColorStop(1, "rgba(255,152,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    drawFishBody(ctx, c, dark, 44, 36, animT, { mouthOpen: true });

    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(-8, -40);
    ctx.lineTo(8, -40);
    ctx.closePath();
    ctx.fill();

    drawLabel(ctx, `👑 MYTHIC Lv ${mobLevel}`, 0, -62, { fill: "#ffeb3b", font: "700 11px system-ui,sans-serif" });
    ctx.restore();
  }

  function drawBlob(ctx, x, y, s, animT, opts) {
    opts = opts || {};
    const bounce = opts.bounce ? Math.sin(animT * 8) * 1.5 : 0;
    const legSwing = Math.sin(animT * 10) * 5;
    const skin = "#c68642";
    const skinLight = "#e0ac69";
    const skinDark = "#8d5524";
    const skinShadow = "#6d4c41";

    ctx.save();
    ctx.translate(x, y + bounce);
    if (opts.facing < 0) ctx.scale(-1, 1);

    drawSoftShadow(ctx, 0, 32, 28, 10);

    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
      ctx.beginPath();
    ctx.moveTo(-7 + legSwing * 0.25, 18);
    ctx.lineTo(-9 + legSwing * 0.35, 30);
    ctx.moveTo(7 - legSwing * 0.25, 18);
    ctx.lineTo(9 - legSwing * 0.35, 30);
    ctx.stroke();

    const jeanG = ctx.createLinearGradient(-10, 14, 10, 30);
    jeanG.addColorStop(0, "#7986cb");
    jeanG.addColorStop(0.35, "#5c6bc0");
    jeanG.addColorStop(0.7, "#3949ab");
    jeanG.addColorStop(1, "#283593");
    ctx.fillStyle = jeanG;
    ctx.fillRect(-10, 14, 9, 16);
    ctx.fillRect(1, 14, 9, 16);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-8, 20);
    ctx.lineTo(-8, 28);
    ctx.moveTo(3, 20);
    ctx.lineTo(3, 28);
    ctx.stroke();

    const shirtG = ctx.createLinearGradient(-16, -4, 16, 18);
    shirtG.addColorStop(0, shade(s.body, 0.22));
    shirtG.addColorStop(0.4, s.body);
    shirtG.addColorStop(0.85, s.dark);
    shirtG.addColorStop(1, shade(s.dark, -0.08));
    ctx.fillStyle = shirtG;
    ctx.beginPath();
    ctx.roundRect(-14, -2, 28, 20, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(-12, 0, 10, 14);

    const headG = ctx.createRadialGradient(-3, -18, 2, 0, -14, 11);
    headG.addColorStop(0, skinLight);
    headG.addColorStop(0.55, skin);
    headG.addColorStop(1, skinDark);
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.arc(0, -14, 9.5, 0, Math.PI * 2);
    ctx.fill();

    const capG = ctx.createLinearGradient(-14, -26, 14, -16);
    capG.addColorStop(0, "#1976d2");
    capG.addColorStop(0.5, "#1565c0");
    capG.addColorStop(1, "#0d47a1");
    ctx.fillStyle = capG;
      ctx.beginPath();
    ctx.ellipse(0, -20, 14, 6.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-14, -23, 28, 5);
    ctx.fillStyle = "#0d47a1";
      ctx.beginPath();
    ctx.ellipse(9, -18, 9, 3.5, 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3.5, -15, 2.4, 0, Math.PI * 2);
    ctx.arc(4, -15, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a237e";
    ctx.beginPath();
    ctx.arc(-2.8, -14.5, 1.2, 0, Math.PI * 2);
    ctx.arc(4.6, -14.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(-2.2, -15.2, 0.45, 0, Math.PI * 2);
    ctx.arc(5.1, -15.2, 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = skinShadow;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -10.5, 3.2, 0.15, Math.PI - 0.15);
      ctx.stroke();

    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(13, 2);
    ctx.lineTo(32, -14);
    ctx.stroke();
    ctx.strokeStyle = "#8d6e63";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(13, 2);
    ctx.lineTo(28, -10);
    ctx.stroke();
    ctx.strokeStyle = "#bdbdbd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, -10);
    ctx.lineTo(38, -26);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(14, 1);
    ctx.lineTo(26, -8);
    ctx.stroke();

    const handG = ctx.createRadialGradient(14, 0, 1, 14, 0, 5);
    handG.addColorStop(0, skinLight);
    handG.addColorStop(1, skin);
    ctx.fillStyle = handG;
    ctx.beginPath();
    ctx.ellipse(14, 0, 4.5, 3.5, 0.35, 0, Math.PI * 2);
    ctx.fill();

    if (opts.upgrades && opts.upgrades.includes("aura")) {
      ctx.strokeStyle = `rgba(255,235,59,${0.35 + Math.sin(animT * 4) * 0.12})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 6, 26, 30, 0, 0, Math.PI * 2);
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
      const { main, dark } = fishColors(opts.dinoType);
      drawSoftShadow(ctx, 0, 18, 26, 9);
      drawFishBody(ctx, main, dark, 22, 18, animT, { eyeGlow: false, plates: true });
      drawBlob(ctx, 0, -22, s, animT, { facing, bounce: true, upgrades: opts.upgrades });
    } else {
      if (!opts.hideCompanion) {
        const { main, dark } = fishColors({ color: s.dark });
        drawFishBody(ctx, main, dark, 10, 8, animT, { eyeGlow: false, plates: false });
        ctx.translate(18, -6);
      }
      drawBlob(ctx, 0, 0, s, animT, { facing, bounce: opts.bounce, panicked: opts.panicked, upgrades: opts.upgrades });
    }
    ctx.restore();
  }

  function drawBattleArena(ctx, w, h, zone, animT) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, shade(zone.skyTop || "#0d47a1", -0.15));
    sky.addColorStop(0.35, zone.skyTop || "#1565c0");
    sky.addColorStop(0.7, zone.skyBot || "#4fc3f7");
    sky.addColorStop(1, "rgba(255,255,255,0.15)");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    drawSunDisc(ctx, w * 0.82, h * 0.12, 22, true);
    drawSunGodRays(ctx, w * 0.82, h * 0.12, w, h, 0.35);

    const waterG = ctx.createLinearGradient(0, h * 0.45, 0, h);
    waterG.addColorStop(0, "#4dd0e1");
    waterG.addColorStop(0.4, "#0288d1");
    waterG.addColorStop(1, "#01579b");
    ctx.fillStyle = waterG;
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    for (let i = 0; i < 6; i++) {
      const wy = h * 0.52 + i * 12 + Math.sin(animT * 2 + i) * 3;
      ctx.strokeStyle = `rgba(255,255,255,${0.12 - i * 0.012})`;
      ctx.lineWidth = 1.5;
    ctx.beginPath();
      ctx.moveTo(0, wy);
      ctx.bezierCurveTo(w * 0.3, wy - 4, w * 0.7, wy + 4, w, wy);
      ctx.stroke();
    }

    drawPalmTree(ctx, 28, h - 18, 0.8, animT);
    drawPalmTree(ctx, w - 28, h - 16, 0.75, animT + 1);

    drawSoftShadow(ctx, 80, h - 12, 56, 14);
    drawSoftShadow(ctx, w - 80, h - 12, 56, 14);
  }

  function drawPostFX(ctx, w, h, animT, focusX, focusY, zone) {
    zone = zone || {};

    const grade = ctx.createLinearGradient(0, 0, w, h);
    if (zone.decor === "lava" || zone.decor === "volcano") {
      grade.addColorStop(0, "rgba(255,140,60,0.1)");
      grade.addColorStop(0.5, "rgba(255,80,20,0.04)");
      grade.addColorStop(1, "rgba(40,10,0,0.12)");
    } else if (zone.decor === "depths" || zone.decor === "horror") {
      grade.addColorStop(0, "rgba(30,15,80,0.1)");
      grade.addColorStop(0.5, "rgba(10,5,30,0.06)");
      grade.addColorStop(1, "rgba(0,0,0,0.16)");
    } else if (zone.decor === "ice") {
      grade.addColorStop(0, "rgba(220,240,255,0.12)");
      grade.addColorStop(1, "rgba(100,160,220,0.08)");
    } else {
      grade.addColorStop(0, "rgba(255,245,220,0.09)");
      grade.addColorStop(0.35, "rgba(255,255,255,0.04)");
      grade.addColorStop(0.65, "rgba(180,220,255,0.05)");
      grade.addColorStop(1, "rgba(60,120,180,0.1)");
    }
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, w, h);

    const light = ctx.createRadialGradient(focusX, focusY, 8, focusX, focusY, Math.max(w, h) * 0.72);
    light.addColorStop(0, "rgba(255,255,255,0.2)");
    light.addColorStop(0.22, "rgba(255,255,255,0.08)");
    light.addColorStop(0.52, "rgba(0,0,0,0.01)");
    light.addColorStop(0.8, "rgba(0,0,0,0.07)");
    light.addColorStop(1, "rgba(0,0,0,0.16)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);

    const bloom = ctx.createRadialGradient(focusX, focusY - 24, 0, focusX, focusY, 180);
    bloom.addColorStop(0, "rgba(255,255,255,0.12)");
    bloom.addColorStop(0.35, "rgba(255,250,230,0.05)");
    bloom.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, h * 0.08, w * 0.5, h * 0.52, h * 0.98);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.55, "rgba(0,0,0,0.04)");
    vignette.addColorStop(0.82, "rgba(0,0,0,0.14)");
    vignette.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "rgba(255,80,80,0.5)";
    ctx.fillRect(0, 0, w * 0.04, h);
    ctx.fillStyle = "rgba(80,180,255,0.5)";
    ctx.fillRect(w * 0.96, 0, w * 0.04, h);
    ctx.restore();

    if (zone.decor === "lava" || zone.decor === "volcano") {
      const heat = ctx.createLinearGradient(0, h * 0.6, 0, h);
      heat.addColorStop(0, "rgba(255,100,0,0)");
      heat.addColorStop(1, "rgba(255,60,0,0.06)");
      ctx.fillStyle = heat;
    ctx.fillRect(0, 0, w, h);
  }

    drawFilmGrain(ctx, w, h, animT);
  }

  function drawPortalRow(ctx, sx, sy, pw, ph, animT, active, label) {
    const glow = active ? 0.75 + Math.sin(animT * 4) * 0.2 : 0.22;
    const g = ctx.createLinearGradient(sx, sy, sx + pw, sy + ph);
    g.addColorStop(0, `rgba(69,39,160,${0.35 * glow})`);
    g.addColorStop(0.45, `rgba(186,104,255,${0.75 * glow})`);
    g.addColorStop(1, `rgba(69,39,160,${0.35 * glow})`);
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, pw, Math.max(ph, 1));

    if (active) {
      ctx.strokeStyle = `rgba(255,255,255,${0.45 * glow})`;
      ctx.lineWidth = 1.5;
      for (let x = sx + 6; x < sx + pw - 4; x += 14) {
        const r = 3 + Math.sin(animT * 3 + x * 0.08) * 1.5;
      ctx.beginPath();
        ctx.arc(x, sy + ph * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const msg = active ? `→ ${label}` : "🔒 Beat south dock boss";
    drawLabel(ctx, msg, sx + pw * 0.5, sy - 3, { font: "600 8px system-ui,sans-serif" });
  }

  function drawZonePortal(ctx, x, y, label, animT, active) {
    active = active !== false;
    const glow = active ? 0.55 + Math.sin(animT * 3) * 0.2 : 0.28 + Math.sin(animT * 2) * 0.08;
    const spin = animT * (active ? 2.2 : 1.2);

    const outer = ctx.createRadialGradient(x, y, 8, x, y, 34);
    if (active) {
      outer.addColorStop(0, `rgba(186,104,255,${0.55 * glow})`);
      outer.addColorStop(0.6, `rgba(103,58,183,${0.25 * glow})`);
      outer.addColorStop(1, "rgba(103,58,183,0)");
    } else {
      outer.addColorStop(0, `rgba(120,120,140,${0.35 * glow})`);
      outer.addColorStop(0.6, `rgba(60,60,80,${0.2 * glow})`);
      outer.addColorStop(1, "rgba(60,60,80,0)");
    }
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = active ? `rgba(255,255,255,${0.5 * glow})` : `rgba(180,180,200,${0.35 * glow})`;
    ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.ellipse(x, y, 18 + r * 4, 10 + r * 3, spin + r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = active ? "#fff" : "#cfd8dc";
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = active ? "#7e57c2" : "#78909c";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(active ? "🌀" : "🔒", x, y + 5);

    drawLabel(ctx, label, x, y + 38, { font: "600 9px system-ui,sans-serif" });
  }

  function drawOakTree(ctx, x, y, scale, animT) {
    scale = scale || 1;
    const sway = Math.sin(animT * 1.6 + x * 0.008) * 2.8 * scale;
    ctx.save();
    ctx.translate(x, y);

    drawSoftShadow(ctx, 0, 6, 24 * scale, 9 * scale);

    const trunkW = 12 * scale;
    const trunkH = 38 * scale;
    const trunkG = ctx.createLinearGradient(-trunkW * 0.5, -trunkH, trunkW * 0.5, 0);
    trunkG.addColorStop(0, "#5d4037");
    trunkG.addColorStop(0.35, "#6d4c41");
    trunkG.addColorStop(0.7, "#4e342e");
    trunkG.addColorStop(1, "#3e2723");
    ctx.fillStyle = trunkG;
    ctx.fillRect(-trunkW * 0.5, -trunkH, trunkW, trunkH);
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 0.8;
    for (let b = 0; b < 5; b++) {
      ctx.beginPath();
      ctx.moveTo(-trunkW * 0.38 + b * 2.2, -trunkH + 5);
      ctx.quadraticCurveTo(-trunkW * 0.15 + b * 0.5, -trunkH * 0.5, -trunkW * 0.25 + b, -6);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(-trunkW * 0.35, -trunkH + 4, trunkW * 0.2, trunkH - 8);

    const canopy = [
      { ox: sway, oy: -44 * scale, r: 22 * scale, c: "#2e7d32" },
      { ox: -18 * scale + sway * 0.65, oy: -32 * scale, r: 18 * scale, c: "#388e3c" },
      { ox: 18 * scale + sway * 0.65, oy: -32 * scale, r: 18 * scale, c: "#43a047" },
      { ox: sway * 0.45, oy: -50 * scale, r: 16 * scale, c: "#1b5e20" },
      { ox: -10 * scale + sway * 0.35, oy: -40 * scale, r: 14 * scale, c: "#33691e" },
      { ox: 12 * scale + sway * 0.3, oy: -38 * scale, r: 13 * scale, c: "#2e7d32" },
    ];
    canopy.forEach((cl, i) => {
      const g = ctx.createRadialGradient(cl.ox - 6 * scale, cl.oy - 8 * scale, 2, cl.ox, cl.oy, cl.r);
      g.addColorStop(0, shade(cl.c, 0.28));
      g.addColorStop(0.45, cl.c);
      g.addColorStop(0.82, shade(cl.c, -0.12));
      g.addColorStop(1, shade(cl.c, -0.22));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cl.ox, cl.oy, cl.r, 0, Math.PI * 2);
      ctx.fill();
      if (i < 2) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath();
        ctx.arc(cl.ox - 6 * scale, cl.oy - 8 * scale, cl.r * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function drawOceanTile(ctx, sx, sy, tw, th, animT, seed, shoreDist, waterStyle) {
    shoreDist = shoreDist == null ? 999 : shoreDist;
    const depthMix = Math.max(0, Math.min(1, shoreDist / 440));
    let shallow = "#26c6da";
    let mid = "#0288d1";
    let deep = "#01579b";
    let abyss = "#001a4d";
    if (waterStyle === "green") {
      shallow = "#9ccc65";
      mid = "#66bb6a";
      deep = "#388e3c";
      abyss = "#1b5e20";
    } else if (waterStyle === "horror") {
      shallow = "#5c4a78";
      mid = "#2d1b4e";
      deep = "#140820";
      abyss = "#050008";
    } else if (waterStyle === "ice") {
      shallow = "#b3e5fc";
      mid = "#81d4fa";
      deep = "#4fc3f7";
      abyss = "#0288d1";
    }
    const topC =
      waterStyle === "horror"
        ? shoreDist < 55
          ? "#8b7aa8"
          : depthMix < 0.28
            ? shallow
            : depthMix < 0.58
              ? mid
              : depthMix < 0.82
                ? deep
                : abyss
        : waterStyle === "ice"
          ? shoreDist < 55
            ? "#e1f5fe"
            : depthMix < 0.28
              ? shallow
              : depthMix < 0.58
                ? mid
                : depthMix < 0.82
                  ? deep
                  : abyss
          : shoreDist < 55
            ? "#80deea"
            : depthMix < 0.28
              ? shallow
              : depthMix < 0.58
                ? mid
                : depthMix < 0.82
                  ? deep
                  : abyss;
    const botC = depthMix < 0.32 ? mid : depthMix < 0.68 ? deep : abyss;

    if (shoreDist > 92) {
      const g = ctx.createLinearGradient(sx, sy, sx + tw * 0.1, sy + th);
      g.addColorStop(0, topC);
      g.addColorStop(0.45, shade(botC, 0.02));
      g.addColorStop(1, botC);
      ctx.fillStyle = g;
      ctx.fillRect(sx, sy, tw, th);
      return;
    }

    const n = fbm(seed * 0.008, sx * 0.008 + animT * 0.018, 4);
    const n2 = fbm(seed * 0.011 + 50, sy * 0.009 - animT * 0.012, 3);
    const g = ctx.createLinearGradient(sx, sy, sx + tw * 0.15, sy + th);
    g.addColorStop(0, shade(topC, 0.1 + n * 0.08));
    g.addColorStop(0.32, topC);
    g.addColorStop(0.68, shade(botC, n2 * 0.04 - 0.02));
    g.addColorStop(1, shade(botC, -0.14));
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);

    const patch = ctx.createRadialGradient(sx + tw * 0.35, sy + th * 0.4, 0, sx + tw * 0.5, sy + th * 0.5, tw * 0.7);
    patch.addColorStop(0, `rgba(255,255,255,${0.04 + (1 - depthMix) * 0.05})`);
    patch.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = patch;
    ctx.fillRect(sx, sy, tw, th);

    if (depthMix > 0.4 && waterStyle !== "green" && waterStyle !== "horror") {
      ctx.fillStyle = `rgba(0,20,60,${0.04 + depthMix * 0.08})`;
      ctx.fillRect(sx, sy, tw, th);
    }

    if (waterStyle === "horror" && depthMix > 0.2) {
      ctx.fillStyle = `rgba(20,0,40,${0.06 + depthMix * 0.12})`;
      ctx.fillRect(sx, sy, tw, th);
    }

    if (waterStyle === "green" && depthMix > 0.25) {
      ctx.fillStyle = `rgba(10,40,10,${0.04 + depthMix * 0.06})`;
      ctx.fillRect(sx, sy, tw, th);
    }

    if (shoreDist < 95) {
      const sand = ctx.createLinearGradient(sx, sy + th - 22, sx, sy + th);
      if (waterStyle === "horror") {
        sand.addColorStop(0, "rgba(0,0,0,0)");
        sand.addColorStop(0.35, "rgba(210,205,220,0.16)");
        sand.addColorStop(0.72, "rgba(180,170,195,0.24)");
        sand.addColorStop(1, "rgba(120,100,140,0.32)");
      } else {
        sand.addColorStop(0, "rgba(0,0,0,0)");
        sand.addColorStop(0.35, "rgba(210,190,140,0.18)");
        sand.addColorStop(0.72, "rgba(194,178,128,0.28)");
        sand.addColorStop(1, "rgba(161,136,86,0.38)");
      }
      ctx.fillStyle = sand;
      ctx.fillRect(sx, sy + th - 22, tw, 22);
      drawMicroTexture(ctx, sx, sy + th - 18, tw, 16, seed + 99, waterStyle === "horror" ? 0.04 : 0.048);
    }

    const wave1 = Math.sin(animT * 2 + seed * 0.025 + sx * 0.014) * 3.2;
    const wave2 = Math.sin(animT * 2.8 + seed * 0.02 + sx * 0.02 + 1.2) * 2.4;
    const wave3 = Math.sin(animT * 1.6 + seed * 0.018 + sy * 0.008) * 1.5;
    ctx.strokeStyle = waterStyle === "horror" ? "rgba(186,104,255,0.22)" : "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + th * 0.36 + wave1);
    ctx.bezierCurveTo(sx + tw * 0.3, sy + th * 0.28 + wave1, sx + tw * 0.7, sy + th * 0.44 + wave1, sx + tw - 2, sy + th * 0.38 + wave1);
    ctx.stroke();
    ctx.strokeStyle = waterStyle === "horror" ? "rgba(120,80,180,0.14)" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy + th * 0.56 + wave2);
    ctx.bezierCurveTo(sx + tw * 0.38, sy + th * 0.5 + wave2, sx + tw * 0.62, sy + th * 0.6 + wave2, sx + tw - 4, sy + th * 0.54 + wave2);
    ctx.stroke();
    ctx.strokeStyle = waterStyle === "horror" ? "rgba(74,20,140,0.1)" : "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(sx, sy + th * 0.72 + wave3);
    ctx.bezierCurveTo(sx + tw * 0.5, sy + th * 0.68 + wave3, sx + tw, sy + th * 0.74 + wave3, sx + tw, sy + th * 0.7 + wave3);
    ctx.stroke();

    if (shoreDist < 110 || depthMix < 0.65) {
      const causticAlpha =
        waterStyle === "horror" ? (shoreDist < 50 ? 0.2 : 0.12) : shoreDist < 50 ? 0.28 : 0.16;
      if (waterStyle === "horror") {
        const pulse = 0.5 + Math.sin(animT * 2.2 + seed * 0.03) * 0.5;
        ctx.fillStyle = `rgba(186,104,255,${causticAlpha * pulse * 0.35})`;
        for (let c = 0; c < 3; c++) {
          const cx = sx + tw * (0.25 + c * 0.22) + Math.sin(animT * 1.8 + seed + c) * 4;
          const cy = sy + th * (0.42 + c * 0.08) + Math.cos(animT * 2 + seed + c) * 3;
          ctx.beginPath();
          ctx.ellipse(cx, cy, tw * 0.14, th * 0.06, hash01(seed, c) * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        drawCaustics(ctx, sx, sy, tw, th, animT, seed, causticAlpha);
      }
    }

    const sunGlintX = sx + tw * (0.42 + Math.sin(animT * 0.8 + seed * 0.01) * 0.08);
    const sunGlintY = sy + th * 0.38 + wave1 * 0.4;
    const glint = ctx.createRadialGradient(sunGlintX, sunGlintY, 0, sunGlintX, sunGlintY, tw * 0.35);
    glint.addColorStop(0, "rgba(255,255,255,0.38)");
    glint.addColorStop(0.35, "rgba(255,255,255,0.12)");
    glint.addColorStop(0.65, "rgba(200,240,255,0.04)");
    glint.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glint;
    ctx.fillRect(sx, sy, tw, th);

    const streak = ctx.createLinearGradient(sx, sy + th * 0.35, sx + tw, sy + th * 0.42);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.45, `rgba(255,255,255,${0.08 + (1 - depthMix) * 0.12})`);
    streak.addColorStop(0.55, `rgba(255,255,255,${0.05 + (1 - depthMix) * 0.08})`);
    streak.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = streak;
    ctx.fillRect(sx, sy, tw, th);

    if (shoreDist >= 0 && shoreDist < 85) {
      const foam = 1 - shoreDist / 85;
      ctx.fillStyle =
        waterStyle === "horror"
          ? `rgba(220,210,240,${0.28 * foam})`
          : `rgba(255,255,255,${0.42 * foam})`;
      for (let f = 0; f < 7; f++) {
        const fx = sx + ((seed + f * 23) % (tw - 8)) + 4;
        const fy = sy + th - 9 - f * 2.1 + Math.sin(animT * 3.2 + seed + f) * 2.8;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 12 + f * 2.4, 4.2 + f * 0.55, hash01(seed, f) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle =
        waterStyle === "horror"
          ? `rgba(186,104,255,${0.26 * foam})`
          : `rgba(255,255,255,${0.32 * foam})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + th - 5);
      ctx.bezierCurveTo(sx + tw * 0.28, sy + th - 10, sx + tw * 0.72, sy + th - 3, sx + tw - 4, sy + th - 6);
      ctx.stroke();
    }

    if (waterStyle === "horror") {
      const mist = ctx.createLinearGradient(sx, sy, sx, sy + th * 0.55);
      mist.addColorStop(0, `rgba(186,104,255,${0.06 + Math.sin(animT + seed * 0.02) * 0.03})`);
      mist.addColorStop(0.5, "rgba(74,20,140,0.04)");
      mist.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mist;
      ctx.fillRect(sx, sy, tw, th);

      if ((seed % 13) === 0) {
        const gx = sx + tw * 0.5 + Math.sin(animT * 1.5 + seed) * 6;
        const gy = sy + th * 0.45 + Math.cos(animT * 1.2 + seed) * 4;
        const ghost = ctx.createRadialGradient(gx, gy, 0, gx, gy, tw * 0.22);
        ghost.addColorStop(0, `rgba(240,230,255,${0.22 + Math.sin(animT * 3 + seed) * 0.08})`);
        ghost.addColorStop(0.55, "rgba(186,104,255,0.1)");
        ghost.addColorStop(1, "rgba(74,20,140,0)");
        ctx.fillStyle = ghost;
        ctx.beginPath();
        ctx.ellipse(gx, gy, tw * 0.16, th * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,80,80,${0.35 + Math.sin(animT * 4 + seed) * 0.2})`;
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 2, 1.8, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawHorrorGrass(ctx, sx, sy, tw, th, seed, shoreDist) {
    const patch = ((seed * 13) % 100) / 100;
    const n = fbm(seed * 0.02, sx * 0.015, 3);
    const nearCoast = shoreDist != null && shoreDist > -95 && shoreDist < 18;
    const ashMix = nearCoast ? Math.max(0, 1 - Math.abs(shoreDist + 28) / 72) : 0;
    const g = ctx.createLinearGradient(sx, sy, sx + tw * 0.3, sy + th);
    if (ashMix > 0.08) {
      g.addColorStop(0, shade("#f5f5f5", 0.02 + ashMix * 0.04));
      g.addColorStop(0.2, shade("#e8e8e8", ashMix * 0.06));
      g.addColorStop(0.35, shade("#fafafa", 0.02 + patch * 0.03));
      g.addColorStop(0.48, "#f0f0f0");
    } else {
      g.addColorStop(0, shade("#ffffff", 0.01 + patch * 0.04));
      g.addColorStop(0.25, "#fafafa");
    }
    g.addColorStop(0.55, shade("#eceff1", n * 0.03));
    g.addColorStop(0.82, "#cfd8dc");
    g.addColorStop(1, "#b0bec5");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);
    drawMicroTexture(ctx, sx, sy, tw, th, seed, 0.028);

    if (nearCoast && ashMix > 0.1) {
      const shore = ctx.createLinearGradient(sx, sy + th * 0.55, sx, sy + th);
      shore.addColorStop(0, "rgba(210,200,225,0)");
      shore.addColorStop(0.5, `rgba(186,170,210,${0.14 * ashMix})`);
      shore.addColorStop(1, `rgba(140,120,170,${0.22 * ashMix})`);
      ctx.fillStyle = shore;
      ctx.fillRect(sx, sy, tw, th);
    }

    const edgeShade = ctx.createLinearGradient(sx, sy + th - 6, sx, sy + th);
    edgeShade.addColorStop(0, "rgba(0,0,0,0)");
    edgeShade.addColorStop(1, "rgba(40,20,60,0.1)");
    ctx.fillStyle = edgeShade;
    ctx.fillRect(sx, sy, tw, th);

    for (let n2 = 0; n2 < 4; n2++) {
      const nx = sx + hash01(seed, n2) * tw;
      const ny = sy + hash01(seed + 7, n2) * th;
      const rad = 8 + hash01(seed + 13, n2) * 14;
      const spot = ctx.createRadialGradient(nx, ny, 0, nx, ny, rad);
      spot.addColorStop(0, `rgba(255,255,255,${0.12 + hash01(seed, n2 + 3) * 0.06})`);
      spot.addColorStop(0.6, "rgba(186,104,255,0.04)");
      spot.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(sx, sy, tw, th);
    }

    if ((seed % 9) === 0) {
      const fog = ctx.createRadialGradient(sx + tw * 0.5, sy + th * 0.5, 2, sx + tw * 0.5, sy + th * 0.5, tw * 0.38);
      fog.addColorStop(0, "rgba(74,20,140,0.14)");
      fog.addColorStop(1, "rgba(74,20,140,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(sx, sy, tw, th);
    }

    for (let i = 0; i < 12; i++) {
      const gx = sx + ((seed + i * 31) % (tw - 8)) + 4;
      const gy = sy + th - 4 - ((seed + i * 17) % 18);
      const len = 9 + (seed + i) % 10;
      const lean = ((i % 5) - 2) * 0.7;
      const blade = shade(i % 2 ? "#eceff1" : "#cfd8dc", i % 3 ? 0.06 : -0.04);
      ctx.strokeStyle = blade;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + lean * 2.2, gy - len * 0.55, gx + lean * 1.1, gy - len);
      ctx.stroke();
    }

    if ((seed % 17) === 0) {
      ctx.fillStyle = `rgba(186,104,255,${0.35 + (seed % 5) * 0.05})`;
      ctx.beginPath();
      ctx.arc(sx + tw * 0.55, sy + th * 0.48, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawIslandGrass(ctx, sx, sy, tw, th, seed, shoreDist, terrainStyle) {
    if (terrainStyle === "horror") {
      drawHorrorGrass(ctx, sx, sy, tw, th, seed, shoreDist);
      return;
    }
    const patch = ((seed * 13) % 100) / 100;
    const n = fbm(seed * 0.02, sx * 0.015, 3);
    const nearCoast = shoreDist != null && shoreDist > -95 && shoreDist < 18;
    const sandMix = nearCoast ? Math.max(0, 1 - Math.abs(shoreDist + 28) / 72) : 0;
    const g = ctx.createLinearGradient(sx, sy, sx + tw * 0.3, sy + th);
    if (sandMix > 0.08) {
      g.addColorStop(0, shade("#efe0b9", 0.04 + sandMix * 0.08));
      g.addColorStop(0.18, shade("#d7ccc8", sandMix * 0.12));
      g.addColorStop(0.3, shade("#c5e1a5", 0.02 + patch * 0.04));
      g.addColorStop(0.42, "#aed581");
    } else {
      g.addColorStop(0, shade("#c5e1a5", 0.02 + patch * 0.04));
      g.addColorStop(0.25, "#aed581");
    }
    g.addColorStop(0.55, shade("#8bc34a", n * 0.04));
    g.addColorStop(0.82, "#689f38");
    g.addColorStop(1, "#558b2f");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);
    drawMicroTexture(ctx, sx, sy, tw, th, seed, 0.038);

    if (nearCoast && sandMix > 0.12) {
      const beach = ctx.createLinearGradient(sx, sy + th * 0.55, sx, sy + th);
      beach.addColorStop(0, "rgba(210,180,120,0)");
      beach.addColorStop(0.45, `rgba(224,198,145,${0.16 * sandMix})`);
      beach.addColorStop(1, `rgba(194,168,110,${0.32 * sandMix})`);
      ctx.fillStyle = beach;
      ctx.fillRect(sx, sy, tw, th);
      drawMicroTexture(ctx, sx, sy + th - 8, tw, 8, seed + 401, 0.05);
    }

    const edgeShade = ctx.createLinearGradient(sx, sy + th - 6, sx, sy + th);
    edgeShade.addColorStop(0, "rgba(0,0,0,0)");
    edgeShade.addColorStop(1, "rgba(0,0,0,0.09)");
    ctx.fillStyle = edgeShade;
    ctx.fillRect(sx, sy, tw, th);

    for (let n2 = 0; n2 < 5; n2++) {
      const nx = sx + hash01(seed, n2) * tw;
      const ny = sy + hash01(seed + 7, n2) * th;
      const rad = 10 + hash01(seed + 13, n2) * 16;
      const spot = ctx.createRadialGradient(nx, ny, 0, nx, ny, rad);
      spot.addColorStop(0, `rgba(255,255,255,${0.08 + hash01(seed, n2 + 3) * 0.05})`);
      spot.addColorStop(0.6, `rgba(200,230,160,${0.04})`);
      spot.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(sx, sy, tw, th);
    }

    if ((seed % 11) === 0) {
      const dirt = ctx.createRadialGradient(sx + tw * 0.5, sy + th * 0.5, 2, sx + tw * 0.5, sy + th * 0.5, tw * 0.35);
      dirt.addColorStop(0, "rgba(109,76,65,0.18)");
      dirt.addColorStop(1, "rgba(109,76,65,0)");
      ctx.fillStyle = dirt;
      ctx.fillRect(sx, sy, tw, th);
    }

    ctx.fillStyle = shade("#558b2f", -0.1);
    for (let p = 0; p < 10; p++) {
      if ((seed + p * 7) % 4 !== 0) continue;
      const px = sx + ((seed + p * 41) % (tw - 12)) + 6;
      const py = sy + ((seed + p * 29) % (th - 12)) + 6;
      ctx.beginPath();
      ctx.ellipse(px, py, 4.5, 2.8, hash01(seed, p) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 14; i++) {
      const gx = sx + ((seed + i * 31) % (tw - 8)) + 4;
      const gy = sy + th - 4 - ((seed + i * 17) % 18);
      const len = 10 + (seed + i) % 12;
      const lean = ((i % 5) - 2) * 0.8;
      const blade = shade(i % 2 ? "#558b2f" : "#33691e", i % 3 ? 0.08 : -0.05);
      ctx.strokeStyle = blade;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + lean * 2.5, gy - len * 0.55, gx + lean * 1.2, gy - len);
      ctx.stroke();
      ctx.strokeStyle = shade(blade, 0.15);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(gx + 0.5, gy - 1);
      ctx.lineTo(gx + lean * 0.8, gy - len * 0.85);
      ctx.stroke();
    }

    if ((seed % 23) === 0) {
      ctx.fillStyle = "#fff176";
      ctx.beginPath();
      ctx.arc(sx + tw * 0.6, sy + th * 0.55, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f48fb1";
      for (let f = 0; f < 3; f++) {
        ctx.beginPath();
        ctx.arc(sx + tw * (0.3 + f * 0.15), sy + th * (0.65 + f * 0.05), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPondPatch(ctx, sx, sy, tw, th, animT, seed) {
    const cx = sx + tw * 0.5;
    const cy = sy + th * 0.5;
    const g = ctx.createRadialGradient(cx, cy - 8, 2, cx, cy, tw * 0.62);
    g.addColorStop(0, "#e0f7fa");
    g.addColorStop(0.2, "#80deea");
    g.addColorStop(0.45, "#26c6da");
    g.addColorStop(0.7, "#00838f");
    g.addColorStop(0.9, "#006064");
    g.addColorStop(1, "#004d40");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);

    drawCaustics(ctx, sx, sy, tw, th, animT, seed, 0.2);

    const reflect = ctx.createLinearGradient(cx - tw * 0.2, cy - th * 0.15, cx + tw * 0.15, cy);
    reflect.addColorStop(0, "rgba(255,255,255,0.22)");
    reflect.addColorStop(0.5, "rgba(255,255,255,0.08)");
    reflect.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = reflect;
    ctx.beginPath();
    ctx.ellipse(cx - tw * 0.1, cy - th * 0.1, tw * 0.22, th * 0.1, -0.25, 0, Math.PI * 2);
    ctx.fill();

    const ripple = Math.sin(animT * 2.2 + seed * 0.03) * 2;
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 1.3;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + ripple * 0.5, tw * (0.26 + r * 0.07), th * (0.11 + r * 0.035), r * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    }

    const edgeG = ctx.createLinearGradient(sx, sy + th - 8, sx, sy + th);
    edgeG.addColorStop(0, "rgba(46,125,50,0)");
    edgeG.addColorStop(1, "rgba(46,125,50,0.35)");
    ctx.fillStyle = edgeG;
    ctx.fillRect(sx, sy + th - 8, tw, 8);
  }

  function drawSandGround(ctx, sx, sy, tw, th, seed, shoreDist) {
    const patch = ((seed * 9) % 100) / 100;
    const nearCoast = shoreDist != null && shoreDist > -95 && shoreDist < 18;
    const g = ctx.createLinearGradient(sx, sy, sx + tw * 0.25, sy + th);
    g.addColorStop(0, shade("#f5e6bd", 0.02 + patch * 0.05));
    g.addColorStop(0.3, "#e6cf9a");
    g.addColorStop(0.7, "#d4b483");
    g.addColorStop(1, "#c7a172");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);
    drawMicroTexture(ctx, sx, sy, tw, th, seed + 101, 0.045);

    if (nearCoast) {
      const wet = ctx.createLinearGradient(sx, sy + th * 0.45, sx, sy + th);
      wet.addColorStop(0, "rgba(120,98,66,0)");
      wet.addColorStop(1, "rgba(120,98,66,0.18)");
      ctx.fillStyle = wet;
      ctx.fillRect(sx, sy, tw, th);
    }
  }

  function drawCoralCluster(ctx, x, y, scale, animT) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    drawSoftShadow(ctx, 0, 4 * scale, 14 * scale, 5 * scale);
    const bob = Math.sin(animT * 2 + x * 0.01) * 1.2 * scale;

    const colors = ["#ff8a80", "#f06292", "#ffb74d", "#4dd0e1"];
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = (3 - i * 0.35) * scale;
      const ox = (-10 + i * 6) * scale;
      ctx.beginPath();
      ctx.moveTo(ox, 4 * scale);
      ctx.quadraticCurveTo(ox - 3 * scale, -8 * scale + bob, ox + (i % 2 ? 3 : -2) * scale, -16 * scale + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ox + (i % 2 ? 3 : -2) * scale, -16 * scale + bob, 2.1 * scale, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }
    ctx.restore();
  }

  function drawIceGround(ctx, sx, sy, tw, th, seed, shoreDist) {
    const patch = ((seed * 13) % 100) / 100;
    const n = fbm(seed * 0.02, sx * 0.015, 3);
    const nearCoast = shoreDist != null && shoreDist > -95 && shoreDist < 18;
    const frostMix = nearCoast ? Math.max(0, 1 - Math.abs(shoreDist + 28) / 72) : 0;
    const g = ctx.createLinearGradient(sx, sy, sx + tw * 0.3, sy + th);
    if (frostMix > 0.08) {
      g.addColorStop(0, shade("#e1f5fe", 0.06 + frostMix * 0.1));
      g.addColorStop(0.22, shade("#b3e5fc", frostMix * 0.08));
      g.addColorStop(0.45, shade("#e0f7fa", 0.04 + patch * 0.04));
    } else {
      g.addColorStop(0, shade("#e0f7fa", 0.04 + patch * 0.04));
      g.addColorStop(0.25, "#b3e5fc");
    }
    g.addColorStop(0.55, shade("#81d4fa", n * 0.04));
    g.addColorStop(0.82, "#4fc3f7");
    g.addColorStop(1, "#29b6f6");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);
    drawMicroTexture(ctx, sx, sy, tw, th, seed, 0.028);

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    for (let c = 0; c < 4; c++) {
      if ((seed + c * 11) % 5 !== 0) continue;
      const cx = sx + ((seed + c * 37) % (tw - 10)) + 5;
      const cy = sy + ((seed + c * 23) % (th - 10)) + 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 5, cy - 8);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx + 5, cy + 8);
      ctx.closePath();
      ctx.fill();
    }

    if ((seed % 13) === 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + th * 0.35);
      ctx.lineTo(sx + tw * 0.55, sy + th * 0.62);
      ctx.lineTo(sx + tw - 4, sy + th * 0.42);
      ctx.stroke();
    }
  }

  function drawIcePath(ctx, sx, sy, tw, th, seed, shoreDist) {
    drawIceGround(ctx, sx, sy, tw, th, seed, shoreDist);
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, "rgba(255,255,255,0.38)");
    g.addColorStop(0.45, "rgba(224,247,250,0.28)");
    g.addColorStop(1, "rgba(179,229,252,0.18)");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 2, sy + 2, tw - 4, th - 4);

    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const y = sy + 6 + i * ((th - 12) / 2);
      ctx.beginPath();
      ctx.moveTo(sx + 4, y);
      ctx.lineTo(sx + tw - 4, y + (i % 2 ? 2 : -2));
      ctx.stroke();
    }
  }

  function drawIcePondPatch(ctx, sx, sy, tw, th, animT, seed) {
    const cx = sx + tw * 0.5;
    const cy = sy + th * 0.5;
    const g = ctx.createRadialGradient(cx, cy - 6, 2, cx, cy, tw * 0.62);
    g.addColorStop(0, "#e1f5fe");
    g.addColorStop(0.15, "#81d4fa");
    g.addColorStop(0.35, "#29b6f6");
    g.addColorStop(0.55, "#0288d1");
    g.addColorStop(0.75, "#01579b");
    g.addColorStop(0.9, "#004d73");
    g.addColorStop(1, "#003554");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);

    drawCaustics(ctx, sx, sy, tw, th, animT, seed, 0.14);

    const hole = ctx.createRadialGradient(cx, cy, 2, cx, cy, tw * 0.22);
    hole.addColorStop(0, "rgba(1,87,155,0.55)");
    hole.addColorStop(0.55, "rgba(2,136,209,0.28)");
    hole.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.ellipse(cx, cy, tw * 0.24, th * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    const rim = ctx.createLinearGradient(sx, sy, sx, sy + th);
    rim.addColorStop(0, "rgba(255,255,255,0.55)");
    rim.addColorStop(0.35, "rgba(224,247,250,0.35)");
    rim.addColorStop(1, "rgba(179,229,252,0.15)");
    ctx.fillStyle = rim;
    ctx.fillRect(sx, sy, tw, th * 0.22);
    ctx.fillRect(sx, sy + th * 0.78, tw, th * 0.22);

    const ripple = Math.sin(animT * 1.8 + seed * 0.03) * 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.2;
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + ripple, tw * (0.2 + r * 0.06), th * (0.09 + r * 0.03), r * 0.1, 0, Math.PI * 2);
      ctx.stroke();
    }

    if ((seed % 9) === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 2);
      ctx.lineTo(cx, cy - 7);
      ctx.lineTo(cx + 4, cy - 2);
      ctx.lineTo(cx, cy + 3);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawIceTree(ctx, x, y, scale, animT) {
    scale = scale || 1;
    const sway = Math.sin(animT * 1.1 + x * 0.007) * 1.5 * scale;
    ctx.save();
    ctx.translate(x, y);
    drawSoftShadow(ctx, 0, 5, 20 * scale, 7 * scale);

    const trunkW = 10 * scale;
    const trunkH = 28 * scale;
    const trunkG = ctx.createLinearGradient(-trunkW * 0.5, -trunkH, trunkW * 0.5, 0);
    trunkG.addColorStop(0, "#90caf9");
    trunkG.addColorStop(0.45, "#64b5f6");
    trunkG.addColorStop(0.8, "#42a5f5");
    trunkG.addColorStop(1, "#1e88e5");
    ctx.fillStyle = trunkG;
    ctx.fillRect(-trunkW * 0.5, -trunkH, trunkW, trunkH);

    const spires = [
      { ox: sway, oy: -34 * scale, w: 14 * scale, h: 34 * scale },
      { ox: -12 * scale + sway * 0.6, oy: -26 * scale, w: 11 * scale, h: 26 * scale },
      { ox: 12 * scale + sway * 0.6, oy: -26 * scale, w: 11 * scale, h: 26 * scale },
      { ox: sway * 0.4, oy: -44 * scale, w: 9 * scale, h: 20 * scale },
    ];
    spires.forEach((sp, i) => {
      const sg = ctx.createLinearGradient(sp.ox, sp.oy, sp.ox, sp.oy - sp.h);
      sg.addColorStop(0, "#b3e5fc");
      sg.addColorStop(0.35, "#81d4fa");
      sg.addColorStop(0.7, "#4fc3f7");
      sg.addColorStop(1, "#e1f5fe");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(sp.ox, sp.oy);
      ctx.lineTo(sp.ox - sp.w * 0.5, sp.oy - sp.h);
      ctx.lineTo(sp.ox + sp.w * 0.5, sp.oy - sp.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (i < 2) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.arc(sp.ox - sp.w * 0.15, sp.oy - sp.h * 0.55, sp.w * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function drawStormGround(ctx, sx, sy, tw, th, seed) {
    const patch = ((seed * 11) % 100) / 100;
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, shade("#78909c", 0.04 + patch * 0.04));
    g.addColorStop(0.45, "#607d8b");
    g.addColorStop(1, "#546e7a");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const gx = sx + ((seed + i * 29) % (tw - 8)) + 4;
      const gy = sy + th - 6 - ((seed + i * 13) % 10);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + (i % 2 ? 3 : -2), gy - 8 - (seed + i) % 6);
      ctx.stroke();
    }
  }

  function drawCaveGround(ctx, sx, sy, tw, th, seed, animT) {
    const patch = ((seed * 11) % 100) / 100;
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, shade("#546e7a", 0.04 + patch * 0.04));
    g.addColorStop(0.4, "#455a64");
    g.addColorStop(0.75, "#37474f");
    g.addColorStop(1, "#263238");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);

    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = sy + 8 + i * ((th - 16) / 3);
      ctx.beginPath();
      ctx.moveTo(sx + 4, y);
      ctx.lineTo(sx + tw - 4, y + (i % 2 ? 2 : -2));
      ctx.stroke();
    }

    if ((seed % 7) === 0) {
      const cx = sx + tw * 0.5;
      const cy = sy + th * 0.5;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, tw * 0.35);
      glow.addColorStop(0, "rgba(129,199,132,0.18)");
      glow.addColorStop(1, "rgba(129,199,132,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(sx, sy, tw, th);
    }

    if ((seed % 11) === 0) {
      ctx.fillStyle = "rgba(176,190,197,0.35)";
      ctx.beginPath();
      ctx.moveTo(sx + tw * 0.2, sy + th - 4);
      ctx.lineTo(sx + tw * 0.35, sy + th * 0.35);
      ctx.lineTo(sx + tw * 0.15, sy + th * 0.55);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawRockTree(ctx, x, y, scale, animT) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    drawSoftShadow(ctx, 0, 5, 18 * scale, 6 * scale);

    const baseW = 22 * scale;
    const baseH = 14 * scale;
    const baseG = ctx.createLinearGradient(-baseW * 0.5, -baseH, baseW * 0.5, 0);
    baseG.addColorStop(0, "#78909c");
    baseG.addColorStop(0.5, "#607d8b");
    baseG.addColorStop(1, "#455a64");
    ctx.fillStyle = baseG;
    ctx.beginPath();
    ctx.moveTo(-baseW * 0.55, 0);
    ctx.lineTo(-baseW * 0.35, -baseH);
    ctx.lineTo(baseW * 0.1, -baseH * 1.15);
    ctx.lineTo(baseW * 0.5, -baseH * 0.55);
    ctx.lineTo(baseW * 0.45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(38,50,56,0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const spires = [
      { ox: -8 * scale, oy: -baseH * 1.05, w: 10 * scale, h: 22 * scale },
      { ox: 4 * scale, oy: -baseH * 1.25, w: 12 * scale, h: 28 * scale },
      { ox: 14 * scale, oy: -baseH * 0.95, w: 9 * scale, h: 18 * scale },
    ];
    spires.forEach((sp, i) => {
      const sway = Math.sin(animT * 1.2 + x * 0.01 + i) * 0.8 * scale;
      const sg = ctx.createLinearGradient(sp.ox, sp.oy, sp.ox, sp.oy - sp.h);
      sg.addColorStop(0, "#90a4ae");
      sg.addColorStop(0.45, "#607d8b");
      sg.addColorStop(1, "#455a64");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(sp.ox + sway, sp.oy);
      ctx.lineTo(sp.ox - sp.w * 0.45 + sway, sp.oy - sp.h * 0.55);
      ctx.lineTo(sp.ox + sway * 0.5, sp.oy - sp.h);
      ctx.lineTo(sp.ox + sp.w * 0.45 + sway, sp.oy - sp.h * 0.5);
      ctx.closePath();
      ctx.fill();
    });

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(-3 * scale, -baseH * 0.8, 4 * scale, 10 * scale);
    ctx.restore();
  }

  function drawStormTree(ctx, x, y, scale, animT) {
    scale = scale || 1;
    const sway = Math.sin(animT * 2.4 + x * 0.01) * 4 * scale;
    ctx.save();
    ctx.translate(x, y);
    drawSoftShadow(ctx, 0, 4, 20 * scale, 7 * scale);

    const trunkW = 10 * scale;
    const trunkH = 32 * scale;
    const trunkG = ctx.createLinearGradient(-trunkW * 0.5, -trunkH, trunkW * 0.5, 0);
    trunkG.addColorStop(0, "#6d4c41");
    trunkG.addColorStop(0.5, "#5d4037");
    trunkG.addColorStop(1, "#4e342e");
    ctx.fillStyle = trunkG;
    ctx.fillRect(-trunkW * 0.5, -trunkH, trunkW, trunkH);

    const tops = [
      { ox: sway, oy: -40 * scale, r: 18 * scale },
      { ox: -14 * scale + sway * 0.7, oy: -28 * scale, r: 14 * scale },
      { ox: 14 * scale + sway * 0.7, oy: -28 * scale, r: 14 * scale },
      { ox: sway * 0.5, oy: -46 * scale, r: 12 * scale },
    ];
    tops.forEach((cl, i) => {
      const g = ctx.createRadialGradient(cl.ox, cl.oy, 2, cl.ox, cl.oy, cl.r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, "#eceff1");
      g.addColorStop(0.8, "#cfd8dc");
      g.addColorStop(1, "#b0bec5");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cl.ox, cl.oy, cl.r, 0, Math.PI * 2);
      ctx.fill();
      if (i === 0) {
        ctx.strokeStyle = "rgba(176,190,197,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cl.ox, cl.oy, cl.r * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function drawHauntedTree(ctx, x, y, scale, animT) {
    scale = scale || 1;
    const sway = Math.sin(animT * 1.4 + x * 0.007) * 3.5 * scale;
    const pulse = 0.65 + Math.sin(animT * 2.8 + x * 0.01) * 0.35;
    ctx.save();
    ctx.translate(x, y);

    drawSoftShadow(ctx, 0, 6, 26 * scale, 10 * scale);

    const trunkW = 11 * scale;
    const trunkH = 42 * scale;
    const trunkG = ctx.createLinearGradient(-trunkW * 0.5, -trunkH, trunkW * 0.5, 0);
    trunkG.addColorStop(0, "#3e2723");
    trunkG.addColorStop(0.35, "#2a1a1a");
    trunkG.addColorStop(0.7, "#1a0a2e");
    trunkG.addColorStop(1, "#0d0221");
    ctx.fillStyle = trunkG;
    ctx.beginPath();
    ctx.moveTo(-trunkW * 0.45, 0);
    ctx.quadraticCurveTo(-trunkW * 0.55 + sway * 0.08, -trunkH * 0.45, -trunkW * 0.35 + sway * 0.12, -trunkH);
    ctx.lineTo(trunkW * 0.35 + sway * 0.1, -trunkH);
    ctx.quadraticCurveTo(trunkW * 0.5 - sway * 0.06, -trunkH * 0.42, trunkW * 0.42, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#1a0a2e";
    ctx.lineWidth = 1.2;
    const branches = [
      [-trunkW * 0.2 + sway * 0.15, -trunkH * 0.55, -28 * scale + sway, -trunkH * 0.82],
      [trunkW * 0.15 + sway * 0.1, -trunkH * 0.62, 32 * scale + sway * 0.8, -trunkH * 0.88],
      [sway * 0.2, -trunkH * 0.72, sway * 0.5, -trunkH * 1.02],
      [-trunkW * 0.35 + sway * 0.08, -trunkH * 0.38, -22 * scale + sway * 0.6, -trunkH * 0.58],
      [trunkW * 0.3 + sway * 0.06, -trunkH * 0.42, 24 * scale + sway * 0.5, -trunkH * 0.62],
    ];
    branches.forEach(([bx, by, ex, ey]) => {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo((bx + ex) * 0.5, (by + ey) * 0.5 - 6 * scale, ex, ey);
      ctx.stroke();
    });

    const eyeY = -trunkH * 0.68 + sway * 0.15;
    const eyeGlow = ctx.createRadialGradient(-7 * scale + sway * 0.1, eyeY, 0, -7 * scale + sway * 0.1, eyeY, 10 * scale);
    eyeGlow.addColorStop(0, `rgba(255,80,80,${0.55 * pulse})`);
    eyeGlow.addColorStop(0.55, `rgba(186,104,255,${0.25 * pulse})`);
    eyeGlow.addColorStop(1, "rgba(74,20,140,0)");
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(-7 * scale + sway * 0.1, eyeY, 9 * scale, 0, Math.PI * 2);
    ctx.fill();
    const eyeGlow2 = ctx.createRadialGradient(7 * scale + sway * 0.08, eyeY, 0, 7 * scale + sway * 0.08, eyeY, 10 * scale);
    eyeGlow2.addColorStop(0, `rgba(255,80,80,${0.55 * pulse})`);
    eyeGlow2.addColorStop(0.55, `rgba(186,104,255,${0.25 * pulse})`);
    eyeGlow2.addColorStop(1, "rgba(74,20,140,0)");
    ctx.fillStyle = eyeGlow2;
    ctx.beginPath();
    ctx.arc(7 * scale + sway * 0.08, eyeY, 9 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,60,60,${0.85 * pulse})`;
    ctx.beginPath();
    ctx.arc(-7 * scale + sway * 0.1, eyeY, 2.2 * scale, 0, Math.PI * 2);
    ctx.arc(7 * scale + sway * 0.08, eyeY, 2.2 * scale, 0, Math.PI * 2);
    ctx.fill();

    for (let g = 0; g < 2; g++) {
      const gx = (g === 0 ? -18 : 16) * scale + sway * (0.4 + g * 0.2);
      const gy = -trunkH * (0.82 + g * 0.08) + Math.sin(animT * 2 + g + x * 0.01) * 4 * scale;
      const wisp = ctx.createRadialGradient(gx, gy, 0, gx, gy, 14 * scale);
      wisp.addColorStop(0, `rgba(240,235,255,${0.28 + pulse * 0.12})`);
      wisp.addColorStop(0.5, `rgba(186,104,255,${0.12 * pulse})`);
      wisp.addColorStop(1, "rgba(74,20,140,0)");
      ctx.fillStyle = wisp;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 12 * scale, 8 * scale, g * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = `${Math.round(10 * scale)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.35 + pulse * 0.25;
    ctx.fillText("👻", sway * 0.3, -trunkH * 0.92);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawWhiteWaterTile(ctx, sx, sy, tw, th, animT, seed, shoreDist) {
    shoreDist = shoreDist == null ? 999 : shoreDist;
    const foam = shoreDist < 70 ? 1 - shoreDist / 70 : 0.35;
    const g = ctx.createLinearGradient(sx, sy, sx, sy + th);
    g.addColorStop(0, shade("#eceff1", foam * 0.15));
    g.addColorStop(0.35, "#cfd8dc");
    g.addColorStop(0.7, "#b0bec5");
    g.addColorStop(1, "#90a4ae");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);

    const churn = Math.sin(animT * 4 + seed * 0.04 + sx * 0.03) * 3;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + foam * 0.35})`;
    for (let f = 0; f < 5; f++) {
      const fx = sx + ((seed + f * 19) % (tw - 10)) + 5;
      const fy = sy + ((seed + f * 31) % (th - 8)) + 4 + churn;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 10 + f * 2, 4 + f, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.25 + foam * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + th * 0.45 + churn);
    ctx.bezierCurveTo(sx + tw * 0.35, sy + th * 0.35 + churn, sx + tw * 0.65, sy + th * 0.55 - churn, sx + tw - 2, sy + th * 0.42 + churn);
    ctx.stroke();

    if (shoreDist >= 0 && shoreDist < 55) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - shoreDist / 55)})`;
      ctx.fillRect(sx, sy + th - 8, tw, 6);
    }
  }

  function drawFloatingVoid(ctx, sx, sy, tw, th, animT, seed, camY) {
    const depth = 0.35 + ((sy + camY * 0.2 + seed) % 400) / 900;
    const g = ctx.createLinearGradient(sx, sy, sx, sy + th);
    g.addColorStop(0, `rgba(69,90,100,${0.15 + depth * 0.1})`);
    g.addColorStop(0.5, `rgba(38,50,56,${0.25 + depth * 0.15})`);
    g.addColorStop(1, `rgba(18,24,28,${0.35 + depth * 0.2})`);
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);

    if ((seed % 9) === 0) {
      const drift = Math.sin(animT * 0.8 + seed) * 4;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.ellipse(sx + tw * 0.4 + drift, sy + th * 0.35, tw * 0.28, th * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHurricaneEye(ctx, sx, sy, tw, th, animT, seed) {
    const cx = sx + tw * 0.5;
    const cy = sy + th * 0.5;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, tw * 0.55);
    g.addColorStop(0, "#e0f7fa");
    g.addColorStop(0.35, "#80deea");
    g.addColorStop(0.7, "#26c6da");
    g.addColorStop(1, "#00838f");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);

    const spin = animT * 1.5 + seed * 0.02;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 2; r++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, tw * (0.22 + r * 0.08), th * (0.16 + r * 0.06), spin + r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const ripple = Math.sin(animT * 2 + seed * 0.03) * 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + ripple, tw * 0.3, th * 0.14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHurricaneUnderclouds(ctx, camX, camY, w, h, hurricane, animT) {
    const s = {
      x: hurricane.cx - camX,
      y: hurricane.cy - camY,
    };
    const shadow = ctx.createRadialGradient(s.x, s.y + hurricane.ry * 0.3, 20, s.x, s.y + hurricane.ry * 0.5, hurricane.whiteRy * 1.1);
    shadow.addColorStop(0, "rgba(0,0,0,0.18)");
    shadow.addColorStop(0.55, "rgba(38,50,56,0.12)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, w, h);

    for (let c = 0; c < 6; c++) {
      const ang = animT * 0.4 + c * 1.05;
      const rx = hurricane.whiteRx * (0.95 + Math.sin(ang) * 0.04);
      const ry = hurricane.whiteRy * (0.95 + Math.cos(ang * 0.8) * 0.04);
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + (c % 3) * 0.03})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, rx, ry, ang * 0.15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawDock(ctx, sx, sy, dw, dh, facing, animT, worldOx, worldOy) {
    const plankW = 64;
    const plankH = 64;
    const landOverlap = plankW * 0.65;
    const deckW = plankW * 2;

    let deckCols;
    let deckRows;
    if (facing === "north" || facing === "south") {
      deckCols = 2;
      const oceanSpan = Math.max(plankH * 2, dh - landOverlap);
      deckRows = Math.min(5, Math.max(2, Math.round(oceanSpan / plankH)));
    } else {
      deckRows = 2;
      const oceanSpan = Math.max(plankW * 2, dw - landOverlap);
      deckCols = Math.min(5, Math.max(2, Math.round(oceanSpan / plankW)));
    }

    const deckRunX = deckCols * plankW;
    const deckRunY = deckRows * plankH;

    let deckSx = sx;
    let deckSy = sy;
    if (facing === "north") {
      deckSy = sy;
    } else if (facing === "south") {
      deckSy = sy + Math.max(0, dh - deckRunY);
    } else if (facing === "east") {
      deckSx = sx + Math.max(0, dw - deckRunX);
    } else {
      deckSx = sx;
    }

    const cols = deckCols;
    const rows = deckRows;
    const woodA = "#8d6e63";
    const woodB = "#795548";
    const woodC = "#6d4c41";

    ctx.save();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = deckSx + (facing === "east" || facing === "west" ? row * plankW : col * plankW);
        const py = deckSy + (facing === "north" || facing === "south" ? row * plankH : col * plankH);
        const seed = worldOx + worldOy + row * 97 + col * 53;
        const bob = Math.sin(animT * 1.8 + seed * 0.01) * 0.8;

        const base = (row + col) % 3 === 0 ? woodA : (row + col) % 3 === 1 ? woodB : woodC;
        const pg = ctx.createLinearGradient(px, py, px + plankW, py + plankH);
        pg.addColorStop(0, shade(base, 0.12));
        pg.addColorStop(0.5, base);
        pg.addColorStop(1, shade(base, -0.12));
        ctx.fillStyle = pg;
        ctx.fillRect(px, py + bob, plankW - 2, plankH - 2);

        ctx.strokeStyle = "rgba(62,39,35,0.35)";
        ctx.lineWidth = 1;
        for (let grain = 0; grain < 3; grain++) {
          ctx.beginPath();
          ctx.moveTo(px + 6 + grain * 18, py + 8 + bob);
          ctx.lineTo(px + 10 + grain * 16, py + plankH - 10 + bob);
          ctx.stroke();
        }

        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.strokeRect(px + 0.5, py + bob + 0.5, plankW - 3, plankH - 3);
      }
    }

    const pilingCount = 5;
    for (let i = 0; i <= pilingCount; i++) {
      const t = i / pilingCount;
      let px;
      let py;
      if (facing === "north" || facing === "south") {
        px = deckSx + (i % 2) * (deckW - 10) + 5;
        py = deckSy + t * deckRunY;
      } else {
        px = deckSx + t * deckRunX;
        py = deckSy + (i % 2) * (deckW - 10) + 5;
      }
      const bob = Math.sin(animT * 2.2 + px * 0.015) * 1.2;
      const pg = ctx.createLinearGradient(px - 4, py, px + 4, py + 28);
      pg.addColorStop(0, "#5d4037");
      pg.addColorStop(1, "#3e2723");
      ctx.fillStyle = pg;
      ctx.fillRect(px - 4, py + bob, 8, 28);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(px - 2, py + bob + 2, 2, 22);
    }

    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 3;
    if (facing === "north" || facing === "south") {
      ctx.beginPath();
      ctx.moveTo(deckSx + 2, deckSy + 4);
      ctx.lineTo(deckSx + 2, deckSy + deckRunY - 4);
      ctx.moveTo(deckSx + deckW - 2, deckSy + 4);
      ctx.lineTo(deckSx + deckW - 2, deckSy + deckRunY - 4);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(deckSx + 4, deckSy + 2);
      ctx.lineTo(deckSx + deckRunX - 4, deckSy + 2);
      ctx.moveTo(deckSx + 4, deckSy + deckW - 2);
      ctx.lineTo(deckSx + deckRunX - 4, deckSy + deckW - 2);
      ctx.stroke();
    }

    let tipX;
    let tipY;
    if (facing === "north") {
      tipX = deckSx + deckW * 0.5;
      tipY = deckSy + 8;
    } else if (facing === "south") {
      tipX = deckSx + deckW * 0.5;
      tipY = deckSy + deckRunY - 8;
    } else if (facing === "east") {
      tipX = deckSx + deckRunX - 8;
      tipY = deckSy + deckW * 0.5;
    } else {
      tipX = deckSx + 8;
      tipY = deckSy + deckW * 0.5;
    }

    ctx.fillStyle = "#5d4037";
    ctx.fillRect(tipX - 6, tipY - 4, 12, 8);
    ctx.fillStyle = "#6d4c41";
    ctx.fillRect(tipX - 4, tipY - 2, 8, 4);

    const label = facing.charAt(0).toUpperCase() + facing.slice(1) + " Dock";
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 3;
    const ly = facing === "north" ? tipY - 14 : facing === "south" ? tipY + 22 : tipY - 16;
    const lx = facing === "west" ? tipX - 28 : facing === "east" ? tipX + 28 : tipX;
    ctx.strokeText(label, lx, ly);
    ctx.fillText(label, lx, ly);
    ctx.restore();
  }

  function drawShopBuilding(ctx, x, y, kind, animT) {
    const bob = Math.sin(animT * 1.2 + x * 0.008) * 0.6;
    ctx.save();
    ctx.translate(x, y + bob);
    const isSell = kind === "sell";
    const isBoat = kind === "boat";
    const isPickaxe = kind === "pickaxe";

    drawSoftShadow(ctx, 0, 18, 38, 10);

    ctx.fillStyle = "#546e7a";
    ctx.fillRect(-38, 8, 76, 10);

    const wallG = ctx.createLinearGradient(-38, -40, 38, 16);
    if (isBoat) {
      wallG.addColorStop(0, "#81d4fa");
      wallG.addColorStop(0.35, "#4fc3f7");
      wallG.addColorStop(0.75, "#0288d1");
      wallG.addColorStop(1, "#01579b");
    } else if (isPickaxe) {
      wallG.addColorStop(0, "#cfd8dc");
      wallG.addColorStop(0.35, "#b0bec5");
      wallG.addColorStop(0.75, "#78909c");
      wallG.addColorStop(1, "#546e7a");
    } else {
      wallG.addColorStop(0, isSell ? "#ffcc80" : "#81c784");
      wallG.addColorStop(0.35, isSell ? "#ffb74d" : "#66bb6a");
      wallG.addColorStop(0.75, isSell ? "#ff9800" : "#43a047");
      wallG.addColorStop(1, isSell ? "#e65100" : "#2e7d32");
    }
    ctx.fillStyle = wallG;
    ctx.strokeStyle = "#37474f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-36, -36, 72, 48, 4);
    ctx.fill();
    ctx.stroke();

    const roofG = ctx.createLinearGradient(-40, -58, 40, -38);
    if (isBoat) {
      roofG.addColorStop(0, "#01579b");
      roofG.addColorStop(0.5, "#0277bd");
      roofG.addColorStop(1, "#039be5");
    } else if (isPickaxe) {
      roofG.addColorStop(0, "#455a64");
      roofG.addColorStop(0.5, "#37474f");
      roofG.addColorStop(1, "#263238");
    } else {
      roofG.addColorStop(0, isSell ? "#e65100" : "#1b5e20");
      roofG.addColorStop(0.5, isSell ? "#bf360c" : "#2e7d32");
      roofG.addColorStop(1, isSell ? "#ff6f00" : "#388e3c");
    }
    ctx.fillStyle = roofG;
    ctx.beginPath();
    ctx.moveTo(-42, -36);
    ctx.lineTo(0, -62);
    ctx.lineTo(42, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let sh = -38; sh <= 30; sh += 12) {
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sh, -34);
      ctx.lineTo(sh + 8, -56);
      ctx.stroke();
    }

    ctx.fillStyle = "#eceff1";
    ctx.fillRect(-14, -20, 28, 26);
    ctx.strokeStyle = "#455a64";
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -20, 28, 26);
    ctx.strokeStyle = "#78909c";
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 6);
    ctx.moveTo(-14, -7);
    ctx.lineTo(14, -7);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(-28, -32, 14, 10);
    ctx.fillRect(14, -32, 14, 10);
    const winGlow = ctx.createRadialGradient(-21, -27, 0, -21, -27, 12);
    winGlow.addColorStop(0, "rgba(255,248,180,0.55)");
    winGlow.addColorStop(1, "rgba(255,248,180,0)");
    ctx.fillStyle = winGlow;
    ctx.fillRect(-28, -32, 14, 10);
    const winGlow2 = ctx.createRadialGradient(21, -27, 0, 21, -27, 12);
    winGlow2.addColorStop(0, "rgba(255,248,180,0.55)");
    winGlow2.addColorStop(1, "rgba(255,248,180,0)");
    ctx.fillStyle = winGlow2;
    ctx.fillRect(14, -32, 14, 10);
    ctx.strokeStyle = "#455a64";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-28, -32, 14, 10);
    ctx.strokeRect(14, -32, 14, 10);

    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isSell ? "💰" : isBoat ? "🚤" : isPickaxe ? "⛏️" : "🎣", 0, -2);

    const awningG = ctx.createLinearGradient(-36, -42, 36, -36);
    if (isBoat) {
      awningG.addColorStop(0, "#4fc3f7");
      awningG.addColorStop(1, "#0277bd");
    } else if (isPickaxe) {
      awningG.addColorStop(0, "#90a4ae");
      awningG.addColorStop(1, "#546e7a");
    } else {
      awningG.addColorStop(0, isSell ? "#ffcc80" : "#a5d6a7");
      awningG.addColorStop(1, isSell ? "#ff9800" : "#43a047");
    }
    ctx.fillStyle = awningG;
    ctx.fillRect(-38, -42, 76, 8);

    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 3;
    const label = isSell ? "Sell Shop" : isPickaxe ? "Pickaxe Shop" : "Fish Shop";
    ctx.strokeText(label, 0, -52);
    ctx.fillText(label, 0, -52);
    ctx.restore();
  }

  function drawCrystalCluster(ctx, x, y, scale, animT, hueShift) {
    scale = scale || 1;
    hueShift = hueShift || 0;
    ctx.save();
    ctx.translate(x, y);
    drawSoftShadow(ctx, 0, 6 * scale, 16 * scale, 6 * scale);
    const pulse = 0.85 + Math.sin(animT * 2 + x * 0.01 + hueShift) * 0.15;
    const crystalColor = `hsla(${190 + hueShift}, 75%, ${58 + pulse * 10}%, 0.95)`;
    ctx.fillStyle = crystalColor;
    const shards = [
      { ox: -9, oy: 0, h: 22, w: 8 },
      { ox: 0, oy: -2, h: 30, w: 10 },
      { ox: 10, oy: 1, h: 20, w: 7 },
    ];
    shards.forEach((s) => {
      ctx.beginPath();
      ctx.moveTo((s.ox - s.w * 0.5) * scale, s.oy * scale);
      ctx.lineTo(s.ox * scale, (s.oy - s.h) * scale);
      ctx.lineTo((s.ox + s.w * 0.5) * scale, s.oy * scale);
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(224,247,250,0.65)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-10 * scale, 0);
    ctx.lineTo(0, -30 * scale);
    ctx.lineTo(10 * scale, 1 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawVolcano(ctx, x, y, scale, animT, showCave) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    const pulse = 1 + Math.sin(animT * 2.5) * 0.03;

    drawSoftShadow(ctx, 0, 20 * scale, 55 * scale, 14 * scale);

    const baseG = ctx.createLinearGradient(-70 * scale, 20 * scale, 70 * scale, -120 * scale);
    baseG.addColorStop(0, "#37474f");
    baseG.addColorStop(0.35, "#263238");
    baseG.addColorStop(0.7, "#212121");
    baseG.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = baseG;
    ctx.beginPath();
    ctx.moveTo(-75 * scale, 30 * scale);
    ctx.lineTo(75 * scale, 30 * scale);
    ctx.lineTo(35 * scale, -95 * scale);
    ctx.lineTo(-35 * scale, -95 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(-55 * scale + r * 8, 24 * scale);
      ctx.lineTo(-20 * scale + r * 4, -70 * scale + r * 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(55 * scale - r * 8, 24 * scale);
      ctx.lineTo(20 * scale - r * 4, -70 * scale + r * 6);
      ctx.stroke();
    }

    if (showCave) {
      ctx.fillStyle = "#0d0d0d";
      ctx.beginPath();
      ctx.moveTo(-34 * scale, 8 * scale);
      ctx.lineTo(34 * scale, 8 * scale);
      ctx.quadraticCurveTo(0, -42 * scale, -34 * scale, 8 * scale);
      ctx.fill();
      ctx.strokeStyle = "#424242";
      ctx.lineWidth = 3;
      ctx.stroke();

      const mouthGlow = ctx.createRadialGradient(0, -10 * scale, 2, 0, -10 * scale, 36 * scale);
      mouthGlow.addColorStop(0, `rgba(255,193,7,${0.65 + Math.sin(animT * 4) * 0.2})`);
      mouthGlow.addColorStop(0.45, "rgba(255,87,34,0.45)");
      mouthGlow.addColorStop(1, "rgba(255,87,34,0)");
      ctx.fillStyle = mouthGlow;
      ctx.beginPath();
      ctx.arc(0, -10 * scale, 34 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.ellipse(0, -88 * scale, 28 * scale * pulse, 12 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const glow = ctx.createRadialGradient(0, -88 * scale, 0, 0, -88 * scale, 40 * scale);
    glow.addColorStop(0, `rgba(255,193,7,${0.45 + Math.sin(animT * 4) * 0.18})`);
    glow.addColorStop(0.5, "rgba(255,87,34,0.28)");
    glow.addColorStop(1, "rgba(255,87,34,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -88 * scale, 38 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#424242";
    for (let s = 0; s < 5; s++) {
      const sx = -50 * scale + s * 22 * scale;
      ctx.fillRect(sx, 8 * scale + (s % 2) * 6, 14 * scale, 22 * scale);
    }

    ctx.font = "600 10px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeText("Volcano", 0, -115 * scale);
    ctx.fillText("Volcano", 0, -115 * scale);
    ctx.restore();
  }

  function drawCaveEntrance(ctx, x, y, animT, isExit) {
    ctx.save();
    ctx.translate(x, y);
    const glow = 0.45 + Math.sin(animT * 3) * 0.15;

    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.moveTo(-32, 8);
    ctx.lineTo(32, 8);
    ctx.quadraticCurveTo(0, -38, -32, 8);
    ctx.fill();
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.moveTo(-22, 6);
    ctx.lineTo(22, 6);
    ctx.quadraticCurveTo(0, -22, -22, 6);
    ctx.fill();

    const inner = ctx.createRadialGradient(0, -4, 2, 0, -4, 28);
    inner.addColorStop(0, `rgba(255,152,0,${0.5 * glow})`);
    inner.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(0, -4, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "600 9px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 3;
    const label = isExit ? "Exit Cave" : "Volcano Cave";
    ctx.strokeText(label, 0, -42);
    ctx.fillText(label, 0, -42);
    ctx.restore();
  }

  function drawVolcanicRock(ctx, sx, sy, tw, th, seed, animT) {
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, shade("#5d4037", 0.06));
    g.addColorStop(0.5, "#4e342e");
    g.addColorStop(1, "#3e2723");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);
    ctx.fillStyle = "rgba(255,87,34,0.08)";
    if ((seed % 9) === 0) {
      ctx.fillRect(sx + 10, sy + 12, tw - 20, 4);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.strokeRect(sx + 0.5, sy + 0.5, tw - 1, th - 1);
  }

  function drawLavaRockGround(ctx, sx, sy, tw, th, seed, shoreDist, animT) {
    const patch = ((seed * 11) % 100) / 100;
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, shade("#37474f", 0.02 + patch * 0.04));
    g.addColorStop(0.35, "#263238");
    g.addColorStop(0.72, "#212121");
    g.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = sy + 6 + i * ((th - 12) / 2);
      ctx.beginPath();
      ctx.moveTo(sx + 3, y);
      ctx.lineTo(sx + tw - 3, y + (i % 2 ? 1 : -1));
      ctx.stroke();
    }

    if ((seed % 8) === 0) {
      ctx.fillStyle = `rgba(255,87,34,${0.12 + Math.sin(animT * 2 + seed * 0.02) * 0.06})`;
      ctx.fillRect(sx + 8, sy + 10, tw - 16, 3);
    }

    if (shoreDist != null && shoreDist > -70 && shoreDist < 14) {
      const mix = Math.max(0, 1 - Math.abs(shoreDist + 20) / 50);
      ctx.fillStyle = `rgba(69,90,100,${0.22 * mix})`;
      ctx.fillRect(sx, sy + th - 7, tw, 7);
    }
  }

  function drawLavaVolcanoGround(ctx, sx, sy, tw, th, seed, animT) {
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, "#424242");
    g.addColorStop(0.5, "#303030");
    g.addColorStop(1, "#212121");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 1, sy + 1, tw - 2, th - 2);
    if ((seed % 6) === 0) {
      ctx.fillStyle = `rgba(255,152,0,${0.14 + Math.sin(animT * 3 + seed * 0.03) * 0.08})`;
      ctx.beginPath();
      ctx.arc(sx + tw * 0.5, sy + th * 0.5, tw * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLavaBridge(ctx, sx, sy, tw, th, seed, animT) {
    const g = ctx.createLinearGradient(sx, sy, sx, sy + th);
    g.addColorStop(0, "#546e7a");
    g.addColorStop(0.45, "#455a64");
    g.addColorStop(1, "#37474f");
    ctx.fillStyle = g;
    ctx.fillRect(sx + 2, sy + 2, tw - 4, th - 4);

    ctx.fillStyle = "#263238";
    ctx.fillRect(sx + 1, sy + 3, 4, th - 6);
    ctx.fillRect(sx + tw - 5, sy + 3, 4, th - 6);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    for (let p = 0; p < 3; p++) {
      const py = sy + 8 + p * ((th - 16) / 2);
      ctx.beginPath();
      ctx.moveTo(sx + 6, py);
      ctx.lineTo(sx + tw - 6, py);
      ctx.stroke();
    }

    if ((seed % 7) === 0) {
      ctx.fillStyle = `rgba(255,171,64,${0.35 + Math.sin(animT * 2.5 + seed * 0.02) * 0.15})`;
      ctx.fillRect(sx + tw * 0.35, sy + th * 0.42, tw * 0.3, 3);
    }
  }

  function drawLavaBridgeSpan(ctx, x1, y1, x2, y2, animT) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 20) return;
    const nx = -dy / len;
    const ny = dx / len;
    const railOff = 14;
    const segments = Math.max(4, Math.floor(len / 36));

    ctx.save();
    ctx.strokeStyle = "rgba(38,50,56,0.55)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1 + nx * railOff, y1 + ny * railOff);
    ctx.lineTo(x2 + nx * railOff, y2 + ny * railOff);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1 - nx * railOff, y1 - ny * railOff);
    ctx.lineTo(x2 - nx * railOff, y2 - ny * railOff);
    ctx.stroke();

    ctx.strokeStyle = "rgba(176,190,197,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      const sag = Math.sin(t * Math.PI) * 3 + Math.sin(animT * 2 + i * 0.4) * 1.2;
      ctx.beginPath();
      ctx.moveTo(px + nx * railOff, py + ny * railOff + sag);
      ctx.lineTo(px - nx * railOff, py - ny * railOff + sag);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawVolcanoChamberWall(ctx, sx, sy, tw, th, seed, animT, edge) {
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, "#3e2723");
    g.addColorStop(0.45, "#4e342e");
    g.addColorStop(1, "#281815");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);
    ctx.fillStyle = `rgba(255,87,34,${0.14 + Math.sin(animT * 1.8 + seed * 0.03) * 0.08})`;
    if (edge === "top" || edge === "left") ctx.fillRect(sx + 2, sy + 2, tw - 4, 5);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, tw - 1, th - 1);
    if ((seed % 5) === 0) {
      ctx.fillStyle = "rgba(255,152,0,0.35)";
      ctx.beginPath();
      ctx.arc(sx + tw * 0.5, sy + th * 0.55, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDepthsChamberWall(ctx, sx, sy, tw, th, seed, animT) {
    const g = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    g.addColorStop(0, "#263238");
    g.addColorStop(0.5, "#1a2327");
    g.addColorStop(1, "#0d1214");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, tw, th);
    ctx.fillStyle = `rgba(129,199,132,${0.1 + Math.sin(animT * 1.4 + seed * 0.04) * 0.06})`;
    if ((seed % 4) === 0) {
      ctx.beginPath();
      ctx.moveTo(sx + tw * 0.2, sy + th);
      ctx.lineTo(sx + tw * 0.35, sy + th * 0.25);
      ctx.lineTo(sx + tw * 0.12, sy + th * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.strokeRect(sx + 0.5, sy + 0.5, tw - 1, th - 1);
  }

  function drawMagmaPillar(ctx, x, y, scale, animT) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    const pulse = Math.sin(animT * 2.2 + x * 0.01) * 2;
    drawSoftShadow(ctx, 0, 8, 22 * scale, 8 * scale);
    const g = ctx.createLinearGradient(-16 * scale, -40 * scale, 16 * scale, 0);
    g.addColorStop(0, "#6d4c41");
    g.addColorStop(0.55, "#4e342e");
    g.addColorStop(1, "#3e2723");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-18 * scale, 0);
    ctx.lineTo(-14 * scale, -42 * scale - pulse);
    ctx.lineTo(14 * scale, -44 * scale - pulse);
    ctx.lineTo(18 * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,87,34,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, -20 * scale - pulse * 0.5);
    ctx.lineTo(8 * scale, -32 * scale - pulse * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawDepthsStalactite(ctx, x, y, scale, animT) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    const drip = Math.sin(animT * 1.6 + y * 0.02) * 1.5;
    drawSoftShadow(ctx, 0, 6, 18 * scale, 6 * scale);
    const g = ctx.createLinearGradient(0, -48 * scale, 0, 0);
    g.addColorStop(0, "#78909c");
    g.addColorStop(0.45, "#546e7a");
    g.addColorStop(1, "#37474f");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-16 * scale, 0);
    ctx.lineTo(-8 * scale, -38 * scale + drip);
    ctx.lineTo(0, -52 * scale + drip);
    ctx.lineTo(10 * scale, -36 * scale + drip);
    ctx.lineTo(16 * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(129,212,250,0.55)";
    ctx.beginPath();
    ctx.arc(0, -50 * scale + drip, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAbyssPool(ctx, x, y, rx, ry, animT, seed) {
    ctx.save();
    ctx.translate(x, y);
    const bob = Math.sin(animT * 1.8 + seed) * 2;
    const g = ctx.createRadialGradient(-rx * 0.15, -ry * 0.2, 4, 0, bob, rx);
    g.addColorStop(0, "#80cbc4");
    g.addColorStop(0.35, "#00897b");
    g.addColorStop(0.7, "#004d40");
    g.addColorStop(1, "#00251a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, bob, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(129,212,250,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, bob - ry * 0.12, rx * 0.5, ry * 0.18, 0.15, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const ang = animT * 0.8 + seed + i * 2.1;
      const gx = Math.cos(ang) * rx * 0.35;
      const gy = Math.sin(ang) * ry * 0.25 + bob;
      ctx.fillStyle = "rgba(178,235,242,0.45)";
      ctx.beginPath();
      ctx.arc(gx, gy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = "600 9px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e0f7fa";
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 3;
    ctx.strokeText("Abyss Pool · Lv 35", 0, -ry - 12);
    ctx.fillText("Abyss Pool · Lv 35", 0, -ry - 12);
    ctx.restore();
  }

  function drawLavaPool(ctx, x, y, rx, ry, animT, seed) {
    ctx.save();
    ctx.translate(x, y);
    const bob = Math.sin(animT * 2.5 + seed) * 2;

    const g = ctx.createRadialGradient(-rx * 0.2, -ry * 0.25, 4, 0, bob, rx);
    g.addColorStop(0, "#ffeb3b");
    g.addColorStop(0.35, "#ff9800");
    g.addColorStop(0.7, "#e65100");
    g.addColorStop(1, "#bf360c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, bob, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, bob - ry * 0.15, rx * 0.55, ry * 0.22, 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.ellipse(-rx * 0.25, bob - ry * 0.2, rx * 0.18, ry * 0.1, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "600 9px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeText("Lava Pool · Lv 20", 0, -ry - 12);
    ctx.fillText("Lava Pool · Lv 20", 0, -ry - 12);
    ctx.restore();
  }

  window.FMSprites = {
    drawTrainer,
    drawWildFish,
    drawMythicFish,
    drawWorldTile,
    drawZoneSky,
    drawSoftShadow,
    drawBattleArena,
    drawPostFX,
    drawZonePortal,
    drawPortalRow,
    drawBlob,
    drawFishBody,
    drawOakTree,
    drawCaveGround,
    drawRockTree,
    drawOceanTile,
    drawIslandGrass,
    drawPondPatch,
    drawSandGround,
    drawCoralCluster,
    drawIceGround,
    drawIcePath,
    drawIcePondPatch,
    drawIceTree,
    drawDock,
    drawShopBuilding,
    drawVolcano,
    drawLavaRockGround,
    drawLavaVolcanoGround,
    drawLavaBridge,
    drawLavaBridgeSpan,
    drawCaveEntrance,
    drawVolcanicRock,
    drawVolcanoChamberWall,
    drawDepthsChamberWall,
    drawMagmaPillar,
    drawDepthsStalactite,
    drawCrystalCluster,
    drawAbyssPool,
    drawLavaPool,
    drawPalmTree,
    drawStormTree,
    drawHauntedTree,
    drawStormGround,
    drawWhiteWaterTile,
    drawFloatingVoid,
    drawHurricaneEye,
    drawHurricaneUnderclouds,
    drawLabel,
    shade,
  };
})();
