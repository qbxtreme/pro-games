(function () {
  "use strict";

  function shadeColor(hex, amt) {
    if (!hex || !hex.startsWith("#")) return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + Math.floor(amt * 255);
    let g = ((n >> 8) & 255) + Math.floor(amt * 255);
    let b = (n & 255) + Math.floor(amt * 255);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function hash(c, r, s) {
    return ((c * 73856093) ^ (r * 19349663) ^ (s * 83492791)) >>> 0;
  }

  function drawSoftShadow(ctx, sx, sy, rw, rh) {
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, rw);
    g.addColorStop(0, "rgba(0,0,0,0.38)");
    g.addColorStop(0.55, "rgba(0,0,0,0.14)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rw, rh || rw * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw3DBox(ctx, sx, sy, bw, bh, depth, topColor, sideColor, frontColor) {
    ctx.fillStyle = sideColor;
    ctx.fillRect(sx + bw - depth, sy + depth, depth, bh);
    ctx.fillStyle = frontColor;
    ctx.fillRect(sx, sy + depth, bw, bh - depth);
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(sx, sy + depth);
    ctx.lineTo(sx + depth, sy);
    ctx.lineTo(sx + bw, sy);
    ctx.lineTo(sx + bw - depth, sy + depth);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy + depth, bw, bh - depth);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(sx + 3, sy + depth + 3, bw - depth - 8, 4);
  }

  function drawFloorDirectionalLight(ctx, sx, sy, tw, th) {
    const light = ctx.createLinearGradient(sx, sy, sx + tw, sy + th);
    light.addColorStop(0, "rgba(255,248,220,0.14)");
    light.addColorStop(0.45, "rgba(255,255,255,0.03)");
    light.addColorStop(1, "rgba(0,0,0,0.1)");
    ctx.fillStyle = light;
    ctx.fillRect(sx, sy, tw, th);
  }

  function drawFloorTile(ctx, sx, sy, tw, th, base, floorType, seed) {
    if (floorType === "hardwood") {
      const plankW = 48;
      const cols = Math.ceil(tw / plankW);
      for (let c = 0; c < cols; c++) {
        const px = sx + c * plankW;
        const tone = ((c + seed) % 3) * 0.03;
        const pg = ctx.createLinearGradient(px, sy, px + plankW, sy + th);
        pg.addColorStop(0, shadeColor(base, tone - 0.04));
        pg.addColorStop(0.5, shadeColor(base, tone));
        pg.addColorStop(1, shadeColor(base, tone - 0.06));
        ctx.fillStyle = pg;
        ctx.fillRect(px, sy, plankW + 1, th);
        ctx.strokeStyle = "rgba(62,39,35,0.12)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(px, sy);
        ctx.lineTo(px, sy + th);
        ctx.stroke();
        if ((c + seed) % 2 === 0) {
          ctx.strokeStyle = "rgba(90,60,30,0.06)";
          ctx.beginPath();
          ctx.moveTo(px + 4, sy + 2);
          ctx.lineTo(px + plankW - 4, sy + th - 2);
          ctx.stroke();
        }
      }
      drawFloorDirectionalLight(ctx, sx, sy, tw, th);
      return;
    }
    if (floorType === "tile") {
      const ts = 36;
      const cols = Math.ceil(tw / ts);
      const rows = Math.ceil(th / ts);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tx = sx + c * ts;
          const ty = sy + r * ts;
          ctx.fillStyle = shadeColor(base, ((r + c) % 2) * 0.03 - 0.01);
          ctx.fillRect(tx + 1, ty + 1, ts - 2, ts - 2);
          ctx.strokeStyle = "rgba(0,0,0,0.08)";
          ctx.strokeRect(tx + 0.5, ty + 0.5, ts - 1, ts - 1);
          if ((r + c + seed) % 3 === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.04)";
            ctx.fillRect(tx + 4, ty + 4, ts - 8, ts - 8);
          }
        }
      }
      drawFloorDirectionalLight(ctx, sx, sy, tw, th);
      return;
    }
    if (floorType === "carpet") {
      ctx.fillStyle = base;
      ctx.fillRect(sx, sy, tw, th);
      for (let i = 0; i < Math.floor((tw * th) / 900); i++) {
        const fx = sx + (hash(i, seed, 1) % tw);
        const fy = sy + (hash(i, seed, 2) % th);
        ctx.fillStyle = `rgba(0,0,0,${0.015 + (i % 3) * 0.008})`;
        ctx.fillRect(fx, fy, 2, 1);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.strokeRect(sx + 0.5, sy + 0.5, tw - 1, th - 1);
      drawFloorDirectionalLight(ctx, sx, sy, tw, th);
      return;
    }
    if (floorType === "concrete") {
      ctx.fillStyle = shadeColor(base, -0.04);
      ctx.fillRect(sx, sy, tw, th);
      for (let i = 0; i < 8; i++) {
        const cx = sx + (hash(i, seed, 3) % tw);
        const cy = sy + (hash(i, seed, 4) % th);
        ctx.fillStyle = "rgba(0,0,0,0.04)";
        ctx.beginPath();
        ctx.arc(cx, cy, 3 + (i % 4), 0, Math.PI * 2);
        ctx.fill();
      }
      drawFloorDirectionalLight(ctx, sx, sy, tw, th);
      return;
    }
    if (floorType === "grass") {
      const bg = ctx.createLinearGradient(sx, sy, sx, sy + th);
      bg.addColorStop(0, shadeColor(base, 0.08));
      bg.addColorStop(1, shadeColor(base, -0.1));
      ctx.fillStyle = bg;
      ctx.fillRect(sx, sy, tw, th);
      for (let g = 0; g < Math.floor(tw / 40); g++) {
        const gx = sx + 10 + g * 38 + (seed % 7);
        const gy = sy + th - 14 - (g * 11) % 30;
        ctx.strokeStyle = g % 2 ? "#388e3c" : "#2e7d32";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx + 2, gy - 10, gx + 1, gy - 16);
        ctx.stroke();
      }
      drawFloorDirectionalLight(ctx, sx, sy, tw, th);
      return;
    }
    if (floorType === "asphalt") {
      ctx.fillStyle = base;
      ctx.fillRect(sx, sy, tw, th);
      for (let i = 0; i < Math.floor(tw / 120); i++) {
        const lx = sx + 60 + i * 120 + (seed % 20);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(lx, sy + th * 0.42, 36, 4);
      }
      for (let i = 0; i < Math.floor((tw * th) / 8000); i++) {
        const cx = sx + (hash(i, seed, 5) % tw);
        const cy = sy + (hash(i, seed, 6) % th);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.arc(cx, cy, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(sx, sy, tw, 6);
      drawFloorDirectionalLight(ctx, sx, sy, tw, th);
      return;
    }
    const cols = Math.ceil(tw / 32);
    const rows = Math.ceil(th / 32);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = sx + c * 32;
        const ty = sy + r * 32;
        ctx.fillStyle = shadeColor(base, ((r + c) % 2) * 0.04 - 0.02);
        ctx.fillRect(tx, ty, 32, 32);
        ctx.strokeStyle = "rgba(0,0,0,0.05)";
        ctx.strokeRect(tx + 0.5, ty + 0.5, 31, 31);
      }
    }
    drawFloorDirectionalLight(ctx, sx, sy, tw, th);
  }

  function drawRoomWalls(ctx, sx, sy, room) {
    if (room.outdoor || room.label === "Backyard" || room.label === "Front Yard") {
      if (room.street) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, room.w - 2, room.h - 2);
        return;
      }
      ctx.strokeStyle = "rgba(46,125,50,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, room.w - 2, room.h - 2);
      return;
    }

    const wall = room.wall;
    const wallG = ctx.createLinearGradient(sx, sy, sx + room.w, sy + room.h);
    wallG.addColorStop(0, shadeColor(wall, 0.1));
    wallG.addColorStop(0.5, wall);
    wallG.addColorStop(1, shadeColor(wall, -0.12));
    ctx.fillStyle = wallG;
    ctx.fillRect(sx + 12, sy + 12, room.w - 24, room.h - 24);

    for (let i = 0; i < Math.floor(room.w / 48); i++) {
      const wx = sx + 16 + i * 48;
      ctx.fillStyle = `rgba(0,0,0,${0.012 + (i % 3) * 0.008})`;
      ctx.fillRect(wx, sy + 14, 1, room.h - 28);
    }

    ctx.fillStyle = shadeColor(wall, 0.06);
    ctx.fillRect(sx, sy, room.w, 12);
    ctx.fillRect(sx, sy, 12, room.h);
    ctx.fillStyle = shadeColor(wall, -0.14);
    ctx.fillRect(sx + room.w - 10, sy, 10, room.h);
    if (room.door && room.door.side === "bottom") {
      const doorW = room.door.w || 64;
      const doorX = sx + room.w * (room.door.cx ?? 0.5) - doorW / 2;
      ctx.fillRect(sx, sy + room.h - 10, doorX - sx, 10);
      ctx.fillRect(doorX + doorW, sy + room.h - 10, sx + room.w - (doorX + doorW), 10);
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(sx + 8, sy + room.h - 16, doorX - sx - 4, 8);
      ctx.fillRect(doorX + doorW + 4, sy + room.h - 16, sx + room.w - (doorX + doorW) - 12, 8);
    } else {
      ctx.fillRect(sx, sy + room.h - 10, room.w, 10);
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(sx + 8, sy + room.h - 16, room.w - 16, 8);
    }
    const baseG = ctx.createLinearGradient(sx, sy + room.h - 20, sx, sy + room.h);
    baseG.addColorStop(0, "#efebe9");
    baseG.addColorStop(1, "#bcaaa4");
    ctx.fillStyle = baseG;
    if (room.door && room.door.side === "bottom") {
      const doorW = room.door.w || 64;
      const doorX = sx + room.w * (room.door.cx ?? 0.5) - doorW / 2;
      ctx.fillRect(sx + 8, sy + room.h - 18, doorX - sx - 4, 3);
      ctx.fillRect(doorX + doorW + 4, sy + room.h - 18, sx + room.w - (doorX + doorW) - 12, 3);
    } else {
      ctx.fillRect(sx + 8, sy + room.h - 18, room.w - 16, 3);
    }
    ctx.strokeStyle = "rgba(62,39,35,0.15)";
    ctx.lineWidth = 0.8;
    if (room.door && room.door.side === "bottom") {
      const doorW = room.door.w || 64;
      const doorX = sx + room.w * (room.door.cx ?? 0.5) - doorW / 2;
      ctx.strokeRect(sx + 8, sy + room.h - 18, doorX - sx - 4, 3);
      ctx.strokeRect(doorX + doorW + 4, sy + room.h - 18, sx + room.w - (doorX + doorW) - 12, 3);
    } else {
      ctx.strokeRect(sx + 8, sy + room.h - 18, room.w - 16, 3);
    }

    ctx.fillStyle = shadeColor(wall, 0.08);
    ctx.fillRect(sx, sy, room.w, 6);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(sx + 10, sy + 1, room.w - 20, 2);

    if (room.label !== "Backyard" && room.label !== "Front Yard" && !room.outdoor) {
      drawCeilingLight(ctx, sx + room.w * 0.5, sy + 12, room);
      drawWindowLight(ctx, sx + room.w * 0.78, sy + 16);
    }
  }

  function drawCeilingLight(ctx, lx, ly, room) {
    if (lx < -100 || lx > ctx.canvas.width + 100) return;
    const flicker = 0.88 + Math.sin(performance.now() * 0.002 + room.x) * 0.08;
    ctx.fillStyle = `rgba(255,248,220,${0.1 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(lx - 70, ly + 18);
    ctx.lineTo(lx + 70, ly + 18);
    ctx.lineTo(lx + 100, ly + room.h * 0.5);
    ctx.lineTo(lx - 100, ly + room.h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#eceff1";
    ctx.fillRect(lx - 12, ly - 5, 24, 7);
    ctx.fillStyle = `rgba(255,249,196,${0.95 * flicker})`;
    ctx.shadowColor = "#fff59d";
    ctx.shadowBlur = 16;
    ctx.fillRect(lx - 8, ly - 3, 16, 4);
    ctx.shadowBlur = 0;
  }

  function drawWindowLight(ctx, sx, sy) {
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(sx - 24, sy - 6, 48, 42);
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(sx - 22, sy - 4, 44, 38);
    ctx.fillStyle = "rgba(135,206,250,0.55)";
    ctx.fillRect(sx - 18, sy, 36, 28);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(sx - 16, sy + 2, 10, 24);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 18, sy, 36, 28);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + 28);
    ctx.moveTo(sx - 18, sy + 14);
    ctx.lineTo(sx + 18, sy + 14);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,248,220,0.18)";
    ctx.fillRect(sx - 28, sy - 2, 8, 32);
    ctx.fillRect(sx + 20, sy - 2, 8, 32);
    const g = ctx.createRadialGradient(sx, sy + 36, 8, sx, sy + 70, 160);
    g.addColorStop(0, "rgba(255,248,220,0.28)");
    g.addColorStop(0.5, "rgba(255,248,220,0.08)");
    g.addColorStop(1, "rgba(255,248,220,0)");
    ctx.fillStyle = g;
    ctx.fillRect(sx - 140, sy + 4, 280, 240);
  }

  function drawRealisticFridge(ctx, sx, sy, f) {
    const c = { top: "#eceff1", side: "#b0bec5", front: "#cfd8dc" };
    drawSoftShadow(ctx, sx + f.w / 2, sy + f.h + 12, f.w * 0.45, 12);
    draw3DBox(ctx, sx, sy, f.w, f.h, 14, c.top, c.side, c.front);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.strokeRect(sx + 10, sy + 20, f.w - 20, f.h - 32);
    ctx.fillStyle = "#90a4ae";
    ctx.fillRect(sx + f.w - 22, sy + 28, 4, 20);
    ctx.fillRect(sx + f.w - 22, sy + f.h * 0.55, 4, 16);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(sx + 14, sy + 24, f.w - 28, f.h * 0.38);
  }

  function drawRealisticCouch(ctx, sx, sy, f) {
    const c = { top: "#5d4037", side: "#3e2723", front: "#6d4c41" };
    drawSoftShadow(ctx, sx + f.w / 2, sy + f.h + 10, f.w * 0.5, 14);
    draw3DBox(ctx, sx, sy, f.w, f.h, 12, c.top, c.side, c.front);
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(sx + 10, sy + 18, f.w - 20, f.h * 0.35);
    ctx.fillStyle = shadeColor("#6d4c41", 0.05);
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(sx + 14 + i * ((f.w - 28) / 3), sy + 22, (f.w - 34) / 3, f.h * 0.28);
    }
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(sx + 6, sy + f.h * 0.52, 14, f.h * 0.38);
    ctx.fillRect(sx + f.w - 20, sy + f.h * 0.52, 14, f.h * 0.38);
  }

  function drawRealisticBed(ctx, sx, sy, f) {
    const c = { top: "#5e35b1", side: "#4527a0", front: "#7e57c2" };
    drawSoftShadow(ctx, sx + f.w / 2, sy + f.h + 10, f.w * 0.48, 12);
    draw3DBox(ctx, sx, sy, f.w, f.h, 16, c.top, c.side, c.front);
    ctx.fillStyle = "#ede7f6";
    ctx.fillRect(sx + 12, sy + 22, f.w - 24, f.h * 0.48);
    ctx.fillStyle = "#d1c4e9";
    ctx.fillRect(sx + 14, sy + 24, f.w - 28, f.h * 0.12);
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx + 16, sy + 28, 28, 18);
  }

  function drawRealisticTV(ctx, sx, sy, f) {
    const c = { top: "#263238", side: "#000", front: "#37474f" };
    draw3DBox(ctx, sx, sy, f.w, f.h, 8, c.top, c.side, c.front);
    ctx.fillStyle = "#000";
    ctx.fillRect(sx + 8, sy + 12, f.w - 16, f.h - 26);
    const tg = ctx.createLinearGradient(sx, sy, sx + f.w, sy + f.h);
    tg.addColorStop(0, "rgba(100,181,246,0.4)");
    tg.addColorStop(0.5, "rgba(66,165,245,0.25)");
    tg.addColorStop(1, "rgba(21,101,192,0.15)");
    ctx.fillStyle = tg;
    ctx.fillRect(sx + 10, sy + 14, f.w - 20, f.h - 30);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(sx + 12, sy + 16, f.w * 0.35, f.h * 0.25);
    ctx.fillStyle = "#455a64";
    ctx.fillRect(sx + f.w * 0.35, sy + f.h - 6, f.w * 0.3, 6);
  }

  function drawRealisticCar(ctx, sx, sy, f) {
    drawSoftShadow(ctx, sx + f.w / 2, sy + f.h + 8, f.w * 0.55, 10);
    ctx.fillStyle = "#546e7a";
    ctx.fillRect(sx + 8, sy + f.h * 0.45, f.w - 16, f.h * 0.4);
    ctx.fillStyle = "#78909c";
    ctx.beginPath();
    ctx.roundRect(sx + 12, sy + 18, f.w - 24, f.h * 0.42, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(135,206,250,0.35)";
    ctx.fillRect(sx + 20, sy + 24, f.w * 0.28, f.h * 0.2);
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.arc(sx + 30, sy + f.h - 8, 10, 0, Math.PI * 2);
    ctx.arc(sx + f.w - 30, sy + f.h - 8, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFoodBowl(ctx, sx, sy, f, foodEmoji, nearBowl, fatLabel) {
    drawSoftShadow(ctx, sx + f.w / 2, sy + f.h + 2, 26, 9);
    const bx = sx + f.w / 2;
    const by = sy + f.h * 0.55;
    const bowlG = ctx.createLinearGradient(bx - 30, by - 8, bx + 30, by + 8);
    bowlG.addColorStop(0, "#eeeeee");
    bowlG.addColorStop(0.5, "#fafafa");
    bowlG.addColorStop(1, "#bdbdbd");
    ctx.fillStyle = bowlG;
    ctx.beginPath();
    ctx.ellipse(bx, by, 32, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9e9e9e";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#8d6e63";
    ctx.beginPath();
    ctx.ellipse(bx, by + 1, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(foodEmoji, bx, by + 6);
    ctx.font = nearBowl ? "bold 10px system-ui,sans-serif" : "9px system-ui,sans-serif";
    ctx.fillStyle = nearBowl ? "#2e7d32" : "#5d4037";
    ctx.fillText(nearBowl ? `Eat! +${fatLabel}/bite` : "Food bowl", bx, sy - 4);
  }

  function drawRealisticProp(ctx, f, sx, sy) {
    if (f.emoji === "🧊") { drawRealisticFridge(ctx, sx, sy, f); return true; }
    if (f.emoji === "🛋️") { drawRealisticCouch(ctx, sx, sy, f); return true; }
    if (f.emoji === "🛏️") { drawRealisticBed(ctx, sx, sy, f); return true; }
    if (f.emoji === "📺") { drawRealisticTV(ctx, sx, sy, f); return true; }
    if (f.emoji === "🚗") { drawRealisticCar(ctx, sx, sy, f); return true; }
    if (f.emoji === "📦") {
      drawSoftShadow(ctx, sx + f.w / 2, sy + f.h + 6, f.w * 0.4, 8);
      draw3DBox(ctx, sx, sy, f.w, f.h, 10, "#a1887f", "#795548", "#8d6e63");
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + 14);
      ctx.lineTo(sx + f.w - 8, sy + f.h - 6);
      ctx.stroke();
      return true;
    }
    if (f.emoji === "🗑️") {
      drawSoftShadow(ctx, sx + f.w / 2, sy + f.h, f.w * 0.35, 6);
      ctx.fillStyle = "#607d8b";
      ctx.fillRect(sx + 8, sy + 12, f.w - 16, f.h - 16);
      ctx.fillStyle = "#455a64";
      ctx.fillRect(sx + 4, sy + 8, f.w - 8, 8);
      return true;
    }
    if (f.emoji === "🪴") {
      drawSoftShadow(ctx, sx + f.w / 2, sy + f.h, 16, 5);
      ctx.fillStyle = "#795548";
      ctx.fillRect(sx + f.w * 0.35, sy + f.h - 18, f.w * 0.3, 16);
      ctx.fillStyle = "#2e7d32";
      ctx.beginPath();
      ctx.arc(sx + f.w / 2, sy + f.h * 0.35, f.w * 0.28, 0, Math.PI * 2);
      ctx.fill();
      return true;
    }
    return false;
  }

  const SNACK_ART = {
    cookie: (ctx, sx, sy) => {
      ctx.fillStyle = "#d7ccc8";
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5d4037";
      for (let i = 0; i < 4; i++) ctx.fillRect(sx - 6 + i * 4, sy - 4 + (i % 2) * 5, 2, 2);
    },
    pizza: (ctx, sx, sy) => {
      ctx.fillStyle = "#ffcc80";
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy + 6);
      ctx.lineTo(sx + 12, sy + 6);
      ctx.lineTo(sx, sy - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c62828";
      ctx.beginPath();
      ctx.arc(sx - 4, sy, 3, 0, Math.PI * 2);
      ctx.arc(sx + 5, sy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    },
    donut: (ctx, sx, sy) => {
      ctx.fillStyle = "#ffab91";
      ctx.beginPath();
      ctx.arc(sx, sy, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fce4ec";
      ctx.fillRect(sx - 8, sy - 12, 16, 4);
    },
    fries: (ctx, sx, sy) => {
      ctx.fillStyle = "#ef6c00";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(sx - 10 + i * 4, sy - 8 - (i % 2) * 3, 3, 14);
      }
      ctx.fillStyle = "#c62828";
      ctx.fillRect(sx - 12, sy + 4, 24, 8);
    },
    sandwich: (ctx, sx, sy) => {
      ctx.fillStyle = "#ffcc80";
      ctx.fillRect(sx - 12, sy - 4, 24, 6);
      ctx.fillStyle = "#558b2f";
      ctx.fillRect(sx - 10, sy - 2, 20, 3);
      ctx.fillStyle = "#d7ccc8";
      ctx.fillRect(sx - 12, sy + 2, 24, 6);
    },
    bacon: (ctx, sx, sy) => {
      ctx.strokeStyle = "#bf360c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx - 10, sy);
      ctx.quadraticCurveTo(sx, sy - 6, sx + 10, sy + 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    burger: (ctx, sx, sy) => {
      ctx.fillStyle = "#d7ccc8";
      ctx.beginPath();
      ctx.ellipse(sx, sy + 5, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#558b2f";
      ctx.fillRect(sx - 10, sy - 1, 20, 3);
      ctx.fillStyle = "#c62828";
      ctx.fillRect(sx - 11, sy - 5, 22, 4);
      ctx.fillStyle = "#ffcc80";
      ctx.beginPath();
      ctx.ellipse(sx, sy - 8, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    chip: (ctx, sx, sy) => {
      ctx.fillStyle = "#ffca28";
      ctx.beginPath();
      ctx.ellipse(sx, sy, 10, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f57f17";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    default: (ctx, sx, sy, emoji) => {
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(emoji, sx, sy + 6);
    },
  };

  function drawSnack(ctx, s, camX, camY, snackFatFn) {
    s.bob += 0.04;
    const sx = s.x - camX;
    const sy = s.y - camY + Math.sin(s.bob) * 2;
    if (sx < -40 || sx > ctx.canvas.width + 40 || sy < -40 || sy > ctx.canvas.height + 40) return;

    const dist = Math.hypot(s.x - (camX + ctx.canvas.width * 0.5), s.y - (camY + ctx.canvas.height * 0.52));
    if (dist < 120) {
      ctx.fillStyle = "rgba(255,193,7,0.15)";
      ctx.beginPath();
      ctx.arc(sx, sy, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    drawSoftShadow(ctx, sx, sy + 7, 15, 5);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(sx, sy + 6, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = "rgba(255,193,7,0.45)";
    ctx.shadowBlur = dist < 120 ? 14 : 6;
    const key = s.name.toLowerCase();
    if (key.includes("cookie")) SNACK_ART.cookie(ctx, sx, sy);
    else if (key.includes("pizza")) SNACK_ART.pizza(ctx, sx, sy);
    else if (key.includes("donut")) SNACK_ART.donut(ctx, sx, sy);
    else if (key.includes("fries")) SNACK_ART.fries(ctx, sx, sy);
    else if (key.includes("sandwich")) SNACK_ART.sandwich(ctx, sx, sy);
    else if (key.includes("bacon")) SNACK_ART.bacon(ctx, sx, sy);
    else if (key.includes("burger") || key.includes("cheese")) SNACK_ART.burger(ctx, sx, sy);
    else if (key.includes("chip") || key.includes("crisp")) SNACK_ART.chip(ctx, sx, sy);
    else SNACK_ART.default(ctx, sx, sy, s.emoji);
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(sx - 4, sy - 4, 4, 2, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 8px system-ui,sans-serif";
    ctx.fillStyle = "rgba(62,39,35,0.75)";
    ctx.textAlign = "center";
    ctx.fillText("+" + snackFatFn(s.fat), sx, sy + 18);
  }

  function drawDogTopDown(ctx, opts) {
    const {
      wx,
      wy,
      fat,
      breed,
      facing,
      munch,
      moving,
      animT,
      worldToScreen,
      breeds,
      dogScaleFn,
      forceScreenCenter,
      viewW,
      viewH,
      screenFillFat,
    } = opts;
    const screenFill = screenFillFat && fat >= screenFillFat && forceScreenCenter;
    const s =
      screenFill && viewW && viewH
        ? { x: viewW * 0.5, y: viewH * 0.52 }
        : worldToScreen(wx, wy);
    const b = breeds[breed] || breeds.golden;
    const sc = dogScaleFn(fat) * 0.62;
    const round = screenFill ? 1.85 : Math.min(1, fat / 5000);

    drawSoftShadow(ctx, s.x, s.y + 16, 30 + round * 14, 12 + round * 5);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(sc * facing, sc);

    const wob = munch ? Math.sin(animT * 18) * 2.5 : moving ? Math.sin(animT * 14) * 1.8 : Math.sin(animT * 4) * 0.4;
    const jiggle = moving ? Math.sin(animT * 16) * Math.min(3.5, dogScaleFn(fat) * 0.9) : 0;
    const legPhase = moving ? Math.sin(animT * 14) * 5 : 0;

    const bodyRx = (breed === "corgi" ? 26 : 24) + round * 14;
    const bodyRy = (breed === "corgi" ? 20 : 18) + round * 16;
    const bodyG = ctx.createRadialGradient(-5, -3, 3, wob, 0, bodyRx);
    bodyG.addColorStop(0, shadeColor(b.fur, 0.14));
    bodyG.addColorStop(0.55, b.fur);
    bodyG.addColorStop(1, shadeColor(b.fur, -0.12));
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(wob + jiggle, 2, bodyRx, bodyRy, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.04 + (i % 2) * 0.02})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-bodyRx * 0.6 + i * 4, -bodyRy * 0.3);
      ctx.quadraticCurveTo(-bodyRx * 0.2 + i * 3, bodyRy * 0.2, bodyRx * 0.4 + i * 2, bodyRy * 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = shadeColor(b.ear, -0.12);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (b.belly) {
      ctx.fillStyle = b.belly;
      ctx.beginPath();
      ctx.ellipse(wob * 0.4, 4, bodyRx * 0.55, bodyRy * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const headY = breed === "corgi" ? -12 : -16;
    ctx.fillStyle = shadeColor(b.fur, 0.08);
    ctx.beginPath();
    ctx.ellipse(-4 * facing + wob * 0.3, headY, 11 + round * 3, 10 + round * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.ear;
    if (breed === "husky") {
      ctx.beginPath();
      ctx.moveTo(-14 * facing, headY - 8);
      ctx.lineTo(-6 * facing, headY - 4);
      ctx.lineTo(-10 * facing, headY + 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4 * facing, headY - 8);
      ctx.lineTo(12 * facing, headY - 4);
      ctx.lineTo(8 * facing, headY + 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-12 * facing, headY - 6, 5, 0, Math.PI * 2);
      ctx.arc(2 * facing, headY - 6, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-8 * facing, headY - 1, 3.2, 0, Math.PI * 2);
    ctx.arc(-2 * facing, headY - 1, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(-8 * facing, headY - 0.5, 1.6, 0, Math.PI * 2);
    ctx.arc(-2 * facing, headY - 0.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = b.nose;
    ctx.beginPath();
    ctx.arc(-4 * facing, headY + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(-5 * facing, headY + 3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    if (munch) {
      ctx.fillStyle = "#ef5350";
      ctx.beginPath();
      ctx.arc(-4 * facing, headY + 8, 5, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = "#ffcdd2";
      ctx.beginPath();
      ctx.arc(-2 * facing, headY + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#ef9a9a";
      ctx.beginPath();
      ctx.ellipse(-4 * facing, headY + 7, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#c62828";
    ctx.fillRect(-10 * facing, headY + 2, 12, 3);
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(-4 * facing, headY + 4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shadeColor(b.ear, -0.05);
    const legLen = breed === "corgi" ? 5 : 9;
    ctx.fillRect(-8 + legPhase * 0.3, 14, 5, legLen);
    ctx.fillRect(2 - legPhase * 0.3, 14, 5, legLen);

    ctx.strokeStyle = b.ear;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bodyRx * 0.7, 4);
    ctx.quadraticCurveTo(bodyRx + 8, -2 + Math.sin(animT * 8) * 6, bodyRx * 0.85, -10);
    ctx.stroke();

    ctx.restore();
  }

  function drawDogSide(ctx, x, y, fat, breed, facing, munch, animT, breeds, dogScaleFn) {
    const b = breeds[breed] || breeds.golden;
    const s = dogScaleFn(fat);
    const round = Math.min(1, fat / 5000);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, s);
    const wobble = munch ? Math.sin(animT * 20) * 0.04 : 0;
    ctx.rotate(wobble);

    drawSoftShadow(ctx, 0, 38, 42 + round * 20, 14);

    const bodyG = ctx.createRadialGradient(-8, 0, 8, 0, 12, 48);
    bodyG.addColorStop(0, shadeColor(b.fur, 0.12));
    bodyG.addColorStop(0.6, b.fur);
    bodyG.addColorStop(1, shadeColor(b.fur, -0.15));
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, 12, 40 + round * 22, 30 + round * 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shadeColor(b.ear, -0.1);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = b.fur;
    ctx.beginPath();
    ctx.arc(0, -24, 22 + round * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = b.ear;
    ctx.beginPath();
    ctx.ellipse(-16, -40, 8, 14, -0.4, 0, Math.PI * 2);
    ctx.ellipse(16, -40, 8, 14, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-8, -26, 5, 0, Math.PI * 2);
    ctx.arc(8, -26, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(-7, -25, 2.5, 0, Math.PI * 2);
    ctx.arc(9, -25, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.nose;
    ctx.beginPath();
    ctx.arc(0, -18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(-1.5, -19.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c62828";
    ctx.fillRect(-14, -14, 28, 4);
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(0, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    if (munch) {
      ctx.fillStyle = "#c62828";
      ctx.beginPath();
      ctx.arc(0, -10, 8, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.strokeStyle = b.nose;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -14, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    ctx.strokeStyle = b.ear;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(38, 8);
    ctx.quadraticCurveTo(52, -4 + Math.sin(animT * 8) * 8, 46, -20);
    ctx.stroke();

    ctx.fillStyle = shadeColor(b.ear, -0.05);
    for (let i = -1; i <= 1; i += 2) {
      ctx.fillRect(-18 * i - 6, 32, 10, 14);
      ctx.fillRect(8 * i - 4, 32, 10, 14);
    }

    ctx.restore();
  }

  function drawAmbientGrain(ctx, w, h, animT) {
    for (let i = 0; i < 220; i++) {
      const gx = (i * 173 + Math.floor(animT * 50)) % w;
      const gy = (i * 97 + Math.floor(animT * 35)) % h;
      ctx.fillStyle = `rgba(255,255,255,${0.012 + (i % 4) * 0.007})`;
      ctx.fillRect(gx, gy, 1, 1);
    }
    ctx.fillStyle = "rgba(255,248,220,0.02)";
    ctx.fillRect(0, 0, w, h * 0.15);
  }

  function drawHomePostFX(ctx, w, h, animT, focusX, focusY) {
    const warm = ctx.createLinearGradient(0, 0, w, h);
    warm.addColorStop(0, "rgba(255,210,140,0.1)");
    warm.addColorStop(0.5, "rgba(255,200,120,0.04)");
    warm.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);

    const fog = ctx.createRadialGradient(
      focusX, focusY, Math.min(w, h) * 0.1,
      focusX, focusY, Math.max(w, h) * 0.75
    );
    fog.addColorStop(0, "rgba(60,45,35,0)");
    fog.addColorStop(0.55, "rgba(40,30,25,0)");
    fog.addColorStop(1, "rgba(20,15,12,0.42)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);

    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.08, w / 2, h / 2, h * 0.88);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.65, "rgba(0,0,0,0.18)");
    vig.addColorStop(1, "rgba(0,0,0,0.52)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,80,80,0.01)";
    ctx.fillRect(1, 0, w, h);
    ctx.fillStyle = "rgba(80,140,255,0.01)";
    ctx.fillRect(-1, 0, w, h);
    ctx.restore();

    drawAmbientGrain(ctx, w, h, animT);
  }

  window.FSSprites = {
    shadeColor,
    drawSoftShadow,
    draw3DBox,
    drawFloorTile,
    drawRoomWalls,
    drawRealisticProp,
    drawFoodBowl,
    drawSnack,
    drawDogTopDown,
    drawDogSide,
    drawAmbientGrain,
    drawHomePostFX,
  };
})();
