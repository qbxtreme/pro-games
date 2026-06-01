// Meme Car — like All Out Meme Car
// Collect meme cars · Solo race for money · PVP with blasters

const SAVE_KEY = "memeCarRaceSave";
const LANES = [-1, 1];
const LANE_W = 100;
const ROAD_HALF = LANE_W * 1.2;

const WORLDS = {
  oasis: {
    id: "oasis", name: "Desert Oasis", emoji: "🏜️",
    sky: ["#1e88e5", "#64b5f6", "#ffb74d"],
    road: "#8b7355", roadEdge: "#6d4c41", lane: "rgba(255,248,220,0.45)",
    decor: "oasis", obstacleTypes: ["cactus", "rock"],
    jumpLabel: "Easy jumps",
    jumpStartGap: 55, jumpGapGrowth: 18, jumpMinSpeed: 130, jumpInterval: 420,
  },
  steampunk: {
    id: "steampunk", name: "Steampunk", emoji: "⚙️",
    sky: ["#37474f", "#8d6e63", "#ffb300"],
    road: "#4e342e", roadEdge: "#bf8c30", lane: "rgba(255,215,0,0.38)",
    decor: "steam", obstacleTypes: ["gear", "pipe"],
    jumpLabel: "Hard jumps",
    jumpStartGap: 85, jumpGapGrowth: 30, jumpMinSpeed: 175, jumpInterval: 360,
  },
  cyber: {
    id: "cyber", name: "Cyber City", emoji: "🌃",
    sky: ["#050010", "#120028", "#4a0080"],
    road: "#141428", roadEdge: "#00e5ff", lane: "rgba(0,229,255,0.5)",
    decor: "cyber", obstacleTypes: ["laser", "drone"],
    jumpLabel: "Hardest jumps!",
    jumpStartGap: 115, jumpGapGrowth: 42, jumpMinSpeed: 220, jumpInterval: 300,
  },
  volcano: {
    id: "volcano", name: "Lava Loop", emoji: "🌋",
    sky: ["#1a0500", "#4a1500", "#ff6f00"],
    road: "#3e2723", roadEdge: "#ff5722", lane: "rgba(255,112,67,0.45)",
    decor: "volcano", obstacleTypes: ["rock", "lava"],
    jumpLabel: "Extreme jumps!",
    jumpStartGap: 130, jumpGapGrowth: 48, jumpMinSpeed: 240, jumpInterval: 280,
  },
};

const MEME_CARS = [
  { id: "rizz", name: "Rizz Rod", emoji: "😎", price: 0, speed: 1, colors: ["#42a5f5", "#1565c0"], meme: "rizz" },
  { id: "skibidi", name: "Skibidi Mobile", emoji: "🚽", price: 500, speed: 1.15, colors: ["#8d6e63", "#5d4037"], meme: "skibidi" },
  { id: "sigma", name: "Sigma Drift", emoji: "🗿", price: 1500, speed: 1.28, colors: ["#78909c", "#455a64"], meme: "sigma" },
  { id: "toilet", name: "Toilet Turbo", emoji: "🧻", price: 4000, speed: 1.4, colors: ["#fff", "#bdbdbd"], meme: "toilet" },
  { id: "fanum", name: "Fanum Tax GT", emoji: "🍔", price: 7500, speed: 1.48, colors: ["#ff7043", "#bf360c"], meme: "rizz" },
  { id: "gigachad", name: "Gigachad GT", emoji: "💪", price: 10000, speed: 1.55, colors: ["#ef5350", "#b71c1c"], meme: "gigachad" },
  { id: "ohio", name: "Ohio Express", emoji: "🌽", price: 25000, speed: 1.75, colors: ["#ffeb3b", "#f57f17"], meme: "ohio" },
  { id: "grimace", name: "Grimace Shake", emoji: "🟣", price: 50000, speed: 1.9, colors: ["#7b1fa2", "#4a148c"], meme: "sigma" },
];

const BOT_NAMES = ["Noob", "MemeLord", "SkibidiFan", "SigmaBoy", "RizzKing", "OhioFinalBoss", "FanumTaxer"];

let canvas, ctx, wrap;
let screen = "menu";
let currentWorld = "oasis";
let lastMode = "solo";
let keys = {};
let loopId = null;
let pineTreeImg = null;
let pineTreeReady = false;
let renderTime = 0;

let save = { money: 0, owned: ["rizz"], selected: "rizz", bestSolo: 0, pvpWins: 0 };
let race = null;

function defaultSave() {
  return { money: 0, owned: ["rizz"], selected: "rizz", bestSolo: 0, pvpWins: 0 };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = { ...defaultSave(), ...JSON.parse(raw) };
  } catch (_) {}
}

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function getCar(id) {
  return MEME_CARS.find((c) => c.id === id) || MEME_CARS[0];
}

function getSelectedCar() {
  return getCar(save.selected);
}

function getWorld(id) {
  return WORLDS[id] || WORLDS.oasis;
}

function updateHud() {
  document.getElementById("money-display").textContent = `💰 ${save.money.toLocaleString()}`;
  document.getElementById("car-name-display").textContent = `Driving: ${getSelectedCar().name}`;
  document.getElementById("best-solo-display").textContent = `🏁 Best: ${save.bestSolo.toLocaleString()} m`;
  document.getElementById("pvp-wins-display").textContent = `🏆 Wins: ${save.pvpWins}`;
  const modes = {
    menu: "Lobby", solo: "Solo Race", pvp: "PVP Race", garage: "Garage", result: "Race Over",
  };
  document.getElementById("mode-display").textContent = modes[screen] || "Meme Car";
}

function showScreen(name) {
  screen = name;
  document.getElementById("app")?.classList.toggle("playing", name === "solo" || name === "pvp");
  document.getElementById("menu-screen").classList.toggle("hidden", name !== "menu");
  document.getElementById("garage-screen").classList.toggle("hidden", name !== "garage");
  document.getElementById("result-screen").classList.toggle("hidden", name !== "result");
  document.getElementById("race-hud").classList.toggle("hidden", name !== "solo" && name !== "pvp");
  document.getElementById("fire-btn").classList.toggle("hidden", name !== "pvp");
  document.getElementById("lives-display").classList.toggle("hidden", name !== "solo");
  document.getElementById("hp-display").classList.toggle("hidden", name !== "pvp");
  document.getElementById("rank-display").classList.toggle("hidden", name !== "pvp");
  document.getElementById("steer-pad").classList.toggle("hidden", name !== "solo" && name !== "pvp");
  updateHud();
}

function getJumpConfig(worldId) {
  const w = getWorld(worldId);
  return {
    startGap: w.jumpStartGap,
    gapGrowth: w.jumpGapGrowth,
    minSpeed: w.jumpMinSpeed,
    interval: w.jumpInterval,
  };
}

function initJumpState(worldId) {
  const j = getJumpConfig(worldId);
  return {
    jumpsCleared: 0,
    gapWidth: j.startGap,
    nextGapDist: j.interval,
    jumping: false,
    jumpY: 0,
    jumpVY: 0,
    gapPhase: "none",
    flashMsg: "",
    flashTimer: 0,
  };
}

function minSpeedForGap(r) {
  const j = getJumpConfig(r.world);
  return j.minSpeed + r.gapWidth * 1.15;
}

function createSoloRace() {
  const car = getSelectedCar();
  return {
    mode: "solo", world: currentWorld,
    lane: -1, targetLane: -1, laneT: 0,
    dist: 0, speed: 220 * car.speed, maxSpeed: 420 * car.speed,
    scroll: 0, obstacles: [], pickups: [],
    spawnTimer: 0, pickupTimer: 0,
    lives: 3, invuln: 0, shake: 0, running: false, countdown: 3.5,
    sessionEarned: 0,
    boostTimer: 0, slowTimer: 0,
    particles: [], speedLines: 0,
    ...initJumpState(currentWorld),
  };
}

function createPvpRace() {
  const car = getSelectedCar();
  return {
    mode: "pvp", world: currentWorld,
    lane: -1, targetLane: -1, laneT: 0,
    dist: 0, lap: 1, laps: 3, lapLen: 2800,
    speed: 240 * car.speed, scroll: 0,
    bots: [
      { name: BOT_NAMES[0], lane: -1, dist: -120, hp: 2, fireCd: 0.5, car: MEME_CARS[1] },
      { name: BOT_NAMES[2], lane: 1, dist: -80, hp: 2, fireCd: 0.8, car: MEME_CARS[2] },
      { name: BOT_NAMES[4], lane: -1, dist: -40, hp: 2, fireCd: 1.1, car: MEME_CARS[3] },
      { name: BOT_NAMES[6], lane: 1, dist: -160, hp: 2, fireCd: 0.3, car: MEME_CARS[4] },
    ],
    shots: [], fireCd: 0, rank: 1, playerHp: 2, playerInvuln: 0,
    running: false, finishTimer: 0, shake: 0, countdown: 3.5,
    boostTimer: 0, particles: [], speedLines: 0,
    ...initJumpState(currentWorld),
  };
}

function startRace(mode) {
  lastMode = mode;
  window.GameSFX?.play("start");
  race = mode === "pvp" ? createPvpRace() : createSoloRace();
  race.remoteRacers = [];
  document.getElementById("world-badge").textContent = getWorld(currentWorld).emoji;
  document.getElementById("countdown-overlay").classList.remove("hidden");
  showScreen(mode);
  if (typeof GameMP !== "undefined") {
    GameMP.setSubroom(`${currentWorld}-${mode}`);
    if (typeof markGameMpCustom === "function") markGameMpCustom();
    GameMP.init({
      game: "meme-car-race",
      subroom: `${currentWorld}-${mode}`,
      getName: () => getSelectedCar().name + " Driver",
      getState: getMemeCarMpState,
      onPeers: syncMemeCarPeers,
    });
    GameMP.start();
  }
}

function getMemeCarMpState() {
  if (!race?.running) return { active: false };
  const st = {
    active: true,
    mode: race.mode,
    world: race.world,
    lane: race.lane,
    dist: race.dist,
    hp: race.playerHp ?? race.lives ?? 3,
    carId: save.selected,
    jumping: race.jumping,
    jumpY: race.jumpY || 0,
  };
  if (race.lastMpShot) {
    st.shot = race.lastMpShot;
    race.lastMpShot = null;
  }
  return st;
}

