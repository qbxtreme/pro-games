// Realistic top-down world — smooth movement like All Out Mob Battle

const TILE = 44;
const PLAYER_SPEED = 3.2;
const MOB_SPEED = 1.4;

const BIOME_COLORS = {
  plains: { base: "#5a7a32", dark: "#3d5222", light: "#7a9a48" },
  forest: { base: "#2e5a28", dark: "#1a3518", light: "#4a7840" },
  ocean: { base: "#d4b878", dark: "#a89050", light: "#f0e0b0" },
  volcano: { base: "#5a4038", dark: "#3a2820", light: "#7a5850" },
  sky: { base: "#88b8d8", dark: "#5090b8", light: "#c0e0f8" },
  cave: { base: "#3a4248", dark: "#222830", light: "#525a60" },
  hub: { base: "#6850a0", dark: "#483070", light: "#9078c0" },
  ice: { base: "#a8cce0", dark: "#6090b0", light: "#e0f0ff" },
  hurricane: { base: "#687888", dark: "#485868", light: "#98a8b8" },
  madgreen: { base: "#4a9020", dark: "#285010", light: "#78c040" },
  lavazone: { base: "#902818", dark: "#601008", light: "#c04828" },
};

const ELEMENT_COLORS = {
  fire: "#ef5350",
  water: "#42a5f5",
  earth: "#8d6e63",
  air: "#90a4ae",
  ice: "#4fc3f7",
  lava: "#ff5722",
  hurricane: "#78909c",
  madgreen: "#76ff03",
};

let canvas, ctx, wrap;
let camX = 0, camY = 0;
let camSmoothX = 0, camSmoothY = 0;
let camInitialized = false;
let playerFacing = 1;
let walkPhase = 0;
let playerMoving = false;
let joyActive = false, joyDx = 0, joyDy = 0;
let keysDown = {};
let worldLoopId = null;
let lastTime = 0;
let animTick = 0;
let nearMob = null;
let nearPlant = null;
let nearGym = null;
let nearBoss = false;
let interactCooldown = 0;

let remoteTrainers = [];

function setRemoteTrainers(peers) {
  remoteTrainers = peers || [];
}

function initWorld() {
  canvas = document.getElementById("world-canvas");
  wrap = document.getElementById("world-wrap");
  if (!canvas || !wrap) return;

  ctx = canvas.getContext("2d");
  canvas.dataset.grSkipAuto = "1";
  wrap.querySelector(".gr-atmosphere")?.remove();
  window.addEventListener("resize", scheduleResizeCanvas);
  window.visualViewport?.addEventListener("resize", scheduleResizeCanvas);
  window.addEventListener("orientationchange", scheduleResizeCanvas);

  setupJoystick();
  setupKeyboard();
  canvas.addEventListener("pointerdown", onCanvasTap);

  document.getElementById("interact-btn")?.addEventListener("click", onInteract);
  document.getElementById("fight-btn")?.addEventListener("click", onFight);

  if (!worldLoopId) {
    lastTime = performance.now();
    worldLoopId = requestAnimationFrame(worldLoop);
  }
  scheduleResizeCanvas();
}

function playViewportSize() {
  const vp = window.visualViewport;
  const w = Math.max(
    1,
    Math.round(vp?.width || window.innerWidth || document.documentElement.clientWidth)
  );
  const h = Math.max(
    1,
    Math.round(vp?.height || window.innerHeight || document.documentElement.clientHeight)
  );
  return { w, h };
}

function resizeCanvas() {
  if (!wrap || !canvas) return;
  const inPlay = document.body.classList.contains("world-play-mode");
  let w;
  let h;
  if (inPlay) {
    ({ w, h } = playViewportSize());
  } else {
    const rect = wrap.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
  }
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  if (inPlay) {
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  } else {
    canvas.style.width = "100%";
    canvas.style.height = "420px";
  }
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}

function scheduleResizeCanvas() {
  resizeCanvas();
  requestAnimationFrame(() => {
    resizeCanvas();
    requestAnimationFrame(resizeCanvas);
  });
}

function setupJoystick() {
  const base = document.getElementById("joystick-base");
  const knob = document.getElementById("joystick-knob");
  if (!base || !knob) return;

  let startX, startY, pointerId = null;

  base.addEventListener("pointerdown", (e) => {
    pointerId = e.pointerId;
    base.setPointerCapture(pointerId);
    startX = e.clientX;
    startY = e.clientY;
    joyActive = true;
  });

  base.addEventListener("pointermove", (e) => {
    if (!joyActive || e.pointerId !== pointerId) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width * 0.35;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joyDx = dx / max;
    joyDy = dy / max;
  });

  const endJoy = (e) => {
    if (e.pointerId !== pointerId) return;
    joyActive = false;
    joyDx = 0;
    joyDy = 0;
    knob.style.transform = "translate(0, 0)";
    pointerId = null;
  };
  base.addEventListener("pointerup", endJoy);
  base.addEventListener("pointercancel", endJoy);
}

function setupKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (!isWorldActive()) return;
    keysDown[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  });
  document.addEventListener("keyup", (e) => { keysDown[e.key] = false; });
}

function isWorldActive() {
  return document.getElementById("tab-forest")?.classList.contains("active") && !battle;
}

