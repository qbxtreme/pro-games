(function () {
  "use strict";
  window.TemplateSprites = {
    OUTLINE: 3,
    STYLES: {
      cute: { body: "#ef5350", dark: "#c62828", eye: "#fff", accent: "#ff8a80", skin: "#ffab91" },
      cool: { body: "#42a5f5", dark: "#1565c0", eye: "#fff", accent: "#82b1ff", skin: "#90caf9" },
      wild: { body: "#26c6da", dark: "#00838f", eye: "#fff", accent: "#80deea", skin: "#80deea" },
    },

    shade(hex, amt) {
      if (!hex || hex.startsWith("rgb") || hex.startsWith("hsl")) return hex;
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
      g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
      b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
      return `rgb(${r},${g},${b})`;
    },

    hash(n) {
      n = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return n - Math.floor(n);
    },

    stickerStroke(ctx, drawFn) {
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 7;
      drawFn(true);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      drawFn(true);
      drawFn(false);
      ctx.restore();
    },

    drawSoftShadow(ctx, x, y, rx, ry) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
      g.addColorStop(0, "rgba(0,0,0,0.32)");
      g.addColorStop(0.55, "rgba(0,0,0,0.12)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry || rx * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    },

    drawShadow(ctx, x, y, rx, ry) {
      this.drawSoftShadow(ctx, x, y + 2, rx, ry);
    },

    drawSky(ctx, w, h, top, bot, opts) {
      const o = opts || {};
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.62);
      g.addColorStop(0, top || "#1e88e5");
      g.addColorStop(0.45, bot || "#64b5f6");
      g.addColorStop(1, this.shade(bot || "#64b5f6", 0.15));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (o.dark) return;

      const sunX = w * (o.sunX || 0.78);
      const sunY = h * (o.sunY || 0.14);
      const sunG = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 48);
      sunG.addColorStop(0, "rgba(255,253,231,0.95)");
      sunG.addColorStop(0.35, "rgba(255,235,59,0.45)");
      sunG.addColorStop(1, "rgba(255,235,59,0)");
      ctx.fillStyle = sunG;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 48, 0, Math.PI * 2);
      ctx.fill();

      this.drawMountains(ctx, w, h, o.camX || 0, o.mountain || "#558b2f");
      if (o.clouds !== false) this.drawClouds(ctx, w, h, o.time || 0);
    },

    drawMountains(ctx, w, h, camX, color) {
      const base = color || "#689f38";
      ctx.fillStyle = this.shade(base, -0.18);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.48);
      ctx.lineTo(w * 0.12, h * 0.28);
      ctx.lineTo(w * 0.28, h * 0.38);
      ctx.lineTo(w * 0.42, h * 0.22);
      ctx.lineTo(w * 0.58, h * 0.34);
      ctx.lineTo(w * 0.74, h * 0.2);
      ctx.lineTo(w * 0.88, h * 0.32);
      ctx.lineTo(w, h * 0.42);
      ctx.lineTo(w, h * 0.52);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = this.shade(base, 0.05);
      ctx.beginPath();
      ctx.moveTo(-((camX * 0.04) % 80), h * 0.52);
      for (let i = 0; i <= 6; i++) {
        const x = (i / 6) * (w + 80) - ((camX * 0.06) % 80);
        const peak = h * (0.36 + (i % 3) * 0.04);
        ctx.lineTo(x, peak);
      }
      ctx.lineTo(w + 40, h * 0.54);
      ctx.lineTo(w + 40, h * 0.58);
      ctx.lineTo(-40, h * 0.58);
      ctx.closePath();
      ctx.fill();
    },

    drawClouds(ctx, w, h, t) {
      const phase = t || 0;
      ctx.save();
      [[0.12, 0.1, 1], [0.38, 0.07, 0.85], [0.62, 0.12, 1.1], [0.84, 0.08, 0.9]].forEach(([px, py, sc], i) => {
        const x = ((px * w + phase * 14 * (i + 1)) % (w + 140)) - 70;
        const y = py * h * 0.42;
        const g = ctx.createRadialGradient(x, y, 2, x, y, 34 * sc);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, 22 * sc, 12 * sc, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 18 * sc, y + 2, 18 * sc, 10 * sc, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 34 * sc, y, 20 * sc, 11 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    },

    drawGround(ctx, w, h, topY, color, altColor, opts) {
      const o = opts || {};
      const y0 = topY || h * 0.24;
      const base = color || "#7cb342";
      const alt = altColor || "#689f38";
      const depthG = ctx.createLinearGradient(0, y0, 0, h);
      depthG.addColorStop(0, this.shade(base, 0.12));
      depthG.addColorStop(0.35, base);
      depthG.addColorStop(1, this.shade(alt, -0.12));
      ctx.fillStyle = depthG;
      ctx.fillRect(0, y0, w, h - y0);

      const tile = 56;
      for (let ty = y0; ty < h; ty += tile) {
        for (let tx = ((ty / tile | 0) % 2) * (tile / 2); tx < w; tx += tile) {
          const v = this.hash(tx * 0.07 + ty * 0.11);
          ctx.fillStyle = v > 0.55 ? this.shade(base, 0.06) : this.shade(alt, -0.04);
          ctx.fillRect(tx + 2, ty + 2, tile / 2 - 4, tile / 2 - 4);
        }
      }

      if (o.grass !== false) {
        for (let i = 0; i < Math.floor(w / 14); i++) {
          const gx = (i * 137 + (o.seed || 0)) % w;
          const gy = y0 + 8 + (this.hash(i * 3.1) * (h - y0 - 16));
          this.drawGrassTuft(ctx, gx, gy, 6 + this.hash(i) * 6, (o.time || 0) + i);
        }
      }
    },

    drawGrassTuft(ctx, x, y, len, wind) {
      const sway = Math.sin(wind * 2 + x * 0.05) * 2;
      ctx.strokeStyle = "#558b2f";
      ctx.lineWidth = 1.5;
      for (let b = -1; b <= 1; b++) {
        ctx.beginPath();
        ctx.moveTo(x + b * 2, y);
        ctx.quadraticCurveTo(x + b * 2 + sway, y - len * 0.6, x + b * 3 + sway * 1.2, y - len);
        ctx.stroke();
      }
    },

    drawTree(ctx, x, y, scale, type) {
      const sc = scale || 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      this.drawSoftShadow(ctx, 0, 8, 16, 5);
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(-5, 0, 10, 26);
      ctx.fillStyle = type === "pine" ? "#2e7d32" : "#43a047";
      if (type === "pine") {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, -8 - i * 10);
          ctx.lineTo(-16 + i * 2, 6 + i * 4);
          ctx.lineTo(16 - i * 2, 6 + i * 4);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(0, -6, 20, 0, Math.PI * 2);
        ctx.arc(-14, 2, 14, 0, Math.PI * 2);
        ctx.arc(14, 2, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },

    drawRock(ctx, x, y, scale) {
      const sc = scale || 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      this.drawSoftShadow(ctx, 0, 10, 14, 5);
      const g = ctx.createLinearGradient(-12, -8, 12, 10);
      g.addColorStop(0, "#9e9e9e");
      g.addColorStop(1, "#616161");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-14, 6);
      ctx.lineTo(-10, -8);
      ctx.lineTo(4, -10);
      ctx.lineTo(14, 0);
      ctx.lineTo(8, 10);
      ctx.lineTo(-8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#424242";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    },

    drawScenery(ctx, w, h, seed, density) {
      const n = density || 8;
      const y0 = h * 0.24;
      for (let i = 0; i < n; i++) {
        const hx = this.hash(seed + i * 17) * w;
        const hy = y0 + this.hash(seed + i * 31) * (h - y0 - 40);
        if (i % 3 === 0) this.drawRock(ctx, hx, hy, 0.7 + this.hash(i) * 0.5);
        else this.drawTree(ctx, hx, hy, 0.65 + this.hash(i * 2) * 0.45, i % 2 ? "pine" : "round");
      }
    },

    drawWorld(ctx, w, h, opts) {
      const o = opts || {};
      this.drawSky(ctx, w, h, o.skyTop, o.skyBot, o);
      this.drawGround(ctx, w, h, o.groundY, o.floor, o.floorAlt, o);
      if (o.scenery !== false) this.drawScenery(ctx, w, h, o.seed || 42, o.density || 10);
    },

    drawIndoorScene(ctx, w, h, opts) {
      const o = opts || {};
      const floor = o.floor || "#3e3e56";
      const wall = o.wall || "#2a2a3d";
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, w, h * 0.18);
      const wg = ctx.createLinearGradient(0, h * 0.18, 0, h * 0.28);
      wg.addColorStop(0, this.shade(wall, 0.08));
      wg.addColorStop(1, floor);
      ctx.fillStyle = wg;
      ctx.fillRect(0, h * 0.18, w, h * 0.08);

      const fg = ctx.createLinearGradient(0, h * 0.26, 0, h);
      fg.addColorStop(0, this.shade(floor, 0.1));
      fg.addColorStop(1, this.shade(floor, -0.15));
      ctx.fillStyle = fg;
      ctx.fillRect(0, h * 0.26, w, h);

      const tile = 64;
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let ty = h * 0.26; ty < h; ty += tile) {
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(w, ty);
        ctx.stroke();
        for (let tx = 0; tx < w; tx += tile) {
          ctx.strokeRect(tx + 1, ty + 1, tile - 2, tile - 2);
        }
      }

      if (o.lights !== false) {
        for (let i = 0; i < 4; i++) {
          const lx = w * (0.15 + i * 0.23);
          const lg = ctx.createRadialGradient(lx, h * 0.12, 2, lx, h * 0.35, 90);
          lg.addColorStop(0, "rgba(255,241,118,0.18)");
          lg.addColorStop(1, "rgba(255,241,118,0)");
          ctx.fillStyle = lg;
          ctx.fillRect(lx - 90, 0, 180, h * 0.5);
        }
      }
    },

    drawHideCloset(ctx, x, y, cw, ch, active) {
      this.drawSoftShadow(ctx, x + cw / 2, y + ch + 4, cw * 0.55, 8);
      const g = ctx.createLinearGradient(x, y, x + cw, y + ch);
      g.addColorStop(0, active ? "#66bb6a" : "#455a64");
      g.addColorStop(1, active ? "#388e3c" : "#263238");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, cw, ch);
      ctx.fillStyle = "#cfd8dc";
      ctx.fillRect(x + cw - 14, y + ch / 2 - 8, 6, 16);
      ctx.font = "22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("🚪", x + cw / 2, y + ch / 2 + 8);
    },

    drawSoccerField(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#2e7d32");
      g.addColorStop(0.5, "#43a047");
      g.addColorStop(1, "#388e3c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const stripe = 48;
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      for (let y = 0; y < h; y += stripe * 2) ctx.fillRect(0, y, w, stripe);

      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.beginPath();
      ctx.moveTo(w / 2, 12);
      ctx.lineTo(w / 2, h - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(12, h * 0.28, 70, h * 0.44);
      ctx.strokeRect(w - 82, h * 0.28, 70, h * 0.44);
    },

    drawForestArena(ctx, w, h, zoneR, animT, cam) {
      this.drawWorld(ctx, w, h, {
        skyTop: "#37474f",
        skyBot: "#78909c",
        floor: "#558b2f",
        floorAlt: "#33691e",
        time: animT,
        seed: 7,
        density: 14,
        dark: true,
      });
      if (zoneR > 0) {
        const cx = w / 2;
        const cy = h / 2;
        ctx.strokeStyle = "rgba(255,235,59,0.85)";
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(cx, cy, zoneR * (w / 900), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        const fog = ctx.createRadialGradient(cx, cy, zoneR * 0.5, cx, cy, w * 0.7);
        fog.addColorStop(0, "rgba(0,0,0,0)");
        fog.addColorStop(0.65, "rgba(0,0,0,0)");
        fog.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = fog;
        ctx.fillRect(0, 0, w, h);
      }
    },

    drawUrbanLot(ctx, w, h, animT, theme) {
      this.drawSky(ctx, w, h, theme === "warehouse" ? "#90a4ae" : "#78909c", "#cfd8dc", { time: animT, sunY: 0.1 });
      this.drawGround(ctx, w, h, h * 0.2, theme === "warehouse" ? "#8d6e63" : "#9e9e9e", "#757575", { seed: 3, density: 5 });

      ctx.fillStyle = "rgba(55,71,79,0.35)";
      ctx.fillRect(0, h * 0.2, w * 0.22, h * 0.45);
      ctx.fillRect(w * 0.78, h * 0.22, w * 0.22, h * 0.42);
      ctx.strokeStyle = "#37474f";
      ctx.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.strokeRect(16 + col * 28, h * 0.22 + row * 32, 22, 26);
          ctx.strokeRect(w - 88 + col * 28, h * 0.24 + row * 32, 22, 26);
        }
      }

      ctx.fillStyle = "#546e7a";
      ctx.fillRect(w * 0.35, h * 0.18, w * 0.3, h * 0.08);
      ctx.fillStyle = "#eceff1";
      for (let i = 0; i < 5; i++) ctx.fillRect(w * 0.37 + i * (w * 0.055), h * 0.19, w * 0.04, h * 0.05);
    },

    drawDigSite(ctx, w, h, depth, animT) {
      this.drawSky(ctx, w, h, "#81d4fa", "#e1f5fe", { time: animT, sunY: 0.08 });
      ctx.fillStyle = "#a1887f";
      ctx.fillRect(0, h * 0.12, w, h * 0.88);
      const layers = 8;
      for (let i = 0; i < layers; i++) {
        const y = h * 0.12 + i * ((h * 0.88) / layers);
        const shade = -0.06 - i * 0.04;
        ctx.fillStyle = this.shade("#6d4c41", shade);
        ctx.fillRect(0, y, w, (h * 0.88) / layers);
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.font = "28px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("⛏️", w / 2, h * 0.45 + Math.sin(animT * 3) * 4);
    },

    drawBuildingPlot(ctx, x, y, size, owned, emoji, level, cost) {
      this.drawSoftShadow(ctx, x + size / 2, y + size + 2, size * 0.45, 6);
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      g.addColorStop(0, owned ? "#c8e6c9" : "#d7ccc8");
      g.addColorStop(1, owned ? "#81c784" : "#bcaaa4");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);

      if (owned && emoji) {
        ctx.font = `${Math.floor(size * 0.42)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji, x + size / 2, y + size / 2 + 2);
        if (level > 1) {
          ctx.font = "bold 11px system-ui";
          ctx.fillStyle = "#111";
          ctx.fillText("Lv" + level, x + size - 18, y + 14);
        }
      } else if (cost != null) {
        ctx.font = "12px system-ui";
        ctx.fillStyle = "#333";
        ctx.textAlign = "center";
        ctx.fillText("🪙" + cost, x + size / 2, y + size / 2 + 4);
      }
    },

    drawBlob(ctx, x, y, style, facing, walkPhase, scale) {
      const s = this.STYLES[style] || this.STYLES.cute;
      const sc = scale || 1;
      const walk = walkPhase || 0;
      const bob = Math.sin(walk) * 2.5 * sc;
      const legSwing = Math.sin(walk * 1.4) * 5 * sc;
      const fy = y + bob;
      const f = facing >= 0 ? 1 : -1;

      this.drawSoftShadow(ctx, x, y + 16 * sc, 20 * sc, 8 * sc);

      ctx.save();
      ctx.translate(x, fy);

      const bodyG = ctx.createRadialGradient(-4 * f * sc, -6 * sc, 4, 0, 2 * sc, 24 * sc);
      bodyG.addColorStop(0, s.accent || s.body);
      bodyG.addColorStop(0.55, s.body);
      bodyG.addColorStop(1, s.dark);
      ctx.fillStyle = bodyG;
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 4 * sc, 17 * sc, 15 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = s.dark;
      ctx.beginPath();
      ctx.ellipse(-8 * f * sc, 8 * sc + legSwing * 0.3, 5 * sc, 7 * sc, 0.2 * f, 0, Math.PI * 2);
      ctx.ellipse(8 * f * sc, 8 * sc - legSwing * 0.3, 5 * sc, 7 * sc, -0.2 * f, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = s.skin || s.accent;
      ctx.beginPath();
      ctx.arc(0, -12 * sc, 13 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = s.dark;
      ctx.beginPath();
      ctx.ellipse(-10 * f * sc, 0, 4 * sc, 9 * sc, 0.3 * f, 0, Math.PI * 2);
      ctx.ellipse(10 * f * sc, 0, 4 * sc, 9 * sc, -0.3 * f, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = s.eye;
      ctx.beginPath();
      ctx.ellipse(-5 * f * sc, -14 * sc, 4 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
      ctx.ellipse(5 * f * sc, -14 * sc, 4 * sc, 4.5 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(-4 * f * sc, -14 * sc, 1.8 * sc, 0, Math.PI * 2);
      ctx.arc(6 * f * sc, -14 * sc, 1.8 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(-5.5 * f * sc, -15.5 * sc, 1.2 * sc, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(2 * f * sc, -8 * sc, 3 * sc, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

      ctx.restore();
    },

    drawEmojiMob(ctx, x, y, emoji, color, size) {
      const sc = size || 1;
      this.drawSoftShadow(ctx, x, y + 14 * sc, 16 * sc, 6 * sc);
      ctx.save();
      ctx.translate(x, y);
      const baseG = ctx.createRadialGradient(0, 8, 2, 0, 10, 22 * sc);
      baseG.addColorStop(0, "rgba(255,255,255,0.35)");
      baseG.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = baseG;
      ctx.beginPath();
      ctx.ellipse(0, 10 * sc, 18 * sc, 6 * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${32 * sc}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillText(emoji, 2, 4);
      ctx.fillStyle = color || "#fff";
      ctx.fillText(emoji, 0, 0);
      ctx.restore();
    },

    drawRain(ctx, w, h, animT, color) {
      ctx.strokeStyle = color || "rgba(180,0,0,0.45)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 50; i++) {
        const rx = (i * 97 + animT * 220) % w;
        const ry = (i * 53 + animT * 420) % h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 20);
        ctx.stroke();
      }
    },

    drawRedTint(ctx, w, h, alpha) {
      ctx.fillStyle = `rgba(255,50,50,${alpha || 0.15})`;
      ctx.fillRect(0, 0, w, h);
    },
  };
})();
