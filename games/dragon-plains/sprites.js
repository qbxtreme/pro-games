// Cool drawn dragons + purple blob monsters

const DRAGON_COLORS = {
  fire: { body: "#c62828", belly: "#ff8a65", wing: "#b71c1c", eye: "#ffeb3b" },
  water: { body: "#1565c0", belly: "#64b5f6", wing: "#0d47a1", eye: "#e1f5fe" },
  earth: { body: "#2e7d32", belly: "#a5d6a7", wing: "#1b5e20", eye: "#fff9c4" },
  air: { body: "#78909c", belly: "#cfd8dc", wing: "#546e7a", eye: "#ffffff" },
  ice: { body: "#0277bd", belly: "#b3e5fc", wing: "#01579b", eye: "#ffffff" },
  lava: { body: "#d84315", belly: "#ffab91", wing: "#bf360c", eye: "#ffeb3b" },
  hurricane: { body: "#546e7a", belly: "#cfd8dc", wing: "#37474f", eye: "#e1f5fe" },
  madgreen: { body: "#558b2f", belly: "#ccff90", wing: "#33691e", eye: "#f4ff81" },
};

const SHINY_TINT = { body: "#ffd54f", belly: "#fff9c4", wing: "#ffb300", eye: "#ffffff" };

function dragonSizeMultiplier(stars) {
  if (stars >= 5) return 1.7;
  if (stars >= 3) return 1.35;
  return 1;
}

const DRAGON_MAX_VISUAL_MULT = 1.85;

function darkenDragon(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 255) - amt);
  const b = Math.max(0, (n & 255) - amt);
  return `rgb(${r},${g},${b})`;
}

