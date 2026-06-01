(function () {
  "use strict";

  const C = window.GAME_CONFIG;
  if (!C) throw new Error("GAME_CONFIG required");

  const SAVE_KEY = C.saveKey || "battlegrounds";
  const VARIANT = C.variant || "arena";
  const WORLD_W = 960;
  const WORLD_H = 720;
  const PLAYER_R = 20;
  const SPEED = 3.2;
  const BOT_COUNT = 7;
  const HILL = { x: 480, y: 360, r: 70 };
  const HILL_WIN = C.hillWinTime || 30;
  const BOT_NAMES = ["Tank", "Blade", "Nova", "Rex", "Viper", "Bolt", "Ash"];

  const SKILLS = C.skills || [
    { id: "dash", name: "Dash", emoji: "💨", unlockLv: 2, cooldown: 120, dmg: 0 },
    { id: "shield", name: "Shield", emoji: "🛡️", unlockLv: 4, cooldown: 200, duration: 90 },
    { id: "power", name: "Power Strike", emoji: "💥", unlockLv: 6, cooldown: 150, dmg: 35 },
  ];

  let canvas, ctx, w, h;
  let playing = false;
  let animT = 0;
  let joy = { dx: 0, dy: 0 };
  let keys = {};
  let cam = { x: 480, y: 360 };
  let remotePlayers = [];
  let toastTimer = 0;
  let xpOrbs = [];

  let you = null;
  let fighters = [];
  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
    } catch (_) {}
    return defaultState();
  }

  function defaultState() {
    return {
      name: "Player",
      style: "cute",
      level: 1,
      xp: 0,
      kills: 0,
      ownedSkills: [],
      upgrades: [],
    };
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function xpToLevel(lv) {
    return 40 + lv * 25;
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
    toastTimer = setTimeout(() => el.classList.add("hidden"), 2400);
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

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function addXp(amount) {
    state.xp += amount;
    while (state.xp >= xpToLevel(state.level)) {
      state.xp -= xpToLevel(state.level);
      state.level++;
      showToast(`Level up! Lv ${state.level} 🎉`);
      SKILLS.forEach((sk) => {
        if (sk.unlockLv <= state.level && !state.ownedSkills.includes(sk.id)) {
          state.ownedSkills.push(sk.id);
          showToast(`Unlocked ${sk.emoji} ${sk.name}!`);
        }
      });
      renderSkillsPanel();
    }
    saveState();
    updateHud();
  }

  function updateHud() {
    const elL = document.getElementById("level-display");
    const elE = document.getElementById("exp-display");
    const elK = document.getElementById("kills-display");
    const elH = document.getElementById("hill-display");
    if (elL) elL.textContent = `Lv ${state.level}`;
    if (elE) elE.textContent = `✨ ${state.xp}/${xpToLevel(state.level)}`;
    if (elK) elK.textContent = `💀 ${state.kills}`;
    if (elH) {
      if (VARIANT === "koth" && you) {
        elH.classList.remove("hidden");
        elH.textContent = `👑 ${Math.floor(you.hillTime || 0)}s / ${HILL_WIN}s`;
      } else {
        elH?.classList.add("hidden");
      }
    }
    renderLeaderboard();
  }

  function renderLeaderboard() {
    const lb = document.getElementById("leaderboard");
    if (!lb || !playing) return;
    const all = [
      { name: state.name, score: state.kills * 100 + state.level * 50, you: true },
      ...fighters.filter((f) => f.isBot).map((f) => ({ name: f.name, score: f.kills * 100 + f.level * 30 })),
    ];
    all.sort((a, b) => b.score - a.score);
    lb.innerHTML = `<h3>${ui("leaderboardTitle")}</h3><ol>${all
      .slice(0, 8)
      .map((p, i) => `<li>${i + 1}. ${p.name.slice(0, 9)}${p.you ? " (you)" : ""}</li>`)
      .join("")}</ol>`;
    lb.classList.remove("hidden");
  }

  function renderSkillsPanel() {
    const panel = document.getElementById("skills-panel");
    if (!panel) return;
    panel.classList.remove("hidden");
    panel.innerHTML = "<b>Skills</b><br>" +
      SKILLS.map((sk) => {
        const owned = state.ownedSkills.includes(sk.id);
        return `${owned ? sk.emoji : "🔒"} ${sk.name} (Lv${sk.unlockLv})`;
      }).join("<br>");
  }

  function startGame(playerName, style) {
    state.name = playerName || state.name;
    state.style = style || state.style;
    saveState();

    const colors = shuffle(Object.keys(BGSprites.STYLES));
    fighters = [];
    you = {
      id: "you",
      name: state.name,
      style: state.style,
      x: 200,
      y: 200,
      hp: 100 + state.level * 5,
      maxHp: 100 + state.level * 5,
      facing: 1,
      atkCd: 0,
      skillCd: 0,
      shieldT: 0,
      hillTime: 0,
      kills: state.kills,
      level: state.level,
      isBot: false,
    };
    fighters.push(you);

    for (let i = 0; i < BOT_COUNT; i++) {
      fighters.push({
        id: "bot-" + i,
        name: BOT_NAMES[i],
        style: colors[i % colors.length],
        x: 300 + Math.random() * 400,
        y: 200 + Math.random() * 300,
        hp: 80 + i * 5,
        maxHp: 80 + i * 5,
        facing: 1,
        atkCd: 0,
        skillCd: 0,
        shieldT: 0,
        hillTime: 0,
        kills: Math.floor(Math.random() * 5),
        level: 1 + Math.floor(Math.random() * 4),
        isBot: true,
        botTimer: 0,
      });
    }

    xpOrbs = [];
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("app").classList.add("playing");
    document.getElementById("attack-btn")?.classList.remove("hidden");
    document.getElementById("skill-btn")?.classList.remove("hidden");
    document.getElementById("upgrade-btn")?.classList.remove("hidden");

    playing = true;
    showToast(VARIANT === "koth" ? "Hold the hill to win!" : "Defeat everyone in the arena!");
    renderSkillsPanel();
    updateHud();

    if (window.GameMP) {
      GameMP.init({
        game: C.mpGame || SAVE_KEY,
        subroom: VARIANT,
        getName: () => state.name,
        getState: () => ({ x: you.x, y: you.y, style: state.style, hp: you.hp, level: state.level }),
        onPeers: (peers) => {
          remotePlayers = peers.map((p) => ({
            name: p.name,
            x: p.state?.x || 400,
            y: p.state?.y || 300,
            style: p.state?.style || "cool",
            hp: p.state?.hp || 100,
            maxHp: 100,
          }));
        },
      });
      GameMP.start();
    }

    tick();
  }

  function meleeAttack(attacker) {
    if (attacker.atkCd > 0) return;
    attacker.atkCd = 25;
    attacker.attacking = 12;
    const range = 42;
    const dmg = 12 + (attacker.level || 1) * 2 + (attacker === you ? state.level : 0);

    fighters.forEach((f) => {
      if (f === attacker || f.hp <= 0) return;
      if (dist(attacker, f) < range) {
        if (f.shieldT > 0) {
          showToast(`${f.name} blocked!`);
          return;
        }
        f.hp -= dmg;
        if (f.hp <= 0) {
          f.hp = 0;
          if (attacker === you || attacker.id === "you") {
            state.kills++;
            addXp(25);
            showToast(`KO! +25 XP`);
          }
          if (f === you) {
            showToast("You were defeated! Respawning…");
            setTimeout(() => respawn(you), 1500);
          } else {
            xpOrbs.push({ x: f.x, y: f.y, amt: 15, life: 300 });
            setTimeout(() => respawn(f), 2000);
          }
        }
      }
    });
  }

  function useSkill() {
    if (!you || you.skillCd > 0) return;
    const sk = SKILLS.find((s) => state.ownedSkills.includes(s.id) && s.id === "power") ||
      SKILLS.find((s) => state.ownedSkills.includes(s.id));
    if (!sk) {
      showToast("Unlock skills by leveling up!");
      return;
    }
    you.skillCd = sk.cooldown || 120;
    if (sk.id === "dash") {
      you.x += you.facing * 80;
      you.x = Math.max(PLAYER_R, Math.min(WORLD_W - PLAYER_R, you.x));
      showToast("💨 Dash!");
    } else if (sk.id === "shield") {
      you.shieldT = sk.duration || 90;
      showToast("🛡️ Shield up!");
    } else if (sk.id === "power") {
      fighters.forEach((f) => {
        if (f !== you && f.hp > 0 && dist(you, f) < 90) {
          f.hp -= sk.dmg || 35;
          if (f.hp <= 0 && f.isBot) {
            state.kills++;
            addXp(30);
            setTimeout(() => respawn(f), 2000);
          }
        }
      });
      showToast("💥 Power Strike!");
    }
    updateSkillBtn();
  }

  function updateSkillBtn() {
    const btn = document.getElementById("skill-btn");
    if (!btn || !you) return;
    btn.classList.toggle("cooldown", you.skillCd > 0);
    btn.textContent = you.skillCd > 0 ? `⏳ ${Math.ceil(you.skillCd / 60)}s` : ui("skillBtn", { emoji: "💥" }) || "💥 Skill";
  }

  function respawn(f) {
    f.hp = f.maxHp;
    f.x = 100 + Math.random() * (WORLD_W - 200);
    f.y = 100 + Math.random() * (WORLD_H - 200);
  }

  function updateKoth() {
    if (VARIANT !== "koth" || !you) return;
    fighters.forEach((f) => {
      if (f.hp <= 0) return;
      if (dist(f, HILL) < HILL.r) {
        f.hillTime = (f.hillTime || 0) + 1 / 60;
        if (f === you && f.hillTime >= HILL_WIN) {
          showToast("👑 YOU CAPTURED THE HILL!");
          state.kills++;
          saveState();
          f.hillTime = 0;
        }
      }
    });
  }

  function updateBots() {
    fighters
      .filter((f) => f.isBot && f.hp > 0)
      .forEach((f) => {
        f.botTimer--;
        if (f.botTimer > 0) return;
        f.botTimer = 20 + Math.random() * 30;
        let tx = you?.x || 480;
        let ty = you?.y || 360;
        if (VARIANT === "koth") {
          tx = HILL.x + (Math.random() - 0.5) * 40;
          ty = HILL.y + (Math.random() - 0.5) * 40;
        } else {
          tx += (Math.random() - 0.5) * 200;
          ty += (Math.random() - 0.5) * 200;
        }
        const mdx = clamp(tx - f.x, -SPEED, SPEED);
        const mdy = clamp(ty - f.y, -SPEED, SPEED);
        f.x = clamp(f.x + mdx, PLAYER_R, WORLD_W - PLAYER_R);
        f.y = clamp(f.y + mdy, PLAYER_R, WORLD_H - PLAYER_R);
        if (you && dist(f, you) < 50 && Math.random() < 0.4) meleeAttack(f);
      });
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
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

  function tick() {
    if (!playing) return;
    animT += 0.016;

    fighters.forEach((f) => {
      if (f.atkCd > 0) f.atkCd--;
      if (f.skillCd > 0) f.skillCd--;
      if (f.shieldT > 0) f.shieldT--;
      if (f.attacking > 0) f.attacking--;
    });

    if (you?.hp > 0) {
      const m = getMoveInput();
      you.x = clamp(you.x + m.dx, PLAYER_R, WORLD_W - PLAYER_R);
      you.y = clamp(you.y + m.dy, PLAYER_R, WORLD_H - PLAYER_R);
      if (Math.abs(m.dx) > 0.1) you.facing = m.dx >= 0 ? 1 : -1;
    }

    updateBots();
    updateKoth();

    xpOrbs = xpOrbs.filter((o) => {
      o.life--;
      if (you && dist(you, o) < 24) {
        addXp(o.amt);
        return false;
      }
      return o.life > 0;
    });

    cam.x += ((you?.x || 480) - cam.x) * 0.1;
    cam.y += ((you?.y || 360) - cam.y) * 0.1;
    updateHud();
    updateSkillBtn();
    draw();
    requestAnimationFrame(tick);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    BGSprites.drawArena(ctx, w, h, cam.x, cam.y, VARIANT);

    xpOrbs.forEach((o) => {
      BGSprites.drawXpOrb(ctx, o.x - cam.x, o.y - cam.y, animT);
    });

    fighters.forEach((f) => {
      if (f.hp <= 0) return;
      BGSprites.drawFighter(ctx, f.x - cam.x, f.y - cam.y, 0.95, f.style, f.facing, animT, {
        hp: f.hp,
        maxHp: f.maxHp,
        shield: f.shieldT > 0,
        attacking: f.attacking > 0,
      });
      ctx.font = "600 9px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.strokeText(f.name.slice(0, 9), f.x - cam.x, f.y - cam.y - 48);
      ctx.fillText(f.name.slice(0, 9), f.x - cam.x, f.y - cam.y - 48);
    });

    remotePlayers.forEach((rp, i) => {
      BGSprites.drawFighter(ctx, rp.x - cam.x, rp.y - cam.y, 0.85, rp.style, 1, animT + i, {
        hp: rp.hp,
        maxHp: rp.maxHp,
      });
    });
  }

  function renderUpgradeList() {
    const list = document.getElementById("upgrade-list");
    if (!list) return;
    const gear = C.gear || [];
    list.innerHTML = gear
      .map((g) => {
        const owned = state.upgrades.includes(g.id);
        const canBuy = !owned && state.level * 10 >= (g.cost || 50) / 5;
        return `<div class="upgrade-item ${owned ? "owned" : ""}">
          <span>${g.emoji} ${g.name}<br><small>${g.desc}</small></span>
          <button data-id="${g.id}" ${owned ? "disabled" : ""}>${owned ? "Owned" : g.cost + " XP"}</button>
        </div>`;
      })
      .join("");
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const g = gear.find((x) => x.id === id);
        if (!g || state.upgrades.includes(id)) return;
        if (state.xp >= (g.cost || 50)) {
          state.xp -= g.cost || 50;
          state.upgrades.push(id);
          if (g.hp) {
            you.maxHp += g.hp;
            you.hp += g.hp;
          }
          saveState();
          showToast(ui("bought", { name: g.name, emoji: g.emoji }));
          renderUpgradeList();
          updateHud();
        } else showToast("Need more XP!");
      });
    });
  }

  function resize() {
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

    document.getElementById("attack-btn")?.addEventListener("click", () => you && meleeAttack(you));
    document.getElementById("skill-btn")?.addEventListener("click", useSkill);
    document.getElementById("upgrade-btn")?.addEventListener("click", () => {
      renderUpgradeList();
      document.getElementById("upgrade-overlay")?.classList.remove("hidden");
    });
    document.getElementById("upgrade-close-btn")?.addEventListener("click", () => {
      document.getElementById("upgrade-overlay")?.classList.add("hidden");
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

    setupJoystick();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", (e) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === " ") you && meleeAttack(you);
    });
    window.addEventListener("keyup", (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    SKILLS.forEach((sk) => {
      if (state.level >= sk.unlockLv) state.ownedSkills.push(sk.id);
    });
    state.ownedSkills = [...new Set(state.ownedSkills)];
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
