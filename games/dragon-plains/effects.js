// Visual effects — particles, lighting, terrain realism

const particles = [];
let ambientTimer = 0;

const SKY_PALETTES = {
  plains: { zenith: "#0c3d6e", mid: "#4a90c2", horizon: "#b8d4ec", haze: "#e8dcc8", sun: 0.48 },
  forest: { zenith: "#1a3d2a", mid: "#3d7a52", horizon: "#8fb896", haze: "#c5d4bc", sun: 0.28 },
  ocean: { zenith: "#0a4a7a", mid: "#3d8fd1", horizon: "#a8d4f0", haze: "#f0e8d0", sun: 0.52 },
  volcano: { zenith: "#4a1808", mid: "#c45a28", horizon: "#f0a060", haze: "#f8dcc0", sun: 0.22 },
  sky: { zenith: "#0d47a1", mid: "#5eb3f6", horizon: "#cce8ff", haze: "#f5f8ff", sun: 0.55 },
  cave: { zenith: "#0a0e12", mid: "#1e2830", horizon: "#3a4550", haze: "#4a5560", sun: 0.04 },
  hub: { zenith: "#2a1850", mid: "#6a48a0", horizon: "#b898d8", haze: "#e8dff0", sun: 0.3 },
  ice: { zenith: "#5a8aa8", mid: "#a8cce8", horizon: "#e8f4ff", haze: "#ffffff", sun: 0.5 },
  hurricane: { zenith: "#283848", mid: "#607888", horizon: "#98a8b8", haze: "#c8d0d8", sun: 0.15 },
  madgreen: { zenith: "#1a4010", mid: "#488828", horizon: "#98d060", haze: "#d0e8a8", sun: 0.25 },
  lavazone: { zenith: "#601008", mid: "#d04018", horizon: "#f89050", haze: "#ffd8b0", sun: 0.18 },
};

