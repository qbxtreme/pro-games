(function () {
  "use strict";

  const SAVE_KEY = "ranked-battling";
  const RANKS = window.RankedRanks.RANKS;
  const PEAK_RANK = window.RankedRanks.PEAK;
  const xpToNextRank = window.RankedRanks.xpToNextRank;
  const ELEMENTS = ["fire", "water", "earth", "air"];
  const ELEMENT_BEATS = { fire: "earth", earth: "air", air: "water", water: "fire" };

  const RIVAL_NAMES = [
    "Blaze", "Torrent", "Boulder", "Gale", "Cinder", "Ripple", "Moss", "Zephyr",
    "Inferno", "Tsunami", "Granite", "Storm", "Ember", "Frost", "Vine", "Sky",
  ];

  let state = loadState();
  let battle = null;
  let menuTick = 0;
  let menuAnimId = null;
  let inWorld = false;
  let battleAnimId = null;
  let lastEncounterRival = null;

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  function defaultState() {
    return {
      dragonName: "Divine Gold",
      element: "divine",
      tier: "divine",
      rankIndex: 0,
      xp: 0,
      wins: 0,
      losses: 0,
      saveVersion: window.RankedRanks.SAVE_VERSION,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.xp == null && parsed.rankPoints != null) parsed.xp = parsed.rankPoints;
        parsed.dragonName = "Divine Gold";
        parsed.element = "divine";
        parsed.tier = "divine";
        const prevVersion = parsed.saveVersion ?? 1;
        window.RankedRanks.migrateLegacySave(parsed);
        const merged = { ...defaultState(), ...parsed };
        if (prevVersion < window.RankedRanks.SAVE_VERSION) {
          merged.saveVersion = window.RankedRanks.SAVE_VERSION;
          merged.rankIndex = window.RankedRanks.clampRankIndex(merged.rankIndex);
          localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    } catch (_) {}
    return defaultState();
  }

  function saveState() {
    state.saveVersion = window.RankedRanks.SAVE_VERSION;
    state.rankIndex = window.RankedRanks.clampRankIndex(state.rankIndex);
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function currentRank() {
    return RANKS[Math.max(0, Math.min(state.rankIndex, RANKS.length - 1))];
  }

  function rankHp(rankIndex) {
    return 80 + rankIndex * 18 + Math.floor(Math.random() * 10);
  }

  function rankPower(rankIndex) {
    return 6 + rankIndex * 4;
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add("hidden"), 2600);
  }

  function resizeCanvas() {
    const wrap = document.getElementById("game-wrap");
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
  }

  function drawMenuBg() {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1a237e");
    g.addColorStop(0.45, "#3949ab");
    g.addColorStop(1, "#7986cb");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const x = ((menuTick * 20 + i * 120) % (w + 80)) - 40;
      const y = 30 + (i % 4) * 40;
      ctx.fillStyle = `rgba(255,255,255,${0.06 + (i % 3) * 0.03})`;
      ctx.beginPath();
      ctx.arc(x, y, 18 + (i % 3) * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function menuLoop() {
    menuTick += 0.016;
    drawMenuBg();
    menuAnimId = requestAnimationFrame(menuLoop);
  }

  function updateBigRankDisplay() {
    const rank = currentRank();
    const el = document.getElementById("big-rank-display");
    if (!el) return;
    el.textContent = rank;
    el.className = "big-rank rank-" + rank;
  }

  function updateRankBadge(el, rank) {
    if (!el) return;
    el.textContent = rank;
    el.className = "rank-badge rank-" + rank;
  }

  function renderHud() {
    updateBigRankDisplay();
    const rank = currentRank();
    const xpEl = document.getElementById("rank-xp-display");
    const nextXp = xpToNextRank(state.rankIndex);
    const xpText = state.rankIndex >= RANKS.length - 1
      ? "MAX RANK"
      : `${state.xp} / ${nextXp} XP`;
    if (xpEl) xpEl.textContent = xpText;
    const hudRank = document.getElementById("hud-rank-badge");
    const hudXp = document.getElementById("hud-xp-text");
    if (hudRank) {
      hudRank.textContent = rank;
      hudRank.className = "hud-rank-badge rank-" + rank;
    }
    if (hudXp) hudXp.textContent = xpText;
    if (inWorld && RankedWorld.syncPlayerRank) {
      RankedWorld.syncPlayerRank(state.rankIndex);
    }
  }

  function enterWorld() {
    inWorld = true;
    document.getElementById("menu-overlay").classList.add("hidden");
    document.getElementById("world-rank-hud")?.classList.remove("hidden");
    document.getElementById("app").classList.add("in-world");
    if (menuAnimId) cancelAnimationFrame(menuAnimId);
    menuAnimId = null;
    RankedWorld.show();
    RankedWorld.bindControls();
    RankedWorld.start({
      _busy: false,
      playerRankIndex: state.rankIndex,
      onEncounter(rival) {
        startBattle(rival);
      },
    });
    renderHud();
  }

  function returnToWorld() {
    document.getElementById("result-overlay").classList.add("hidden");
    document.getElementById("battle-overlay").classList.add("hidden");
    document.getElementById("app").classList.remove("in-battle");
    inWorld = true;
    RankedWorld.show();
    RankedWorld.resumeAfterBattle(lastEncounterRival);
    renderHud();
  }

  function pickRivalRankIndex() {
    const ri = state.rankIndex;
    const roll = Math.random();
    if (roll < 0.55) return ri;
    if (roll < 0.8) return Math.max(0, ri - 1);
    return Math.min(RANKS.length - 1, ri + 1);
  }

  function startBattle(rivalData) {
    if (rivalData?.rivalRef?.userData?.fled) return;
    lastEncounterRival = rivalData?.rivalRef || null;
    RankedWorld.stop();
    const rivalRankIndex = rivalData?.rankIndex ?? pickRivalRankIndex();
    const rivalElement = rivalData?.element || ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const youHp = rankHp(state.rankIndex);
    const foeHp = rankHp(rivalRankIndex);

    battle = {
      rivalRankIndex,
      rivalElement,
      rivalName: rivalData?.name || RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)],
      youHp,
      youMaxHp: youHp,
      foeHp,
      foeMaxHp: foeHp,
      specialReady: true,
      turnLock: false,
    };

    document.getElementById("world-hud")?.classList.add("hidden");
    RankedWorld.hide();
    document.getElementById("battle-overlay").classList.remove("hidden");
    document.getElementById("app").classList.add("in-battle");
    document.getElementById("you-name").textContent = state.dragonName;
    document.getElementById("foe-name").textContent = battle.rivalName;
    document.getElementById("battle-banner").textContent =
      `Ranked Match — ${currentRank()} vs ${RANKS[rivalRankIndex]}`;
    updateRankBadge(document.getElementById("you-rank-badge"), currentRank());
    updateRankBadge(document.getElementById("foe-rank-badge"), RANKS[rivalRankIndex]);
    document.getElementById("battle-msg").textContent = "Your turn — pick an attack!";
    document.getElementById("attack-btn").disabled = false;
    document.getElementById("special-btn").disabled = !battle.specialReady;

    let bt = 0;
    const battleDrawLoop = () => {
      if (!battle) return;
      bt += 0.05;
      drawBattleDragons(bt);
      battleAnimId = requestAnimationFrame(battleDrawLoop);
    };
    battleDrawLoop();
    updateBattleBars();
  }

  function drawBattleDragons(tick) {
    const youC = document.getElementById("you-dragon-canvas");
    const foeC = document.getElementById("foe-dragon-canvas");
    if (!youC || !foeC) return;
    const yctx = youC.getContext("2d");
    const fctx = foeC.getContext("2d");
    yctx.clearRect(0, 0, youC.width, youC.height);
    fctx.clearRect(0, 0, foeC.width, foeC.height);
    RBSprites.drawDragon(yctx, youC.width * 0.5, youC.height * 0.65, "divine", 36, 1, tick);
    RBSprites.drawDragon(fctx, foeC.width * 0.5, foeC.height * 0.65, battle.rivalElement, 36, -1, tick + 1);
  }

  function updateBattleBars() {
    if (!battle) return;
    const youPct = (battle.youHp / battle.youMaxHp) * 100;
    const foePct = (battle.foeHp / battle.foeMaxHp) * 100;
    document.getElementById("you-hp").style.width = `${Math.max(0, youPct)}%`;
    document.getElementById("foe-hp").style.width = `${Math.max(0, foePct)}%`;
    document.getElementById("you-hp-text").textContent =
      `${Math.max(0, battle.youHp)} / ${battle.youMaxHp}`;
    document.getElementById("foe-hp-text").textContent =
      `${Math.max(0, battle.foeHp)} / ${battle.foeMaxHp}`;
  }

  function calcDamage(attackerElement, defenderElement, power, special) {
    let dmg = power + Math.floor(Math.random() * 8);
    if (special) dmg = Math.floor(dmg * 1.65);
    if (attackerElement === "divine") dmg = Math.floor(dmg * 1.25);
    else if (ELEMENT_BEATS[attackerElement] === defenderElement) dmg = Math.floor(dmg * 1.45);
    else if (ELEMENT_BEATS[defenderElement] === attackerElement) dmg = Math.floor(dmg * 0.72);
    return Math.max(4, dmg);
  }

  function endBattle(won, forfeited) {
    let xpChange = 0;
    let rankedUp = false;

    if (forfeited) {
      xpChange = -50;
      state.losses += 1;
    } else if (won) {
      xpChange = 100 + battle.rivalRankIndex * 12 + Math.floor(Math.random() * 25);
      state.wins += 1;
    } else {
      xpChange = -(25 + Math.floor(Math.random() * 20));
      state.losses += 1;
    }

    if (state.rankIndex < RANKS.length - 1) {
      state.xp = Math.max(0, state.xp + xpChange);
      while (state.rankIndex < RANKS.length - 1) {
        const need = xpToNextRank(state.rankIndex);
        if (state.xp < need) break;
        state.xp -= need;
        state.rankIndex += 1;
        rankedUp = true;
      }
    }

    saveState();
    if (battleAnimId) cancelAnimationFrame(battleAnimId);
    battleAnimId = null;

    const rivalName = battle.rivalName;
    if (window.RankedWorld?.onBattleEnd) {
      RankedWorld.onBattleEnd({
        rival: lastEncounterRival,
        won,
        forfeited,
      });
    }

    battle = null;
    document.getElementById("battle-overlay").classList.add("hidden");
    document.getElementById("result-overlay").classList.remove("hidden");

    const title = document.getElementById("result-title");
    const msg = document.getElementById("result-msg");
    const rankUpEl = document.getElementById("rank-up-msg");
    const nextXp = xpToNextRank(state.rankIndex);

    if (forfeited) {
      title.textContent = "Forfeit";
      msg.textContent = `You fled the ranked match. −50 XP. Rank ${currentRank()} (${state.xp}/${nextXp} XP).`;
    } else if (won) {
      title.textContent = "Victory!";
      msg.textContent = `+${Math.max(xpChange, 0)} XP! Rank ${currentRank()} — ${state.xp}/${nextXp} XP to next rank.`;
    } else {
      title.textContent = "Defeat…";
      msg.textContent = `${xpChange} XP. ${rivalName} fled — you can't battle it again. Rank ${currentRank()} — ${state.xp}/${nextXp} XP.`;
    }

    if (rankedUp) {
      rankUpEl.textContent = `🎉 RANK UP! You reached Rank ${currentRank()}!`;
      rankUpEl.classList.remove("hidden");
    } else {
      rankUpEl.classList.add("hidden");
    }

    if (state.rankIndex >= RANKS.length - 1) {
      msg.textContent = won
        ? `+${Math.max(xpChange, 0)} XP! You are at the peak — Rank ${PEAK_RANK}!`
        : `Rank ${currentRank()} — ${PEAK_RANK}!`;
    }

    renderHud();
    if (rankedUp && inWorld && RankedWorld.goToPlayerRank) {
      RankedWorld.goToPlayerRank(state.rankIndex);
    }
  }

  function playerAttack(special) {
    if (!battle || battle.turnLock) return;
    battle.turnLock = true;
    const power = rankPower(state.rankIndex) + (special ? 8 : 0);
    const dmg = calcDamage("divine", battle.rivalElement, power, special);
    battle.foeHp -= dmg;
    if (special) battle.specialReady = false;
    document.getElementById("battle-msg").textContent =
      special ? `Divine Burst hits for ${dmg}!` : `Dragon Strike deals ${dmg} damage!`;
    document.getElementById("attack-btn").disabled = true;
    document.getElementById("special-btn").disabled = true;
    updateBattleBars();

    if (battle.foeHp <= 0) {
      setTimeout(() => endBattle(true, false), 700);
      return;
    }

    setTimeout(() => {
      if (!battle) return;
      const counter = calcDamage(battle.rivalElement, "divine", rankPower(battle.rivalRankIndex), false);
      battle.youHp -= counter;
      document.getElementById("battle-msg").textContent =
        `${battle.rivalName} counterattacks for ${counter}!`;
      updateBattleBars();
      if (battle.youHp <= 0) {
        setTimeout(() => endBattle(false, false), 700);
        return;
      }
      battle.turnLock = false;
      battle.specialReady = true;
      document.getElementById("attack-btn").disabled = false;
      document.getElementById("special-btn").disabled = false;
      document.getElementById("battle-msg").textContent = "Your turn!";
    }, 650);
  }

  function bindUi() {
    document.getElementById("start-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      enterWorld();
    });

    document.getElementById("attack-btn").addEventListener("click", () => playerAttack(false));
    document.getElementById("special-btn").addEventListener("click", () => playerAttack(true));
    document.getElementById("flee-btn").addEventListener("click", () => {
      if (battle) endBattle(false, true);
    });

    document.getElementById("result-continue-btn").addEventListener("click", () => {
      if (inWorld) returnToWorld();
      else {
        document.getElementById("result-overlay").classList.add("hidden");
        document.getElementById("menu-overlay").classList.remove("hidden");
        document.getElementById("app").classList.remove("in-battle");
        if (!menuAnimId) menuLoop();
        renderHud();
      }
    });

    window.addEventListener("resize", () => {
      resizeCanvas();
      if (inWorld && RankedWorld.resize) RankedWorld.resize();
    });
  }

  function init() {
    resizeCanvas();
    bindUi();
    renderHud();
    menuLoop();
    document.getElementById("app").classList.add("playing");
    if (window.RankedWorld) RankedWorld.bindControls();
  }

  __bapDeferInit(init);
})();
