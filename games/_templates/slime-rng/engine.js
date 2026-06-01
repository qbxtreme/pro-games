(function () {
  "use strict";
  const C = Object.assign({}, window.SLIME_RNG_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "slime-rng";
  const RARITIES = C.rarities || [{ id: "common", name: "Common", chance: 0.55, emoji: "🟢", power: 10 }, { id: "rare", name: "Rare", chance: 0.28, emoji: "🔵", power: 25 }, { id: "epic", name: "Epic", chance: 0.12, emoji: "🟣", power: 50 }, { id: "legend", name: "Legend", chance: 0.05, emoji: "⭐", power: 100 }];
  let collection = [], coins = 50, battle = null, toastT = 0, playing = false, state = load();

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", style: "cute", collection: [], coins: 50, rolls: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify({ ...state, collection, coins })); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k, v) { let s = (C.ui && C.ui[k]) || k; if (v) Object.entries(v).forEach(([a, b]) => { s = s.replace("{" + a + "}", b); }); return s; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function roll() {
    if (coins < 10) { toast(ui("needCoins")); return; }
    coins -= 10; state.rolls++;
    const r = Math.random();
    let acc = 0, picked = RARITIES[0];
    for (const tier of RARITIES) { acc += tier.chance; if (r <= acc) { picked = tier; break; } }
    const slime = { id: Date.now(), ...picked, name: picked.name + " Slime", hp: picked.power, maxHp: picked.power };
    collection.push(slime); save();
    toast(ui("rolled", { emoji: picked.emoji, name: picked.name }));
    renderCollection(); updateHud();
  }

  function bestSlime() { return collection.slice().sort((a, b) => b.power - a.power)[0]; }

  function startBattle() {
    const s = bestSlime();
    if (!s) { toast(ui("noSlime")); return; }
    const foePower = 15 + Math.floor(Math.random() * 40 + state.rolls * 0.5);
    battle = { slime: { ...s, hp: s.maxHp }, foe: { name: "Wild Slime", emoji: "👾", hp: foePower, maxHp: foePower, atk: 8 + Math.floor(Math.random() * 10) }, log: "" };
    $("battle-overlay")?.classList.remove("hidden");
    renderBattle();
  }

  function battleTurn() {
    if (!battle) return;
    battle.foe.hp -= battle.slime.power * 0.4 + Math.random() * 10;
    if (battle.foe.hp <= 0) {
      const reward = 20 + Math.floor(Math.random() * 30);
      coins += reward; battle = null; save();
      $("battle-overlay")?.classList.add("hidden");
      toast(ui("win", { coins: String(reward) })); updateHud(); return;
    }
    battle.slime.hp -= battle.foe.atk;
    if (battle.slime.hp <= 0) {
      battle = null; $("battle-overlay")?.classList.add("hidden");
      toast(ui("lose")); return;
    }
    renderBattle();
  }

  function renderBattle() {
    if (!battle) return;
    $("battle-you-name").textContent = battle.slime.emoji + " " + battle.slime.name;
    $("battle-foe-name").textContent = battle.foe.emoji + " " + battle.foe.name;
    $("battle-you-hp").style.width = Math.max(0, battle.slime.hp / battle.slime.maxHp * 100) + "%";
    $("battle-foe-hp").style.width = Math.max(0, battle.foe.hp / battle.foe.maxHp * 100) + "%";
    $("battle-you-hp-text").textContent = Math.ceil(battle.slime.hp) + "/" + battle.slime.maxHp;
    $("battle-foe-hp-text").textContent = Math.ceil(battle.foe.hp) + "/" + battle.foe.maxHp;
  }

  function renderCollection() {
    const el = $("slime-collection"); if (!el) return;
    el.innerHTML = collection.slice(-12).reverse().map(s =>
      `<span class="slime-chip">${s.emoji}</span>`).join("") || ui("emptyCollection");
  }

  function updateHud() {
    $("coin-display").textContent = "🪙 " + coins;
    $("roll-display").textContent = "🎲 " + state.rolls;
    $("count-display").textContent = "🟢 " + collection.length;
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    collection = state.collection || []; coins = state.coins || 50;
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    $("roll-btn")?.classList.remove("hidden"); $("fight-btn")?.classList.remove("hidden");
    playing = true; renderCollection(); updateHud();
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "lobby", getName: () => state.name,
        getState: () => ({ count: collection.length, rolls: state.rolls }),
        onPeers: () => {} });
      GameMP.start();
    }
  }

  function init() {
    $("play-btn")?.addEventListener("click", startGame);
    $("roll-btn")?.addEventListener("click", roll);
    $("fight-btn")?.addEventListener("click", startBattle);
    $("attack-btn")?.addEventListener("click", battleTurn);
    $("flee-btn")?.addEventListener("click", () => { battle = null; $("battle-overlay")?.classList.add("hidden"); });
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