function syncMemeCarPeers(peers) {
  if (!race) return;
  race.remoteRacers = peers
    .filter((p) => p.state?.active !== false)
    .map((p) => {
      const st = p.state || {};
      return {
        id: p.id,
        name: p.name || "Rival",
        lane: st.lane ?? -1,
        dist: st.dist ?? 0,
        hp: st.hp ?? 2,
        car: getCar(st.carId),
        jumping: !!st.jumping,
        jumpY: st.jumpY || 0,
      };
    });

  if (race.mode === "pvp") {
    const botTarget = Math.max(0, 4 - race.remoteRacers.length);
    while (race.bots.length > botTarget) race.bots.pop();
    while (race.bots.length < botTarget) {
      const i = race.bots.length;
      race.bots.push({
        name: BOT_NAMES[i % BOT_NAMES.length],
        lane: i % 2 ? 1 : -1,
        dist: -100 - i * 40,
        hp: 2,
        fireCd: 0.5,
        car: MEME_CARS[(i + 1) % MEME_CARS.length],
      });
    }
  }

  peers.forEach((p) => {
    const st = p.state || {};
    if (st.shot && st.shot.time && st.shot.time > (race.lastSeenShots?.[p.id] || 0)) {
      if (!race.lastSeenShots) race.lastSeenShots = {};
      race.lastSeenShots[p.id] = st.shot.time;
      const h = canvas.height;
      race.shots.push({
        lane: st.shot.lane,
        y: h - 110 - (race.dist - (st.dist || 0)) * 0.09 - 30,
        vy: 420,
        hostile: true,
      });
    }
  });
}

function updateCountdown(dt) {
  if (!race || race.running) return;

  // Allow lane changes while waiting for GO
  race.laneT += (race.targetLane - race.lane) * 8 * dt;
  if (Math.abs(race.laneT) > 0.02) { race.lane += race.laneT; race.laneT *= 0.85; }
  else { race.lane = race.targetLane; race.laneT = 0; }
  clampLane(race);

  race.countdown -= dt;
  const el = document.getElementById("countdown-text");
  if (race.countdown > 0) {
    el.textContent = String(Math.ceil(race.countdown));
  } else if (race.countdown > -0.5) {
    el.textContent = "GO!";
  } else {
    race.countdown = 0;
    race.running = true;
    document.getElementById("countdown-overlay").classList.add("hidden");
  }
}

function laneX(lane, w, h, y) {
  h = h || canvas?.height || 600;
  y = y ?? h - 110;
  const horizonY = h * 0.3;
  const t = Math.max(0, Math.min(1, (y - horizonY) / (h - horizonY)));
  const half = w * 0.1 + (ROAD_HALF - w * 0.1) * t;
  return w / 2 + lane * half * 0.82;
}

function roadHalfAtY(w, h, y) {
  const horizonY = h * 0.3;
  const t = Math.max(0, Math.min(1, (y - horizonY) / (h - horizonY)));
  return w * 0.1 + (ROAD_HALF - w * 0.1) * t;
}

function spawnParticle(r, x, y, type, extra = {}) {
  if (!r.particles) r.particles = [];
  r.particles.push({
    x, y,
    vx: extra.vx ?? (Math.random() - 0.5) * 30,
    vy: extra.vy ?? (type === "exhaust" ? 40 + Math.random() * 30 : -15),
    life: extra.life ?? 0.35 + Math.random() * 0.35,
    type,
    size: extra.size ?? 2 + Math.random() * 4,
  });
}

function updateParticles(r, dt) {
  if (!r.particles) return;
  r.particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.type === "exhaust") p.size += dt * 2;
  });
  r.particles = r.particles.filter((p) => p.life > 0);
}

function emitDriveFX(r, dt) {
  if (!r.running || r.jumping) return;
  const w = canvas.width, h = canvas.height;
  const cx = laneX(r.lane, w, h, h - 110);
  const cy = h - 95 + (r.jumpY || 0);
  const speedRatio = r.speed / (r.maxSpeed || 420);
  const exhaustRate = 0.25 + speedRatio * 0.45;
  if (Math.random() < exhaustRate) {
    spawnParticle(r, cx + (Math.random() - 0.5) * 18, cy + 12, "exhaust", {
      vx: (Math.random() - 0.5) * 20,
      vy: 35 + speedRatio * 40,
      size: 2 + speedRatio * 4,
    });
  }
  if (speedRatio > 0.55 && Math.random() < 0.2) {
    spawnParticle(r, cx + (Math.random() - 0.5) * 24, cy + 18, "dust", {
      vx: (Math.random() - 0.5) * 40,
      vy: 10 + Math.random() * 20,
      life: 0.4,
      size: 2 + Math.random() * 3,
    });
  }
  if (Math.abs(r.laneT) > 0.08 && speedRatio > 0.25 && Math.random() < 0.35) {
    spawnParticle(r, cx + r.laneT * 30, cy + 20, "skid", {
      vx: -r.laneT * 80,
      vy: 5 + Math.random() * 8,
      life: 0.55,
      size: 1.5 + speedRatio * 2,
    });
  }
  if (r.boostTimer > 0 && Math.random() < 0.55) {
    spawnParticle(r, cx, cy + 14, "boost", { vy: 50, life: 0.25, size: 3 });
    if (Math.random() < 0.3) {
      spawnParticle(r, cx + (Math.random() - 0.5) * 10, cy + 8, "spark", {
        vx: (Math.random() - 0.5) * 60,
        vy: -30 - Math.random() * 40,
        life: 0.15,
        size: 2,
      });
    }
  }
  r.speedLines = Math.min(1, speedRatio);
  updateParticles(r, dt);
}

function randomLane() {
  return LANES[Math.floor(Math.random() * LANES.length)];
}

function updateJumps(r, dt, onFail) {
  if (r.flashTimer > 0) r.flashTimer -= dt;

  const gapApproach = r.nextGapDist - r.dist;
  if (!r.jumping && gapApproach <= 120 && gapApproach > 0) {
    r.gapPhase = "approach";
  } else if (!r.jumping && gapApproach <= 0 && gapApproach > -30) {
    r.jumping = true;
    r.jumpVY = -14 - r.speed * 0.025;
    window.GameSFX?.play("jump");
    r.jumpY = 0;
    r.gapPhase = "jump";
  }

  if (!r.jumping) return;

  r.jumpY += r.jumpVY * dt * 60;
  r.jumpVY += 28 * dt;
  r.dist += r.speed * dt * 0.06;
  r.scroll += r.speed * dt * 0.8;

  if (r.jumpY >= 0 && r.jumpVY > 0) {
    r.jumpY = 0;
    r.jumping = false;
    const needed = minSpeedForGap(r);
    if (r.speed >= needed) {
      r.jumpsCleared++;
      const j = getJumpConfig(r.world);
      r.gapWidth += j.gapGrowth;
      r.nextGapDist = r.dist + j.interval + r.jumpsCleared * 35;
      r.gapPhase = "none";
      r.flashMsg = `🚀 Cleared! Next gap: ${Math.floor(r.gapWidth)}`;
      r.flashTimer = 1.8;
      r.shake = 0.2;
      const w = canvas.width, h = canvas.height;
      const lx = laneX(r.lane, w, h, h - 110);
      for (let i = 0; i < 8; i++) {
        spawnParticle(r, lx + (Math.random() - 0.5) * 40, h - 95, "dust", {
          vx: (Math.random() - 0.5) * 80, vy: -20 - Math.random() * 40, life: 0.5, size: 3 + Math.random() * 4,
        });
      }
    } else {
      r.shake = 0.5;
      onFail(needed);
    }
  }
}

function spawnObstacle(r) {
  const w = getWorld(r.world);
  const type = w.obstacleTypes[Math.floor(Math.random() * w.obstacleTypes.length)];
  r.obstacles.push({ lane: randomLane(), y: -40, type });
}

function spawnPickup(r) {
  const types = ["boost", "slow", "coin"];
  const type = types[Math.floor(Math.random() * types.length)];
  r.pickups.push({ lane: randomLane(), y: -40, type, used: false });
}

function endRace(title, msg, earned) {
  if (earned > 0) { save.money += earned; writeSave(); }
  const won = /win|🏆|🥇|1st/i.test(title);
  const lost = /fell|💥|fail|died|last/i.test(title);
  window.GameSFX?.play(won ? "win" : lost ? "lose" : earned > 0 ? "coin" : "tap");
  if (typeof GameMP !== "undefined") GameMP.stop();
  race.running = false;
  race.countdown = 0;
  document.getElementById("countdown-overlay").classList.add("hidden");
  document.getElementById("result-title").textContent = title;
  document.getElementById("result-msg").textContent = msg;
  document.getElementById("result-money").textContent = earned > 0 ? `+💰 ${earned.toLocaleString()}` : "";
  showScreen("result");
  updateHud();
}

function updateSolo(dt) {
  const r = race;
  r.laneT += (r.targetLane - r.lane) * 8 * dt;
  if (Math.abs(r.laneT) > 0.02) { r.lane += r.laneT; r.laneT *= 0.85; }
  else { r.lane = r.targetLane; r.laneT = 0; }
  clampLane(r);

  if (r.slowTimer > 0) r.slowTimer -= dt;
  if (r.boostTimer > 0) r.boostTimer -= dt;
  if (r.invuln > 0) r.invuln -= dt;

  if (!r.jumping) {
    let accel = 12;
    if (r.boostTimer > 0) accel = 22;
    if (r.slowTimer > 0) accel = 4;
    r.speed = Math.min(r.maxSpeed, r.speed + accel * dt);
    r.dist += r.speed * dt * 0.08;
    r.scroll += r.speed * dt;
    r.sessionEarned = Math.floor(r.dist / 8);
  }

  updateJumps(r, dt, (needed) => {
    const earned = Math.floor(r.dist / 8);
    if (r.dist > save.bestSolo) save.bestSolo = Math.floor(r.dist);
    writeSave();
    endRace("💥 Fell in the gap!", `Need ${Math.floor(needed * 0.35)} mph — ${getWorld(r.world).jumpLabel}`, earned);
  });

  if (!r.running) return;

  emitDriveFX(r, dt);

  r.spawnTimer -= dt;
  if (r.spawnTimer <= 0 && !r.jumping) {
    spawnObstacle(r);
    r.spawnTimer = Math.max(0.45, 1.4 - r.dist * 0.00008);
  }
  r.pickupTimer -= dt;
  if (r.pickupTimer <= 0 && !r.jumping) {
    spawnPickup(r);
    r.pickupTimer = 1.1;
  }

  r.obstacles.forEach((o) => { o.y += r.speed * dt * 0.9; });
  r.obstacles = r.obstacles.filter((o) => o.y < canvas.height + 60);
  r.pickups.forEach((p) => { p.y += r.speed * dt * 0.9; });
  r.pickups = r.pickups.filter((p) => p.y < canvas.height + 60);

  const py = canvas.height - 110 + r.jumpY;
  const px = laneX(r.lane, canvas.width, canvas.height, py);

  if (!r.jumping) {
    r.pickups.forEach((p) => {
      if (p.used) return;
      const tx = laneX(p.lane, canvas.width, canvas.height, p.y);
      if (Math.abs(p.y - py) < 45 && Math.abs(tx - px) < 45) {
        p.used = true;
        if (p.type === "boost") { r.boostTimer = 2; r.shake = 0.15; window.GameSFX?.play("coin"); }
        else if (p.type === "slow") { r.slowTimer = 1.5; }
        else { r.sessionEarned += 25; save.money += 25; writeSave(); updateHud(); }
      }
    });

    r.obstacles.forEach((o) => {
      const ox = laneX(o.lane, canvas.width, canvas.height, o.y);
      if (Math.abs(o.y - py) < 50 && Math.abs(ox - px) < 45 && r.invuln <= 0) {
        r.lives--; r.invuln = 1.2; r.shake = 0.4; r.speed *= 0.6; o.y = 9999;
        if (r.lives <= 0) {
          const earned = Math.floor(r.dist / 8);
          if (r.dist > save.bestSolo) save.bestSolo = Math.floor(r.dist);
          writeSave();
          endRace("💥 Wrecked!", `You drove ${Math.floor(r.dist)} m — keep racing to earn more!`, earned);
        }
      }
    });
  }
}

