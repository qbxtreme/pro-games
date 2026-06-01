(function () {
  "use strict";

  const OUTLINE = 4;
  const STYLES = {
    cute: { body: "#ef5350", dark: "#c62828", eye: "#fff", accent: "#ffeb3b" },
    cool: { body: "#42a5f5", dark: "#1565c0", eye: "#fff", accent: "#81d4fa" },
    wild: { body: "#26c6da", dark: "#00838f", eye: "#fff", accent: "#b2ebf2" },
    pink: { body: "#ec407a", dark: "#ad1457", eye: "#fff", accent: "#f8bbd0" },
    lime: { body: "#9ccc65", dark: "#558b2f", eye: "#fff", accent: "#dcedc8" },
    gold: { body: "#ffd54f", dark: "#f9a825", eye: "#fff", accent: "#fff59d" },
  };

  const PLAYER_COLORS = ["cute", "cool", "wild", "pink", "lime", "gold"];

  function shade(hex, amt) {
    if (!hex || hex.startsWith("rgb") || hex.startsWith("hsl")) return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
    g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
    b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
    return `rgb(${r},${g},${b})`;
  }

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

  function drawArenaFloor(ctx, w, h, camX, camY, animT) {
    const tile = 64;
    for (let ty = -tile; ty < h + tile; ty += tile) {
      for (let tx = -tile; tx < w + tile; tx += tile) {
        const wx = Math.floor((tx + camX) / tile);
        const wy = Math.floor((ty + camY) / tile);
        const alt = (wx + wy) % 2 === 0;
        const g = ctx.createLinearGradient(tx, ty, tx, ty + tile);
        g.addColorStop(0, alt ? "#e8eaf6" : "#c5cae9");
        g.addColorStop(1, alt ? "#9fa8da" : "#7986cb");
        ctx.fillStyle = g;
        ctx.fillRect(tx, ty, tile, tile);
        if ((wx * 3 + wy) % 7 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(tx + 8, ty + 8, tile - 16, 4);
        }
      }
    }
    ctx.strokeStyle = "rgba(17,17,17,0.2)";
    ctx.lineWidth = 3;
    ctx.strokeRect(40 - camX % 1, 40 - camY % 1, w - 80, h - 80);
  }

  function drawSky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    g.addColorStop(0, "#1a237e");
    g.addColorStop(0.5, "#3949ab");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.45);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(60 + i * 90, 40 + (i % 2) * 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer(ctx, x, y, scale, styleKey, facing, animT, opts) {
    const st = STYLES[styleKey] || STYLES.cute;
    const dead = opts && opts.dead;
    const frozen = opts && opts.frozen;
    const num = opts && opts.number;
    const s = scale || 1;
    const bob = frozen ? 0 : Math.sin(animT * 0.12) * 2;
    const walk = opts && opts.walking ? Math.sin(animT * 0.25) * 4 : 0;

    drawSoftShadow(ctx, x, y + 18 * s, 22 * s, 8 * s);

    if (dead) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.6);
      ctx.globalAlpha = 0.55;
    }

    stickerStroke(ctx, (stroke) => {
      const by = y + bob + walk - 8 * s;
      ctx.fillStyle = stroke ? "transparent" : st.body;
      ctx.beginPath();
      ctx.ellipse(x, by, 18 * s, 20 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!stroke) {
        ctx.fillStyle = st.dark;
        ctx.beginPath();
        ctx.ellipse(x - 6 * facing * s, by - 4 * s, 6 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = st.eye;
        ctx.beginPath();
        ctx.arc(x + 5 * facing * s, by - 8 * s, 5 * s, 0, Math.PI * 2);
        ctx.arc(x - 2 * facing * s, by - 6 * s, 4 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(x + 6 * facing * s, by - 8 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (frozen && !dead) {
      ctx.strokeStyle = "rgba(129,212,250,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 4, 26 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (num != null) {
      ctx.font = `bold ${11 * s}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#111";
      ctx.fillRect(x - 10, y - 38 * s, 20, 14);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(num), x, y - 28 * s);
    }

    if (dead) ctx.restore();
  }

  function drawDoll(ctx, x, y, scale, animT) {
    const s = scale || 1;
    const sway = Math.sin(animT * 0.08) * 3;
    stickerStroke(ctx, (stroke) => {
      if (!stroke) {
        ctx.fillStyle = "#ff1744";
        ctx.fillRect(x - 8 * s, y - 40 * s + sway, 16 * s, 12 * s);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y - 48 * s + sway, 14 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(x - 4 * s, y - 50 * s + sway, 2 * s, 0, Math.PI * 2);
        ctx.arc(x + 4 * s, y - 50 * s + sway, 2 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawGlassPanel(ctx, x, y, w, h, safe, crack) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, safe ? "rgba(129,199,132,0.85)" : "rgba(255,255,255,0.55)");
    g.addColorStop(1, safe ? "rgba(56,142,60,0.9)" : "rgba(189,189,189,0.7)");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    if (crack) {
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.lineTo(x + w * 0.7, y);
      ctx.stroke();
    }
  }

  function drawBalloon(ctx, x, y, color, animT) {
    const bob = Math.sin(animT * 0.15 + x) * 5;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + bob + 18);
    ctx.lineTo(x, y + bob + 35);
    ctx.stroke();
    ctx.fillStyle = color || "#ef5350";
    ctx.beginPath();
    ctx.ellipse(x, y + bob, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawPotato(ctx, x, y, animT, hot) {
    const pulse = hot ? 1 + Math.sin(animT * 0.4) * 0.15 : 1;
    stickerStroke(ctx, (stroke) => {
      if (!stroke) {
        ctx.fillStyle = hot ? "#ff6f00" : "#8d6e63";
        ctx.beginPath();
        ctx.ellipse(x, y, 16 * pulse, 12 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        if (hot) {
          ctx.fillStyle = "#ffeb3b";
          for (let i = 0; i < 4; i++) {
            const a = animT * 2 + i * 1.5;
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * 22, y - 18 + Math.sin(a) * 8, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });
  }

  function drawMingleZone(ctx, x, y, r, num, highlight) {
    ctx.fillStyle = highlight ? "rgba(255,235,59,0.5)" : "rgba(255,255,255,0.25)";
    ctx.strokeStyle = highlight ? "#fbc02d" : "#5c6bc0";
    ctx.lineWidth = highlight ? 4 : 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 22px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#111";
    ctx.fillText(String(num), x, y + 8);
  }

  function drawLightBanner(ctx, w, color, text) {
    ctx.fillStyle = color === "red" ? "#d32f2f" : "#2e7d32";
    ctx.fillRect(0, 0, w, 56);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, w, 56);
    ctx.font = "bold 28px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(text, w / 2, 38);
  }

  window.SigmaSprites = {
    STYLES,
    PLAYER_COLORS,
    shade,
    drawArenaFloor,
    drawSky,
    drawPlayer,
    drawDoll,
    drawGlassPanel,
    drawBalloon,
    drawPotato,
    drawMingleZone,
    drawLightBanner,
  };
})();