function getInputDir() {
  let dx = joyDx;
  let dy = joyDy;
  if (keysDown.ArrowLeft || keysDown.a || keysDown.A) dx -= 1;
  if (keysDown.ArrowRight || keysDown.d || keysDown.D) dx += 1;
  if (keysDown.ArrowUp || keysDown.w || keysDown.W) dy -= 1;
  if (keysDown.ArrowDown || keysDown.s || keysDown.S) dy += 1;
  const len = Math.hypot(dx, dy);
  if (len > 0) return { dx: dx / len, dy: dy / len };
  return { dx: 0, dy: 0 };
}

function syncPlayerFloat() {
  if (state.playerFx == null) state.playerFx = state.playerX + 0.5;
  if (state.playerFy == null) state.playerFy = state.playerY + 0.5;
}

function syncMobFloats() {
  state.mobs.forEach((m) => {
    if (m.x == null) { m.x = m.col + 0.5; m.y = m.row + 0.5; }
  });
}

function tileBlocked(tx, ty) {
  const row = Math.floor(ty);
  const col = Math.floor(tx);
  if (!isWalkable(row, col)) return true;
  return false;
}

function canMoveTo(fx, fy, radius) {
  const points = [
    [fx, fy],
    [fx - radius, fy],
    [fx + radius, fy],
    [fx, fy - radius],
    [fx, fy + radius],
  ];
  return points.every(([x, y]) => !tileBlocked(x, y));
}

function worldLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  animTick += dt;

  if (isWorldActive()) {
    ensureMap();
    syncPlayerFloat();
    syncMobFloats();
    updateWorld(dt);
    if (typeof updateParticles === "function") updateParticles(dt);
    updateActionButtons();
    renderBiomeDisplay();
    renderEquippedDisplay();
  }

  if (document.getElementById("tab-forest")?.classList.contains("active")) {
    drawWorld();
  }

  worldLoopId = requestAnimationFrame(worldLoop);
}

function updateWorld(dt) {
  if (battle) return;

  const { dx, dy } = getInputDir();
  playerMoving = dx !== 0 || dy !== 0;
  if (playerMoving) {
    walkPhase += dt * 9;
    if (dx !== 0) playerFacing = dx > 0 ? 1 : -1;
    const nx = state.playerFx + dx * PLAYER_SPEED * dt;
    const ny = state.playerFy + dy * PLAYER_SPEED * dt;
    if (canMoveTo(nx, state.playerFy, 0.28)) state.playerFx = nx;
    if (canMoveTo(state.playerFx, ny, 0.28)) state.playerFy = ny;
    state.playerX = Math.floor(state.playerFx);
    state.playerY = Math.floor(state.playerFy);
    const walkBiome = getBiomeAt(state.playerX, state.playerY);
    if (typeof spawnWalkDust === "function") spawnWalkDust(state.playerFx, state.playerFy, walkBiome);
    checkMobTouch();
  }

  const biome = getBiomeAt(Math.floor(state.playerFy), Math.floor(state.playerFx));
  if (typeof trackZoneVisit === "function") trackZoneVisit(biome);

  updateMobsSmooth(dt);
  if (interactCooldown > 0) interactCooldown -= dt;

  if (typeof updateAmbientBiome === "function" && canvas) {
    const biome = getBiomeAt(Math.floor(state.playerFy), Math.floor(state.playerFx));
    updateAmbientBiome(biome, dt, camX, camY, canvas.width, canvas.height);
  }
}

function updateMobsSmooth(dt) {
  state.mobs.forEach((mob) => {
    const dist = Math.hypot(mob.x - state.playerFx, mob.y - state.playerFy);
    const aggro = dist < 4 && dist > 0.5;

    if (aggro && !battle) {
      if (typeof spawnAggroRing === "function" && Math.random() < 0.08) {
        spawnAggroRing(mob.x, mob.y);
      }
      const ang = Math.atan2(state.playerFy - mob.y, state.playerFx - mob.x);
      const chaseSpeed = MOB_SPEED * 1.35;
      const nx = mob.x + Math.cos(ang) * chaseSpeed * dt;
      const ny = mob.y + Math.sin(ang) * chaseSpeed * dt;
      if (canMoveTo(nx, ny, 0.25)) {
        mob.x = nx;
        mob.y = ny;
        mob.row = Math.floor(mob.y);
        mob.col = Math.floor(mob.x);
      }
      if (dist < 0.55) {
        startBattle(mob.animal, mob.id);
        return;
      }
    }

    if (mob.wanderTimer == null) mob.wanderTimer = Math.random() * 2;
    mob.wanderTimer -= dt;

    if (mob.wanderTimer <= 0) {
      mob.wanderTimer = 1.5 + Math.random() * 2;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]];
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
      mob.vx = dc * MOB_SPEED;
      mob.vy = dr * MOB_SPEED;
    }

    if (mob.vx || mob.vy) {
      const nx = mob.x + mob.vx * dt;
      const ny = mob.y + mob.vy * dt;
      if (canMoveTo(nx, ny, 0.25)) {
        mob.x = nx;
        mob.y = ny;
        mob.row = Math.floor(mob.y);
        mob.col = Math.floor(mob.x);
      } else {
        mob.vx = 0;
        mob.vy = 0;
      }

      if (Math.hypot(mob.x - state.playerFx, mob.y - state.playerFy) < 0.55) {
        startBattle(mob.animal, mob.id);
      }
    }
  });
}

