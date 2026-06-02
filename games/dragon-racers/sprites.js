(function () {
  "use strict";

  const SUN = { x: 0.78, y: 0.11 };

  function shade(hex, amt) {
    if (hex.startsWith("rgb")) return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    r = Math.max(0, Math.min(255, r + amt * 255));
    g = Math.max(0, Math.min(255, g + amt * 255));
    b = Math.max(0, Math.min(255, b + amt * 255));
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hash(n) {
    const x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function fbm(x, y, oct) {
    let v = 0;
    let a = 0.5;
    let fx = x;
    let fy = y;
    for (let i = 0; i < (oct || 4); i++) {
      v += a * (hash(fx + fy * 57.0) * 2 - 1);
      fx *= 2.02;
      fy *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  function sunPos(w, h) {
    return { x: w * SUN.x, y: h * SUN.y };
  }

  function drawSunDisc(ctx, x, y, r) {
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.2);
    glow.addColorStop(0, "rgba(255,248,220,0.55)");
    glow.addColorStop(0.25, "rgba(255,213,79,0.22)");
    glow.addColorStop(0.55, "rgba(255,152,0,0.08)");
    glow.addColorStop(1, "rgba(255,152,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 3.5, y - r * 3.5, r * 7, r * 7);

    const core = ctx.createRadialGradient(x - r * 0.15, y - r * 0.15, 0, x, y, r);
    core.addColorStop(0, "#fffde7");
    core.addColorStop(0.45, "#ffe082");
    core.addColorStop(0.85, "#ffb300");
    core.addColorStop(1, "rgba(255,143,0,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSunRays(ctx, x, y, w, h, animT, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(animT * 0.04);
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const len = Math.max(w, h) * 0.95;
      const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
      g.addColorStop(0, "rgba(255,235,150,0.14)");
      g.addColorStop(0.35, "rgba(255,200,80,0.05)");
      g.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang - 0.04) * len, Math.sin(ang - 0.04) * len);
      ctx.lineTo(Math.cos(ang + 0.04) * len, Math.sin(ang + 0.04) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRealisticCloud(ctx, cx, cy, cloudW, alpha, seed) {
    const puffs = 5 + Math.floor(hash(seed) * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let p = 0; p < puffs; p++) {
      const px = cx + (p - puffs * 0.5) * cloudW * 0.22 + (hash(seed + p) - 0.5) * 18;
      const py = cy + (hash(seed + p * 2) - 0.5) * 10;
      const rx = cloudW * (0.22 + hash(seed + p * 3) * 0.12);
      const ry = rx * (0.42 + hash(seed + p * 4) * 0.12);
      const g = ctx.createRadialGradient(px - rx * 0.2, py - ry * 0.25, 0, px, py, rx);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.55, "rgba(240,248,255,0.72)");
      g.addColorStop(1, "rgba(200,220,240,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSky(ctx, w, h, scroll, animT) {
    const sun = sunPos(w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#020814");
    sky.addColorStop(0.12, "#0a1f3d");
    sky.addColorStop(0.28, "#1a4a7a");
    sky.addColorStop(0.48, "#3d7ab8");
    sky.addColorStop(0.68, "#7eb8e8");
    sky.addColorStop(0.82, "#b8daf5");
    sky.addColorStop(0.92, "#dceefb");
    sky.addColorStop(1, "#eef6fc");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    drawSunRays(ctx, sun.x, sun.y, w, h, animT, 0.42);
    drawSunDisc(ctx, sun.x, sun.y, 34);

    const haze = ctx.createLinearGradient(0, h * 0.35, 0, h);
    haze.addColorStop(0, "rgba(220,235,250,0)");
    haze.addColorStop(0.55, "rgba(190,215,235,0.12)");
    haze.addColorStop(1, "rgba(160,190,210,0.28)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);

    for (let c = 0; c < 10; c++) {
      const drift = animT * (4 + c * 0.7) + c * 173;
      const cx = ((c * 241 + scroll * (0.03 + c * 0.008) + drift) % (w + 320)) - 160;
      const cy = 24 + (c % 5) * 34 + Math.sin(animT * 0.28 + c * 1.3) * 5;
      const layer = c % 3;
      const cloudW = 70 + c * 11 + layer * 18;
      const alpha = 0.35 + layer * 0.18;
      drawRealisticCloud(ctx, cx, cy, cloudW, alpha, c * 17.3 + scroll * 0.001);
    }

    for (let i = 0; i < 30; i++) {
      const sx = (i * 131 + scroll * 0.015) % w;
      const sy = (i * 79 + hash(i) * h * 0.45) % (h * 0.55);
      ctx.fillStyle = `rgba(255,255,255,${0.08 + (i % 4) * 0.04})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.6 + (i % 3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMountainRange(ctx, w, h, scroll, layer, animT) {
    const parallax = 0.08 + layer * 0.14;
    const baseY = h * (0.52 + layer * 0.08);
    const fog = 0.18 + layer * 0.22;
    const cols = [
      ["#1a3348", "#243d52", "#2f4f62"],
      ["#2d4a38", "#3d5c44", "#4a6b52"],
      ["#4a4035", "#5c5040", "#6d6150"],
    ][layer] || ["#334", "#445", "#556"];

    ctx.save();
    for (let i = -2; i < 10; i++) {
      const mw = 180 + layer * 40 + (i % 3) * 30;
      const mx = i * (mw * 0.72) - (scroll * parallax) % (mw * 0.72);
      const peak = baseY - (90 + layer * 35 + (i % 4) * 22 + hash(i + layer * 7) * 40);
      const col = cols[i % cols.length];

      const mg = ctx.createLinearGradient(mx, peak, mx + mw, baseY + 20);
      mg.addColorStop(0, shade(col, 0.12));
      mg.addColorStop(0.45, col);
      mg.addColorStop(1, shade(col, -0.22));
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.moveTo(mx, baseY + 30);
      const ridges = 4 + (i % 3);
      for (let r = 0; r <= ridges; r++) {
        const rx = mx + (mw / ridges) * r;
        const ry = r === Math.floor(ridges / 2)
          ? peak
          : baseY - 20 - hash(i * 10 + r + layer) * (50 + layer * 20);
        ctx.lineTo(rx, ry);
      }
      ctx.lineTo(mx + mw, baseY + 30);
      ctx.closePath();
      ctx.fill();

      if (layer === 2 && peak < baseY - 60) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(mx + mw * 0.42, peak + 8);
        ctx.lineTo(mx + mw * 0.5, peak - 4);
        ctx.lineTo(mx + mw * 0.58, peak + 10);
        ctx.lineTo(mx + mw * 0.52, peak + 18);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.fillStyle = `rgba(210,225,240,${fog})`;
    ctx.fillRect(0, baseY - 30, w, h - baseY + 60);
    ctx.restore();
  }

  function drawValley(ctx, w, h, scroll, animT) {
    const valleyY = h * 0.82;
    const waterY = h * 0.86;

    const ground = ctx.createLinearGradient(0, valleyY - 40, 0, h);
    ground.addColorStop(0, "#3d5c34");
    ground.addColorStop(0.35, "#2e4a28");
    ground.addColorStop(0.7, "#1e3318");
    ground.addColorStop(1, "#152610");
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, valleyY);
    for (let x = 0; x <= w; x += 24) {
      const wx = x + scroll * 0.45;
      const bump = Math.sin(wx * 0.012) * 14 + Math.sin(wx * 0.028 + 1) * 6;
      ctx.lineTo(x, valleyY + bump);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    const sun = sunPos(w, h);
    const water = ctx.createLinearGradient(0, waterY, 0, h);
    water.addColorStop(0, "rgba(120,180,220,0.55)");
    water.addColorStop(0.4, "rgba(60,120,170,0.65)");
    water.addColorStop(1, "rgba(20,50,80,0.85)");
    ctx.fillStyle = water;
    ctx.fillRect(0, waterY, w, h - waterY);

    for (let x = 0; x < w; x += 18) {
      const wx = x - (scroll * 0.55) % 36;
      const wave = Math.sin(wx * 0.08 + animT * 2.2) * 2.5 + Math.sin(wx * 0.15 - animT * 1.4) * 1.2;
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + Math.sin(wx * 0.05) * 0.03})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, waterY + 6 + wave);
      ctx.lineTo(x + 14, waterY + 6 + wave + Math.sin(wx * 0.1) * 1.5);
      ctx.stroke();
    }

    const refl = ctx.createRadialGradient(sun.x, waterY + 20, 0, sun.x, waterY + 20, 120);
    refl.addColorStop(0, "rgba(255,230,150,0.35)");
    refl.addColorStop(0.4, "rgba(255,200,100,0.12)");
    refl.addColorStop(1, "rgba(255,200,100,0)");
    ctx.fillStyle = refl;
    ctx.fillRect(0, waterY, w, h - waterY);

    for (let t = 0; t < 8; t++) {
      const tx = ((t * 140 - scroll * 0.5) % (w + 80)) - 40;
      const ty = valleyY + 8 + (t % 3) * 6;
      ctx.fillStyle = "#1b5e20";
      ctx.beginPath();
      ctx.moveTo(tx, ty + 24);
      ctx.lineTo(tx + 8, ty);
      ctx.lineTo(tx + 16, ty + 24);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawTerrain(ctx, w, h, scroll, animT) {
    drawMountainRange(ctx, w, h, scroll, 0, animT);
    drawMountainRange(ctx, w, h, scroll, 1, animT);
    drawMountainRange(ctx, w, h, scroll, 2, animT);
    drawValley(ctx, w, h, scroll, animT);
  }

  function drawWindStreak(ctx, x, y, len, alpha, wobble) {
    const g = ctx.createLinearGradient(x, y, x - len, y);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len, y + wobble);
    ctx.stroke();
  }

  function drawDragon(ctx, x, y, sc, facing, type, animT, opts) {
    opts = opts || {};
    const types = {
      ember: {
        body: "#8b2500",
        bodyHi: "#c0392b",
        wing: "#5d1a0a",
        membrane: "rgba(180,60,20,0.45)",
        belly: "#d4956a",
        horn: "#2c1810",
        flame: ["#fff3e0", "#ffb74d", "#e65100", "#bf360c"],
      },
      storm: {
        body: "#283593",
        bodyHi: "#3949ab",
        wing: "#1a237e",
        membrane: "rgba(100,130,220,0.4)",
        belly: "#9fa8da",
        horn: "#0d1642",
        flame: ["#e8eaf6", "#7986cb", "#5c6bc0", "#283593"],
      },
      frost: {
        body: "#01579b",
        bodyHi: "#0288d1",
        wing: "#004d73",
        membrane: "rgba(120,200,255,0.38)",
        belly: "#b3e5fc",
        horn: "#002f4f",
        flame: ["#e1f5fe", "#81d4fa", "#29b6f6", "#0277bd"],
      },
    };
    const c = types[type] || types.ember;
    const bank = opts.bank || 0;
    const flap = Math.sin(animT * 11) * 0.28;
    const breathe = Math.sin(animT * 3.5) * 1.5;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank * 0.35);
    ctx.scale(sc * facing, sc);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.filter = "blur(4px)";
    ctx.beginPath();
    ctx.ellipse(8, 34, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = "none";

    function wing(side) {
      const s = side;
      ctx.save();
      ctx.scale(s, 1);
      const wingGrad = ctx.createLinearGradient(0, -30, 0, 20);
      wingGrad.addColorStop(0, c.wing);
      wingGrad.addColorStop(0.5, shade(c.wing, 0.08));
      wingGrad.addColorStop(1, shade(c.body, -0.1));
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = shade(c.horn, 0.1);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 2);
      ctx.quadraticCurveTo(42, -28 + flap * 24, 58, 6 + flap * 14);
      ctx.quadraticCurveTo(38, 16, 14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = c.membrane;
      ctx.beginPath();
      ctx.moveTo(14, 6);
      ctx.quadraticCurveTo(36, -12 + flap * 16, 50, 8);
      ctx.quadraticCurveTo(32, 12, 14, 10);
      ctx.fill();
      ctx.restore();
    }

    wing(-1);
    wing(1);

    const bodyGrad = ctx.createLinearGradient(-20, -20, 24, 24);
    bodyGrad.addColorStop(0, c.bodyHi);
    bodyGrad.addColorStop(0.45, c.body);
    bodyGrad.addColorStop(1, shade(c.body, -0.25));
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = shade(c.horn, 0.15);
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.ellipse(0, 2 + breathe * 0.3, 24, 17, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const sx = -14 + i * 5.5;
      const sy = 4 + Math.sin(i * 0.8) * 2;
      ctx.fillStyle = i % 2 ? shade(c.body, -0.08) : shade(c.bodyHi, 0.05);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3.2, 2.4, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = c.belly;
    ctx.beginPath();
    ctx.ellipse(2, 8, 14, 11, 0.15, 0, Math.PI * 2);
    ctx.fill();

    const neckGrad = ctx.createLinearGradient(10, -8, 28, 4);
    neckGrad.addColorStop(0, c.bodyHi);
    neckGrad.addColorStop(1, c.body);
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.quadraticCurveTo(18, -8, 26, -4);
    ctx.quadraticCurveTo(22, 6, 10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = c.horn;
    ctx.beginPath();
    ctx.moveTo(22, -10);
    ctx.lineTo(26, -22);
    ctx.lineTo(28, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = c.bodyHi;
    ctx.beginPath();
    ctx.ellipse(28, -2, 9, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const eyeG = ctx.createRadialGradient(30, -5, 0, 31, -4, 4);
    eyeG.addColorStop(0, "#fffde7");
    eyeG.addColorStop(0.6, "#ffd54f");
    eyeG.addColorStop(1, "#ff6f00");
    ctx.fillStyle = eyeG;
    ctx.beginPath();
    ctx.ellipse(31, -4, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(32, -4, 2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(30.5, -5.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = c.body;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, 4);
    ctx.quadraticCurveTo(-38, 8 + Math.sin(animT * 8) * 4, -52, 16);
    ctx.stroke();

    if (opts.boost) {
      const thrust = opts.speed ? Math.min(1, opts.speed / 400) : 0.7;
      for (let i = 0; i < 7; i++) {
        const px = -34 - i * (7 + thrust * 4) - Math.sin(animT * 24 + i * 1.7) * 3;
        const py = 6 + (i % 3 - 1) * 5 + Math.cos(animT * 18 + i) * 2;
        const rad = (5 + i * 1.2) * thrust;
        const fg = ctx.createRadialGradient(px, py, 0, px, py, rad);
        fg.addColorStop(0, c.flame[0]);
        fg.addColorStop(0.35, c.flame[1]);
        fg.addColorStop(0.7, c.flame[2]);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.85 - i * 0.1;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (opts.invincible) {
      ctx.globalAlpha = 0.35 + Math.sin(animT * 18) * 0.2;
      ctx.strokeStyle = "#fff59d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 2, 34, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawObstacle(ctx, x, y, kind, animT, scroll) {
    ctx.save();
    ctx.translate(x, y);
    if (kind === "rock") {
      const rg = ctx.createLinearGradient(-20, -30, 24, 24);
      rg.addColorStop(0, "#8d6e63");
      rg.addColorStop(0.45, "#5d4037");
      rg.addColorStop(1, "#3e2723");
      ctx.fillStyle = rg;
      ctx.strokeStyle = "#2c1810";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-32, 22);
      ctx.lineTo(-18, -28);
      ctx.lineTo(8, -34);
      ctx.lineTo(28, -14);
      ctx.lineTo(34, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(-12, -20);
      ctx.lineTo(4, -26);
      ctx.lineTo(10, -12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(12, 4);
      ctx.stroke();
    } else {
      const sg = ctx.createLinearGradient(-12, -50, 12, 30);
      sg.addColorStop(0, "#90a4ae");
      sg.addColorStop(0.5, "#546e7a");
      sg.addColorStop(1, "#37474f");
      ctx.fillStyle = sg;
      ctx.strokeStyle = "#263238";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 32);
      ctx.lineTo(-12, -42);
      ctx.lineTo(0, -48);
      ctx.lineTo(12, -42);
      ctx.lineTo(10, 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const cg = ctx.createLinearGradient(0, -48, 0, -18);
      cg.addColorStop(0, "#ff8a65");
      cg.addColorStop(0.5, "#e64a19");
      cg.addColorStop(1, "#bf360c");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(-16, -22);
      ctx.lineTo(16, -22);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = "rgba(255,100,30,0.5)";
      ctx.shadowBlur = 12 + Math.sin(animT * 5) * 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawGem(ctx, x, y, animT) {
    const pulse = 1 + Math.sin(animT * 5) * 0.08;
    const rot = animT * 0.8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(pulse, pulse);

    ctx.shadowColor = "rgba(171,71,188,0.65)";
    ctx.shadowBlur = 16;
    const facets = [
      [0, -16], [11, -4], [7, 12], [-7, 12], [-11, -4],
    ];
    const gemG = ctx.createLinearGradient(-12, -16, 12, 14);
    gemG.addColorStop(0, "#e1bee7");
    gemG.addColorStop(0.35, "#ab47bc");
    gemG.addColorStop(0.7, "#6a1b9a");
    gemG.addColorStop(1, "#4a148c");
    ctx.fillStyle = gemG;
    ctx.strokeStyle = "#311b92";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(facets[0][0], facets[0][1]);
    facets.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(-3, -10);
    ctx.lineTo(5, -2);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRing(ctx, x, y, passed, animT) {
    ctx.save();
    ctx.translate(x, y);
    const rot = animT * 0.6;
    ctx.rotate(rot * 0.15);

    ctx.shadowColor = passed ? "rgba(102,187,106,0.4)" : "rgba(255,213,79,0.55)";
    ctx.shadowBlur = passed ? 8 : 18;

    const outer = ctx.createLinearGradient(-40, 0, 40, 0);
    outer.addColorStop(0, passed ? "#66bb6a" : "#ffb300");
    outer.addColorStop(0.5, passed ? "#a5d6a7" : "#ffe082");
    outer.addColorStop(1, passed ? "#43a047" : "#ff8f00");
    ctx.strokeStyle = outer;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 50, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = passed ? "rgba(200,230,201,0.5)" : "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawParticles(ctx, particles) {
    particles.forEach((p) => {
      if (p.kind === "wind") {
        drawWindStreak(ctx, p.x, p.y, p.len, p.life * 0.35, p.wobble || 0);
      } else if (p.kind === "spark") {
        ctx.fillStyle = `rgba(255,230,150,${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "mist") {
        ctx.fillStyle = `rgba(200,220,240,${p.life * 0.25})`;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawSpeedLines(ctx, w, h, speed, scroll, animT) {
    const intensity = Math.min(1, (speed - 200) / 350);
    if (intensity <= 0) return;
    ctx.save();
    ctx.globalAlpha = intensity * 0.22;
    for (let i = 0; i < 16; i++) {
      const y = (i * 47 + scroll * 0.2) % h;
      const x = w * 0.55 + (i % 5) * 30;
      const len = 40 + (i % 4) * 25;
      drawWindStreak(ctx, x, y, len, 0.5 + (i % 3) * 0.15);
    }
    ctx.restore();
  }

  window.DRSprites = {
    sunPos,
    drawSky,
    drawTerrain,
    drawDragon,
    drawObstacle,
    drawGem,
    drawRing,
    drawParticles,
    drawSpeedLines,
  };
})();
