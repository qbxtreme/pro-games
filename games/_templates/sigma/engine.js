(function () {
  "use strict";

  const C = window.GAME_CONFIG;
  if (!C) throw new Error("GAME_CONFIG required");

  const SAVE_KEY = C.saveKey || "sigma-game";
  const WORLD_W = 1100;
  const WORLD_H = 800;
  const PLAYER_R = 18;
  const SPEED = 2.8;
  const BOT_COUNT = 14;
  const MAX_ALIVE = 15;
  const MINIGAMES = C.miniGames || ["redlight", "potato", "glass", "balloon", "mingle"];
  const BOT_NAMES = ["Neo", "Kai", "Zoe", "Max", "Luna", "Ace", "Rio", "Sky", "Jay", "Mia", "Leo", "Ivy", "Sam", "Fox"];

  let canvas, ctx, w, h;
  let playing = false;
  let animT = 0;
  let joy = { dx: 0, dy: 0 };
  let keys = {};
  let cam = { x: 550, y: 400 };
  let remotePlayers = [];
  let toastTimer = 0;

  let round = {
    players: [],
    you: null,
    phase: "lobby",
    miniIndex: 0,
    miniId: null,
    miniTimer: 0,
    light: "green",
    lightTimer: 0,
    potatoHolder: null,
    potatoTimer: 0,
    glassRow: 0,
    glassSafe: [],
    mingleTarget: 3,
    mingleTimer: 0,
    winner: null,
    roundWins: 0,
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
    } catch (_) {}
    return defaultState();
  }

  function defaultState() {
    return { name: "Player", style: "cute", wins: 0, rounds: 0 };
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function ui(key, vars) {
    const t = (C.ui && C.ui[key]) || key;
    if (!vars) return t;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp("\\{" + k + "\\}", "g"), v), t);
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

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
  }

  function alivePlayers() {
    return round.players.filter((p) => p.alive);
  }

  function updateHud() {
    const alive = alivePlayers().length;
    const elA = document.getElementById("alive-display");
    const elR = document.getElementById("round-display");
    const elW = document.getElementById("wins-display");
    if (elA) elA.textContent = `👥 ${alive} left`;
    if (elR) elR.textContent = `🎮 ${round.miniIndex + 1}/${MINIGAMES.length}`;
    if (elW) elW.textContent = `🏆 ${state.wins}`;
    const banner = document.getElementById("minigame-banner");
    if (banner) {
      if (round.phase === "minigame" && round.miniId) {
        banner.classList.remove("hidden");
        banner.textContent = miniTitle(round.miniId);
      } else if (round.phase === "lobby") {
        banner.classList.remove("hidden");
        banner.textContent = "🏟️ Lobby — next game soon!";
      } else {
        banner.classList.add("hidden");
      }
    }
    renderLeaderboard();
  }

  function miniTitle(id) {
    const map = {
      redlight: "🚦 Red Light Green Light",
      potato: "🥔 Hot Potato",
      glass: "🌉 Glass Bridge",
      balloon: "🎈 Balloon Pop",
      mingle: "💃 Mingle",
    };
    return map[id] || id;
  }

  function renderLeaderboard() {
    const lb = document.getElementById("leaderboard");
    if (!lb || !playing) return;
    const sorted = [...round.players]
      .sort((a, b) => (b.roundWins || 0) - (a.roundWins || 0) || (b.alive ? 1 : 0) - (a.alive ? 1 : 0))
      .slice(0, 8);
    lb.innerHTML = `<h3>${ui("leaderboardTitle")}</h3><ol>${sorted
      .map((p, i) => `<li>${i + 1}. ${p.name.slice(0, 8)} ${p.roundWins ? "🏆" + p.roundWins : ""}${p.alive ? "" : " 💀"}</li>`)
      .join("")}</ol>`;
    lb.classList.remove("hidden");
  }

  function startRound(playerName, style) {
    state.name = playerName || state.name;
    state.style = style || state.style;
    saveState();

    const colors = shuffle(SigmaSprites.PLAYER_COLORS);
    round = {
      players: [],
      you: null,
      phase: "lobby",
      miniIndex: 0,
      miniId: null,
      miniTimer: 180,
      light: "green",
      lightTimer: 90,
      potatoHolder: null,
      potatoTimer: 0,
      glassRow: 0,
      glassSafe: [],
      mingleTarget: 3,
      mingleTimer: 0,
      winner: null,
      roundWins: 0,
    };

    for (let i = 0; i < MAX_ALIVE; i++) {
      const isYou = i === 0;
      const p = {
        id: isYou ? "you" : "bot-" + i,
        name: isYou ? state.name : BOT_NAMES[i - 1] || "Bot" + i,
        style: isYou ? state.style : colors[i % colors.length],
        color: colors[i % colors.length],
        alive: true,
        x: 200 + (i % 5) * 160,
        y: 200 + Math.floor(i / 5) * 120,
        facing: 1,
        moving: false,
        walkPhase: 0,
        isBot: !isYou,
        botTimer: 0,
        roundWins: isYou ? state.wins : Math.floor(Math.random() * 3),
        frozen: false,
        hasBalloon: true,
        glassChoice: null,
      };
      round.players.push(p);
      if (isYou) round.you = p;
    }

    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("app").classList.add("playing");
    document.getElementById("action-btn")?.classList.add("hidden");
    document.getElementById("glass-picks")?.classList.add("hidden");

    playing = true;
    showToast("15 players — survive every mini-game!");
    scheduleNextMini();
    updateHud();

    if (window.GameMP) {
      GameMP.init({
        game: C.mpGame || SAVE_KEY,
        subroom: "round",
        getName: () => state.name,
        getState: () => ({
          x: round.you?.x,
          y: round.you?.y,
          style: state.style,
          alive: round.you?.alive,
          phase: round.phase,
        }),
        onPeers: onPeers,
      });
      GameMP.start();
    }
  }

  function onPeers(peers) {
    remotePlayers = peers
      .filter((p) => p.state && p.state.alive !== false)
      .map((p) => ({
        name: p.name,
        x: p.state.x || 500,
        y: p.state.y || 400,
        style: p.state.style || "cool",
        alive: p.state.alive !== false,
      }));
  }

  function scheduleNextMini() {
    if (alivePlayers().length <= 1) {
      endRound();
      return;
    }
    round.phase = "lobby";
    round.miniTimer = 120;
    setTimeout(() => {
      if (!playing) return;
      startMiniGame();
    }, 2000);
  }

  function startMiniGame() {
    if (alivePlayers().length <= 1) {
      endRound();
      return;
    }
    round.phase = "minigame";
    round.miniId = MINIGAMES[round.miniIndex % MINIGAMES.length];
    round.miniIndex++;
    round.miniTimer = 3600;
    showToast(miniTitle(round.miniId) + " — GO!");

    alivePlayers().forEach((p) => {
      p.x = 150 + Math.random() * (WORLD_W - 300);
      p.y = 150 + Math.random() * (WORLD_H - 300);
      p.frozen = false;
      p.hasBalloon = true;
      p.glassChoice = null;
    });

    if (round.miniId === "redlight") {
      round.light = "green";
      round.lightTimer = 100;
    } else if (round.miniId === "potato") {
      round.potatoHolder = rand(alivePlayers());
      round.potatoTimer = 180;
    } else if (round.miniId === "glass") {
      round.glassRow = 0;
      round.glassSafe = [];
      for (let r = 0; r < 8; r++) {
        round.glassSafe.push(Math.random() < 0.5 ? 0 : 1);
      }
      if (round.you) {
        round.you.x = WORLD_W / 2;
        round.you.y = WORLD_H - 80;
      }
    } else if (round.miniId === "mingle") {
      round.mingleTarget = 2 + Math.floor(Math.random() * 4);
      round.mingleTimer = 200;
    }

    document.getElementById("glass-picks")?.classList.toggle("hidden", round.miniId !== "glass");
    updateHud();
  }

  function eliminate(p, reason) {
    if (!p.alive) return;
    p.alive = false;
    showToast(`${p.name} eliminated! ${reason || ""}`);
    updateHud();
    if (p.id === "you") {
      showToast("You were eliminated! Bots continue…");
    }
    if (alivePlayers().length <= 1) {
      setTimeout(endMiniGame, 800);
    }
  }

  function endMiniGame() {
    document.getElementById("glass-picks")?.classList.add("hidden");
    const alive = alivePlayers();
    if (alive.length === 1) {
      alive[0].roundWins = (alive[0].roundWins || 0) + 1;
      if (alive[0].id === "you") {
        state.wins++;
        saveState();
        showToast("🏆 YOU WIN THE ROUND!");
      } else {
        showToast(`${alive[0].name} wins the round!`);
      }
      state.rounds++;
      saveState();
      round.miniIndex = 0;
      reviveAllForNewRound();
      scheduleNextMini();
      return;
    }
    if (round.miniIndex >= MINIGAMES.length) {
      const top = [...round.players].sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0));
      showToast(`Round over — ${top.filter((p) => p.alive).length} survivors`);
      round.miniIndex = 0;
    }
    scheduleNextMini();
  }

  function reviveAllForNewRound() {
    round.players.forEach((p) => {
      p.alive = true;
      p.x = 200 + Math.random() * 600;
      p.y = 200 + Math.random() * 400;
    });
  }

  function endRound() {
    const alive = alivePlayers()[0];
    if (alive && alive.id === "you") {
      state.wins++;
      saveState();
    }
    showToast(alive ? `${alive.name} is the champion!` : "Round complete!");
    round.phase = "lobby";
    updateHud();
    scheduleNextMini();
  }

  function updateMiniGame() {
    if (round.phase !== "minigame") return;

    round.miniTimer--;
    if (round.miniTimer <= 0) {
      if (round.miniId === "balloon") {
        alivePlayers().forEach((p) => {
          if (p.hasBalloon) eliminate(p, "🎈 No balloon!");
        });
      }
      endMiniGame();
      return;
    }

    if (round.miniId === "redlight") {
      round.lightTimer--;
      if (round.lightTimer <= 0) {
        round.light = round.light === "green" ? "red" : "green";
        round.lightTimer = round.light === "green" ? 90 + Math.random() * 60 : 45 + Math.random() * 40;
        if (round.light === "red") showToast("🔴 RED LIGHT!");
        else showToast("🟢 GREEN LIGHT!");
      }
      alivePlayers().forEach((p) => {
        if (round.light === "red" && p.moving && p.id !== "you") eliminate(p, "🚦 Moved!");
        if (round.light === "red" && p.moving && p.id === "you") eliminate(p, "🚦 You moved!");
        if (round.light === "red") p.frozen = true;
        else p.frozen = false;
      });
    }

    if (round.miniId === "potato" && round.potatoHolder) {
      round.potatoTimer--;
      if (round.potatoTimer <= 0) {
        eliminate(round.potatoHolder, "🥔 Boom!");
        round.potatoHolder = rand(alivePlayers());
        round.potatoTimer = 120 + Math.random() * 80;
      }
      alivePlayers().forEach((a) => {
        alivePlayers().forEach((b) => {
          if (a !== b && dist(a, b) < 36 && round.potatoHolder === a) {
            round.potatoHolder = b;
            round.potatoTimer = 90;
          }
        });
      });
    }

    if (round.miniId === "balloon") {
      alivePlayers().forEach((p) => {
        if (!p.hasBalloon) return;
        if (Math.random() < 0.002) {
          p.hasBalloon = false;
          showToast(`${p.name} popped a balloon!`);
        }
      });
    }

    const actionBtn = document.getElementById("action-btn");
    if (actionBtn) {
      actionBtn.classList.toggle("hidden", round.miniId !== "balloon" || round.phase !== "minigame" || !round.you?.alive);
      if (round.miniId === "balloon" && round.phase === "minigame") actionBtn.textContent = "🎈 Pop!";
    }

    if (round.miniId === "mingle") {
      round.mingleTimer--;
      if (round.mingleTimer <= 0) {
        const zones = getMingleZones();
        alivePlayers().forEach((p) => {
          let ok = false;
          zones.forEach((z, zi) => {
            if (zi + 1 === round.mingleTarget && dist(p, z) < z.r + 20) ok = true;
          });
          if (!ok) eliminate(p, "💃 Wrong zone!");
        });
        round.mingleTarget = 2 + Math.floor(Math.random() * 5);
        round.mingleTimer = 180;
        showToast(`Mingle in groups of ${round.mingleTarget}!`);
      }
    }
  }

  function getMingleZones() {
    return [
      { x: 250, y: 250, r: 55 },
      { x: 550, y: 250, r: 55 },
      { x: 850, y: 250, r: 55 },
      { x: 250, y: 500, r: 55 },
      { x: 550, y: 500, r: 55 },
      { x: 850, y: 500, r: 55 },
    ];
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function updateBots() {
    alivePlayers()
      .filter((p) => p.isBot)
      .forEach((p) => {
        p.botTimer--;
        if (p.botTimer > 0) return;
        p.botTimer = 15 + Math.floor(Math.random() * 25);

        if (round.miniId === "redlight" && round.light === "red") return;

        let tx = p.x + (Math.random() - 0.5) * 80;
        let ty = p.y + (Math.random() - 0.5) * 80;

        if (round.miniId === "mingle") {
          const zones = getMingleZones();
          const z = zones[(round.mingleTarget - 1) % zones.length];
          tx = z.x + (Math.random() - 0.5) * 40;
          ty = z.y + (Math.random() - 0.5) * 40;
        }
        if (round.miniId === "glass") {
          tx = WORLD_W / 2 + (Math.random() < 0.5 ? -60 : 60);
          ty = p.y - 30;
        }

        moveEntity(p, clamp(tx - p.x, -SPEED, SPEED), clamp(ty - p.y, -SPEED, SPEED));
      });
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function moveEntity(ent, mdx, mdy) {
    const moving = Math.abs(mdx) + Math.abs(mdy) > 0.05;
    ent.moving = moving;
    if (moving && !ent.frozen) {
      if (Math.abs(mdx) >= Math.abs(mdy)) ent.facing = mdx >= 0 ? 1 : -1;
      ent.walkPhase = (ent.walkPhase || 0) + 0.14;
    }
    if (ent.frozen && round.miniId === "redlight") return;
    const nx = clamp(ent.x + mdx, PLAYER_R, WORLD_W - PLAYER_R);
    const ny = clamp(ent.y + mdy, PLAYER_R, WORLD_H - PLAYER_R);
    ent.x = nx;
    ent.y = ny;
  }

  function getMoveInput() {
    let dx = joy.dx;
    let dy = joy.dy;
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

  function pickGlass(side) {
    if (round.miniId !== "glass" || !round.you?.alive) return;
    const safe = round.glassSafe[round.glassRow];
    if (safe !== side) {
      eliminate(round.you, "🌉 Cracked glass!");
      return;
    }
    round.glassRow++;
    round.you.y -= 70;
    showToast(`Row ${round.glassRow} — keep going!`);
    if (round.glassRow >= round.glassSafe.length) {
      showToast("🌉 Bridge cleared!");
      endMiniGame();
    }
  }

  function popBalloon() {
    if (round.miniId !== "balloon" || !round.you?.alive) return;
    if (round.you.hasBalloon) {
      round.you.hasBalloon = false;
      showToast("You popped your balloon — safe!");
    }
  }

  function tick() {
    if (!playing) return;
    animT += 0.016;
    updateMiniGame();
    if (round.you?.alive) {
      const m = getMoveInput();
      moveEntity(round.you, m.dx, m.dy);
    }
    updateBots();
    if (round.you) {
      cam.x += (round.you.x - cam.x) * 0.08;
      cam.y += (round.you.y - cam.y) * 0.08;
    }
    updateHud();
    draw();
    requestAnimationFrame(tick);
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    SigmaSprites.drawSky(ctx, w, h);
    SigmaSprites.drawArenaFloor(ctx, w, h, cam.x, cam.y, animT);

    if (round.miniId === "redlight" && round.phase === "minigame") {
      SigmaSprites.drawLightBanner(ctx, w, round.light, round.light === "red" ? "RED LIGHT!" : "GREEN LIGHT!");
    }

    if (round.miniId === "mingle" && round.phase === "minigame") {
      getMingleZones().forEach((z, i) => {
        SigmaSprites.drawMingleZone(
          ctx,
          z.x - cam.x,
          z.y - cam.y,
          z.r,
          i + 1,
          i + 1 === round.mingleTarget
        );
      });
    }

    if (round.miniId === "glass" && round.phase === "minigame") {
      for (let r = 0; r < round.glassSafe.length; r++) {
        [-70, 70].forEach((off, side) => {
          const gx = WORLD_W / 2 + off - cam.x;
          const gy = WORLD_H - 80 - r * 70 - cam.y;
          SigmaSprites.drawGlassPanel(ctx, gx - 35, gy - 20, 70, 40, round.glassSafe[r] === side, r < round.glassRow);
        });
      }
    }

    SigmaSprites.drawDoll(ctx, WORLD_W - 80 - cam.x, 60 - cam.y, 1.2, animT);

    round.players.forEach((p) => {
      if (!p.alive && round.phase === "minigame") return;
      const sx = p.x - cam.x;
      const sy = p.y - cam.y;
      if (sx < -50 || sy < -50 || sx > w + 50 || sy > h + 50) return;
      SigmaSprites.drawPlayer(ctx, sx, sy, 0.9, p.style, p.facing, animT + (p.id.length || 0), {
        dead: !p.alive,
        frozen: p.frozen,
        walking: p.moving,
      });
      if (round.miniId === "potato" && round.potatoHolder === p) {
        SigmaSprites.drawPotato(ctx, sx, sy - 36, animT, true);
      }
      if (round.miniId === "balloon" && p.hasBalloon && p.alive) {
        SigmaSprites.drawBalloon(ctx, sx + 20, sy - 30, p.color === "gold" ? "#ffd54f" : "#ef5350", animT);
      }
      ctx.font = "600 9px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#111";
      ctx.fillText(p.name.slice(0, 8), sx, sy - 32);
    });

    remotePlayers.forEach((rp, i) => {
      SigmaSprites.drawPlayer(ctx, rp.x - cam.x, rp.y - cam.y, 0.85, rp.style, 1, animT + i, {});
    });
  }

  function resize() {
    const wrap = document.getElementById("game-wrap");
    if (!wrap || !canvas) return;
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function setupJoystick() {
    const base = document.getElementById("joystick-base");
    const knob = document.getElementById("joystick-knob");
    if (!base || !knob) return;
    let pid = null;
    base.addEventListener("pointerdown", (e) => {
      pid = e.pointerId;
      base.setPointerCapture(pid);
    });
    base.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
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
      joy.dx = dx / max;
      joy.dy = dy / max;
    });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      joy.dx = 0;
      joy.dy = 0;
      knob.style.transform = "translate(-50%, -50%)";
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    document.getElementById("play-btn")?.addEventListener("click", () => {
      const name = document.getElementById("name-input")?.value.trim() || "Player";
      const style = document.querySelector(".style-pick.selected")?.dataset.style || "cute";
      startRound(name, style);
      tick();
    });

    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".style-pick").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    document.getElementById("action-btn")?.addEventListener("click", popBalloon);
    document.getElementById("glass-left")?.addEventListener("click", () => pickGlass(0));
    document.getElementById("glass-right")?.addEventListener("click", () => pickGlass(1));

    document.getElementById("settings-btn")?.addEventListener("click", () => {
      document.getElementById("settings-overlay")?.classList.remove("hidden");
    });
    document.getElementById("close-settings-btn")?.addEventListener("click", () => {
      document.getElementById("settings-overlay")?.classList.add("hidden");
    });
    document.getElementById("leave-game-btn")?.addEventListener("click", () => {
      playing = false;
      if (window.GameMP) GameMP.stop();
      window.location.href = "../../index.html";
    });

    setupJoystick();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", (e) => {
      keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    if (C.branding?.title) {
      const h1 = document.querySelector("#start-overlay h1");
      if (h1) h1.textContent = C.branding.title;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