function terrainHash(col, row, salt) {
  const n = Math.sin(col * 127.1 + row * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function darkenColor(color, amt) {
  if (typeof color === "string" && color.startsWith("rgb")) {
    const m = color.match(/\d+/g);
    if (m) {
      return `rgb(${Math.max(0, +m[0] - amt)},${Math.max(0, +m[1] - amt)},${Math.max(0, +m[2] - amt)})`;
    }
  }
  if (typeof color === "string" && color.startsWith("#")) {
    const n = parseInt(color.slice(1), 16);
    let r = (n >> 16) - amt;
    let g = ((n >> 8) & 255) - amt;
    let b = (n & 255) - amt;
    return `rgb(${Math.max(0, r)},${Math.max(0, g)},${Math.max(0, b)})`;
  }
  return color;
}

function spawnParticle(x, y, opts = {}) {
  const life = opts.life ?? 0.6 + Math.random() * 0.4;
  particles.push({
    x, y,
    vx: opts.vx ?? (Math.random() - 0.5) * 2,
    vy: opts.vy ?? (-1 - Math.random() * 2),
    life,
    maxLife: life,
    size: opts.size ?? 2 + Math.random() * 3,
    color: opts.color ?? "rgba(255,255,255,0.6)",
    gravity: opts.gravity ?? 0,
    spin: opts.spin ?? 0,
    rot: opts.rot ?? 0,
    shape: opts.shape ?? "circle",
  });
}

function spawnWalkDust(wx, wy, biome) {
  const colors = {
    sand: "rgba(210,180,120,0.5)",
    cave: "rgba(120,110,100,0.4)",
    ice: "rgba(200,230,255,0.45)",
    volcano: "rgba(180,90,60,0.4)",
    lavazone: "rgba(180,90,60,0.4)",
  };
  const color = colors[biome] || "rgba(160,150,120,0.42)";
  for (let i = 0; i < 3; i++) {
    spawnParticle(wx * TILE + (Math.random() - 0.5) * 14, wy * TILE + 10, {
      vx: (Math.random() - 0.5) * 1.8,
      vy: -0.8 - Math.random() * 1.2,
      life: 0.4,
      size: 2 + Math.random() * 3,
      color,
      gravity: 0.025,
    });
  }
}

function spawnAggroRing(wx, wy) {
  for (let i = 0; i < 3; i++) {
    spawnParticle(wx * TILE, wy * TILE - 10, {
      vx: (Math.random() - 0.5) * 2,
      vy: -1.5 - Math.random(),
      life: 0.45,
      size: 3 + Math.random() * 2,
      color: "rgba(239,83,80,0.75)",
    });
  }
}

function spawnAmbientForBiome(biome, camX, camY, w, h) {
  const sx = camX + Math.random() * w;
  const sy = camY + Math.random() * h * 0.85;
  const presets = {
    forest: { color: "rgba(102,187,106,0.7)", vx: 0.3, vy: 0.5, size: 3, shape: "leaf", life: 2.5 },
    volcano: { color: "rgba(255,152,0,0.8)", vx: 0, vy: -1.2, size: 2, life: 1.2, gravity: -0.01 },
    lavazone: { color: "rgba(255,87,34,0.85)", vx: 0.5, vy: -1.5, size: 2.5, life: 1.4 },
    ice: { color: "rgba(255,255,255,0.85)", vx: 0.8, vy: 1.2, size: 2, life: 3, gravity: 0.01 },
    hurricane: { color: "rgba(176,190,197,0.6)", vx: 2.5, vy: 0.3, size: 4, life: 1.8 },
    cave: { color: "rgba(255,236,179,0.25)", vx: 0.1, vy: -0.2, size: 1.5, life: 2 },
    madgreen: { color: "rgba(204,255,144,0.65)", vx: 0.4, vy: -0.3, size: 2, life: 1.6 },
    plains: { color: "rgba(255,241,118,0.55)", vx: 0.6, vy: -0.4, size: 2, life: 2, shape: "pollen" },
  };
  const p = presets[biome];
  if (!p) return;
  spawnParticle(sx, sy, p);
}

function updateAmbientBiome(biome, dt, camX, camY, w, h) {
  ambientTimer -= dt;
  if (ambientTimer > 0) return;
  ambientTimer = 0.12 + Math.random() * 0.25;
  if (Math.random() < 0.65) spawnAmbientForBiome(biome, camX, camY, w, h);
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.vx *= 0.97;
    p.vy += p.gravity || 0;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.spin || 0;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticleShape(ctx, p) {
  const alpha = Math.max(0, p.life / p.maxLife);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  if (p.shape === "leaf") {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (p.shape === "pollen") {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife + 0.3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx) {
  particles.forEach((p) => drawParticleShape(ctx, p));
  ctx.globalAlpha = 1;
}

function drawDynamicSky(ctx, w, h, biome, tick, camX) {
  const pal = SKY_PALETTES[biome] || SKY_PALETTES.plains;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
  sky.addColorStop(0, pal.zenith);
  sky.addColorStop(0.3, pal.mid);
  sky.addColorStop(0.65, pal.horizon);
  sky.addColorStop(1, pal.haze);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const atmos = ctx.createLinearGradient(0, h * 0.35, 0, h);
  atmos.addColorStop(0, "rgba(255,255,255,0)");
  atmos.addColorStop(0.5, `rgba(255,248,235,${0.06 + pal.sun * 0.04})`);
  atmos.addColorStop(1, `rgba(210,195,170,${0.18 + pal.sun * 0.06})`);
  ctx.fillStyle = atmos;
  ctx.fillRect(0, h * 0.3, w, h * 0.7);

  if (pal.sun > 0.08) {
    const sunX = w * 0.78 - (camX || 0) * 0.015;
    const sunY = h * 0.11 + Math.sin(tick * 0.2) * 1.5;

    const corona = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 120);
    corona.addColorStop(0, `rgba(255,252,230,${pal.sun * 0.9})`);
    corona.addColorStop(0.15, `rgba(255,230,150,${pal.sun * 0.5})`);
    corona.addColorStop(0.45, `rgba(255,200,100,${pal.sun * 0.15})`);
    corona.addColorStop(1, "rgba(255,200,100,0)");
    ctx.fillStyle = corona;
    ctx.fillRect(sunX - 130, sunY - 130, 260, 260);

    ctx.fillStyle = "rgba(255,255,245,0.98)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(sunX - 5, sunY - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(sunX - 28, sunY + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sunX + 20, sunY - 14, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSunRays(ctx, w, h, pal.sun * 1.2);
  drawHorizonMountains(ctx, w, h, biome, tick, camX);
  drawParallaxClouds(ctx, w, h, tick, camX);

  const haze = ctx.createLinearGradient(0, h * 0.5, 0, h);
  haze.addColorStop(0, "rgba(255,255,255,0)");
  haze.addColorStop(0.4, `rgba(240,235,225,${0.05 + pal.sun * 0.04})`);
  haze.addColorStop(1, `rgba(180,175,165,${0.2 + pal.sun * 0.06})`);
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);

  if (biome === "cave" || pal.sun < 0.1) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137 + Math.floor(tick * 8)) % w;
      const sy = (i * 89) % (h * 0.6);
      ctx.globalAlpha = 0.1 + (i % 4) * 0.06;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.4 + (i % 3) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (typeof drawLensFlare === "function") drawLensFlare(ctx, w, h, pal.sun);
}

function drawHorizonMountains(ctx, w, h, biome, tick, camX) {
  if (biome === "cave" || biome === "hub") return;
  const baseY = h * 0.58;
  const parallax = (camX || 0) * 0.02;
  const colors = {
    plains: ["#4a6741", "#3d5638", "#2e4230"],
    forest: ["#2d4a28", "#1e3218", "#142410"],
    ocean: ["#6a8a98", "#4a6878", "#3a5060"],
    volcano: ["#5a3830", "#3a2018", "#281008"],
    lavazone: ["#6a3020", "#4a1810", "#300808"],
    ice: ["#8aaccc", "#6a8aaa", "#4a6888"],
    sky: ["#5a90b0", "#407898", "#285878"],
    hurricane: ["#4a5868", "#384858", "#283038"],
    madgreen: ["#3a6820", "#284810", "#183008"],
  };
  const c = colors[biome] || colors.plains;
  for (let layer = 0; layer < 3; layer++) {
    const y = baseY + layer * 18;
    const offset = parallax * (1 + layer * 0.4);
    ctx.fillStyle = c[layer];
    ctx.beginPath();
    ctx.moveTo(-50 - offset, h);
    for (let i = 0; i <= 12; i++) {
      const px = (i / 12) * (w + 100) - 50 - offset;
      const peak = Math.sin(i * 1.7 + layer * 2.1 + tick * 0.01) * (28 - layer * 6)
        + Math.cos(i * 0.9 + layer) * (18 - layer * 4);
      ctx.lineTo(px, y - peak);
    }
    ctx.lineTo(w + 50, h);
    ctx.closePath();
    ctx.fill();
  }
  const haze = ctx.createLinearGradient(0, baseY - 40, 0, h);
  haze.addColorStop(0, "rgba(255,255,255,0)");
  haze.addColorStop(0.4, "rgba(240,235,225,0.08)");
  haze.addColorStop(1, "rgba(200,195,185,0.18)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, baseY - 50, w, h - baseY + 50);
}

function drawParallaxClouds(ctx, w, h, tick, camX = 0) {
  ctx.save();
  for (let layer = 0; layer < 7; layer++) {
    const depth = 1 + layer * 0.35;
    const speed = (6 + layer * 3) / depth;
    const x = ((tick * speed + layer * 180 - camX * 0.04 / depth) % (w + 260)) - 130;
    const y = 24 + layer * 22 + Math.sin(tick * 0.4 + layer) * 3;
    const cw = 90 + layer * 18;
    const alpha = 0.48 - layer * 0.05;

    const cloudGrd = ctx.createRadialGradient(x + cw * 0.3, y - 4, 4, x + cw * 0.3, y, cw * 0.45);
    cloudGrd.addColorStop(0, `rgba(255,255,255,${alpha})`);
    cloudGrd.addColorStop(0.6, `rgba(240,248,255,${alpha * 0.85})`);
    cloudGrd.addColorStop(1, `rgba(200,220,240,${alpha * 0.3})`);
    ctx.fillStyle = cloudGrd;
    ctx.beginPath();
    ctx.arc(x, y, cw * 0.32, 0, Math.PI * 2);
    ctx.arc(x + cw * 0.28, y - 10, cw * 0.26, 0, Math.PI * 2);
    ctx.arc(x + cw * 0.52, y + 2, cw * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(180,200,220,${alpha * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(x + cw * 0.35, y + 8, cw * 0.38, cw * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSunRays(ctx, w, h, intensity = 0.35) {
  ctx.save();
  const grd = ctx.createRadialGradient(w * 0.85, h * 0.08, 0, w * 0.85, h * 0.08, w * 0.65);
  grd.addColorStop(0, `rgba(255,236,179,${intensity})`);
  grd.addColorStop(0.35, `rgba(255,236,179,${intensity * 0.25})`);
  grd.addColorStop(1, "rgba(255,236,179,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawIsoBlock(ctx, x, y, color, height) {
  const h = height || 8;
  const topY = y + Math.floor(h * 0.22);
  const faceH = TILE - h;

  ctx.fillStyle = darkenColor(color, 48);
  ctx.beginPath();
  ctx.moveTo(x, y + TILE);
  ctx.lineTo(x + TILE, y + TILE);
  ctx.lineTo(x + TILE, topY + faceH);
  ctx.lineTo(x, topY + faceH);
  ctx.fill();

  ctx.fillStyle = darkenColor(color, 28);
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x + 8, topY - 4);
  ctx.lineTo(x + TILE - 2, topY - 4);
  ctx.lineTo(x + TILE - 6, topY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = darkenColor(color, 22);
  ctx.fillRect(x + TILE - 7, topY - 3, 7, faceH + 3);

  ctx.fillStyle = color;
  ctx.fillRect(x, topY, TILE - 7, faceH);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 3, topY + 2, TILE - 14, 5);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(x + 5, topY + 10, TILE - 18, 3);

  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(x + 4, topY + faceH - 4, TILE - 12, 2);

  const lightGrd = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
  lightGrd.addColorStop(0, "rgba(255,255,255,0.12)");
  lightGrd.addColorStop(0.45, "rgba(255,255,255,0)");
  lightGrd.addColorStop(1, "rgba(0,0,0,0.06)");
  ctx.fillStyle = lightGrd;
  ctx.fillRect(x, topY, TILE - 7, faceH);
}

function drawLensFlare(ctx, w, h, intensity) {
  if (intensity < 0.12) return;
  const sx = w * 0.78;
  const sy = h * 0.11;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const streak = ctx.createLinearGradient(sx - w * 0.4, sy, sx + w * 0.15, sy);
  streak.addColorStop(0, "rgba(255,240,200,0)");
  streak.addColorStop(0.45, `rgba(255,230,160,${intensity * 0.08})`);
  streak.addColorStop(0.72, `rgba(255,255,240,${intensity * 0.14})`);
  streak.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = streak;
  ctx.fillRect(sx - w * 0.45, sy - 2, w * 0.65, 4);
  for (let i = 0; i < 5; i++) {
    const ox = sx + (i - 2) * 38;
    const oy = sy + (i % 2 ? 6 : -4);
    const g = ctx.createRadialGradient(ox, oy, 1, ox, oy, 12 + i * 4);
    g.addColorStop(0, `rgba(255,255,255,${intensity * 0.25})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ox, oy, 12 + i * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLightShafts(ctx, w, h, biome, tick) {
  if (biome === "cave" || biome === "hub" || biome === "hurricane") return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const sunX = w * 0.82;
  const alpha = biome === "forest" ? 0.06 : biome === "volcano" || biome === "lavazone" ? 0.04 : 0.08;
  for (let i = 0; i < 4; i++) {
    const spread = 0.12 + i * 0.06;
    const x0 = sunX - w * spread;
    const x1 = sunX + w * (spread * 0.3);
    const grd = ctx.createLinearGradient(x0, 0, x1, h);
    grd.addColorStop(0, `rgba(255,248,220,${alpha})`);
    grd.addColorStop(0.35, `rgba(255,240,200,${alpha * 0.5})`);
    grd.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(x0 + Math.sin(tick * 0.3 + i) * 8, 0);
    ctx.lineTo(x1 + Math.sin(tick * 0.25 + i + 1) * 12, 0);
    ctx.lineTo(x1 + w * 0.08 + Math.sin(tick * 0.2 + i) * 20, h);
    ctx.lineTo(x0 - w * 0.04 + Math.sin(tick * 0.35 + i) * 15, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawChromaticAberration(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(255,80,80,0.012)";
  ctx.fillRect(1, 0, w, h);
  ctx.fillStyle = "rgba(80,140,255,0.012)";
  ctx.fillRect(-1, 0, w, h);
  ctx.restore();
}

function drawWildflowerDecal(ctx, x, y, col, row, tick) {
  const seed = col * 23 + row * 41;
  if (seed % 9 !== 0) return;
  const fx = x + 8 + (seed % 28);
  const fy = y + 10 + (seed % 24);
  const sway = Math.sin(tick * 2 + col) * 1.5;
  const colors = ["#e53935", "#ffeb3b", "#ab47bc", "#42a5f5", "#ff7043"];
  const petal = colors[seed % colors.length];
  ctx.strokeStyle = "#33691e";
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fx, y + TILE - 6);
  ctx.quadraticCurveTo(fx + sway, fy + 4, fx + sway * 0.5, fy - 8);
  ctx.stroke();
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * Math.PI * 2 + tick * 0.02;
    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.ellipse(fx + Math.cos(a) * 4, fy - 8 + Math.sin(a) * 4, 3, 2, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffeb3b";
  ctx.beginPath();
  ctx.arc(fx, fy - 8, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawDirectionalTileLight(ctx, x, y, col, row, biome) {
  if (biome === "cave") return;
  const sunGrd = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
  sunGrd.addColorStop(0, "rgba(255,248,220,0.2)");
  sunGrd.addColorStop(0.4, "rgba(255,255,255,0.04)");
  sunGrd.addColorStop(0.75, "rgba(0,0,0,0)");
  sunGrd.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = sunGrd;
  ctx.fillRect(x, y, TILE, TILE);
}

function drawGrassTileDetails(ctx, x, y, col, row, tick) {
  const seed = col * 23 + row * 41;
  if (seed % 11 === 0) {
    ctx.fillStyle = "#ffb74d";
    ctx.beginPath();
    ctx.arc(x + 10 + (seed % 20), y + 14 + (seed % 16), 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff176";
    ctx.beginPath();
    ctx.arc(x + 10 + (seed % 20), y + 13 + (seed % 16), 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (seed % 17 === 0) {
    ctx.fillStyle = "rgba(120,120,120,0.35)";
    ctx.beginPath();
    ctx.ellipse(x + 22 + (seed % 8), y + TILE - 8, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRealisticLavaTile(ctx, x, y, col, row, tick) {
  const pulse = Math.sin(tick * 3 + col * 0.4 + row * 0.3);
  const base = ctx.createLinearGradient(x, y, x, y + TILE);
  base.addColorStop(0, `hsl(${12 + pulse * 4}, 85%, 42%)`);
  base.addColorStop(0.5, `hsl(${8 + pulse * 3}, 90%, 35%)`);
  base.addColorStop(1, "#3e2723");
  ctx.fillStyle = base;
  ctx.fillRect(x, y, TILE, TILE);

  ctx.fillStyle = `rgba(255,193,7,${0.35 + pulse * 0.15})`;
  ctx.beginPath();
  ctx.ellipse(x + TILE / 2, y + TILE / 2, TILE * 0.28, TILE * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,87,34,${0.5 + Math.sin(tick * 5 + x) * 0.2})`;
  for (let i = 0; i < 3; i++) {
    const lx = x + 8 + i * 12 + Math.sin(tick * 2 + i + col) * 2;
    const ly = y + 10 + i * 8 + Math.cos(tick * 1.5 + row) * 2;
    ctx.beginPath();
    ctx.arc(lx, ly, 3 + i, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(x + 4, y + 6 + pulse * 2, TILE - 8, 3);
}

function drawGrassTufts(ctx, x, y, col, row, tick) {
  const seed = col * 17 + row * 31;
  for (let i = 0; i < 8; i++) {
    const gx = x + 4 + ((seed + i * 7) % (TILE - 8));
    const gy = y + TILE - 9;
    const sway = Math.sin(tick * 2.5 + col + i) * 2.5;
    const gh = 5 + ((seed + i * 3) % 7);
    const hue = i % 3;
    ctx.strokeStyle = hue === 0 ? "#558b2f" : hue === 1 ? "#689f38" : "#7cb342";
    ctx.lineWidth = 1.2 + (i % 2) * 0.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + sway, gy - gh * 0.55, gx + sway * 0.4, gy - gh);
    ctx.stroke();
  }
}

function drawSandTexture(ctx, x, y, col, row) {
  const seed = col * 13 + row * 29;
  for (let i = 0; i < 12; i++) {
    const px = x + 3 + ((seed + i * 11) % (TILE - 6));
    const py = y + 6 + ((seed + i * 19) % (TILE - 12));
    ctx.fillStyle = i % 2 ? "rgba(255,204,128,0.4)" : "rgba(230,160,80,0.25)";
    ctx.fillRect(px, py, 2, 2);
  }
  if (seed % 5 === 0) {
    ctx.strokeStyle = "rgba(210,180,140,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2, 8 + (seed % 6), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRealisticWater(ctx, x, y, col, row, tick, isShore) {
  const wave1 = Math.sin(tick * 2.8 + col * 0.55 + row * 0.35) * 3;
  const wave2 = Math.sin(tick * 1.6 + col * 0.3 - row * 0.2) * 2;
  const depth = isShore ? 0.55 : 0.85 + terrainHash(col, row, 3) * 0.15;

  ctx.fillStyle = "#021428";
  ctx.fillRect(x, y, TILE, TILE);

  const deep = ctx.createLinearGradient(x, y, x, y + TILE);
  deep.addColorStop(0, `rgba(${Math.floor(20 + depth * 30)},${Math.floor(80 + depth * 60)},${Math.floor(140 + depth * 40)},1)`);
  deep.addColorStop(0.3, `rgba(10,${Math.floor(60 + depth * 40)},${Math.floor(120 + depth * 30)},1)`);
  deep.addColorStop(0.7, "#0a2858");
  deep.addColorStop(1, "#020818");
  ctx.fillStyle = deep;
  ctx.fillRect(x, y + 1, TILE, TILE - 2);

  const skyReflect = ctx.createLinearGradient(x, y, x, y + TILE * 0.45);
  skyReflect.addColorStop(0, `rgba(135,190,230,${0.15 + Math.sin(tick * 1.5 + col) * 0.05})`);
  skyReflect.addColorStop(1, "rgba(135,190,230,0)");
  ctx.fillStyle = skyReflect;
  ctx.fillRect(x + 1, y + 2, TILE - 2, TILE * 0.4);

  for (let c = 0; c < 4; c++) {
    const cx = x + 6 + c * 9 + Math.sin(tick * 2.2 + col + c) * 2.5;
    const cy = y + 10 + c * 7 + Math.cos(tick * 1.8 + row + c) * 2;
    ctx.fillStyle = `rgba(200,235,255,${0.05 + Math.sin(tick * 3 + c) * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 6 + c * 0.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = `rgba(255,255,255,${0.12 + Math.sin(tick * 3 + col) * 0.06})`;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 14 + wave1);
  ctx.quadraticCurveTo(x + TILE / 2, y + 7 + wave2, x + TILE - 2, y + 15 - wave1);
  ctx.lineTo(x + TILE - 2, y + 22 - wave1);
  ctx.quadraticCurveTo(x + TILE / 2, y + 13 + wave2, x + 2, y + 19 + wave1);
  ctx.fill();

  ctx.strokeStyle = `rgba(255,255,255,${0.06 + Math.sin(tick * 2.5 + row) * 0.03})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 18 + wave1 * 0.5);
  ctx.quadraticCurveTo(x + TILE / 2, y + 12 + wave2, x + TILE - 4, y + 20 - wave1 * 0.5);
  ctx.stroke();

  ctx.fillStyle = `rgba(180,230,255,${0.1 + Math.sin(tick * 4 + row) * 0.05})`;
  ctx.fillRect(x + 5, y + 26 - wave2, TILE - 10, 3);

  if (isShore) {
    ctx.fillStyle = "rgba(238,220,190,0.25)";
    ctx.fillRect(x + 1, y + TILE - 6, TILE - 2, 5);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    for (let i = 0; i < 5; i++) {
      const fx = x + 6 + i * 8 + Math.sin(tick * 3 + i) * 2;
      ctx.beginPath();
      ctx.ellipse(fx, y + TILE - 3 + Math.sin(tick * 2 + i) * 1.5, 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 6; i++) {
    const cx = x + 4 + (terrainHash(col, row, i + 80) * (TILE - 8));
    const cy = y + 6 + (terrainHash(col, row, i + 90) * (TILE - 12));
    const ca = 0.04 + Math.sin(tick * 2.5 + i + col) * 0.025;
    ctx.fillStyle = `rgba(180,240,255,${ca})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 2 + i * 0.3, 1 + i * 0.2, tick * 0.5 + i, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTerrainMicroTexture(ctx, x, y, col, row, cell, biome) {
  const seed = col * 23 + row * 41;
  if (cell === "grass" || cell === "ground") {
    for (let i = 0; i < 24; i++) {
      const h = terrainHash(col, row, i);
      const px = x + 2 + (h * (TILE - 4));
      const py = y + 2 + (terrainHash(col, row, i + 50) * (TILE - 4));
      const g = Math.floor(80 + h * 60 + (biome === "forest" ? -15 : 0));
      ctx.fillStyle = `rgba(${Math.floor(g * 0.6)},${g},${Math.floor(g * 0.35)},${0.15 + h * 0.2})`;
      ctx.fillRect(px, py, 1 + (i % 2), 1 + (i % 3));
    }
    if (seed % 13 === 0) {
      ctx.fillStyle = "rgba(90,60,30,0.2)";
      ctx.beginPath();
      ctx.ellipse(x + 12 + (seed % 20), y + TILE - 6, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (cell === "sand") {
    for (let i = 0; i < 14; i++) {
      const h = terrainHash(col, row, i + 20);
      ctx.fillStyle = `rgba(255,${Math.floor(210 + h * 30)},${Math.floor(140 + h * 40)},${0.2 + h * 0.15})`;
      ctx.fillRect(x + 2 + h * (TILE - 4), y + 2 + terrainHash(col, row, i + 70) * (TILE - 4), 1, 1);
    }
  }
}

function drawTileAmbientOcclusion(ctx, x, y, row, col, grid) {
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(x, y + TILE - 2, TILE, 2);
  const neighbors = [
    [0, -1, x, y, x, y, x + TILE, y + 2],
    [0, 1, x, y + TILE - 2, x, y + TILE, x + TILE, y + TILE],
    [-1, 0, x, y, x + 2, y, x, y + TILE],
    [1, 0, x + TILE - 2, y, x + TILE, y, x + TILE, y + TILE],
  ];
  neighbors.forEach(([dr, dc, x0, y0, x1, y1, x2, y2]) => {
    const cell = grid[row + dr]?.[col + dc];
    if (cell && cell !== "water" && cell !== "void" && cell !== "lava") {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawScreenDistanceFog(ctx, w, h, playerScreenX, playerScreenY, biome) {
  const fogColor = biome === "forest" ? "140,160,130"
    : biome === "ocean" ? "120,160,200"
    : biome === "volcano" || biome === "lavazone" ? "180,120,80"
    : biome === "cave" ? "30,35,40"
    : biome === "ice" ? "200,220,240"
    : "160,175,190";
  const grd = ctx.createRadialGradient(
    playerScreenX, playerScreenY, Math.min(w, h) * 0.12,
    playerScreenX, playerScreenY, Math.max(w, h) * 0.72
  );
  grd.addColorStop(0, `rgba(${fogColor},0)`);
  grd.addColorStop(0.45, `rgba(${fogColor},0)`);
  grd.addColorStop(0.75, `rgba(${fogColor},0.18)`);
  grd.addColorStop(1, `rgba(${fogColor},0.52)`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
}

function drawFilmGrain(ctx, w, h, tick) {
  for (let i = 0; i < 280; i++) {
    const gx = (i * 173 + Math.floor(tick * 60)) % w;
    const gy = (i * 97 + Math.floor(tick * 40)) % h;
    ctx.fillStyle = `rgba(255,255,255,${0.014 + (i % 4) * 0.008})`;
    ctx.fillRect(gx, gy, 1, 1);
    if (i % 3 === 0) {
      ctx.fillStyle = `rgba(0,0,0,${0.01 + (i % 2) * 0.007})`;
      ctx.fillRect((gx + 5) % w, (gy + 2) % h, 1, 1);
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  ctx.fillRect(0, 0, w, h * 0.08);
}

function drawBiomeTileOverlay(ctx, biome, x, y, tick, col, row) {
  if (biome === "cave") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, TILE, TILE);
    if ((col + row) % 7 === 0) {
      ctx.fillStyle = "rgba(255,236,179,0.06)";
      ctx.fillRect(x + TILE / 2 - 2, y, 4, TILE);
    }
  } else if (biome === "ice") {
    ctx.fillStyle = "rgba(220,240,255,0.4)";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x + 4, y + 6 + (col % 3) * 4, TILE - 8, 2);
  } else if (biome === "volcano" || biome === "lavazone") {
    ctx.fillStyle = `rgba(255,87,34,${0.06 + Math.sin(tick * 2 + col) * 0.03})`;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = `rgba(255,193,7,${0.04 + Math.sin(tick * 3 + row) * 0.02})`;
    ctx.fillRect(x + 4, y + TILE - 8, TILE - 8, 4);
  } else if (biome === "hurricane") {
    ctx.fillStyle = `rgba(80,100,120,${0.1 + Math.sin(tick * 3 + row) * 0.05})`;
    ctx.fillRect(x, y, TILE, TILE);
  } else if (biome === "madgreen") {
    ctx.fillStyle = "rgba(118,255,3,0.1)";
    ctx.fillRect(x, y, TILE, TILE);
  } else if (biome === "forest") {
    ctx.fillStyle = "rgba(0,40,0,0.08)";
    ctx.fillRect(x, y, TILE, TILE);
  }
}

function drawImpactSlash(ctx, x, y, facing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-30, 10);
  ctx.lineTo(30, -20);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,87,34,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-25, 15);
  ctx.lineTo(25, -15);
  ctx.stroke();
  ctx.restore();
}

function spawnBattleImpact(side) {
  const arena = document.getElementById("battle-arena-shake");
  if (!arena) return;
  const el = document.createElement("div");
  el.className = "battle-impact-slash" + (side === "enemy" ? " enemy-side" : "");
  arena.appendChild(el);
  setTimeout(() => el.remove(), 400);
}

function flashBattleScreen() {
  const flash = document.getElementById("battle-flash");
  if (!flash) return;
  flash.classList.remove("hidden", "active");
  void flash.offsetWidth;
  flash.classList.add("active");
  setTimeout(() => {
    flash.classList.remove("active");
    flash.classList.add("hidden");
  }, 450);
}

function spawnFloatingDamage(text, isCrit, targetSide) {
  const arena = document.getElementById("battle-arena-shake");
  if (!arena) return;
  const el = document.createElement("div");
  el.className = "damage-float" + (isCrit ? " crit" : "") + (targetSide === "enemy" ? " on-enemy" : " on-ally");
  el.textContent = text;
  arena.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function flashHpBar(barId) {
  const bar = document.getElementById(barId);
  if (!bar) return;
  bar.classList.add("hp-damaged");
  setTimeout(() => bar.classList.remove("hp-damaged"), 350);
}

function isWaterAdjacent(mapGrid, row, col) {
  if (!mapGrid) return false;
  for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const r = row + dr;
    const c = col + dc;
    const cell = mapGrid[r]?.[c];
    if (cell && cell !== "water" && cell !== "void" && cell !== "lava") return true;
  }
  return false;
}
