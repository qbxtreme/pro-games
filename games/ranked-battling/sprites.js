// Dragon sprites for Ranked Battling
(function () {
  const COLORS = {
    divine: { body: "#ffb300", belly: "#fff8e1", wing: "#ff8f00", eye: "#ffffff" },
    fire: { body: "#c62828", belly: "#ff8a65", wing: "#b71c1c", eye: "#ffeb3b" },
    water: { body: "#1565c0", belly: "#64b5f6", wing: "#0d47a1", eye: "#e1f5fe" },
    earth: { body: "#2e7d32", belly: "#a5d6a7", wing: "#1b5e20", eye: "#fff9c4" },
    air: { body: "#78909c", belly: "#cfd8dc", wing: "#546e7a", eye: "#ffffff" },
  };

  function darken(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${Math.max(0, (n >> 16) - amt)},${Math.max(0, ((n >> 8) & 255) - amt)},${Math.max(0, (n & 255) - amt)})`;
  }

  function drawDragon(ctx, x, y, element, size, facing, tick) {
    const c = COLORS[element] || COLORS.divine;
    const s = size;
    const bob = Math.sin(tick * 3) * s * 0.04;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(facing, 1);

    if (element === "divine") {
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = s * 0.35;
    }

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, s * 0.55, s * 0.5, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    const flap = Math.sin(tick * 4) * 0.1;
    ctx.fillStyle = darken(c.wing, 10);
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.1, -s * 0.05);
      ctx.lineTo(side * s * (0.55 + flap), -s * 0.45);
      ctx.lineTo(side * s * 0.2, s * 0.1);
      ctx.closePath();
      ctx.fill();
    });

    const grd = ctx.createRadialGradient(-s * 0.1, -s * 0.1, s * 0.05, 0, s * 0.05, s * 0.45);
    grd.addColorStop(0, c.belly);
    grd.addColorStop(0.5, c.body);
    grd.addColorStop(1, darken(c.body, 30));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.38, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.ellipse(s * 0.28, -s * 0.08, s * 0.22, s * 0.18, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.eye;
    ctx.beginPath();
    ctx.arc(s * 0.35, -s * 0.12, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(s * 0.37, -s * 0.12, s * 0.025, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  window.RBSprites = { drawDragon, COLORS };
})();
