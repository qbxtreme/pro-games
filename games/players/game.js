(function () {
  "use strict";

  const WORLD_W = 1200;
  const WORLD_H = 900;
  const SPAWN_X = WORLD_W / 2;
  const SPAWN_Y = WORLD_H / 2;
  const SPAWN_R = 72;
  const WALL_PAD = 40;
  const POLL_ONLINE_MS = 2000;
  const VETERAN_RING_MIN = 105;
  const VETERAN_RING_STEP = 72;
  const VETERANS_PER_RING = 10;

  const DEMO_VETERANS = [
    { name: "Trainer", gamesPlayed: ["steal-a-brainrot", "brawl-stars-mod", "dragon-plains", "fishermon"], favoriteGame: "steal-a-brainrot", proLevel: 8, gameCount: 4 },
    { name: "Lifter", gamesPlayed: ["strength-simulator", "steal-a-brainrot"], favoriteGame: "strength-simulator", proLevel: 3, gameCount: 2 },
  ];

  const GAME_LABELS = {
    players: "Players Lobby",
    "steal-a-brainrot": "Steal a BrainRot",
    "dragon-plains": "Dragon Upgrade",
    "hungry-snake-worm": "Snake.io",
    "snake-io": "Snake.io",
    "brawl-stars-mod": "Brawl Stars Mod",
    "mini-brawl-stars": "Mini Brawl Stars",
    "ranked-battling": "Ranked Battling",
    fishermon: "Fishermon",
    "murder-mystery": "Murder Mystery",
    "mob-battle": "Mob Battle",
    "fat-simulator": "Coco Devouring",
    "steal-a-poop": "Make them step on poo",
    "escape-tsunami-brainrot": "Escape Tsunami for BrainRot",
    "strength-simulator": "Strength Simulator",
  };

  const GAME_EMOJIS = {
    players: "👥",
    "steal-a-brainrot": "🧠",
    "dragon-plains": "🐉",
    "hungry-snake-worm": "🐍",
    "snake-io": "🐍",
    "brawl-stars-mod": "⭐",
    "mini-brawl-stars": "💥",
    "ranked-battling": "🏆",
    fishermon: "🎣",
    "murder-mystery": "🔪",
    "mob-battle": "⚔️",
    "fat-simulator": "🐶",
    "strength-simulator": "💪",
  };

  const PEER_COLORS = ["#ef5350", "#ab47bc", "#ffa726", "#26c6da", "#66bb6a", "#5c6bc0", "#ec407a", "#8d6e63"];
  const LOBBY_PEER_COLOR = "#43a047";

  const WORLD_TO_3D = 0.045;

  let canvas, ctx, wrap;
  let player = { x: SPAWN_X, y: SPAWN_Y, facing: 1 };
  let cam = { x: SPAWN_X, y: SPAWN_Y };
  let moveJoy = { dx: 0, dy: 0 };
  let keys = {};
  let viewW = 800;
  let viewH = 600;
  let canvasDpr = 1;
  let lobbyPeers = [];
  let onlineData = { total: 0, byGame: {}, players: [] };
  let veteranRoster = [];
  let veteranCrowd = [];
  let onlineLive = false;
  let pollTimer = null;
  let animT = 0;

  function playerName() {
    try {
      const n = localStorage.getItem("becomeAProChatName");
      if (n && n.trim()) return n.trim().slice(0, 16);
    } catch (_) {}
    return "Player";
  }

  function gameLabel(id) {
    return GAME_LABELS[id] || id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function gameEmoji(id) {
    return GAME_EMOJIS[id] || "🎮";
  }

  function peerColor(id) {
    let h = 0;
    const s = String(id || "p");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return PEER_COLORS[h % PEER_COLORS.length];
  }

  function layoutVeterans(list) {
    const me = playerName().toLowerCase();
    const liveNames = new Set(
      lobbyPeers.map((p) => (p.name || "").toLowerCase()).filter(Boolean)
    );
    const filtered = list.filter((v) => {
      const n = (v.name || "").toLowerCase();
      return n && n !== me && n !== "player" && !liveNames.has(n);
    });

    return filtered.map((v, i) => {
      const ring = Math.floor(i / VETERANS_PER_RING);
      const idxInRing = i % VETERANS_PER_RING;
      const ringCount = Math.min(VETERANS_PER_RING, filtered.length - ring * VETERANS_PER_RING);
      const angle = (idxInRing / ringCount) * Math.PI * 2 - Math.PI / 2 + ring * 0.35;
      const dist = VETERAN_RING_MIN + ring * VETERAN_RING_STEP;
      return {
        ...v,
        x: SPAWN_X + Math.cos(angle) * dist,
        y: SPAWN_Y + Math.sin(angle) * dist,
        bobPhase: i * 0.65,
        color: peerColor(v.name),
      };
    });
  }

  async function loadVeterans() {
    try {
      const res = await fetch("/api/players/veterans", { cache: "no-store" });
      if (!res.ok) throw new Error("offline");
      const data = await res.json();
      veteranRoster = data.veterans || [];
    } catch (_) {
      veteranRoster = DEMO_VETERANS.slice();
    }
    veteranCrowd = layoutVeterans(veteranRoster);
  }

  function worldToScreen(x, y) {
    const ac = window.AllOutCamera;
    if (ac) return ac.worldToScreen(x, y, cam, viewW, viewH);
    return { x: x - cam.x + viewW / 2, y: y - cam.y + viewH / 2 };
  }

  function camViewOrigin() {
    const ac = window.AllOutCamera;
    if (ac) return ac.camOrigin(cam, viewW, viewH);
    return { x: cam.x - viewW / 2, y: cam.y - viewH / 2 };
  }

  function resize() {
    if (!wrap || !canvas || !ctx) return;
    const rect = wrap.getBoundingClientRect();
    viewW = Math.max(320, Math.floor(rect.width));
    viewH = Math.max(240, Math.floor(rect.height));
    canvasDpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.floor(viewW * canvasDpr));
    canvas.height = Math.max(1, Math.floor(viewH * canvasDpr));
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function drawGrass() {
    const tile = 48;
    const origin = camViewOrigin();
    const startX = Math.floor(origin.x / tile) * tile;
    const startY = Math.floor(origin.y / tile) * tile;
    for (let gy = startY; gy < origin.y + viewH + tile; gy += tile) {
      for (let gx = startX; gx < origin.x + viewW + tile; gx += tile) {
        const s = worldToScreen(gx, gy);
        const alt = ((Math.floor(gx / tile) + Math.floor(gy / tile)) & 1) === 0;
        ctx.fillStyle = alt ? "#7dff7d" : "#32ef32";
        ctx.fillRect(s.x, s.y, tile + 1, tile + 1);
      }
    }
  }

  function drawWalls() {
    const tl = worldToScreen(WALL_PAD, WALL_PAD);
    const br = worldToScreen(WORLD_W - WALL_PAD, WORLD_H - WALL_PAD);
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    const thick = 12;
    ctx.fillStyle = "#424242";
    ctx.fillRect(tl.x - thick, tl.y - thick, w + thick * 2, thick);
    ctx.fillRect(tl.x - thick, br.y, w + thick * 2, thick);
    ctx.fillRect(tl.x - thick, tl.y, thick, h);
    ctx.fillRect(br.x, tl.y, thick, h);
  }

  function drawSpawn() {
    const s = worldToScreen(SPAWN_X, SPAWN_Y);
    const pulse = 1 + Math.sin(animT * 3) * 0.04;
    const r = SPAWN_R * pulse;

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(s.x, s.y, r + 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#78909c";
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#eceff1";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SPAWN", s.x, s.y - 6);
    ctx.font = "600 10px system-ui,sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("You start here", s.x, s.y + 12);
    ctx.restore();

    const onSpawn = Math.hypot(player.x - SPAWN_X, player.y - SPAWN_Y) < SPAWN_R + 20;
    const pill = document.getElementById("lobby-pill");
    if (pill) pill.textContent = onSpawn ? "🟢 At Spawn" : "🚶 Exploring";
  }

  function drawGamePads() {
    const games = Object.keys(onlineData.byGame || {}).filter((g) => g !== "players");
    if (!games.length) return;

    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(games.length))));
    const padW = 140;
    const padH = 56;
    const gap = 24;
    const gridW = cols * padW + (cols - 1) * gap;
    const startX = SPAWN_X - gridW / 2 + padW / 2;
    const startY = SPAWN_Y + SPAWN_R + 80;

    games.slice(0, 12).forEach((gid, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const wx = startX + col * (padW + gap);
      const wy = startY + row * (padH + gap);
      const count = (onlineData.byGame[gid] || []).length;
      const tl = worldToScreen(wx - padW / 2, wy - padH / 2);
      const br = worldToScreen(wx + padW / 2, wy + padH / 2);
      const pw = br.x - tl.x;
      const ph = br.y - tl.y;

      ctx.fillStyle = count > 0 ? "rgba(66, 165, 245, 0.35)" : "rgba(120, 144, 156, 0.28)";
      ctx.fillRect(tl.x, tl.y, pw, ph);
      ctx.strokeStyle = count > 0 ? "#1565c0" : "#546e7a";
      ctx.lineWidth = 2;
      ctx.strokeRect(tl.x, tl.y, pw, ph);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px system-ui,sans-serif";
      ctx.textAlign = "center";
      const title = gameLabel(gid);
      const short = title.length > 16 ? `${title.slice(0, 15)}…` : title;
      ctx.fillText(`${gameEmoji(gid)} ${short}`, tl.x + pw / 2, tl.y + ph / 2 - 4);
      ctx.font = "600 8px system-ui,sans-serif";
      ctx.fillText(`${count} player${count === 1 ? "" : "s"}`, tl.x + pw / 2, tl.y + ph / 2 + 10);
    });
  }

  function drawCharacter(x, y, color, name, opts) {
    opts = opts || {};
    const isYou = !!opts.isYou;
    const bob = opts.bob ? Math.sin(animT * 2.2 + (opts.bobPhase || 0)) * 3 : 0;
    const s = worldToScreen(x, y + bob);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 10, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, isYou ? 16 : 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isYou ? "#fff176" : (opts.veteran ? "#e1bee7" : "#fff");
    ctx.lineWidth = isYou ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = isYou ? "bold 9px system-ui,sans-serif" : "600 8px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, s.x, s.y - 22);
    if (opts.subtitle) {
      ctx.font = "600 7px system-ui,sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fillText(opts.subtitle, s.x, s.y - 12);
    }
    if (isYou) {
      ctx.font = "600 7px system-ui,sans-serif";
      ctx.fillStyle = "#fff176";
      ctx.fillText("YOU", s.x, s.y + 26);
    } else if (opts.veteran && opts.proLevel) {
      ctx.font = "600 6px system-ui,sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(`Pro Lv ${opts.proLevel}`, s.x, s.y + 24);
    }
    ctx.restore();
  }

  function drawGreenDot(x, y) {
    const s = worldToScreen(x, y);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 6, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = LOBBY_PEER_COLOR;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawWorld() {
    ctx.clearRect(0, 0, viewW, viewH);
    drawGrass();
    drawWalls();
    drawGamePads();
    drawSpawn();

    veteranCrowd.forEach((v) => {
      const fav = v.favoriteGame || v.gamesPlayed?.[0];
      const subtitle = fav
        ? `${gameEmoji(fav)} ${gameLabel(fav).slice(0, 14)}`
        : `${v.gameCount || 0} games`;
      drawCharacter(v.x, v.y, v.color, v.name, {
        veteran: true,
        bob: true,
        bobPhase: v.bobPhase,
        subtitle,
        proLevel: v.proLevel,
      });
    });

    lobbyPeers.forEach((p) => {
      const st = p.state || {};
      drawGreenDot(st.x ?? SPAWN_X, st.y ?? SPAWN_Y);
    });
    drawCharacter(player.x, player.y, "#42a5f5", playerName(), { isYou: true });
  }

  function updateRoster() {
    const roster = document.getElementById("game-roster");
    const status = document.getElementById("online-status");
    const pill = document.getElementById("online-pill");
    if (!roster) return;

    const total = onlineData.total || 0;
    if (pill) pill.textContent = `👥 ${total} online`;

    if (!onlineLive) {
      if (status) {
        status.textContent = "Offline — run npm start to see live players";
        status.classList.add("offline");
      }
      roster.innerHTML = '<p class="roster-empty">Start the home server to sync who is playing each game.</p>';
      return;
    }

    if (status) {
      status.textContent = `${total} player${total === 1 ? "" : "s"} across Pro Games`;
      status.classList.remove("offline");
    }

    const gameIds = Object.keys(onlineData.byGame || {}).sort((a, b) => {
      const ca = (onlineData.byGame[b] || []).length;
      const cb = (onlineData.byGame[a] || []).length;
      if (ca !== cb) return ca - cb;
      return gameLabel(a).localeCompare(gameLabel(b));
    });

    if (!gameIds.length) {
      roster.innerHTML = '<p class="roster-empty">No one online yet — open another game in a new tab!</p>';
      return;
    }

    roster.innerHTML = "";
    gameIds.forEach((gid) => {
      const names = onlineData.byGame[gid] || [];
      const block = document.createElement("div");
      block.className = "roster-game";
      block.innerHTML =
        `<div class="roster-game-head">`
        + `<span>${gameEmoji(gid)} ${gameLabel(gid)}</span>`
        + `<span class="roster-game-count">${names.length}</span>`
        + `</div>`
        + `<ul class="roster-names"></ul>`;
      const ul = block.querySelector(".roster-names");
      names.forEach((entry) => {
        const li = document.createElement("li");
        const room = entry.subroom && entry.subroom !== "default" ? ` · ${entry.subroom}` : "";
        li.textContent = `${entry.name || "Player"}${room}`;
        ul.appendChild(li);
      });
      roster.appendChild(block);
    });
  }

  async function pollOnline() {
    try {
      const res = await fetch("/api/mp/online", { cache: "no-store" });
      if (!res.ok) throw new Error("offline");
      onlineData = await res.json();
      onlineLive = true;
    } catch (_) {
      onlineLive = false;
      onlineData = { total: 0, byGame: {}, players: [] };
    }
    updateRoster();
  }

  function gameLoop(ts) {
    animT = ts / 1000;
    let mx = moveJoy.dx;
    let my = moveJoy.dy;
    if (keys.ArrowLeft || keys.a) mx -= 1;
    if (keys.ArrowRight || keys.d) mx += 1;
    if (keys.ArrowUp || keys.w) my -= 1;
    if (keys.ArrowDown || keys.s) my += 1;
    const m = Math.hypot(mx, my);
    const speed = 3.6;
    if (m > 0.12) {
      player.x += (mx / m) * speed;
      player.y += (my / m) * speed;
      player.facing = mx >= 0 ? 1 : -1;
    }
    player.x = Math.max(WALL_PAD + 16, Math.min(WORLD_W - WALL_PAD - 16, player.x));
    player.y = Math.max(WALL_PAD + 16, Math.min(WORLD_H - WALL_PAD - 16, player.y));

    if (window.AllOutCamera) {
      AllOutCamera.follow(cam, player.x, player.y, 0.016, mx, my, 10);
    } else {
      cam.x += (player.x - cam.x) * 0.1;
      cam.y += (player.y - cam.y) * 0.1;
    }

    drawWorld();
    requestAnimationFrame(gameLoop);
  }

  function bindEvents() {
    document.getElementById("hub-btn")?.addEventListener("click", () => {
      if (window.GameMP) GameMP.stop();
      window.location.href = "../../index.html";
    });
    if (typeof AllOutControls !== "undefined") AllOutControls.bindJoystick(moveJoy, keys);
    window.addEventListener("resize", resize);
  }

  function startMultiplayer() {
    if (!window.GameMP) return;
    GameMP.init({
      game: "players",
      subroom: "lobby",
      getName: playerName,
      getState: () => ({
        x: player.x,
        y: player.y,
        facing: player.facing,
        name: playerName(),
      }),
      onPeers: (peers) => {
        lobbyPeers = peers;
        veteranCrowd = layoutVeterans(veteranRoster);
      },
    });
    GameMP.start();
  }

  function cameraConfig3D() {
    const touchDevice = window.matchMedia?.("(pointer: coarse)")?.matches
      || /iPad|iPhone|iPod|Android/i.test(navigator.userAgent || "");
    return window.AllOutCamera?.standard3D({
      fov: touchDevice ? 46 : 42,
      height: touchDevice ? 13 : 12,
      distance: touchDevice ? 12 : 11,
      fogFar: 220,
      lookAtY: 0.55,
      lerp: 0.12,
    }) || {
      style: "fixed", height: 12, distance: 11, fov: 42, fogFar: 220, lookAtY: 0.55, lerp: 0.1,
    };
  }

  function buildWallProps3D() {
    const sx = WORLD_W * WORLD_TO_3D;
    const sy = WORLD_H * WORLD_TO_3D;
    return [
      { id: "wall_n", x: WORLD_W / 2, y: WALL_PAD, model: "wall", scaleX: sx, scaleZ: 1, yLift: 0 },
      { id: "wall_s", x: WORLD_W / 2, y: WORLD_H - WALL_PAD, model: "wall", scaleX: sx, scaleZ: 1, yLift: 0 },
      { id: "wall_w", x: WALL_PAD, y: WORLD_H / 2, model: "wall", rot: Math.PI / 2, scaleX: sy, scaleZ: 1, yLift: 0 },
      { id: "wall_e", x: WORLD_W - WALL_PAD, y: WORLD_H / 2, model: "wall", rot: Math.PI / 2, scaleX: sy, scaleZ: 1, yLift: 0 },
    ];
  }

  function buildGrassProps3D() {
    const props = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + i * 0.21;
      const dist = 160 + (i % 6) * 55;
      props.push({
        id: `grass_${i}`,
        x: SPAWN_X + Math.cos(angle) * dist * 1.15,
        y: SPAWN_Y + Math.sin(angle) * dist * 0.9,
        model: "grass_clump",
        color: i % 2 === 0 ? "#69ff69" : "#32ef32",
        scale: 0.75 + (i % 4) * 0.18,
        yLift: 0,
      });
    }
    for (let i = 0; i < 8; i++) {
      const corner = [
        [WALL_PAD + 80, WALL_PAD + 80],
        [WORLD_W - WALL_PAD - 80, WALL_PAD + 80],
        [WALL_PAD + 80, WORLD_H - WALL_PAD - 80],
        [WORLD_W - WALL_PAD - 80, WORLD_H - WALL_PAD - 80],
      ][i % 4];
      props.push({
        id: `tree_${i}`,
        x: corner[0] + (i % 2) * 40,
        y: corner[1] + Math.floor(i / 2) * 35,
        model: "tree",
        color: "#2e7d32",
        scale: 1.1 + (i % 3) * 0.25,
        yLift: 0,
      });
    }
    return props;
  }

  function buildGamePadProps3D() {
    const games = Object.keys(onlineData.byGame || {}).filter((g) => g !== "players");
    if (!games.length) return [];

    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(games.length))));
    const padW = 140;
    const padH = 56;
    const gap = 24;
    const gridW = cols * padW + (cols - 1) * gap;
    const startX = SPAWN_X - gridW / 2 + padW / 2;
    const startY = SPAWN_Y + SPAWN_R + 80;

    return games.slice(0, 12).map((gid, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const wx = startX + col * (padW + gap);
      const wy = startY + row * (padH + gap);
      const count = (onlineData.byGame[gid] || []).length;
      return {
        id: `pad_${gid}`,
        x: wx,
        y: wy,
        model: "base_floor",
        color: count > 0 ? "#42a5f5" : "#78909c",
        scale: 0.62,
        yLift: 0.04,
      };
    });
  }

  window.__players3D = function () {
    if (!canvas) return null;

    const spawnScale = (SPAWN_R * 2 * WORLD_TO_3D) / 3.8;
    const props = [
      ...buildWallProps3D(),
      ...buildGrassProps3D(),
      {
        id: "spawn_platform",
        x: SPAWN_X,
        y: SPAWN_Y,
        model: "base",
        color: "#78909c",
        scale: spawnScale,
        yLift: 0,
      },
      ...buildGamePadProps3D(),
    ];

    const entities = [
      ...veteranCrowd.map((v, i) => ({
        id: `vet_${i}_${v.name}`,
        x: v.x,
        y: v.y,
        model: "lifter",
        color: v.color,
        scale: 0.55,
        facing: (i & 1) ? -1 : 1,
        yLift: 0,
      })),
      ...lobbyPeers.map((p, i) => ({
        id: `peer_${p.id || i}`,
        x: p.state?.x ?? SPAWN_X,
        y: p.state?.y ?? SPAWN_Y,
        model: "dot",
        color: LOBBY_PEER_COLOR,
        scale: 1,
        facing: p.state?.facing ?? 1,
        yLift: 0.08,
      })),
    ];

    return {
      worldW: WORLD_W,
      worldH: WORLD_H,
      ground: "#38ef38",
      defaultModel: "lifter",
      camera: cameraConfig3D(),
      player: {
        x: player.x,
        y: player.y,
        facing: player.facing,
        model: "brainrot",
        color: "#42a5f5",
        scale: 0.58,
        yLift: 0,
      },
      props,
      entities,
    };
  };

  function init() {
    canvas = document.getElementById("game-canvas");
    wrap = document.getElementById("game-wrap");
    ctx = canvas.getContext("2d");
    player = { x: SPAWN_X, y: SPAWN_Y, facing: 1 };
    cam = { x: SPAWN_X, y: SPAWN_Y };
    bindEvents();
    resize();
    loadVeterans();
    pollOnline();
    pollTimer = setInterval(pollOnline, POLL_ONLINE_MS);
    startMultiplayer();
    requestAnimationFrame(gameLoop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
