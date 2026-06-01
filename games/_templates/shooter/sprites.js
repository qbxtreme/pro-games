(function () {
  "use strict";

  const OUTLINE = 3;
  const STYLES = {
    cute: { body: "#ef5350", dark: "#c62828", eye: "#fff" },
    cool: { body: "#42a5f5", dark: "#1565c0", eye: "#fff" },
    wild: { body: "#26c6da", dark: "#00838f", eye: "#fff" },
    pink: { body: "#ec407a", dark: "#ad1457", eye: "#fff" },
    lime: { body: "#9ccc65", dark: "#558b2f", eye: "#fff" },
    gold: { body: "#ffd54f", dark: "#f9a825", eye: "#fff" },
  };

  const WEAPON_COLORS = {
    pistol: "#9e9e9e",
    smg: "#78909c",
    rifle: "#5d4037",
    shotgun: "#6a1b9a",
    sniper: "#1565c0",
    rocket: "#d84315",
    laser: "#00e676",
    golden: "#ffd54f",
  };

  function stickerStroke(ctx, drawFn) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = OUTLINE + 4;
    drawFn(true);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = OUTLINE;
    drawFn(true);
    drawFn(false);
    ctx.restore();
  }

  function drawArena(ctx, w, h, camX, camY, teamColors) {
    const tile = 48;
    for (let ty = -tile; ty < h + tile; ty += tile) {
      for (let tx = -tile; tx < w + tile; tx += tile) {
        const wx = Math.floor((tx + camX) / tile);
        const wy = Math.floor((ty + camY) / tile);
        const alt = (wx + wy) % 2 === 0;
        ctx.fillStyle = alt ? "#546e7a" : "#455a64";
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
    const crates = [
      { x: 180, y: 220, w: 48, h: 48 },
      { x: 520, y: 180, w: 48, h: 48 },
      { x: 350, y: 420, w: 64, h: 40 },
      { x: 700, y: 300, w: 48, h: 48 },
    ];
    crates.forEach((c) => {
      const sx = c.x - camX;
      const sy = c.y - camY;
      ctx.fillStyle = "#8d6e63";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.fillRect(sx, sy, c.w, c.h);
      ctx.strokeRect(sx, sy, c.w, c.h);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(sx + 4, sy + 4, c.w - 8, 6);
    });
    if (teamColors) {
      ctx.fillStyle = "rgba(239,83,80,0.12)";
      ctx.fillRect(0, 0, w / 2, h);
      ctx.fillStyle = "rgba(66,165,245,0.12)";
      ctx.fillRect(w / 2, 0, w / 2, h);
    }
  }

  function drawShooter(ctx, x, y, scale, styleKey, angle, animT, opts) {
    const st = STYLES[styleKey] || STYLES.cute;
    const s = scale || 1;
    const weapon = opts && opts.weapon;
    const bob = Math.sin(animT * 0.16) * 2;

    ctx.save();
    ctx.translate(x, y + bob);

    const g = ctx.createRadialGradient(0, 18 * s, 0, 0, 18 * s, 20 * s);
    g.addColorStop(0, "rgba(0,0,0,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 18 * s, 20 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    stickerStroke(ctx, (stroke) => {
      if (!stroke) {
        ctx.fillStyle = st.body;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16 * s, 18 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = st.eye;
        ctx.beginPath();
        ctx.arc(4 * s, -6 * s, 4 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(5 * s, -6 * s, 1.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (weapon) {
      const wc = WEAPON_COLORS[weapon.id] || "#9e9e9e";
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = wc;
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.fillRect(8 * s, -3 * s, weapon.len || 18, 6 * s);
      ctx.strokeRect(8 * s, -3 * s, weapon.len || 18, 6 * s);
      ctx.restore();
    }

    ctx.restore();

    if (opts && opts.hp != null && opts.maxHp) {
      const bw = 32 * s;
      const pct = Math.max(0, opts.hp / opts.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(x - bw / 2, y - 36 * s, bw, 5);
      ctx.fillStyle = pct > 0.35 ? "#66bb6a" : "#ef5350";
      ctx.fillRect(x - bw / 2, y - 36 * s, bw * pct, 5);
    }
  }

  function drawBullet(ctx, x, y, color, size) {
    ctx.fillStyle = color || "#ffeb3b";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size || 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawPickup(ctx, x, y, weapon, animT) {
    const bob = Math.sin(animT * 0.18) * 5;
    const wc = WEAPON_COLORS[weapon.id] || "#ffd54f";
    ctx.fillStyle = wc;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 14px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#111";
    ctx.fillText(weapon.emoji || "🔫", x, y + bob + 5);
  }

  function drawBanner(ctx, x, y, team, animT) {
    const wave = Math.sin(animT * 0.1) * 4;
    ctx.fillStyle = team === "red" ? "#ef5350" : "#42a5f5";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 24 + wave, y - 20);
    ctx.lineTo(x, y - 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = "bold 12px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(team === "red" ? "R" : "B", x + 10, y - 18);
  }

  window.ShooterSprites = {
    STYLES,
    WEAPON_COLORS,
    drawArena,
    drawShooter,
    drawBullet,
    drawPickup,
    drawBanner,
  };
})();
