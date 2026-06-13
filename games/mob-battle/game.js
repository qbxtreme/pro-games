(function () {
  "use strict";

  const SAVE_KEY = "mob-battle";
  const WORLD_W = 2600;
  const WORLD_H = 1800;
  const PLAYER_R = 22;
  const PLAYER_SPEED = 248;

  const FEED_STATION = { x: 520, y: 480 };
  const BREED_STATION = { x: 820, y: 480 };
  const FEED_COST = 10;
  const FEED_EXP = 28;
  const BREED_COST = 40;
  const RIDE_SPEED_MULT = 1.75;

  const LOADING_TIPS = [
    "Capture wild mobs and bring them back to Mob HQ!",
    "Upgrade your tranq gun to catch mobs easier!",
    "Beat gym leaders to unlock new zones!",
    "Some hybrid mobs can be bred again!",
  ];

  const ZONES = [
    {
      id: 0,
      name: "🏕️ Mob HQ",
      mobLevel: 0,
      reqLevel: 1,
      isPark: true,
      floor: "#7cb342",
      floorAlt: "#558b2f",
      decor: "park",
      skyTop: "#42a5f5",
      skyBot: "#81d4fa",
      mobs: [],
      bossColor: "#689f38",
    },
    {
      id: 1,
      name: "🌴 Jungle",
      mobLevel: 1,
      reqLevel: 1,
      floor: "#33691e",
      floorAlt: "#1b5e20",
      decor: "forest",
      skyTop: "#2e7d32",
      skyBot: "#81c784",
      mobs: ["raptor", "compy", "dilo"],
      gymName: "Water Gym",
      gymBadge: "💧",
      gymLeader: "Leader Marina",
      bossLevel: 7,
      bossColor: "#0288d1",
    },
    {
      id: 2,
      name: "🏜️ Canyon",
      mobLevel: 5,
      reqLevel: 4,
      floor: "#d84315",
      floorAlt: "#bf360c",
      decor: "rock",
      skyTop: "#ef6c00",
      skyBot: "#ffcc80",
      mobs: ["trike", "raptor", "para"],
      gymName: "Rock Gym",
      gymBadge: "🪨",
      gymLeader: "Leader Brock",
      bossLevel: 12,
      bossColor: "#6d4c41",
    },
    {
      id: 3,
      name: "🌋 Volcano",
      mobLevel: 10,
      reqLevel: 8,
      floor: "#4e342e",
      floorAlt: "#3e2723",
      decor: "lava",
      skyTop: "#bf360c",
      skyBot: "#ff8a65",
      mobs: ["rex", "ptero", "ankyl"],
      gymName: "Fire Gym",
      gymBadge: "🔥",
      gymLeader: "Leader Blaze",
      bossLevel: 17,
      bossColor: "#d84315",
    },
    {
      id: 4,
      name: "🌿 Swamp",
      mobLevel: 15,
      reqLevel: 12,
      floor: "#33691e",
      floorAlt: "#1b4332",
      decor: "forest",
      skyTop: "#1b5e20",
      skyBot: "#66bb6a",
      mobs: ["bronto", "dilo", "para"],
      gymName: "Grass Gym",
      gymBadge: "🌿",
      gymLeader: "Leader Fern",
      bossLevel: 22,
      bossColor: "#43a047",
    },
    {
      id: 5,
      name: "❄️ Ice Valley",
      mobLevel: 20,
      reqLevel: 16,
      floor: "#546e7a",
      floorAlt: "#37474f",
      decor: "ice",
      skyTop: "#0277bd",
      skyBot: "#b3e5fc",
      mobs: ["frostRex", "ptero", "ankyl"],
      gymName: "Ice Gym",
      gymBadge: "❄️",
      gymLeader: "Leader Glacier",
      bossLevel: 27,
      bossColor: "#0288d1",
    },
  ];

  const DINO_TYPES = {
    raptor: { name: "Raptor", emoji: "🦖", color: "#66bb6a", kind: "raptor", hp: 40, atk: 9, exp: 15, coins: 6, rx: 22, ry: 18, evolve: "alphaRaptor", evolveLv: 8 },
    alphaRaptor: { name: "Alpha Raptor", emoji: "🦖", color: "#2e7d32", kind: "raptor", hp: 75, atk: 16, exp: 30, coins: 12, rx: 26, ry: 22 },
    compy: { name: "Compsognathus", emoji: "🐾", color: "#aed581", kind: "raptor", hp: 30, atk: 6, exp: 10, coins: 4, rx: 16, ry: 14 },
    dilo: { name: "Dilophosaurus", emoji: "🦕", color: "#81c784", kind: "raptor", hp: 48, atk: 10, exp: 18, coins: 7, rx: 20, ry: 18, evolve: "spitter", evolveLv: 10 },
    spitter: { name: "Spitter", emoji: "🦕", color: "#43a047", kind: "raptor", hp: 70, atk: 14, exp: 28, coins: 10, rx: 22, ry: 20 },
    trike: { name: "Triceratops", emoji: "🦏", color: "#8d6e63", kind: "trike", hp: 65, atk: 11, exp: 22, coins: 8, rx: 24, ry: 20, evolve: "armoredTrike", evolveLv: 12 },
    armoredTrike: { name: "Armored Trike", emoji: "🦏", color: "#5d4037", kind: "trike", hp: 110, atk: 18, exp: 40, coins: 14, rx: 28, ry: 24 },
    para: { name: "Parasaur", emoji: "🦕", color: "#ffb74d", kind: "herb", hp: 55, atk: 8, exp: 16, coins: 6, rx: 22, ry: 20 },
    bronto: { name: "Brontosaurus", emoji: "🦕", color: "#78909c", kind: "herb", hp: 90, atk: 12, exp: 26, coins: 9, rx: 28, ry: 26 },
    rex: { name: "T-Rex", emoji: "🦖", color: "#e53935", kind: "rex", hp: 100, atk: 20, exp: 35, coins: 12, rx: 28, ry: 26, evolve: "alphaRex", evolveLv: 15 },
    alphaRex: { name: "Alpha Rex", emoji: "👑", color: "#b71c1c", kind: "rex", hp: 160, atk: 28, exp: 55, coins: 20, rx: 32, ry: 30 },
    ptero: { name: "Pteranodon", emoji: "🦅", color: "#9575cd", kind: "ptero", hp: 50, atk: 14, exp: 20, coins: 8, rx: 20, ry: 16 },
    ankyl: { name: "Ankylosaurus", emoji: "🛡️", color: "#607d8b", kind: "trike", hp: 85, atk: 13, exp: 24, coins: 9, rx: 26, ry: 22 },
    frostRex: { name: "Frost Rex", emoji: "❄️", color: "#4fc3f7", kind: "rex", hp: 120, atk: 22, exp: 42, coins: 15, rx: 28, ry: 26 },
    hybridRaptor: { name: "Hybrid Raptor", emoji: "🧬", color: "#00897b", kind: "raptor", hp: 95, atk: 18, exp: 38, coins: 14, rx: 24, ry: 20, hybrid: true },
    hybridTrike: { name: "Hybrid Trike", emoji: "🧬", color: "#6d4c41", kind: "trike", hp: 130, atk: 20, exp: 45, coins: 16, rx: 28, ry: 24, hybrid: true },
    goldenRaptor: { name: "Golden Raptor", emoji: "⭐", color: "#ffd54f", kind: "raptor", hp: 70, atk: 14, exp: 35, coins: 20, rx: 24, ry: 20, rare: true },
  };

  const HYBRID_RECIPES = [
    { parents: ["raptor", "dilo"], result: "hybridRaptor" },
    { parents: ["trike", "ankyl"], result: "hybridTrike" },
    { parents: ["hybridRaptor", "raptor"], result: "hybridRaptor" },
    { parents: ["hybridTrike", "trike"], result: "hybridTrike" },
  ];

  const EXPANSIONS = [
    { id: "tranq1", name: "Tranq Gun Mk1", emoji: "🔫", desc: "+25% tranq damage — catch easier!", cost: 60, tranq: 0.25 },
    { id: "tranq2", name: "Tranq Gun Mk2", emoji: "🔫", desc: "+50% tranq damage total", cost: 140, tranq: 0.25, req: "tranq1" },
    { id: "snack", name: "Snack Bar", emoji: "🍔", desc: "+2 visitor coins/sec", cost: 50, income: 2 },
    { id: "gift", name: "Gift Shop", emoji: "🎁", desc: "+4 visitor coins/sec", cost: 120, income: 4 },
    { id: "fence", name: "Steel Fence", emoji: "🏗️", desc: "+20 max HP for your dino", cost: 80, hp: 20 },
    { id: "arena", name: "Battle Pit", emoji: "⚔️", desc: "Unlock Rock Smash — usable 1 in 3 turns", cost: 150, special: true },
  ];

  const BOSS_MULT = { hp: 4, atk: 1.6, exp: 5, coins: 8 };

  let canvas, ctx, battleCanvas, battleCtx, w, h;
  let playing = false;
  let animT = 0;
  let lastFrame = 0;
  let player = { x: 400, y: 400, facing: 1 };
  let cam = { x: 400, y: 400 };
  let mobs = [];
  let boss = null;
  let portals = [];
  let nearMob = null;
  let nearPortal = null;
  let nearFeed = false;
  let nearBreed = false;
  let nearRide = false;
  let riding = false;
  let nearPvp = null;
  let parkCoinTimer = 0;
  let tipIndex = 0;
  const btnSticky = { mob: false, boss: false, portal: false, feed: false, breed: false, ride: false, pvp: false };
  let battle = null;
  let joy = { active: false, dx: 0, dy: 0 };
  let keys = {};
  let toastTimer = 0;
  let remotePlayers = [];
  let state = defaultState();

  function mpSubroom() {
    return "zone-" + state.zone;
  }

  function drawNameLabel(sx, sy, name, color) {
    ctx.font = "600 9px system-ui,sans-serif";
    const nm = (name || "Trainer").slice(0, 10);
    const nw = ctx.measureText(nm).width + 12;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(sx - nw / 2, sy - 11, nw, 14, 3);
    ctx.fill();
    ctx.fillStyle = color || "#e1bee7";
    ctx.textAlign = "center";
    ctx.fillText(nm, sx, sy);
  }

  function updateLeaderboard() {
    const el = document.getElementById("leaderboard");
    if (!el || !playing) return;
    const rows = [
      { name: state.name, level: state.level, you: true },
      ...remotePlayers.map((p) => ({
        name: p.name || "Trainer",
        level: (p.state || {}).level || 1,
        remote: true,
      })),
    ]
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);

    el.innerHTML =
      "<h4>🦕 Top Trainers</h4>" +
      rows
        .map(
          (r, i) =>
            `<div class="lb-row ${r.you ? "you" : r.remote ? "remote" : ""}"><span>#${i + 1} ${r.name.slice(0, 10)}</span><span>Lv ${r.level}</span></div>`
        )
        .join("");
  }

  function initMultiplayer() {
    if (!window.GameMP) return;
    if (typeof markGameMpCustom === "function") markGameMpCustom();
    GameMP.init({
      game: "mob-battle",
      subroom: mpSubroom(),
      getName: () => state.name,
      getState: () => ({
        zone: state.zone,
        x: player.x,
        y: player.y,
        facing: player.facing,
        style: state.style,
        level: state.level,
        expansions: state.expansions,
        activeDino: (getActiveDino() || {}).typeKey,
        riding,
        battle: !!battle,
      }),
      onPeers: (peers) => {
        remotePlayers = peers;
        updateLeaderboard();
      },
    });
    GameMP.start();
  }

  function defaultState() {
    return {
      name: "Ranger",
      style: "cute",
      level: 1,
      exp: 0,
      coins: 25,
      zone: 0,
      bossesBeaten: [],
      expansions: [],
      collection: [{ id: "starter", typeKey: "raptor", nickname: "Rexy" }],
      activeDino: "starter",
      hp: 100,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...defaultState(), ...parsed };
        if (parsed.world != null && parsed.zone == null) merged.zone = parsed.world;
        if (parsed.upgrades && !parsed.expansions) merged.expansions = parsed.upgrades;
        if (!merged.collection || !merged.collection.length) {
          merged.collection = [{ id: "starter", typeKey: "raptor", nickname: "Rexy" }];
          merged.activeDino = "starter";
        }
        delete merged.upgrades;
        return merged;
      }
    } catch (_) {}
    return defaultState();
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function getZone(id) {
    return ZONES[id] || ZONES[0];
  }

  function currentZone() {
    return getZone(state.zone);
  }

  function getActiveDino() {
    if (!state.collection || !state.collection.length) return null;
    return state.collection.find((c) => c.id === state.activeDino) || state.collection[0];
  }

  function parkIncomeRate() {
    let rate = 2;
    EXPANSIONS.forEach((e) => {
      if (state.expansions.includes(e.id) && e.income) rate += e.income;
    });
    return rate;
  }

  function checkEvolution() {
    const dino = getActiveDino();
    if (!dino) return;
    const type = DINO_TYPES[dino.typeKey];
    if (type?.evolve && state.level >= type.evolveLv) {
      dino.typeKey = type.evolve;
      showToast(`Evolved into ${DINO_TYPES[type.evolve].name}! 🌟`);
    }
  }

  function isZoneUnlocked(zoneId) {
    if (zoneId <= 0) return true;
    const z = getZone(zoneId);
    if (state.level < z.reqLevel) return false;
    if (z.isPvp) return true;
    if (zoneId === 1) return true;
    const prev = getZone(zoneId - 1);
    if (prev.isPark) return true;
    return state.bossesBeaten.includes(zoneId - 1);
  }

  function getZoneGym(zone) {
    if (!zone?.gymName) return null;
    const level = zone.bossLevel ?? zone.mobLevel + 3;
    const badge = zone.gymBadge || "🏅";
    return {
      level,
      badge,
      name: zone.gymName,
      leader: zone.gymLeader || "Gym Leader",
      shortLabel: `${badge} ${zone.gymName}`,
      mapLabel: `${badge} ${zone.gymName} Lv ${level}`,
      foeName: `${zone.gymLeader || "Gym Leader"} · Lv ${level}`,
    };
  }

  function getBossLevel(zone) {
    return getZoneGym(zone)?.level ?? zone.mobLevel + 3;
  }

  function getMobStats(typeKey, mobLevel, isBoss) {
    const base = DINO_TYPES[typeKey] || DINO_TYPES.raptor;
    const lvMult = 1 + (mobLevel - 1) * 0.22;
    if (isBoss) {
      return {
        hp: Math.floor(base.hp * BOSS_MULT.hp * lvMult),
        atk: Math.floor(base.atk * BOSS_MULT.atk * lvMult),
        exp: Math.floor(base.exp * BOSS_MULT.exp * (1 + (mobLevel - 1) * 0.15)),
        coins: Math.floor(base.coins * BOSS_MULT.coins * (1 + (mobLevel - 1) * 0.12)),
      };
    }
    return {
      hp: Math.floor(base.hp * lvMult),
      atk: Math.floor(base.atk * lvMult),
      exp: Math.floor(base.exp * (1 + (mobLevel - 1) * 0.18)),
      coins: Math.floor(base.coins * (1 + (mobLevel - 1) * 0.15)),
    };
  }

  function createMob(id, zone) {
    let typeKey = zone.mobs[Math.floor(Math.random() * zone.mobs.length)];
    if (Math.random() < 0.06) typeKey = "goldenRaptor";
    const stats = getMobStats(typeKey, zone.mobLevel, false);
    return {
      id,
      typeKey,
      mobLevel: zone.mobLevel,
      x: 120 + Math.random() * (WORLD_W - 240),
      y: 120 + Math.random() * (WORLD_H - 240),
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      hp: stats.hp,
    };
  }

  function tranqMultiplier() {
    let mult = 1.25;
    EXPANSIONS.forEach((e) => {
      if (state.expansions.includes(e.id) && e.tranq) mult += e.tranq;
    });
    return mult;
  }

  function expToNext(lv) {
    return Math.floor(50 * Math.pow(1.35, lv - 1));
  }

  function maxHp() {
    let hp = 80 + state.level * 12;
    EXPANSIONS.forEach((u) => {
      if (state.expansions.includes(u.id) && u.hp) hp += u.hp;
    });
    return hp;
  }

  function attackPower() {
    const dino = getActiveDino();
    const type = dino ? DINO_TYPES[dino.typeKey] : DINO_TYPES.raptor;
    let atk = (type?.atk || 8) + state.level * 3;
    EXPANSIONS.forEach((u) => {
      if (state.expansions.includes(u.id) && u.atk) atk += u.atk;
    });
    return atk;
  }

  function specialPower() {
    return Math.floor(attackPower() * 1.8);
  }

  function hasSpecial() {
    return state.expansions.includes("arena");
  }

  function canUseRockSmash() {
    return hasSpecial() && battle && specialTurnsLeft() === 0;
  }

  function specialTurnsLeft() {
    if (!battle) return 0;
    const turn = battle.playerTurn || 1;
    return (3 - ((turn - 1) % 3)) % 3;
  }

  function updateBattleSpecialBtn() {
    const btn = document.getElementById("special-btn");
    const status = document.getElementById("special-status");
    if (!btn) return;
    if (!battle) {
      btn.classList.add("hidden");
      status?.classList.add("hidden");
      return;
    }
    if (!hasSpecial()) {
      btn.classList.add("hidden");
      if (status) {
        status.classList.remove("hidden");
        status.className = "special-status wait";
        status.textContent = "🪨 Unlock Battle Pit in 🏗️ Gear Shop to use Rock Smash!";
      }
      return;
    }
    btn.classList.remove("hidden");
    status?.classList.remove("hidden");
    const ready = canUseRockSmash();
    const wait = specialTurnsLeft();
    btn.disabled = false;
    btn.classList.toggle("cooldown", !ready);
    btn.textContent = "🪨 Rock Smash";
    if (status) {
      status.className = ready ? "special-status ready" : "special-status wait";
      status.textContent = ready
        ? "🪨 Rock Smash is READY! (1 of every 3 turns)"
        : `🪨 Rock Smash ready in ${wait} turn${wait === 1 ? "" : "s"}…`;
    }
  }

  function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return Math.floor(n).toString();
  }

  function setBtnVisible(el, show) {
    if (!el) return;
    if (show) el.classList.remove("hidden");
    else el.classList.add("hidden");
  }

  function stickyNear(dist, showAt, hideAt, key) {
    if (btnSticky[key]) {
      if (dist > hideAt) btnSticky[key] = false;
    } else if (dist < showAt) {
      btnSticky[key] = true;
    }
    return btnSticky[key];
  }

  function updateActionButtons() {
    const zone = currentZone();
    setBtnVisible(document.getElementById("fight-btn"), btnSticky.mob && !battle && !zone.isPark && !zone.isPvp);
    const bossBtn = document.getElementById("boss-btn");
    setBtnVisible(bossBtn, btnSticky.boss && !battle);
    if (bossBtn && btnSticky.boss && !battle) {
      const gym = getZoneGym(zone);
      bossBtn.textContent = gym ? `${gym.badge} GYM!` : "🏋️ GYM!";
    }
    setBtnVisible(document.getElementById("portal-btn"), btnSticky.portal && !battle);
    setBtnVisible(document.getElementById("feed-btn"), btnSticky.feed && !battle && zone.isPark);
    setBtnVisible(
      document.getElementById("breed-btn"),
      btnSticky.breed && !battle && zone.isPark && state.collection.length >= 2
    );
    setBtnVisible(document.getElementById("ride-btn"), btnSticky.ride && !battle && zone.isPark);
    setBtnVisible(document.getElementById("pvp-btn"), btnSticky.pvp && !battle && zone.isPvp);
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    toastTimer = 2.5;
  }

  function addExp(amount) {
    state.exp += amount;
    while (state.exp >= expToNext(state.level)) {
      state.exp -= expToNext(state.level);
      state.level++;
      state.hp = maxHp();
      checkEvolution();
      showToast(`Level up! 🦕 Lv ${state.level}!`);
      renderZoneNav();
      updateLeaderboard();
    }
    updateHud();
    saveState();
  }

  function buildPortals() {
    portals = [];
    const unlocked = ZONES.filter((z) => isZoneUnlocked(z.id) && z.id !== state.zone);
    unlocked.forEach((z, i) => {
      const cols = Math.min(4, unlocked.length);
      const row = Math.floor(i / cols);
      const col = i % cols;
      portals.push({
        zoneId: z.id,
        label: z.name.split(" ").slice(1).join(" ") || z.name,
        x: 180 + col * 160,
        y: 180 + row * 140,
      });
    });
  }

  function spawnMobs() {
    mobs = [];
    const zone = currentZone();
    if (zone.isPark || zone.isPvp) {
      boss = { x: 0, y: 0, beaten: true };
      buildPortals();
      return;
    }
    for (let i = 0; i < 14; i++) {
      mobs.push(createMob(i, zone));
    }
    boss = {
      x: WORLD_W - 200,
      y: WORLD_H - 200,
      beaten: state.bossesBeaten.includes(state.zone),
    };
    buildPortals();
  }

  function travelToZone(zoneId) {
    if (battle || zoneId === state.zone) return;
    if (!isZoneUnlocked(zoneId)) {
      const z = getZone(zoneId);
      showToast(`Need Lv ${z.reqLevel} and beat the previous gym leader!`);
      return;
    }
    state.zone = zoneId;
    player.x = 400;
    player.y = 400;
    cam.x = player.x;
    cam.y = player.y;
    spawnMobs();
    updateHud();
    renderZoneNav();
    const z = getZone(zoneId);
    const detail = z.isPark ? "HQ income" : z.isPvp ? "PvP battles" : `Wild Lv ${z.mobLevel}`;
    showToast(`Traveled to ${z.name} · ${detail}`);
    if (window.GameMP) GameMP.setSubroom(mpSubroom());
    saveState();
  }

  function collides(wx, wy, r) {
    return wx - r < 30 || wy - r < 30 || wx + r > WORLD_W - 30 || wy + r > WORLD_H - 30;
  }

  function resize() {
    const wrap = document.getElementById("game-wrap");
    if (!canvas || !wrap) return;
    w = canvas.width = wrap.clientWidth;
    h = canvas.height = wrap.clientHeight;
  }

  function worldToScreen(wx, wy) {
    return { x: wx - cam.x + w * 0.5, y: wy - cam.y + h * 0.52 };
  }

  function drawWorld() {
    const camX = cam.x - w * 0.5;
    const camY = cam.y - h * 0.52;
    const zone = currentZone();

    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, w, h);

    DPSprites.drawZoneSky(ctx, w, h, camX, camY, zone, animT);

    const tile = 64;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty > WORLD_H) continue;
        DPSprites.drawWorldTile(ctx, tx - camX, ty - camY, tile, tile, zone, tx + ty);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 4;
    ctx.strokeRect(-camX + 2, -camY + 2, WORLD_W - 4, WORLD_H - 4);

    portals.forEach((p) => {
      const s = worldToScreen(p.x, p.y);
      if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
      DPSprites.drawZonePortal(ctx, s.x, s.y, p.label, animT);
    });

    if (!boss.beaten) {
      const bs = worldToScreen(boss.x, boss.y);
      const gym = getZoneGym(zone);
      if (bs.x > -80 && bs.x < w + 80) {
        const bossLv = getBossLevel(zone);
        DPSprites.drawGymLeader(ctx, bs.x, bs.y, animT, zone, bossLv, gym?.shortLabel);
        ctx.font = "bold 11px system-ui,sans-serif";
        ctx.fillStyle = "#ffeb3b";
        ctx.textAlign = "center";
        ctx.fillText(gym?.mapLabel || `👑 GYM Lv ${bossLv}`, bs.x, bs.y - 58);
      }
    }

    mobs.forEach((m) => {
      const s = worldToScreen(m.x, m.y);
      if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
      DPSprites.drawWildDino(ctx, s.x, s.y, DINO_TYPES[m.typeKey], animT + m.id, m.mobLevel);
    });

    if (zone.isPark) {
      const fs = worldToScreen(FEED_STATION.x, FEED_STATION.y);
      ctx.font = "bold 11px 'Comic Sans MS', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.strokeText("🍖 Feed Station", fs.x, fs.y - 18);
      ctx.fillText("🍖 Feed Station", fs.x, fs.y - 18);
      ctx.fillStyle = "#ffb74d";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fs.x - 26, fs.y - 8, 52, 22, 8);
      ctx.fill();
      ctx.stroke();

      const bs = worldToScreen(BREED_STATION.x, BREED_STATION.y);
      ctx.strokeText("🧬 Hybrid Lab", bs.x, bs.y - 18);
      ctx.fillText("🧬 Hybrid Lab", bs.x, bs.y - 18);
      ctx.fillStyle = "#ce93d8";
      ctx.beginPath();
      ctx.roundRect(bs.x - 26, bs.y - 8, 52, 22, 8);
      ctx.fill();
      ctx.stroke();
      state.collection.forEach((d, i) => {
        const px = 220 + (i % 6) * 130;
        const py = 620 + Math.floor(i / 6) * 110;
        const s = worldToScreen(px, py);
        if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
        DPSprites.drawWildDino(ctx, s.x, s.y, DINO_TYPES[d.typeKey] || DINO_TYPES.raptor, animT + i, state.level);
        if (d.id === state.activeDino) {
          ctx.font = "600 9px system-ui,sans-serif";
          ctx.fillStyle = "#ffeb3b";
          ctx.fillText("★ Active", s.x, s.y - 36);
        }
      });
    }

    const entities = [];
    remotePlayers.forEach((p) => {
      const st = p.state || {};
      if (st.battle) return;
      const wx = typeof st.x === "number" ? st.x : 400;
      const wy = typeof st.y === "number" ? st.y : 400;
      entities.push({ type: "remote", y: wy, p, st, wx, wy });
    });
    entities.push({ type: "player", y: player.y });
    entities.sort((a, b) => a.y - b.y);

    entities.forEach((e) => {
      if (e.type === "remote") {
        const s = worldToScreen(e.wx, e.wy);
        if (s.x < -80 || s.x > w + 80 || s.y < -80 || s.y > h + 80) return;
        DPSprites.drawTrainer(ctx, s.x, s.y, 0.85, e.st.style || "cute", e.st.facing || 1, animT + (e.p.id || 0), {
          bounce: true,
          upgrades: e.st.expansions || e.st.upgrades || [],
          riding: !!e.st.riding,
          dinoType: DINO_TYPES[e.st.activeDino || "raptor"],
        });
        drawNameLabel(s.x, s.y - 42, e.p.name, "#90caf9");
      } else {
        const ps = worldToScreen(player.x, player.y);
        const activeType = DINO_TYPES[(getActiveDino() || {}).typeKey || "raptor"];
        DPSprites.drawTrainer(ctx, ps.x, ps.y, 0.85, state.style, player.facing, animT, {
          bounce: true,
          upgrades: state.expansions,
          riding,
          dinoType: activeType,
          hideCompanion: riding,
        });
        drawNameLabel(ps.x, ps.y - 42, state.name, "#e1bee7");
      }
    });

    const ps = worldToScreen(player.x, player.y);
    DPSprites.drawPostFX(ctx, w, h, animT, ps.x, ps.y);
    window.GameRealism?.postFrame(ctx, w, h, {
      animT,
      focusX: ps.x,
      focusY: ps.y,
      zone: currentZone(),
      vignette: 0.2,
    });
  }

  function updateWorld(dt) {
    if (battle) return;
    const zone = currentZone();

    let dx = joy.dx;
    let dy = joy.dy;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;
    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      const spd = PLAYER_SPEED * (riding ? RIDE_SPEED_MULT : 1) * dt;
      const nx = player.x + dx * spd;
      const ny = player.y + dy * spd;
      if (!collides(nx, player.y, PLAYER_R)) player.x = nx;
      if (!collides(player.x, ny, PLAYER_R)) player.y = ny;
      player.facing = dx >= 0 ? 1 : -1;
    }

    cam.x += (player.x - cam.x) * Math.min(1, dt * 8);
    cam.y += (player.y - cam.y) * Math.min(1, dt * 8);

    if (zone.isPark) {
      state.coins += parkIncomeRate() * dt;
      parkCoinTimer += dt;
      if (parkCoinTimer > 4) {
        parkCoinTimer = 0;
        updateHud();
      }
      nearFeed = stickyNear(
        Math.hypot(FEED_STATION.x - player.x, FEED_STATION.y - player.y),
        75,
        95,
        "feed"
      );
      nearBreed = stickyNear(
        Math.hypot(BREED_STATION.x - player.x, BREED_STATION.y - player.y),
        75,
        95,
        "breed"
      );
      nearRide =
        !!getActiveDino() &&
        stickyNear(Math.hypot(400 - player.x, 400 - player.y), 100, 120, "ride");
    } else {
      nearFeed = false;
      nearBreed = false;
      nearRide = false;
      riding = false;
      btnSticky.feed = false;
      btnSticky.breed = false;
      btnSticky.ride = false;
    }

    mobs.forEach((m) => {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < 50 || m.x > WORLD_W - 50) m.vx *= -1;
      if (m.y < 50 || m.y > WORLD_H - 50) m.vy *= -1;
      const dist = Math.hypot(m.x - player.x, m.y - player.y);
      if (dist < 120) {
        m.vx += (player.x - m.x) / dist * 20 * dt;
        m.vy += (player.y - m.y) / dist * 20 * dt;
      }
    });

    nearMob = null;
    let nearestMobDist = Infinity;
    mobs.forEach((m) => {
      const d = Math.hypot(m.x - player.x, m.y - player.y);
      if (d < nearestMobDist) {
        nearestMobDist = d;
        nearMob = m;
      }
    });
    if (!stickyNear(nearestMobDist, 70, 92, "mob")) nearMob = null;

    nearPortal = null;
    let nearestPortalDist = Infinity;
    portals.forEach((p) => {
      const d = Math.hypot(p.x - player.x, p.y - player.y);
      if (d < nearestPortalDist) {
        nearestPortalDist = d;
        nearPortal = p;
      }
    });
    if (!stickyNear(nearestPortalDist, 55, 75, "portal")) nearPortal = null;

    const bossDist = Math.hypot(boss.x - player.x, boss.y - player.y);
    if (boss.beaten || zone.isPark || zone.isPvp) {
      btnSticky.boss = false;
    } else {
      stickyNear(bossDist, 90, 110, "boss");
    }

    if (zone.isPark || zone.isPvp) btnSticky.mob = false;

    nearPvp = null;
    if (zone.isPvp) {
      let nearestPvpDist = Infinity;
      remotePlayers.forEach((p) => {
        const st = p.state || {};
        if (st.battle) return;
        const wx = typeof st.x === "number" ? st.x : 400;
        const wy = typeof st.y === "number" ? st.y : 400;
        const d = Math.hypot(wx - player.x, wy - player.y);
        if (d < nearestPvpDist) {
          nearestPvpDist = d;
          nearPvp = p;
        }
      });
      if (!stickyNear(nearestPvpDist, 100, 120, "pvp")) nearPvp = null;
    } else {
      btnSticky.pvp = false;
    }

    updateActionButtons();

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) document.getElementById("toast")?.classList.add("hidden");
    }
  }

  function startPvpBattle(peer) {
    const st = peer.state || {};
    const lv = st.level || 5;
    const typeKey = st.activeDino || "raptor";
    const type = DINO_TYPES[typeKey] || DINO_TYPES.raptor;
    const stats = getMobStats(typeKey, lv, false);

    battle = {
      mob: { typeKey, mobLevel: lv },
      isBoss: false,
      isPvp: true,
      mobLevel: lv,
      foeName: `${peer.name || "Trainer"} Lv ${lv}`,
      foeHp: stats.hp,
      foeMaxHp: stats.hp,
      foeAtk: stats.atk,
      youHp: state.hp,
      youMaxHp: maxHp(),
      expReward: Math.floor(stats.exp * 1.5),
      coinReward: Math.floor(stats.coins * 2),
      foeTimer: 0,
      playerTurn: 1,
    };

    document.getElementById("battle-overlay").classList.remove("hidden");
    document.getElementById("battle-banner").textContent = `⚔️ PvP vs ${peer.name || "Trainer"}!`;
    document.getElementById("battle-you-name").textContent = state.name;
    document.getElementById("battle-foe-name").textContent = battle.foeName;
    updateBattleSpecialBtn();
    updateBattleHud();
    drawBattleScene(true);
  }

  function feedDino() {
    if (!currentZone().isPark) return;
    if (state.coins < FEED_COST) {
      showToast(`Need ${FEED_COST} coins to feed! 🪙`);
      return;
    }
    state.coins -= FEED_COST;
    addExp(FEED_EXP);
    showToast(`Fed your dino! +${FEED_EXP} EXP 🍖`);
    updateHud();
    saveState();
  }

  function toggleRide() {
    if (!currentZone().isPark || !getActiveDino()) return;
    riding = !riding;
    showToast(riding ? "Riding dinos is awesome! 🦖" : "Dismounted.");
  }

  function breedHybrid() {
    if (!currentZone().isPark || state.collection.length < 2) return;
    if (state.coins < BREED_COST) {
      showToast(`Need ${BREED_COST} coins to breed! 🪙`);
      return;
    }
    const keys = state.collection.map((c) => c.typeKey);
    const recipe = HYBRID_RECIPES.find((r) =>
      r.parents.every((p) => keys.includes(p))
    );
    if (!recipe) {
      showToast("Need compatible dinos! Try Raptor + Dilophosaurus or Trike + Ankyl.");
      return;
    }
    if (state.collection.some((c) => c.typeKey === recipe.result)) {
      showToast("Some hybrid dinosaurs can be bred again! Already have this hybrid.");
      return;
    }
    state.coins -= BREED_COST;
    state.collection.push({
      id: "d" + Date.now(),
      typeKey: recipe.result,
      nickname: DINO_TYPES[recipe.result].name,
    });
    showToast(`Bred a ${DINO_TYPES[recipe.result].emoji} ${DINO_TYPES[recipe.result].name}! 🧬`);
    updateHud();
    saveState();
  }

  function startBattle(mob, isBoss) {
    const zone = currentZone();
    const gym = getZoneGym(zone);
    const mobLevel = isBoss ? getBossLevel(zone) : mob.mobLevel;
    const typeKey = isBoss ? zone.mobs[0] : mob.typeKey;
    const type = DINO_TYPES[typeKey];
    const stats = getMobStats(typeKey, mobLevel, isBoss);

    battle = {
      mob,
      isBoss,
      mobLevel,
      gym,
      foeName: isBoss
        ? (gym ? `${gym.leader} (${gym.shortLabel})` : `${zone.name} Boss`)
        : `${type.name} Lv ${mobLevel}`,
      foeHp: stats.hp,
      foeMaxHp: stats.hp,
      foeAtk: stats.atk,
      youHp: state.hp,
      youMaxHp: maxHp(),
      expReward: stats.exp,
      coinReward: stats.coins,
      foeTimer: 0,
      playerTurn: 1,
    };

    document.getElementById("battle-overlay").classList.remove("hidden");
    window.GameSFX?.play("battle");
    document.getElementById("battle-banner").textContent = isBoss
      ? gym
        ? `${gym.badge} ${gym.name} — ${gym.leader} challenges you!`
        : `👑 ${battle.foeName} appeared!`
      : `Wild ${type.name} Lv ${mobLevel} — tranq to capture!`;
    document.getElementById("battle-you-name").textContent = state.name;
    document.getElementById("battle-foe-name").textContent = battle.foeName;
    updateBattleSpecialBtn();
    updateBattleHud();
    drawBattleScene(true);
  }

  function updateBattleHud() {
    if (!battle) return;
    const youPct = Math.max(0, (battle.youHp / battle.youMaxHp) * 100);
    const foePct = Math.max(0, (battle.foeHp / battle.foeMaxHp) * 100);
    document.getElementById("battle-you-hp").style.width = youPct + "%";
    document.getElementById("battle-foe-hp").style.width = foePct + "%";
    document.getElementById("battle-you-hp-text").textContent =
      `${Math.max(0, Math.floor(battle.youHp))} / ${battle.youMaxHp}`;
    document.getElementById("battle-foe-hp-text").textContent =
      `${Math.max(0, Math.floor(battle.foeHp))} / ${battle.foeMaxHp}`;
    updateBattleSpecialBtn();
  }

  function drawBattleScene(playerAttack) {
    if (!battleCtx) return;
    const zone = currentZone();
    battleCtx.clearRect(0, 0, battleCanvas.width, battleCanvas.height);
    DPSprites.drawBattleArena(battleCtx, battleCanvas.width, battleCanvas.height, zone, animT);
    const shake = playerAttack ? Math.sin(animT * 40) * 4 : 0;
    DPSprites.drawTrainer(battleCtx, 80 + shake, 80, 1.1, state.style, 1, animT, {
      panicked: true,
      upgrades: state.expansions,
    });
    if (battle.isBoss) {
      DPSprites.drawGymLeader(battleCtx, 240 - shake, 75, animT, zone, battle.mobLevel, battle.gym?.shortLabel);
    } else {
      DPSprites.drawWildDino(
        battleCtx,
        240 - shake,
        80,
        DINO_TYPES[battle.mob?.typeKey || "raptor"],
        animT,
        battle.mobLevel
      );
    }
  }

  function endBattle(won) {
    document.getElementById("battle-overlay").classList.add("hidden");
    window.GameSFX?.play(won ? "win" : "lose");
    if (won) {
      addExp(battle.expReward);
      state.coins += battle.coinReward;
      showToast(`Victory! +${battle.expReward} EXP, +${battle.coinReward} 🪙`);
      if (battle.isPvp) {
        showToast(`PvP win vs ${battle.foeName}! 🏆`);
      } else if (battle.isBoss) {
        const gym = battle.gym || getZoneGym(currentZone());
        if (!state.bossesBeaten.includes(state.zone)) {
          state.bossesBeaten.push(state.zone);
        }
        boss.beaten = true;
        buildPortals();
        if (gym) {
          showToast(`Earned the ${gym.badge} ${gym.name} Badge! 🏅`);
        }
        const next = state.zone + 1;
        if (next < ZONES.length) {
          const nextZone = getZone(next);
          if (isZoneUnlocked(next)) {
            showToast(`Zone unlocked: ${nextZone.name} · Mob Lv ${nextZone.mobLevel}!`);
          } else {
            showToast(`Need Lv ${nextZone.reqLevel} to enter ${nextZone.name}.`);
          }
        } else {
          showToast("You beat every gym leader! 👑");
        }
        renderZoneNav();
      } else if (battle.mob) {
        const z = currentZone();
        if (!z.isPark && !z.isPvp) {
          const typeKey = battle.mob.typeKey;
          const already = state.collection.some((c) => c.typeKey === typeKey);
          if (!already) {
            state.collection.push({
              id: "d" + Date.now(),
              typeKey,
              nickname: DINO_TYPES[typeKey].name,
            });
            showToast(`Captured ${DINO_TYPES[typeKey].emoji} ${DINO_TYPES[typeKey].name}!`);
            window.GameSFX?.play("capture");
          } else {
            state.coins += 8;
            showToast(`Already caught ${DINO_TYPES[typeKey].name}! +8 🪙`);
          }
        }
        mobs = mobs.filter((m) => m.id !== battle.mob.id);
        setTimeout(() => {
          mobs.push(createMob(Date.now(), currentZone()));
        }, 1500);
      }
      state.hp = Math.min(maxHp(), battle.youHp);
    } else {
      state.hp = maxHp();
      showToast("You got knocked out... but healed up!");
    }
    battle = null;
    updateHud();
    saveState();
  }

  function doAttack(special) {
    if (!battle) return;
    if (special && !canUseRockSmash()) {
      const wait = specialTurnsLeft();
      const status = document.getElementById("special-status");
      if (status) {
        status.textContent = `🪨 Rock Smash ready in ${wait} turn${wait === 1 ? "" : "s"}…`;
      }
      return;
    }
    const dmg = Math.floor((special ? specialPower() : attackPower()) * tranqMultiplier());
    window.GameSFX?.play(special ? "level" : "attack");
    battle.foeHp -= dmg + Math.floor(Math.random() * 4);
    battle.playerTurn++;
    drawBattleScene(true);
    updateBattleHud();
    if (battle.foeHp <= 0) {
      setTimeout(() => endBattle(true), 400);
      return;
    }
    setTimeout(() => {
      if (!battle) return;
      battle.youHp -= battle.foeAtk + Math.floor(Math.random() * 3);
      drawBattleScene(false);
      updateBattleHud();
      if (battle.youHp <= 0) setTimeout(() => endBattle(false), 400);
    }, 350);
  }

  function updateHud() {
    const zone = currentZone();
    document.getElementById("level-display").textContent = `🦕 Lv ${state.level}`;
    document.getElementById("exp-display").textContent =
      `✨ ${fmt(state.exp)} / ${fmt(expToNext(state.level))}`;
    document.getElementById("coin-display").textContent = `🪙 ${fmt(state.coins)}`;
    const dino = getActiveDino();
    const dinoName = dino ? DINO_TYPES[dino.typeKey]?.name : "Raptor";
    const mobLabel = zone.isPark
      ? `${state.collection.length} dinos · ${parkIncomeRate()}/sec`
      : zone.isPvp
        ? "PvP battles"
        : `Wild Lv ${zone.mobLevel}`;
    document.getElementById("world-label").textContent = `${zone.name} · ${mobLabel} · ${dinoName}`;
    if (state.hp < maxHp()) state.hp = maxHp();
    if (playing) updateLeaderboard();
  }

  function renderZoneNav() {
    const nav = document.getElementById("zone-nav");
    if (!nav) return;
    const zoneBtns = ZONES.map((z) => {
      const unlocked = isZoneUnlocked(z.id);
      const active = z.id === state.zone;
      const short = z.name.replace(/^[^\s]+\s/, "");
      const lvLabel = z.isPark ? "Park" : `Lv ${z.mobLevel}`;
      return `<button type="button" class="zone-btn ${active ? "active" : ""} ${unlocked ? "" : "locked"}" data-zone-id="${z.id}" ${unlocked ? "" : "disabled"} title="${unlocked ? z.name : `Unlock: Lv ${z.reqLevel}`}">
        ${unlocked ? z.name.split(" ")[0] : "🔒"} ${short}
        <span class="zone-lv">${lvLabel}</span>
      </button>`;
    }).join("");
    nav.innerHTML = zoneBtns;
    nav.querySelectorAll("[data-zone-id]").forEach((btn) => {
      btn.addEventListener("click", () => travelToZone(Number(btn.dataset.zoneId)));
    });
  }

  function renderExpansions() {
    const list = document.getElementById("upgrade-list");
    if (!list) return;
    list.innerHTML = EXPANSIONS.map((u) => {
      const owned = state.expansions.includes(u.id);
      const locked = u.req && !state.expansions.includes(u.req);
      return `
        <div class="upgrade-item ${owned ? "owned" : ""}">
          <span class="icon">${u.emoji}</span>
          <div class="info">
            <div class="title">${u.name}</div>
            <div class="desc">${u.desc}</div>
          </div>
          <button type="button" data-id="${u.id}" ${owned || state.coins < u.cost || locked ? "disabled" : ""}>
            ${owned ? "Owned" : locked ? "Locked" : `🪙 ${u.cost}`}
          </button>
        </div>`;
    }).join("");
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => buyExpansion(btn.dataset.id));
    });
  }

  function buyExpansion(id) {
    const u = EXPANSIONS.find((x) => x.id === id);
    if (!u || state.expansions.includes(id) || state.coins < u.cost) return;
    if (u.req && !state.expansions.includes(u.req)) {
      showToast("Buy Tranq Gun Mk1 first!");
      return;
    }
    state.coins -= u.cost;
    state.expansions.push(id);
    state.hp = maxHp();
    showToast(`Built ${u.name}! ${u.emoji}`);
    updateHud();
    renderExpansions();
    saveState();
  }

  function setupJoystick() {
    if (window.AllOutControls) {
      AllOutControls.bindJoystick(joy, keys);
      return;
    }
    const base = document.getElementById("joystick-base");
    const knob = document.getElementById("joystick-knob");
    if (!base || !knob) return;
    let pid = null;
    base.addEventListener("pointerdown", (e) => {
      pid = e.pointerId;
      base.setPointerCapture(pid);
      joy.active = true;
    });
    base.addEventListener("pointermove", (e) => {
      if (!joy.active || e.pointerId !== pid) return;
      const r = base.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const max = r.width * 0.35;
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      joy.dx = dx / max;
      joy.dy = dy / max;
    });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      joy.active = false;
      joy.dx = 0;
      joy.dy = 0;
      knob.style.transform = "translate(0,0)";
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
  }

  function gameLoop(now) {
    if (!playing) return;
    const dt = Math.min(0.05, ((now || performance.now()) - lastFrame) / 1000 || 0.016);
    lastFrame = now || performance.now();
    animT += dt;
    updateWorld(dt);
    drawWorld();
    if (battle) drawBattleScene(false);
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    state.name = document.getElementById("name-input").value.trim().slice(0, 14) || "Ranger";
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("zone-nav").classList.remove("hidden");
    document.getElementById("app").classList.add("playing");
    playing = true;
    state.hp = maxHp();
    riding = false;
    spawnMobs();
    updateHud();
    renderZoneNav();
    showToast(LOADING_TIPS[tipIndex % LOADING_TIPS.length]);
    tipIndex++;
    lastFrame = performance.now();
    resize();
    gameLoop();
    initMultiplayer();
    setInterval(() => {
      if (playing && !battle) {
        showToast(LOADING_TIPS[tipIndex % LOADING_TIPS.length]);
        tipIndex++;
      }
    }, 18000);
  }

  function bindEvents() {
    document.getElementById("play-btn").addEventListener("click", startGame);
    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".style-pick").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.style = btn.dataset.style;
        saveState();
      });
    });

    document.getElementById("fight-btn").addEventListener("click", () => {
      if (nearMob) startBattle(nearMob, false);
    });
    document.getElementById("boss-btn").addEventListener("click", () => {
      startBattle(null, true);
    });
    document.getElementById("portal-btn").addEventListener("click", () => {
      if (nearPortal) travelToZone(nearPortal.zoneId);
    });
    document.getElementById("feed-btn")?.addEventListener("click", feedDino);
    document.getElementById("breed-btn")?.addEventListener("click", breedHybrid);
    document.getElementById("ride-btn")?.addEventListener("click", toggleRide);
    document.getElementById("pvp-btn")?.addEventListener("click", () => {
      if (nearPvp) startPvpBattle(nearPvp);
    });
    document.getElementById("attack-btn").addEventListener("click", () => doAttack(false));
    document.getElementById("special-btn").addEventListener("click", () => doAttack(true));
    document.getElementById("flee-btn").addEventListener("click", () => endBattle(false));

    document.getElementById("settings-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.remove("hidden");
    });
    document.getElementById("close-settings-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.add("hidden");
    });
    document.getElementById("leave-game-btn").addEventListener("click", () => {
      if (window.GameMP) GameMP.stop();
      window.location.href = "../../index.html";
    });

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", (e) => { keys[e.key] = true; });
    window.addEventListener("keyup", (e) => { keys[e.key] = false; });
    setupJoystick();
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    battleCanvas = document.getElementById("battle-canvas");
    battleCtx = battleCanvas ? battleCanvas.getContext("2d") : null;
    state = loadState();
    document.getElementById("name-input").value = state.name;
    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.style === state.style);
    });
    bindEvents();
    resize();
  }

  init();

  window.__mobBattle3D = function () {
    if (!playing || battle) return null;
    const zone = ZONES[state.zone] || ZONES[0];
    return {
      worldW: 2600,
      worldH: 1800,
      ground: zone.floor || "#7cb342",
      defaultModel: "trainer",
      player: {
        x: player.x,
        y: player.y,
        facing: player.facing,
        model: "trainer",
        color: state.style === "cool" ? "#42a5f5" : state.style === "wild" ? "#26a69a" : "#ef5350",
      },
      entities: mobs.map((m, i) => ({
        id: m.id || `mob${i}`,
        x: m.x,
        y: m.y,
        model: "mob",
        color: m.color || "#ab47bc",
        scale: 0.75 + (m.level || 1) * 0.04,
      })),
    };
  };
})();
