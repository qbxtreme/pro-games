/**
 * Shared procedural sound effects for Pro Games (Web Audio API).
 * Include before game-multiplayer.js on each game page.
 */
(function () {
  "use strict";

  let ctx = null;
  let enabled = true;
  let lastTap = 0;

  const PRESETS = {
    tap: [{ f: 440, t: "square", d: 0.07, v: 0.1 }],
    start: [
      { f: 523, t: "square", d: 0.09, v: 0.13 },
      { f: 659, t: "square", d: 0.11, v: 0.11, delay: 0.06 },
      { f: 784, t: "square", d: 0.14, v: 0.1, delay: 0.14 },
    ],
    battle: [
      { f: 180, t: "sawtooth", d: 0.12, v: 0.12 },
      { f: 240, t: "sawtooth", d: 0.16, v: 0.1, delay: 0.07 },
    ],
    attack: [{ f: 320, t: "square", d: 0.05, v: 0.13 }],
    hit: [{ f: 150, t: "sawtooth", d: 0.09, v: 0.12 }],
    win: [
      { f: 523, t: "square", d: 0.1, v: 0.13 },
      { f: 659, t: "square", d: 0.1, v: 0.12, delay: 0.09 },
      { f: 784, t: "square", d: 0.16, v: 0.11, delay: 0.18 },
    ],
    lose: [{ f: 220, t: "sawtooth", d: 0.22, v: 0.11 }],
    level: [
      { f: 660, t: "square", d: 0.12, v: 0.12 },
      { f: 880, t: "square", d: 0.14, v: 0.1, delay: 0.1 },
    ],
    coin: [
      { f: 880, t: "square", d: 0.04, v: 0.09 },
      { f: 1100, t: "square", d: 0.05, v: 0.07, delay: 0.04 },
    ],
    jump: [{ f: 400, t: "square", d: 0.07, v: 0.1 }],
    eat: [{ f: 520, t: "triangle", d: 0.05, v: 0.11 }],
    meeting: [{ f: 280, t: "triangle", d: 0.18, v: 0.12 }],
    night: [{ f: 140, t: "sine", d: 0.25, v: 0.09 }],
    trap: [{ f: 110, t: "sawtooth", d: 0.2, v: 0.14 }],
    capture: [
      { f: 600, t: "triangle", d: 0.08, v: 0.11 },
      { f: 900, t: "triangle", d: 0.1, v: 0.09, delay: 0.07 },
    ],
    correct: [{ f: 660, t: "sine", d: 0.18, v: 0.12 }],
    wrong: [{ f: 200, t: "sawtooth", d: 0.15, v: 0.1 }],
  };

  function ensureCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {}
    }
    if (ctx?.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, type, duration, volume, startAt) {
    const c = ensureCtx();
    if (!c || !enabled) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    const t0 = startAt || c.currentTime;
    gain.gain.setValueAtTime(volume || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function play(name) {
    const seq = PRESETS[name] || PRESETS.tap;
    const c = ensureCtx();
    if (!c) return;
    if (name === "tap") {
      const now = performance.now();
      if (now - lastTap < 45) return;
      lastTap = now;
    }
    const base = c.currentTime;
    seq.forEach((note) => tone(note.f, note.t, note.d, note.v, base + (note.delay || 0)));
  }

  function classifyClick(el) {
    const id = el.id || "";
    const cls = el.className || "";
    const text = (el.textContent || "").toLowerCase();

    if (id === "play-btn" || id === "mo-start-btn" || id === "mo-retry-btn") return "start";
    if (
      id.includes("attack") ||
      id.includes("fight") ||
      id === "fire-btn" ||
      id === "blaster-btn" ||
      text.includes("attack") ||
      text.includes("reel") ||
      text.includes("devour") ||
      text.includes("infect")
    ) {
      return "attack";
    }
    if (cls.includes("vote-btn")) return "meeting";
    if (id === "meeting-btn") return "meeting";
    if (id === "night-btn") return "night";
    return "tap";
  }

  function bindGlobalUI() {
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target.closest(
          'button, .mo-btn, .mo-choice, .vote-btn, .style-pick, .theme-btn, .class-row button, .team-row button, .action-btn, .action-float, .steer-btn, .hotbar-action, .grid-btn, .big-btn, .small-btn, [role="button"]'
        );
        if (!t || t.disabled || t.classList.contains("no-sfx")) return;
        play(classifyClick(t));
      },
      true
    );

    const unlock = () => ensureCtx();
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
  }

  window.GameSFX = {
    play,
    bindGlobalUI,
    setEnabled(v) {
      enabled = !!v;
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindGlobalUI);
  else bindGlobalUI();
})();