function fireBlaster() {
  const r = race;
  if (!r || r.mode !== "pvp" || r.fireCd > 0 || !r.running) return;
  window.GameSFX?.play("attack");
  r.fireCd = 0.35;
  r.shots.push({ lane: r.lane, y: canvas.height - 130, vy: -520, hostile: false });
  r.lastMpShot = { lane: r.lane, dist: r.dist, time: Date.now() };
}

function botFire(b, by) {
  const r = race;
  if (!r?.running || b.hp <= 0 || b.fireCd > 0) return;
  b.fireCd = 0.7 + Math.random() * 0.6;
  r.shots.push({ lane: b.lane, y: by - 30, vy: 420, hostile: true });
}

function updatePvp(dt) {
  const r = race;
  r.laneT += (r.targetLane - r.lane) * 9 * dt;
  if (Math.abs(r.laneT) > 0.02) { r.lane += r.laneT; r.laneT *= 0.85; }
  else { r.lane = r.targetLane; r.laneT = 0; }
  clampLane(r);

  if (r.boostTimer > 0) r.boostTimer -= dt;
  const spdMult = r.boostTimer > 0 ? 1.35 : 1;

  if (!r.jumping) {
    r.dist += r.speed * spdMult * dt * 0.09;
    r.scroll += r.speed * spdMult * dt;
  }

  updateJumps(r, dt, (needed) => {
    endRace("💥 Fell in the gap!", `Need ${Math.floor(needed * 0.35)} mph on ${getWorld(r.world).name}!`, 100);
  });
  if (!r.running) return;

  emitDriveFX(r, dt);

  if (r.fireCd > 0) r.fireCd -= dt;

  if (r.playerInvuln > 0) r.playerInvuln -= dt;

  r.bots.forEach((b) => {
    if (b.hp <= 0) return;
    b.dist += (r.speed * 0.88 + Math.random() * 20) * dt * 0.09;
    if (Math.random() < 0.025) b.lane = randomLane();
    if (b.fireCd > 0) b.fireCd -= dt;
    const by = canvas.height - 110 - (r.dist - b.dist) * 0.09;
    const gap = Math.abs(r.dist - b.dist);
    if (gap < 350 && gap > 30 && Math.abs(b.lane - r.lane) <= 1.2 && Math.random() < 0.018) {
      botFire(b, by);
    }
  });

  r.shots.forEach((s) => { s.y += s.vy * dt; });
  r.shots = r.shots.filter((s) => s.y > -20 && s.y < canvas.height + 40);

  const carY = canvas.height - 110 + (r.jumpY || 0);
  const px = laneX(r.lane, canvas.width, canvas.height, carY);

  r.shots.forEach((s) => {
    if (s.hostile) {
      if (Math.abs(s.y - carY) < 45 && Math.abs(laneX(s.lane, canvas.width, canvas.height, s.y) - px) < 42
          && r.playerInvuln <= 0 && !r.jumping) {
        s.y = 9999;
        r.playerHp--;
        r.playerInvuln = 1.2;
        r.shake = 0.35;
        r.speed *= 0.75;
        if (r.playerHp <= 0) {
          endRace("💥 Blasted!", "Your car got wrecked! Train in Solo mode.", 75);
        }
      }
      return;
    }
    r.bots.forEach((b) => {
      if (b.hp <= 0) return;
      const by = canvas.height - 110 - (r.dist - b.dist) * 0.09;
      const bx = laneX(b.lane, canvas.width, canvas.height, by);
      const sx = laneX(s.lane, canvas.width, canvas.height, s.y);
      if (Math.abs(sx - bx) < 40 && Math.abs(s.y - by) < 45) {
        b.hp--; s.y = -999;
        if (b.hp <= 0) r.shake = 0.3;
      }
    });
    (r.remoteRacers || []).forEach((rp) => {
      if (rp.hp <= 0) return;
      const ry = canvas.height - 110 - (r.dist - rp.dist) * 0.09;
      const rx = laneX(rp.lane, canvas.width, canvas.height, ry);
      const sx = laneX(s.lane, canvas.width, canvas.height, s.y);
      if (Math.abs(sx - rx) < 40 && Math.abs(s.y - ry) < 45) {
        rp.hp--; s.y = -999;
        if (rp.hp <= 0) r.shake = 0.3;
      }
    });
  });

  const playerPos = r.dist;
  const rivals = [
    ...r.bots.filter((b) => b.hp > 0).map((b) => b.dist),
    ...(r.remoteRacers || []).filter((rp) => rp.hp > 0).map((rp) => rp.dist),
  ];
  r.rank = [playerPos, ...rivals].sort((a, b) => b - a).indexOf(playerPos) + 1;

  if (r.dist >= r.lap * r.lapLen) {
    r.lap++;
    if (r.lap > r.laps) {
      r.finishTimer += dt;
      if (r.finishTimer > 0.5) finishPvp();
    }
  }
}

function finishPvp() {
  const r = race;
  let earned = 0, title = "Race Over!", msg = "";
  if (r.rank === 1) {
    earned = 1200 + Math.floor(r.dist / 5);
    save.pvpWins++;
    title = "🏆 YOU WIN!";
    msg = "You blasted the competition! Big payout!";
  } else if (r.rank === 2) { earned = 500; title = "🥈 2nd Place"; msg = "Good race — keep blasting!"; }
  else if (r.rank === 3) { earned = 250; title = "🥉 3rd Place"; msg = "Not bad. Upgrade your car!"; }
  else { earned = 100; title = "4th Place"; msg = "Train in Solo mode first!"; }
  writeSave();
  endRace(title, msg, earned);
}

function horizonY(h) { return h * 0.28; }

function perspT(h, y) {
  const hy = horizonY(h);
  return Math.max(0, Math.min(1, (y - hy) / (h - hy)));
}

function perspScale(h, y) {
  return 0.25 + perspT(h, y) * 0.75;
}

function drawSky(w, h, world) {
  const hy = horizonY(h);
  const t = renderTime * 0.001;
  const isNight = world.decor === "cyber" || world.decor === "volcano";
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, world.sky[0]);
  g.addColorStop(0.45, world.sky[1]);
  g.addColorStop(0.85, world.sky[2]);
  g.addColorStop(1, shadeColor(world.sky[2], -30));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (isNight) {
    for (let i = 0; i < 120; i++) {
      const sx = (i * 97 + 13) % w;
      const sy = (i * 53 + 7) % Math.floor(hy * 0.92);
      const tw = 0.35 + Math.sin(t * 2 + i * 0.7) * 0.25;
      ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 5) * 0.018 + tw * 0.02})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + (i % 3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const sunX = w * 0.74;
  const sunY = hy * 0.32;
  const sunG = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 120);
  if (world.decor === "cyber") {
    sunG.addColorStop(0, "rgba(255,0,255,0.95)");
    sunG.addColorStop(0.25, "rgba(120,0,200,0.45)");
    sunG.addColorStop(0.55, "rgba(0,80,160,0.15)");
    sunG.addColorStop(1, "rgba(0,0,0,0)");
  } else if (world.decor === "steam") {
    sunG.addColorStop(0, "rgba(255,220,140,0.95)");
    sunG.addColorStop(0.35, "rgba(255,160,60,0.35)");
    sunG.addColorStop(0.7, "rgba(120,80,40,0.08)");
    sunG.addColorStop(1, "rgba(0,0,0,0)");
  } else if (world.decor === "volcano") {
    sunG.addColorStop(0, "rgba(255,120,40,0.95)");
    sunG.addColorStop(0.35, "rgba(255,60,0,0.4)");
    sunG.addColorStop(0.7, "rgba(80,20,0,0.12)");
    sunG.addColorStop(1, "rgba(0,0,0,0)");
  } else {
    sunG.addColorStop(0, "rgba(255,250,210,0.98)");
    sunG.addColorStop(0.3, "rgba(255,210,100,0.35)");
    sunG.addColorStop(0.65, "rgba(255,180,80,0.08)");
    sunG.addColorStop(1, "rgba(0,0,0,0)");
  }
  ctx.fillStyle = sunG;
  ctx.fillRect(sunX - 130, sunY - 130, 260, 260);

  drawLensFlare(sunX, sunY, world);

  if (world.decor !== "cyber" && world.decor !== "volcano") {
    ctx.fillStyle = "rgba(255,255,240,0.98)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.arc(sunX - 30, sunY + 10, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 55; i++) {
    const sx = (i * 113 + t * 40) % (w + 20) - 10;
    const sy = (i * 67) % Math.floor(hy * 0.85);
    ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 4) * 0.015})`;
    ctx.fillRect(sx, sy, 1 + (i % 2), 1);
  }

  for (let c = 0; c < 8; c++) {
    const cx = (c * 210 + t * 18) % (w + 140) - 70;
    const cy = hy * 0.12 + (c % 3) * 22 + Math.sin(t + c) * 8;
    const cw = 50 + (c % 3) * 18;
    const ch = 14 + (c % 2) * 4;
    ctx.fillStyle = world.decor === "cyber"
      ? `rgba(180,80,255,${0.06 + (c % 2) * 0.04})`
      : `rgba(255,255,255,${0.07 + (c % 2) * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cw * 0.55, cy + 6, cw * 0.65, ch * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - cw * 0.2, cy + 3, cw * 0.4, ch * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const rayG = ctx.createLinearGradient(sunX, sunY, w * 0.5, hy);
  rayG.addColorStop(0, world.decor === "cyber" ? "rgba(180,0,255,0.06)" : "rgba(255,220,150,0.07)");
  rayG.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rayG;
  ctx.fillRect(0, 0, w, hy);

  ctx.fillStyle = world.decor === "cyber"
    ? "rgba(80,0,140,0.12)"
    : world.decor === "steam"
      ? "rgba(255,180,80,0.08)"
      : world.decor === "volcano"
        ? "rgba(255,80,20,0.1)"
        : "rgba(255,200,120,0.06)";
  ctx.fillRect(0, hy - 3, w, h - hy + 3);

  const haze = ctx.createLinearGradient(0, h - 100, 0, h);
  haze.addColorStop(0, "rgba(0,0,0,0)");
  haze.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, h - 100, w, 100);
}

