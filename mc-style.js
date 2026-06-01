(function () {
  "use strict";

  const PX = 4;

  const TEX = {
    grass: ["#588038", "#6d9c3c", "#4e7028", "#3f5c20", "#7db842"],
    grass_side: ["#8b6914", "#735a12", "#5c4710"],
    dirt: ["#8b6914", "#735a12", "#5c4710", "#4a380c"],
    stone: ["#808080", "#696969", "#585858", "#484848"],
    cobble: ["#727272", "#626262", "#525252", "#828282"],
    sand: ["#dbd3a0", "#c9b878", "#b8a860", "#ece4b0"],
    water: ["#3f76e4", "#3570de", "#2f68d4", "#285ec8"],
    lava: ["#d06018", "#b84808", "#983808", "#f07028"],
    snow: ["#f8f8f8", "#ececec", "#ffffff", "#dcdcdc"],
    ice: ["#aadaff", "#99cfff", "#88c4ff", "#b8e4ff"],
    planks: ["#9c7a4a", "#85653c", "#745630", "#a88850"],
    leaves: ["#3a7a2a", "#4a9038", "#2d6018", "#5aa040"],
    log: ["#6b4423", "#5a3818", "#4a2c10"],
    netherrack: ["#612626", "#502020", "#701818", "#802828"],
    brick: ["#966766", "#855656", "#744646", "#a87878"],
    wool: ["#e0e0e0", "#c8c8c8", "#b0b0b0"],
  };

  function h(col, row, salt) {
    return ((col * 73856093) ^ (row * 19349663) ^ (salt * 83492791)) >>> 0;
  }

  function blockRect(ctx, x, y, w, ht, color, outline) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(ht));
    if (outline !== false) {
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(ht));
    }
  }

  function fillFlatTile(ctx, x, y, size, texKey, col, row, tick) {
    const pal = TEX[texKey] || TEX.grass;
    const cells = Math.max(1, Math.floor(size / PX));
    const pw = size / cells;

    for (let cy = 0; cy < cells; cy++) {
      for (let cx = 0; cx < cells; cx++) {
        let color;
        if (texKey === "grass" && cy >= cells - 1) {
          color = TEX.grass_side[h(col + cx, row + cy, 9) % TEX.grass_side.length];
        } else if (texKey === "water") {
          const pi = (h(col + cx, row + cy, 3) + Math.floor((tick || 0) * 1.5)) % pal.length;
          color = pal[pi];
        } else {
          color = pal[h(col * 3 + cx, row * 5 + cy, texKey.length) % pal.length];
        }
        ctx.fillStyle = color;
        ctx.fillRect(x + cx * pw, y + cy * pw, pw + 0.5, pw + 0.5);
      }
    }

    if (texKey === "grass" && h(col, row, 55) % 11 === 0) {
      drawTallGrass(ctx, x + size * 0.5, y + size * 0.45, size);
    }
  }

  function drawTallGrass(ctx, cx, cy, size) {
    const s = Math.max(6, size * 0.28);
    ctx.fillStyle = "#5ea038";
    blockRect(ctx, cx - 1, cy - s, 2, s * 2, "#5ea038", false);
    blockRect(ctx, cx - s, cy - 1, s * 2, 2, "#6bab42", false);
  }

  function biomeToTex(biome, cell) {
    if (cell === "water" || cell === "void") return "water";
    if (cell === "lava") return "lava";
    if (cell === "sand") return "sand";
    if (cell === "cloud") return "snow";
    if (biome === "cave") return "stone";
    if (biome === "ice") return "snow";
    if (biome === "volcano" || biome === "lavazone") return "netherrack";
    if (biome === "ocean") return "sand";
    return "grass";
  }

  function roomFloorTex(label, floorType) {
    if (floorType === "grass") return "grass";
    if (floorType === "tile" || label === "Kitchen" || label === "Garage") return "stone";
    if (floorType === "concrete") return "cobble";
    if (floorType === "carpet") return "wool";
    if (label === "Backyard") return "grass";
    return "planks";
  }

  function drawSky(ctx, w, h, biome, tick) {
    if (biome === "cave" || biome === "hub") {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 3 ? "#222" : "#1e1e1e";
        ctx.fillRect((i * 47) % w, (i * 31) % h, 4, 4);
      }
      return;
    }
    if (biome === "volcano" || biome === "lavazone") {
      for (let y = 0; y < h; y += 4) {
        const t = y / h;
        ctx.fillStyle = `rgb(${70 + Math.floor(t * 80)},${18 + Math.floor(t * 12)},${8})`;
        ctx.fillRect(0, y, w, 4);
      }
      return;
    }
    if (biome === "ice") {
      for (let y = 0; y < h; y += 4) {
        const t = y / h;
        ctx.fillStyle = `rgb(${180 + Math.floor(t * 30)},${210 + Math.floor(t * 20)},${240})`;
        ctx.fillRect(0, y, w, 4);
      }
      return;
    }
    for (let y = 0; y < h; y += 4) {
      const t = y / h;
      const r = 118 + Math.floor(t * 58);
      const g = 165 + Math.floor(t * 18);
      const b = 255 - Math.floor(t * 28);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, w, 4);
    }
    const sunX = Math.round(w * 0.82);
    const sunY = Math.round(h * 0.1);
    blockRect(ctx, sunX - 10, sunY - 10, 20, 20, "#f8f078", false);
    blockRect(ctx, sunX - 6, sunY - 6, 8, 8, "#fafaba", false);
    for (let i = 0; i < 6; i++) {
      const cx = Math.round(((i * 110 + (tick || 0) * 0.6) % (w + 100)) - 50);
      const cy = 24 + i * 20;
      blockRect(ctx, cx, cy, 28, 8, "#ffffff", false);
      blockRect(ctx, cx + 10, cy - 8, 22, 8, "#f0f0f0", false);
      blockRect(ctx, cx + 22, cy, 14, 8, "#ffffff", false);
    }
  }

  function drawOakTopDown(ctx, x, y, tileSize) {
    const cx = x + tileSize / 2;
    const cy = y + tileSize / 2;
    blockRect(ctx, cx - 3, cy - 2, 6, 12, TEX.log[0], false);
    blockRect(ctx, cx - tileSize * 0.38, cy - tileSize * 0.42, tileSize * 0.76, tileSize * 0.55, TEX.leaves[1], false);
    blockRect(ctx, cx - tileSize * 0.28, cy - tileSize * 0.52, tileSize * 0.56, tileSize * 0.35, TEX.leaves[0], false);
    blockRect(ctx, cx - 8, cy - tileSize * 0.35, 16, 10, TEX.leaves[2], false);
  }

  function drawBlockyRock(ctx, x, y, tileSize) {
    const cx = x + tileSize / 2;
    const cy = y + tileSize / 2;
    blockRect(ctx, cx - 12, cy - 4, 24, 16, TEX.stone[1]);
    blockRect(ctx, cx - 10, cy - 10, 14, 10, TEX.stone[0]);
    blockRect(ctx, cx + 2, cy + 2, 10, 8, TEX.stone[2]);
  }

  function drawBlockyDragon(ctx, x, y, colors, facing, size, tick) {
    const s = size;
    const f = facing || 1;
    const flap = Math.sin((tick || 0) * 2) * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f, 1);
    blockRect(ctx, -s * 0.45, s * 0.38, s * 0.95, s * 0.12, "rgba(0,0,0,0.35)", false);
    blockRect(ctx, -s * 0.58, -s * 0.2 + flap, s * 0.32, s * 0.22, colors.wing || colors.body);
    blockRect(ctx, s * 0.12, -s * 0.2 - flap, s * 0.32, s * 0.22, colors.wing || colors.body);
    blockRect(ctx, -s * 0.38, -s * 0.08, s * 0.58, s * 0.42, colors.body);
    blockRect(ctx, -s * 0.28, s * 0.06, s * 0.38, s * 0.28, colors.belly || colors.body);
    blockRect(ctx, s * 0.12, -s * 0.22, s * 0.32, s * 0.3, colors.body);
    blockRect(ctx, s * 0.32, -s * 0.14, s * 0.1, s * 0.1, colors.eye || "#ffff55");
    blockRect(ctx, s * 0.36, -s * 0.12, s * 0.05, s * 0.05, "#111", false);
    blockRect(ctx, -s * 0.58, s * 0.08, s * 0.22, s * 0.14, colors.body);
    ctx.restore();
  }

  function drawBlockyTrainer(ctx, x, y, facing, walkPhase, moving) {
    const f = facing || 1;
    const leg = moving ? Math.sin((walkPhase || 0) * 10) * 3 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f, 1);
    blockRect(ctx, -8, 10, 16, 5, "rgba(0,0,0,0.35)", false);
    blockRect(ctx, -4 + leg * 0.3, 6, 4, 8, "#2d2d2d", false);
    blockRect(ctx, 1 - leg * 0.3, 6, 4, 8, "#2d2d2d", false);
    blockRect(ctx, -7, -2, 14, 10, "#1565c0");
    blockRect(ctx, -8, 0, 4, 8, "#1565c0");
    blockRect(ctx, 5, 0, 4, 8, "#1565c0");
    blockRect(ctx, -1, -2, 2, 10, "#ffc107", false);
    blockRect(ctx, -5, -14, 10, 10, "#c68642", false);
    blockRect(ctx, -6, -18, 12, 5, "#4a2800", false);
    blockRect(ctx, -2, -16, 4, 4, "#ffffff", false);
    blockRect(ctx, -4, -12, 2, 2, "#111", false);
    blockRect(ctx, 2, -12, 2, 2, "#111", false);
    ctx.restore();
  }

  function drawBlockySlime(ctx, x, y, size, accent) {
    const s = size;
    blockRect(ctx, x - s * 0.5, y + s * 0.35, s, s * 0.12, "rgba(0,0,0,0.35)", false);
    blockRect(ctx, x - s * 0.48, y - s * 0.2, s * 0.96, s * 0.58, accent || "#9c27b0");
    blockRect(ctx, x - s * 0.35, y - s * 0.05, s * 0.7, s * 0.35, "#ce93d8", false);
    blockRect(ctx, x + s * 0.05, y - s * 0.08, s * 0.18, s * 0.14, "#fff");
    blockRect(ctx, x + s * 0.12, y - s * 0.06, s * 0.08, s * 0.08, accent || "#7b1fa2", false);
    blockRect(ctx, x + s * 0.16, y - s * 0.04, s * 0.04, s * 0.04, "#111", false);
  }

  function drawBlockyHuman(ctx, x, y, shirtColor, facing, moving, walkPhase, skinTone, hairTone) {
    const f = facing || 1;
    const leg = moving ? Math.sin((walkPhase || 0) * 9) * 4 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f, 1);
    blockRect(ctx, -10, 12, 20, 6, "rgba(0,0,0,0.35)", false);
    blockRect(ctx, -5 + leg * 0.35, 8, 4, 9, "#37474f", false);
    blockRect(ctx, 2 - leg * 0.35, 8, 4, 9, "#37474f", false);
    blockRect(ctx, -9, -2, 18, 12, "#eceff1");
    blockRect(ctx, -7, 0, 14, 10, shirtColor || "#1565c0");
    blockRect(ctx, -1, -2, 2, 12, "#cfd8dc", false);
    blockRect(ctx, -6, -12, 12, 10, skinTone || "#c68642", false);
    blockRect(ctx, -7, -16, 14, 5, hairTone || "#3e2723", false);
    blockRect(ctx, -4, -10, 2, 2, "#111", false);
    blockRect(ctx, 2, -10, 2, 2, "#111", false);
    ctx.restore();
  }

  function drawBlockySnakeSegment(ctx, x, y, w, h, color) {
    blockRect(ctx, x - w / 2, y - h / 2, w, h, color);
    blockRect(ctx, x - w / 4, y - h / 4, w / 5, h / 5, "rgba(255,255,255,0.35)", false);
  }

  function drawBlockyFood(ctx, x, y, r, color) {
    const s = r * 2;
    blockRect(ctx, x - s / 2, y - s / 2, s, s, color || "#e53935");
    blockRect(ctx, x - s / 4, y - s / 4, s / 4, s / 4, "rgba(255,255,255,0.5)", false);
  }

  function drawBrickWall(ctx, x, y, w, h, col, row) {
    fillFlatTile(ctx, x, y, w, "stone", col, row, 0);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    for (let by = 0; by < h; by += 8) {
      const off = (Math.floor(by / 8) + col) % 2 ? 8 : 0;
      for (let bx = off; bx < w; bx += 16) {
        ctx.strokeRect(x + bx + 0.5, y + by + 0.5, 16, 8);
      }
    }
  }

  window.MCStyle = {
    PX,
    TEX,
    blockRect,
    fillFlatTile,
    drawTallGrass,
    biomeToTex,
    roomFloorTex,
    drawSky,
    drawOakTopDown,
    drawBlockyRock,
    drawBlockyDragon,
    drawBlockyTrainer,
    drawBlockySlime,
    drawBlockyHuman,
    drawBlockySnakeSegment,
    drawBlockyFood,
    drawBrickWall,
  };
})();
