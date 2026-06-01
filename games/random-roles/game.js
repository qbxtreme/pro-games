(function () {
  "use strict";

  const { FACTIONS, ROLES, ROLE_LIST, PLAYER_COLORS, BOT_NAMES } = RRRoles;
  const PLAYER_R = 14;
  const SPEED = 3.1;
  const USE_RANGE = 50;
  const BOT_COUNT = 8;
  const DAY_LENGTH = 4800;
  const TASK_STATIONS = RRMap.getTaskStations();
  const MEETING_SPOTS = TASK_STATIONS;
  const TASK_COUNT = TASK_STATIONS.length;
  const TASK_DEFS = {
    bell: "Ring the foyer bell",
    gym: "Check the ballroom",
    cafe: "Set the dining table",
    office: "Search the study",
  };
  const WEREWOLF_ABILITY_RANGE = 58;
  const WEREWOLF_DEVOUR_COOLDOWN_MS = 40000;
  const WEREWOLF_INFECT_COOLDOWN_MS = 60000;
  const WEREWOLF_FORM_MS = 30000;
  const TASK_USE_RANGE = USE_RANGE;
  const BOT_MEETING_CHECK_FRAMES = 90;
  const BOT_MEETING_MIN_GAP_MS = 35000;
  const BOT_MEETING_CHANCE = 0.22;
  const BOT_BODY_REPORT_CHANCE = 0.35;
  const JESTER_PRANKS_REQUIRED = 3;
  const JESTER_PRANK_RANGE = 56;
  const BOT_KILL_RANGE = 54;
  const BOT_KILL_COOLDOWN = 320;

  let canvas, ctx, w, h;
  let playing = false;
  let meetingActive = false;
  let nightOverlayOpen = false;
  let fakeMeetingOpen = false;
  let joyActive = false;
  let joyDx = 0;
  let joyDy = 0;
  let keys = {};
  let cam = { x: 840, y: 640 };
  let animT = 0;
  let remotePlayers = [];
  let toastTimer = null;
  let phase = "day";
  let dayNum = 1;
  let dayTimer = DAY_LENGTH;
  let pendingNightAction = null;
  const btnSticky = { body: false, spot: false };

  let round = {
    players: [],
    you: null,
    bodies: [],
    winner: null,
    reason: "",
    chaos: 0,
    nightLog: [],
    investigateResult: null,
    traitorsClearedHint: false,
  };

  let taskBusy = false;

  function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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

  function showToast(msg) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 2400);
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = document.getElementById("game-wrap");
    w = wrap?.clientWidth || window.innerWidth;
    h = wrap?.clientHeight || window.innerHeight;
    if (w < 2) w = window.innerWidth;
    if (h < 2) h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function setupJoystick() {
    const base = document.getElementById("joystick-base");
    const knob = document.getElementById("joystick-knob");
    if (!base || !knob) return;
    let pointerId = null;

    base.addEventListener("pointerdown", (e) => {
      pointerId = e.pointerId;
      base.setPointerCapture(pointerId);
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
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      joyDx = dx / max;
      joyDy = dy / max;
    });

    const endJoy = (e) => {
      if (e.pointerId !== pointerId) return;
      joyActive = false;
      joyDx = 0;
      joyDy = 0;
      knob.style.transform = "translate(-50%, -50%)";
    };
    base.addEventListener("pointerup", endJoy);
    base.addEventListener("pointercancel", endJoy);
  }

  function setupKeys() {
    window.addEventListener("keydown", (e) => {
      keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });
  }

  function getMoveInput() {
    let dx = joyDx;
    let dy = joyDy;
    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;
    const len = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) + Math.abs(dy) > 0.1) {
      return { dx: (dx / len) * SPEED, dy: (dy / len) * SPEED };
    }
    return { dx: 0, dy: 0 };
  }

  function moveEntity(ent, mdx, mdy) {
    const moving = Math.abs(mdx) + Math.abs(mdy) > 0.01;
    ent.moving = moving;
    if (moving) {
      if (Math.abs(mdx) >= Math.abs(mdy)) ent.facing = mdx >= 0 ? 1 : -1;
      ent.walkPhase = (ent.walkPhase || 0) + 0.14;
    }
    const nx = ent.x + mdx;
    const ny = ent.y + mdy;
    if (!RRMap.collidesCircle(nx, ent.y, PLAYER_R)) ent.x = nx;
    if (!RRMap.collidesCircle(ent.x, ny, PLAYER_R)) ent.y = ny;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function alivePlayers() {
    return round.players.filter((p) => p.alive);
  }

  function aliveByFaction(faction) {
    return round.players.filter((p) => p.alive && p.role.faction === faction);
  }

  function isBetrayFaction(p) {
    return p.role?.faction === "betray";
  }

  function playerNeedsTasks(p) {
    if (!p || !p.alive) return false;
    return p.role.faction === "protect" || p.roleId === "anarchist";
  }

  function playerTasksComplete(p) {
    return (p.tasksCompleted?.length || 0) >= TASK_COUNT;
  }

  function allProtectTasksComplete() {
    const protect = round.players.filter((p) => p.alive && p.role.faction === "protect");
    if (!protect.length) return false;
    return protect.every((p) => playerTasksComplete(p));
  }

  function initPlayerTasks(p) {
    p.tasksCompleted = [];
  }

  function initWerewolfState(p) {
    p.devourReadyAt = 0;
    p.infectReadyAt = 0;
    p.wolfFormUntil = 0;
    p.wolfForm = false;
    p._wasWolfForm = false;
  }

  function initJesterState(p) {
    p.jesterPranks = 0;
    p.jesterPrankedIds = {};
    p.jesterFakeEject = false;
  }

  function jesterPrankCount(p) {
    return p?.jesterPranks || 0;
  }

  function jesterGoalsComplete(p) {
    return jesterPrankCount(p) >= JESTER_PRANKS_REQUIRED && !!p?.jesterFakeEject;
  }

  function initBotBrain(p) {
    p.botSuspect = {};
    p.botKnownBetray = {};
    p.botHuntId = null;
    p.botFollowId = null;
  }

  function getBotSuspicion(bot, targetId) {
    if (!bot?.botSuspect) return 0;
    if (bot.botKnownBetray[targetId]) return 95;
    return bot.botSuspect[targetId] || 0;
  }

  function addBotSuspicion(bot, targetId, amount) {
    if (!bot?.isBot || !targetId || targetId === bot.id) return;
    if (!bot.botSuspect) bot.botSuspect = {};
    bot.botSuspect[targetId] = Math.min(100, (bot.botSuspect[targetId] || 0) + amount);
  }

  function botsLearnRole(target) {
    if (!target) return;
    round.players.forEach((bot) => {
      if (!bot.isBot) return;
      if (!bot.botSuspect) bot.botSuspect = {};
      if (!bot.botKnownBetray) bot.botKnownBetray = {};
      if (target.role.faction === "betray") {
        bot.botKnownBetray[target.id] = true;
        bot.botSuspect[target.id] = 100;
      } else if (target.role.faction === "protect") {
        bot.botSuspect[target.id] = Math.min(bot.botSuspect[target.id] || 0, 8);
      }
    });
  }

  function pickFromWeighted(candidates, weightFn) {
    if (!candidates.length) return null;
    const weights = candidates.map((c) => Math.max(0.05, weightFn(c)));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  function nearestBodyTo(ent, maxD) {
    let best = null;
    let bestD = maxD;
    round.bodies.forEach((b) => {
      const d = dist(ent, b);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    });
    return best;
  }

  function countNearbyPlayers(ent, radius, exceptId) {
    return alivePlayers().filter((p) => p.id !== exceptId && dist(ent, p) < radius).length;
  }

  function findIsolatedPrey(bot) {
    const candidates = alivePlayers().filter(
      (p) => p.id !== bot.id && p.role.faction !== "betray" && p.alive
    );
    if (!candidates.length) return null;
    return candidates
      .map((p) => ({ p, nearby: countNearbyPlayers(p, 100, p.id), d: dist(bot, p) }))
      .sort((a, b) => a.nearby - b.nearby || a.d - b.d)[0]?.p;
  }

  function observeBotWorld() {
    round.players.forEach((bot) => {
      if (!bot.isBot || !bot.alive) return;

      alivePlayers().forEach((other) => {
        if (other.id === bot.id) return;
        const d = dist(bot, other);
        if (d < 55 && bot.role.faction === "protect" && other.role.faction === "betray") {
          addBotSuspicion(bot, other.id, 2);
        }
        if (d < 45 && bot.role.faction === "betray" && other.role.faction === "betray") {
          addBotSuspicion(bot, other.id, -3);
        }
      });

      const body = nearestBodyTo(bot, 130);
      if (body) {
        alivePlayers().forEach((other) => {
          if (other.id === bot.id || dist(other, body) > 110) return;
          addBotSuspicion(bot, other.id, 12);
        });
        const you = round.you;
        if (you?.alive && dist(you, body) < 120) {
          addBotSuspicion(bot, "you", 15);
        }
      }

      if (bot.role.faction === "betray") {
        const prey = findIsolatedPrey(bot);
        bot.botHuntId = prey && Math.random() < 0.65 ? prey.id : null;
      } else {
        bot.botHuntId = null;
      }

      if (bot.role.faction === "protect" && Math.random() < 0.2) {
        const buddy = pickFromWeighted(
          alivePlayers().filter((p) => p.id !== bot.id),
          (p) => 20 - getBotSuspicion(bot, p.id) * 0.2
        );
        bot.botFollowId = buddy?.id || null;
      }
    });
  }

  function pickBotNightTarget(bot, targets) {
    if (!targets.length) return null;

    if (bot.role.night === "autopsy") {
      return round.bodies.length ? round.bodies[round.bodies.length - 1] : null;
    }

    if (bot.role.night === "heal") {
      if (Math.random() < 0.25) return bot;
      const protect = targets.filter((t) => t.role.faction === "protect");
      const pool = protect.length ? protect : targets;
      return pickFromWeighted(pool, (t) => {
        let w = 12;
        if (t.id === bot.id) w += 8;
        if (getBotSuspicion(bot, t.id) > 50) w += 15;
        return w;
      });
    }

    if (bot.role.night === "investigate") {
      return pickFromWeighted(targets, (t) => {
        let w = 10 + getBotSuspicion(bot, t.id);
        if (t.role.faction === "betray") w += 25;
        if (bot.botKnownBetray[t.id]) w += 50;
        return w;
      });
    }

    if (bot.role.night === "kill" || bot.role.night === "hunt") {
      const prey = targets.filter((t) => t.role.faction !== "betray");
      const pool = prey.length ? prey : targets;
      return pickFromWeighted(pool, (t) => {
        let w = 8;
        if (t.role.faction === "protect") w += 22;
        w += getBotSuspicion(bot, t.id) * 0.35;
        w += Math.max(0, 18 - countNearbyPlayers(t, 90, t.id) * 6);
        if (t.id === "you") w += 6;
        return w;
      });
    }

    if (bot.role.night === "execute") {
      const sus = targets.filter((t) => getBotSuspicion(bot, t.id) >= 35 || bot.botKnownBetray[t.id]);
      if (!sus.length && Math.random() < 0.35) return null;
      const pool = sus.length ? sus : targets;
      return pickFromWeighted(pool, (t) => 10 + getBotSuspicion(bot, t.id));
    }

    if (bot.role.night === "chaos" || bot.role.night === "plunder") {
      const prey = targets.filter((t) => t.role.faction === "protect");
      return pickFromWeighted(prey.length ? prey : targets, () => 10);
    }

    return rand(targets);
  }

  function pickBotDayDestination(bot) {
    if (bot.botHuntId && bot.role.faction === "betray") {
      const prey = round.players.find((p) => p.id === bot.botHuntId && p.alive);
      if (prey) return { x: prey.x, y: prey.y, hunt: true };
    }

    if (bot.botFollowId && bot.role.faction === "protect") {
      const buddy = round.players.find((p) => p.id === bot.botFollowId && p.alive);
      if (buddy && dist(bot, buddy) > 70) {
        return { x: buddy.x + (Math.random() - 0.5) * 40, y: buddy.y + (Math.random() - 0.5) * 40 };
      }
    }

    const body = nearestBodyTo(bot, 200);
    if (body && bot.role.faction === "protect" && Math.random() < 0.45) {
      return { x: body.x, y: body.y };
    }

    if (playerNeedsTasks(bot) && !playerTasksComplete(bot)) {
      const stations = TASK_STATIONS.filter((s) => !hasCompletedTask(bot, s.taskId));
      if (stations.length && Math.random() < 0.72) {
        const station = rand(stations);
        return { x: station.x, y: station.y };
      }
    }

    const others = alivePlayers().filter((p) => p.id !== bot.id);
    if (others.length && Math.random() < 0.55) {
      const target = pickFromWeighted(others, (p) => {
        let w = 14;
        if (bot.role.faction === "protect") w += getBotSuspicion(bot, p.id) * 0.15;
        if (bot.role.faction === "betray" && p.role.faction === "protect") w += 12;
        return w;
      });
      if (target) {
        return { x: target.x + (Math.random() - 0.5) * 50, y: target.y + (Math.random() - 0.5) * 50 };
      }
    }

    const room = rand(RRMap.ROOM_DEFS);
    const walk = RRMap.roomWalkableTiles(room);
    const tile = rand(walk.length ? walk : [{ c: 17, r: 6 }]);
    return RRMap.tileCenter(tile.c, tile.r);
  }

  function werewolfCooldownLeft(readyAt) {
    return Math.max(0, (readyAt || 0) - Date.now());
  }

  function formatCooldownMs(ms) {
    const sec = Math.ceil(ms / 1000);
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    return `${sec}s`;
  }

  function isWolfFormActive(p) {
    return !!p && p.wolfFormUntil > Date.now();
  }

  function syncWerewolfForm(p) {
    if (!p || p.roleId !== "werewolf") return;
    const wolf = isWolfFormActive(p);
    if (p._wasWolfForm && !wolf && !p._skipWolfRevertToast) {
      showToast("🧍 You shift back to human form.");
    }
    p._skipWolfRevertToast = false;
    p._wasWolfForm = wolf;
    p.wolfForm = wolf;
  }

  function setBtnCooldown(el, onCooldown) {
    if (!el) return;
    if (onCooldown) el.classList.add("on-cooldown");
    else el.classList.remove("on-cooldown");
  }

  function hasCompletedTask(p, taskId) {
    return p.tasksCompleted.includes(taskId);
  }

  function completeTaskFor(p, station) {
    if (!station || hasCompletedTask(p, station.taskId)) return false;
    p.tasksCompleted.push(station.taskId);
    window.GameSFX?.play("coin");
    const label = TASK_DEFS[station.taskId] || station.room;
    showToast(`✅ ${label} done! (${p.tasksCompleted.length}/${TASK_COUNT})`);
    return true;
  }

  function assignRoles(count) {
    const core = ["werewolf", "doctor", "sheriff", "jester"];
    const pool = shuffle(ROLE_LIST.map((r) => r.id));
    const picked = [];
    core.forEach((id) => {
      if (picked.length < count && !picked.includes(id)) picked.push(id);
    });
    pool.forEach((id) => {
      if (picked.length >= count) return;
      if (!picked.includes(id)) picked.push(id);
    });
    return picked.slice(0, count).map((id) => ROLES[id]);
  }

  function startRound(playerName) {
    const total = BOT_COUNT + 1;
    const colors = shuffle(PLAYER_COLORS).slice(0, total);
    const names = shuffle(BOT_NAMES).slice(0, BOT_COUNT);
    const roles = assignRoles(total);

    round = {
      players: [],
      you: null,
      bodies: [],
      winner: null,
      reason: "",
      chaos: 0,
      nightLog: [],
      investigateResult: null,
      traitorsClearedHint: false,
      botMeetingTimer: 0,
      nextBotMeetingAt: Date.now() + 12000,
    };
    taskBusy = false;

    phase = "day";
    dayNum = 1;
    dayTimer = DAY_LENGTH;
    meetingActive = false;
    nightOverlayOpen = false;
    fakeMeetingOpen = false;

    for (let i = 0; i < total; i++) {
      const isYou = i === 0;
      const role = roles[i];
      const p = {
        id: isYou ? "you" : "bot-" + i,
        name: isYou ? playerName : names[i - 1] || "Bot" + i,
        color: colors[i],
        role,
        roleId: role.id,
        alive: true,
        x: RRMap.spawnPoints[i % RRMap.spawnPoints.length].x,
        y: RRMap.spawnPoints[i % RRMap.spawnPoints.length].y,
        facing: 1,
        moving: false,
        walkPhase: 0,
        botTimer: 0,
        botTarget: null,
        isBot: !isYou,
        usesLeft: role.uses || 0,
      };
      initPlayerTasks(p);
      initWerewolfState(p);
      if (!isYou) {
        initBotBrain(p);
        p.killCooldown = 0;
      }
      if (role.id === "jester") initJesterState(p);
      round.players.push(p);
      if (isYou) round.you = p;
    }

    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("world-hotbar").classList.remove("hidden");

    const you = round.you;
    const fac = FACTIONS[you.role.faction];
    const roleEl = document.getElementById("role-reveal");
    const descEl = document.getElementById("role-desc");
    const facEl = document.getElementById("role-faction");
    roleEl.textContent = `${you.role.emoji} ${you.role.name}`;
    roleEl.className = "role-reveal faction-" + you.role.faction;
    facEl.textContent = `${fac.emoji} ${fac.name} — ${fac.blurb}`;
    facEl.className = "role-faction faction-" + you.role.faction;
    descEl.textContent = you.role.desc;
    document.getElementById("role-overlay").classList.remove("hidden");

    playing = true;
    const appEl = document.getElementById("app");
    appEl?.classList.add("in-game", "playing");
    requestAnimationFrame(resizeCanvas);
    cam.x = you.x;
    cam.y = you.y;
    updateHotbar();
    updateActionButtons();
    updatePhaseBanner();
  }

  function updatePhaseBanner() {
    const el = document.getElementById("phase-banner");
    if (!el) return;
    if (phase === "night") {
      el.textContent = `🌙 Night ${dayNum}`;
      el.className = "phase-banner night";
    } else if (meetingActive) {
      el.textContent = "📢 Town Meeting!";
      el.className = "phase-banner meeting";
    } else {
      el.textContent = `☀️ Day ${dayNum}`;
      el.className = "phase-banner day";
    }
  }

  function updateHotbar(liveRoomOnly) {
    const you = round.you;
    if (!you) return;
    const room = RRMap.getRoomAt(you.x, you.y);
    document.getElementById("hotbar-flavor").textContent = room
      ? `${you.role.name} · ${room.label}`
      : you.role.name;
    if (liveRoomOnly) return;

    const fac = FACTIONS[you.role.faction];
    document.getElementById("hotbar-role").textContent = `${you.role.emoji} ${you.role.name} · ${fac.name}`;
    document.getElementById("hotbar-role").style.borderColor = fac.color;
    const betrayAlive = aliveByFaction("betray");
    const nonBetrayAlive = alivePlayers().filter((p) => !isBetrayFaction(p)).length;

    if (playerNeedsTasks(you)) {
      const done = you.tasksCompleted.length;
      document.getElementById("hotbar-tasks").textContent = `📋 Tasks ${done}/${TASK_COUNT}`;
    } else if (you.role.faction === "betray") {
      document.getElementById("hotbar-tasks").textContent =
        nonBetrayAlive <= 1 ? "🎯 Finish them!" : `🎯 Targets: ${nonBetrayAlive}`;
    } else {
      document.getElementById("hotbar-tasks").textContent = `☀️ Day ${dayNum}`;
    }

    document.getElementById("hotbar-alive").textContent = `👥 ${alivePlayers().length} alive`;
    document.getElementById("hotbar-meetings").textContent =
      betrayAlive.length === 0 && playerNeedsTasks(you) && !playerTasksComplete(you)
        ? "✅ Traitors out — finish tasks!"
        : `🔥 Chaos ${round.chaos}`;

    const list = document.getElementById("hotbar-task-list");
    if (you.roleId === "werewolf") {
      const devCd = werewolfCooldownLeft(you.devourReadyAt);
      const infCd = werewolfCooldownLeft(you.infectReadyAt);
      const formLeft = isWolfFormActive(you) ? werewolfCooldownLeft(you.wolfFormUntil) : 0;
      list.innerHTML = [
        '<span style="color:#43a047">🟢 Green = Civilian (Protect)</span>',
        '<span style="color:#e53935">🔴 Red = Betray team</span>',
        '<span style="color:#f9a825">🟡 Yellow = Anarchist</span>',
        `<span>🎯 Targets left: ${nonBetrayAlive}</span>`,
        `<span>🍖 Devour: ${devCd ? formatCooldownMs(devCd) : "ready"}</span>`,
        `<span>🧪 Infect: ${infCd ? formatCooldownMs(infCd) : "ready"}</span>`,
        `<span>🐺 Form: ${formLeft ? formatCooldownMs(formLeft) + " left" : "human"}</span>`,
      ].join("<br>");
    } else if (you.role.faction === "betray") {
      list.innerHTML = [
        '<span style="color:#43a047">🟢 Green = Civilian (Protect)</span>',
        '<span style="color:#e53935">🔴 Red = Betray team</span>',
        '<span style="color:#f9a825">🟡 Yellow = Anarchist</span>',
        `<span>🎯 Win: leave ≤1 non-Betray alive (${nonBetrayAlive} left)</span>`,
      ].join("<br>");
    } else if (you.roleId === "anarchist") {
      list.innerHTML = [
        `<span>📋 Complete all ${TASK_COUNT} tasks to win</span>`,
        `<span>Progress: ${you.tasksCompleted.length}/${TASK_COUNT}</span>`,
      ].join("<br>");
    } else if (you.roleId === "jester") {
      document.getElementById("hotbar-meetings").textContent = `🃏 Pranks ${jesterPrankCount(you)}/${JESTER_PRANKS_REQUIRED}`;
      list.innerHTML = [
        `<span>🃏 Prank ${JESTER_PRANKS_REQUIRED} different players (PRANK button)</span>`,
        `<span>Progress: ${jesterPrankCount(you)}/${JESTER_PRANKS_REQUIRED} pranks</span>`,
        `<span>${you.jesterFakeEject ? "✅ Secret fake-meeting vote done" : "⬜ Call FAKE MEETING & vote someone out"}</span>`,
      ].join("<br>");
    } else if (you.role.faction === "protect") {
      const traitorLine =
        betrayAlive.length === 0
          ? '<span style="color:#43a047">✅ Traitors eliminated</span>'
          : `<span style="color:${FACTIONS.betray.color}">🗡️ Vote out ${betrayAlive.length} traitor(s)</span>`;
      list.innerHTML = [
        traitorLine,
        `<span>📋 Then finish tasks (${you.tasksCompleted.length}/${TASK_COUNT})</span>`,
        `<span style="color:${FACTIONS.protect.color}">🛡️ Protect: ${aliveByFaction("protect").length}</span>`,
      ].join("<br>");
    } else {
      const protectN = aliveByFaction("protect").length;
      const betrayN = aliveByFaction("betray").length;
      list.innerHTML = [
        `<span style="color:${FACTIONS.protect.color}">🛡️ Protect: ${protectN}</span>`,
        `<span style="color:${FACTIONS.betray.color}">🗡️ Betray: ${betrayN}</span>`,
        `<span style="color:${FACTIONS.rogue.color}">🔥 Rogue: ${aliveByFaction("rogue").length}</span>`,
      ].join("<br>");
    }
  }

  function nearestBody(you) {
    if (!btnSticky.body) return null;
    let best = null;
    let bestD = USE_RANGE + 20;
    round.bodies.forEach((b) => {
      const d = dist(you, b);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    });
    return best;
  }

  function nearestMeetingSpot(you) {
    if (!btnSticky.spot) return null;
    let best = null;
    let bestD = USE_RANGE + 20;
    MEETING_SPOTS.forEach((s) => {
      const d = dist(you, s);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    });
    return best;
  }

  function nearestIncompleteTaskStation(you) {
    if (!you || !playerNeedsTasks(you)) return null;
    let best = null;
    let bestD = TASK_USE_RANGE + 20;
    TASK_STATIONS.forEach((s) => {
      if (hasCompletedTask(you, s.taskId)) return;
      const d = dist(you, s);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    });
    return best;
  }

  function doTask() {
    const you = round.you;
    if (!you || !you.alive || phase !== "day" || taskBusy || !playerNeedsTasks(you)) return;
    const station = nearestIncompleteTaskStation(you);
    if (!station || dist(you, station) > TASK_USE_RANGE) {
      showToast("Get closer to a task station.");
      return;
    }
    if (playerTasksComplete(you)) {
      showToast("All tasks complete!");
      return;
    }

    taskBusy = true;
    const label = TASK_DEFS[station.taskId] || station.room;
    showToast(`${station.emoji} Working: ${label}…`);

    setTimeout(() => {
      taskBusy = false;
      if (!playing || !you.alive || round.winner) return;
      if (completeTaskFor(you, station)) {
        checkWin();
        updateHotbar();
        updateActionButtons();
      }
    }, 900);
  }

  function updateProximitySticky(you) {
    let bodyDist = Infinity;
    round.bodies.forEach((b) => {
      bodyDist = Math.min(bodyDist, dist(you, b));
    });
    stickyNear(bodyDist, USE_RANGE, USE_RANGE + 22, "body");

    let spotDist = Infinity;
    MEETING_SPOTS.forEach((s) => {
      spotDist = Math.min(spotDist, dist(you, s));
    });
    stickyNear(spotDist, USE_RANGE, USE_RANGE + 22, "spot");
  }

  function updateActionButtons() {
    const useBtn = document.getElementById("use-btn");
    const reportBtn = document.getElementById("report-btn");
    const meetingBtn = document.getElementById("meeting-btn");
    const taskBtn = document.getElementById("task-btn");
    const nightBtn = document.getElementById("night-btn");
    const infectBtn = document.getElementById("infect-btn");
    const devourBtn = document.getElementById("devour-btn");
    const transformBtn = document.getElementById("transform-btn");
    const prankBtn = document.getElementById("prank-btn");
    const fakeMeetingBtn = document.getElementById("fake-meeting-btn");

    if (!playing || meetingActive || nightOverlayOpen || fakeMeetingOpen) {
      setBtnVisible(useBtn, false);
      setBtnVisible(taskBtn, false);
      setBtnVisible(reportBtn, false);
      setBtnVisible(nightBtn, false);
      setBtnVisible(meetingBtn, false);
      setBtnVisible(infectBtn, false);
      setBtnVisible(devourBtn, false);
      setBtnVisible(transformBtn, false);
      setBtnVisible(prankBtn, false);
      setBtnVisible(fakeMeetingBtn, false);
      return;
    }

    const you = round.you;
    updateProximitySticky(you);
    const body = nearestBody(you);
    const spot = nearestMeetingSpot(you);
    const taskStation = nearestIncompleteTaskStation(you);
    const nearTask =
      taskStation && dist(you, taskStation) <= TASK_USE_RANGE && playerNeedsTasks(you) && !playerTasksComplete(you);

    setBtnVisible(reportBtn, !!body && phase === "day");
    setBtnVisible(taskBtn, phase === "day" && nearTask && !taskBusy);
    if (taskStation && nearTask) {
      const label = `${taskStation.emoji} ${TASK_DEFS[taskStation.taskId] || "TASK"}`;
      if (taskBtn.textContent !== label) taskBtn.textContent = label;
    }
    setBtnVisible(useBtn, !!spot && phase === "day");
    if (spot) {
      const label = `${spot.emoji} CALL MEETING`;
      if (useBtn.textContent !== label) useBtn.textContent = label;
    }
    setBtnVisible(meetingBtn, phase === "day");
    setBtnVisible(nightBtn, phase === "night" && !!you.role.night);
    const isWerewolf = !!you.alive && you.roleId === "werewolf";
    setBtnVisible(transformBtn, phase === "day" && isWerewolf);
    setBtnVisible(infectBtn, phase === "day" && isWerewolf);
    setBtnVisible(devourBtn, phase === "day" && isWerewolf);
    const isJester = !!you.alive && you.roleId === "jester";
    setBtnVisible(prankBtn, phase === "day" && isJester);
    setBtnVisible(fakeMeetingBtn, phase === "day" && isJester);
    if (isJester) {
      const pranks = jesterPrankCount(you);
      prankBtn.textContent =
        pranks >= JESTER_PRANKS_REQUIRED
          ? `🃏 PRANK (${JESTER_PRANKS_REQUIRED}/${JESTER_PRANKS_REQUIRED})`
          : `🃏 PRANK (${pranks}/${JESTER_PRANKS_REQUIRED})`;
      fakeMeetingBtn.textContent = you.jesterFakeEject ? "🃏 FAKE MEETING ✓" : "🃏 FAKE MEETING";
    }

    if (isWerewolf) {
      syncWerewolfForm(you);
      const devCd = werewolfCooldownLeft(you.devourReadyAt);
      const infCd = werewolfCooldownLeft(you.infectReadyAt);
      const wolf = isWolfFormActive(you);
      const formLeft = wolf ? werewolfCooldownLeft(you.wolfFormUntil) : 0;

      const devLabel = devCd ? `🍖 DEVOUR (${formatCooldownMs(devCd)})` : "🍖 DEVOUR";
      const infLabel = infCd ? `🧪 INFECT (${formatCooldownMs(infCd)})` : "🧪 INFECT";
      const trLabel = wolf
        ? `🧍 REVERT (${formatCooldownMs(formLeft)})`
        : "🐺 TRANSFORM (30s)";

      if (devourBtn.textContent !== devLabel) devourBtn.textContent = devLabel;
      if (infectBtn.textContent !== infLabel) infectBtn.textContent = infLabel;
      if (transformBtn.textContent !== trLabel) transformBtn.textContent = trLabel;
      setBtnCooldown(devourBtn, devCd > 0);
      setBtnCooldown(infectBtn, infCd > 0);
      setBtnCooldown(transformBtn, false);
    }
  }

  function nearestJesterPrankTarget() {
    const you = round.you;
    if (!you || !you.alive) return null;
    let best = null;
    let bestD = JESTER_PRANK_RANGE;
    alivePlayers().forEach((p) => {
      if (p.id === you.id) return;
      if (you.jesterPrankedIds?.[p.id]) return;
      const d = dist(you, p);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    });
    return best;
  }

  function doJesterPrank() {
    const you = round.you;
    if (!you?.alive || you.roleId !== "jester" || phase !== "day") return;
    if (jesterPrankCount(you) >= JESTER_PRANKS_REQUIRED) {
      showToast("You already pranked enough people!");
      return;
    }
    const target = nearestJesterPrankTarget();
    if (!target) {
      showToast("Get closer to someone you haven't pranked yet.");
      return;
    }
    if (!you.jesterPrankedIds) you.jesterPrankedIds = {};
    you.jesterPrankedIds[target.id] = true;
    you.jesterPranks = jesterPrankCount(you) + 1;
    window.GameSFX?.play("coin");
    showToast(`🃏 Pranked ${target.name}! (${you.jesterPranks}/${JESTER_PRANKS_REQUIRED})`);
    checkWin();
    updateHotbar();
    updateActionButtons();
  }

  function refreshFakeVoteList() {
    const list = document.getElementById("fake-vote-list");
    const check = document.getElementById("fake-meeting-vote-check");
    if (!list) return;
    const canVote = !!check?.checked;
    list.innerHTML = "";
    alivePlayers().forEach((p) => {
      if (p.id === "you") return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vote-btn";
      btn.disabled = !canVote;
      btn.innerHTML = `<span class="vote-dot" style="background:${p.color.hex}"></span> ${p.name}`;
      btn.addEventListener("click", () => resolveFakeMeetingEject(p));
      list.appendChild(btn);
    });
    const hint = document.getElementById("fake-vote-hint");
    if (hint) {
      hint.textContent = canVote
        ? "Pick who to secretly eject — the town won't know you called this."
        : "Check the box to vote someone out.";
    }
  }

  function startFakeMeeting() {
    const you = round.you;
    if (!you?.alive || you.roleId !== "jester" || phase !== "day") return;
    if (meetingActive || fakeMeetingOpen) return;
    fakeMeetingOpen = true;
    const check = document.getElementById("fake-meeting-vote-check");
    if (check) check.checked = false;
    refreshFakeVoteList();
    document.getElementById("fake-meeting-overlay")?.classList.remove("hidden");
    updateActionButtons();
    showToast("🃏 Secret fake meeting — only you know. The CPUs keep playing.");
  }

  function closeFakeMeeting() {
    fakeMeetingOpen = false;
    document.getElementById("fake-meeting-overlay")?.classList.add("hidden");
    updateActionButtons();
  }

  function resolveFakeMeetingEject(target) {
    const you = round.you;
    const check = document.getElementById("fake-meeting-vote-check");
    closeFakeMeeting();
    if (!check?.checked) {
      showToast("You left without voting anyone out.");
      return;
    }
    if (!target?.alive) return;
    eliminatePlayer(target, "vanished after a secret vote");
    you.jesterFakeEject = true;
    showToast(`🃏 ${target.name} was secretly voted out — shhh!`);
    checkWin();
    updateHotbar();
    updateActionButtons();
  }

  function tryBotBetrayKill(bot) {
    if (!bot?.alive || bot.role?.faction !== "betray") return false;
    if ((bot.killCooldown || 0) > 0) return false;
    const prey =
      findIsolatedPrey(bot) ||
      pickFromWeighted(
        alivePlayers().filter((p) => p.id !== bot.id && p.role.faction !== "betray"),
        (p) => 12 + (p.role.faction === "protect" ? 20 : 0)
      );
    if (!prey || dist(bot, prey) > BOT_KILL_RANGE) return false;
    eliminatePlayer(prey, `killed by ${bot.name}`);
    bot.killCooldown = BOT_KILL_COOLDOWN;
    bot.botTarget = null;
    bot.botHunting = false;
    checkWin();
    return true;
  }

  function updateBotJester(p) {
    if (p.roleId !== "jester" || !p.alive) return;
    if (!p.jesterPrankedIds) p.jesterPrankedIds = {};

    if (jesterPrankCount(p) < JESTER_PRANKS_REQUIRED) {
      const near = alivePlayers().find(
        (o) => o.id !== p.id && !p.jesterPrankedIds[o.id] && dist(p, o) < JESTER_PRANK_RANGE
      );
      if (near && Math.random() < 0.06) {
        p.jesterPrankedIds[near.id] = true;
        p.jesterPranks = jesterPrankCount(p) + 1;
      }
    } else if (!p.jesterFakeEject && Math.random() < 0.015) {
      const targets = alivePlayers().filter((t) => t.id !== p.id);
      const target = pickFromWeighted(targets, () => 10);
      if (target) {
        eliminatePlayer(target, "vanished after a secret vote");
        p.jesterFakeEject = true;
        checkWin();
      }
    }
  }

  function nearestWerewolfTarget(mode) {
    const you = round.you;
    if (!you || !you.alive) return null;
    let best = null;
    let bestD = WEREWOLF_ABILITY_RANGE;
    alivePlayers().forEach((p) => {
      if (p.id === you.id) return;
      if (p.role?.faction === "betray") return;
      if (mode === "infect" && p.roleId === "werewolf") return;
      const d = dist(you, p);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    });
    return best;
  }

  function doWerewolfDevour() {
    const you = round.you;
    if (!you || !you.alive || you.roleId !== "werewolf" || phase !== "day") return;
    const devCd = werewolfCooldownLeft(you.devourReadyAt);
    if (devCd > 0) {
      showToast(`Devour cooling down (${formatCooldownMs(devCd)}).`);
      return;
    }
    const target = nearestWerewolfTarget("devour");
    if (!target) {
      showToast("No target in range for Devour.");
      return;
    }
    eliminatePlayer(target, `devoured by ${you.name}`);
    you.devourReadyAt = Date.now() + WEREWOLF_DEVOUR_COOLDOWN_MS;
    showToast(`🍖 ${target.name} was devoured! Devour ready in 40s.`);
    window.GameSFX?.play("hit");
    checkWin();
    updateHotbar();
    updateActionButtons();
  }

  function doWerewolfInfect() {
    const you = round.you;
    if (!you || !you.alive || you.roleId !== "werewolf" || phase !== "day") return;
    const infCd = werewolfCooldownLeft(you.infectReadyAt);
    if (infCd > 0) {
      showToast(`Infect cooling down (${formatCooldownMs(infCd)}).`);
      return;
    }
    const target = nearestWerewolfTarget("infect");
    if (!target) {
      showToast("No target in range for Infect.");
      return;
    }
    target.role = {
      ...target.role,
      faction: "betray",
      name: target.role.name.includes("(Infected)") ? target.role.name : `${target.role.name} (Infected)`,
    };
    you.infectReadyAt = Date.now() + WEREWOLF_INFECT_COOLDOWN_MS;
    showToast(`🧪 ${target.name} is now infected. Infect ready in 1 min.`);
    window.GameSFX?.play("coin");
    checkWin();
    updateHotbar();
    updateActionButtons();
  }

  function toggleWerewolfTransform() {
    const you = round.you;
    if (!you || !you.alive || you.roleId !== "werewolf" || phase !== "day") return;

    if (isWolfFormActive(you)) {
      you._skipWolfRevertToast = true;
      you.wolfFormUntil = 0;
      syncWerewolfForm(you);
      showToast("🧍 You revert to human form early — transform again anytime.");
      window.GameSFX?.play("click");
    } else {
      you.wolfFormUntil = Date.now() + WEREWOLF_FORM_MS;
      syncWerewolfForm(you);
      showToast("🐺 You transform! 30 seconds — press again to revert early.");
      window.GameSFX?.play("battle");
    }
    updateHotbar();
    updateActionButtons();
  }

  function eliminatePlayer(victim, reason) {
    if (!victim || !victim.alive) return;
    window.GameSFX?.play("hit");
    victim.alive = false;
    round.bodies.push({
      x: victim.x,
      y: victim.y,
      color: victim.color,
      name: victim.name,
      roleId: victim.roleId,
    });
    round.nightLog.push(`${victim.name} was eliminated${reason ? " — " + reason : ""}.`);
    const you = round.you;
    round.players.forEach((bot) => {
      if (!bot.isBot || !bot.alive) return;
      alivePlayers().forEach((other) => {
        if (other.id === bot.id || dist(other, victim) > 100) return;
        addBotSuspicion(bot, other.id, 18);
      });
      if (you?.alive && dist(you, victim) < 100) {
        addBotSuspicion(bot, "you", 28);
      }
    });
  }

  function checkWin() {
    if (round.winner) return;

    const betrayAlive = aliveByFaction("betray");
    const protectAlive = aliveByFaction("protect");
    const totalAlive = alivePlayers().length;
    const nonBetrayAlive = alivePlayers().filter((p) => !isBetrayFaction(p));

    const survivor = round.players.find((p) => p.roleId === "survivor" && p.alive);
    if (survivor && totalAlive <= 3) {
      endRound("rogue", `${survivor.name} survived as Survivor!`);
      return;
    }

    if (betrayAlive.length > 0 && nonBetrayAlive.length <= 1) {
      const names = betrayAlive.map((p) => p.name).join(", ");
      endRound(
        "betray",
        nonBetrayAlive.length === 0
          ? `${names} eliminated everyone — Betray wins!`
          : `${names} left only one target standing — Betray wins!`
      );
      return;
    }

    const anarchist = round.players.find((p) => p.roleId === "anarchist" && p.alive);
    if (anarchist && playerTasksComplete(anarchist)) {
      endRound("rogue", `${anarchist.name} finished all tasks as Anarchist!`);
      return;
    }

    const jester = round.players.find((p) => p.roleId === "jester" && p.alive);
    if (jester && jesterGoalsComplete(jester)) {
      const label = jester.id === "you" ? "You" : jester.name;
      endRound("rogue", `${label} pranked the town and pulled off a secret vote! 🃏 Jester wins!`);
      return;
    }

    if (betrayAlive.length === 0 && protectAlive.length > 0 && allProtectTasksComplete()) {
      endRound("protect", "All traitors are gone and the town finished every task! Protect wins!");
      return;
    }

    if (betrayAlive.length === 0 && protectAlive.length > 0 && !round.traitorsClearedHint) {
      round.traitorsClearedHint = true;
      showToast("Traitors eliminated! Protect must finish all tasks to win.");
    }
  }

  function endRound(winner, reason) {
    clearMeetingTimers();
    meetingActive = false;
    fakeMeetingOpen = false;
    document.getElementById("meeting-overlay")?.classList.add("hidden");
    document.getElementById("fake-meeting-overlay")?.classList.add("hidden");
    round.winner = winner;
    round.reason = reason;
    playing = false;
    phase = "day";
    document.getElementById("app")?.classList.remove("in-game", "playing");
    window.GameSFX?.play("win");

    const titles = {
      protect: "🛡️ Protect Wins!",
      betray: "🗡️ Betray Wins!",
      rogue: "🔥 Rogue Wins!",
    };
    document.getElementById("result-title").textContent = titles[winner] || "Round Over!";
    document.getElementById("result-desc").textContent = reason;
    document.getElementById("result-overlay").classList.remove("hidden");
  }

  function aliveBots() {
    return round.players.filter((p) => p.isBot && p.alive);
  }

  function clearMeetingTimers() {
    (round.meetingTimeouts || []).forEach((id) => clearTimeout(id));
    round.meetingTimeouts = [];
  }

  function meetingVoteTally() {
    const tally = {};
    let skips = 0;
    Object.values(round.meetingVotes || {}).forEach((targetId) => {
      if (targetId === "skip") {
        skips++;
        return;
      }
      tally[targetId] = (tally[targetId] || 0) + 1;
    });
    return { tally, skips };
  }

  function updateMeetingVoteUI() {
    const tallyEl = document.getElementById("vote-tally");
    const hintEl = document.getElementById("vote-hint");
    if (!tallyEl || !meetingActive) return;

    const { tally, skips } = meetingVoteTally();
    const you = round.you;
    const yourVote = you ? round.meetingVotes[you.id] : null;
    const votersDone = Object.keys(round.meetingVotes || {}).length;
    const votersTotal = alivePlayers().length;

    const lines = [];
    Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .forEach(([id, count]) => {
        const p = round.players.find((pl) => pl.id === id);
        if (p) lines.push(`${p.name}: ${count} vote${count === 1 ? "" : "s"}`);
      });
    if (skips) lines.push(`Skip: ${skips}`);
    tallyEl.textContent = lines.length ? lines.join(" · ") : "Waiting for votes…";

    if (hintEl) {
      const votesOnYou = you?.alive ? tally[you.id] || 0 : 0;
      const youWarning = votesOnYou ? ` · ⚠️ ${votesOnYou} vote${votesOnYou === 1 ? "" : "s"} on YOU` : "";
      if (you?.alive && yourVote == null) {
        hintEl.textContent = `Pick who to eject (${votersDone}/${votersTotal} voted)${youWarning}`;
      } else if (you?.alive) {
        hintEl.textContent = `You voted — waiting for others (${votersDone}/${votersTotal})${youWarning}`;
      } else {
        hintEl.textContent = `Town is voting (${votersDone}/${votersTotal})`;
      }
    }

    if (you?.alive && tally[you.id]) {
      let youRow = document.getElementById("vote-you-tally");
      if (!youRow) {
        youRow = document.createElement("p");
        youRow.id = "vote-you-tally";
        youRow.className = "vote-you-tally";
        tallyEl.parentNode?.insertBefore(youRow, tallyEl.nextSibling);
      }
      youRow.textContent = `⚠️ Votes on you: ${tally[you.id]}`;
    } else {
      document.getElementById("vote-you-tally")?.remove();
    }

    document.querySelectorAll("#vote-list .vote-btn").forEach((btn) => {
      const targetId = btn.dataset.playerId;
      const count = tally[targetId] || 0;
      const countEl = btn.querySelector(".vote-count");
      if (countEl) countEl.textContent = count ? String(count) : "";
      btn.classList.toggle("voted-by-you", you?.alive && yourVote === targetId);
    });
  }

  function pickBotVoteTarget(bot) {
    const you = round.you;
    const candidates = alivePlayers().filter((p) => p.id !== bot.id);
    if (!candidates.length) return "skip";

    const youCandidate = you?.alive && candidates.find((p) => p.id === "you");

    if (bot.role.faction === "betray") {
      const allyVote = aliveBots()
        .filter((b) => b.id !== bot.id && round.meetingVotes[b.id] && round.meetingVotes[b.id] !== "skip")
        .map((b) => round.meetingVotes[b.id])[0];
      if (allyVote && candidates.some((p) => p.id === allyVote)) return allyVote;

      if (
        youCandidate &&
        you.role.faction !== "betray" &&
        (getBotSuspicion(bot, "you") >= 20 || Math.random() < 0.42)
      ) {
        return "you";
      }

      const prey = pickFromWeighted(candidates, (p) => {
        if (p.role.faction === "betray") return 0.02;
        let w = 10;
        if (p.role.faction === "protect") w += 35;
        if (p.id === "you") w += 32 + getBotSuspicion(bot, "you") * 0.4;
        return w;
      });
      return prey?.id || rand(candidates).id;
    }

    if (bot.role.faction === "protect") {
      if (Math.random() < 0.05) return "skip";
      if (youCandidate && getBotSuspicion(bot, "you") >= 40 && Math.random() < 0.72) {
        return "you";
      }
      const pick = pickFromWeighted(candidates, (p) => {
        let w = 6 + getBotSuspicion(bot, p.id);
        if (p.id === "you") {
          w += 14 + getBotSuspicion(bot, "you") * 0.85;
        } else if (p.role.faction === "protect") {
          w *= 0.18;
        }
        if (bot.botKnownBetray[p.id]) w += 80;
        if (p.role.faction === "betray") w += 30;
        return w;
      });
      return pick?.id || rand(candidates).id;
    }

    if (Math.random() < 0.1) return "skip";
    const pick = pickFromWeighted(candidates, (p) => {
      let w = 8 + getBotSuspicion(bot, p.id) * 0.5;
      if (p.id === "you") w += 16;
      return w;
    });
    return pick?.id || rand(candidates).id;
  }

  function scheduleBotMeetingVotes() {
    clearMeetingTimers();
    round.meetingTimeouts = [];
    aliveBots().forEach((bot, i) => {
      const delay = 500 + i * 400 + Math.random() * 500;
      const tid = setTimeout(() => {
        if (!meetingActive || round.winner) return;
        round.meetingVotes[bot.id] = pickBotVoteTarget(bot);
        updateMeetingVoteUI();
        tryResolveMeeting();
      }, delay);
      round.meetingTimeouts.push(tid);
    });
  }

  function tryResolveMeeting() {
    if (!meetingActive) return;
    const voters = alivePlayers();
    const votes = round.meetingVotes || {};

    for (let i = 0; i < voters.length; i++) {
      if (votes[voters[i].id] === undefined) return;
    }

    resolveMeetingVotes();
  }

  function resolveMeetingVotes() {
    clearMeetingTimers();
    const { tally, skips } = meetingVoteTally();

    let bestId = null;
    let bestCount = 0;
    let tied = false;
    Object.entries(tally).forEach(([id, count]) => {
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
        tied = false;
      } else if (count === bestCount && count > 0) {
        tied = true;
      }
    });

    meetingActive = false;
    document.getElementById("meeting-overlay").classList.add("hidden");
    round.meetingVotes = {};

    if (!bestId || tied || bestCount <= skips) {
      const reason = tied ? "Vote tied — no one was ejected." : "Not enough votes — no one was ejected.";
      showToast(reason);
      beginNight();
      updateActionButtons();
      updatePhaseBanner();
      return;
    }

    const target = round.players.find((p) => p.id === bestId);
    if (!target) {
      showToast("No one was ejected.");
      beginNight();
      updateActionButtons();
      updatePhaseBanner();
      return;
    }

    ejectFromMeeting(target, bestCount);
  }

  function ejectFromMeeting(target, voteCount) {
    target.alive = false;
    botsLearnRole(target);
    if (target.id === "you") {
      showToast(
        `You were voted out (${voteCount} vote${voteCount === 1 ? "" : "s"})! You were ${target.role.emoji} ${target.role.name}.`
      );
    } else {
      showToast(
        `${target.name} was ejected (${voteCount} vote${voteCount === 1 ? "" : "s"})! They were ${target.role.emoji} ${target.role.name}.`
      );
    }

    checkWin();
    if (!round.winner) beginNight();
    updateHotbar();
    updateActionButtons();
    updatePhaseBanner();
  }

  function maybeBotEmergencyMeeting() {
    if (!playing || meetingActive || fakeMeetingOpen || nightOverlayOpen || phase !== "day" || round.winner) {
      return;
    }
    if (Date.now() < (round.nextBotMeetingAt || 0)) return;

    const bots = aliveBots();
    if (!bots.length || alivePlayers().length < 3) return;

    if (round.bodies.length > 0) {
      const protectBots = bots.filter((b) => b.role.faction === "protect");
      const reporterPool = protectBots.length ? protectBots : bots;
      const reportChance = protectBots.length ? 0.55 : BOT_BODY_REPORT_CHANCE * 0.5;
      if (Math.random() < reportChance) {
        const reporter = rand(reporterPool);
        round.nextBotMeetingAt = Date.now() + BOT_MEETING_MIN_GAP_MS;
        startMeeting(`🚨 ${reporter.name} reported a body!`);
        return;
      }
    }

    if (Math.random() > BOT_MEETING_CHANCE) return;

    const caller = pickFromWeighted(bots, (b) => (b.role.faction === "betray" ? 6 : 14)) || rand(bots);
    round.nextBotMeetingAt = Date.now() + BOT_MEETING_MIN_GAP_MS + Math.random() * 15000;
    startMeeting(`🚨 ${caller.name} called an emergency meeting!`);
  }

  function startMeeting(reason) {
    if (meetingActive || fakeMeetingOpen || phase !== "day") return;
    meetingActive = true;
    round.meetingVotes = {};
    round.nextBotMeetingAt = Date.now() + BOT_MEETING_MIN_GAP_MS;
    window.GameSFX?.play("meeting");
    document.getElementById("meeting-reason").textContent = reason;
    const list = document.getElementById("vote-list");
    list.innerHTML = "";

    const you = round.you;
    alivePlayers().forEach((p) => {
      if (p.id === you?.id) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vote-btn";
      btn.dataset.playerId = p.id;
      btn.innerHTML = `<span class="vote-dot" style="background:${p.color.hex}"></span> ${p.name}<span class="vote-count"></span>`;
      btn.addEventListener("click", () => playerCastVote(p));
      list.appendChild(btn);
    });

    document.getElementById("meeting-overlay").classList.remove("hidden");
    updateMeetingVoteUI();
    scheduleBotMeetingVotes();

    if (!you?.alive) {
      showToast("You are out — bots are voting…");
    }

    updateHotbar();
    updatePhaseBanner();
  }

  function playerCastVote(target) {
    const you = round.you;
    if (!meetingActive || !you?.alive || !target) return;
    if (round.meetingVotes[you.id] != null) {
      showToast("You already voted!");
      return;
    }
    round.meetingVotes[you.id] = target.id;
    showToast(`You voted for ${target.name}.`);
    updateMeetingVoteUI();
    tryResolveMeeting();
  }

  function skipVote() {
    const you = round.you;
    if (!meetingActive) return;
    if (you?.alive) {
      if (round.meetingVotes[you.id] != null) {
        showToast("You already voted!");
        return;
      }
      round.meetingVotes[you.id] = "skip";
      showToast("You voted to skip.");
      updateMeetingVoteUI();
      tryResolveMeeting();
      return;
    }
    clearMeetingTimers();
    meetingActive = false;
    document.getElementById("meeting-overlay").classList.add("hidden");
    round.meetingVotes = {};
    showToast("No one was ejected.");
    beginNight();
    updateActionButtons();
    updatePhaseBanner();
  }

  function beginNight() {
    phase = "night";
    window.GameSFX?.play("night");
    dayTimer = DAY_LENGTH;
    updatePhaseBanner();
    updateHotbar();
    updateActionButtons();

    const you = round.you;
    if (!you.alive) {
      resolveNight(generateBotNightActions());
      return;
    }

    if (you.role.night) {
      openNightOverlay();
    } else {
      showToast("You have no night ability — waiting for dawn…");
      setTimeout(() => resolveNight(generateBotNightActions()), 1200);
    }
  }

  function beginDay() {
    phase = "day";
    dayNum++;
    dayTimer = DAY_LENGTH;
    round.bodies = [];
    round.nightLog = [];
    round.investigateResult = null;
    showToast(`☀️ Day ${dayNum} begins! TRUST NO ONE.`);
    updateHotbar();
    updateActionButtons();
    updatePhaseBanner();
    checkWin();
  }

  function openNightOverlay() {
    const you = round.you;
    nightOverlayOpen = true;
    pendingNightAction = null;

    const prompts = {
      heal: "Choose who to protect tonight:",
      investigate: "Choose who to investigate:",
      autopsy: "Choose a body to examine:",
      kill: "Choose who to eliminate:",
      hunt: "Choose your prey (bypasses protection):",
      execute: "Choose who to execute:",
      plunder: "Choose who to plunder:",
      chaos: "Choose who to prank:",
    };

    document.getElementById("night-prompt").textContent =
      prompts[you.role.night] || "Choose a target:";
    const list = document.getElementById("night-targets");
    list.innerHTML = "";

    if (you.role.night === "autopsy") {
      if (round.bodies.length === 0) {
        list.innerHTML = "<p class='night-empty'>No bodies to examine.</p>";
      } else {
        round.bodies.forEach((b) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "vote-btn";
          btn.textContent = `⚰️ Body of ${b.name}`;
          btn.addEventListener("click", () => confirmNightAction({ type: "autopsy", body: b }));
          list.appendChild(btn);
        });
      }
    } else {
      alivePlayers().forEach((p) => {
        if (p.id === you.id && you.role.night !== "chaos") return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "vote-btn";
        btn.innerHTML = `<span class="vote-dot" style="background:${p.color.hex}"></span> ${p.name}`;
        btn.addEventListener("click", () =>
          confirmNightAction({ type: you.role.night, target: p.id, targetPlayer: p })
        );
        list.appendChild(btn);
      });
    }

    document.getElementById("night-overlay").classList.remove("hidden");
    updateActionButtons();
  }

  function confirmNightAction(action) {
    pendingNightAction = action;
    nightOverlayOpen = false;
    document.getElementById("night-overlay").classList.add("hidden");

    const botActions = generateBotNightActions();
    const allActions = pendingNightAction ? [...botActions, pendingNightAction] : botActions;
    resolveNight(allActions);
  }

  function skipNightAbility() {
    nightOverlayOpen = false;
    document.getElementById("night-overlay").classList.add("hidden");
    resolveNight(generateBotNightActions());
  }

  function generateBotNightActions() {
    const actions = [];
    round.players.forEach((p) => {
      if (!p.isBot || !p.alive || !p.role.night) return;
      if (p.role.night === "execute" && p.usesLeft <= 0) return;

      const targets = alivePlayers().filter((t) => t.id !== p.id);
      if (p.role.night === "autopsy") {
        const body = pickBotNightTarget(p, targets);
        if (body) actions.push({ type: "autopsy", body, bot: p.id });
        return;
      }
      if (!targets.length) return;
      const target = pickBotNightTarget(p, targets);
      if (!target) return;
      if (p.role.night === "investigate") {
        const isBetray = target.role.faction === "betray";
        if (!p.botKnownBetray) p.botKnownBetray = {};
        if (isBetray) {
          p.botKnownBetray[target.id] = true;
          addBotSuspicion(p, target.id, 50);
        } else {
          addBotSuspicion(p, target.id, -15);
        }
      }
      actions.push({ type: p.role.night, target: target.id, bot: p.id });
    });
    return actions;
  }

  function resolveNight(actions) {
    const healed = new Set();
    const killed = new Set();
    const hunted = new Set();

    actions.forEach((a) => {
      if (a.type === "heal" && a.target) healed.add(a.target);
      if (a.type === "chaos") {
        round.chaos++;
        showToast("Someone caused chaos in the night!");
      }
      if (a.type === "plunder") round.chaos++;
    });

    actions.forEach((a) => {
      if ((a.type === "kill" || a.type === "execute") && a.target) {
        if (!healed.has(a.target)) killed.add(a.target);
      }
      if (a.type === "hunt" && a.target) hunted.add(a.target);
    });

    hunted.forEach((id) => killed.add(id));

    actions.forEach((a) => {
      if (a.type === "investigate" && a.target) {
        const target = round.players.find((p) => p.id === a.target);
        if (target && a.bot === undefined) {
          const isBetray = target.role.faction === "betray";
          round.investigateResult = `${target.name} is ${isBetray ? "BETRAY 🗡️" : "NOT Betray 🛡️"}`;
          showToast(`Sheriff result: ${round.investigateResult}`);
        }
      }
      if (a.type === "autopsy" && a.body) {
        const role = ROLES[a.body.roleId];
        if (role && a.bot === undefined) {
          showToast(`Coroner: ${a.body.name} was ${role.emoji} ${role.name}`);
        }
      }
      if (a.type === "execute" && a.target) {
        const bot = round.players.find((p) => p.id === a.bot);
        if (bot) bot.usesLeft = Math.max(0, (bot.usesLeft || 1) - 1);
        if (a.bot === undefined) round.you.usesLeft = Math.max(0, (round.you.usesLeft || 1) - 1);
      }
    });

    killed.forEach((id) => {
      const victim = round.players.find((p) => p.id === id);
      if (victim && victim.alive) eliminatePlayer(victim, "night attack");
    });

    if (killed.size) {
      showToast(`${killed.size} player(s) fell in the night…`);
    } else {
      showToast("Everyone survived the night.");
    }

    checkWin();
    if (!round.winner) beginDay();
    updateHotbar();
    updateActionButtons();
  }

  function updateBots(dt) {
    if (phase !== "day") return;

    if (!meetingActive && !nightOverlayOpen && !fakeMeetingOpen) {
      round.botMeetingTimer = (round.botMeetingTimer || 0) + dt;
      round.botObserveTimer = (round.botObserveTimer || 0) + dt;
      if (round.botObserveTimer >= 45) {
        round.botObserveTimer = 0;
        observeBotWorld();
      }
      if (round.botMeetingTimer >= BOT_MEETING_CHECK_FRAMES) {
        round.botMeetingTimer = 0;
        maybeBotEmergencyMeeting();
      }
    }

    round.players.forEach((p) => {
      if (!p.isBot || !p.alive || meetingActive || fakeMeetingOpen) return;

      if ((p.killCooldown || 0) > 0) p.killCooldown -= dt;

      updateBotJester(p);

      p.botTimer -= dt;
      if (p.botTimer <= 0) {
        p.botTarget = pickBotDayDestination(p);
        p.botHunting = !!p.botTarget?.hunt;
        if (p.botTarget?.hunt) {
          p.botTarget = { x: p.botTarget.x, y: p.botTarget.y };
        }
        p.botTimer = p.botHunting ? 35 + Math.random() * 45 : 50 + Math.random() * 70;
      }

      if (p.botTarget) {
        const dx = p.botTarget.x - p.x;
        const dy = p.botTarget.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = SPEED * (p.botHunting ? 0.82 : 0.7);
        if (len < 10) {
          if (p.role.faction === "betray" && tryBotBetrayKill(p)) {
            /* killed prey */
          }
          p.botTarget = null;
          p.botHunting = false;
          if (playerNeedsTasks(p) && !playerTasksComplete(p) && Math.random() < 0.5) {
            const station = TASK_STATIONS.find((s) => !hasCompletedTask(p, s.taskId));
            if (station && dist(p, station) <= TASK_USE_RANGE + 15) {
              completeTaskFor(p, station);
            }
          }
        } else {
          moveEntity(p, (dx / len) * speed, (dy / len) * speed);
        }
      }
    });
    checkWin();
  }

  function drawWorld() {
    const taskFlags = {};
    const you = round.you;
    if (you) {
      TASK_STATIONS.forEach((s) => {
        taskFlags[s.taskId] = hasCompletedTask(you, s.taskId);
      });
    }

    RRSprites.drawWorld(
      ctx,
      cam,
      w,
      h,
      animT,
      taskFlags,
      round.bodies,
      round.players,
      remotePlayers,
      PLAYER_COLORS,
      {
        isNight: phase === "night",
        viewerFaction: round.you?.role?.faction || null,
        viewerX: round.you?.x || cam.x,
        viewerY: round.you?.y || cam.y,
        isMeeting: meetingActive,
      }
    );
    window.GameRealism?.postFrame(ctx, w, h, {
      isNight: phase === "night",
      isMeeting: meetingActive,
      animT,
      focusX: w / 2,
      focusY: h / 2,
      vignette: phase === "night" ? 0.48 : meetingActive ? 0.26 : 0.24,
      grainCount: phase === "night" ? 520 : 380,
      haze: phase !== "night",
      lighting: true,
      ao: true,
      decor: phase === "night" ? "depths" : "day",
    });
  }

  function gameLoop() {
    animT++;
    const dt = 1;

    if (playing && !meetingActive && !nightOverlayOpen && !fakeMeetingOpen && round.you) {
      const you = round.you;
      if (you.alive && phase === "day") {
        const mv = getMoveInput();
        if (mv.dx || mv.dy) moveEntity(you, mv.dx, mv.dy);
        else you.moving = false;

        dayTimer -= dt;
        if (dayTimer <= 0) beginNight();
      } else {
        you.moving = false;
      }

      cam.x += (you.x - cam.x) * 0.1;
      cam.y += (you.y - cam.y) * 0.1;

      if (you.roleId === "werewolf") syncWerewolfForm(you);

      updateHotbar(true);
      updateBots(dt);
      updateActionButtons();
    }

    drawWorld();
    requestAnimationFrame(gameLoop);
  }

  function initMultiplayer(name) {
    if (typeof GameMP === "undefined") return;
    if (typeof markGameMpCustom === "function") markGameMpCustom();
    GameMP.init({
      game: "random-roles",
      subroom: "town-1",
      getName: () => name,
      getState: () => {
        const you = round.you;
        if (!you) return {};
        return {
          fx: you.x,
          fy: you.y,
          colorId: you.color?.id,
          roleId: you.roleId,
          faction: you.role?.faction || null,
          facing: you.facing || 1,
          moving: !!you.moving,
          walkPhase: you.walkPhase || 0,
          wolfForm: !!you.wolfForm,
        };
      },
      onPeers: (peers) => {
        remotePlayers = peers || [];
      },
    });
    GameMP.start();
  }

  function bindUI() {
    document.getElementById("play-btn").addEventListener("click", () => {
      const name = document.getElementById("name-input").value.trim() || "Player";
      initMultiplayer(name);
      startRound(name);
    });

    document.getElementById("role-go-btn").addEventListener("click", () => {
      document.getElementById("role-overlay").classList.add("hidden");
    });

    document.getElementById("use-btn").addEventListener("click", () => {
      const spot = nearestMeetingSpot(round.you);
      if (spot) {
        startMeeting(`${round.you.name} called a meeting at ${spot.room}!`);
      }
    });

    document.getElementById("task-btn").addEventListener("click", doTask);

    document.getElementById("report-btn").addEventListener("click", () => {
      if (nearestBody(round.you)) startMeeting("A body was reported!");
    });

    document.getElementById("meeting-btn").addEventListener("click", () => {
      startMeeting(`${round.you.name} called an emergency meeting!`);
    });

    document.getElementById("night-btn").addEventListener("click", () => {
      if (phase === "night" && round.you.role.night) openNightOverlay();
    });
    document.getElementById("devour-btn").addEventListener("click", doWerewolfDevour);
    document.getElementById("infect-btn").addEventListener("click", doWerewolfInfect);
    document.getElementById("transform-btn").addEventListener("click", toggleWerewolfTransform);
    document.getElementById("prank-btn").addEventListener("click", doJesterPrank);
    document.getElementById("fake-meeting-btn").addEventListener("click", startFakeMeeting);
    document.getElementById("fake-meeting-cancel-btn")?.addEventListener("click", closeFakeMeeting);
    document.getElementById("fake-meeting-vote-check")?.addEventListener("change", refreshFakeVoteList);

    document.getElementById("night-skip-btn").addEventListener("click", skipNightAbility);

    document.getElementById("skip-vote-btn").addEventListener("click", skipVote);

    document.getElementById("play-again-btn").addEventListener("click", () => {
      document.getElementById("result-overlay").classList.add("hidden");
      const name = document.getElementById("name-input").value.trim() || "Player";
      startRound(name);
    });

    document.getElementById("leave-btn").addEventListener("click", () => {
      window.location.href = "../../index.html";
    });

    document.getElementById("settings-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.remove("hidden");
    });

    document.getElementById("close-settings-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.add("hidden");
    });

    document.getElementById("leave-game-btn").addEventListener("click", () => {
      window.location.href = "../../index.html";
    });
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resizeCanvas);
    }
    setupJoystick();
    setupKeys();
    bindUI();
    requestAnimationFrame(gameLoop);
  }

  init();
})();