function drawDragon(ctx, x, y, element, baseSize, facing = 1, stars = 1, shiny = false, breath = 0) {
  const c = shiny ? SHINY_TINT : (DRAGON_COLORS[element] || DRAGON_COLORS.fire);
  const mult = dragonSizeMultiplier(stars);
  let s = baseSize * mult;
  s = Math.min(s, baseSize * DRAGON_MAX_VISUAL_MULT);
  const bob = Math.sin(breath || 0) * s * 0.03;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(facing, 1);

  drawElementAura(ctx, element, s, breath);

  if (shiny) {
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = s * 0.4;
  }

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(4, s * 0.58, s * 0.56, s * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrd = ctx.createRadialGradient(-s * 0.15, -s * 0.12, s * 0.06, 0, s * 0.05, s * 0.48);
  bodyGrd.addColorStop(0, c.belly);
  bodyGrd.addColorStop(0.35, c.body);
  bodyGrd.addColorStop(0.75, darkenDragon(c.body, 20));
  bodyGrd.addColorStop(1, darkenDragon(c.body, 45));

  const drawWings = (scale, alpha) => {
    ctx.globalAlpha = alpha;
    const flap = Math.sin((breath || 0) * 2) * 0.08;
    const wingColor = darkenDragon(c.wing, 10);
    const memColor = darkenDragon(c.wing, 25);

    const drawOneWing = (side) => {
      const sx = side * s * 0.15 * scale;
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.moveTo(sx, -s * 0.05 * scale);
      ctx.lineTo(sx + side * s * (0.58 + flap) * scale, -s * 0.48 * scale);
      ctx.lineTo(sx + side * s * 0.22 * scale, s * 0.12 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.08 * alpha})`;
      ctx.beginPath();
      ctx.moveTo(sx + side * s * 0.08 * scale, -s * 0.02 * scale);
      ctx.lineTo(sx + side * s * 0.42 * scale, -s * 0.38 * scale);
      ctx.lineTo(sx + side * s * 0.18 * scale, s * 0.06 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = memColor;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, -s * 0.02 * scale);
      ctx.lineTo(sx + side * s * 0.45 * scale, -s * 0.35 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + side * s * 0.06 * scale, s * 0.02 * scale);
      ctx.lineTo(sx + side * s * 0.35 * scale, -s * 0.22 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + side * s * 0.12 * scale, s * 0.04 * scale);
      ctx.lineTo(sx + side * s * 0.28 * scale, -s * 0.12 * scale);
      ctx.stroke();
    };
    drawOneWing(-1);
    drawOneWing(1);
    ctx.globalAlpha = 1;
  };

  if (stars >= 5) drawWings(1.15, 0.45);
  if (stars >= 3) drawWings(0.75, 0.65);
  drawWings(1, 1);

  ctx.fillStyle = bodyGrd;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.05, s * 0.38, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let row = 0; row < 5; row++) {
    for (let sc = 0; sc < 6; sc++) {
      const sx = -s * 0.28 + sc * s * 0.1;
      const sy = -s * 0.08 + row * s * 0.07;
      const sg = ctx.createRadialGradient(sx - 1, sy - 1, 0.5, sx, sy, s * 0.035);
      sg.addColorStop(0, `rgba(255,255,255,${0.12 + (sc % 2) * 0.04})`);
      sg.addColorStop(0.6, darkenDragon(c.body, 8 + row * 2));
      sg.addColorStop(1, darkenDragon(c.body, 22 + row * 3));
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(sx, sy, s * 0.032, s * 0.024, sc * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = darkenDragon(c.body, 35);
  ctx.lineWidth = s * 0.04;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, s * 0.18);
  for (let t = 0; t <= 6; t++) {
    const tx = -s * 0.12 - t * s * 0.07;
    const ty = s * 0.2 + t * s * 0.06 + Math.sin((breath || 0) * 2 + t) * s * 0.02;
    ctx.lineTo(tx, ty);
  }
  ctx.stroke();
  for (let t = 0; t < 6; t++) {
    const tx = -s * 0.12 - t * s * 0.07;
    const ty = s * 0.2 + t * s * 0.06 + Math.sin((breath || 0) * 2 + t) * s * 0.02;
    if (t % 2 === 0) {
      ctx.fillStyle = darkenDragon(c.body, 12);
      ctx.beginPath();
      ctx.moveTo(tx, ty - s * 0.04);
      ctx.lineTo(tx - s * 0.05, ty);
      ctx.lineTo(tx, ty + s * 0.04);
      ctx.fill();
    }
  }

  const neckGrd = ctx.createLinearGradient(s * 0.05, -s * 0.05, s * 0.28, -s * 0.2);
  neckGrd.addColorStop(0, c.body);
  neckGrd.addColorStop(0.5, darkenDragon(c.body, 5));
  neckGrd.addColorStop(1, c.belly);
  ctx.fillStyle = neckGrd;
  ctx.beginPath();
  ctx.moveTo(s * 0.08, s * 0.02);
  ctx.quadraticCurveTo(s * 0.18, -s * 0.08, s * 0.28, -s * 0.14);
  ctx.quadraticCurveTo(s * 0.22, s * 0.04, s * 0.1, s * 0.08);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = darkenDragon(c.body, 8);
  ctx.beginPath();
  ctx.ellipse(s * 0.12, s * 0.02, s * 0.12, s * 0.1, 0.2, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.ellipse(-s * 0.08 + i * s * 0.07, s * 0.02 + (i % 2) * s * 0.06, s * 0.04, s * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = c.belly;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.12, s * 0.22, s * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = c.body;
  ctx.lineWidth = s * 0.08;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.28, s * 0.18);
  ctx.quadraticCurveTo(-s * 0.55, s * 0.35, -s * 0.42, s * 0.58);
  ctx.stroke();

  const headGrd = ctx.createRadialGradient(s * 0.35, -s * 0.2, s * 0.05, s * 0.32, -s * 0.15, s * 0.24);
  headGrd.addColorStop(0, c.belly);
  headGrd.addColorStop(1, c.body);
  ctx.fillStyle = headGrd;
  ctx.beginPath();
  ctx.arc(s * 0.32, -s * 0.18, s * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(s * 0.48, -s * 0.14);
  ctx.lineTo(s * 0.62, -s * 0.1);
  ctx.lineTo(s * 0.5, -s * 0.06);
  ctx.fill();

  ctx.fillStyle = c.belly;
  ctx.beginPath();
  ctx.arc(s * 0.38, -s * 0.12, s * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(s * 0.4, -s * 0.22, s * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.eye;
  ctx.beginPath();
  ctx.arc(s * 0.41, -s * 0.22, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shiny ? "#7b1fa2" : "#111";
  ctx.beginPath();
  ctx.arc(s * 0.43, -s * 0.22, s * 0.018, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(s * 0.445, -s * 0.24, s * 0.008, 0, Math.PI * 2);
  ctx.fill();

  const drawHorn = (hx, hy, len) => {
    ctx.strokeStyle = darkenDragon(c.body, 15);
    ctx.lineWidth = s * 0.06;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + len * 0.3, hy - len);
    ctx.stroke();
  };

  drawHorn(s * 0.38, -s * 0.32, s * 0.18);
  if (stars >= 3) drawHorn(s * 0.48, -s * 0.28, s * 0.22);
  if (stars >= 5) {
    drawHorn(s * 0.3, -s * 0.34, s * 0.28);
    drawHorn(s * 0.52, -s * 0.3, s * 0.26);
  }

  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.28);
  ctx.lineTo(-s * 0.38, s * 0.58);
  ctx.lineTo(-s * 0.15, s * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.1, s * 0.3);
  ctx.lineTo(s * 0.04, s * 0.58);
  ctx.lineTo(s * 0.22, s * 0.32);
  ctx.fill();

  ctx.fillStyle = darkenDragon(c.body, 20);
  for (let claw = 0; claw < 3; claw++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.34 + claw * s * 0.04, s * 0.56);
    ctx.lineTo(-s * 0.32 + claw * s * 0.04, s * 0.64);
    ctx.lineTo(-s * 0.36 + claw * s * 0.04, s * 0.58);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.08 + claw * s * 0.04, s * 0.56);
    ctx.lineTo(s * 0.1 + claw * s * 0.04, s * 0.64);
    ctx.lineTo(s * 0.06 + claw * s * 0.04, s * 0.58);
    ctx.fill();
  }

  drawElementBreathWisps(ctx, element, s, breath);

  ctx.strokeStyle = `rgba(255,255,255,${0.18 + Math.sin((breath || 0) * 2) * 0.06})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(s * 0.05, s * 0.02, s * 0.34, -Math.PI * 0.8, Math.PI * 0.35);
  ctx.stroke();

  if (shiny) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff59d";
    for (let i = 0; i < 5; i++) {
      const a = ((breath || 0) * 0.5 + i * 1.25) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.45 - s * 0.1, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawElementBreathWisps(ctx, element, s, breath) {
  const t = breath || 0;
  const presets = {
    fire: { color: "255,120,40", n: 5 },
    lava: { color: "255,90,30", n: 6 },
    water: { color: "100,200,255", n: 4 },
    ice: { color: "200,240,255", n: 5 },
    air: { color: "220,240,255", n: 3 },
    hurricane: { color: "180,200,220", n: 4 },
    earth: { color: "160,130,90", n: 3 },
    madgreen: { color: "140,255,80", n: 4 },
  };
  const p = presets[element] || presets.fire;
  for (let i = 0; i < p.n; i++) {
    const a = t * 1.8 + i * 1.1;
    const wx = s * 0.5 + Math.cos(a) * s * 0.12;
    const wy = -s * 0.12 + Math.sin(a * 1.4) * s * 0.1;
    const alpha = 0.25 + Math.sin(t * 3 + i) * 0.15;
    ctx.fillStyle = `rgba(${p.color},${alpha})`;
    ctx.beginPath();
    ctx.arc(wx, wy, s * (0.025 + (i % 2) * 0.012), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawElementAura(ctx, element, s, breath) {
  const t = breath || 0;
  if (element === "fire" || element === "lava") {
    const pulse = 0.12 + Math.sin(t * 3) * 0.06;
    const ag = ctx.createRadialGradient(0, 0, s * 0.1, 0, 0, s * 0.7);
    ag.addColorStop(0, `rgba(255,160,60,${pulse * 1.5})`);
    ag.addColorStop(0.5, `rgba(255,87,34,${pulse})`);
    ag.addColorStop(1, "rgba(255,87,34,0)");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.68, 0, Math.PI * 2);
    ctx.fill();
  } else if (element === "water" || element === "ice") {
    const pulse = 0.1 + Math.sin(t * 2) * 0.05;
    const ag = ctx.createRadialGradient(0, -s * 0.05, s * 0.05, 0, 0, s * 0.62);
    ag.addColorStop(0, `rgba(180,230,255,${pulse * 1.3})`);
    ag.addColorStop(0.6, `rgba(79,195,247,${pulse * 0.6})`);
    ag.addColorStop(1, "rgba(79,195,247,0)");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2);
    ctx.fill();
  } else if (element === "earth") {
    ctx.fillStyle = `rgba(120,90,60,${0.08 + Math.sin(t) * 0.03})`;
    ctx.beginPath();
    ctx.arc(0, s * 0.1, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (element === "madgreen") {
    ctx.fillStyle = `rgba(118,255,3,${0.1 + Math.sin(t * 2) * 0.04})`;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.58, 0, Math.PI * 2);
    ctx.fill();
  } else if (element === "hurricane" || element === "air") {
    ctx.strokeStyle = `rgba(200,220,240,${0.15 + Math.sin(t * 2.5) * 0.08})`;
    ctx.lineWidth = 1;
    for (let r = 0; r < 2; r++) {
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.35 + r * 0.12), 0, Math.PI * 1.6);
      ctx.stroke();
    }
  }
}

function drawBlob(ctx, x, y, size, element, squash = 1) {
  const tint = DRAGON_COLORS[element] || DRAGON_COLORS.fire;
  const s = size * squash;
  const wobble = Math.sin(performance.now() * 0.004 + x) * 1.5;

  ctx.save();
  ctx.translate(x, y + wobble * 0.3);
  ctx.scale(1, 1 / squash);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(4, s * 0.52, s * 0.62, s * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  const outerG = ctx.createRadialGradient(-s * 0.15, -s * 0.1, s * 0.05, 0, s * 0.05, s * 0.58);
  outerG.addColorStop(0, "rgba(225,190,240,0.55)");
  outerG.addColorStop(0.35, "rgba(171,71,188,0.45)");
  outerG.addColorStop(0.7, "rgba(106,27,154,0.35)");
  outerG.addColorStop(1, "rgba(74,20,140,0.2)");
  ctx.fillStyle = outerG;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.05, s * 0.56, s * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  const coreG = ctx.createRadialGradient(0, s * 0.02, 1, 0, s * 0.05, s * 0.32);
  coreG.addColorStop(0, tint.belly);
  coreG.addColorStop(0.5, tint.body);
  coreG.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.05, s * 0.38, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(-s * 0.22, -s * 0.14, s * 0.18, s * 0.1, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse(s * 0.1, s * 0.12, s * 0.12, s * 0.07, 0.3, 0, Math.PI * 2);
  ctx.fill();

  for (let d = 0; d < 3; d++) {
    const dx = -s * 0.2 + d * s * 0.18;
    ctx.fillStyle = `rgba(156,39,176,${0.5 - d * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(dx, s * 0.38 + d * 2, s * 0.08, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let b = 0; b < 4; b++) {
    const bx = -s * 0.15 + b * s * 0.12 + Math.sin(performance.now() * 0.003 + b + x) * 2;
    const by = s * 0.05 + b * s * 0.08;
    ctx.fillStyle = `rgba(255,255,255,${0.15 + b * 0.05})`;
    ctx.beginPath();
    ctx.arc(bx, by, s * (0.04 + b * 0.01), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.ellipse(-s * 0.28, -s * 0.18, s * 0.35, s * 0.12, -0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.ellipse(s * 0.12, -s * 0.04, s * 0.2, s * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tint.body;
  ctx.beginPath();
  ctx.ellipse(s * 0.14, -s * 0.04, s * 0.1, s * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(s * 0.18, -s * 0.04, s * 0.055, s * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(s * 0.21, -s * 0.08, s * 0.028, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(s * 0.08, s * 0.08, s * 0.06, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}

function dragonCanvas(element, size = 80, stars = 1, shiny = false) {
  const c = document.createElement("canvas");
  const mult = dragonSizeMultiplier(stars);
  c.width = size * 2 * mult;
  c.height = size * 1.4 * mult;
  const ctx = c.getContext("2d");
  drawDragon(ctx, c.width / 2, c.height * 0.65, element, size, 1, stars, shiny);
  return c.toDataURL();
}

function setDragonSprite(el, element, stars = 1, shiny = false) {
  if (!el) return;
  el.innerHTML = "";
  const mult = dragonSizeMultiplier(stars);
  const c = document.createElement("canvas");
  c.width = 120 * Math.min(mult, 2);
  c.height = 90 * Math.min(mult, 2);
  c.className = "dragon-canvas" + (shiny ? " shiny-dragon" : "");
  const ctx = c.getContext("2d");
  drawDragon(ctx, c.width / 2, c.height * 0.62, element, 50 / Math.min(mult, 2), 1, stars, shiny);
  el.appendChild(c);
}

function setBlobSprite(el, element) {
  if (!el) return;
  el.innerHTML = "";
  const c = document.createElement("canvas");
  c.width = 100;
  c.height = 80;
  c.className = "blob-canvas";
  const ctx = c.getContext("2d");
  drawBlob(ctx, 50, 45, 38, element);
  el.appendChild(c);
}

function drawTrainer(ctx, x, y, facing = 1, walkPhase = 0, moving = false) {
  const s = 18;
  const legSwing = moving ? Math.sin(walkPhase * 10) * 5 : 0;
  const bob = moving ? Math.abs(Math.sin(walkPhase * 10)) * 1.5 : 0;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(facing, 1);

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.88, s * 0.58, s * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#37474f";
  ctx.fillRect(-s * 0.2 + legSwing * 0.35, s * 0.38, s * 0.17, s * 0.5);
  ctx.fillRect(s * 0.03 - legSwing * 0.35, s * 0.38, s * 0.17, s * 0.5);
  ctx.fillStyle = "#263238";
  ctx.fillRect(-s * 0.22 + legSwing * 0.35, s * 0.78, s * 0.2, s * 0.14);
  ctx.fillRect(s * 0.02 - legSwing * 0.35, s * 0.78, s * 0.2, s * 0.14);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(-s * 0.2 + legSwing * 0.35, s * 0.84, s * 0.08, s * 0.04);
  ctx.fillRect(s * 0.05 - legSwing * 0.35, s * 0.84, s * 0.08, s * 0.04);

  const packG = ctx.createLinearGradient(-s * 0.42, s * 0.02, -s * 0.28, s * 0.28);
  packG.addColorStop(0, "#5d4037");
  packG.addColorStop(0.5, "#4e342e");
  packG.addColorStop(1, "#3e2723");
  ctx.fillStyle = packG;
  ctx.beginPath();
  ctx.roundRect(-s * 0.44, s * 0.02, s * 0.18, s * 0.3, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = "#795548";
  ctx.fillRect(-s * 0.4, s * 0.08, s * 0.1, s * 0.04);

  ctx.fillStyle = "#455a64";
  ctx.fillRect(-s * 0.38, s * 0.02, s * 0.18, s * 0.34);
  ctx.fillStyle = "#37474f";
  ctx.fillRect(-s * 0.36, s * 0.06, s * 0.14, s * 0.28);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-s * 0.36, s * 0.06, s * 0.14, s * 0.28);

  ctx.fillStyle = "#455a64";
  ctx.fillRect(-s * 0.34, s * 0.08, s * 0.22, s * 0.32);
  ctx.fillStyle = "#263238";
  ctx.fillRect(-s * 0.32, s * 0.12, s * 0.08, s * 0.24);

  const jacketGrd = ctx.createLinearGradient(-s * 0.34, -s * 0.08, s * 0.34, s * 0.38);
  jacketGrd.addColorStop(0, "#1976d2");
  jacketGrd.addColorStop(0.5, "#0d47a1");
  jacketGrd.addColorStop(1, "#1565c0");
  ctx.fillStyle = jacketGrd;
  ctx.fillRect(-s * 0.34, -s * 0.08, s * 0.68, s * 0.46);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(-s * 0.28, -s * 0.02, s * 0.14, s * 0.32);
  ctx.fillStyle = "#ffc107";
  ctx.fillRect(-s * 0.04, -s * 0.04, s * 0.08, s * 0.36);

  ctx.fillStyle = "#ffcc80";
  const skinGrd = ctx.createRadialGradient(0, -s * 0.34, s * 0.05, 0, -s * 0.32, s * 0.26);
  skinGrd.addColorStop(0, "#ffe0b2");
  skinGrd.addColorStop(0.6, "#ffcc80");
  skinGrd.addColorStop(1, "#d4956a");
  ctx.fillStyle = skinGrd;
  ctx.beginPath();
  ctx.arc(0, -s * 0.32, s * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4e342e";
  ctx.beginPath();
  ctx.arc(0, -s * 0.42, s * 0.26, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c62828";
  ctx.beginPath();
  ctx.arc(0, -s * 0.46, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, -s * 0.48, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(-s * 0.06, -s * 0.36, s * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#263238";
  ctx.beginPath();
  ctx.arc(-s * 0.09, -s * 0.34, s * 0.035, 0, Math.PI * 2);
  ctx.arc(s * 0.09, -s * 0.34, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-s * 0.07, -s * 0.36, s * 0.012, 0, Math.PI * 2);
  ctx.arc(s * 0.11, -s * 0.36, s * 0.012, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffcc80";
  ctx.fillRect(-s * 0.42, s * 0.04, s * 0.14, s * 0.24);
  ctx.fillRect(s * 0.28, s * 0.04, s * 0.14, s * 0.24);

  ctx.restore();
}

let battleSpriteLoopId = null;
const battleSpriteState = { pet: null, wild: null };

function stopBattleSpriteLoop() {
  if (battleSpriteLoopId) cancelAnimationFrame(battleSpriteLoopId);
  battleSpriteLoopId = null;
}

function startBattleSpriteLoop() {
  stopBattleSpriteLoop();
  function frame() {
    if (!battle) { stopBattleSpriteLoop(); return; }
    const t = Date.now() / 1000;
    if (battleSpriteState.pet) {
      redrawBattleSprite("battle-pet-sprite", battleSpriteState.pet, t);
    }
    if (battleSpriteState.wild) {
      redrawBattleSprite("battle-wild-sprite", battleSpriteState.wild, t);
    }
    battleSpriteLoopId = requestAnimationFrame(frame);
  }
  battleSpriteLoopId = requestAnimationFrame(frame);
}

function redrawBattleSprite(elId, info, t) {
  const el = document.getElementById(elId);
  if (!el) return;
  let c = el.querySelector("canvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(c.width / 2, c.height * 0.84, c.width * 0.28, c.height * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  const squash = info.isBlob ? 1 + Math.sin(t * 4) * 0.07 : 1;
  const breath = t * 2.5;
  if (info.isBlob) drawBlob(ctx, c.width / 2, c.height * 0.52, c.width * 0.32, info.element, squash);
  else drawDragon(ctx, c.width / 2, c.height * 0.56, info.element, Math.min(c.width * 0.26, 46), 1, info.stars || 1, info.shiny, breath);
}

function setBattlePetSprite(el, element, stars = 1, shiny = false, isBlob = false) {
  if (!el) return;
  el.innerHTML = "";
  const c = document.createElement("canvas");
  c.width = 180;
  c.height = 150;
  c.className = "battle-canvas-sprite";
  el.appendChild(c);
  const info = { element, stars, shiny, isBlob };
  if (el.id === "battle-pet-sprite") battleSpriteState.pet = info;
  else battleSpriteState.wild = info;
  redrawBattleSprite(el.id, info, Date.now() / 1000);
}
