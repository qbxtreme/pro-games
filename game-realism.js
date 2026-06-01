/**
 * Shared canvas post-processing & atmosphere for Pro Games.
 */
(function () {
  "use strict";

  let grainTick = 0;

  function postFrame(ctx, w, h, opts) {
    if (!ctx || w <= 0 || h <= 0) return;
    opts = opts || {};
    const fx = opts.focusX != null ? opts.focusX : w * 0.5;
    const fy = opts.focusY != null ? opts.focusY : h * 0.52;
    const t = opts.animT != null ? opts.animT : grainTick;
    const decor = opts.zone?.decor || opts.decor || "";

    if (opts.grade !== false) {
      const grade = ctx.createLinearGradient(0, 0, w, h * 0.9);
      if (decor === "lava" || decor === "volcano") {
        grade.addColorStop(0, "rgba(255,110,30,0.09)");
        grade.addColorStop(0.5, "rgba(80,20,0,0.05)");
        grade.addColorStop(1, "rgba(15,4,0,0.14)");
      } else if (decor === "ice" || decor === "arctic" || decor === "depths") {
        grade.addColorStop(0, "rgba(210,235,255,0.11)");
        grade.addColorStop(1, "rgba(30,60,110,0.12)");
      } else if (opts.isNight) {
        grade.addColorStop(0, "rgba(20,30,65,0.18)");
        grade.addColorStop(1, "rgba(0,0,0,0.24)");
      } else {
        grade.addColorStop(0, "rgba(255,245,230,0.09)");
        grade.addColorStop(0.4, "rgba(255,255,255,0.035)");
        grade.addColorStop(0.75, "rgba(140,180,220,0.06)");
        grade.addColorStop(1, "rgba(35,55,95,0.11)");
      }
      ctx.fillStyle = grade;
      ctx.fillRect(0, 0, w, h);
    }

    if (opts.lighting !== false) {
      const light = ctx.createRadialGradient(fx, fy, 8, fx, fy, Math.max(w, h) * 0.82);
      light.addColorStop(0, "rgba(255,255,255,0.13)");
      light.addColorStop(0.28, "rgba(255,255,255,0.045)");
      light.addColorStop(0.62, "rgba(0,0,0,0.02)");
      light.addColorStop(1, "rgba(0,0,0,0.18)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, w, h);
    }

    if (opts.ao !== false) {
      const ao = ctx.createLinearGradient(0, 0, 0, h);
      ao.addColorStop(0, "rgba(0,0,0,0.06)");
      ao.addColorStop(0.15, "rgba(0,0,0,0)");
      ao.addColorStop(0.85, "rgba(0,0,0,0)");
      ao.addColorStop(1, "rgba(0,0,0,0.14)");
      ctx.fillStyle = ao;
      ctx.fillRect(0, 0, w, h);
    }

    const vigStrength = opts.vignette != null ? opts.vignette : 0.32;
    if (vigStrength > 0) {
      const vig = ctx.createRadialGradient(
        fx,
        fy,
        Math.min(w, h) * 0.05,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.82
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(0.52, `rgba(0,0,0,${vigStrength * 0.42})`);
      vig.addColorStop(1, `rgba(0,0,0,${vigStrength})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    }

    if (opts.haze !== false && opts.isNight !== true) {
      const hy = h * (opts.horizon != null ? opts.horizon : 0.36);
      const haze = ctx.createLinearGradient(0, hy - 28, 0, h);
      haze.addColorStop(0, "rgba(255,215,170,0)");
      haze.addColorStop(0.4, "rgba(190,165,130,0.055)");
      haze.addColorStop(1, "rgba(30,22,15,0.14)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, hy - 28, w, h - hy + 28);
    }

    if (opts.grain !== false) {
      grainTick += 0.4;
      const n = opts.grainCount || Math.min(260, Math.floor((w * h) / 2800));
      for (let i = 0; i < n; i++) {
        const a = 0.004 + (i % 5) * 0.0025;
        ctx.fillStyle = i % 2 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.8})`;
        ctx.fillRect((i * 97 + t * 3.5) % w, (i * 61 + t * 2.3) % h, 1, 1);
      }
    }
  }

  function installUI() {
    document.querySelectorAll("#game-wrap").forEach((wrap) => {
      if (wrap.querySelector(".gr-atmosphere")) return;
      const el = document.createElement("div");
      el.className = "gr-atmosphere";
      el.setAttribute("aria-hidden", "true");
      wrap.appendChild(el);
    });
    document.body.classList.add("gr-enhanced");
  }

  window.GameRealism = { postFrame, installUI };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installUI);
  else installUI();
})();
