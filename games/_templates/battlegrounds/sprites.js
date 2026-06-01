(function () {
  "use strict";

  const OUTLINE = 4;
  const STYLES = {
    cute: { body: "#ef5350", dark: "#c62828", eye: "#fff" },
    cool: { body: "#42a5f5", dark: "#1565c0", eye: "#fff" },
    wild: { body: "#26c6da", dark: "#00838f", eye: "#fff" },
    pink: { body: "#ec407a", dark: "#ad1457", eye: "#fff" },
    lime: { body: "#9ccc65", dark: "#558b2f", eye: "#fff" },
    gold: { body: "#ffd54f", dark: "#f9a825", eye: "#fff" },
  };

  function stickerStroke(ctx, drawFn) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = OUTLINE + 5;
    drawFn(true);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = OUTLINE;
    drawFn(true);
    drawFn(false);
    ctx.restore();
  }

  function drawSoftShadow(ctx, x, y, rw, rh) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rw);
    g.addColorStop(0, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rw, rh || rw * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawArena(ctx, w, h, camX, camY, variant) {
    const tile = 56;
    for (let ty = -tile; ty < h + tile; ty += tile) {
      for (let tx = -tile; tx < w + tile; tx += tile) {
        const wx = Math.floor((tx + camX) / tile);
        const wy = Math.floor((ty + camY) / tile);
        const alt = (wx + wy) % 2 === 0;
        ctx.fillStyle = alt ? "#8d6e63" : "#6d4c41";
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
    if (variant === "koth") {
      const hx = w / 2 - camX + (camX - w / 2);
      const hy = h / 2 - camY + (camY - h / 2);
      const cx = w / 2;
      const cy = h / 2;
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.15;
      ctx.fillStyle = `rgba(255, 193, 7, ${0.2 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 70 + pulse * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbc02d";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "bold 14px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.strokeText("👑 THE HILL", cx, cy - 4);
      ctx.fillText("👑 THE HILL", cx, cy - 4);
    }
    const obstacles = [
      { x: 200, y: 200, w: 80, h: 40 },
      { x: 600, y: 350, w: 50, h: 90 },
      { x: 400, y: 500, w: 100, h: 35 },
    ];
    obstacles.forEach((o) => {
      const sx = o.x - camX;
      const sy = o.y - camY;
      if (sx < -120 || sy < -120 || sx > w + 120 || sy > h + 120) return;
      ctx.fillStyle = "#4e342e";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.fillRect(sx, sy, o.w, o.h);
      ctx.strokeRect(sx, sy, o.w, o.h);
    });
  }

  function drawFighter(ctx, x, y, scale, styleKey, facing, animT, opts) {
    const st = STYLES[styleKey] || STYLES.cute;
    const s = scale || 1;
    const shield = opts && opts.shield;
    const attacking = opts && opts.attacking;
    const bob = Math.sin(animT * 0.14) * (attacking ? 6 : 2);
    const walk = opts && opts.walking ? Math.sin(animT * 0.28) * 5 : 0;

    drawSoftShadow(ctx, x, y + 18 * s, 22 * s, 8 * s);

    if (shield) {
      ctx.strokeStyle = "rgba(66,165,245,0.85)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 30 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    stickerStroke(ctx, (stroke) => {
      const by = y + bob + walk - 8 * s;
      ctx.fillStyle = stroke ? "transparent" : st.body;
      ctx.beginPath();
      ctx.ellipse(x, by, 18 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!stroke) {
        ctx.fillStyle = st.dark;
        const punch = attacking ? 10 * facing * s : 0;
        ctx.beginPath();
        ctx.ellipse(x + punch, by - 2 * s, 8 * s, 6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = st.eye;
        ctx.beginPath();
        ctx.arc(x + 5 * facing * s, by - 8 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(x + 6 * facing * s, by - 8 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (opts && opts.hp != null && opts.maxHp) {
      const bw = 36 * s;
      const pct = Math.max(0, opts.hp / opts.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(x - bw / 2, y - 42 * s, bw, 6);
      ctx.fillStyle = pct > 0.35 ? "#66bb6a" : "#ef5350";
      ctx.fillRect(x - bw / 2, y - 42 * s, bw * pct, 6);
    }
  }

  function drawHitFX(ctx, x, y, animT) {
    ctx.font = "bold 18px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffeb3b";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.strokeText("💥", x, y - 20 - (animT % 1) * 30);
    ctx.fillText("💥", x, y - 20 - (animT % 1) * 30);
  }

  function drawXpOrb(ctx, x, y, animT) {
    const bob = Math.sin(animT * 0.2) * 4;
    ctx.fillStyle = "#7e57c2";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 10px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText("XP", x, y + bob + 4);
  }

  window.BGSprites = {
    STYLES,
    drawArena,
    drawFighter,
    drawHitFX,
    drawXpOrb,
  };
})();
