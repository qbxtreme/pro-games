(function () {
  "use strict";

  const canvas = document.getElementById("mbs-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let animT = 0;
  let lastFrame = 0;

  const stars = Array.from({ length: 48 }, (_, i) => ({
    x: Math.random(),
    y: Math.random() * 0.65,
    r: 1 + (i % 3),
    spd: 0.15 + (i % 5) * 0.08,
    phase: i * 0.7,
  }));

  function resize() {
    const wrap = canvas.parentElement;
    if (!wrap) return;
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function drawBrawler(x, y, sc, t, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    const bob = Math.sin(t * 3) * 4;
    ctx.translate(0, bob);

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 38, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-18, -8, 36, 40, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffcc80";
    ctx.beginPath();
    ctx.arc(0, -18, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-5, -20, 3, 0, Math.PI * 2);
    ctx.arc(5, -20, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    stars.forEach((s) => {
      const sx = (s.x * w + Math.sin(t * s.spd + s.phase) * 12) % w;
      const sy = s.y * h;
      const pulse = 0.35 + Math.sin(t * 2 + s.phase) * 0.25;
      ctx.fillStyle = `rgba(255,235,59,${pulse})`;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const cx = w * 0.5;
    const cy = h * 0.58;
    const ring = 70 + Math.sin(t * 1.5) * 6;
    ctx.strokeStyle = "rgba(255,213,79,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, ring, 0, Math.PI * 2);
    ctx.stroke();

    drawBrawler(cx - 52, cy, 1.1, t + 0.4, "#ef5350");
    drawBrawler(cx, cy - 8, 1.25, t, "#42a5f5");
    drawBrawler(cx + 52, cy, 1.1, t + 0.8, "#66bb6a");
  }

  function loop(now) {
    const t = typeof now === "number" ? now : performance.now();
    const dt = Math.min(0.05, (t - lastFrame) / 1000 || 0.016);
    lastFrame = t;
    animT += dt;
    draw(animT);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(loop);
})();
