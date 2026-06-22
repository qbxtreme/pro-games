(function () {
  "use strict";

  const { ROLES, PLAYER_COLORS, BOT_NAMES, VARIANTS } = MMRoles;
  const PUZZLES = MMMap.getPuzzleStations();
  const ESCAPE = MMMap.getEscapeGate();
  const PLAYER_R = 14;
  const SPEED = 3.1;
  const USE_RANGE = 52;
  const BOT_COUNT = 7;
  const PUZZLES_REQUIRED = 3;
  const ROUND_LENGTH = 7200;
  const KILL_COOLDOWN = 200;

  const CFG = Object.assign(
    {
      saveKey: "murder-3",
      chatRoom: "murder-3",
      mpGame: "murder-3",
      title: "🔪 Murder Mystery",
      tagline: "Uncover the killer — or escape before it's too late!",
      variant: "default",
    },
    window.GAME_CONFIG || {}
  );

  let canvas, ctx, w, h;
  let playing = false;
  let joyActive = false;
  let joyDx = 0;
  let joyDy = 0;
  let keys = {};
  let cam = { x: 800, y: 600 };
  let animT = 0;
  let remotePlayers = [];
  let toastTimer = null;
  let dayTimer = ROUND_LENGTH;
  const btnSticky = { action: false, report: false };

  let round = {
    players: [],
    you: null,
    bodies: [],
    winner: null,
    reason: "",
    globalPuzzlesDone: {},
    escapedCount: 0,
  };

  function variantMeta() {
    return VARIANTS[CFG.variant] || VARIANTS.default;
  }

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
    } else if (dist < showAt) btnSticky[key] = true;
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
    w = wrap.clientWidth;
    h = wrap.clientHeight;
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
    if (!MMMap.collidesCircle(nx, ent.y, PLAYER_R)) ent.x = nx;
    if (!MMMap.collidesCircle(ent.x, ny, PLAYER_R)) ent.y = ny;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function alivePlayers() {
    return round.players.filter((p) => p.alive);
  }

  function activeSuspects() {
    return round.players.filter((p) => p.alive && p.roleId === "suspect" && !p.escaped);
  }

  function puzzlesDoneCount(p) {
    return Object.keys(p.puzzlesDone || {}).length;
  }

  function canEscape(p) {
    return p.roleId === "suspect" && puzzlesDoneCount(p) >= PUZZLES_REQUIRED;
  }

  function assignRoles(total) {
    const slots = ["murderer", "detective"];
    while (slots.length < total) slots.push("suspect");
    return shuffle(slots).map((id) => ROLES[id]);
  }

  function applyBranding() {
    const v = variantMeta();
    document.title = CFG.title;
    const h1 = document.querySelector("#start-overlay h1");
    if (h1) h1.textContent = CFG.title;
    const tag = document.querySelector("#start-overlay .tagline");
    if (tag) tag.textContent = CFG.tagline;
    const hero = document.getElementById("hero-line");
    if (hero) hero.textContent = v.heroLine;
    const list = document.getElementById("feature-list");
    if (list) list.innerHTML = v.features.map((li) => `<li>${li}</li>`).join("");
    const playBtn = document.getElementById("play-btn");
    if (playBtn) playBtn.textContent = "Enter the Mystery!";
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
      globalPuzzlesDone: {},
      escapedCount: 0,
    };

    dayTimer = ROUND_LENGTH;

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
        escaped: false,
        x: MMMap.spawnPoints[i % MMMap.spawnPoints.length].x,
        y: MMMap.spawnPoints[i % MMMap.spawnPoints.length].y,
        facing: 1,
        moving: false,
        walkPhase: 0,
        botTimer: 0,
        botTarget: null,
        isBot: !isYou,
        puzzlesDone: {},
        killCd: 0,
        investigateCd: 0,
        knownMurderer: false,
      };
      round.players.push(p);
      if (isYou) round.you = p;
    }

    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("world-hotbar").classList.remove("hidden");
    document.getElementById("app")?.classList.add("in-game", "playing");

    const you = round.you;
    const roleEl = document.getElementById("role-reveal");
    const descEl = document.getElementById("role-desc");
    const facEl = document.getElementById("role-faction");
    roleEl.textContent = `${you.role.emoji} ${you.role.name}`;
    roleEl.className = "role-reveal role-" + you.roleId;
    facEl.textContent = `${you.role.emoji} ${you.role.name} — Day phase active`;
    facEl.className = "role-faction role-" + you.roleId;
    descEl.textContent = you.role.desc;
    document.getElementById("role-overlay").classList.remove("hidden");

    playing = true;
    cam.x = you.x;
    cam.y = you.y;
    updateHotbar();
    updateActionButtons();
    updatePhaseBanner();
    showToast(`☀️ Day phase — find who killed ${variantMeta().victim}!`);
  }

  function updatePhaseBanner() {
    const el = document.getElementById("phase-banner");
    if (!el) return;
    const secs = Math.ceil(dayTimer / 60);
    el.textContent = `☀️ Day · ${secs}s left`;
    el.className = "phase-banner day";
  }

  function updateHotbar(liveRoomOnly) {
    const you = round.you;
    if (!you) return;
    const room = MMMap.getRoomAt(you.x, you.y);
    document.getElementById("hotbar-flavor").textContent = room
      ? `${you.role.name} · ${room.label}`
      : you.role.name;
    if (liveRoomOnly) return;

    document.getElementById("hotbar-role").textContent = `${you.role.emoji} ${you.role.name}`;
    document.getElementById("hotbar-role").style.borderColor = you.role.color;
    document.getElementById("hotbar-tasks").textContent = `☀️ Day phase`;
    document.getElementById("hotbar-alive").textContent = `👥 ${activeSuspects().length} suspects`;

    const list = document.getElementById("hotbar-task-list");
    if (you.roleId === "suspect") {
      const n = puzzlesDoneCount(you);
      list.innerHTML = `🧩 Puzzles: ${n}/${PUZZLES_REQUIRED}<br>${n >= PUZZLES_REQUIRED ? "🚤 Escape unlocked!" : "Solve clues to unlock escape"}`;
    } else if (you.roleId === "detective") {
      list.innerHTML = `🔍 Investigate players<br>🔫 Stop the murderer`;
    } else {
      list.innerHTML = `🔪 Eliminate all suspects<br>🤫 Kill in stealth`;
    }
  }

  function nearestPuzzle(you) {
    if (!btnSticky.action) return null;
    let best = null;
    let bestD = USE_RANGE + 20;
    PUZZLES.forEach((s) => {
      if (you.puzzlesDone && you.puzzlesDone[s.id]) return;
      const d = dist(you, s);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    });
    return best;
  }

  function nearestPlayer(you, filterFn) {
    let best = null;
    let bestD = USE_RANGE + 20;
    alivePlayers().forEach((p) => {
      if (p.id === you.id) return;
      if (filterFn && !filterFn(p)) return;
      const d = dist(you, p);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    });
    return best;
  }

  function nearestBody(you) {
    if (!btnSticky.report) return null;
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

  function nearEscape(you) {
    return dist(you, ESCAPE) < USE_RANGE + 10;
  }

  function updateProximitySticky(you) {
    let actionDist = Infinity;
    if (you.roleId === "suspect") {
      PUZZLES.forEach((s) => {
        if (!you.puzzlesDone[s.id]) actionDist = Math.min(actionDist, dist(you, s));
      });
      if (canEscape(you)) actionDist = Math.min(actionDist, dist(you, ESCAPE));
    } else if (you.roleId === "murderer") {
      activeSuspects().forEach((p) => {
        actionDist = Math.min(actionDist, dist(you, p));
      });
    } else if (you.roleId === "detective") {
      alivePlayers().forEach((p) => {
        if (p.id !== you.id) actionDist = Math.min(actionDist, dist(you, p));
      });
    }
    stickyNear(actionDist, USE_RANGE, USE_RANGE + 22, "action");

    let bodyDist = Infinity;
    round.bodies.forEach((b) => {
      bodyDist = Math.min(bodyDist, dist(you, b));
    });
    stickyNear(bodyDist, USE_RANGE, USE_RANGE + 22, "report");
  }

  function updateActionButtons() {
    const useBtn = document.getElementById("use-btn");
    const reportBtn = document.getElementById("report-btn");

    if (!playing || round.winner) {
      setBtnVisible(useBtn, false);
      setBtnVisible(reportBtn, false);
      return;
    }

    const you = round.you;
    if (!you.alive) {
      setBtnVisible(useBtn, false);
      setBtnVisible(reportBtn, false);
      return;
    }

    updateProximitySticky(you);

    let showUse = false;
    let useLabel = "USE";

    if (you.roleId === "suspect" && !you.escaped) {
      const puzzle = nearestPuzzle(you);
      if (puzzle) {
        showUse = true;
        useLabel = `${puzzle.emoji} SOLVE`;
      } else if (canEscape(you) && nearEscape(you)) {
        showUse = true;
        useLabel = "🚤 ESCAPE!";
      }
    } else if (you.roleId === "murderer" && you.killCd <= 0) {
      const prey = nearestPlayer(you, (p) => p.roleId === "suspect" && !p.escaped);
      if (prey && btnSticky.action) {
        showUse = true;
        useLabel = "🔪 ELIMINATE";
      }
    } else if (you.roleId === "detective") {
      if (you.knownMurderer) {
        const killer = nearestPlayer(you, (p) => p.roleId === "murderer" && p.alive);
        if (killer && btnSticky.action) {
          showUse = true;
          useLabel = "🔫 STOP KILLER";
        }
      } else if (you.investigateCd <= 0) {
        const target = nearestPlayer(you, (p) => p.id !== you.id);
        if (target && btnSticky.action) {
          showUse = true;
          useLabel = "🔍 INVESTIGATE";
        }
      }
    }

    setBtnVisible(useBtn, showUse);
    if (showUse && useBtn.textContent !== useLabel) useBtn.textContent = useLabel;

    const body = nearestBody(you);
    setBtnVisible(reportBtn, !!body && you.roleId === "detective");
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
    showToast(`${victim.name} was eliminated${reason ? " — " + reason : ""}!`);
  }

  function solvePuzzle(you, spot) {
    if (!spot || you.puzzlesDone[spot.id]) return;
    you.puzzlesDone[spot.id] = true;
    round.globalPuzzlesDone[spot.id] = true;
    const n = puzzlesDoneCount(you);
    showToast(`🧩 Solved ${spot.label}! (${n}/${PUZZLES_REQUIRED})`);
    if (n >= PUZZLES_REQUIRED) showToast("🚤 Escape boat unlocked at the Docks!");
    updateHotbar();
    updateActionButtons();
  }

  function tryEscape(you) {
    if (!canEscape(you) || !nearEscape(you)) return;
    you.escaped = true;
    round.escapedCount++;
    showToast(`${you.name} escaped! Suspects win if anyone gets away!`);
    checkWin();
    updateHotbar();
    updateActionButtons();
  }

  function tryKill(you) {
    const prey = nearestPlayer(you, (p) => p.roleId === "suspect" && !p.escaped);
    if (!prey || you.killCd > 0) return;
    eliminatePlayer(prey, "stealth attack");
    you.killCd = KILL_COOLDOWN;
    checkWin();
    updateActionButtons();
  }

  function investigatePlayer(you, target) {
    if (!target || you.investigateCd > 0) return;
    you.investigateCd = 90;
    if (target.roleId === "murderer") {
      const suspicious = Math.random() < 0.75;
      if (suspicious) {
        you.knownMurderer = true;
        showToast(`${target.name} is VERY SUSPICIOUS — likely the murderer!`);
      } else {
        showToast(`${target.name} seems innocent… keep watching.`);
      }
    } else if (target.roleId === "detective") {
      showToast(`${target.name} is an armed detective.`);
    } else {
      showToast(`${target.name} seems like an innocent suspect.`);
    }
    updateActionButtons();
  }

  function shootMurderer(you) {
    const killer = nearestPlayer(you, (p) => p.roleId === "murderer" && p.alive);
    if (!killer) return;
    eliminatePlayer(killer, "caught by detective");
    endRound("detective", `${you.name} stopped the murderer!`);
  }

  function examineBody(you, body) {
    if (!body) return;
    const role = ROLES[body.roleId];
    showToast(`Autopsy: ${body.name} was ${role ? role.emoji + " " + role.name : "unknown"}.`);
  }

  function checkWin() {
    if (round.winner) return;

    const murderer = round.players.find((p) => p.roleId === "murderer");
    const suspectsLeft = activeSuspects();

    if (round.escapedCount > 0) {
      endRound("suspect", "A suspect escaped — the innocent got away!");
      return;
    }

    if (!murderer || !murderer.alive) {
      endRound("detective", "The murderer was caught — Detective wins!");
      return;
    }

    if (suspectsLeft.length === 0) {
      endRound("murderer", "Every suspect has fallen — Murderer wins!");
    }
  }

  function endRound(winner, reason) {
    round.winner = winner;
    round.reason = reason;
    playing = false;
    document.getElementById("app")?.classList.remove("in-game", "playing");
    window.GameSFX?.play("win");

    const titles = {
      suspect: "🔍 Suspects Win!",
      detective: "🔫 Detective Wins!",
      murderer: "🔪 Murderer Wins!",
    };
    document.getElementById("result-title").textContent = titles[winner] || "Round Over!";
    document.getElementById("result-desc").textContent = reason;
    document.getElementById("result-overlay").classList.remove("hidden");
  }

  function updateBots(dt) {
    if (!playing || round.winner) return;

    round.players.forEach((p) => {
      if (!p.isBot || !p.alive) return;
      if (p.killCd > 0) p.killCd -= dt;
      if (p.investigateCd > 0) p.investigateCd -= dt;

      p.botTimer -= dt;
      if (p.botTimer <= 0) {
        if (p.roleId === "murderer") {
          const prey = activeSuspects();
          if (prey.length) p.botTarget = { x: prey[0].x, y: prey[0].y };
          p.botTimer = 40 + Math.random() * 50;
        } else if (p.roleId === "detective") {
          const killer = round.players.find((x) => x.roleId === "murderer" && x.alive);
          if (p.knownMurderer && killer) {
            p.botTarget = { x: killer.x, y: killer.y };
          } else {
            const others = alivePlayers().filter((x) => x.id !== p.id);
            if (others.length) p.botTarget = { x: others[0].x, y: others[0].y };
          }
          p.botTimer = 50 + Math.random() * 60;
        } else if (p.roleId === "suspect" && !p.escaped) {
          if (canEscape(p)) {
            p.botTarget = { x: ESCAPE.x, y: ESCAPE.y };
          } else {
            const todo = PUZZLES.find((s) => !p.puzzlesDone[s.id]);
            if (todo) p.botTarget = { x: todo.x, y: todo.y };
          }
          p.botTimer = 55 + Math.random() * 70;
        }
      }

      if (p.botTarget) {
        const dx = p.botTarget.x - p.x;
        const dy = p.botTarget.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = SPEED * 0.65;
        if (len < 10) {
          p.botTarget = null;
          if (p.roleId === "murderer" && p.killCd <= 0) {
            const prey = activeSuspects().find((s) => dist(p, s) < USE_RANGE);
            if (prey) {
              eliminatePlayer(prey, "stealth attack");
              p.killCd = KILL_COOLDOWN;
              checkWin();
            }
          } else if (p.roleId === "detective") {
            const killer = round.players.find((x) => x.roleId === "murderer" && x.alive);
            if (killer && dist(p, killer) < USE_RANGE) {
              if (p.knownMurderer) {
                eliminatePlayer(killer, "caught by detective");
                checkWin();
              } else if (p.investigateCd <= 0) {
                investigatePlayer(p, killer);
              }
            }
          } else if (p.roleId === "suspect" && !p.escaped) {
            const spot = PUZZLES.find((s) => !p.puzzlesDone[s.id] && dist(p, s) < USE_RANGE);
            if (spot) solvePuzzle(p, spot);
            else if (canEscape(p) && dist(p, ESCAPE) < USE_RANGE) {
              p.escaped = true;
              round.escapedCount++;
              checkWin();
            }
          }
        } else {
          moveEntity(p, (dx / len) * speed, (dy / len) * speed);
        }
      }
    });
  }

  function drawWorld() {
    const you = round.you;
    MMSprites.drawWorld(
      ctx,
      cam,
      w,
      h,
      animT,
      {},
      round.bodies,
      round.players,
      remotePlayers,
      PLAYER_COLORS,
      {
        donePuzzles: you ? you.puzzlesDone : round.globalPuzzlesDone,
        escapeUnlocked: you && canEscape(you),
      }
    );
    window.GameRealism?.postFrame(ctx, w, h, {
      animT,
      isNight: false,
      focusX: w / 2,
      focusY: h / 2,
      vignette: 0.24,
      grainCount: 380,
      haze: true,
      lighting: true,
      ao: true,
      decor: "day",
    });
  }

  function gameLoop() {
    animT++;
    const dt = 1;

    if (playing && !round.winner && round.you) {
      const you = round.you;
      if (you.alive && !you.escaped) {
        const mv = getMoveInput();
        if (mv.dx || mv.dy) moveEntity(you, mv.dx, mv.dy);
        else you.moving = false;
      } else {
        you.moving = false;
      }

      if (you.killCd > 0) you.killCd -= dt;
      if (you.investigateCd > 0) you.investigateCd -= dt;

      dayTimer -= dt;
      if (dayTimer <= 0) {
        showToast("⏰ Time's up! Murderer wins by default!");
        endRound("murderer", "Time ran out — the killer got away with it!");
      }

      if (window.AllOutCamera) {
        AllOutCamera.follow(cam, you.x, you.y, dt, mv.dx, mv.dy, 10);
      } else {
        cam.x += (you.x - cam.x) * 0.1;
        cam.y += (you.y - cam.y) * 0.1;
      }

      updateHotbar(true);
      updateBots(dt);
      updateActionButtons();
      updatePhaseBanner();
    }

    drawWorld();
    requestAnimationFrame(gameLoop);
  }

  function initMultiplayer(name) {
    if (typeof GameMP === "undefined") return;
    GameMP.init({
      game: CFG.mpGame,
      subroom: "mansion-1",
      getName: () => name,
      getState: () => {
        const you = round.you;
        if (!you) return {};
        return {
          fx: you.x,
          fy: you.y,
          colorId: you.color?.id,
          roleId: you.roleId,
          facing: you.facing || 1,
          moving: !!you.moving,
          walkPhase: you.walkPhase || 0,
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
      const you = round.you;
      if (!you || !you.alive) return;
      if (you.roleId === "suspect") {
        const puzzle = nearestPuzzle(you);
        if (puzzle) solvePuzzle(you, puzzle);
        else tryEscape(you);
      } else if (you.roleId === "murderer") {
        tryKill(you);
      } else if (you.roleId === "detective") {
        if (you.knownMurderer) shootMurderer(you);
        else {
          const target = nearestPlayer(you, (p) => p.id !== you.id);
          if (target) investigatePlayer(you, target);
        }
      }
      checkWin();
    });

    document.getElementById("report-btn").addEventListener("click", () => {
      const body = nearestBody(round.you);
      if (body) examineBody(round.you, body);
    });

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
    applyBranding();
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    setupJoystick();
    setupKeys();
    bindUI();
    requestAnimationFrame(gameLoop);
  }

  __bapDeferInit(init);

  window.__murder3D = function () {
    if (!playing || !round?.you) return null;
    const you = round.you;
    return {
      worldW: MMMap.WORLD_W,
      worldH: MMMap.WORLD_H,
      ground: "#4e342e",
      defaultModel: "trainer",
      player: {
        x: you.x,
        y: you.y,
        model: "trainer",
        color: "#78909c",
      },
      entities: (round.players || [])
        .filter((p) => p !== you && p.alive)
        .map((p, i) => ({
          id: p.id || `p${i}`,
          x: p.x,
          y: p.y,
          model: "trainer",
          color: p.color || "#ef5350",
        })),
    };
  };
})();