function checkMobTouch() {
  for (const mob of state.mobs) {
    if (Math.hypot(mob.x - state.playerFx, mob.y - state.playerFy) < 0.55) {
      startBattle(mob.animal, mob.id);
      return;
    }
  }
}

function findNearMob() {
  let best = null;
  let bestD = 1.2;
  state.mobs.forEach((m) => {
    const d = Math.hypot(m.x - state.playerFx, m.y - state.playerFy);
    if (d < bestD) { bestD = d; best = m; }
  });
  return best;
}

function findNearPlant() {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = Math.floor(state.playerFy) + dr;
      const col = Math.floor(state.playerFx) + dc;
      if (state.mapGrid?.[row]?.[col] === "plant" && !isPlantSearched(row, col)) {
        return { row, col };
      }
    }
  }
  return null;
}

function findNearGym() {
  if (state.currentWorld !== 1 || typeof GYM_LEADERS === "undefined") return null;
  for (const g of GYM_LEADERS) {
    if (state.gymsBeaten?.includes(g.id)) continue;
    if (Math.abs(g.row + 0.5 - state.playerFy) + Math.abs(g.col + 0.5 - state.playerFx) <= 1.5) {
      return g;
    }
  }
  return null;
}

function findNearBoss() {
  if (state.currentWorld !== 1) return false;
  if (state.bossBeaten || typeof BOSS_DRAGON === "undefined") return false;
  return Math.abs(BOSS_DRAGON.row + 0.5 - state.playerFy) + Math.abs(BOSS_DRAGON.col + 0.5 - state.playerFx) <= 1.5;
}

function updateActionButtons() {
  nearMob = findNearMob();
  nearPlant = findNearPlant();
  nearGym = findNearGym();
  nearBoss = findNearBoss();
  const fightBtn = document.getElementById("fight-btn");
  const interactBtn = document.getElementById("interact-btn");
  const gymBtn = document.getElementById("gym-btn");
  const bossBtn = document.getElementById("boss-btn");
  if (fightBtn) fightBtn.classList.toggle("hidden", !nearMob || nearGym || nearBoss);
  if (interactBtn) interactBtn.classList.toggle("hidden", !nearPlant);
  if (gymBtn) {
    gymBtn.classList.toggle("hidden", !nearGym);
    if (nearGym) gymBtn.textContent = `🏛️ ${nearGym.title}`;
  }
  if (bossBtn) bossBtn.classList.toggle("hidden", !nearBoss);
}

function onFight() {
  if (nearMob) startBattle(nearMob.animal, nearMob.id);
}

function onInteract() {
  if (interactCooldown > 0 || !nearPlant) return;
  searchPlant(nearPlant.row, nearPlant.col);
  interactCooldown = 0.5;
}

function onCanvasTap(e) {
  if (!isWorldActive()) return;
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left + camX;
  const sy = e.clientY - rect.top + camY;
  const tx = sx / TILE;
  const ty = sy / TILE;
  const row = Math.floor(ty);
  const col = Math.floor(tx);
  if (state.mapGrid?.[row]?.[col] === "plant" && !isPlantSearched(row, col)) {
    if (Math.abs(row + 0.5 - state.playerFy) + Math.abs(col + 0.5 - state.playerFx) <= 1.5) {
      searchPlant(row, col);
    }
  }
}

function drawWorld() {
  if (!ctx || !canvas) return;
  if (canvas.width < 2 || canvas.height < 2) {
    scheduleResizeCanvas();
    return;
  }
  try {
    drawWorldFrame();
  } catch (err) {
    console.error("drawWorld failed:", err);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#87ceeb");
    g.addColorStop(1, "#e8f5e9");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  window.GameRealism?.markManualFrame?.();
}

function drawWorldFrame() {
  ensureMap();
  syncPlayerFloat();
  syncMobFloats();

  const mapW = MAP_SIZE * TILE;
  const mapH = MAP_SIZE * TILE;
  const targetCamX = state.playerFx * TILE - canvas.width / 2;
  const targetCamY = state.playerFy * TILE - canvas.height / 2;
  const clampedX = Math.max(0, Math.min(targetCamX, mapW - canvas.width));
  const clampedY = Math.max(0, Math.min(targetCamY, mapH - canvas.height));
  if (!camInitialized) {
    camSmoothX = clampedX;
    camSmoothY = clampedY;
    camInitialized = true;
  }
  camSmoothX += (clampedX - camSmoothX) * 0.12;
  camSmoothY += (clampedY - camSmoothY) * 0.12;
  camX = camSmoothX;
  camY = camSmoothY;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  const playerBiome = getBiomeAt(Math.floor(state.playerFy), Math.floor(state.playerFx));
  if (typeof drawDynamicSky === "function") {
    drawDynamicSky(ctx, canvas.width, canvas.height, playerBiome, animTick, camX);
  } else {
    const skyGrd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrd.addColorStop(0, "#87ceeb");
    skyGrd.addColorStop(0.55, "#b3e5fc");
    skyGrd.addColorStop(1, "#e8f5e9");
    ctx.fillStyle = skyGrd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (typeof drawSunRays === "function") drawSunRays(ctx, canvas.width, canvas.height);
    if (typeof drawParallaxClouds === "function") drawParallaxClouds(ctx, canvas.width, canvas.height, animTick);
  }

  ctx.save();
  ctx.translate(-camX, -camY);

  drawTerrain();
  drawPlants();
  drawSigns();
  drawGyms();
  drawSortedEntities();
  drawZoneLabels();

  if (typeof drawParticles === "function") drawParticles(ctx);

  ctx.restore();
  const playerScreenX = state.playerFx * TILE - camX;
  const playerScreenY = state.playerFy * TILE - camY;
  if (typeof drawScreenDistanceFog === "function") {
    drawScreenDistanceFog(ctx, canvas.width, canvas.height, playerScreenX, playerScreenY, playerBiome);
  }
  if (typeof drawLightShafts === "function") {
    drawLightShafts(ctx, canvas.width, canvas.height, playerBiome, animTick);
  }
  if (typeof drawFilmGrain === "function") {
    drawFilmGrain(ctx, canvas.width, canvas.height, animTick);
  }
  drawWorldHUD();
}

function drawScreenBloom(biome) {
  if (biome === "cave") return;
  const warm = biome === "volcano" || biome === "lavazone";
  const sunX = canvas.width * 0.82;
  const sunY = canvas.height * 0.12;
  const grd = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, canvas.width * 0.62);
  grd.addColorStop(0, warm ? "rgba(255,220,140,0.14)" : "rgba(255,252,230,0.1)");
  grd.addColorStop(0.25, warm ? "rgba(255,180,80,0.06)" : "rgba(255,248,220,0.05)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = warm ? "rgba(255,140,60,0.04)" : "rgba(255,235,200,0.035)";
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.35);
}

