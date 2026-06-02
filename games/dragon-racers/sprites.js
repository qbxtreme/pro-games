(function () {
  "use strict";

  const SUN = { x: 0.78, y: 0.11 };

  function shade(color, amt) {
    if (color.startsWith("rgb") || color.startsWith("hsl")) return color;
    const n = parseInt(color.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    r = Math.max(0, Math.min(255, r + amt * 255));
    g = Math.max(0, Math.min(255, g + amt * 255));
    b = Math.max(0, Math.min(255, b + amt * 255));
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  function hashDragonId(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function getDragonPalette(type) {
    const h = hashDragonId(type || "ember") % 360;
    const wingH = (h + 28) % 360;
    return {
      body: `hsl(${h}, 48%, 28%)`,
      bodyHi: `hsl(${h}, 55%, 42%)`,
      wing: `hsl(${wingH}, 45%, 20%)`,
      membrane: `hsla(${h}, 50%, 50%, 0.38)`,
      belly: `hsl(${h}, 40%, 78%)`,
      horn: `hsl(${h}, 35%, 12%)`,
      flame: [
        `hsl(${h}, 65%, 92%)`,
        `hsl(${h}, 60%, 68%)`,
        `hsl(${h}, 55%, 48%)`,
        `hsl(${h}, 50%, 32%)`,
      ],
    };
  }

  function portraitGradient(id) {
    const p = getDragonPalette(id);
    return `linear-gradient(135deg, ${p.bodyHi}, ${p.body})`;
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
    sky.addColorStop(0, "#061428");
    sky.addColorStop(0.08, "#0c2a52");
    sky.addColorStop(0.22, "#1e5a96");
    sky.addColorStop(0.42, "#4a9ad4");
    sky.addColorStop(0.62, "#8ec8f0");
    sky.addColorStop(0.78, "#c5e4fa");
    sky.addColorStop(0.9, "#e8f4fc");
    sky.addColorStop(1, "#f5faff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const aurora = ctx.createLinearGradient(0, h * 0.15, w, h * 0.45);
    aurora.addColorStop(0, "rgba(120,200,255,0)");
    aurora.addColorStop(0.35, "rgba(100,180,255,0.06)");
    aurora.addColorStop(0.55, "rgba(180,130,255,0.05)");
    aurora.addColorStop(0.75, "rgba(255,180,120,0.04)");
    aurora.addColorStop(1, "rgba(120,200,255,0)");
    ctx.fillStyle = aurora;
    ctx.fillRect(0, 0, w, h);

    drawSunRays(ctx, sun.x, sun.y, w, h, animT, 0.55);
    drawSunDisc(ctx, sun.x, sun.y, 38);

    const flare = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 90);
    flare.addColorStop(0, "rgba(255,255,220,0.18)");
    flare.addColorStop(0.35, "rgba(255,220,120,0.06)");
    flare.addColorStop(1, "rgba(255,200,80,0)");
    ctx.fillStyle = flare;
    ctx.fillRect(sun.x - 100, sun.y - 100, 200, 200);

    const haze = ctx.createLinearGradient(0, h * 0.32, 0, h);
    haze.addColorStop(0, "rgba(220,235,250,0)");
    haze.addColorStop(0.5, "rgba(190,215,235,0.1)");
    haze.addColorStop(1, "rgba(160,190,210,0.22)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);

    for (let c = 0; c < 14; c++) {
      const drift = animT * (3.5 + c * 0.65) + c * 173;
      const parallax = 0.025 + (c % 4) * 0.012;
      const cx = ((c * 241 + scroll * parallax + drift) % (w + 380)) - 190;
      const cy = 18 + (c % 6) * 28 + Math.sin(animT * 0.25 + c * 1.3) * 6;
      const layer = c % 3;
      const cloudW = 80 + c * 9 + layer * 22;
      const alpha = 0.42 + layer * 0.2;
      drawRealisticCloud(ctx, cx, cy, cloudW, alpha, c * 17.3 + scroll * 0.001);
    }

    for (let i = 0; i < 45; i++) {
      const twinkle = 0.5 + Math.sin(animT * 2.5 + i * 1.7) * 0.5;
      const sx = (i * 131 + scroll * 0.012) % w;
      const sy = (i * 79 + hash(i) * h * 0.48) % (h * 0.58);
      const starR = 0.5 + (i % 4) * 0.35;
      ctx.fillStyle = `rgba(255,255,255,${(0.12 + (i % 5) * 0.05) * twinkle})`;
      ctx.beginPath();
      ctx.arc(sx, sy, starR, 0, Math.PI * 2);
      ctx.fill();
      if (i % 7 === 0) {
        ctx.strokeStyle = `rgba(200,230,255,${0.15 * twinkle})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - starR * 2.5, sy);
        ctx.lineTo(sx + starR * 2.5, sy);
        ctx.moveTo(sx, sy - starR * 2.5);
        ctx.lineTo(sx, sy + starR * 2.5);
        ctx.stroke();
      }
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
    const c = getDragonPalette(type);
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

    for (let s = 0; s < 8; s++) {
      const sx = -10 + s * 3.2;
      const sy = 6 + Math.sin(s * 1.1 + animT * 2) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${0.06 + (s % 2) * 0.04})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 2.2, 1.6, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const rim = ctx.createLinearGradient(-20, -10, 30, 20);
    rim.addColorStop(0, "rgba(255,240,200,0)");
    rim.addColorStop(0.55, "rgba(255,240,200,0)");
    rim.addColorStop(1, "rgba(255,230,180,0.22)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.ellipse(0, 2 + breathe * 0.3, 24, 17, 0.1, 0, Math.PI * 2);
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
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 10; i++) {
        const px = -34 - i * (6 + thrust * 5) - Math.sin(animT * 24 + i * 1.7) * 3;
        const py = 6 + (i % 3 - 1) * 5 + Math.cos(animT * 18 + i) * 2;
        const rad = (6 + i * 1.4) * thrust;
        const fg = ctx.createRadialGradient(px, py, 0, px, py, rad);
        fg.addColorStop(0, "#ffffff");
        fg.addColorStop(0.2, c.flame[0]);
        fg.addColorStop(0.45, c.flame[1]);
        fg.addColorStop(0.75, c.flame[2]);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.92 - i * 0.08;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
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
    const pulse = 1 + Math.sin(animT * 5) * 0.1;
    const rot = animT * 0.8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(pulse, pulse);

    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "rgba(171,71,188,0.75)";
    ctx.shadowBlur = 20;
    const facets = [
      [0, -16], [11, -4], [7, 12], [-7, 12], [-11, -4],
    ];
    const gemG = ctx.createLinearGradient(-12, -16, 12, 14);
    gemG.addColorStop(0, "#f3e5f5");
    gemG.addColorStop(0.25, "#ce93d8");
    gemG.addColorStop(0.55, "#ab47bc");
    gemG.addColorStop(0.8, "#7b1fa2");
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
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.moveTo(-3, -10);
    ctx.lineTo(5, -2);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRaceTrack(ctx, w, h, opts) {
    const course = opts.course;
    const distance = opts.distance || 0;
    const playerX = opts.playerX || w * 0.28;
    const cpuX = opts.cpuX || w * 0.72;
    const cpu = opts.cpu;
    const animT = opts.animT || 0;
    const markX = opts.markX;
    const finishAt = opts.finishAt || 1000;
    if (!course || !markX) return;

    ctx.save();

    const playerLane = ctx.createLinearGradient(0, 0, w * 0.5, 0);
    playerLane.addColorStop(0, "rgba(66,165,245,0.18)");
    playerLane.addColorStop(1, "rgba(66,165,245,0.06)");
    ctx.fillStyle = playerLane;
    ctx.fillRect(0, h * 0.12, w * 0.5, h * 0.76);

    const cpuLane = ctx.createLinearGradient(w * 0.5, 0, w, 0);
    cpuLane.addColorStop(0, "rgba(239,83,80,0.06)");
    cpuLane.addColorStop(1, "rgba(239,83,80,0.18)");
    ctx.fillStyle = cpuLane;
    ctx.fillRect(w * 0.5, h * 0.12, w * 0.5, h * 0.76);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 14]);
    ctx.lineDashOffset = -animT * 40;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.1);
    ctx.lineTo(w * 0.5, h * 0.9);
    ctx.stroke();
    ctx.setLineDash([]);

    function drawPath(laneX, getY, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 10]);
      ctx.lineDashOffset = -animT * 50;
      ctx.beginPath();
      let started = false;
      const startSx = markX(0, distance, laneX);
      ctx.moveTo(Math.max(8, Math.min(w - 8, startSx)), h * 0.5);
      course.hoops.forEach((hoop) => {
        const sx = markX(hoop.atDistance, distance, laneX);
        if (sx < -60 || sx > w + 60) return;
        if (!started) {
          ctx.moveTo(Math.max(8, Math.min(w - 8, startSx)), h * 0.5);
          started = true;
        }
        ctx.lineTo(sx, getY(hoop));
      });
      const finishSx = markX(finishAt, distance, laneX);
      if (finishSx <= w + 80) {
        if (!started) ctx.moveTo(Math.max(8, Math.min(w - 8, startSx)), h * 0.5);
        ctx.lineTo(finishSx, h * 0.5);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawPath(playerX, (hoop) => hoop.playerY, "rgba(255,213,79,0.65)");
    if (cpu && !cpu.dead) {
      drawPath(cpuX, (hoop) => hoop.cpuY, "rgba(255,138,128,0.55)");
    }

    for (let d = 100; d < finishAt; d += 100) {
      const sx = markX(d, distance, playerX);
      if (sx < 24 || sx > w - 24) continue;
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, h * 0.1);
      ctx.lineTo(sx, h * 0.9);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "700 11px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeText(d + "m", sx, h * 0.075);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(d + "m", sx, h * 0.075);
    }

    const finishSx = markX(finishAt, distance, playerX);
    if (finishSx > 30 && finishSx < w + 120) {
      ctx.fillStyle = "rgba(255,213,79,0.9)";
      ctx.font = "900 12px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 3;
      ctx.strokeText("FINISH " + finishAt + "m", finishSx, h * 0.055);
      ctx.fillText("FINISH " + finishAt + "m", finishSx, h * 0.055);
    }

    ctx.restore();
  }

  function drawNextHoopMarker(ctx, x, y, animT) {
    const bob = Math.sin(animT * 6) * 4;
    ctx.save();
    ctx.translate(x, y - 62 + bob);
    ctx.fillStyle = "rgba(255,213,79,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2;
    ctx.font = "900 12px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText("▼ NEXT", 0, 0);
    ctx.fillText("▼ NEXT", 0, 0);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-8, 18);
    ctx.lineTo(8, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRaceGate(ctx, x, h, kind, animT, screenW) {
    if (x < -120 || x > (screenW || 9999) + 120) return;
    ctx.save();
    ctx.translate(x, 0);
    const isFinish = kind === "finish";
    const poleW = 10;
    const archH = h * 0.14;

    const poleGrad = ctx.createLinearGradient(-poleW, 0, poleW, 0);
    poleGrad.addColorStop(0, "#37474f");
    poleGrad.addColorStop(0.5, "#78909c");
    poleGrad.addColorStop(1, "#263238");
    ctx.fillStyle = poleGrad;
    ctx.fillRect(-poleW - 6, 0, poleW, h);
    ctx.fillRect(6, 0, poleW, h);

    ctx.strokeStyle = isFinish ? "#ffd54f" : "#fff";
    ctx.lineWidth = 5;
    ctx.shadowColor = isFinish ? "rgba(255,213,79,0.6)" : "rgba(255,255,255,0.4)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-poleW - 6, archH);
    ctx.quadraticCurveTo(0, archH - 28, poleW + 6, archH);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const bannerY = archH + 6;
    const w = 14;
    const stripes = Math.ceil((h - bannerY) / 16);
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = (i + Math.floor(animT * 4)) % 2 === 0
        ? (isFinish ? "#ffd54f" : "#fff")
        : (isFinish ? "#f57c00" : "#111");
      ctx.fillRect(-w, bannerY + i * 16, w * 2, 16);
    }

    ctx.font = "900 14px system-ui,sans-serif";
    ctx.fillStyle = isFinish ? "#ffd54f" : "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    const label = isFinish ? "FINISH" : "START";
    ctx.strokeText(label, 0, archH - 8);
    ctx.fillText(label, 0, archH - 8);
    ctx.restore();
  }

  function drawHoop(ctx, x, y, passed, animT) {
    ctx.save();
    ctx.translate(x, y);
    const pulse = 1 + Math.sin(animT * 4) * 0.05;
    const spin = animT * 0.8;
    ctx.scale(pulse, pulse);

    if (!passed) {
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(0, 0, 20, 0, 0, 58);
      glow.addColorStop(0, "rgba(255,220,80,0.15)");
      glow.addColorStop(0.6, "rgba(255,180,40,0.08)");
      glow.addColorStop(1, "rgba(255,180,40,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.shadowColor = passed ? "rgba(102,187,106,0.6)" : "rgba(255,213,79,0.85)";
    ctx.shadowBlur = passed ? 12 : 26;

    const outerGrad = ctx.createLinearGradient(-44, -44, 44, 44);
    outerGrad.addColorStop(0, passed ? "#81c784" : "#ffe082");
    outerGrad.addColorStop(0.5, passed ? "#66bb6a" : "#ffb300");
    outerGrad.addColorStop(1, passed ? "#388e3c" : "#ff8f00");
    ctx.strokeStyle = outerGrad;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = passed ? "rgba(200,230,201,0.7)" : "rgba(255,255,255,0.65)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(spin * 0.12);
    ctx.strokeStyle = passed ? "rgba(165,214,167,0.4)" : "rgba(255,224,130,0.5)";
    ctx.lineWidth = 1.5;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, -36);
      ctx.lineTo(i * 5, 36);
      ctx.stroke();
    }
    ctx.restore();

    ctx.shadowBlur = 0;
    ctx.font = "800 11px system-ui,sans-serif";
    ctx.fillStyle = passed ? "#e8f5e9" : "#fff8e1";
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.textAlign = "center";
    const label = passed ? "✓" : "BOOST";
    ctx.strokeText(label, 0, 4);
    ctx.fillText(label, 0, 4);
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
        drawWindStreak(ctx, p.x, p.y, p.len, p.life * 0.4, p.wobble || 0);
      } else if (p.kind === "spark") {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * p.life * 2);
        g.addColorStop(0, `rgba(255,255,220,${p.life})`);
        g.addColorStop(0.4, `rgba(255,220,100,${p.life * 0.7})`);
        g.addColorStop(1, "rgba(255,180,60,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      } else if (p.kind === "flame") {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * p.life);
        g.addColorStop(0, `rgba(255,255,240,${p.life * 0.9})`);
        g.addColorStop(0.35, `rgba(255,200,80,${p.life * 0.6})`);
        g.addColorStop(1, "rgba(255,100,30,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      } else if (p.kind === "mist") {
        ctx.fillStyle = `rgba(200,220,240,${p.life * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawSpeedLines(ctx, w, h, speed, scroll, animT) {
    const intensity = Math.min(1, (speed - 180) / 320);
    if (intensity <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 24; i++) {
      const y = (i * 41 + scroll * 0.25 + animT * 40) % h;
      const x = w * 0.52 + (i % 6) * 28 + Math.sin(animT * 3 + i) * 8;
      const len = (50 + (i % 5) * 30) * intensity;
      const alpha = (0.35 + (i % 4) * 0.12) * intensity;
      const g = ctx.createLinearGradient(x, y, x - len, y);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(0.4, `rgba(200,230,255,${alpha * 0.5})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1 + (i % 3) * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - len, y + Math.sin(i + animT * 5) * 2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  function drawBoostOverlay(ctx, w, h, timer, animT) {
    const t = Math.min(1, timer / 2.5);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const edge = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.35, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    edge.addColorStop(0, "rgba(255,220,80,0)");
    edge.addColorStop(0.7, `rgba(255,200,60,${0.08 * t})`);
    edge.addColorStop(1, `rgba(255,180,40,${0.22 * t})`);
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 6; i++) {
      const ang = animT * 4 + (i / 6) * Math.PI * 2;
      const rx = w * 0.5 + Math.cos(ang) * w * 0.42;
      const ry = h * 0.5 + Math.sin(ang) * h * 0.35;
      const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, 40);
      rg.addColorStop(0, `rgba(255,240,150,${0.12 * t})`);
      rg.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(rx, ry, 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
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
    drawRaceTrack,
    drawNextHoopMarker,
    drawHoop,
    drawRaceGate,
    drawParticles,
    drawSpeedLines,
    drawBoostOverlay,
    getDragonPalette,
    portraitGradient,
  };
})();
