(function () {
  "use strict";

  const SAVE_KEY = "raisingAMonster";
  const WORLD_W = 1800;
  const WORLD_H = 2200;
  const PLAYER_R = 22;
  const PLAYER_SPEED = 248;

  const FEED_BOWL = { x: 920, y: 620 };
  const FEED_COST = 0;
  const FEED_EXP = 22;

  const ZONES = [
    {
      id: 0,
      name: "🏡 Your Backyard",
      mobLevel: 0,
      reqLevel: 1,
      isYard: true,
      floor: "#7cb342",
      floorAlt: "#558b2f",
      decor: "yard",
      skyTop: "#7ec8f8",
      skyBot: "#b8e4ff",
      mobs: [],
      bossColor: "#689f38",
    },
    {
      id: 1,
      name: "🍄 Mushroom Grove",
      mobLevel: 4,
      reqLevel: 3,
      floor: "#dcedc8",
      floorAlt: "#aed581",
      water: "#0288d1",
      decor: "mushroom",
      skyTop: "#4fc3f7",
      skyBot: "#b3e5fc",
      mobs: ["fuzzy", "pebble", "slime"],
      bossColor: "#2e7d32",
    },
    {
      id: 2,
      name: "🍬 Candy Hills",
      mobLevel: 7,
      reqLevel: 5,
      floor: "#f8bbd0",
      floorAlt: "#f48fb1",
      decor: "candy",
      skyTop: "#ff8a65",
      skyBot: "#ffccbc",
      mobs: ["pebble", "rock", "bat"],
      bossColor: "#6d4c41",
    },
    {
      id: 3,
      name: "🌋 Volcano",
      mobLevel: 10,
      reqLevel: 7,
      floor: "#5d4037",
      floorAlt: "#3e2723",
      lava: "#ff5722",
      decor: "lava",
      skyTop: "#3e2723",
      skyBot: "#bf360c",
      mobs: ["ember", "rock", "bat"],
      bossColor: "#d84315",
    },
    {
      id: 4,
      name: "🌙 Moon Beach",
      mobLevel: 14,
      reqLevel: 10,
      floor: "#ffe082",
      floorAlt: "#ffca28",
      water: "#01579b",
      decor: "beach",
      skyTop: "#0d1b2a",
      skyBot: "#1b263b",
      mobs: ["bat", "rock", "crystal"],
      bossColor: "#455a64",
    },
    {
      id: 5,
      name: "❄️ Frost Fields",
      mobLevel: 18,
      reqLevel: 13,
      floor: "#eceff1",
      floorAlt: "#cfd8dc",
      decor: "frost",
      skyTop: "#78909c",
      skyBot: "#eceff1",
      mobs: ["frost", "crystal", "yeti"],
      bossColor: "#0288d1",
      bossName: "Glacier Tyrant",
      bossHp: 1000,
      bossEmoji: "❄️",
    },
    {
      id: 6,
      name: "💎 Crystal Peak",
      mobLevel: 22,
      reqLevel: 16,
      floor: "#5c6bc0",
      floorAlt: "#3949ab",
      decor: "crystal",
      skyTop: "#311b92",
      skyBot: "#7e57c2",
      mobs: ["crystal", "frost", "yeti"],
      bossColor: "#512da8",
      bossName: "Prism Overlord",
      bossHp: 1000,
      bossEmoji: "💎",
    },
    {
      id: 7,
      name: "👑 Apex Realm",
      mobLevel: 28,
      reqLevel: 20,
      floor: "#4a148c",
      floorAlt: "#311b92",
      decor: "peak",
      skyTop: "#1a0a2e",
      skyBot: "#4a148c",
      mobs: ["yeti", "crystal", "ember"],
      bossColor: "#880e4f",
      bossName: "Apex Sovereign",
      bossHp: 1000,
      bossEmoji: "👑",
    },
  ];

  const MOB_TYPES = {
    slime: { name: "Slime", emoji: "💧", color: "#9575cd", kind: "slime", hp: 35, atk: 6, exp: 12, coins: 4, rx: 18, ry: 16 },
    fuzzy: { name: "Fuzzball", emoji: "🧶", color: "#f48fb1", kind: "fuzzy", hp: 45, atk: 8, exp: 16, coins: 5, rx: 20, ry: 18 },
    pebble: { name: "Pebble Golem", emoji: "🪨", color: "#90a4ae", kind: "rock", hp: 55, atk: 10, exp: 20, coins: 6, rx: 22, ry: 20 },
    ember: { name: "Ember Sprite", emoji: "🔥", color: "#ff7043", kind: "fire", hp: 70, atk: 14, exp: 28, coins: 8, rx: 20, ry: 18 },
    rock: { name: "Magma Rock", emoji: "🌋", color: "#bf360c", kind: "rock", hp: 90, atk: 16, exp: 35, coins: 10, rx: 24, ry: 22 },
    bat: { name: "Ash Bat", emoji: "🦇", color: "#5d4037", kind: "bat", hp: 60, atk: 18, exp: 30, coins: 9, rx: 18, ry: 14 },
    frost: { name: "Frost Blob", emoji: "❄️", color: "#4fc3f7", kind: "frost", hp: 100, atk: 20, exp: 40, coins: 12, rx: 22, ry: 20 },
    crystal: { name: "Crystal Shard", emoji: "💎", color: "#7e57c2", kind: "crystal", hp: 120, atk: 22, exp: 48, coins: 14, rx: 20, ry: 24 },
    yeti: { name: "Mini Yeti", emoji: "🐻", color: "#eceff1", kind: "yeti", hp: 140, atk: 25, exp: 55, coins: 16, rx: 26, ry: 24 },
  };

  const UPGRADES = [
    { id: "horns", name: "Wild Horns", emoji: "😈", desc: "+5 attack", cost: 40, atk: 5 },
    { id: "crown", name: "Royal Crown", emoji: "👑", desc: "+25 max HP", cost: 60, hp: 25 },
    { id: "flame", name: "Spicy Bib", emoji: "🔥", desc: "Unlock Special — usable 1 in 3 turns", cost: 100, special: true },
    { id: "aura", name: "Rare Aura", emoji: "✨", desc: "+8 attack, +15 HP", cost: 180, atk: 8, hp: 15 },
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
  let nearMob = null;
  let nearFeed = false;
  let feedAnim = 0;
  let yardCoinTimer = 0;
  let battle = null;
  let joy = { active: false, dx: 0, dy: 0 };
  let keys = {};
  let toastTimer = 0;
  let remotePlayers = [];
  let state = defaultState();
  const btnSticky = { mob: false, boss: false, feed: false };

  function mpSubroom() {
    return "zone-" + state.zone;
  }

  function zoneRealismDecor(zone) {
    if (!zone || zone.isYard) return "day";
    if (zone.decor === "lava") return "volcano";
    if (zone.decor === "beach") return "depths";
    if (zone.decor === "frost") return "ice";
    if (zone.decor === "peak" || zone.decor === "crystal") return "depths";
    return "day";
  }

  function drawNameLabel(sx, sy, name, color) {
    ctx.font = "600 10px system-ui, -apple-system, sans-serif";
    const nm = (name || "Monster").slice(0, 10);
    const nw = ctx.measureText(nm).width + 14;
    ctx.fillStyle = "rgba(12,14,22,0.72)";
    ctx.beginPath();
    ctx.roundRect(sx - nw / 2, sy - 12, nw, 15, 4);
    ctx.fill();
    ctx.fillStyle = color || "rgba(255,248,240,0.95)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nm, sx, sy - 4);
  }

  function updateLeaderboard() {
    const el = document.getElementById("leaderboard");
    if (!el || !playing) return;
    const rows = [
      { name: state.name, level: state.level, you: true },
      ...remotePlayers.map((p) => ({
        name: p.name || "Monster",
        level: (p.state || {}).level || 1,
        remote: true,
      })),
    ]
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);

    el.innerHTML =
      "<h4>🍼 Top Trainers</h4>" +
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
      game: "raise-a-monster",
      subroom: mpSubroom(),
      getName: () => state.name,
      getState: () => ({
        zone: state.zone,
        x: player.x,
        y: player.y,
        facing: player.facing,
        style: state.style,
        level: state.level,
        hunger: state.hunger,
        upgrades: state.upgrades,
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
      name: "Caretaker",
      monsterName: "Fluffy",
      style: "cute",
      level: 1,
      exp: 0,
      coins: 15,
      hunger: 35,
      zone: 0,
      bossesBeaten: [],
      upgrades: [],
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
        if (!merged.monsterName) merged.monsterName = "Fluffy";
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

  function monsterScale() {
    return Math.min(1.65, 0.85 + state.level * 0.025);
  }

  function monsterPos() {
    const off = player.facing >= 0 ? -42 : 42;
    return { x: player.x + off, y: player.y + 12 };
  }

  function yardIncomeRate() {
    return 1.5 + Math.floor(state.level / 4);
  }

  function isZoneUnlocked(zoneId) {
    if (zoneId <= 0) return true;
    const z = getZone(zoneId);
    if (state.level < z.reqLevel) return false;
    if (zoneId === 1) return true;
    return state.bossesBeaten.includes(zoneId - 1);
  }

  function getMobStats(typeKey, mobLevel, isBoss, zone) {
    const base = MOB_TYPES[typeKey] || MOB_TYPES.slime;
    const lvMult = 1 + (mobLevel - 1) * 0.22;
    if (isBoss) {
      const bossHp =
        zone && zone.bossHp != null
          ? zone.bossHp
          : Math.floor(base.hp * BOSS_MULT.hp * lvMult);
      return {
        hp: bossHp,
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
    const typeKey = zone.mobs[Math.floor(Math.random() * zone.mobs.length)];
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

  function expToNext(lv) {
    return Math.floor(50 * Math.pow(1.35, lv - 1));
  }

  function maxHp() {
    let hp = 80 + state.level * 12;
    UPGRADES.forEach((u) => {
      if (state.upgrades.includes(u.id) && u.hp) hp += u.hp;
    });
    return hp;
  }

  function attackPower() {
    let atk = 8 + state.level * 3;
    UPGRADES.forEach((u) => {
      if (state.upgrades.includes(u.id) && u.atk) atk += u.atk;
    });
    return atk;
  }

  function specialPower() {
    return Math.floor(attackPower() * 1.8);
  }

  function hasSpecial() {
    return state.upgrades.includes("flame");
  }

  function canUseSpecial() {
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
        status.textContent = "🔥 Unlock Spicy Bib in 🎨 Upgrades to use Special!";
      }
      return;
    }
    btn.classList.remove("hidden");
    status?.classList.remove("hidden");
    const ready = canUseSpecial();
    const wait = specialTurnsLeft();
    btn.disabled = false;
    btn.classList.toggle("cooldown", !ready);
    btn.textContent = "🔥 Special";
    if (status) {
      status.className = ready ? "special-status ready" : "special-status wait";
      status.textContent = ready
        ? "🔥 Special is READY! (1 of every 3 turns)"
        : `🔥 Special ready in ${wait} turn${wait === 1 ? "" : "s"}…`;
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
    setBtnVisible(document.getElementById("fight-btn"), btnSticky.mob && !battle && !zone.isYard);
    setBtnVisible(document.getElementById("boss-btn"), btnSticky.boss && !battle);
    setBtnVisible(document.getElementById("feed-btn"), btnSticky.feed && !battle && zone.isYard);
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
      showToast(`Level up! ${state.monsterName} is Lv ${state.level}! 🎉`);
      renderZoneNav();
      updateLeaderboard();
    }
    updateHud();
    saveState();
  }

  function spawnMobs() {
    mobs = [];
    const zone = currentZone();
    if (zone.isYard) {
      boss = { x: 0, y: 0, beaten: true };
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
  }

  function feedMonster() {
    if (!currentZone().isYard) return;
    if (state.hunger >= 95) {
      showToast(`${state.monsterName} is full! 🍽️`);
      return;
    }
    state.hunger = Math.min(100, state.hunger + 30);
    feedAnim = 1.2;
    addExp(FEED_EXP);
    showToast(`Fed ${state.monsterName} mashed carrots! 🥕`);
    updateHud();
    saveState();
  }

  function travelToZone(zoneId) {
    if (battle || zoneId === state.zone) return;
    if (!isZoneUnlocked(zoneId)) {
      const z = getZone(zoneId);
      showToast(`Need Lv ${z.reqLevel} and beat previous zone boss!`);
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
    showToast(`Traveled to ${getZone(zoneId).name} · Mob Lv ${getZone(zoneId).mobLevel}`);
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

    ctx.fillStyle = zone.isYard ? "#87ceeb" : (zone.skyBot || "#b8e4ff");
    ctx.fillRect(0, 0, w, h);

    RMSprites.drawZoneSky(ctx, w, h, camX, camY, zone, animT);

    const tile = 64;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty > WORLD_H) continue;
        RMSprites.drawWorldTile(ctx, tx - camX, ty - camY, tile, tile, zone, tx + ty, tx, ty, animT);
      }
    }

    if (zone.isYard) {
      RMSprites.drawBackyardProps(ctx, camX, camY, w, h, animT);
    } else {
      RMSprites.drawZoneProps(ctx, camX, camY, w, h, zone, animT);
    }

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 3;
    ctx.strokeRect(-camX + 2, -camY + 2, WORLD_W - 4, WORLD_H - 4);

    if (zone.isYard) {
      const fs = worldToScreen(FEED_BOWL.x, FEED_BOWL.y);
      RMSprites.drawFeedBowl(ctx, fs.x, fs.y, animT, nearFeed);
    }

    if (!boss.beaten && !zone.isYard) {
      const bs = worldToScreen(boss.x, boss.y);
      if (bs.x > -80 && bs.x < w + 80) {
        RMSprites.drawBoss(ctx, bs.x, bs.y, animT, zone, zone.mobLevel + 3);
        ctx.font = "bold 11px system-ui,sans-serif";
        ctx.fillStyle = "#ffeb3b";
        ctx.textAlign = "center";
        const bossTag = zone.bossName
          ? `${zone.bossEmoji || "👹"} ${zone.bossName}`
          : `👹 BOSS Lv ${zone.mobLevel + 3}`;
        ctx.fillText(bossTag, bs.x, bs.y - 118);
        if (zone.bossHp) {
          ctx.font = "600 9px system-ui,sans-serif";
          ctx.fillStyle =
            zone.decor === "crystal"
              ? "#ce93d8"
              : zone.decor === "peak"
                ? "#ffd54f"
                : "#81d4fa";
          ctx.fillText(`${zone.bossHp} HP`, bs.x, bs.y - 104);
          ctx.font = "bold 11px system-ui,sans-serif";
          ctx.fillStyle = "#ffeb3b";
        }
      }
    }

    mobs.forEach((m) => {
      const s = worldToScreen(m.x, m.y);
      if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
      RMSprites.drawMob(ctx, s.x, s.y, MOB_TYPES[m.typeKey], animT + m.id, m.mobLevel);
    });

    const entities = [];
    remotePlayers.forEach((p) => {
      const st = p.state || {};
      if (st.battle) return;
      const wx = typeof st.x === "number" ? st.x : 400;
      const wy = typeof st.y === "number" ? st.y : 400;
      const off = (st.facing || 1) >= 0 ? -42 : 42;
      entities.push({ type: "remote", y: wy, p, st, wx, wy, mx: wx + off, my: wy + 12 });
    });
    const mp = monsterPos();
    entities.push({ type: "pet", y: mp.y });
    entities.push({ type: "player", y: player.y });
    entities.sort((a, b) => a.y - b.y);

    entities.forEach((e) => {
      if (e.type === "remote") {
        const s = worldToScreen(e.wx, e.wy);
        const ms = worldToScreen(e.mx, e.my);
        if (s.x < -120 || s.x > w + 120 || s.y < -120 || s.y > h + 120) return;
        RMSprites.drawMonster(ctx, ms.x, ms.y, 0.8 + ((e.st.level || 1) * 0.015), animT + (e.p.id || 0), {
          kind: "pet",
          happy: (e.st.hunger || 50) > 40,
          upgrades: e.st.upgrades || [],
          facing: e.st.facing || 1,
        });
        RMSprites.drawCaretaker(ctx, s.x, s.y, e.st.facing || 1, animT + (e.p.id || 0), {
          style: e.st.style || "cute",
          walk: true,
        });
        drawNameLabel(s.x, s.y - 42, e.p.name, "#0288d1");
      } else if (e.type === "pet") {
        const ps = worldToScreen(mp.x, mp.y);
        RMSprites.drawMonster(ctx, ps.x, ps.y, monsterScale(), animT, {
          kind: "pet",
          happy: state.hunger > 35,
          munch: feedAnim > 0,
          upgrades: state.upgrades,
          facing: player.facing,
        });
        if (feedAnim > 0) {
          const fs = worldToScreen(player.x + player.facing * 30, player.y - 20);
          RMSprites.drawSpoon(ctx, fs.x, fs.y, animT, true);
        }
      } else {
        const ps = worldToScreen(player.x, player.y);
        RMSprites.drawCaretaker(ctx, ps.x, ps.y, player.facing, animT, {
          style: state.style,
          walk: joy.dx !== 0 || joy.dy !== 0 || keys.ArrowLeft || keys.w,
          feeding: feedAnim > 0,
          holdSpoon: feedAnim > 0,
        });
        drawNameLabel(ps.x, ps.y - 42, state.name, "#e1bee7");
      }
    });

    const ps = worldToScreen(player.x, player.y);
    RMSprites.drawPostFX(ctx, w, h, animT, ps.x, ps.y);
    const z = currentZone();
    const nightish = z.decor === "beach" || z.decor === "peak";
    window.GameRealism?.postFrame(ctx, w, h, {
      animT,
      focusX: ps.x,
      focusY: ps.y,
      zone: z,
      decor: zoneRealismDecor(z),
      isNight: nightish,
      vignette: nightish ? 0.36 : z.decor === "lava" ? 0.3 : 0.24,
      grainCount: 400,
      lighting: true,
      ao: true,
      haze: !nightish,
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
      const spd = PLAYER_SPEED * dt;
      const nx = player.x + dx * spd;
      const ny = player.y + dy * spd;
      if (!collides(nx, player.y, PLAYER_R)) player.x = nx;
      if (!collides(player.x, ny, PLAYER_R)) player.y = ny;
      player.facing = dx >= 0 ? 1 : -1;
    }

    cam.x += (player.x - cam.x) * Math.min(1, dt * 8);
    cam.y += (player.y - cam.y) * Math.min(1, dt * 8);

    if (feedAnim > 0) feedAnim = Math.max(0, feedAnim - dt);

    if (zone.isYard) {
      state.hunger = Math.max(0, state.hunger - dt * 3.5);
      state.coins += yardIncomeRate() * dt;
      yardCoinTimer += dt;
      if (yardCoinTimer > 4) {
        yardCoinTimer = 0;
        updateHud();
      }
      nearFeed = stickyNear(
        Math.hypot(FEED_BOWL.x - player.x, FEED_BOWL.y - player.y),
        75,
        95,
        "feed"
      );
    } else {
      nearFeed = false;
      btnSticky.feed = false;
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
    if (zone.isYard) btnSticky.mob = false;
    else if (!stickyNear(nearestMobDist, 100, 130, "mob")) nearMob = null;

    const bossDist = Math.hypot(boss.x - player.x, boss.y - player.y);
    if (boss.beaten || zone.isYard) {
      btnSticky.boss = false;
    } else {
      stickyNear(bossDist, 125, 155, "boss");
    }

    updateActionButtons();

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) document.getElementById("toast")?.classList.add("hidden");
    }
  }

  function startBattle(mob, isBoss) {
    const zone = currentZone();
    const mobLevel = isBoss ? zone.mobLevel + 3 : mob.mobLevel;
    const typeKey = isBoss ? zone.mobs[0] : mob.typeKey;
    const type = MOB_TYPES[typeKey];
    const stats = getMobStats(typeKey, mobLevel, isBoss, zone);

    battle = {
      mob,
      isBoss,
      mobLevel,
      foeName: isBoss
        ? zone.bossName || `${zone.name} Boss`
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
      ? `👹 ${battle.foeName} appeared!`
      : `Wild ${type.name} Lv ${mobLevel} appeared!`;
    document.getElementById("battle-you-name").textContent = state.monsterName;
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
    RMSprites.drawBattleArena(battleCtx, battleCanvas.width, battleCanvas.height, zone, animT);
    const shake = playerAttack ? Math.sin(animT * 40) * 4 : 0;
    RMSprites.drawCaretaker(battleCtx, 70 + shake, 82, 1, animT, {
      style: state.style,
      holdSpoon: playerAttack,
    });
    RMSprites.drawMonster(battleCtx, 95 + shake, 92, 0.95, animT, {
      kind: "pet",
      munch: playerAttack,
      upgrades: state.upgrades,
      happy: true,
    });
    if (battle.isBoss) {
      RMSprites.drawBoss(battleCtx, 248 - shake, 88, animT, zone, battle.mobLevel);
    } else {
      RMSprites.drawMob(
        battleCtx,
        248 - shake,
        95,
        MOB_TYPES[battle.mob?.typeKey || "slime"],
        animT,
        battle.mobLevel
      );
    }
    const nightish = zone.decor === "beach" || zone.decor === "peak";
    window.GameRealism?.postFrame(battleCtx, battleCanvas.width, battleCanvas.height, {
      animT,
      focusX: battleCanvas.width * 0.5,
      focusY: battleCanvas.height * 0.55,
      zone,
      decor: zoneRealismDecor(zone),
      isNight: nightish,
      vignette: 0.28,
      grainCount: 320,
      lighting: true,
      ao: true,
    });
  }

  function endBattle(won) {
    document.getElementById("battle-overlay").classList.add("hidden");
    window.GameSFX?.play(won ? "win" : "lose");
    if (won) {
      addExp(battle.expReward);
      state.coins += battle.coinReward;
      showToast(`Victory! +${battle.expReward} EXP, +${battle.coinReward} 🪙`);
      if (battle.isBoss) {
        if (!state.bossesBeaten.includes(state.zone)) {
          state.bossesBeaten.push(state.zone);
        }
        boss.beaten = true;
        const next = state.zone + 1;
        if (next < ZONES.length) {
          const nextZone = getZone(next);
          if (isZoneUnlocked(next)) {
            showToast(`Zone unlocked: ${nextZone.name} · Mob Lv ${nextZone.mobLevel}!`);
          } else {
            showToast(`Need Lv ${nextZone.reqLevel} to enter ${nextZone.name}.`);
          }
        } else {
          showToast("You conquered every zone! 👑");
        }
        renderZoneNav();
      } else if (battle.mob) {
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
    if (special && !canUseSpecial()) {
      const wait = specialTurnsLeft();
      const status = document.getElementById("special-status");
      if (status) {
        status.textContent = `🔥 Special ready in ${wait} turn${wait === 1 ? "" : "s"}…`;
      }
      return;
    }
    const dmg = special ? specialPower() : attackPower();
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
    document.getElementById("level-display").textContent = `🍼 Lv ${state.level}`;
    document.getElementById("exp-display").textContent =
      `✨ ${fmt(state.exp)} / ${fmt(expToNext(state.level))}`;
    document.getElementById("coin-display").textContent = `🪙 ${fmt(state.coins)}`;
    const hungerPct = Math.floor(state.hunger);
    const zoneLabel = zone.isYard
      ? `${state.monsterName} · 🍖 ${hungerPct}% full · ${yardIncomeRate()}/sec`
      : `${zone.name} · Mob Lv ${zone.mobLevel}`;
    document.getElementById("world-label").textContent = zoneLabel;
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
      const lvLabel = z.isYard ? "Home" : `Lv ${z.mobLevel}`;
      return `<button type="button" class="zone-btn ${active ? "active" : ""} ${unlocked ? "" : "locked"}" data-zone-id="${z.id}" ${unlocked ? "" : "disabled"} title="${unlocked ? z.name : `Unlock: Lv ${z.reqLevel}`}">
        ${unlocked ? z.name.split(" ")[0] : "🔒"} ${short}
        <span class="zone-lv">${lvLabel}</span>
      </button>`;
    }).join("");
    nav.innerHTML =
      zoneBtns +
      `<button type="button" class="zone-btn zone-util" data-zone="upgrades">🎨 Wild Shop</button>`;
    nav.querySelectorAll("[data-zone-id]").forEach((btn) => {
      btn.addEventListener("click", () => travelToZone(Number(btn.dataset.zoneId)));
    });
    nav.querySelector("[data-zone=upgrades]")?.addEventListener("click", () => {
      renderUpgrades();
      document.getElementById("upgrade-overlay").classList.remove("hidden");
    });
  }

  function renderUpgrades() {
    const list = document.getElementById("upgrade-list");
    if (!list) return;
    list.innerHTML = UPGRADES.map((u) => {
      const owned = state.upgrades.includes(u.id);
      return `
        <div class="upgrade-item ${owned ? "owned" : ""}">
          <span class="icon">${u.emoji}</span>
          <div class="info">
            <div class="title">${u.name}</div>
            <div class="desc">${u.desc}</div>
          </div>
          <button type="button" data-id="${u.id}" ${owned || state.coins < u.cost ? "disabled" : ""}>
            ${owned ? "Owned" : `🪙 ${u.cost}`}
          </button>
        </div>`;
    }).join("");
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => buyUpgrade(btn.dataset.id));
    });
  }

  function buyUpgrade(id) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u || state.upgrades.includes(id) || state.coins < u.cost) return;
    state.coins -= u.cost;
    state.upgrades.push(id);
    state.hp = maxHp();
    showToast(`Got ${u.name} for ${state.monsterName}! ${u.emoji}`);
    updateHud();
    renderUpgrades();
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
    state.name = document.getElementById("name-input").value.trim().slice(0, 14) || "Caretaker";
    state.monsterName = document.getElementById("monster-name-input").value.trim().slice(0, 14) || "Fluffy";
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("zone-nav").classList.remove("hidden");
    document.getElementById("app").classList.add("playing", "in-game");
    playing = true;
    state.hp = maxHp();
    spawnMobs();
    updateHud();
    renderZoneNav();
    lastFrame = performance.now();
    resize();
    gameLoop();
    initMultiplayer();
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
    document.getElementById("feed-btn")?.addEventListener("click", feedMonster);
    document.getElementById("attack-btn").addEventListener("click", () => doAttack(false));
    document.getElementById("special-btn").addEventListener("click", () => doAttack(true));
    document.getElementById("flee-btn").addEventListener("click", () => endBattle(false));

    document.getElementById("upgrade-btn").addEventListener("click", () => {
      renderUpgrades();
      document.getElementById("upgrade-overlay").classList.remove("hidden");
    });
    document.getElementById("upgrade-close-btn").addEventListener("click", () => {
      document.getElementById("upgrade-overlay").classList.add("hidden");
    });

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
    const monsterInput = document.getElementById("monster-name-input");
    if (monsterInput) monsterInput.value = state.monsterName || "Fluffy";
    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.style === state.style);
    });
    bindEvents();
    resize();
  }

  init();

  window.__raiseMonster3D = function () {
    if (!playing || battle) return null;
    const zone = ZONES[state.zone] || ZONES[0];
    return {
      worldW: 2600,
      worldH: 1800,
      ground: zone.floor || "#7e57c2",
      defaultModel: "mob",
      player: {
        x: player.x,
        y: player.y,
        facing: player.facing,
        model: "trainer",
        color: "#ab47bc",
      },
      entities: mobs.map((m, i) => ({
        id: m.id || `mob${i}`,
        x: m.x,
        y: m.y,
        model: "mob",
        color: m.color || "#66bb6a",
        scale: 0.8 + (m.level || 1) * 0.04,
      })),
    };
  };
})();
