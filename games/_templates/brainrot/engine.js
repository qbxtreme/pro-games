(function () {
  "use strict";

  const C = Object.assign({}, window.BRAINROT_DEFAULTS, window.GAME_CONFIG);
  if (!C.zones) throw new Error("GAME_CONFIG required");
  window.GAME_CONFIG = C;

  const VARIANT = C.variant || "evolve";
  const WORLD_W = 2000;
  const WORLD_H = 1400;
  const PLAYER_R = 22;
  const PLAYER_SPEED = 248;
  const FEED_STATION = { x: 520, y: 480 };
  const BREED_STATION = { x: 820, y: 480 };
  const BUY_STATION = { x: 320, y: 720 };
  const REBIRTH_SHRINE = { x: 1200, y: 720 };
  const RARE_SHOWCASE = { x: 1520, y: 480 };
  const FEED_COST = 10;
  const FEED_EXP = 28;
  const BREED_COST = 40;
  const BUY_BRAINROT_COST = 85;
  const STEAL_COST = 25;
  const RIDE_SPEED_MULT = 1.75;
  const REBIRTH_LEVEL_REQ = 12;
  const REBIRTH_COIN_REQ = 2500;
  const REBIRTH_BONUS = 0.2;

  const BASE_ROOMS = [
    { x: 120, y: 120, w: 360, h: 300, floor: "#fff9c4", wall: "#f9a825", label: "🛒 Shop" },
    { x: 500, y: 120, w: 340, h: 260, floor: "#e1bee7", wall: "#8e24aa", label: "🧬 Merge Lab" },
    { x: 860, y: 120, w: 300, h: 240, floor: "#ffccbc", wall: "#e64a19", label: "🍔 Feed Pen" },
    { x: 1180, y: 120, w: 380, h: 280, floor: "#b2ebf2", wall: "#00838f", label: "✨ Rare Wall" },
    { x: 120, y: 440, w: 520, h: 320, floor: "#c8e6c9", wall: "#2e7d32", label: "🏠 Your Base" },
    { x: 660, y: 440, w: 420, h: 320, floor: "#d1c4e9", wall: "#5e35b1", label: "♻️ Rebirth" },
    { x: 1100, y: 440, w: 460, h: 320, floor: "#ffe082", wall: "#ff8f00", label: "👥 Multi Lobby" },
  ];

  const ZONES = C.zones;
  const MOB_TYPES = C.mobTypes;
  const FUSION_RECIPES = C.fusionRecipes;
  const GEAR = C.gear;
  const LOADING_TIPS = C.loadingTips;
  const SAVE_KEY = C.saveKey;
  const STARTER_MOB = C.starterMob;
  const RARE_MOB = C.rareMobType;
  const SPECIAL_GEAR_ID = C.specialGearId || "net";

  function ui(key, vars) {
    const UI_DEFAULTS = {
      trainerFallback: "Player",
      defaultName: "Player",
      starterNickname: "Buddy",
      levelEmoji: "🎮",
      levelDisplay: "{emoji} Lv {level}",
      levelUp: "Level up! {emoji} Lv {level}!",
      leaderboardTitle: "🏆 Top Players",
      pierIncome: "base income",
      pvpBattles: "PvP battles",
      wildLevel: "Wild Lv {level}",
      pierCollection: "{count} captured · {rate}/sec",
      travelToast: "Traveled to {name} · {detail}",
      zoneLocked: "Need Lv {reqLevel} and beat previous zone boss!",
      zoneNavPier: "Base",
      zoneNavPvp: "PvP",
      zoneNavLv: "Lv {level}",
      unlockTitle: "Unlock: Lv {reqLevel}",
      feedStation: "🍖 Feed Station",
      fusionStation: "🧬 Fusion Lab",
      activeLabel: "★ Active",
      mythicLabel: "👑 MYTHIC Lv {level}",
      mythicBossFallback: "Mythic Boss",
      battlePvpBanner: "⚔️ PvP vs {name}!",
      battleBossBanner: "👑 Mythic {name} appeared!",
      battleWildBanner: "Wild {name} Lv {level} — capture to collect!",
      specialUnlock: "💥 Unlock Power Move in {shop}!",
      specialReady: "💥 Power Move is READY! (1 of every 3 turns)",
      specialWait: "💥 Power Move ready in {wait} turn{plural}…",
      evolved: "Evolved into {name}! 🌟",
      rebirthDone: "Rebirth! +{pct}% income forever ♻️",
      rebirthNeed: "Need Lv {level} & {coins} 🪙 to rebirth",
      stoleBrainrot: "Stole {emoji} {name} from {player}! 🤫",
      stealFailed: "Steal failed — they fought back!",
      boughtBrainrot: "Bought {emoji} {name}! 🛒",
      buyNeedCoins: "Need {cost} coins to buy a brainrot!",
      fattened: "Fattened +{fat} — chonky brainrot! 🍔",
      boneSmash: "Smashed +{bones} bones! 💀",
      rescued: "Saved a brainrot! +{exp} EXP 💾",
      tsunamiWarn: "🌊 TSUNAMI — run to high ground!",
      noiseWake: "😱 You woke the brainrots!",
      feedNeedCoins: "Need {cost} coins to feed! 🪙",
      feedSuccess: "Fed your team! +{exp} EXP 🍖",
      breedNeedCoins: "Need {cost} coins to fuse! 🪙",
      breedNoRecipe: "Need compatible units to fuse!",
      breedAlreadyHave: "Already have this fusion!",
      breedSuccess: "Fused a {emoji} {name}! 🧬",
      rideOn: "Boost mode on! 🚀",
      rideOff: "Boost off.",
      victory: "Victory! +{exp} EXP, +{coin} 🪙",
      pvpWin: "PvP win vs {name}! 🏆",
      zoneUnlocked: "Zone unlocked: {name} · Mob Lv {level}!",
      zoneNeedLevel: "Need Lv {reqLevel} to enter {name}.",
      allZonesConquered: "You conquered every zone! 👑",
      captured: "Captured {emoji} {name}!",
      alreadyCaught: "Already caught {name}! +8 🪙",
      knockedOut: "You got knocked out... but healed up!",
      buyReqFirst: "Buy Pro Gear Mk1 first!",
      buyOwned: "Owned",
      buyLocked: "Locked",
      bought: "Got {name}! {emoji}",
    };
    let s = (C.ui && C.ui[key]) || UI_DEFAULTS[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        s = s.replace(new RegExp("\\{" + k + "\\}", "g"), v);
      });
    }
    if (C.ui && C.ui.levelEmoji) {
      s = s.replace(/\{emoji\}/g, C.ui.levelEmoji);
    }
    return s;
  }

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
  let tsunamiY = WORLD_H + 200;
  let noiseMeter = 0;
  let nearBuy = false;
  let nearRebirth = false;
  let nearSteal = null;
  let rescueTargets = [];
  let state = defaultState();

  function mpSubroom() {
    return "zone-" + state.zone;
  }

  function drawNameLabel(sx, sy, name, color) {
    ctx.font = "600 9px system-ui,sans-serif";
    const nm = (name || ui("trainerFallback")).slice(0, 10);
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
        name: p.name || ui("trainerFallback"),
        level: (p.state || {}).level || 1,
        remote: true,
      })),
    ]
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);

    el.innerHTML =
      "<h4>" + ui("leaderboardTitle") + "</h4>" +
      rows
        .map(
          (r, i) =>
            `<div class="lb-row ${r.you ? "you" : r.remote ? "remote" : ""}"><span>#${i + 1} ${r.name.slice(0, 10)}</span><span>Lv ${r.level}</span></div>`
        )
        .join("");
  }

  function initMultiplayer() {
    if (!window.GameMP) return;
    GameMP.init({
      game: C.mpGame,
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
        activeDino: (getActiveFish() || {}).typeKey,
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
      name: ui("defaultName"),
      style: "cute",
      level: 1,
      exp: 0,
      coins: 25,
      zone: 0,
      rebirths: 0,
      bones: 0,
      fat: 0,
      bossesBeaten: [],
      expansions: [],
      collection: [{ id: "starter", typeKey: STARTER_MOB, nickname: ui("starterNickname") }],
      activeDino: "starter",
      hp: 100,
    };
  }

  function rebirthMult() {
    return 1 + (state.rebirths || 0) * REBIRTH_BONUS;
  }

  function variantFeedCost() {
    if (VARIANT === "fatten") return Math.max(8, FEED_COST - state.fat * 0.01);
    return FEED_COST;
  }

  function variantFeedExp() {
    if (VARIANT === "fatten") return FEED_EXP + Math.floor(state.fat * 0.5);
    if (VARIANT === "bones") return FEED_EXP + Math.floor(state.bones * 0.2);
    return FEED_EXP;
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
          merged.collection = [{ id: "starter", typeKey: STARTER_MOB, nickname: ui("starterNickname") }];
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

  function getActiveFish() {
    if (!state.collection || !state.collection.length) return null;
    return state.collection.find((c) => c.id === state.activeDino) || state.collection[0];
  }

  function parkIncomeRate() {
    let rate = 2;
    GEAR.forEach((e) => {
      if (state.expansions.includes(e.id) && e.income) rate += e.income;
    });
    return rate * rebirthMult();
  }

  function rareBrainrots() {
    return (state.collection || []).filter((c) => {
      const t = MOB_TYPES[c.typeKey];
      return t && (t.rare || t.hybrid || c.typeKey === RARE_MOB);
    });
  }

  function renderRareShowcase() {
    const el = document.getElementById("rare-showcase");
    if (!el) return;
    const rares = rareBrainrots().slice(0, 6);
    if (!rares.length) {
      el.innerHTML = `<span class="rare-empty">${C.ui.rareTitle || "✨ Rare"}</span>`;
      return;
    }
    el.innerHTML =
      `<span class="rare-title">${C.ui.rareTitle || "✨ Rare"}</span>` +
      rares
        .map((c) => {
          const t = MOB_TYPES[c.typeKey] || {};
          return `<span class="rare-chip" title="${t.name || c.nickname}">${t.emoji || "🧠"}</span>`;
        })
        .join("");
  }

  function tryRebirth() {
    if (state.level < REBIRTH_LEVEL_REQ || state.coins < REBIRTH_COIN_REQ) {
      showToast(ui("rebirthNeed", { level: REBIRTH_LEVEL_REQ, coins: fmt(REBIRTH_COIN_REQ) }));
      return;
    }
    state.coins -= REBIRTH_COIN_REQ;
    state.rebirths = (state.rebirths || 0) + 1;
    state.level = 1;
    state.exp = 0;
    state.bossesBeaten = [];
    state.zone = 0;
    player.x = 400;
    player.y = 400;
    spawnMobs();
    renderZoneNav();
    showToast(ui("rebirthDone", { pct: Math.round(state.rebirths * REBIRTH_BONUS * 100) }));
    updateHud();
    saveState();
  }

  function buyBrainrot() {
    if (state.coins < BUY_BRAINROT_COST) {
      showToast(ui("buyNeedCoins", { cost: BUY_BRAINROT_COST }));
      return;
    }
    const pool = Object.keys(MOB_TYPES).filter((k) => MOB_TYPES[k].kind === "unit");
    let typeKey = pool[Math.floor(Math.random() * pool.length)];
    if (Math.random() < 0.08 && RARE_MOB) typeKey = RARE_MOB;
    if (state.collection.some((c) => c.typeKey === typeKey)) {
      state.coins += 15;
      showToast(ui("alreadyCaught", { name: MOB_TYPES[typeKey].name }));
      return;
    }
    state.coins -= BUY_BRAINROT_COST;
    state.collection.push({
      id: "d" + Date.now(),
      typeKey,
      nickname: MOB_TYPES[typeKey].name,
    });
    showToast(ui("boughtBrainrot", { emoji: MOB_TYPES[typeKey].emoji, name: MOB_TYPES[typeKey].name }));
    renderRareShowcase();
    updateHud();
    saveState();
  }

  function stealBrainrot() {
    if (!nearSteal) return;
    if (state.coins < STEAL_COST) {
      showToast(ui("buyNeedCoins", { cost: STEAL_COST }));
      return;
    }
    const st = nearSteal.state || {};
    const typeKey = st.activeDino || STARTER_MOB;
    if (state.collection.some((c) => c.typeKey === typeKey)) {
      showToast(ui("stealFailed"));
      return;
    }
    if (Math.random() > 0.45 + catchMultiplier() * 0.15) {
      showToast(ui("stealFailed"));
      state.coins -= Math.floor(STEAL_COST / 2);
      updateHud();
      return;
    }
    state.coins -= STEAL_COST;
    state.collection.push({
      id: "d" + Date.now(),
      typeKey,
      nickname: MOB_TYPES[typeKey]?.name || "Stolen",
    });
    showToast(ui("stoleBrainrot", {
      emoji: MOB_TYPES[typeKey]?.emoji || "🧠",
      name: MOB_TYPES[typeKey]?.name || "Brainrot",
      player: nearSteal.name || ui("trainerFallback"),
    }));
    renderRareShowcase();
    updateHud();
    saveState();
  }

  function drawBaseRooms(camX, camY) {
    BASE_ROOMS.forEach((room) => {
      const sx = room.x - camX;
      const sy = room.y - camY;
      if (sx + room.w < -40 || sx > w + 40 || sy + room.h < -40 || sy > h + 40) return;
      ctx.fillStyle = room.floor;
      ctx.strokeStyle = room.wall;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(sx, sy, room.w, room.h, 12);
      ctx.fill();
      ctx.stroke();
      ctx.font = "bold 12px 'Comic Sans MS', system-ui, sans-serif";
      ctx.fillStyle = "#111";
      ctx.textAlign = "center";
      ctx.fillText(room.label, sx + room.w / 2, sy + 22);
    });
  }

  function baseRoomCollision(wx, wy, r) {
    for (const room of BASE_ROOMS) {
      if (wx + r > room.x + 8 && wx - r < room.x + room.w - 8 &&
          wy + r > room.y + 8 && wy - r < room.y + room.h - 8) {
        return true;
      }
    }
    return false;
  }

  function checkEvolution() {
    const dino = getActiveFish();
    if (!dino) return;
    const type = MOB_TYPES[dino.typeKey];
    if (type?.evolve && state.level >= type.evolveLv) {
      dino.typeKey = type.evolve;
      showToast(ui("evolved", { name: MOB_TYPES[type.evolve].name }));
    }
  }

  function isZoneUnlocked(zoneId) {
    if (zoneId <= 0) return true;
    const z = getZone(zoneId);
    if (state.level < z.reqLevel) return false;
    if (z.isPvp) return true;
    if (zoneId === 1) return true;
    const prev = getZone(zoneId - 1);
    if (prev.isPier) return true;
    return state.bossesBeaten.includes(zoneId - 1);
  }

  function getMobStats(typeKey, mobLevel, isBoss) {
    const base = MOB_TYPES[typeKey] || MOB_TYPES[STARTER_MOB];
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
    if (RARE_MOB && Math.random() < 0.06) typeKey = RARE_MOB;
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

  function catchMultiplier() {
    let mult = 1;
    GEAR.forEach((e) => {
      if (state.expansions.includes(e.id) && e.catch) mult += e.catch;
    });
    return mult;
  }

  function expToNext(lv) {
    return Math.floor(50 * Math.pow(1.35, lv - 1));
  }

  function maxHp() {
    let hp = 80 + state.level * 12;
    GEAR.forEach((u) => {
      if (state.expansions.includes(u.id) && u.hp) hp += u.hp;
    });
    return hp;
  }

  function attackPower() {
    const dino = getActiveFish();
    const type = dino ? MOB_TYPES[dino.typeKey] : MOB_TYPES[STARTER_MOB];
    let atk = (type?.atk || 8) + state.level * 3;
    GEAR.forEach((u) => {
      if (state.expansions.includes(u.id) && u.atk) atk += u.atk;
    });
    return atk;
  }

  function specialPower() {
    return Math.floor(attackPower() * 1.8);
  }

  function hasSpecial() {
    return state.expansions.includes(SPECIAL_GEAR_ID);
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
        status.textContent = ui("specialUnlock", { shop: C.ui.shopBtn });
      }
      return;
    }
    btn.classList.remove("hidden");
    status?.classList.remove("hidden");
    const ready = canUseRockSmash();
    const wait = specialTurnsLeft();
    btn.disabled = false;
    btn.classList.toggle("cooldown", !ready);
    btn.textContent = C.ui.battleSpecial;
    if (status) {
      status.className = ready ? "special-status ready" : "special-status wait";
      status.textContent = ready ? ui("specialReady")
        : ui("specialWait", { wait, plural: wait === 1 ? "" : "s" });
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
    const showBuy = VARIANT === "evolve" || VARIANT === "fatten";
    const showSteal = VARIANT === "evolve" || VARIANT === "steal";
    setBtnVisible(
      document.getElementById("fight-btn"),
      (btnSticky.mob && !battle && !zone.isPier && !zone.isPvp) ||
        (nearBuy && showBuy && zone.isPier && !battle)
    );
    setBtnVisible(document.getElementById("boss-btn"), btnSticky.boss && !battle);
    setBtnVisible(document.getElementById("portal-btn"), btnSticky.portal && !battle);
    setBtnVisible(document.getElementById("feed-btn"), btnSticky.feed && !battle && zone.isPier);
    setBtnVisible(
      document.getElementById("breed-btn"),
      btnSticky.breed && !battle && zone.isPier && state.collection.length >= 2
    );
    setBtnVisible(document.getElementById("ride-btn"), btnSticky.ride && !battle && zone.isPier);
    setBtnVisible(
      document.getElementById("pvp-btn"),
      (btnSticky.pvp && !battle && zone.isPvp) || (nearSteal && showSteal && zone.isPier && !battle)
    );
    setBtnVisible(document.getElementById("rebirth-btn"), nearRebirth && zone.isPier && !battle);
    setBtnVisible(document.getElementById("buy-btn"), nearBuy && showBuy && zone.isPier && !battle);
    setBtnVisible(document.getElementById("steal-btn"), nearSteal && showSteal && zone.isPier && !battle);
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
      showToast(ui("levelUp", { level: state.level }));
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
    if (zone.isPier || zone.isPvp) {
      boss = { x: 0, y: 0, beaten: true };
      buildPortals();
      rescueTargets = [];
      if (VARIANT === "tsunami") tsunamiY = WORLD_H + 200;
      return;
    }
    if (VARIANT === "save") {
      rescueTargets = [];
      for (let i = 0; i < 5; i++) {
        const typeKey = zone.mobs[Math.floor(Math.random() * zone.mobs.length)] || STARTER_MOB;
        rescueTargets.push({
          id: i,
          typeKey,
          x: 200 + Math.random() * (WORLD_W - 400),
          y: 200 + Math.random() * (WORLD_H - 400),
        });
      }
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
      showToast(ui("zoneLocked", { reqLevel: z.reqLevel }));
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
    const detail = z.isPier ? ui("pierIncome") : z.isPvp ? ui("pvpBattles") : ui("wildLevel", { level: z.mobLevel });
    showToast(ui("travelToast", { name: z.name, detail }));
    if (window.GameMP) GameMP.setSubroom(mpSubroom());
    saveState();
  }

  function collides(wx, wy, r) {
    if (wx - r < 30 || wy - r < 30 || wx + r > WORLD_W - 30 || wy + r > WORLD_H - 30) return true;
    if (currentZone().isPier && baseRoomCollision(wx, wy, r)) return true;
    return false;
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

    AOSprites.drawZoneSky(ctx, w, h, camX, camY, zone, animT);

    const tile = 64;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty > WORLD_H) continue;
        AOSprites.drawWorldTile(ctx, tx - camX, ty - camY, tile, tile, zone, tx + ty);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 4;
    ctx.strokeRect(-camX + 2, -camY + 2, WORLD_W - 4, WORLD_H - 4);

    if (zone.isPier) drawBaseRooms(camX, camY);

    if (VARIANT === "tsunami" && !zone.isPier && !zone.isPvp) {
      const waveY = tsunamiY - camY;
      if (waveY < h + 80) {
        const g = ctx.createLinearGradient(0, waveY - 40, 0, waveY + 60);
        g.addColorStop(0, "rgba(0,188,212,0.15)");
        g.addColorStop(1, "rgba(0,96,100,0.75)");
        ctx.fillStyle = g;
        ctx.fillRect(0, waveY - 20, w, h);
        ctx.font = "bold 14px system-ui,sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText("🌊 TSUNAMI", w / 2, Math.max(24, waveY - 8));
      }
    }

    if (VARIANT === "save" && rescueTargets.length) {
      rescueTargets.forEach((t) => {
        const s = worldToScreen(t.x, t.y);
        if (s.x < -40 || s.x > w + 40) return;
        AOSprites.drawWildMob(ctx, s.x, s.y, MOB_TYPES[t.typeKey] || MOB_TYPES[STARTER_MOB], animT + t.id, 1);
        ctx.font = "bold 10px system-ui,sans-serif";
        ctx.fillStyle = "#e91e63";
        ctx.textAlign = "center";
        ctx.fillText("💾 SAVE", s.x, s.y - 40);
      });
    }

    portals.forEach((p) => {
      const s = worldToScreen(p.x, p.y);
      if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
      AOSprites.drawZonePortal(ctx, s.x, s.y, p.label, animT);
    });

    if (!boss.beaten) {
      const bs = worldToScreen(boss.x, boss.y);
      if (bs.x > -80 && bs.x < w + 80) {
        AOSprites.drawMythicMob(ctx, bs.x, bs.y, animT, zone, zone.mobLevel + 3);
        ctx.font = "bold 11px system-ui,sans-serif";
        ctx.fillStyle = "#ffeb3b";
        ctx.textAlign = "center";
        ctx.fillText(ui("mythicLabel", { level: zone.mobLevel + 3 }), bs.x, bs.y - 58);
      }
    }

    mobs.forEach((m) => {
      const s = worldToScreen(m.x, m.y);
      if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
      AOSprites.drawWildMob(ctx, s.x, s.y, MOB_TYPES[m.typeKey], animT + m.id, m.mobLevel);
    });

    if (zone.isPier) {
      const fs = worldToScreen(FEED_STATION.x, FEED_STATION.y);
      ctx.font = "bold 11px 'Comic Sans MS', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.strokeText(ui("feedStation"), fs.x, fs.y - 18);
      ctx.fillText(ui("feedStation"), fs.x, fs.y - 18);
      ctx.fillStyle = "#ffb74d";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fs.x - 26, fs.y - 8, 52, 22, 8);
      ctx.fill();
      ctx.stroke();

      const bs = worldToScreen(BREED_STATION.x, BREED_STATION.y);
      ctx.strokeText(ui("fusionStation"), bs.x, bs.y - 18);
      ctx.fillText(ui("fusionStation"), bs.x, bs.y - 18);
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
        AOSprites.drawWildMob(ctx, s.x, s.y, MOB_TYPES[d.typeKey] || MOB_TYPES[STARTER_MOB], animT + i, state.level);
        if (d.id === state.activeDino) {
          ctx.font = "600 9px system-ui,sans-serif";
          ctx.fillStyle = "#ffeb3b";
          ctx.fillText(ui("activeLabel"), s.x, s.y - 36);
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
        AOSprites.drawTrainer(ctx, s.x, s.y, 0.85, e.st.style || "cute", e.st.facing || 1, animT + (e.p.id || 0), {
          bounce: true,
          upgrades: e.st.expansions || e.st.upgrades || [],
          riding: !!e.st.riding,
          dinoType: MOB_TYPES[e.st.activeDino || STARTER_MOB],
        });
        drawNameLabel(s.x, s.y - 42, e.p.name, "#90caf9");
      } else {
        const ps = worldToScreen(player.x, player.y);
        const activeType = MOB_TYPES[(getActiveFish() || {}).typeKey || STARTER_MOB];
        AOSprites.drawTrainer(ctx, ps.x, ps.y, 0.85, state.style, player.facing, animT, {
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
    AOSprites.drawPostFX(ctx, w, h, animT, ps.x, ps.y);
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
    const moveLen = Math.hypot(dx, dy);
    if (moveLen > 0) {
      dx /= moveLen;
      dy /= moveLen;
      const spd = PLAYER_SPEED * (riding ? RIDE_SPEED_MULT : 1) * dt;
      const nx = player.x + dx * spd;
      const ny = player.y + dy * spd;
      if (!collides(nx, player.y, PLAYER_R)) player.x = nx;
      if (!collides(player.x, ny, PLAYER_R)) player.y = ny;
      player.facing = dx >= 0 ? 1 : -1;
    }

    cam.x += (player.x - cam.x) * Math.min(1, dt * 8);
    cam.y += (player.y - cam.y) * Math.min(1, dt * 8);

    if (zone.isPier) {
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
      nearBuy = stickyNear(
        Math.hypot(BUY_STATION.x - player.x, BUY_STATION.y - player.y),
        75,
        95,
        "mob"
      );
      nearRebirth = stickyNear(
        Math.hypot(REBIRTH_SHRINE.x - player.x, REBIRTH_SHRINE.y - player.y),
        85,
        105,
        "boss"
      );
      nearRide =
        !!getActiveFish() &&
        stickyNear(Math.hypot(400 - player.x, 400 - player.y), 100, 120, "ride");
      nearSteal = null;
      let nearestStealDist = Infinity;
      remotePlayers.forEach((p) => {
        const st = p.state || {};
        if (st.battle) return;
        const wx = typeof st.x === "number" ? st.x : 400;
        const wy = typeof st.y === "number" ? st.y : 400;
        const d = Math.hypot(wx - player.x, wy - player.y);
        if (d < nearestStealDist) {
          nearestStealDist = d;
          nearSteal = p;
        }
      });
      if (!stickyNear(nearestStealDist, 90, 110, "pvp")) nearSteal = null;
    } else {
      nearFeed = false;
      nearBreed = false;
      nearRide = false;
      nearBuy = false;
      nearRebirth = false;
      nearSteal = null;
      riding = false;
      btnSticky.feed = false;
      btnSticky.breed = false;
      btnSticky.ride = false;
    }

    if (VARIANT === "tsunami" && !zone.isPier && !zone.isPvp) {
      tsunamiY -= 55 * dt;
      if (player.y > tsunamiY - 80) {
        state.hp = Math.max(0, state.hp - 40 * dt);
        if (Math.random() < 0.02) showToast(ui("tsunamiWarn"));
        if (state.hp <= 0) {
          state.hp = maxHp();
          player.y = 120;
          showToast(ui("knockedOut"));
        }
      }
      if (tsunamiY < 80) {
        tsunamiY = WORLD_H + 200;
        showToast(ui("zoneUnlocked", { name: zone.name, level: zone.mobLevel }));
      }
    }

    if (VARIANT === "steal" && moveLen > 0.3) {
      noiseMeter = Math.min(100, noiseMeter + dt * 35);
      if (noiseMeter >= 100 && Math.random() < 0.03) {
        noiseMeter = 0;
        showToast(ui("noiseWake"));
      }
    } else if (VARIANT === "steal") {
      noiseMeter = Math.max(0, noiseMeter - dt * 20);
    }

    if (VARIANT === "save" && rescueTargets.length) {
      let nearRescue = null;
      let best = Infinity;
      rescueTargets.forEach((t) => {
        const d = Math.hypot(t.x - player.x, t.y - player.y);
        if (d < best) {
          best = d;
          nearRescue = t;
        }
      });
      if (stickyNear(best, 70, 90, "mob") && nearRescue) {
        rescueTargets = rescueTargets.filter((t) => t.id !== nearRescue.id);
        addExp(40);
        showToast(ui("rescued", { exp: 40 }));
        state.coins += 25;
        saveState();
      }
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
    if (boss.beaten || zone.isPier || zone.isPvp) {
      btnSticky.boss = false;
    } else {
      stickyNear(bossDist, 90, 110, "boss");
    }

    if (zone.isPier || zone.isPvp) btnSticky.mob = false;

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
    const typeKey = st.activeDino || STARTER_MOB;
    const type = MOB_TYPES[typeKey] || MOB_TYPES[STARTER_MOB];
    const stats = getMobStats(typeKey, lv, false);

    battle = {
      mob: { typeKey, mobLevel: lv },
      isBoss: false,
      isPvp: true,
      mobLevel: lv,
      foeName: `${peer.name || ui("trainerFallback")} Lv ${lv}`,
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
    document.getElementById("battle-banner").textContent = ui("battlePvpBanner", { name: peer.name || ui("trainerFallback") });
    document.getElementById("battle-you-name").textContent = state.name;
    document.getElementById("battle-foe-name").textContent = battle.foeName;
    updateBattleSpecialBtn();
    updateBattleHud();
    drawBattleScene(true);
  }

  function feedFish() {
    if (!currentZone().isPier) return;
    const cost = Math.floor(variantFeedCost());
    if (state.coins < cost) {
      showToast(ui("feedNeedCoins", { cost }));
      return;
    }
    state.coins -= cost;
    const expGain = variantFeedExp();
    addExp(expGain);
    if (VARIANT === "fatten") {
      state.fat = (state.fat || 0) + 3;
      showToast(ui("fattened", { fat: 3 }));
    } else {
      showToast(ui("feedSuccess", { exp: expGain }));
    }
    checkEvolution();
    updateHud();
    saveState();
  }

  function toggleRide() {
    if (!currentZone().isPier || !getActiveFish()) return;
    riding = !riding;
    showToast(riding ? ui("rideOn") : ui("rideOff"));
  }

  function fuseFish() {
    if (!currentZone().isPier || state.collection.length < 2) return;
    if (state.coins < BREED_COST) {
      showToast(ui("breedNeedCoins", { cost: BREED_COST }));
      return;
    }
    const keys = state.collection.map((c) => c.typeKey);
    const recipe = FUSION_RECIPES.find((r) =>
      r.parents.every((p) => keys.includes(p))
    );
    if (!recipe) {
      showToast(ui("breedNoRecipe"));
      return;
    }
    if (state.collection.some((c) => c.typeKey === recipe.result)) {
      showToast(ui("breedAlreadyHave"));
      return;
    }
    state.coins -= BREED_COST;
    state.collection.push({
      id: "d" + Date.now(),
      typeKey: recipe.result,
      nickname: MOB_TYPES[recipe.result].name,
    });
    showToast(ui("breedSuccess", { emoji: MOB_TYPES[recipe.result].emoji, name: MOB_TYPES[recipe.result].name }));
    updateHud();
    saveState();
  }

  function startBattle(mob, isBoss) {
    const zone = currentZone();
    const mobLevel = isBoss ? zone.mobLevel + 3 : mob.mobLevel;
    const typeKey = isBoss ? (zone.bossType || zone.mobs[0]) : mob.typeKey;
    const type = MOB_TYPES[typeKey];
    const stats = getMobStats(typeKey, mobLevel, isBoss);

    battle = {
      mob,
      isBoss,
      mobLevel,
      foeName: isBoss ? `${MOB_TYPES[typeKey]?.name || ui("mythicBossFallback")}` : `${type.name} Lv ${mobLevel}`,
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
      ? ui("battleBossBanner", { name: MOB_TYPES[typeKey]?.name || ui("mythicBossFallback") })
      : ui("battleWildBanner", { name: type.name, level: mobLevel });
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
    AOSprites.drawBattleArena(battleCtx, battleCanvas.width, battleCanvas.height, zone, animT);
    const shake = playerAttack ? Math.sin(animT * 40) * 4 : 0;
    AOSprites.drawTrainer(battleCtx, 80 + shake, 80, 1.1, state.style, 1, animT, {
      panicked: true,
      upgrades: state.expansions,
    });
    if (battle.isBoss) {
      AOSprites.drawMythicMob(battleCtx, 240 - shake, 75, animT, zone, battle.mobLevel);
    } else {
      AOSprites.drawWildMob(
        battleCtx,
        240 - shake,
        80,
        MOB_TYPES[battle.mob?.typeKey || STARTER_MOB],
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
      state.coins += Math.floor(battle.coinReward * rebirthMult());
      if (VARIANT === "bones") {
        const bones = battle.isBoss ? 5 : 2;
        state.bones = (state.bones || 0) + bones;
        showToast(ui("boneSmash", { bones }));
      }
      showToast(ui("victory", { exp: battle.expReward, coin: battle.coinReward }));
      if (battle.isPvp) {
        showToast(ui("pvpWin", { name: battle.foeName }));
      } else if (battle.isBoss) {
        if (!state.bossesBeaten.includes(state.zone)) {
          state.bossesBeaten.push(state.zone);
        }
        boss.beaten = true;
        buildPortals();
        const next = state.zone + 1;
        if (next < ZONES.length) {
          const nextZone = getZone(next);
          if (isZoneUnlocked(next)) {
            showToast(ui("zoneUnlocked", { name: nextZone.name, level: nextZone.mobLevel }));
          } else {
            showToast(ui("zoneNeedLevel", { reqLevel: nextZone.reqLevel, name: nextZone.name }));
          }
        } else {
          showToast(ui("allZonesConquered"));
        }
        renderZoneNav();
      } else if (battle.mob) {
        const z = currentZone();
        if (!z.isPier && !z.isPvp) {
          const typeKey = battle.mob.typeKey;
          const already = state.collection.some((c) => c.typeKey === typeKey);
          if (!already) {
            state.collection.push({
              id: "d" + Date.now(),
              typeKey,
              nickname: MOB_TYPES[typeKey].name,
            });
            showToast(ui("captured", { emoji: MOB_TYPES[typeKey].emoji, name: MOB_TYPES[typeKey].name }));
            window.GameSFX?.play("capture");
          } else {
            state.coins += 8;
            showToast(ui("alreadyCaught", { name: MOB_TYPES[typeKey].name }));
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
      showToast(ui("knockedOut"));
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
        status.textContent = ui("specialWait", { wait, plural: wait === 1 ? "" : "s" });
      }
      return;
    }
    const dmg = Math.floor((special ? specialPower() : attackPower()) * catchMultiplier());
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
    document.getElementById("level-display").textContent = ui("levelDisplay", { level: state.level });
    document.getElementById("exp-display").textContent =
      `✨ ${fmt(state.exp)} / ${fmt(expToNext(state.level))}`;
    document.getElementById("coin-display").textContent = `🪙 ${fmt(state.coins)}`;
    const rebirthEl = document.getElementById("rebirth-display");
    if (rebirthEl) {
      rebirthEl.textContent = `♻️×${state.rebirths || 0} · ${Math.round(rebirthMult() * 100)}%`;
    }
    const bonesEl = document.getElementById("bones-display");
    if (bonesEl) {
      bonesEl.classList.toggle("hidden", VARIANT !== "bones");
      bonesEl.textContent = `💀 ${state.bones || 0}`;
    }
    const fatEl = document.getElementById("fat-display");
    if (fatEl) {
      fatEl.classList.toggle("hidden", VARIANT !== "fatten");
      fatEl.textContent = `🍔 ${Math.floor(state.fat || 0)}`;
    }
    renderRareShowcase();
    const dino = getActiveFish();
    const mobName = dino ? MOB_TYPES[dino.typeKey]?.name : MOB_TYPES[STARTER_MOB]?.name;
    const mobLabel = zone.isPier
      ? ui("pierCollection", { count: state.collection.length, rate: parkIncomeRate() }) : zone.isPvp ? ui("pvpBattles") : ui("wildLevel", { level: zone.mobLevel });
    document.getElementById("world-label").textContent = `${zone.name} · ${mobLabel} · ${mobName}`;
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
      const lvLabel = z.isPier ? ui("zoneNavPier") : z.isPvp ? ui("zoneNavPvp") : ui("zoneNavLv", { level: z.mobLevel });
      return `<button type="button" class="zone-btn ${active ? "active" : ""} ${unlocked ? "" : "locked"}" data-zone-id="${z.id}" ${unlocked ? "" : "disabled"} title="${unlocked ? z.name : ui("unlockTitle", { reqLevel: z.reqLevel })}">
        ${unlocked ? z.name.split(" ")[0] : "🔒"} ${short}
        <span class="zone-lv">${lvLabel}</span>
      </button>`;
    }).join("");
    nav.innerHTML =
      zoneBtns +
      `<button type="button" class="zone-btn zone-util" data-zone="upgrades">${C.ui.shopBtn}</button>`;
    nav.querySelectorAll("[data-zone-id]").forEach((btn) => {
      btn.addEventListener("click", () => travelToZone(Number(btn.dataset.zoneId)));
    });
    nav.querySelector("[data-zone=upgrades]")?.addEventListener("click", () => {
      renderExpansions();
      document.getElementById("upgrade-overlay").classList.remove("hidden");
    });
  }

  function renderExpansions() {
    const list = document.getElementById("upgrade-list");
    if (!list) return;
    list.innerHTML = GEAR.map((u) => {
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
            ${owned ? ui("buyOwned") : locked ? ui("buyLocked") : `🪙 ${u.cost}`}
          </button>
        </div>`;
    }).join("");
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => buyExpansion(btn.dataset.id));
    });
  }

  function buyExpansion(id) {
    const u = GEAR.find((x) => x.id === id);
    if (!u || state.expansions.includes(id) || state.coins < u.cost) return;
    if (u.req && !state.expansions.includes(u.req)) {
      showToast(ui("buyReqFirst"));
      return;
    }
    state.coins -= u.cost;
    state.expansions.push(id);
    state.hp = maxHp();
    showToast(ui("bought", { name: u.name, emoji: u.emoji }));
    updateHud();
    renderExpansions();
    saveState();
  }

  function setupJoystick() {
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
    state.name = document.getElementById("name-input").value.trim().slice(0, 14) || ui("defaultName");
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("zone-nav").classList.remove("hidden");
    document.getElementById("app").classList.add("playing");
    playing = true;
    state.hp = maxHp();
    riding = false;
    spawnMobs();
    updateHud();
    renderZoneNav();
    renderRareShowcase();
    document.body.dataset.variant = VARIANT;
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
      if (currentZone().isPier && nearBuy) {
        buyBrainrot();
        return;
      }
      if (nearMob) startBattle(nearMob, false);
    });
    document.getElementById("buy-btn")?.addEventListener("click", buyBrainrot);
    document.getElementById("steal-btn")?.addEventListener("click", stealBrainrot);
    document.getElementById("rebirth-btn")?.addEventListener("click", tryRebirth);
    document.getElementById("boss-btn").addEventListener("click", () => {
      startBattle(null, true);
    });
    document.getElementById("portal-btn").addEventListener("click", () => {
      if (nearPortal) travelToZone(nearPortal.zoneId);
    });
    document.getElementById("feed-btn")?.addEventListener("click", feedFish);
    document.getElementById("breed-btn")?.addEventListener("click", fuseFish);
    document.getElementById("ride-btn")?.addEventListener("click", toggleRide);
    document.getElementById("pvp-btn")?.addEventListener("click", () => {
      if (nearSteal && currentZone().isPier) {
        stealBrainrot();
        return;
      }
      if (nearPvp) startPvpBattle(nearPvp);
    });
    document.getElementById("attack-btn").addEventListener("click", () => doAttack(false));
    document.getElementById("special-btn").addEventListener("click", () => doAttack(true));
    document.getElementById("flee-btn").addEventListener("click", () => endBattle(false));

    document.getElementById("upgrade-btn").addEventListener("click", () => {
      renderExpansions();
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
    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.style === state.style);
    });
    bindEvents();
    resize();
  }

  function applyVariantUi() {
    const v = {
      evolve: { fightBtn: "⚔️ Catch", breedBtn: "🧬 Merge", pvpBtn: "🤫 Steal" },
      fatten: { feedBtn: "🍔 Fatten", fightBtn: "🛒 Buy", breedBtn: "🧬 Combine" },
      bones: { fightBtn: "💀 Smash", bossBtn: "💀 Bone Boss", battleAttack: "🦴 Crush" },
      steal: { pvpBtn: "🤫 Steal", rideBtn: "🤫 Sneak", portalBtn: "🚪 Escape" },
      save: { fightBtn: "💾 Rescue", portalBtn: "🏃 Run" },
      tsunami: { portalBtn: "🏃 Flee", bossBtn: "🌊 Wave Boss", battleFlee: "🏃 Run!" },
    };
    const patch = v[VARIANT] || {};
    C.ui = Object.assign({}, C.ui, patch);
  }

  function applyUiLabels() {
    applyVariantUi();
    const map = {
      "fight-btn": "fightBtn",
      "boss-btn": "bossBtn",
      "portal-btn": "portalBtn",
      "feed-btn": "feedBtn",
      "breed-btn": "breedBtn",
      "ride-btn": "rideBtn",
      "pvp-btn": "pvpBtn",
      "buy-btn": "buyBtn",
      "steal-btn": "stealBtn",
      "rebirth-btn": "rebirthBtn",
      "upgrade-btn": "shopBtn",
      "attack-btn": "battleAttack",
      "special-btn": "battleSpecial",
      "flee-btn": "battleFlee",
    };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && C.ui[key]) el.textContent = C.ui[key];
    });
    const shopTitle = document.querySelector(".upgrade-panel h2");
    if (shopTitle && C.ui.shopTitle) shopTitle.textContent = C.ui.shopTitle;
    const shopSub = document.querySelector(".upgrade-panel .sub");
    if (shopSub && C.ui.shopSubtitle) shopSub.textContent = C.ui.shopSubtitle;
    const shopClose = document.getElementById("upgrade-close-btn");
    if (shopClose && C.ui.shopClose) shopClose.textContent = C.ui.shopClose;
  }

  function boot() {
    applyUiLabels();
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
