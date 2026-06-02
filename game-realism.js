/**
 * Shared canvas post-processing & atmosphere for Pro Games.
 */
(function () {
  "use strict";

  let grainTick = 0;
  let manualFrameThisTick = false;
  let autoEnabled = true;

  function markManualFrame() {
    manualFrameThisTick = true;
  }

  function postFrame(ctx, w, h, opts) {
    if (!ctx || w <= 0 || h <= 0) return;
    manualFrameThisTick = true;
    opts = opts || {};
    const fx = opts.focusX != null ? opts.focusX : w * 0.5;
    const fy = opts.focusY != null ? opts.focusY : h * 0.52;
    const t = opts.animT != null ? opts.animT : grainTick;
    const decor = opts.zone?.decor || opts.decor || "";

    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    if (opts.grade !== false) {
      const grade = ctx.createLinearGradient(0, 0, w, h * 0.92);
      if (decor === "lava" || decor === "volcano") {
        grade.addColorStop(0, "rgba(255,120,40,0.11)");
        grade.addColorStop(0.45, "rgba(120,30,0,0.06)");
        grade.addColorStop(1, "rgba(10,2,0,0.16)");
      } else if (decor === "ice" || decor === "arctic" || decor === "depths") {
        grade.addColorStop(0, "rgba(220,240,255,0.13)");
        grade.addColorStop(0.55, "rgba(80,140,200,0.05)");
        grade.addColorStop(1, "rgba(20,45,90,0.14)");
      } else if (opts.isNight) {
        grade.addColorStop(0, "rgba(25,35,80,0.2)");
        grade.addColorStop(0.5, "rgba(10,15,35,0.12)");
        grade.addColorStop(1, "rgba(0,0,0,0.28)");
      } else {
        grade.addColorStop(0, "rgba(255,248,235,0.1)");
        grade.addColorStop(0.35, "rgba(255,255,255,0.04)");
        grade.addColorStop(0.68, "rgba(150,190,230,0.07)");
        grade.addColorStop(1, "rgba(30,50,90,0.13)");
      }
      ctx.fillStyle = grade;
      ctx.fillRect(0, 0, w, h);
    }

    if (opts.bloom !== false) {
      ctx.globalCompositeOperation = "screen";
      const bloom = ctx.createRadialGradient(fx, fy, 4, fx, fy, Math.max(w, h) * 0.55);
      bloom.addColorStop(0, "rgba(255,255,255,0.09)");
      bloom.addColorStop(0.35, "rgba(255,240,200,0.035)");
      bloom.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }

    if (opts.lighting !== false) {
      const light = ctx.createRadialGradient(fx, fy, 6, fx, fy, Math.max(w, h) * 0.85);
      light.addColorStop(0, "rgba(255,255,255,0.15)");
      light.addColorStop(0.25, "rgba(255,255,255,0.05)");
      light.addColorStop(0.58, "rgba(0,0,0,0.03)");
      light.addColorStop(1, "rgba(0,0,0,0.2)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, w, h);
    }

    if (opts.ao !== false) {
      const ao = ctx.createLinearGradient(0, 0, 0, h);
      ao.addColorStop(0, "rgba(0,0,0,0.08)");
      ao.addColorStop(0.12, "rgba(0,0,0,0)");
      ao.addColorStop(0.88, "rgba(0,0,0,0)");
      ao.addColorStop(1, "rgba(0,0,0,0.16)");
      ctx.fillStyle = ao;
      ctx.fillRect(0, 0, w, h);
    }

    const vigStrength = opts.vignette != null ? opts.vignette : 0.34;
    if (vigStrength > 0) {
      const vig = ctx.createRadialGradient(
        fx,
        fy,
        Math.min(w, h) * 0.04,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.88
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(0.5, `rgba(0,0,0,${vigStrength * 0.38})`);
      vig.addColorStop(1, `rgba(0,0,0,${vigStrength})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    if (opts.haze !== false && opts.isNight !== true) {
      const hy = h * (opts.horizon != null ? opts.horizon : 0.38);
      const haze = ctx.createLinearGradient(0, hy - 32, 0, h);
      haze.addColorStop(0, "rgba(255,215,170,0)");
      haze.addColorStop(0.35, "rgba(190,165,130,0.06)");
      haze.addColorStop(1, "rgba(25,18,12,0.16)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, hy - 32, w, h - hy + 32);
    }

    if (opts.chromatic !== false && w > 120) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.028;
      ctx.fillStyle = "rgba(255,80,80,0.5)";
      ctx.fillRect(1, 0, w, h);
      ctx.fillStyle = "rgba(80,140,255,0.5)";
      ctx.fillRect(-1, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    if (opts.grain !== false) {
      grainTick += 0.45;
      const n = opts.grainCount || Math.min(320, Math.floor((w * h) / 2200));
      for (let i = 0; i < n; i++) {
        const a = 0.004 + (i % 7) * 0.002;
        ctx.fillStyle = i % 2 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.75})`;
        ctx.fillRect((i * 97 + t * 3.7) % w, (i * 61 + t * 2.4) % h, 1, 1);
      }
    }

    if (opts.lensDirt !== false) {
      ctx.globalCompositeOperation = "multiply";
      const dirt = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.35, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      dirt.addColorStop(0, "rgba(255,255,255,1)");
      dirt.addColorStop(0.85, "rgba(240,235,225,0.98)");
      dirt.addColorStop(1, "rgba(210,200,185,0.92)");
      ctx.fillStyle = dirt;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }

  function defaultOpts(canvas) {
    if (typeof window.getGameRealismOpts === "function") {
      const custom = window.getGameRealismOpts(canvas);
      if (custom === false) return null;
      if (custom && typeof custom === "object") return custom;
    }
    const rect = canvas.getBoundingClientRect();
    const w = canvas.width / (window.devicePixelRatio || 1) || rect.width;
    const h = canvas.height / (window.devicePixelRatio || 1) || rect.height;
    return {
      focusX: w * 0.5,
      focusY: h * 0.52,
      animT: grainTick,
      vignette: 0.28,
      grainCount: Math.min(280, Math.floor((w * h) / 2400)),
      haze: true,
      horizon: 0.4,
    };
  }

  function shouldAutoApply() {
    if (!autoEnabled || window.GR_DISABLE_AUTO) return false;
    const app = document.getElementById("app");
    if (app?.classList.contains("playing")) return true;
    if (document.body.classList.contains("world-play-mode")) return true;
    const forest = document.getElementById("tab-forest");
    if (forest?.classList.contains("active") && document.getElementById("world-canvas")) return true;
    if (document.getElementById("snake-main-hub")?.classList.contains("hidden") && app && !app.classList.contains("arena-hidden")) {
      return app.classList.contains("playing");
    }
    return false;
  }

  function findAutoCanvas() {
    const ids = ["game-canvas", "world-canvas", "battle-canvas"];
    for (const id of ids) {
      const c = document.getElementById(id);
      if (!c || c.width < 8 || c.height < 8) continue;
      if (c.dataset.grSkipAuto === "1") continue;
      if (id === "battle-canvas") {
        const overlay = document.getElementById("battle-overlay");
        if (overlay?.classList.contains("hidden")) continue;
      }
      return c;
    }
    const wrap = document.getElementById("game-wrap") || document.getElementById("world-wrap");
    if (!wrap) return null;
    let best = null;
    let bestArea = 0;
    wrap.querySelectorAll("canvas").forEach((c) => {
      if (c.dataset.grSkipAuto === "1") return;
      if (c.id === "menu-brawler-canvas") return;
      const area = c.width * c.height;
      if (area > bestArea) {
        bestArea = area;
        best = c;
      }
    });
    return best;
  }

  function autoFinishFrame() {
    if (manualFrameThisTick || !shouldAutoApply()) return;
    const canvas = findAutoCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const opts = defaultOpts(canvas);
    if (!opts) return;
    postFrame(ctx, w, h, opts);
    manualFrameThisTick = false;
  }

  function installUI() {
    document.querySelectorAll("#game-wrap, #world-wrap, .world-wrap").forEach((wrap) => {
      if (wrap.querySelector(".gr-atmosphere")) return;
      const el = document.createElement("div");
      el.className = "gr-atmosphere";
      el.setAttribute("aria-hidden", "true");
      wrap.appendChild(el);
    });
    document.body.classList.add("gr-enhanced");
  }

  function hookAnimationFrame() {
    if (window.__grRafHooked) return;
    window.__grRafHooked = true;
    const native = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) {
      return native(function (ts) {
        cb(ts);
        autoFinishFrame();
        manualFrameThisTick = false;
      });
    };
  }

  window.GameRealism = {
    postFrame,
    installUI,
    markManualFrame,
    autoFinishFrame,
    setAutoEnabled(on) {
      autoEnabled = !!on;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installUI();
      hookAnimationFrame();
    });
  } else {
    installUI();
    hookAnimationFrame();
  }
})();
