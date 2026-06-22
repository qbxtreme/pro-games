(function () {
  "use strict";

  const C = window.GAME_CONFIG;
  if (!C) throw new Error("GAME_CONFIG required");

  const SAVE_KEY = C.saveKey || "gunr-io";
  const VARIANT = C.variant || "gunr-io";
  const WORLD_W = 1000;
  const WORLD_H = 800;
  const PLAYER_R = 18;
  const MOVE_SPEED = 3.4;
  const BOT_COUNT = 8;
  const BOT_NAMES = ["Sniper", "Rush", "Camper", "Ace", "Ghost", "Tank", "Flash", "Hawk"];

  const DEFAULT_WEAPONS = [
    { id: "pistol", name: "Pistol", emoji: "🔫", dmg: 8, rate: 18, speed: 9, len: 14, spread: 0.08 },
    { id: "smg", name: "SMG", emoji: "🔫", dmg: 6, rate: 8, speed: 10, len: 16, spread: 0.12 },
    { id: "rifle", name: "Rifle", emoji: "🎯", dmg: 14, rate: 22, speed: 12, len: 22, spread: 0.04 },
    { id: "shotgun", name: "Shotgun", emoji: "💥", dmg: 7, rate: 35, speed: 8, len: 12, spread: 0.35, pellets: 5 },
    { id: "sniper", name: "Sniper", emoji: "🎯", dmg: 45, rate: 55, speed: 16, len: 28, spread: 0.01 },
    { id: "rocket", name: "Rocket", emoji: "🚀", dmg: 55, rate: 70, speed: 7, len: 20, spread: 0.05, blast: 50 },
    { id: "laser", name: "Laser", emoji: "⚡", dmg: 10, rate: 6, speed: 14, len: 18, spread: 0.02 },
    { id: "golden", name: "Golden Gun", emoji: "👑", dmg: 99, rate: 25, speed: 12, len: 20, spread: 0 },
  ];

  const WEAPONS = C.weaponTiers || DEFAULT_WEAPONS;

  let canvas, ctx, w, h;
  let playing = false;
  let animT = 0;
  let moveJoy = { dx: 0, dy: 0 };
  let aimJoy = { dx: 0, dy: 0 };
  let keys = {};
  let cam = { x: 500, y: 400 };
  let bullets = [];
  let pickups = [];
  let remotePlayers = [];
  let toastTimer = 0;

  let you = null;
  let shooters = [];
  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
    } catch (_) {}
    return defaultState();
  }

  function defaultState() {
    return { name: "Player", style: "cute", kills: 0, deaths: 0, weaponTier: 0, team: "red" };
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

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 2200);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function getWeapon(idx) {
    return WEAPONS[Math.min(idx, WEAPONS.length - 1)] || WEAPONS[0];
  }

  function updateHud() {
    const wEl = document.getElementById("weapon-display");
    const kEl = document.getElementById("kills-display");
    const sEl = document.getElementById("score-display");
    const weapon = you ? getWeapon(you.weaponTier) : WEAPONS[0];
    if (wEl && you) wEl.textContent = `${weapon.emoji} ${weapon.name}`;
    if (kEl) kEl.textContent = `💀 ${state.kills}`;
    if (sEl) {
      if (VARIANT === "gun-game") {
        sEl.textContent = `🎯 ${you ? you.weaponTier + 1 : 1}/${WEAPONS.length}`;
      } else {
        sEl.textContent = `⭐ ${state.kills * 10}`;
      }
    }
    renderLeaderboard();
  }

  function renderLeaderboard() {
    const lb = document.getElementById("leaderboard");
    if (!lb || !playing) return;
    const rows = [
      { name: state.name, kills: state.kills, you: true },
      ...shooters.filter((s) => s.isBot).map((s) => ({ name: s.name, kills: s.kills })),
    ].sort((a, b) => b.kills - a.kills);
    lb.innerHTML = `<h3>${ui("leaderboardTitle")}</h3><ol>${rows
      .slice(0, 8)
      .map((r, i) => `<li>${i + 1}. ${r.name.slice(0, 9)} (${r.kills})${r.you ? " ★" : ""}</li>`)
      .join("")}</ol>`;
    lb.classList.remove("hidden");
  }

  function spawnPickups() {
    if (VARIANT === "gunr-io" && pickups.length < 4 && Math.random() < 0.01) {
      pickups.push({
        x: 80 + Math.random() * (WORLD_W - 160),
        y: 80 + Math.random() * (WORLD_H - 160),
        tier: Math.floor(Math.random() * Math.min(4, WEAPONS.length)),
      });
    }
  }

  function startGame(playerName, style) {
    state.name = playerName || state.name;
    state.style = style || state.style;
    saveState();

    bullets = [];
    pickups = [];
    const colors = shuffle(Object.keys(ShooterSprites.STYLES));
    shooters = [];

    you = {
      id: "you",
      name: state.name,
      style: state.style,
      team: state.team || "red",
      x: VARIANT === "banner" ? 150 : 500,
      y: 400,
      hp: 100,
      maxHp: 100,
      weaponTier: VARIANT === "gun-game" ? 0 : 1,
      fireCd: 0,
      angle: 0,
      kills: state.kills,
      isBot: false,
    };
    shooters.push(you);

    for (let i = 0; i < BOT_COUNT; i++) {
      shooters.push({
        id: "bot-" + i,
        name: BOT_NAMES[i],
        style: colors[i % colors.length],
        team: i % 2 === 0 ? "blue" : "red",
        x: 200 + Math.random() * 600,
        y: 100 + Math.random() * 600,
        hp: 100,
        maxHp: 100,
        weaponTier: Math.floor(Math.random() * 3),
        fireCd: 0,
        angle: Math.random() * Math.PI * 2,
        kills: Math.floor(Math.random() * 8),
        isBot: true,
        botTimer: 0,
      });
    }

    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("app").classList.add("playing");
    const fireBtn = document.getElementById("fire-btn");
    if (fireBtn) fireBtn.classList.remove("hidden");
    playing = true;
    showToast(
      VARIANT === "gun-game"
        ? "Get a kill to upgrade your gun!"
        : VARIANT === "banner"
          ? "Capture the enemy banner!"
          : "Outgun everyone!"
    );
    updateHud();

    if (window.GameMP) {
      GameMP.init({
        game: C.mpGame || SAVE_KEY,
        subroom: VARIANT,
        getName: () => state.name,
        getState: () => ({
          x: you.x,
          y: you.y,
          style: state.style,
          hp: you.hp,
          tier: you.weaponTier,
        }),
        onPeers: (peers) => {
          remotePlayers = peers.map((p) => ({
            name: p.name,
            x: p.state?.x || 500,
            y: p.state?.y || 400,
            style: p.state?.style || "cool",
            hp: p.state?.hp ?? 100,
            tier: p.state?.tier ?? 0,
          }));
        },
      });
      GameMP.start();
    }

    tick();
  }

  function fire(shooter) {
    const w = getWeapon(shooter.weaponTier);
    if (shooter.fireCd > 0) return;
    shooter.fireCd = w.rate;

    let ax = aimJoy.dx;
    let ay = aimJoy.dy;
    if (shooter === you && Math.abs(ax) + Math.abs(ay) < 0.15) {
      let nearest = null;
      let best = 9999;
      shooters.forEach((t) => {
        if (t === shooter || t.hp <= 0) return;
        if (VARIANT === "banner" && t.team === shooter.team) return;
        const d = dist(shooter, t);
        if (d < best) {
          best = d;
          nearest = t;
        }
      });
      if (nearest) {
        ax = nearest.x - shooter.x;
        ay = nearest.y - shooter.y;
      } else {
        ax = shooter.facing || 1;
        ay = 0;
      }
    }
    if (shooter.isBot) {
      if (you && you.hp > 0) {
        ax = you.x - shooter.x;
        ay = you.y - shooter.y;
      }
    }
    const len = Math.hypot(ax, ay) || 1;
    shooter.angle = Math.atan2(ay, ax);
    const count = w.pellets || 1;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * (w.spread || 0.1);
      const ang = shooter.angle + spread;
      bullets.push({
        x: shooter.x + Math.cos(ang) * 20,
        y: shooter.y + Math.sin(ang) * 20,
        vx: Math.cos(ang) * w.speed,
        vy: Math.sin(ang) * w.speed,
        dmg: w.dmg,
        owner: shooter.id,
        team: shooter.team,
        blast: w.blast || 0,
        life: 120,
      });
    }
  }

  function onKill(killer) {
    if (killer.id === "you") {
      state.kills++;
      if (VARIANT === "gun-game" && killer.weaponTier < WEAPONS.length - 1) {
        killer.weaponTier++;
        showToast(`Gun up! ${getWeapon(killer.weaponTier).name}`);
      }
      if (VARIANT === "gun-game" && killer.weaponTier >= WEAPONS.length - 1) {
        showToast("👑 GOLDEN GUN — YOU WIN!");
      }
      saveState();
    }
    updateHud();
  }

  function respawn(s) {
    s.hp = s.maxHp;
    s.x = 100 + Math.random() * (WORLD_W - 200);
    s.y = 100 + Math.random() * (WORLD_H - 200);
    if (VARIANT === "gun-game" && s === you) s.weaponTier = 0;
  }

  function updateBullets() {
    bullets = bullets.filter((b) => {
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.x < 0 || b.y < 0 || b.x > WORLD_W || b.y > WORLD_H) return false;

      shooters.forEach((t) => {
        if (t.hp <= 0 || t.id === b.owner) return;
        if (VARIANT === "banner" && t.team === b.team) return;
        if (dist(b, t) < PLAYER_R + 4) {
          t.hp -= b.dmg;
          if (b.blast) {
            shooters.forEach((o) => {
              if (o !== t && dist(b, o) < b.blast) o.hp -= b.dmg * 0.5;
            });
          }
          if (t.hp <= 0) {
            const killer = shooters.find((s) => s.id === b.owner);
            if (killer) {
              killer.kills = (killer.kills || 0) + 1;
              onKill(killer);
            }
            if (t === you) {
              state.deaths++;
              showToast("Respawning…");
              saveState();
            }
            setTimeout(() => respawn(t), 1200);
          }
          return false;
        }
      });
      return b.life > 0;
    });
  }

  function updateBots() {
    shooters
      .filter((s) => s.isBot && s.hp > 0)
      .forEach((s) => {
        s.botTimer--;
        if (s.fireCd > 0) s.fireCd--;
        if (you && you.hp > 0 && dist(s, you) < 320 && s.fireCd <= 0) fire(s);
        if (s.botTimer > 0) return;
        s.botTimer = 15 + Math.random() * 20;
        let tx = you?.x || 500;
        let ty = you?.y || 400;
        if (VARIANT === "banner") {
          tx = s.team === "red" ? WORLD_W - 120 : 120;
          ty = 400;
        }
        s.x += clamp(tx - s.x, -MOVE_SPEED, MOVE_SPEED) * 0.5;
        s.y += clamp(ty - s.y, -MOVE_SPEED, MOVE_SPEED) * 0.5;
      });
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function getMoveInput() {
    let dx = moveJoy.dx;
    let dy = moveJoy.dy;
    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;
    const len = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) + Math.abs(dy) > 0.1) {
      return { dx: (dx / len) * MOVE_SPEED, dy: (dy / len) * MOVE_SPEED };
    }
    return { dx: 0, dy: 0 };
  }

  function tick() {
    if (!playing) return;
    animT += 0.016;

    shooters.forEach((s) => {
      if (s.fireCd > 0) s.fireCd--;
    });

    if (you?.hp > 0) {
      const m = getMoveInput();
      you.x = clamp(you.x + m.dx, PLAYER_R, WORLD_W - PLAYER_R);
      you.y = clamp(you.y + m.dy, PLAYER_R, WORLD_H - PLAYER_R);
      if (Math.abs(m.dx) > 0.1) you.facing = m.dx >= 0 ? 1 : -1;
    }

    spawnPickups();
    updateBots();
    updateBullets();

    pickups = pickups.filter((p) => {
      if (you && dist(you, p) < 30) {
        you.weaponTier = Math.max(you.weaponTier, p.tier);
        showToast(`Picked up ${getWeapon(p.tier).name}!`);
        updateHud();
        return false;
      }
      return true;
    });

    const m = getMoveInput();
    if (window.AllOutCamera) {
      AllOutCamera.followTopLeft(cam, you?.x || 500, you?.y || 400, w, h, 0.016, m.dx, m.dy, 10);
    } else {
      cam.x += ((you?.x || 500) - cam.x) * 0.1;
      cam.y += ((you?.y || 400) - cam.y) * 0.1;
    }
    updateHud();
    draw();
    requestAnimationFrame(tick);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ShooterSprites.drawArena(ctx, w, h, cam.x, cam.y, VARIANT === "banner");

    if (VARIANT === "banner") {
      ShooterSprites.drawBanner(ctx, WORLD_W - 100 - cam.x, 400 - cam.y, "blue", animT);
      ShooterSprites.drawBanner(ctx, 100 - cam.x, 400 - cam.y, "red", animT);
    }

    pickups.forEach((p) => {
      ShooterSprites.drawPickup(ctx, p.x - cam.x, p.y - cam.y, getWeapon(p.tier), animT);
    });

    bullets.forEach((b) => {
      ShooterSprites.drawBullet(ctx, b.x - cam.x, b.y - cam.y, ShooterSprites.WEAPON_COLORS.golden, 4);
    });

    shooters.forEach((s) => {
      if (s.hp <= 0) return;
      ShooterSprites.drawShooter(ctx, s.x - cam.x, s.y - cam.y, 0.95, s.style, s.angle, animT, {
        weapon: getWeapon(s.weaponTier),
        hp: s.hp,
        maxHp: s.maxHp,
      });
      ctx.font = "600 9px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.strokeText(s.name.slice(0, 9), s.x - cam.x, s.y - cam.y - 42);
      ctx.fillText(s.name.slice(0, 9), s.x - cam.x, s.y - cam.y - 42);
    });

    remotePlayers.forEach((rp, i) => {
      ShooterSprites.drawShooter(ctx, rp.x - cam.x, rp.y - cam.y, 0.85, rp.style, 0, animT + i, {
        weapon: getWeapon(rp.tier),
        hp: rp.hp,
        maxHp: 100,
      });
    });
  }

  function setupJoystick(baseId, knobId, store) {
    const base = document.getElementById(baseId);
    const knob = document.getElementById(knobId);
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
      store.dx = dx / max;
      store.dy = dy / max;
    });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      store.dx = 0;
      store.dy = 0;
      knob.style.transform = "translate(-50%, -50%)";
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
  }

  function resize() {
    const wrap = document.getElementById("game-wrap");
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");

    document.getElementById("play-btn")?.addEventListener("click", () => {
      const name = document.getElementById("name-input")?.value.trim() || "Player";
      const style = document.querySelector(".style-pick.selected")?.dataset.style || "cute";
      startGame(name, style);
    });

    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".style-pick").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    document.getElementById("fire-btn")?.addEventListener("click", () => you && fire(you));
    window.addEventListener("keydown", (e) => {
      keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });

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

    setupJoystick("joystick-move", "knob-move", moveJoy);
    setupJoystick("joystick-aim", "knob-aim", aimJoy);
    resize();
    window.addEventListener("resize", resize);

    let holdFire = null;
    canvas?.addEventListener("pointerdown", () => {
      if (!playing || !you) return;
      holdFire = setInterval(() => fire(you), 80);
    });
    canvas?.addEventListener("pointerup", () => clearInterval(holdFire));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
