(function () {
  "use strict";
  const C = Object.assign({}, window.BUTTONS_DEFAULTS, window.GAME_CONFIG);
  window.GAME_CONFIG = C;
  const SAVE = C.saveKey || "100-buttons";
  const TOTAL = C.buttonCount || 100;
  let buttons = [], tier = 1, alive = true, chaos = 0, toastT = 0, playing = false, state = load();

  function load() { try { const r = localStorage.getItem(SAVE); if (r) return { ...def(), ...JSON.parse(r) }; } catch (_) {} return def(); }
  function def() { return { name: "Player", bestTier: 0, presses: 0 }; }
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_) {} }
  function $(id) { return document.getElementById(id); }
  function ui(k, v) { let s = (C.ui && C.ui[k]) || k; if (v) Object.entries(v).forEach(([a, b]) => { s = s.replace("{" + a + "}", b); }); return s; }
  function toast(m) { $("toast").textContent = m; $("toast").classList.remove("hidden"); toastT = 2.5; }

  function genButtons() {
    buttons = [];
    for (let i = 0; i < TOTAL; i++) {
      const trap = Math.random() < 0.05 + tier * 0.012;
      buttons.push({ id: i, pressed: false, trap, emoji: trap ? "💣" : "🔘", reward: trap ? 0 : 1 + Math.floor(Math.random() * 3) });
    }
  }

  function startGame() {
    state.name = ($("name-input")?.value || "Player").trim().slice(0, 14);
    tier = 1; alive = true; chaos = 0; genButtons();
    $("start-overlay")?.classList.add("hidden"); $("app")?.classList.add("playing");
    playing = true; toast(ui("startToast"));
    applyTierTheme();
    renderGrid(); updateHud();
    if (window.GameMP) {
      GameMP.init({ game: C.mpGame, subroom: "tier-" + tier, getName: () => state.name,
        getState: () => ({ tier, chaos }), onPeers: () => {} });
      GameMP.start();
    }
  }

  function pressBtn(b) {
    if (!playing || b.pressed) return;
    b.pressed = true; state.presses++;
    if (b.trap) {
      window.GameSFX?.play("trap");
      chaos += 25;
      if (Math.random() < 0.18 + tier * 0.03) { alive = false; playing = false; toast(ui("eliminated")); $("start-overlay")?.classList.remove("hidden"); $("app")?.classList.remove("playing"); save(); return; }
      toast(ui("trap"));
    } else {
      window.GameSFX?.play("coin");
      chaos = Math.max(0, chaos - 5);
      toast(ui("safe", { reward: String(b.reward) }));
    }
    const pressed = buttons.filter(x => x.pressed).length;
    if (pressed >= TOTAL * 0.85) {
      window.GameSFX?.play("level");
      tier++; state.bestTier = Math.max(state.bestTier, tier); genButtons();
      toast(ui("nextTier", { tier: String(tier) }));
      if (window.GameMP) GameMP.setSubroom("tier-" + tier);
    }
    applyTierTheme();
    renderGrid(); updateHud(); save();
  }

  function applyTierTheme() {
    const app = $("app");
    if (!app) return;
    app.dataset.tierTheme = String(((tier - 1) % 5) + 1);
  }

  function renderGrid() {
    const el = $("button-grid"); if (!el) return;
    el.innerHTML = buttons.map(b =>
      `<button type="button" class="grid-btn ${b.pressed ? "pressed" : ""} ${b.trap ? "trap" : ""}" data-id="${b.id}">${b.pressed ? "✓" : b.emoji}</button>`).join("");
    el.querySelectorAll(".grid-btn").forEach(btn => btn.addEventListener("click", () => pressBtn(buttons[+btn.dataset.id])));
  }

  function updateHud() {
    $("tier-display").textContent = "🏔️ Tier " + tier;
    $("chaos-display").textContent = "💥 " + Math.floor(chaos) + "%";
    $("pressed-display").textContent = "🔘 " + buttons.filter(b => b.pressed).length + "/" + TOTAL;
    $("best-display").textContent = "🏆 T" + state.bestTier;
  }

  function init() {
    $("play-btn")?.addEventListener("click", startGame);
    $("settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.remove("hidden"));
    $("close-settings-btn")?.addEventListener("click", () => $("settings-overlay")?.classList.add("hidden"));
    $("leave-game-btn")?.addEventListener("click", () => { location.href = "../../index.html"; });
    if (C.branding?.title) { document.title = C.branding.title; $("game-title").textContent = C.branding.title; $("game-tagline").textContent = C.branding.description; }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