function drawSortedEntities() {
  const entities = [];
  state.mobs.forEach((mob) => {
    entities.push({ type: "mob", y: mob.y, mob });
  });
  remoteTrainers.forEach((peer) => {
    const st = peer.state || {};
    if (st.fx == null || st.fy == null) return;
    entities.push({ type: "remote", y: st.fy, peer, st });
  });
  entities.push({ type: "player", y: state.playerFy });
  entities.sort((a, b) => a.y - b.y);
  entities.forEach((e) => {
    if (e.type === "mob") drawMobEntity(e.mob);
    else if (e.type === "remote") drawRemoteTrainer(e.peer, e.st);
    else drawPlayer();
  });
}

function drawRemoteTrainer(peer, st) {
  const x = st.fx * TILE;
  const y = st.fy * TILE;
  const facing = st.facing || 1;
  const petEl = st.petElement;

  if (petEl && typeof drawDragon === "function") {
    const px = x - facing * 18;
    drawShadow(px, y + 4, 10);
    drawDragon(ctx, px, y + 4, petEl, 8, facing, st.petStars || 1, false, animTick * 2.5);
  }

  drawShadow(x, y, 12);
  if (typeof drawTrainer === "function") {
    drawTrainer(ctx, x, y, facing, 0, false);
  }
  drawNameplate(x, y - 32, (peer.name || "Trainer").slice(0, 12) + " 🌐", "#64b5f6");
}

function drawTileBlock(x, y, color, depth) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  const n = typeof terrainHash === "function" ? terrainHash(col, row, 4) : 0.5;
  const varied = shadeColor(color, (n - 0.5) * 0.1);
  const d = depth || 6;
  const topGrd = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
  topGrd.addColorStop(0, shadeColor(varied, 0.12));
  topGrd.addColorStop(0.35, varied);
  topGrd.addColorStop(0.72, shadeColor(varied, -0.04));
  topGrd.addColorStop(1, shadeColor(varied, -0.1));
  ctx.fillStyle = topGrd;
  ctx.fillRect(x, y, TILE, TILE - d);

  ctx.fillStyle = `rgba(0,0,0,${0.22 + n * 0.08})`;
  ctx.fillRect(x, y + TILE - d, TILE, d);
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(x + TILE - 6, y + 2, 6, TILE - d);

  const highlight = ctx.createLinearGradient(x, y, x + TILE * 0.6, y + TILE * 0.4);
  highlight.addColorStop(0, "rgba(255,255,255,0.14)");
  highlight.addColorStop(0.5, "rgba(255,255,255,0.04)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(x + 2, y + 2, TILE - 10, TILE - d - 4);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(x + 3, y + 7, TILE - 12, 2);
}

function landTouchesWater(row, col) {
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dr, dc] of dirs) {
    const r = row + dr, c = col + dc;
    if (r < 0 || c < 0 || r >= MAP_SIZE || c >= MAP_SIZE) continue;
    const n = state.mapGrid[r][c];
    if (n === "water" || n === "void") return true;
  }
  return false;
}

function visibleTileRange() {
  const pad = 2;
  const minCol = Math.max(0, Math.floor(camX / TILE) - pad);
  const maxCol = Math.min(MAP_SIZE - 1, Math.ceil((camX + canvas.width) / TILE) + pad);
  const minRow = Math.max(0, Math.floor(camY / TILE) - pad);
  const maxRow = Math.min(MAP_SIZE - 1, Math.ceil((camY + canvas.height) / TILE) + pad);
  return { minRow, maxRow, minCol, maxCol };
}