function loadPineTreeImage() {
  pineTreeImg = new Image();
  pineTreeImg.onload = () => {
    pineTreeReady = pineTreeImg.naturalWidth > 0;
  };
  pineTreeImg.onerror = () => {
    pineTreeReady = false;
  };
  pineTreeImg.src = "assets/images/pinetree.png";
}

function drawPineTree(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  if (pineTreeReady && pineTreeImg) {
    const h = 150 * scale;
    const w = (pineTreeImg.naturalWidth / pineTreeImg.naturalHeight) * h;
    ctx.drawImage(pineTreeImg, -w / 2, -h, w, h);
  } else {
    ctx.scale(scale, scale);
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(-4, -40, 8, 40);
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.lineTo(-28, -10);
    ctx.lineTo(28, -10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSmokestack(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const g = ctx.createLinearGradient(-10, 0, 10, 0);
  g.addColorStop(0, "#5a3d1e");
  g.addColorStop(0.5, "#cd7f32");
  g.addColorStop(1, "#4e342e");
  ctx.fillStyle = g;
  ctx.fillRect(-10, 0, 20, 58);
  for (let b = 0; b < 8; b++) {
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.moveTo(-10, 6 + b * 7);
    ctx.lineTo(10, 6 + b * 7);
    ctx.stroke();
  }
  ctx.fillStyle = "#757575";
  ctx.beginPath();
  ctx.arc(0, -5, 11, 0, Math.PI * 2);
  ctx.fill();
  const smokeT = Date.now() * 0.003;
  for (let s = 0; s < 3; s++) {
    ctx.fillStyle = `rgba(200,200,200,${0.18 - s * 0.05})`;
    ctx.beginPath();
    ctx.arc(6 + s * 4, -20 - s * 14 - Math.sin(smokeT + s) * 5, 9 + s * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCyberBuilding(bx, by, bw, bh, i) {
  const winColor = i % 3 === 0 ? "#ff00ff" : i % 3 === 1 ? "#00ffff" : "#ffff00";
  const bg = ctx.createLinearGradient(bx, by, bx, by + bh);
  bg.addColorStop(0, "#1a1030");
  bg.addColorStop(1, "#0a0018");
  ctx.fillStyle = bg;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = "rgba(0,229,255,0.15)";
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = winColor;
  ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.003 + i * 0.7) * 0.2;
  for (let r = 0; r < Math.floor(bh / 12); r++) {
    for (let c = 0; c < Math.max(1, Math.floor(bw / 10)); c++) {
      if ((r + c + i) % 3 !== 0) continue;
      ctx.fillRect(bx + 3 + c * 9, by + 4 + r * 12, 5, 6);
    }
  }
  ctx.globalAlpha = 1;
  const glow = ctx.createLinearGradient(bx, by + bh, bx, by + bh + 20);
  glow.addColorStop(0, `${winColor}33`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(bx - 4, by + bh, bw + 8, 24);
}

function drawSideTerrain(w, h, scroll, world) {
  const hy = horizonY(h);
  drawDistantMountains(w, h, scroll, world);
  const sideGrad = ctx.createLinearGradient(0, hy, 0, h);
  if (world.decor === "oasis") {
    sideGrad.addColorStop(0, "#a89050");
    sideGrad.addColorStop(0.4, "#c4a35a");
    sideGrad.addColorStop(1, "#e8d088");
  } else if (world.decor === "steam") {
    sideGrad.addColorStop(0, "#2a2018");
    sideGrad.addColorStop(0.5, "#4a3828");
    sideGrad.addColorStop(1, "#6a5840");
  } else if (world.decor === "volcano") {
    sideGrad.addColorStop(0, "#3e2723");
    sideGrad.addColorStop(0.5, "#5d4037");
    sideGrad.addColorStop(1, "#8d6e63");
  } else {
    sideGrad.addColorStop(0, "#0a0014");
    sideGrad.addColorStop(1, "#180028");
  }
  ctx.fillStyle = sideGrad;
  ctx.beginPath();
  ctx.moveTo(0, hy);
  ctx.lineTo(w, hy);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  const decorScroll = scroll * 0.04;
  if (world.decor === "oasis") {
    for (let d = 0; d < 5; d++) {
      const dx = (d * 140 + decorScroll * 0.3) % w;
      const dy = hy + 60 + d * 25;
      ctx.fillStyle = `rgba(194,160,104,${0.15 + d * 0.03})`;
      ctx.beginPath();
      ctx.ellipse(dx, dy, 80 + d * 20, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 10; i++) {
      const baseX = ((i * 173 + decorScroll) % (w + 120)) - 60;
      const side = i % 2 === 0 ? -1 : 1;
      const treeY = hy + 35 + (i % 5) * 32;
      const treeX = side < 0 ? baseX * 0.32 : w - baseX * 0.32;
      drawPineTree(treeX, treeY, 0.45 + (i % 4) * 0.12);
    }
  } else if (world.decor === "steam") {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let i = 0; i < 4; i++) {
      const fx = i * w / 4;
      ctx.fillRect(fx, hy - 40 - (i % 2) * 20, w / 5, 50 + i * 15);
    }
    for (let i = 0; i < 8; i++) {
      const px = ((i * 140 + decorScroll) % (w + 60)) - 30;
      const side = i % 2;
      const x = side ? w - 35 - (px % 90) : 15 + (px % 90);
      drawSmokestack(x, hy + 15 + (i % 4) * 48, 0.55 + (i % 3) * 0.15);
    }
  } else if (world.decor === "volcano") {
    for (let i = 0; i < 6; i++) {
      const rx = ((i * 160 + decorScroll) % (w + 80)) - 40;
      const ry = hy + 40 + (i % 3) * 35;
      ctx.fillStyle = "#4e342e";
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 50 + i * 8, ry - 60 - i * 10);
      ctx.lineTo(rx + 100 + i * 12, ry);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255,87,34,${0.35 + Math.sin(Date.now() * 0.004 + i) * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(rx + 50 + i * 8, ry - 62 - i * 10, 14 + i * 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const bx = (i * w / 11 + decorScroll * 0.4) % (w + 40) - 20;
      const bh = 35 + (i % 6) * 28;
      const bw = w / 10 + (i % 3) * 8;
      const by = hy - bh + 8;
      drawCyberBuilding(bx, by, bw, bh, i);
    }
    ctx.fillStyle = "rgba(0,229,255,0.04)";
    ctx.fillRect(0, hy, w, 8);
  }
}

function shadeColor(hex, amt) {
  if (!hex.startsWith("#")) return hex;
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

function drawAsphaltGrain(cx, y0, y1, half0, half1, w, h) {
  const t0 = perspT(h, y0);
  const t1 = perspT(h, y1);
  const count = 4 + Math.floor((t0 + t1) * 6);
  for (let i = 0; i < count; i++) {
    const ty = y0 + (y1 - y0) * (i / count);
    const half = half0 + (half1 - half0) * (i / count);
    const tx = cx - half + 8 + ((i * 37 + Math.floor(race?.scroll || 0)) % Math.max(20, half * 2 - 16));
    ctx.fillStyle = `rgba(255,255,255,${0.02 + t0 * 0.04})`;
    ctx.fillRect(tx, ty, 2 + (i % 2), 1);
    ctx.fillStyle = `rgba(0,0,0,${0.04 + t1 * 0.03})`;
    ctx.fillRect(tx + 4, ty + 2, 3, 1);
  }
}

function drawWetRoadSheen(w, h, hy) {
  const sheen = ctx.createLinearGradient(0, hy, 0, h);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0.04)");
  sheen.addColorStop(0.65, "rgba(200,230,255,0.06)");
  sheen.addColorStop(1, "rgba(255,255,255,0.02)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.moveTo(w / 2 - roadHalfAtY(w, h, hy), hy);
  ctx.lineTo(w / 2 + roadHalfAtY(w, h, hy), hy);
  ctx.lineTo(w / 2 + roadHalfAtY(w, h, h), h);
  ctx.lineTo(w / 2 - roadHalfAtY(w, h, h), h);
  ctx.closePath();
  ctx.fill();

  const scroll = race?.scroll || 0;
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.35;
  for (let y = hy + 20; y < h; y += 28 + perspT(h, y) * 40) {
    const t = perspT(h, y);
    const half = roadHalfAtY(w, h, y);
    const rx = w / 2 - half * 0.35 + Math.sin((y + scroll) * 0.08) * half * 0.15;
    const rw = half * 0.25 + t * 20;
    const rg = ctx.createLinearGradient(rx, y, rx + rw, y);
    rg.addColorStop(0, "rgba(255,255,255,0)");
    rg.addColorStop(0.45, "rgba(255,255,255,0.35)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(rx, y, rw, 2 + t * 2);
  }
  ctx.restore();
}

function drawLensFlare(sunX, sunY, world) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const core = world.decor === "cyber" ? "255,0,255" : world.decor === "volcano" ? "255,120,40" : "255,240,200";
  const halo = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 55);
  halo.addColorStop(0, `rgba(${core},0.55)`);
  halo.addColorStop(0.4, `rgba(${core},0.12)`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 55, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI + renderTime * 0.0003;
    const len = 90 + i * 18;
    const streak = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(ang) * len, sunY + Math.sin(ang) * len);
    streak.addColorStop(0, `rgba(${core},0.18)`);
    streak.addColorStop(1, "rgba(0,0,0,0)");
    ctx.strokeStyle = streak;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(sunX + Math.cos(ang) * len, sunY + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDistantMountains(w, h, scroll, world) {
  const hy = horizonY(h);
  const parallax = scroll * 0.015;
  const layers = world.decor === "cyber" ? [
    { color: "#0a0018", off: 0, peaks: 5, h: 0.22 },
    { color: "#180028", off: 40, peaks: 7, h: 0.16 },
  ] : world.decor === "volcano" ? [
    { color: "#2a1008", off: 0, peaks: 4, h: 0.28 },
    { color: "#4a2010", off: 60, peaks: 6, h: 0.18 },
  ] : world.decor === "steam" ? [
    { color: "#1a1410", off: 0, peaks: 5, h: 0.2 },
    { color: "#2a2018", off: 50, peaks: 8, h: 0.14 },
  ] : [
    { color: "#8a7040", off: 0, peaks: 6, h: 0.24 },
    { color: "#a88850", off: 70, peaks: 9, h: 0.15 },
  ];
  layers.forEach((layer, li) => {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, hy + 8);
    for (let p = 0; p <= layer.peaks; p++) {
      const px = (p / layer.peaks) * (w + 120) - 60 - parallax * (1 + li * 0.4) + layer.off;
      const ph = hy - h * layer.h * (0.55 + ((p + li * 3) % 4) * 0.15);
      const midX = px + (w + 120) / layer.peaks / 2;
      const midY = ph - h * 0.04 * ((p + li) % 3);
      ctx.lineTo(px, ph);
      ctx.lineTo(midX, midY);
    }
    ctx.lineTo(w, hy + 8);
    ctx.closePath();
    ctx.fill();
    if (world.decor === "volcano" && li === 0) {
      ctx.fillStyle = `rgba(255,87,34,${0.25 + Math.sin(renderTime * 0.004) * 0.1})`;
      ctx.beginPath();
      ctx.moveTo(w * 0.62 - parallax, hy - h * 0.08);
      ctx.lineTo(w * 0.64 - parallax, hy - h * 0.28);
      ctx.lineTo(w * 0.66 - parallax, hy - h * 0.08);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawRoadCracks(cx, y0, y1, half0, half1, scroll, h) {
  const t0 = perspT(h, y0);
  if (t0 < 0.12) return;
  const seed = Math.floor((y0 + scroll) / 70);
  ctx.save();
  ctx.strokeStyle = `rgba(0,0,0,${0.07 + t0 * 0.14})`;
  ctx.lineWidth = 0.6 + t0 * 0.8;
  for (let c = 0; c < 2; c++) {
    const half = half0 + (half1 - half0) * (c + 0.5) / 2;
    let sx = cx - half * 0.35 + ((seed + c * 19) % 9) * 5;
    ctx.beginPath();
    ctx.moveTo(sx, y0);
    for (let s = 0; s < 3; s++) {
      sx += ((seed + s * 13 + c * 7) % 5 - 2) * 3 * (0.5 + t0);
      const sy = y0 + (y1 - y0) * (0.25 + s * 0.28);
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawHeatShimmer(w, h, hy, world) {
  if (world.decor !== "oasis" && world.decor !== "volcano") return;
  const t = renderTime * 0.003;
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let band = 0; band < 4; band++) {
    const y = hy + 40 + band * ((h - hy) / 5);
    const half = roadHalfAtY(w, h, y);
    const wave = Math.sin(t + band * 1.2) * 6;
    ctx.strokeStyle = world.decor === "volcano" ? "rgba(255,120,40,0.35)" : "rgba(255,220,160,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = w / 2 - half; x < w / 2 + half; x += 8) {
      const dy = Math.sin((x + t * 40) * 0.06 + band) * (2 + band);
      if (x === w / 2 - half) ctx.moveTo(x, y + dy + wave);
      else ctx.lineTo(x, y + dy + wave);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawCarMotionTrail(x, y, car, speedRatio, h) {
  if (speedRatio < 0.35) return;
  ctx.save();
  ctx.globalAlpha = (speedRatio - 0.35) * 0.45;
  for (let i = 0; i < 5; i++) {
    const ty = y + 8 + i * 6;
    const tw = 28 + i * 8;
    const tg = ctx.createLinearGradient(x, ty - 20, x, ty + 10);
    tg.addColorStop(0, "rgba(255,255,255,0)");
    tg.addColorStop(0.5, `${car.colors[0]}88`);
    tg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.3, ty);
    ctx.lineTo(x, ty - 18 - i * 4);
    ctx.lineTo(x + tw * 0.3, ty);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function carRenderOpts(speed) {
  const world = getWorld(race?.world || currentWorld);
  const max = race?.maxSpeed || 420;
  return {
    speedRatio: Math.min(1, (speed || 0) / max),
    worldDecor: world.decor,
    headlights: world.decor === "cyber" || world.decor === "volcano" || world.decor === "steam",
    boosting: (race?.boostTimer || 0) > 0,
  };
}

function drawRaceAtmosphere(w, h) {
  const hy = horizonY(h);
  const speedFx = race?.speedLines || 0;
  const world = getWorld(race?.world || currentWorld);

  const dust = ctx.createLinearGradient(0, hy, 0, h);
  dust.addColorStop(0, "rgba(255,220,180,0)");
  dust.addColorStop(0.35, `rgba(255,200,150,${0.05 + speedFx * 0.05})`);
  dust.addColorStop(1, "rgba(60,45,30,0.22)");
  ctx.fillStyle = dust;
  ctx.fillRect(0, hy, w, h - hy);

  const warm = ctx.createLinearGradient(0, 0, w, h);
  warm.addColorStop(0, world.decor === "cyber" ? "rgba(120,0,200,0.06)" : "rgba(255,180,100,0.06)");
  warm.addColorStop(1, "rgba(40,60,100,0.1)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);

  if (speedFx > 0.3) {
    ctx.save();
    ctx.globalAlpha = (speedFx - 0.3) * 0.4;
    const mb = ctx.createLinearGradient(w / 2, h, w / 2, hy);
    mb.addColorStop(0, "rgba(255,255,255,0.1)");
    mb.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = mb;
    ctx.fillRect(0, hy, w, h - hy);
    ctx.restore();
  }
}

function drawRoad(w, h, scroll, worldId) {
  const world = getWorld(worldId);
  const hy = horizonY(h);
  drawSky(w, h, world);
  drawSideTerrain(w, h, scroll, world);

  const segs = 24;
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const y0 = hy + t0 * (h - hy);
    const y1 = hy + t1 * (h - hy);
    const half0 = roadHalfAtY(w, h, y0);
    const half1 = roadHalfAtY(w, h, y1);
    const cx = w / 2;

    const roadG = ctx.createLinearGradient(cx, y0, cx, y1);
    roadG.addColorStop(0, shadeColor(world.road, -15));
    roadG.addColorStop(0.5, world.road);
    roadG.addColorStop(1, shadeColor(world.road, 10));
    ctx.fillStyle = roadG;
    ctx.beginPath();
    ctx.moveTo(cx - half0, y0);
    ctx.lineTo(cx + half0, y0);
    ctx.lineTo(cx + half1, y1);
    ctx.lineTo(cx - half1, y1);
    ctx.closePath();
    ctx.fill();

    drawAsphaltGrain(cx, y0, y1, half0, half1, w, h);
    drawRoadCracks(cx, y0, y1, half0, half1, scroll, h);

    ctx.fillStyle = world.roadEdge;
    ctx.beginPath();
    ctx.moveTo(cx - half0 - 6 * perspT(h, y0), y0);
    ctx.lineTo(cx - half0, y0);
    ctx.lineTo(cx - half1, y1);
    ctx.lineTo(cx - half1 - 10 * perspT(h, y1), y1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + half0, y0);
    ctx.lineTo(cx + half0 + 6 * perspT(h, y0), y0);
    ctx.lineTo(cx + half1 + 10 * perspT(h, y1), y1);
    ctx.lineTo(cx + half1, y1);
    ctx.closePath();
    ctx.fill();

    const rumbleW = 4 + perspT(h, y0) * 4;
    for (let ry = y0; ry < y1; ry += 8 + perspT(h, ry) * 6) {
      const rh = 4 + perspT(h, ry) * 3;
      ctx.fillStyle = (Math.floor((ry + scroll) / 10) % 2) ? "#eceff1" : "#ef5350";
      ctx.fillRect(cx - half0 - rumbleW - 2, ry, rumbleW, rh);
      ctx.fillRect(cx + half0 + 2, ry, rumbleW, rh);
    }
  }

  ctx.strokeStyle = world.lane;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 16]);
  ctx.lineDashOffset = -scroll * 0.2;
  ctx.beginPath();
  ctx.moveTo(w / 2, hy);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let y = hy + 8; y < h; y += 14 + perspT(h, y) * 20) {
    const t = perspT(h, y);
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + t * 0.12})`;
    ctx.lineWidth = 1 + t;
    const half = roadHalfAtY(w, h, y);
    ctx.beginPath();
    ctx.moveTo(w / 2 - half * 0.5, y);
    ctx.lineTo(w / 2 + half * 0.5, y);
    ctx.stroke();
  }

  drawWetRoadSheen(w, h, hy);
  drawHeatShimmer(w, h, hy, world);
  drawGuardrails(w, h, scroll, world);
  drawDistanceFog(w, h, world);
}

function drawSpeedLines(w, h, intensity) {
  if (intensity < 0.15) return;
  ctx.save();
  ctx.globalAlpha = (intensity - 0.15) * 0.75;
  const hy = horizonY(h);
  const count = Math.floor(22 * intensity);
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const laneOff = (i % 3 - 1) * 0.15;
    const x = w / 2 + side * (w * 0.2 + laneOff * w * 0.1) + ((i * 47) % 40 - 20);
    const y = hy + 20 + (i * 37) % Math.max(1, h - hy - 50);
    const len = 40 + (i % 5) * 18 * intensity;
    const grad = ctx.createLinearGradient(x, y, x + side * len * 0.12, y + len);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.25, `rgba(255,255,255,${0.12 + intensity * 0.22})`);
    grad.addColorStop(0.7, `rgba(200,220,255,${0.08 + intensity * 0.1})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.8 + intensity * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + side * len * 0.15, y + len);
    ctx.stroke();
  }
  if (intensity > 0.5) {
    ctx.globalAlpha = (intensity - 0.5) * 0.25;
    const edge = ctx.createLinearGradient(0, hy, 0, h);
    edge.addColorStop(0, "rgba(255,255,255,0)");
    edge.addColorStop(0.5, "rgba(255,255,255,0.06)");
    edge.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, hy, w * 0.12, h - hy);
    ctx.fillRect(w * 0.88, hy, w * 0.12, h - hy);
  }
  ctx.restore();
}

function drawParticles(r) {
  if (!r.particles?.length) return;
  r.particles.forEach((p) => {
    const alpha = Math.min(1, p.life * 2.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.type === "exhaust") {
      const eg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
      eg.addColorStop(0, `rgba(220,220,220,${alpha * 0.55})`);
      eg.addColorStop(0.5, `rgba(140,140,140,${alpha * 0.25})`);
      eg.addColorStop(1, "rgba(80,80,80,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "boost") {
      ctx.fillStyle = `rgba(255,200,50,${alpha})`;
      ctx.shadowColor = "#ff9800";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (p.type === "dust") {
      const dg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.4);
      dg.addColorStop(0, `rgba(194,160,104,${alpha * 0.85})`);
      dg.addColorStop(1, "rgba(120,90,60,0)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "spark") {
      ctx.strokeStyle = `rgba(255,220,100,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();
    } else if (p.type === "smoke") {
      ctx.fillStyle = `rgba(90,90,90,${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "skid") {
      ctx.fillStyle = `rgba(40,40,40,${alpha * 0.55})`;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 2.2, p.size * 0.6, p.vx * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(120,100,80,${alpha * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(p.x + 2, p.y + 1, p.size * 1.6, p.size * 0.4, p.vx * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawGap(r, w, h) {
  const gapDist = r.nextGapDist - r.dist;
  if (gapDist > 900 || gapDist < -250) return;

  const screenY = h * 0.42 - gapDist * 0.14;
  const gapPx = r.gapWidth * (0.4 + perspT(h, screenY) * 0.6);
  const cx = w / 2;
  const world = getWorld(r.world);
  const t = perspT(h, screenY);

  const voidG = ctx.createLinearGradient(cx, screenY, cx, screenY + 120);
  voidG.addColorStop(0, "#020204");
  voidG.addColorStop(0.35, "#0a0814");
  voidG.addColorStop(0.7, "#120820");
  voidG.addColorStop(1, "#1a0c28");
  ctx.fillStyle = voidG;
  ctx.fillRect(cx - gapPx / 2 - 80 * t, screenY + 8, gapPx + 160 * t, 90 + t * 30);

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(cx - gapPx / 2 - 8, screenY + 12, gapPx + 16, 10);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(cx - gapPx / 2 - 4, screenY + 14, gapPx + 8, 2);

  ctx.fillStyle = world.roadEdge;
  const rampH = 35 + t * 25;
  ctx.beginPath();
  ctx.moveTo(cx - gapPx / 2 - 65 * t, screenY + rampH);
  ctx.lineTo(cx - gapPx / 2, screenY);
  ctx.lineTo(cx - gapPx / 2, screenY + rampH + 15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + gapPx / 2 + 65 * t, screenY + rampH);
  ctx.lineTo(cx + gapPx / 2, screenY);
  ctx.lineTo(cx + gapPx / 2, screenY + rampH + 15);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,235,59,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - gapPx / 2 - 20, screenY + rampH - 5);
  ctx.lineTo(cx - gapPx / 2, screenY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + gapPx / 2 + 20, screenY + rampH - 5);
  ctx.lineTo(cx + gapPx / 2, screenY + 5);
  ctx.stroke();

  ctx.fillStyle = "#ffeb3b";
  ctx.font = `bold ${11 + t * 4}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("RAMP", cx - gapPx / 2 - 28 * t, screenY - 6);
  ctx.fillText(`GAP ${Math.floor(r.gapWidth)}`, cx, screenY + 52);
  ctx.fillText("RAMP", cx + gapPx / 2 + 28 * t, screenY - 6);

  if (r.gapPhase === "approach") {
    ctx.fillStyle = world.id === "cyber" ? "#ff00ff" : world.id === "steampunk" ? "#ff9800" : "#fff";
    ctx.font = `bold ${13 + t * 3}px sans-serif`;
    ctx.fillText(`${world.jumpLabel} — hit ramp FAST!`, cx, screenY - 24);
  }
}

function drawMemeDecal(ctx, x, y, type, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const stickerG = ctx.createLinearGradient(-14, -10, 14, 10);
  stickerG.addColorStop(0, "rgba(255,255,255,0.95)");
  stickerG.addColorStop(1, "rgba(220,220,220,0.85)");
  ctx.fillStyle = stickerG;
  ctx.beginPath();
  ctx.roundRect(-14, -9, 28, 18, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(-12, -8, 10, 4);

  ctx.fillStyle = "#ffcc80";
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(-3, -1, 2, 0, Math.PI * 2);
  ctx.arc(3, -1, 2, 0, Math.PI * 2);
  ctx.fill();
  if (type === "rizz") {
    ctx.strokeStyle = "#111"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 3, 4.5, 0.15, Math.PI - 0.15); ctx.stroke();
  } else if (type === "sigma") {
    ctx.fillStyle = "#78909c"; ctx.fillRect(-8, -9, 16, 5);
  } else if (type === "skibidi") {
    ctx.fillStyle = "#fff"; ctx.fillRect(-6, 5, 12, 6);
  } else if (type === "gigachad") {
    ctx.fillRect(-5, 3, 10, 2); ctx.fillRect(-7, -8, 14, 4);
  } else {
    ctx.beginPath(); ctx.arc(0, 3, 3.5, 0, Math.PI); ctx.fill();
  }
  ctx.restore();
}

function drawDistanceFog(w, h, world) {
  const hy = horizonY(h);
  const fog = ctx.createLinearGradient(0, hy + 40, 0, h);
  const tint = world.decor === "cyber" ? "rgba(40,0,80," : world.decor === "volcano" ? "rgba(60,20,0," : "rgba(180,160,130,";
  fog.addColorStop(0, "rgba(0,0,0,0)");
  fog.addColorStop(0.55, `${tint}0.04)`);
  fog.addColorStop(1, `${tint}0.18)`);
  ctx.fillStyle = fog;
  ctx.fillRect(0, hy, w, h - hy);
}

function drawGuardrails(w, h, scroll, world) {
  const hy = horizonY(h);
  for (let y = hy; y < h; y += 6 + perspT(h, y) * 10) {
    const t = perspT(h, y);
    const half = roadHalfAtY(w, h, y);
    const cx = w / 2;
    const postH = 8 + t * 14;
    const railColor = world.decor === "cyber" ? "#00e5ff" : world.decor === "volcano" ? "#ff7043" : "#cfd8dc";
    ctx.fillStyle = `rgba(0,0,0,${0.12 + t * 0.08})`;
    ctx.fillRect(cx - half - 18 * t - 4, y, 3, postH);
    ctx.fillRect(cx + half + 15 * t, y, 3, postH);
    ctx.fillStyle = railColor;
    ctx.globalAlpha = 0.35 + t * 0.45;
    ctx.fillRect(cx - half - 20 * t - 2, y + 2, 2 + t * 2, 3);
    ctx.fillRect(cx + half + 18 * t, y + 2, 2 + t * 2, 3);
    if (Math.floor((y + scroll * 0.15) / 14) % 2 === 0) {
      ctx.fillStyle = world.decor === "cyber" ? "rgba(0,229,255,0.5)" : "rgba(255,235,59,0.55)";
      ctx.fillRect(cx - half - 16 * t, y + 4, 4 * t, 2);
      ctx.fillRect(cx + half + 12 * t, y + 4, 4 * t, 2);
    }
    ctx.globalAlpha = 1;
  }
}

function drawHeadlightBeams(ctx, worldDecor, speedRatio) {
  if (speedRatio < 0.08) return;
  const isCyber = worldDecor === "cyber";
  const isVolcano = worldDecor === "volcano";
  const core = isCyber ? "rgba(0,229,255," : isVolcano ? "rgba(255,180,80," : "rgba(255,248,220,";
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  [-1, 1].forEach((side) => {
    const bx = side * 22;
    const beam = ctx.createLinearGradient(bx, -8, bx, -130);
    beam.addColorStop(0, `${core}${0.22 * speedRatio})`);
    beam.addColorStop(0.45, `${core}${0.08 * speedRatio})`);
    beam.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(bx - 6, -6);
    ctx.lineTo(bx - 28, -125);
    ctx.lineTo(bx + 28, -125);
    ctx.lineTo(bx + 6, -6);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function drawCarWheel(ctx, wx, wy, spin, speedRatio) {
  ctx.save();
  ctx.translate(wx, wy);
  if (speedRatio > 0.15) {
    ctx.globalAlpha = 0.2 + speedRatio * 0.25;
    ctx.strokeStyle = "#bdbdbd";
    ctx.lineWidth = 2 + speedRatio * 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, spin, spin + Math.PI * 1.6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.rotate(speedRatio > 0.05 ? spin : 0);
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const rg = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
  rg.addColorStop(0, "#f5f5f5");
  rg.addColorStop(0.4, "#bdbdbd");
  rg.addColorStop(0.75, "#757575");
  rg.addColorStop(1, "#424242");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#616161";
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = speedRatio > 0.5 ? "#ff7043" : "#ef5350";
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCar(x, y, car, scale, angle, h, laneLean, opts) {
  opts = opts || {};
  const speedRatio = opts.speedRatio || 0;
  const worldDecor = opts.worldDecor || "oasis";
  const boosting = opts.boosting || false;
  h = h || canvas?.height || 600;
  const ps = scale * perspScale(h, y);
  const lean = laneLean || 0;
  const spin = renderTime * 0.018 * (0.35 + speedRatio * 1.4);
  const suspBob = Math.sin(renderTime * 0.012 * (1 + speedRatio * 2)) * (1.5 + speedRatio * 2);
  ctx.save();
  ctx.translate(x, y + suspBob);
  ctx.rotate((angle || 0) + lean * 0.12);
  ctx.scale(ps, ps);

  const jumpLift = Math.abs(angle || 0) > 0.1 ? 0.65 : 1;
  const shadowG = ctx.createRadialGradient(0, 22 * jumpLift, 2, 0, 22 * jumpLift, 42);
  shadowG.addColorStop(0, "rgba(0,0,0,0.62)");
  shadowG.addColorStop(0.4, "rgba(0,0,0,0.32)");
  shadowG.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadowG;
  ctx.beginPath();
  ctx.ellipse(0, 22 * jumpLift, 38, 12 * jumpLift, 0, 0, Math.PI * 2);
  ctx.fill();

  if (opts.headlights) drawHeadlightBeams(ctx, worldDecor, speedRatio);

  drawCarWheel(ctx, -24, 16, spin, speedRatio);
  drawCarWheel(ctx, 24, 16, spin, speedRatio);

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(-26, 12, 52, 5);

  const bodyG = ctx.createLinearGradient(-28, -16, 28, 20);
  bodyG.addColorStop(0, shadeColor(car.colors[0], 45));
  bodyG.addColorStop(0.15, shadeColor(car.colors[0], 20));
  bodyG.addColorStop(0.35, car.colors[0]);
  bodyG.addColorStop(0.55, car.colors[1]);
  bodyG.addColorStop(0.85, shadeColor(car.colors[1], -20));
  bodyG.addColorStop(1, shadeColor(car.colors[1], -35));
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(-28, 8);
  ctx.lineTo(-26, -4);
  ctx.lineTo(-20, -14);
  ctx.lineTo(-8, -18);
  ctx.lineTo(14, -18);
  ctx.lineTo(24, -10);
  ctx.lineTo(28, 2);
  ctx.lineTo(26, 14);
  ctx.lineTo(20, 18);
  ctx.lineTo(-20, 18);
  ctx.closePath();
  ctx.fill();

  const clearcoat = ctx.createLinearGradient(-20, -18, 20, 8);
  clearcoat.addColorStop(0, "rgba(255,255,255,0.38)");
  clearcoat.addColorStop(0.35, "rgba(255,255,255,0.12)");
  clearcoat.addColorStop(0.6, "rgba(255,255,255,0)");
  clearcoat.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = clearcoat;
  ctx.beginPath();
  ctx.moveTo(-26, -4);
  ctx.lineTo(-20, -14);
  ctx.lineTo(14, -18);
  ctx.lineTo(24, -10);
  ctx.lineTo(26, 2);
  ctx.lineTo(20, 8);
  ctx.lineTo(-22, 8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-28, 8);
  ctx.lineTo(-26, -4);
  ctx.lineTo(-20, -14);
  ctx.lineTo(-8, -18);
  ctx.lineTo(14, -18);
  ctx.lineTo(24, -10);
  ctx.lineTo(28, 2);
  ctx.lineTo(26, 14);
  ctx.lineTo(20, 18);
  ctx.lineTo(-20, 18);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.moveTo(-22, -6);
  ctx.lineTo(20, -6);
  ctx.lineTo(16, -2);
  ctx.lineTo(-18, -2);
  ctx.closePath();
  ctx.fill();

  const glassG = ctx.createLinearGradient(-14, -16, 14, -4);
  glassG.addColorStop(0, "rgba(200,230,255,0.82)");
  glassG.addColorStop(0.35, "rgba(120,180,240,0.62)");
  glassG.addColorStop(0.7, "rgba(60,100,160,0.5)");
  glassG.addColorStop(1, "rgba(40,70,120,0.45)");
  ctx.fillStyle = glassG;
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.lineTo(18, -14);
  ctx.lineTo(14, -4);
  ctx.lineTo(-14, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(-16, -13, 12, 5);
  ctx.fillStyle = "rgba(180,210,255,0.2)";
  ctx.fillRect(2, -12, 8, 10);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, -4);
  ctx.stroke();

  ctx.fillStyle = "#455a64";
  ctx.fillRect(-22, -12, 5, 4);
  ctx.fillRect(17, -12, 5, 4);
  ctx.fillStyle = "rgba(200,230,255,0.4)";
  ctx.fillRect(-21, -11, 2, 2);
  ctx.fillRect(18, -11, 2, 2);

  ctx.fillStyle = "#37474f";
  ctx.fillRect(-30, -6, 4, 5);
  ctx.fillRect(26, -6, 4, 5);

  ctx.fillStyle = shadeColor(car.colors[1], -20);
  ctx.fillRect(-28, 10, 6, 6);
  ctx.fillRect(22, 10, 6, 6);

  ctx.fillStyle = "#263238";
  ctx.fillRect(-26, 14, 8, 4);
  ctx.fillRect(18, 14, 8, 4);

  if (boosting || speedRatio > 0.7) {
    ctx.fillStyle = boosting ? "#ff6f00" : "#ff8f00";
    ctx.shadowColor = "#ff9800";
    ctx.shadowBlur = boosting ? 14 : 8;
    ctx.beginPath();
    ctx.ellipse(-22, 16, 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(22, 16, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "#ffeb3b";
  ctx.shadowColor = "#fff59d";
  ctx.shadowBlur = 18 + speedRatio * 8;
  ctx.beginPath();
  ctx.ellipse(-26, 4, 5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(26, 4, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#c62828";
  ctx.globalAlpha = 0.92;
  ctx.fillRect(-28, 6, 4, 5);
  ctx.fillRect(24, 6, 4, 5);
  ctx.globalAlpha = 1;

  ctx.fillStyle = shadeColor(car.colors[0], -15);
  ctx.fillRect(-8, -20, 16, 4);
  ctx.fillRect(-10, -22, 20, 3);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(-10, -21, 20, 1);

  drawMemeDecal(ctx, 0, -2, car.meme, 0.8);

  if (speedRatio > 0.2) {
    ctx.globalAlpha = 0.12 + speedRatio * 0.08;
    ctx.fillStyle = "#fffde7";
    ctx.beginPath();
    ctx.moveTo(-24, 6);
    ctx.lineTo(-24, 55 + speedRatio * 20);
    ctx.lineTo(-10, 55 + speedRatio * 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, 6);
    ctx.lineTo(24, 55 + speedRatio * 20);
    ctx.lineTo(10, 55 + speedRatio * 20);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawObstacle(o, w, h) {
  const x = laneX(o.lane, w, h, o.y);
  const ps = perspScale(h, o.y);
  ctx.save();
  ctx.translate(x, o.y);
  ctx.scale(ps, ps);

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (o.type === "cactus") {
    const cg = ctx.createLinearGradient(-4, -12, 4, 20);
    cg.addColorStop(0, "#43a047");
    cg.addColorStop(1, "#1b5e20");
    ctx.fillStyle = cg;
    ctx.fillRect(-5, -12, 10, 32);
    ctx.fillRect(-16, 0, 12, 6);
    ctx.fillRect(-16, -10, 6, 16);
    ctx.fillRect(5, -6, 12, 6);
    ctx.fillRect(11, -14, 6, 16);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(-3, -10, 3, 12);
  } else if (o.type === "rock") {
    const rg = ctx.createRadialGradient(-4, -4, 2, 0, 0, 20);
    rg.addColorStop(0, "#bdbdbd");
    rg.addColorStop(0.55, "#757575");
    rg.addColorStop(1, "#424242");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-18, 4);
    ctx.lineTo(-12, -12);
    ctx.lineTo(8, -14);
    ctx.lineTo(18, 0);
    ctx.lineTo(10, 12);
    ctx.lineTo(-14, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.stroke();
  } else if (o.type === "gear") {
    ctx.fillStyle = "#cd7f32";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8b6914";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2);
      ctx.fillStyle = "#cd7f32";
      ctx.fillRect(-3, -20, 6, 8);
      ctx.restore();
    }
  } else if (o.type === "pipe") {
    const pg = ctx.createLinearGradient(-10, 0, 10, 0);
    pg.addColorStop(0, "#6d4c2a");
    pg.addColorStop(0.5, "#cd7f32");
    pg.addColorStop(1, "#5a3d1e");
    ctx.fillStyle = pg;
    ctx.fillRect(-10, -18, 20, 36);
    ctx.fillStyle = "#888";
    ctx.fillRect(-12, -20, 24, 5);
  } else if (o.type === "laser") {
    ctx.fillStyle = "rgba(255,0,80,0.3)";
    ctx.fillRect(-18, -20, 36, 40);
    ctx.strokeStyle = "#ff0066";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ff0066";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (o.type === "drone") {
    ctx.fillStyle = "#78909c";
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#00ffff";
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
    ctx.beginPath();
    ctx.arc(0, -4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPickup(p, w, h) {
  const x = laneX(p.lane, w, h, p.y);
  const ps = perspScale(h, p.y);
  const bob = Math.sin(Date.now() * 0.006 + p.y * 0.1) * 3;
  ctx.save();
  ctx.translate(x, p.y + bob);
  ctx.scale(ps, ps);

  if (p.type === "boost") {
    const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    bg.addColorStop(0, "#fff59d");
    bg.addColorStop(0.5, "#ffeb3b");
    bg.addColorStop(1, "rgba(255,152,0,0.2)");
    ctx.shadowColor = "#ff9800";
    ctx.shadowBlur = 20;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e65100";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡", 0, 6);
  } else if (p.type === "slow") {
    const sg = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
    sg.addColorStop(0, "#64b5f6");
    sg.addColorStop(1, "#1565c0");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🐌", 0, 5);
  } else {
    const cg = ctx.createRadialGradient(-3, -3, 1, 0, 0, 16);
    cg.addColorStop(0, "#fff176");
    cg.addColorStop(0.6, "#ffb300");
    cg.addColorStop(1, "#e65100");
    ctx.shadowColor = "#ff8f00";
    ctx.shadowBlur = 12;
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#4e342e";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("$", 0, 5);
  }
  ctx.restore();
}

function drawShot(s, w, h) {
  const x = laneX(s.lane, w, h, s.y);
  ctx.save();
  ctx.translate(x, s.y);
  const hostile = s.hostile;
  const trailLen = 18;
  const tGrad = ctx.createLinearGradient(0, hostile ? trailLen : -trailLen, 0, 0);
  if (hostile) {
    tGrad.addColorStop(0, "rgba(244,67,54,0)");
    tGrad.addColorStop(1, "rgba(244,67,54,0.45)");
  } else {
    tGrad.addColorStop(0, "rgba(255,152,0,0)");
    tGrad.addColorStop(1, "rgba(255,235,59,0.5)");
  }
  ctx.strokeStyle = tGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, hostile ? trailLen : -trailLen);
  ctx.lineTo(0, 0);
  ctx.stroke();
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
  if (hostile) {
    g.addColorStop(0, "#fff");
    g.addColorStop(0.35, "#ef5350");
    g.addColorStop(1, "rgba(244,67,54,0)");
    ctx.shadowColor = "#f44336";
  } else {
    g.addColorStop(0, "#fff");
    g.addColorStop(0.35, "#ffeb3b");
    g.addColorStop(1, "rgba(255,152,0,0)");
    ctx.shadowColor = "#ff9800";
  }
  ctx.fillStyle = g;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(0, hostile ? -9 : 9, 3, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function renderRace() {
  if (!race || !ctx) return;
  const w = canvas.width, h = canvas.height;
  const world = getWorld(race.world);
  const speedRatio = Math.min(1, race.speed / (race.maxSpeed || 420));
  const camBob = Math.sin(renderTime * 0.014 * (1 + speedRatio)) * speedRatio * 2.5;

  if (race.shake > 0) {
    ctx.save();
    ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    race.shake -= 0.016;
  } else if (speedRatio > 0.15) {
    ctx.save();
    ctx.translate(0, camBob);
  }

  drawRoad(w, h, race.scroll, race.world);
  drawGap(race, w, h);
  drawSpeedLines(w, h, race.speedLines || 0);

  const carY = h - 110 + (race.jumpY || 0);
  const carX = laneX(race.lane, w, h, carY);
  const laneLean = race.laneT != null ? (race.targetLane - race.lane) * (1 - race.laneT) : 0;
  const carOpts = carRenderOpts(race.speed);
  const playerCar = getSelectedCar();

  if (race.mode === "solo") {
    race.obstacles.forEach((o) => drawObstacle(o, w, h));
    race.pickups.forEach((p) => drawPickup(p, w, h));
    (race.remoteRacers || []).forEach((rp) => {
      const ry = h - 110 - (race.dist - rp.dist) * 0.09 + (rp.jumpY || 0);
      if (ry > -60 && ry < h + 40) {
        const rx = laneX(rp.lane, w, h, ry);
        drawCar(rx, ry, rp.car, 0.9, rp.jumping ? -0.3 : 0, h, 0, carOpts);
        ctx.fillStyle = "rgba(100,181,246,0.85)";
        ctx.font = "600 10px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`🌐 ${rp.name}`, rx, ry - 36);
      }
    });
    drawCarMotionTrail(carX, carY, playerCar, carOpts.speedRatio, h);
    drawCar(carX, carY, playerCar, 1.1, race.jumping ? -0.3 : 0, h, laneLean, carOpts);
    document.getElementById("dist-display").textContent = `${Math.floor(race.dist)} m · +💰${race.sessionEarned || 0}`;
    document.getElementById("speed-display").textContent = `${Math.floor(race.speed * 0.35)} mph`;
    document.getElementById("lives-display").textContent = `❤️ ${race.lives}`;
    document.getElementById("gap-display").textContent = `Gaps: ${race.jumpsCleared} · ${Math.floor(race.gapWidth)}`;
  } else {
    race.bots.forEach((b) => {
      if (b.hp <= 0) return;
      const by = h - 110 - (race.dist - b.dist) * 0.09;
      if (by > -60 && by < h + 40) {
        const bx = laneX(b.lane, w, h, by);
        drawCar(bx, by, b.car, 0.95, 0, h, 0, { ...carOpts, speedRatio: carOpts.speedRatio * 0.85 });
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.font = "600 11px system-ui,sans-serif";
        ctx.textAlign = "center";
        const tw = ctx.measureText(b.name).width + 8;
        ctx.fillRect(bx - tw / 2, by - 48, tw, 16);
        ctx.fillStyle = "#fff";
        ctx.fillText(b.name, bx, by - 36);
        if (b.hp === 1) {
          ctx.fillStyle = "#ef5350";
          ctx.fillText("!", bx + 20, by - 36);
        }
      }
    });
    (race.remoteRacers || []).forEach((rp) => {
      if (rp.hp <= 0) return;
      const ry = h - 110 - (race.dist - rp.dist) * 0.09 + (rp.jumpY || 0);
      if (ry > -60 && ry < h + 40) {
        const rx = laneX(rp.lane, w, h, ry);
        drawCar(rx, ry, rp.car, 0.95, rp.jumping ? -0.3 : 0, h, 0, carOpts);
        ctx.fillStyle = "rgba(25,118,210,0.75)";
        ctx.font = "600 11px system-ui,sans-serif";
        ctx.textAlign = "center";
        const tw = ctx.measureText(rp.name).width + 8;
        ctx.fillRect(rx - tw / 2, ry - 48, tw, 16);
        ctx.fillStyle = "#fff";
        ctx.fillText(`🌐 ${rp.name}`, rx, ry - 36);
        if (rp.hp === 1) {
          ctx.fillStyle = "#ef5350";
          ctx.fillText("!", rx + 20, ry - 36);
        }
      }
    });
    race.shots.forEach((s) => drawShot(s, w, h));
    if (race.playerInvuln > 0 && Math.floor(renderTime / 80) % 2) ctx.globalAlpha = 0.45;
    drawCarMotionTrail(carX, carY, playerCar, carOpts.speedRatio, h);
    drawCar(carX, carY, playerCar, 1.1, race.jumping ? -0.3 : 0, h, laneLean, carOpts);
    ctx.globalAlpha = 1;
    document.getElementById("dist-display").textContent = `Lap ${Math.min(race.lap, race.laps)}/${race.laps}`;
    document.getElementById("speed-display").textContent = `${Math.floor(race.speed * 0.35)} mph`;
    document.getElementById("rank-display").textContent = `#${race.rank}`;
    document.getElementById("hp-display").textContent = `🛡️ ${race.playerHp}`;
    document.getElementById("gap-display").textContent = `Gaps: ${race.jumpsCleared} · ${Math.floor(race.gapWidth)}`;
  }

  drawParticles(race);

  if (race.boostTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.25, race.boostTimer * 0.15);
    const bg = ctx.createRadialGradient(w / 2, h, h * 0.2, w / 2, h / 2, h * 0.8);
    bg.addColorStop(0, "rgba(255,235,59,0)");
    bg.addColorStop(1, "rgba(255,152,0,0.5)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (race.flashTimer > 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    ctx.fillText(race.flashMsg, w / 2, h * 0.22);
    ctx.shadowBlur = 0;
  }
  drawRaceAtmosphere(w, h);
  const isNight = world.decor === "cyber" || world.decor === "volcano";
  window.GameRealism?.postFrame(ctx, w, h, {
    focusX: carX,
    focusY: carY,
    vignette: 0.34,
    haze: !isNight,
    isNight,
    decor: world.decor,
    horizon: 0.28,
    grainCount: 320,
    animT: race?.scroll || renderTime * 0.01,
  });
  if (race.shake > 0 || speedRatio > 0.15) ctx.restore();
}

function renderMenuBg() {
  if (!ctx || screen === "solo" || screen === "pvp") return;
  const w = canvas.width, h = canvas.height;
  drawRoad(w, h, renderTime * 0.05, currentWorld);
  const carY = h - 110;
  const menuOpts = {
    speedRatio: 0.35,
    worldDecor: getWorld(currentWorld).decor,
    headlights: getWorld(currentWorld).decor !== "oasis",
  };
  drawCar(w / 2, carY, getSelectedCar(), 1.2, Math.sin(renderTime * 0.002) * 0.05, h, 0, menuOpts);
  drawRaceAtmosphere(w, h);
  const world = getWorld(currentWorld);
  window.GameRealism?.postFrame(ctx, w, h, {
    focusX: w / 2,
    focusY: carY,
    vignette: 0.28,
    decor: world.decor,
    animT: renderTime * 0.01,
  });
}

function gameLoop(ts) {
  renderTime = ts;
  const dt = Math.min(0.033, (ts - (gameLoop.last || ts)) / 1000);
  gameLoop.last = ts;
  if (race) {
    if (race.countdown > 0 || (race.countdown < 0 && race.countdown > -0.6)) updateCountdown(dt);
    if (race.running) {
      if (race.mode === "solo") updateSolo(dt);
      else updatePvp(dt);
    }
    renderRace();
  } else {
    renderMenuBg();
  }
  loopId = requestAnimationFrame(gameLoop);
}

function steer(dir) {
  if (!race || race.jumping) return;
  if (!race.running && race.countdown <= 0) return;
  race.targetLane = dir < 0 ? -1 : 1;
}

function clampLane(r) {
  r.lane = Math.max(-1, Math.min(1, r.lane));
  if (Math.abs(r.lane) < 0.5) r.lane = r.targetLane;
}

function renderGarage() {
  const list = document.getElementById("garage-list");
  list.innerHTML = "";
  MEME_CARS.forEach((car) => {
    const owned = save.owned.includes(car.id);
    const selected = save.selected === car.id;
    const card = document.createElement("div");
    card.className = "garage-card" + (owned ? " owned" : "") + (selected ? " selected" : "");
    card.innerHTML = `
      <span class="garage-emoji">${car.emoji}</span>
      <div class="garage-info">
        <h3>${car.name}</h3>
        <p>Speed x${car.speed} · ${owned ? "Owned" : `💰 ${car.price.toLocaleString()}`}</p>
      </div>`;
    const btn = document.createElement("button");
    btn.className = "garage-action";
    if (!owned) {
      btn.classList.add("buy");
      btn.textContent = save.money >= car.price ? "Buy" : "Need $";
      btn.disabled = save.money < car.price;
      btn.addEventListener("click", () => {
        if (save.money >= car.price) {
          save.money -= car.price;
          save.owned.push(car.id);
          save.selected = car.id;
          writeSave(); updateHud(); renderGarage();
        }
      });
    } else if (selected) {
      btn.classList.add("equipped");
      btn.textContent = "Equipped";
    } else {
      btn.classList.add("equip");
      btn.textContent = "Drive";
      btn.addEventListener("click", () => {
        save.selected = car.id;
        writeSave(); updateHud(); renderGarage();
      });
    }
    card.appendChild(btn);
    list.appendChild(card);
  });
}

function resize() {
  if (!wrap || !canvas) return;
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

function setupInput() {
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") steer(-1);
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") steer(1);
    if (e.key === " " && screen === "pvp") { e.preventDefault(); fireBlaster(); }
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  let touchStartX = 0;
  canvas.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!race || (!race.running && race.countdown <= 0)) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dx) > 30) { steer(dx > 0 ? 1 : -1); touchStartX = e.touches[0].clientX; }
  }, { passive: true });

  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentWorld = btn.dataset.world;
      document.querySelectorAll(".theme-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  document.getElementById("fire-btn").addEventListener("click", fireBlaster);
  document.getElementById("steer-left").addEventListener("click", () => steer(-1));
  document.getElementById("steer-right").addEventListener("click", () => steer(1));
  document.getElementById("solo-btn").addEventListener("click", () => startRace("solo"));
  document.getElementById("pvp-btn").addEventListener("click", () => startRace("pvp"));
  document.getElementById("garage-btn").addEventListener("click", () => { renderGarage(); showScreen("garage"); });
  document.getElementById("garage-back-btn").addEventListener("click", () => showScreen("menu"));
  document.getElementById("result-menu-btn").addEventListener("click", () => {
    race = null;
    document.getElementById("countdown-overlay").classList.add("hidden");
    showScreen("menu");
  });
  document.getElementById("result-again-btn").addEventListener("click", () => startRace(lastMode));
  document.getElementById("settings-btn").addEventListener("click", () => {
    document.getElementById("settings-overlay").classList.remove("hidden");
  });
  document.getElementById("close-settings-btn").addEventListener("click", () => {
    document.getElementById("settings-overlay").classList.add("hidden");
  });
  document.getElementById("leave-game-btn").addEventListener("click", () => {
    window.location.href = "../../index.html";
  });
  window.addEventListener("resize", resize);
}

function init() {
  canvas = document.getElementById("game-canvas");
  wrap = document.getElementById("game-wrap");
  ctx = canvas.getContext("2d");
  loadSave();
  loadPineTreeImage();
  resize();
  setupInput();
  updateHud();
  showScreen("menu");
  loopId = requestAnimationFrame(gameLoop);
}

init();