function drawTerrain() {
  const { minRow, maxRow, minCol, maxCol } = visibleTileRange();
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cell = state.mapGrid[row][col];
      const biome = getBiomeAt(row, col);
      const colors = BIOME_COLORS[biome] || BIOME_COLORS.plains;
      const x = col * TILE;
      const y = row * TILE;
      const noise = ((row * 17 + col * 31) % 5) / 20;

      const tileColor = cell === "water" ? "#1565c0"
        : cell === "lava" ? `hsl(${15 + Math.sin(animTick * 3 + row) * 5}, 80%, 45%)`
        : cell === "void" ? "#0d47a1"
        : cell === "sand" ? "#ffcc80"
        : cell === "cloud" ? colors.light
        : shadeColor(colors.base, noise);

      if (cell === "water" || cell === "void" || cell === "lava") {
        if (cell === "water" && typeof drawRealisticWater === "function") {
          const shore = typeof isWaterAdjacent === "function"
            && isWaterAdjacent(state.mapGrid, row, col);
          drawRealisticWater(ctx, x, y, col, row, animTick, shore);
        } else if (cell === "lava" && typeof drawRealisticLavaTile === "function") {
          drawRealisticLavaTile(ctx, x, y, col, row, animTick);
        } else {
          ctx.fillStyle = tileColor;
          ctx.fillRect(x, y, TILE, TILE);
        }
      } else {
        drawTileBlock(x, y, tileColor, cell === "cloud" ? 4 : cell === "sand" ? 5 : 9);
        if (typeof drawTerrainMicroTexture === "function") {
          drawTerrainMicroTexture(ctx, x, y, col, row, cell, biome);
        }
        if (typeof drawDirectionalTileLight === "function") {
          drawDirectionalTileLight(ctx, x, y, col, row, biome);
        }
        if (typeof drawTileAmbientOcclusion === "function") {
          drawTileAmbientOcclusion(ctx, x, y, row, col, state.mapGrid);
        }
        if ((cell === "grass" || cell === "ground") && typeof drawWildflowerDecal === "function") {
          drawWildflowerDecal(ctx, x, y, col, row, animTick);
        }
      }

      if (cell === "tree") drawTree(x, y);
      else if (cell === "rock") drawRock(x, y);
      else if (cell === "lava") drawLava(x, y);
      else if (cell === "grass" || cell === "ground") {
        if (typeof drawGrassTufts === "function") drawGrassTufts(ctx, x, y, col, row, animTick);
        if (typeof drawGrassTileDetails === "function") drawGrassTileDetails(ctx, x, y, col, row, animTick);
        if (landTouchesWater(row, col)) {
          ctx.fillStyle = "rgba(255,204,128,0.35)";
          ctx.fillRect(x + 2, y + TILE - 10, TILE - 4, 8);
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          for (let f = 0; f < 3; f++) {
            ctx.beginPath();
            ctx.arc(x + 10 + f * 12, y + TILE - 5 + Math.sin(animTick * 3 + f) * 1, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (cell === "sand" && typeof drawSandTexture === "function") {
        drawSandTexture(ctx, x, y, col, row);
      }

      if (typeof drawBiomeTileOverlay === "function") {
        drawBiomeTileOverlay(ctx, biome, x, y, animTick, col, row);
      }
    }
  }
}

function shadeColor(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + Math.floor(amt * 40);
  let g = ((n >> 8) & 255) + Math.floor(amt * 40);
  let b = (n & 255) + Math.floor(amt * 40);
  r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
  return `rgb(${r},${g},${b})`;
}

function drawTree(x, y) {
  const sway = Math.sin(animTick * 1.5 + x * 0.015) * 0.04;
  const cx = x + TILE / 2;
  ctx.save();
  ctx.translate(cx, y + TILE * 0.55);
  ctx.rotate(sway);
  ctx.translate(-cx, -(y + TILE * 0.55));

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(cx + 4, y + TILE * 0.88, TILE * 0.3, TILE * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  const trunkG = ctx.createLinearGradient(x + TILE * 0.36, y + TILE * 0.45, x + TILE * 0.64, y + TILE);
  trunkG.addColorStop(0, "#6d4c41");
  trunkG.addColorStop(0.4, "#5d4037");
  trunkG.addColorStop(0.8, "#3e2723");
  trunkG.addColorStop(1, "#2e1a12");
  ctx.fillStyle = trunkG;
  ctx.beginPath();
  ctx.moveTo(x + TILE * 0.42, y + TILE * 0.5);
  ctx.lineTo(x + TILE * 0.58, y + TILE * 0.5);
  ctx.lineTo(x + TILE * 0.54, y + TILE * 0.88);
  ctx.lineTo(x + TILE * 0.46, y + TILE * 0.88);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(40,25,15,0.35)";
  ctx.lineWidth = 0.8;
  for (let r = 0; r < 5; r++) {
    ctx.beginPath();
    ctx.moveTo(x + TILE * 0.44, y + TILE * (0.54 + r * 0.07));
    ctx.lineTo(x + TILE * 0.56, y + TILE * (0.54 + r * 0.07));
    ctx.stroke();
  }

  ctx.strokeStyle = "#4e342e";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, y + TILE * 0.52);
  ctx.lineTo(cx - 8, y + TILE * 0.38);
  ctx.moveTo(cx, y + TILE * 0.56);
  ctx.lineTo(cx + 10, y + TILE * 0.42);
  ctx.stroke();

  const layers = [
    { cx: cx, cy: y + TILE * 0.32, rx: TILE * 0.36, ry: TILE * 0.3, light: "#5a9848", mid: "#2e6b28", dark: "#1a4018" },
    { cx: cx - 12, cy: y + TILE * 0.22, rx: TILE * 0.26, ry: TILE * 0.22, light: "#6aaa58", mid: "#3a7832", dark: "#1e4818" },
    { cx: cx + 14, cy: y + TILE * 0.18, rx: TILE * 0.22, ry: TILE * 0.2, light: "#72b060", mid: "#408838", dark: "#225020" },
    { cx: cx + 2, cy: y + TILE * 0.12, rx: TILE * 0.18, ry: TILE * 0.16, light: "#80c070", mid: "#489840", dark: "#286028" },
  ];
  layers.forEach((L) => {
    const grd = ctx.createRadialGradient(L.cx - L.rx * 0.25, L.cy - L.ry * 0.3, 2, L.cx, L.cy, L.rx);
    grd.addColorStop(0, L.light);
    grd.addColorStop(0.45, L.mid);
    grd.addColorStop(1, L.dark);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(L.cx, L.cy, L.rx, L.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx - 8, y + TILE * 0.14, TILE * 0.1, TILE * 0.06, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(cx + 10, y + TILE * 0.28, TILE * 0.12, TILE * 0.06, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRock(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x + TILE / 2 + 3, y + TILE * 0.74, TILE * 0.32, TILE * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  const grd = ctx.createLinearGradient(x + TILE * 0.2, y + TILE * 0.35, x + TILE * 0.8, y + TILE * 0.75);
  grd.addColorStop(0, "#bdbdbd");
  grd.addColorStop(0.45, "#757575");
  grd.addColorStop(1, "#424242");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(x + TILE * 0.22, y + TILE * 0.62);
  ctx.lineTo(x + TILE * 0.35, y + TILE * 0.42);
  ctx.lineTo(x + TILE * 0.55, y + TILE * 0.38);
  ctx.lineTo(x + TILE * 0.78, y + TILE * 0.48);
  ctx.lineTo(x + TILE * 0.72, y + TILE * 0.68);
  ctx.lineTo(x + TILE * 0.45, y + TILE * 0.72);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + TILE * 0.38, y + TILE * 0.44);
  ctx.lineTo(x + TILE * 0.52, y + TILE * 0.58);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.ellipse(x + TILE * 0.4, y + TILE * 0.46, TILE * 0.09, TILE * 0.05, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(x + TILE * 0.6, y + TILE * 0.62, TILE * 0.12, TILE * 0.05, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater(x, y, col, row) {
  ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.sin(animTick * 2 + col + row) * 0.05})`;
  ctx.fillRect(x, y + TILE * 0.3, TILE, TILE * 0.15);
}

function drawLava(x, y) {
  const pulse = Math.sin(animTick * 4 + x * 0.1);
  ctx.fillStyle = `rgba(255,120,0,${0.2 + pulse * 0.1})`;
  ctx.beginPath();
  ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,235,59,${0.5 + Math.sin(animTick * 5 + x) * 0.2})`;
  ctx.beginPath();
  ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "#ff5722";
  ctx.shadowBlur = 8;
  ctx.fillStyle = `rgba(255,152,0,${0.3 + pulse * 0.15})`;
  ctx.beginPath();
  ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPlants() {
  const { minRow, maxRow, minCol, maxCol } = visibleTileRange();
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (state.mapGrid[row][col] !== "plant") continue;
      const x = col * TILE + TILE / 2;
      const y = row * TILE + TILE / 2;
      const searched = isPlantSearched(row, col);
      const near = !searched && isNearPlayer(row, col);
      const sway = Math.sin(animTick * 2 + col) * 2;

      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(x, y + 10, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (near) {
        ctx.strokeStyle = "rgba(255,235,59,0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, TILE * 0.38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (searched) {
        ctx.fillStyle = "#689f38";
        ctx.fillRect(x - 8, y + 6, 16, 5);
        ctx.fillStyle = "#558b2f";
        ctx.fillRect(x - 3, y + 2, 6, 6);
      } else {
        ctx.fillStyle = "#33691e";
        ctx.fillRect(x - 2 + sway * 0.1, y + 6, 3, 16);
        ctx.fillRect(x + 1 + sway * 0.1, y + 8, 3, 12);
        ctx.fillStyle = "#558b2f";
        ctx.beginPath();
        ctx.moveTo(x - 1 + sway * 0.1, y + 8);
        ctx.lineTo(x + 2 + sway * 0.1, y + 4);
        ctx.lineTo(x + 5 + sway * 0.1, y + 8);
        ctx.fill();
        for (let b = -1; b <= 1; b++) {
          const bx = x + b * 10 + sway * 0.15;
          const by = y - 2 + b * 2;
          const bushGrd = ctx.createRadialGradient(bx - 3, by - 6, 1, bx, by - 4, 11);
          bushGrd.addColorStop(0, "#aed581");
          bushGrd.addColorStop(0.45, "#689f38");
          bushGrd.addColorStop(1, "#33691e");
          ctx.fillStyle = bushGrd;
          ctx.beginPath();
          ctx.arc(bx, by - 4, 9 + (b === 0 ? 2 : 0), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.arc(bx - 3, by - 7, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawSigns() {
  const mid = Math.floor(MAP_SIZE * 0.55);
  const center = Math.floor(MAP_SIZE / 2);
  const signs = state.currentWorld === 2 ? [
    { row: Math.floor(MAP_SIZE * 0.05), col: center, text: "ICE", color: "#0288d1" },
    { row: Math.floor(MAP_SIZE * 0.25), col: center, text: "STORM", color: "#546e7a" },
    { row: mid, col: Math.floor(MAP_SIZE * 0.2), text: "MAD GREEN", color: "#33691e" },
    { row: Math.floor(MAP_SIZE * 0.85), col: center, text: "LAVA", color: "#bf360c" },
  ] : [
    { row: mid, col: Math.floor(MAP_SIZE * 0.2), text: "FOREST", color: "#2e7d32" },
    { row: mid, col: Math.floor(MAP_SIZE * 0.55), text: "OCEAN", color: "#1565c0" },
    { row: Math.floor(MAP_SIZE * 0.85), col: center, text: "VOLCANO", color: "#e65100" },
    { row: Math.floor(MAP_SIZE * 0.25), col: center, text: "SKY", color: "#0288d1" },
  ];
  signs.forEach((s) => {
    const x = s.col * TILE + TILE / 2;
    const y = s.row * TILE + TILE / 2;
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 24, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const postG = ctx.createLinearGradient(x - 4, y + 6, x + 4, y + 24);
    postG.addColorStop(0, "#8d6e63");
    postG.addColorStop(0.45, "#6d4c41");
    postG.addColorStop(1, "#4e342e");
    ctx.fillStyle = postG;
    ctx.fillRect(x - 4, y + 6, 8, 20);
    ctx.strokeStyle = "rgba(40,25,15,0.35)";
    ctx.lineWidth = 0.8;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 10 + r * 4);
      ctx.lineTo(x + 3, y + 10 + r * 4);
      ctx.stroke();
    }

    const boardG = ctx.createLinearGradient(x - 36, y - 18, x + 36, y + 10);
    boardG.addColorStop(0, shadeColor(s.color, 0.15));
    boardG.addColorStop(0.4, s.color);
    boardG.addColorStop(1, shadeColor(s.color, -0.12));
    ctx.fillStyle = boardG;
    ctx.beginPath();
    ctx.roundRect(x - 36, y - 18, 72, 30, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x - 32, y - 14, 64, 8);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x - 34, y + 6, 68, 3);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 2;
    ctx.fillText(s.text, x, y + 2);
    ctx.shadowBlur = 0;
  });
}

function drawGyms() {
  if (state.currentWorld !== 1 || typeof GYM_LEADERS === "undefined") return;
  GYM_LEADERS.forEach((g) => {
    const x = g.col * TILE + TILE / 2;
    const y = g.row * TILE + TILE / 2;
    const beaten = state.gymsBeaten?.includes(g.id);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    const baseG = ctx.createLinearGradient(x - 32, y + 2, x + 32, y + 18);
    baseG.addColorStop(0, beaten ? "#bdbdbd" : "#ffb74d");
    baseG.addColorStop(0.5, beaten ? "#9e9e9e" : "#ef6c00");
    baseG.addColorStop(1, beaten ? "#757575" : "#e65100");
    ctx.fillStyle = baseG;
    ctx.beginPath();
    ctx.moveTo(x - 32, y + 16);
    ctx.lineTo(x + 32, y + 16);
    ctx.lineTo(x + 28, y + 6);
    ctx.lineTo(x - 28, y + 6);
    ctx.closePath();
    ctx.fill();

    const colG = ctx.createLinearGradient(x - 22, y - 6, x - 18, y + 14);
    colG.addColorStop(0, beaten ? "#eceff1" : "#fff3e0");
    colG.addColorStop(1, beaten ? "#b0bec5" : "#ffcc80");
    ctx.fillStyle = colG;
    ctx.fillRect(x - 24, y - 6, 8, 22);
    ctx.fillRect(x + 16, y - 6, 8, 22);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x - 24, y - 6, 8, 22);
    ctx.strokeRect(x + 16, y - 6, 8, 22);

    const roofG = ctx.createLinearGradient(x - 34, y - 18, x, y - 4);
    roofG.addColorStop(0, beaten ? "#cfd8dc" : "#ffe0b2");
    roofG.addColorStop(1, beaten ? "#78909c" : "#ff9800");
    ctx.fillStyle = roofG;
    ctx.beginPath();
    ctx.moveTo(x - 34, y - 4);
    ctx.lineTo(x, y - 18);
    ctx.lineTo(x + 34, y - 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = beaten ? "#616161" : "#bf360c";
    ctx.beginPath();
    ctx.arc(x, y + 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.arc(x, y + 6, 8, 0, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 2;
    ctx.fillText(beaten ? "DONE" : "GYM", x, y + 2);
    ctx.shadowBlur = 0;
  });
  if (!state.bossBeaten && typeof BOSS_DRAGON !== "undefined") {
    const x = BOSS_DRAGON.col * TILE + TILE / 2;
    const y = BOSS_DRAGON.row * TILE + TILE / 2;
    const pulse = 1 + Math.sin(animTick * 3) * 0.08;
    ctx.fillStyle = "rgba(183,28,28,0.35)";
    ctx.beginPath();
    ctx.arc(x, y, 24 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b71c1c";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ef5350";
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOSS", x, y + 3);
  }
}

function drawZoneLabels() {
  const center = Math.floor(MAP_SIZE / 2);
  const mid = Math.floor(MAP_SIZE * 0.55);
  const zones = state.currentWorld === 2 ? [
    { row: Math.floor(MAP_SIZE * 0.05), col: center, label: "ICE LANDS" },
    { row: Math.floor(MAP_SIZE * 0.25), col: center, label: "HURRICANE" },
    { row: mid, col: Math.floor(MAP_SIZE * 0.1), label: "MAD GREEN" },
    { row: mid, col: center, label: "CRYSTAL RIFT" },
    { row: Math.floor(MAP_SIZE * 0.85), col: center, label: "LAVA PITS" },
  ] : [
    { row: Math.floor(MAP_SIZE * 0.05), col: center, label: "DARK CAVE" },
    { row: Math.floor(MAP_SIZE * 0.25), col: center, label: "SKY ISLAND" },
    { row: mid, col: Math.floor(MAP_SIZE * 0.1), label: "FOREST" },
    { row: mid, col: center, label: "PLAINS" },
    { row: mid, col: Math.floor(MAP_SIZE * 0.65), label: "OCEAN" },
    { row: Math.floor(MAP_SIZE * 0.85), col: center, label: "VOLCANO" },
  ];
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#000";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  zones.forEach((z) => {
    ctx.fillText(z.label, z.col * TILE + TILE / 2, z.row * TILE + TILE / 2);
  });
  ctx.globalAlpha = 1;
}

function drawMobEntity(mob) {
  const x = mob.x * TILE;
  const y = mob.y * TILE;
  const dist = Math.hypot(mob.x - state.playerFx, mob.y - state.playerFy);
  const aggro = dist < 3.5;

  if (aggro) {
    ctx.strokeStyle = "rgba(239,83,80,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, TILE * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ef5350";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", x, y - 24);
  }

  const bounce = Math.sin(animTick * 4 + mob.id) * 2;
  const squash = 1 + Math.sin(animTick * 5 + mob.id) * 0.08;
  drawShadow(x, y + bounce, 14);

  if (typeof drawBlob === "function") {
    drawBlob(ctx, x, y + bounce, 14, mob.animal.element, squash);
  }

  drawNameplate(x, y - 28 + bounce, `Wild ${mob.animal.name}`, aggro ? "#ef5350" : "#ab47bc");
}

function drawShadow(x, y, r, ox = 4, oy = 3) {
  const g = ctx.createRadialGradient(x + ox, y + r * 0.75 + oy, 1, x + ox, y + r * 0.75 + oy, r * 1.55);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(0.45, "rgba(0,0,0,0.2)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x + ox, y + r * 0.75 + oy, r * 1.25, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const x = state.playerFx * TILE;
  const y = state.playerFy * TILE;
  const pet = getEquippedPet();
  const bob = playerMoving ? Math.sin(walkPhase * 10) * 1.5 : 0;

  if (pet) {
    const px = x - playerFacing * 18;
    const py = y + 4 + bob;
    drawShadow(px, py, 10);
    if (typeof drawDragon === "function") {
      drawDragon(ctx, px, py, pet.element, 8, playerFacing, pet.stars || 1, pet.shiny, animTick * 2.5);
    }
  }

  drawShadow(x, y + bob, 12);
  if (typeof drawTrainer === "function") {
    drawTrainer(ctx, x, y + bob, playerFacing, walkPhase, playerMoving);
  }

  const trainerName = state.trainerName || "You";
  drawNameplate(x, y - 32 + bob, trainerName, "#42a5f5");
}

function drawWorldHUD() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(8, 8, 110, 28);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(state.currentWorld === 2 ? "🌌 World Two" : "🌾 World One", 16, 26);
  ctx.restore();
}

function drawNameplate(x, y, text, barColor) {
  ctx.font = "600 10px system-ui,sans-serif";
  const w = ctx.measureText(text).width + 14;
  ctx.fillStyle = "rgba(8,12,18,0.78)";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 12, w, 16, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = barColor;
  ctx.fillRect(x - w / 2 + 4, y + 4, w - 8, 2);
  ctx.fillStyle = "#eceff1";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y + 1);
}

function drawColorGrade(biome) {
  let tint = null;
  if (biome === "ocean") tint = ["rgba(0,60,120,0.14)", "rgba(0,30,60,0.06)", "rgba(0,0,0,0)"];
  else if (biome === "volcano" || biome === "lavazone") tint = ["rgba(255,80,0,0.16)", "rgba(60,15,0,0.08)", "rgba(0,0,0,0)"];
  else if (biome === "forest") tint = ["rgba(0,60,0,0.12)", "rgba(0,30,0,0.05)", "rgba(0,0,0,0)"];
  else if (biome === "ice") tint = ["rgba(180,210,240,0.14)", "rgba(80,120,160,0.06)", "rgba(0,0,0,0)"];
  else if (biome === "cave") tint = ["rgba(30,25,20,0.2)", "rgba(0,0,0,0.12)", "rgba(0,0,0,0)"];
  else tint = ["rgba(255,210,140,0.12)", "rgba(160,140,110,0.06)", "rgba(0,0,0,0)"];
  const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grd.addColorStop(0, tint[0]);
  grd.addColorStop(0.5, tint[1]);
  grd.addColorStop(1, tint[2]);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(0,0,0,0.015)";
  ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.2);
}

function drawVignette(biome) {
  const strength = biome === "cave" ? 0.38 : biome === "volcano" || biome === "lavazone" ? 0.28 : 0.22;
  const grd = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.height * 0.08,
    canvas.width / 2, canvas.height / 2, canvas.height * 0.88
  );
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(0.5, "rgba(0,0,0,0)");
  grd.addColorStop(0.82, `rgba(0,0,0,${strength * 0.45})`);
  grd.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderForest() {
  if (!canvas) initWorld();
  resizeCanvas();
}
