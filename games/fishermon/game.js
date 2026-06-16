(function () {
  "use strict";

  const SAVE_KEY = "fishermon";
  const WORLD_W = 3000;
  const WORLD_H = 3000;
  const WORLD_MARGIN = 28;
  const WORLD_EDGE = 36;
  const PORTAL_ROW_H = 1;
  const PLAYABLE_H = WORLD_H - PORTAL_ROW_H;
  const TERRAIN_TILE = 20;
  const PLAYER_R = 12;
  const PLAYER_SPEED = 480;

  const ISLAND = {
    cx: WORLD_W / 2,
    cy: PLAYABLE_H * 0.4,
    rx: 568,
    ry: 416,
    pondRx: 140,
    pondRy: 112,
  };

  function islandPoint(fx, fy) {
    return { x: ISLAND.cx + ISLAND.rx * fx, y: ISLAND.cy + ISLAND.ry * fy };
  }

  const FEED_STATION = islandPoint(-0.43, -0.27);
  const BREED_STATION = islandPoint(0.43, -0.27);
  const BUY_SHOP = islandPoint(-0.52, -0.47);
  const SELL_SHOP = islandPoint(0.52, -0.47);
  const DOCK_TILE = 20;
  const DOCK_W_TILES = 2;
  const DOCK_L_TILES = 5;
  const DOCK_W = DOCK_TILE * DOCK_W_TILES;
  const DOCK_L = DOCK_TILE * DOCK_L_TILES;
  const DOCKS = [
    { id: "north", facing: "north" },
    { id: "south", facing: "south" },
    { id: "east", facing: "east" },
    { id: "west", facing: "west" },
  ];
  const ISLAND_TREES = [
    [-0.66, -0.47], [-0.38, -0.67], [0.38, -0.66], [0.66, -0.47],
    [-0.48, 0.17], [0.48, 0.19], [-0.35, 0.52], [0.35, 0.53],
    [-0.75, 0.08], [0.75, 0.06], [-0.68, -0.67], [0.68, -0.68],
  ].map(([fx, fy]) => islandPoint(fx, fy));
  const ISLAND_SPAWN = islandPoint(0, 0.42);

  const ZONE_ISLAND = {
    cx: WORLD_W / 2,
    cy: PLAYABLE_H * 0.4,
    rx: 552,
    ry: 400,
  };

  function zonePoint(fx, fy) {
    return { x: ZONE_ISLAND.cx + ZONE_ISLAND.rx * fx, y: ZONE_ISLAND.cy + ZONE_ISLAND.ry * fy };
  }

  const ZONE_SPAWN = zonePoint(0, 0.38);

  const HORROR_ZONE_ID = 6;
  const HORROR_TREES = [
    [-0.66, -0.47], [-0.38, -0.67], [0.38, -0.66], [0.66, -0.47],
    [-0.48, 0.17], [0.48, 0.19], [-0.35, 0.52], [0.35, 0.53],
    [-0.75, 0.08], [0.75, 0.06], [-0.68, -0.67], [0.68, -0.68],
  ].map(([fx, fy]) => zonePoint(fx, fy));

  const ARCTIC_ZONE_ID = 4;
  const ARCTIC_ISLAND = {
    cx: WORLD_W / 2,
    cy: PLAYABLE_H * 0.4,
    rx: 552,
    ry: 400,
    pondRx: 152,
    pondRy: 120,
  };

  function arcticPoint(fx, fy) {
    return { x: ARCTIC_ISLAND.cx + ARCTIC_ISLAND.rx * fx, y: ARCTIC_ISLAND.cy + ARCTIC_ISLAND.ry * fy };
  }

  const ARCTIC_SPAWN = arcticPoint(0, 0.44);
  const ARCTIC_BUY_SHOP = arcticPoint(-0.48, -0.22);
  const ARCTIC_SELL_SHOP = arcticPoint(0.45, 0.18);
  const ARCTIC_TREES = [
    [-0.66, -0.47], [-0.38, -0.67], [0.38, -0.66], [0.66, -0.47],
    [-0.48, 0.17], [0.48, 0.19], [-0.35, 0.52], [0.35, 0.53],
    [-0.75, 0.08], [0.75, 0.06], [-0.68, -0.67], [0.68, -0.68],
  ].map(([fx, fy]) => arcticPoint(fx, fy));

  const DEPTHS_ZONE_ID = 3;
  const DEPTHS_ISLAND = { cx: WORLD_W / 2, cy: PLAYABLE_H * 0.4, rx: 528, ry: 384 };

  function depthsPoint(fx, fy) {
    return { x: DEPTHS_ISLAND.cx + DEPTHS_ISLAND.rx * fx, y: DEPTHS_ISLAND.cy + DEPTHS_ISLAND.ry * fy };
  }

  const DEPTHS_SPAWN = depthsPoint(0, 0.35);
  const DEPTHS_BUY_SHOP = depthsPoint(-0.45, -0.2);
  const DEPTHS_SELL_SHOP = depthsPoint(0.42, 0.15);
  const DEPTHS_CAVE = depthsPoint(0, -0.35);

  const LAVA_ZONE_ID = 2;
  const LAVA_ISLAND = { cx: WORLD_W / 2, cy: PLAYABLE_H * 0.38, rx: 512, ry: 368 };
  const LAVA_VOLCANO = {
    cx: LAVA_ISLAND.cx,
    cy: LAVA_ISLAND.cy - LAVA_ISLAND.ry * 0.18,
    rx: 168,
    ry: 136,
  };

  function lavaPoint(fx, fy) {
    return { x: LAVA_ISLAND.cx + LAVA_ISLAND.rx * fx, y: LAVA_ISLAND.cy + LAVA_ISLAND.ry * fy };
  }

  const LAVA_CAVE = {
    x: LAVA_VOLCANO.cx,
    y: LAVA_VOLCANO.cy - LAVA_VOLCANO.ry * 0.48,
  };
  const LAVA_SPAWN = lavaPoint(-0.06, 0.56);
  const LAVA_BUY_SHOP = lavaPoint(-0.55, 0.38);
  const LAVA_SELL_SHOP = lavaPoint(0.52, 0.35);
  const LAVA_BRIDGE_ANCHORS = [
    { x: LAVA_ISLAND.cx, y: LAVA_ISLAND.cy - LAVA_ISLAND.ry * 0.9 },
    { x: LAVA_ISLAND.cx, y: LAVA_ISLAND.cy + LAVA_ISLAND.ry * 0.9 },
    { x: LAVA_ISLAND.cx - LAVA_ISLAND.rx * 0.9, y: LAVA_ISLAND.cy },
    { x: LAVA_ISLAND.cx + LAVA_ISLAND.rx * 0.9, y: LAVA_ISLAND.cy },
  ];
  const LAVA_INTERIOR = {
    x1: Math.round(WORLD_W * 0.067),
    y1: Math.round(PLAYABLE_H * 0.094),
    x2: WORLD_W - Math.round(WORLD_W * 0.067),
    y2: PLAYABLE_H - Math.round(PLAYABLE_H * 0.12),
    spawn: { x: WORLD_W / 2, y: PLAYABLE_H - Math.round(PLAYABLE_H * 0.194) },
    exit: { x: WORLD_W / 2, y: Math.round(PLAYABLE_H * 0.174) },
  };
  const LAVA_POOLS = [
    { x: 0.2, y: 0.48, rx: 96, ry: 64 },
    { x: 0.48, y: 0.54, rx: 104, ry: 68 },
    { x: 0.76, y: 0.5, rx: 88, ry: 60 },
    { x: 0.32, y: 0.72, rx: 84, ry: 56 },
    { x: 0.66, y: 0.74, rx: 96, ry: 60 },
    { x: 0.14, y: 0.62, rx: 80, ry: 52 },
  ].map((p) => ({
    x: LAVA_INTERIOR.x1 + (LAVA_INTERIOR.x2 - LAVA_INTERIOR.x1) * p.x,
    y: LAVA_INTERIOR.y1 + (LAVA_INTERIOR.y2 - LAVA_INTERIOR.y1) * p.y,
    rx: p.rx,
    ry: p.ry,
  }));

  const INTERIOR_WALL = 78;
  function interiorPoint(bounds, fx, fy) {
    return {
      x: bounds.x1 + (bounds.x2 - bounds.x1) * fx,
      y: bounds.y1 + (bounds.y2 - bounds.y1) * fy,
    };
  }
  LAVA_INTERIOR.spawn = interiorPoint(LAVA_INTERIOR, 0.5, 0.88);
  LAVA_INTERIOR.exit = interiorPoint(LAVA_INTERIOR, 0.5, 0.14);

  const LAVA_PILLARS = [
    { fx: 0.28, fy: 0.38, r: 34 },
    { fx: 0.72, fy: 0.38, r: 34 },
    { fx: 0.35, fy: 0.62, r: 28 },
    { fx: 0.65, fy: 0.62, r: 28 },
  ].map((p) => ({ ...interiorPoint(LAVA_INTERIOR, p.fx, p.fy), r: p.r }));

  const DEPTHS_INTERIOR = {
    x1: Math.round(WORLD_W * 0.12),
    y1: Math.round(PLAYABLE_H * 0.12),
    x2: WORLD_W - Math.round(WORLD_W * 0.12),
    y2: PLAYABLE_H - Math.round(PLAYABLE_H * 0.08),
    spawn: { x: WORLD_W / 2, y: PLAYABLE_H - Math.round(PLAYABLE_H * 0.17) },
    exit: { x: WORLD_W / 2, y: Math.round(PLAYABLE_H * 0.19) },
  };
  const DEPTHS_ABYSS_POOLS = [
    { x: 0.5, y: 0.55, rx: 110, ry: 72 },
    { x: 0.22, y: 0.48, rx: 72, ry: 48 },
    { x: 0.78, y: 0.48, rx: 72, ry: 48 },
    { x: 0.35, y: 0.72, rx: 68, ry: 44 },
    { x: 0.65, y: 0.72, rx: 68, ry: 44 },
  ].map((p) => ({
    x: DEPTHS_INTERIOR.x1 + (DEPTHS_INTERIOR.x2 - DEPTHS_INTERIOR.x1) * p.x,
    y: DEPTHS_INTERIOR.y1 + (DEPTHS_INTERIOR.y2 - DEPTHS_INTERIOR.y1) * p.y,
    rx: p.rx,
    ry: p.ry,
  }));
  const DEPTHS_PILLARS = [
    { fx: 0.5, fy: 0.42, r: 38 },
    { fx: 0.22, fy: 0.58, r: 30 },
    { fx: 0.78, fy: 0.58, r: 30 },
    { fx: 0.38, fy: 0.28, r: 26 },
    { fx: 0.62, fy: 0.28, r: 26 },
  ].map((p) => ({ ...interiorPoint(DEPTHS_INTERIOR, p.fx, p.fy), r: p.r }));
  const DEPTHS_MINERALS = [
    { fx: 0.18, fy: 0.34, scale: 0.95, hue: 0 },
    { fx: 0.3, fy: 0.72, scale: 1.1, hue: 12 },
    { fx: 0.5, fy: 0.26, scale: 1.2, hue: -10 },
    { fx: 0.7, fy: 0.72, scale: 1.05, hue: 18 },
    { fx: 0.82, fy: 0.38, scale: 0.9, hue: -6 },
  ].map((m) => ({ ...interiorPoint(DEPTHS_INTERIOR, m.fx, m.fy), scale: m.scale, hue: m.hue }));
  const DEPTHS_PICKAXE_SHOP = interiorPoint(DEPTHS_INTERIOR, 0.5, 0.56);
  const DEPTHS_WALL = 68;

  const HURRICANE_ZONE_ID = 5;
  const HURRICANE = {
    cx: WORLD_W / 2,
    cy: PLAYABLE_H * 0.4,
    rx: 528,
    ry: 384,
    eyeRx: 168,
    eyeRy: 128,
    whiteRx: 1240,
    whiteRy: 1180,
  };

  function hurricanePoint(fx, fy) {
    return { x: HURRICANE.cx + HURRICANE.rx * fx, y: HURRICANE.cy + HURRICANE.ry * fy };
  }

  const HURRICANE_SPAWN = hurricanePoint(0, 0.42);
  const HURRICANE_BUY_SHOP = hurricanePoint(0.48, -0.27);
  const HURRICANE_SELL_SHOP = hurricanePoint(-0.42, 0.12);
  const HURRICANE_TREES = [
    [-0.62, -0.38], [-0.38, -0.62], [0.38, -0.6], [0.62, -0.38],
    [-0.48, 0.12], [0.48, 0.14], [-0.35, 0.48], [0.35, 0.5],
    [-0.68, 0.02], [0.68, 0.04],
  ].map(([fx, fy]) => hurricanePoint(fx, fy));

  const ZONE_BUY_SHOP = zonePoint(-0.48, -0.22);
  const ZONE_SELL_SHOP = zonePoint(0.5, 0.32);
  const CORAL_POND = {
    cx: ZONE_ISLAND.cx,
    cy: ZONE_ISLAND.cy,
    rx: 136,
    ry: 102,
  };
  const CENTER_POND_RX = 78;
  const CENTER_POND_RY = 52;
  const POND_FISH_PER_POND = 6;
  const POND_RESPAWN_MS = 5000;

  const BOATS = [
    {
      id: "dinghy",
      name: "Dinghy",
      emoji: "🚤",
      desc: "Starter skiff · +35% speed",
      cost: 3000,
      currency: "coins",
      speedMult: 1.35,
    },
    {
      id: "speedboat",
      name: "Speedboat",
      emoji: "🛥️",
      desc: "Fast hull · +60% speed",
      cost: 12000,
      currency: "coins",
      speedMult: 1.6,
    },
    {
      id: "pearlSloop",
      name: "Pearl Sloop",
      emoji: "⛵",
      desc: "Pearl sailboat · +80% speed",
      cost: 12,
      currency: "pearls",
      speedMult: 1.8,
    },
    {
      id: "mythicJet",
      name: "Mythic Jet",
      emoji: "🛳️",
      desc: "Legend craft · +100% speed",
      cost: 30,
      currency: "pearls",
      speedMult: 2,
    },
  ];

  function zoneFishShopPos(zone) {
    if (zone.isPier) return BUY_SHOP;
    if (zone.isLavaReef) return LAVA_BUY_SHOP;
    if (zone.isDepthsCave) return DEPTHS_BUY_SHOP;
    if (zone.isHurricane) return HURRICANE_BUY_SHOP;
    if (zone.isArctic) return ARCTIC_BUY_SHOP;
    return ZONE_BUY_SHOP;
  }

  function zoneSellShopPos(zone) {
    if (zone.isPier) return SELL_SHOP;
    if (zone.isLavaReef) return LAVA_SELL_SHOP;
    if (zone.isDepthsCave) return DEPTHS_SELL_SHOP;
    if (zone.isHurricane) return HURRICANE_SELL_SHOP;
    if (zone.isArctic) return ARCTIC_SELL_SHOP;
    return ZONE_SELL_SHOP;
  }

  function drawZoneFishShop(zone, animT) {
    if (zone.isLavaReef && state.lavaInterior) return;
    if (zone.isDepthsCave && state.depthsInterior) return;
    const buy = zoneFishShopPos(zone);
    const bs = worldToScreen(buy.x, buy.y);
    if (bs.x > -100 && bs.x < w + 100 && bs.y > -100 && bs.y < h + 60) {
      FMSprites.drawShopBuilding(ctx, bs.x, bs.y, "buy", animT);
      if (!zone.isPier) FMSprites.drawLabel(ctx, "🎣 Fish Shop", bs.x, bs.y - 18);
    }
    const sell = zoneSellShopPos(zone);
    const ss = worldToScreen(sell.x, sell.y);
    if (ss.x > -100 && ss.x < w + 100 && ss.y > -100 && ss.y < h + 60) {
      FMSprites.drawShopBuilding(ctx, ss.x, ss.y, "sell", animT);
      if (!zone.isPier) FMSprites.drawLabel(ctx, "💰 Sell Shop", ss.x, ss.y - 18);
    }
  }

  const FEED_COST = 10;
  const FEED_EXP = 28;
  const BREED_COST = 40;
  const RIDE_SPEED_MULT = 1.75;

  const LOADING_TIPS = [
    "Rare fish swim in deeper waters — explore every island!",
    "Upgrade your rod to reel in fish faster!",
    "Boats let you zoom around Fisher's Pier!",
    "Some fusion fish can be fused again for stronger teams!",
    "🌋 LAVA UPDATE OUT NOW — hunt mythic bosses in Lava Reef!",
    "🌀 Hurricane Despair — Lv 25 storms beyond the Arctic!",
    "👻 Horror Island — Lv 30 nightmares await the bravest fishers!",
  ];

  const ZONES = [
    {
      id: 0,
      name: "🏝️ Fisher's Island",
      mobLevel: 1,
      reqLevel: 1,
      isPier: true,
      floor: "#9ccc65",
      floorAlt: "#7cb342",
      decor: "island",
      skyTop: "#0288d1",
      skyBot: "#81d4fa",
      mobs: ["guppy", "bass", "clownfish"],
      bossType: "megalodon",
      bossColor: "#263238",
    },
    {
      id: 1,
      name: "🏝️ Coral Island",
      mobLevel: 5,
      reqLevel: 4,
      floor: "#00838f",
      floorAlt: "#006064",
      decor: "coral",
      skyTop: "#00acc1",
      skyBot: "#80deea",
      mobs: ["swordfish", "tuna", "angler"],
      bossType: "kraken",
      bossColor: "#4a148c",
    },
    {
      id: 2,
      name: "🌋 Lava Reef",
      mobLevel: 10,
      interiorMobLevel: 20,
      reqLevel: 8,
      isLavaReef: true,
      floor: "#4e342e",
      floorAlt: "#3e2723",
      decor: "lava",
      skyTop: "#bf360c",
      skyBot: "#ff8a65",
      mobs: ["hammerhead", "octopus", "manta"],
      interiorMobs: ["hammerhead", "octopus", "manta", "elGranMaja"],
      bossType: "elGranMaja",
      bossColor: "#bf360c",
    },
    {
      id: 3,
      name: "🌀 The Depths",
      mobLevel: 15,
      interiorMobLevel: 35,
      reqLevel: 12,
      isDepthsCave: true,
      floor: "#37474f",
      floorAlt: "#263238",
      decor: "depths",
      skyTop: "#0d1117",
      skyBot: "#263238",
      mobs: ["bloop", "seaEater", "elGranMaja"],
      interiorMobs: ["lavaFish"],
      bossType: "cursedSeaEater",
      bossColor: "#4a0000",
    },
    {
      id: 4,
      name: "❄️ Arctic Waters",
      mobLevel: 20,
      reqLevel: 16,
      isArctic: true,
      floor: "#546e7a",
      floorAlt: "#37474f",
      decor: "ice",
      skyTop: "#0277bd",
      skyBot: "#b3e5fc",
      mobs: ["frostRay", "narwhal", "leviathan"],
      bossType: "bloop",
      bossColor: "#0288d1",
    },
    {
      id: 5,
      name: "🌀 Hurricane Despair",
      mobLevel: 25,
      reqLevel: 22,
      floor: "#37474f",
      floorAlt: "#263238",
      decor: "hurricane",
      isHurricane: true,
      skyTop: "#37474f",
      skyBot: "#78909c",
      mobs: ["typhoonRay", "stormShark", "leviathan"],
      bossType: "hurricaneKraken",
      bossColor: "#263238",
    },
    {
      id: 6,
      name: "👻 Horror Island",
      mobLevel: 30,
      reqLevel: 28,
      floor: "#1a1a2e",
      floorAlt: "#0d0221",
      decor: "horror",
      skyTop: "#1a0a2e",
      skyBot: "#4a148c",
      mobs: ["phantomFish", "dreadSquid", "cursedSeaEater"],
      bossType: "nightmareLeviathan",
      bossColor: "#4a0000",
    },
  ];

  const FISH_TYPES = {
    guppy: { name: "Guppy", emoji: "🐟", color: "#4fc3f7", kind: "small", hp: 40, atk: 9, exp: 15, coins: 6, rx: 18, ry: 14, evolve: "neonGuppy", evolveLv: 8 },
    neonGuppy: { name: "Neon Guppy", emoji: "🐟", color: "#00bcd4", kind: "small", hp: 75, atk: 16, exp: 30, coins: 12, rx: 22, ry: 16 },
    bass: { name: "Bass", emoji: "🐠", color: "#66bb6a", kind: "mid", hp: 45, atk: 10, exp: 16, coins: 7, rx: 22, ry: 16, evolve: "largemouthBass", evolveLv: 10 },
    largemouthBass: { name: "Largemouth Bass", emoji: "🐠", color: "#388e3c", kind: "mid", hp: 80, atk: 15, exp: 28, coins: 11, rx: 26, ry: 18 },
    clownfish: { name: "Clownfish", emoji: "🤡", color: "#ff7043", kind: "small", hp: 35, atk: 8, exp: 14, coins: 6, rx: 16, ry: 14, evolve: "royalClown", evolveLv: 9 },
    royalClown: { name: "Royal Clownfish", emoji: "🤡", color: "#e64a19", kind: "small", hp: 68, atk: 14, exp: 26, coins: 10, rx: 20, ry: 16 },
    swordfish: { name: "Swordfish", emoji: "🗡️", color: "#5c6bc0", kind: "fast", hp: 55, atk: 14, exp: 20, coins: 9, rx: 28, ry: 16, evolve: "bladeSwordfish", evolveLv: 12 },
    bladeSwordfish: { name: "Blade Swordfish", emoji: "🗡️", color: "#3949ab", kind: "fast", hp: 95, atk: 22, exp: 38, coins: 14, rx: 32, ry: 18 },
    tuna: { name: "Tuna", emoji: "🐟", color: "#78909c", kind: "mid", hp: 70, atk: 12, exp: 22, coins: 8, rx: 24, ry: 18, evolve: "megaTuna", evolveLv: 11 },
    megaTuna: { name: "Mega Tuna", emoji: "🐟", color: "#455a64", kind: "mid", hp: 115, atk: 19, exp: 40, coins: 13, rx: 28, ry: 22 },
    angler: { name: "Anglerfish", emoji: "💡", color: "#7e57c2", kind: "deep", hp: 50, atk: 13, exp: 19, coins: 8, rx: 20, ry: 22, evolve: "abyssAngler", evolveLv: 10 },
    abyssAngler: { name: "Abyss Angler", emoji: "💡", color: "#512da8", kind: "deep", hp: 88, atk: 20, exp: 34, coins: 12, rx: 24, ry: 26 },
    hammerhead: { name: "Hammerhead", emoji: "🔨", color: "#607d8b", kind: "shark", hp: 85, atk: 15, exp: 24, coins: 10, rx: 26, ry: 20, evolve: "apexHammer", evolveLv: 13 },
    apexHammer: { name: "Apex Hammerhead", emoji: "🔨", color: "#37474f", kind: "shark", hp: 130, atk: 23, exp: 42, coins: 15, rx: 30, ry: 24 },
    octopus: { name: "Octopus", emoji: "🐙", color: "#ab47bc", kind: "deep", hp: 75, atk: 14, exp: 22, coins: 9, rx: 22, ry: 22, evolve: "giantOctopus", evolveLv: 12 },
    giantOctopus: { name: "Giant Octopus", emoji: "🐙", color: "#7b1fa2", kind: "deep", hp: 120, atk: 21, exp: 38, coins: 14, rx: 28, ry: 28 },
    manta: { name: "Manta Ray", emoji: "🪽", color: "#26a69a", kind: "float", hp: 90, atk: 13, exp: 25, coins: 10, rx: 30, ry: 22, evolve: "skyManta", evolveLv: 14 },
    skyManta: { name: "Sky Manta", emoji: "🪽", color: "#00897b", kind: "float", hp: 140, atk: 20, exp: 44, coins: 16, rx: 34, ry: 26 },
    bloop: { name: "Bloop", emoji: "👾", color: "#1a237e", kind: "legend", hp: 110, atk: 22, exp: 45, coins: 18, rx: 30, ry: 26 },
    seaEater: { name: "Sea Eater", emoji: "🐋", color: "#0277bd", kind: "legend", hp: 130, atk: 24, exp: 50, coins: 20, rx: 32, ry: 28, evolve: "alphaSeaEater", evolveLv: 18 },
    alphaSeaEater: { name: "Alpha Sea Eater", emoji: "🐋", color: "#01579b", kind: "legend", hp: 180, atk: 30, exp: 65, coins: 25, rx: 36, ry: 32 },
    elGranMaja: { name: "El Gran Maja", emoji: "🐙", color: "#bf360c", kind: "legend", hp: 140, atk: 26, exp: 52, coins: 22, rx: 34, ry: 30 },
    kraken: { name: "Kraken", emoji: "🦑", color: "#4a148c", kind: "mythic", hp: 200, atk: 32, exp: 80, coins: 30, rx: 38, ry: 34 },
    megalodon: { name: "Megalodon", emoji: "🦈", color: "#263238", kind: "mythic", hp: 220, atk: 35, exp: 90, coins: 35, rx: 40, ry: 30 },
    cursedSeaEater: { name: "Cursed Sea Eater", emoji: "💀", color: "#4a0000", kind: "mythic", hp: 250, atk: 38, exp: 100, coins: 40, rx: 38, ry: 32, cursed: true },
    frostRay: { name: "Frost Ray", emoji: "❄️", color: "#81d4fa", kind: "ice", hp: 100, atk: 18, exp: 35, coins: 14, rx: 28, ry: 22 },
    narwhal: { name: "Narwhal", emoji: "🦄", color: "#4fc3f7", kind: "ice", hp: 115, atk: 20, exp: 38, coins: 15, rx: 30, ry: 24 },
    leviathan: { name: "Leviathan", emoji: "🐉", color: "#0288d1", kind: "ice", hp: 160, atk: 28, exp: 55, coins: 22, rx: 36, ry: 28 },
    typhoonRay: { name: "Typhoon Ray", emoji: "🌀", color: "#607d8b", kind: "storm", hp: 145, atk: 25, exp: 50, coins: 19, rx: 32, ry: 26 },
    stormShark: { name: "Storm Shark", emoji: "🦈", color: "#455a64", kind: "storm", hp: 160, atk: 27, exp: 54, coins: 21, rx: 34, ry: 28 },
    hurricaneKraken: { name: "Hurricane Kraken", emoji: "🌀", color: "#263238", kind: "mythic", hp: 290, atk: 42, exp: 115, coins: 46, rx: 40, ry: 36 },
    phantomFish: { name: "Phantom Fish", emoji: "👻", color: "#7e57c2", kind: "horror", hp: 175, atk: 29, exp: 58, coins: 23, rx: 30, ry: 24 },
    dreadSquid: { name: "Dread Squid", emoji: "🦑", color: "#1a1a2e", kind: "horror", hp: 190, atk: 31, exp: 62, coins: 25, rx: 34, ry: 30 },
    nightmareLeviathan: { name: "Nightmare Leviathan", emoji: "💀", color: "#0d0221", kind: "mythic", hp: 330, atk: 46, exp: 135, coins: 52, rx: 42, ry: 38, cursed: true },
    fusionClown: { name: "Fusion Clown", emoji: "🧬", color: "#ff5722", kind: "fusion", hp: 95, atk: 18, exp: 38, coins: 14, rx: 24, ry: 18, hybrid: true },
    fusionHammer: { name: "Fusion Hammer", emoji: "🧬", color: "#455a64", kind: "fusion", hp: 130, atk: 22, exp: 45, coins: 16, rx: 28, ry: 22, hybrid: true },
    fusionInferno: { name: "Fusion Inferno", emoji: "🔥", color: "#ff3d00", kind: "fusion", hp: 200, atk: 30, exp: 70, coins: 28, rx: 34, ry: 28, hybrid: true },
    fusionAbyss: { name: "Fusion Abyss", emoji: "🌑", color: "#311b92", kind: "fusion", hp: 190, atk: 32, exp: 68, coins: 26, rx: 32, ry: 28, hybrid: true },
    fusionStorm: { name: "Fusion Storm", emoji: "⚡", color: "#546e8a", kind: "fusion", hp: 210, atk: 34, exp: 72, coins: 30, rx: 36, ry: 30, hybrid: true },
    fusionTitan: { name: "Fusion Titan", emoji: "👑", color: "#ffd700", kind: "fusion", hp: 250, atk: 38, exp: 85, coins: 35, rx: 38, ry: 32, hybrid: true },
    goldenBass: { name: "Golden Bass", emoji: "⭐", color: "#ffd54f", kind: "mid", hp: 70, atk: 14, exp: 35, coins: 20, rx: 24, ry: 18, rare: true },
    lavaFish: { name: "Lava Fish", emoji: "🔥", color: "#ff5722", kind: "lava", hp: 210, atk: 34, exp: 75, coins: 30, rx: 36, ry: 30 },
  };

  const FUSION_RECIPES = [
    { parents: ["guppy", "clownfish"], result: "fusionClown" },
    { parents: ["swordfish", "hammerhead"], result: "fusionHammer" },
    { parents: ["fusionClown", "royalClown"], result: "fusionClown" },
    { parents: ["fusionHammer", "apexHammer"], result: "fusionHammer" },
    { parents: ["lavaFish", "lavaFish"], result: "fusionInferno" },
    { parents: ["phantomFish", "dreadSquid"], result: "fusionAbyss" },
    { parents: ["typhoonRay", "stormShark"], result: "fusionStorm" },
    { parents: ["kraken", "megalodon"], result: "fusionTitan" },
  ];

  const GEAR = [
    { id: "rod1", name: "Pro Rod Mk1", emoji: "🎣", desc: "+25% catch power — reel easier!", cost: 60, catch: 0.25 },
    { id: "rod2", name: "Legend Rod", emoji: "🎣", desc: "+50% catch power total", cost: 140, catch: 0.25, req: "rod1" },
    { id: "bait", name: "Premium Bait", emoji: "🍤", desc: "+2 pier coins/sec", cost: 50, income: 2 },
    { id: "cooler", name: "Fish Cooler", emoji: "🧊", desc: "+4 pier coins/sec", cost: 120, income: 4 },
    { id: "anchor", name: "Heavy Anchor", emoji: "⚓", desc: "+20 max HP for your fish", cost: 80, hp: 20 },
    { id: "net", name: "Giant Net", emoji: "🥅", desc: "Unlock Splash Attack — usable 1 in 3 turns", cost: 150, special: true },
  ];
  const PICKAXES = [
    { id: "stonePick", name: "Stone Pickaxe", emoji: "⛏️", desc: "Starter cave pickaxe.", cost: 140 },
    { id: "ironPick", name: "Iron Pickaxe", emoji: "⛏️", desc: "Better durability and grip.", cost: 420, req: "stonePick" },
    { id: "crystalPick", name: "Crystal Pickaxe", emoji: "💎", desc: "Top-tier mineral breaker.", cost: 980, req: "ironPick" },
  ];

  const BOSS_MULT = { hp: 4, atk: 1.6, exp: 5, coins: 8 };
  const BOSS_HIT_COINS_BASE = 5;

  let canvas, ctx, battleCanvas, battleCtx, w, h, dpr = 1;
  let playing = false;
  let animT = 0;
  let lastFrame = 0;
  let lbTimer = 0;
  let player = { x: ISLAND_SPAWN.x, y: ISLAND_SPAWN.y, facing: 1 };
  let cam = { x: ISLAND_SPAWN.x, y: ISLAND_SPAWN.y };
  let mobs = [];
  let boss = null;
  let nearMob = null;
  let nearSailDock = false;
  let edgeTravelDir = null;
  let edgeBossHintShown = false;
  let nearFeed = false;
  let nearBreed = false;
  let nearRide = false;
  let riding = false;
  let nearBuyShop = false;
  let nearSellShop = false;
  let nearPickaxeShop = false;
  let nearCave = false;
  let nearBoatShop = false;
  let nearPvp = null;
  let parkCoinTimer = 0;
  let pondRespawnTimer = 0;
  let castLine = {
    active: false,
    pointerId: null,
    endScreenX: 0,
    endScreenY: 0,
  };
  let tipIndex = 0;
  const btnSticky = {
    mob: false,
    boss: false,
    sail: false,
    feed: false,
    breed: false,
    ride: false,
    pvp: false,
    buyShop: false,
    sellShop: false,
    pickaxeShop: false,
    cave: false,
    boatShop: false,
    goBackWorld: false,
  };
  let battle = null;
  let joy = { active: false, dx: 0, dy: 0 };
  let keys = {};
  let toastTimer = 0;
  let catchCelebration = null;
  let remotePlayers = [];
  let state = defaultState();

  function mpSubroom() {
    if (state.zone === LAVA_ZONE_ID && state.lavaInterior) return "zone-2-volcano";
    if (state.zone === DEPTHS_ZONE_ID && state.depthsInterior) return "zone-3-depths-cave";
    return "zone-" + state.zone;
  }

  function drawNameLabel(sx, sy, name, color) {
    ctx.font = "600 9px system-ui,sans-serif";
    const nm = (name || "Trainer").slice(0, 10);
    const nw = ctx.measureText(nm).width + 12;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(sx - nw / 2, sy - 11, nw, 14, 3);
    ctx.fill();
    ctx.fillStyle = color || "#e1bee7";
    ctx.textAlign = "center";
    ctx.fillText(nm, sx, sy);
  }

  function updateLeaderboard() {
    const el = document.getElementById("leaderboard");
    if (!el || !playing) return;
    const rows = [
      { name: state.name, level: state.level, you: true },
      ...remotePlayers.map((p) => ({
        name: p.name || "Trainer",
        level: (p.state || {}).level || 1,
        remote: true,
      })),
    ]
      .sort((a, b) => b.level - a.level)
      .slice(0, 8);

    el.innerHTML =
      "<h4>🎣 Top Fishers</h4>" +
      rows
        .map(
          (r, i) =>
            `<div class="lb-row ${r.you ? "you" : r.remote ? "remote" : ""}"><span>#${i + 1} ${r.name.slice(0, 10)}</span><span>Lv ${r.level}</span></div>`
        )
        .join("");
  }

  function initMultiplayer() {
    if (!window.GameMP) return;
    if (typeof markGameMpCustom === "function") markGameMpCustom();
    GameMP.init({
      game: "fishermon",
      subroom: mpSubroom(),
      getName: () => state.name,
      getState: () => ({
        zone: state.zone,
        x: player.x,
        y: player.y,
        facing: player.facing,
        style: state.style,
        level: state.level,
        equipped: state.equipped,
        expansions: state.expansions,
        upgrades: state.equipped,
        activeDino: (getActiveFish() || {}).typeKey,
        riding,
        battle: !!battle,
        lavaInterior: !!state.lavaInterior,
        depthsInterior: !!state.depthsInterior,
      }),
      onPeers: (peers) => {
        remotePlayers = peers;
        updateLeaderboard();
      },
    });
    GameMP.start();
  }

  function defaultState() {
    return {
      name: "Angler",
      style: "cute",
      level: 1,
      exp: 0,
      coins: 25,
      zone: 0,
      bossesBeaten: [],
      expansions: [],
      equipped: [],
      collection: [{ id: "starter", typeKey: "guppy", nickname: "Bubbles" }],
      activeDino: "starter",
      hp: 100,
      lavaInterior: false,
      depthsInterior: false,
      boatsOwned: [],
      activeBoat: null,
      pickaxesOwned: [],
      activePickaxe: null,
      pearls: 0,
      previousZone: null,
    };
  }

  function migrateZoneSave(merged) {
    if (!merged._zoneMapV2) {
      if (merged.zone === 1) merged.zone = 0;
      else if (merged.zone > 1) merged.zone -= 1;
      merged.bossesBeaten = (merged.bossesBeaten || [])
        .filter((id) => id !== 1)
        .map((id) => (id > 1 ? id - 1 : id));
      merged._zoneMapV2 = true;
    }
    if (!merged._zoneMapV3) {
      if (merged.zone > ZONES.length - 1) merged.zone = ZONES.length - 1;
      merged._zoneMapV3 = true;
    }
    if (!merged._worldV4) {
      merged.boatsOwned = merged.boatsOwned || [];
      merged.activeBoat = merged.activeBoat || null;
      merged.pearls = merged.pearls || 0;
      merged._worldV4 = true;
    }
    if (!merged._worldV5) {
      if (merged.previousZone == null && merged.zone > 0) {
        merged.previousZone = merged.zone - 1;
      }
      merged._worldV5 = true;
    }
    if (!merged._worldV6) {
      merged.pickaxesOwned = merged.pickaxesOwned || [];
      merged.activePickaxe = merged.activePickaxe || null;
      merged._worldV6 = true;
    }
    return merged;
  }

  function getZoneIsland(zone) {
    zone = zone || currentZone();
    if (zone.isPier) return ISLAND;
    if (zone.isLavaReef) return LAVA_ISLAND;
    if (zone.isHurricane) return HURRICANE;
    if (zone.isDepthsCave) return DEPTHS_ISLAND;
    if (zone.isArctic) return ARCTIC_ISLAND;
    return ZONE_ISLAND;
  }

  function getBoat(id) {
    return BOATS.find((b) => b.id === id) || null;
  }

  function getActiveBoat() {
    return getBoat(state.activeBoat);
  }

  function boatSpeedMult() {
    if (!riding || !state.activeBoat) return 1;
    return getActiveBoat()?.speedMult || RIDE_SPEED_MULT;
  }

  function boatPriceLabel(boat) {
    return boat.currency === "pearls"
      ? `🔮 ${fmt(boat.cost)}`
      : `🪙 ${fmt(boat.cost)}`;
  }

  function canAffordBoat(boat) {
    if (boat.currency === "pearls") return state.pearls >= boat.cost;
    return state.coins >= boat.cost;
  }

  function skipMySave(name) {
    return window.BecomeAProOwner?.shouldSkipSave?.(name) || false;
  }

  function loadState() {
    if (skipMySave()) {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (_) {}
      return defaultState();
    }
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = migrateZoneSave({ ...defaultState(), ...parsed });
        if (parsed.world != null && parsed.zone == null) merged.zone = parsed.world;
        if (parsed.upgrades && !parsed.expansions) merged.expansions = parsed.upgrades;
        if (!merged.equipped || !merged.equipped.length) {
          merged.equipped = [...(merged.expansions || [])];
        }
        if (!merged.collection || !merged.collection.length) {
          merged.collection = [{ id: "starter", typeKey: "guppy", nickname: "Bubbles" }];
          merged.activeDino = "starter";
        }
        delete merged.upgrades;
        return merged;
      }
    } catch (_) {}
    return defaultState();
  }

  function saveState() {
    if (skipMySave(state?.name)) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function getZone(id) {
    return ZONES[id] || ZONES[0];
  }

  function currentZone() {
    return getZone(state.zone);
  }

  function getActiveFish() {
    if (!state.collection || !state.collection.length) return null;
    return state.collection.find((c) => c.id === state.activeDino) || state.collection[0];
  }

  function isEquipped(id) {
    return state.equipped.includes(id);
  }

  function parkIncomeRate() {
    let rate = 2;
    GEAR.forEach((e) => {
      if (isEquipped(e.id) && e.income) rate += e.income;
    });
    return rate;
  }

  function checkEvolution() {
    const dino = getActiveFish();
    if (!dino) return;
    const type = FISH_TYPES[dino.typeKey];
    if (type?.evolve && state.level >= type.evolveLv) {
      dino.typeKey = type.evolve;
      showToast(`Evolved into ${FISH_TYPES[type.evolve].name}! 🌟`);
    }
  }

  function isZoneUnlocked(zoneId) {
    if (zoneId <= 0) return true;
    const z = getZone(zoneId);
    if (state.level < z.reqLevel) return false;
    if (z.isPvp) return true;
    const prev = getZone(zoneId - 1);
    if (prev.isPier) return true;
    return state.bossesBeaten.includes(zoneId - 1);
  }

  function getMobStats(typeKey, mobLevel, isBoss) {
    const base = FISH_TYPES[typeKey] || FISH_TYPES.guppy;
    const lvMult = 1 + (mobLevel - 1) * 0.22;
    if (isBoss) {
      return {
        hp: Math.floor(base.hp * BOSS_MULT.hp * lvMult),
        atk: Math.floor(base.atk * BOSS_MULT.atk * lvMult),
        exp: Math.floor(base.exp * BOSS_MULT.exp * (1 + (mobLevel - 1) * 0.15)),
        coins: Math.floor(base.coins * BOSS_MULT.coins * (1 + (mobLevel - 1) * 0.12)),
      };
    }
    return {
      hp: Math.floor(base.hp * lvMult),
      atk: Math.floor(base.atk * lvMult),
      exp: Math.floor(base.exp * (1 + (mobLevel - 1) * 0.18)),
      coins: Math.floor(base.coins * (1 + (mobLevel - 1) * 0.15)),
    };
  }

  function isInOcean(wx, wy) {
    return !onIslandLand(wx, wy) && !isOnDock(wx, wy);
  }

  function createMob(id, zone) {
    const mobList = zoneMobList(zone);
    const mobLevel = zoneMobLevel(zone);
    let typeKey = mobList[Math.floor(Math.random() * mobList.length)];
    if (Math.random() < 0.06 && !(zone.isLavaReef && state.lavaInterior) && !(zone.isDepthsCave && state.depthsInterior)) typeKey = "goldenBass";
    const stats = getMobStats(typeKey, mobLevel, false);
    let x = WORLD_MARGIN + 20 + Math.random() * (WORLD_W - WORLD_MARGIN * 2 - 40);
    let y = WORLD_MARGIN + 20 + Math.random() * (PLAYABLE_H - WORLD_MARGIN * 2 - 40);
    let poolId = null;

    if (zone.isPier) {
      for (let t = 0; t < 50; t++) {
        x = WORLD_MARGIN + 10 + Math.random() * (WORLD_W - WORLD_MARGIN * 2 - 20);
        y = WORLD_MARGIN + 10 + Math.random() * (PLAYABLE_H - WORLD_MARGIN * 2 - 20);
        if (isInOcean(x, y)) break;
      }
    } else if (zone.isLavaReef && state.lavaInterior) {
      poolId = id % LAVA_POOLS.length;
      const pool = LAVA_POOLS[poolId];
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.55;
      x = pool.x + Math.cos(ang) * pool.rx * dist;
      y = pool.y + Math.sin(ang) * pool.ry * dist;
    } else if (zone.isDepthsCave && state.depthsInterior) {
      poolId = id % DEPTHS_ABYSS_POOLS.length;
      const pool = DEPTHS_ABYSS_POOLS[poolId];
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.55;
      x = pool.x + Math.cos(ang) * pool.rx * dist;
      y = pool.y + Math.sin(ang) * pool.ry * dist;
    } else if (zone.isHurricane) {
      if (Math.random() < 0.4) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.72;
        x = HURRICANE.cx + Math.cos(ang) * HURRICANE.eyeRx * dist;
        y = HURRICANE.cy + Math.sin(ang) * HURRICANE.eyeRy * dist;
      } else {
        for (let t = 0; t < 50; t++) {
          const ang = Math.random() * Math.PI * 2;
          const ringD = 1.04 + Math.random() * 0.42;
          x = HURRICANE.cx + Math.cos(ang) * HURRICANE.rx * ringD;
          y = HURRICANE.cy + Math.sin(ang) * HURRICANE.ry * ringD;
          if (isInHurricaneWhiteWater(x, y)) break;
        }
      }
    } else if (zone.isLavaReef) {
      for (let t = 0; t < 50; t++) {
        x = WORLD_MARGIN + 10 + Math.random() * (WORLD_W - WORLD_MARGIN * 2 - 20);
        y = WORLD_MARGIN + 10 + Math.random() * (PLAYABLE_H - WORLD_MARGIN * 2 - 20);
        if (isInLavaOcean(x, y)) break;
      }
    } else if (zone.isDepthsCave) {
      for (let t = 0; t < 50; t++) {
        x = WORLD_MARGIN + 10 + Math.random() * (WORLD_W - WORLD_MARGIN * 2 - 20);
        y = WORLD_MARGIN + 10 + Math.random() * (PLAYABLE_H - WORLD_MARGIN * 2 - 20);
        if (isInDepthsOcean(x, y)) break;
      }
    } else if (zone.isArctic) {
      if (Math.random() < 0.58) {
        for (let t = 0; t < 50; t++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = Math.random() * 0.78;
          x = ARCTIC_ISLAND.cx + Math.cos(ang) * ARCTIC_ISLAND.pondRx * dist;
          y = ARCTIC_ISLAND.cy + Math.sin(ang) * ARCTIC_ISLAND.pondRy * dist;
          if (isInArcticPond(x, y)) break;
        }
      } else {
        for (let t = 0; t < 50; t++) {
          x = WORLD_MARGIN + 10 + Math.random() * (WORLD_W - WORLD_MARGIN * 2 - 20);
          y = WORLD_MARGIN + 10 + Math.random() * (PLAYABLE_H - WORLD_MARGIN * 2 - 20);
          if (onArcticLand(x, y)) break;
        }
      }
    } else {
      for (let t = 0; t < 50; t++) {
        x = WORLD_MARGIN + 10 + Math.random() * (WORLD_W - WORLD_MARGIN * 2 - 20);
        y = WORLD_MARGIN + 10 + Math.random() * (PLAYABLE_H - WORLD_MARGIN * 2 - 20);
        if (isInZoneOcean(x, y)) break;
      }
    }
    return {
      id,
      typeKey,
      mobLevel,
      poolId,
      pondId: null,
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      hp: stats.hp,
    };
  }

  function createPondMob(id, zone, pond, pondId) {
    const mobList = zoneMobList(zone);
    const mobLevel = zoneMobLevel(zone);
    let typeKey = mobList[Math.floor(Math.random() * mobList.length)];
    if (Math.random() < 0.04) typeKey = "goldenBass";
    const stats = getMobStats(typeKey, mobLevel, false);
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.random() * 0.72;
    return {
      id,
      typeKey,
      mobLevel,
      poolId: null,
      pondId,
      x: pond.cx + Math.cos(ang) * pond.rx * dist,
      y: pond.cy + Math.sin(ang) * pond.ry * dist,
      vx: (Math.random() - 0.5) * 34,
      vy: (Math.random() - 0.5) * 34,
      hp: stats.hp,
    };
  }

  function addPondFish(zone) {
    const ponds = getZonePonds(zone);
    if (!ponds.length) return;
    ponds.forEach((pond, pondId) => {
      for (let i = 0; i < POND_FISH_PER_POND; i++) {
        mobs.push(createPondMob(Date.now() + pondId * 1000 + i, zone, pond, pondId));
      }
    });
  }

  function catchMultiplier() {
    let mult = 1.25;
    GEAR.forEach((e) => {
      if (isEquipped(e.id) && e.catch) mult += e.catch;
    });
    return mult;
  }

  function expToNext(lv) {
    return Math.floor(50 * Math.pow(1.35, lv - 1));
  }

  function maxHp() {
    let hp = 80 + state.level * 12;
    GEAR.forEach((u) => {
      if (isEquipped(u.id) && u.hp) hp += u.hp;
    });
    return hp;
  }

  function attackPower() {
    const dino = getActiveFish();
    return fishAttackPower(dino);
  }

  function getBattleFish(fishId) {
    if (fishId) {
      const picked = state.collection.find((c) => c.id === fishId);
      if (picked) return picked;
    }
    return getActiveFish();
  }

  function fishMaxHp(fish) {
    if (!fish) return maxHp();
    const type = FISH_TYPES[fish.typeKey] || FISH_TYPES.guppy;
    let hp = Math.floor(type.hp * (1 + (state.level - 1) * 0.2) + state.level * 6);
    GEAR.forEach((u) => {
      if (isEquipped(u.id) && u.hp) hp += u.hp;
    });
    return hp;
  }

  function fishAttackPower(fish) {
    if (!fish) return 8 + state.level * 3;
    const type = FISH_TYPES[fish.typeKey] || FISH_TYPES.guppy;
    let atk = Math.floor(type.atk * (1 + (state.level - 1) * 0.18) + state.level * 2);
    GEAR.forEach((u) => {
      if (isEquipped(u.id) && u.atk) atk += u.atk;
    });
    return atk;
  }

  function fishSpecialPower(fish) {
    return Math.floor(fishAttackPower(fish) * 1.8);
  }

  function bossHitCoins(zone) {
    return BOSS_HIT_COINS_BASE + Math.floor(zoneMobLevel(zone || currentZone()) * 0.75);
  }

  function updateBossFishUi() {
    const wrap = document.getElementById("boss-fish-switch");
    const label = document.getElementById("boss-fish-label");
    const prev = document.getElementById("boss-fish-prev");
    const next = document.getElementById("boss-fish-next");
    if (!wrap) return;
    if (battle?.isBoss && state.collection.length > 0) {
      wrap.classList.remove("hidden");
      const fish = getBattleFish(battle.fishId);
      const type = FISH_TYPES[fish?.typeKey] || FISH_TYPES.guppy;
      if (label) {
        label.textContent = `${type.emoji} ${fish?.nickname || type.name}`;
      }
      const multi = state.collection.length > 1;
      if (prev) prev.classList.toggle("hidden", !multi);
      if (next) next.classList.toggle("hidden", !multi);
    } else {
      wrap.classList.add("hidden");
    }
  }

  function updateBossBattleBanner() {
    if (!battle?.isBoss) return;
    const hit = battle.hitCoinsEarned || 0;
    const perHit = bossHitCoins();
    const banner = document.getElementById("battle-banner");
    if (!banner) return;
    banner.textContent =
      hit > 0
        ? `👑 Boss battle · +${hit} 🪙 earned (+${perHit} per attack)`
        : `👑 Send your fish to attack — +${perHit} 🪙 per hit!`;
  }

  function cycleBossFish(dir) {
    if (!battle?.isBoss || state.collection.length < 2) return;
    const idx = Math.max(
      0,
      state.collection.findIndex((c) => c.id === battle.fishId)
    );
    const next = (idx + dir + state.collection.length) % state.collection.length;
    battle.fishId = state.collection[next].id;
    state.activeDino = battle.fishId;
    const fish = getBattleFish(battle.fishId);
    battle.youHp = fishMaxHp(fish);
    battle.youMaxHp = battle.youHp;
    updateBossFishUi();
    updateBossBattleBanner();
    updateBattleHud();
    drawBattleScene(false);
    updateHud();
  }

  function specialPower() {
    return Math.floor(attackPower() * 1.8);
  }

  function hasSpecial() {
    return isEquipped("net");
  }

  function canUseRockSmash() {
    return hasSpecial() && battle && specialTurnsLeft() === 0;
  }

  function specialTurnsLeft() {
    if (!battle) return 0;
    const turn = battle.playerTurn || 1;
    return (3 - ((turn - 1) % 3)) % 3;
  }

  function updateBattleSpecialBtn() {
    const btn = document.getElementById("special-btn");
    const status = document.getElementById("special-status");
    if (!btn) return;
    if (!battle) {
      btn.classList.add("hidden");
      status?.classList.add("hidden");
      return;
    }
    if (!hasSpecial()) {
      btn.classList.add("hidden");
      if (status) {
        status.classList.remove("hidden");
        status.className = "special-status wait";
        status.textContent = "💦 Unlock Giant Net in the Fish Shop to use Splash Attack!";
      }
      return;
    }
    btn.classList.remove("hidden");
    status?.classList.remove("hidden");
    const ready = canUseRockSmash();
    const wait = specialTurnsLeft();
    btn.disabled = false;
    btn.classList.toggle("cooldown", !ready);
    btn.textContent = "💦 Splash Attack";
    if (status) {
      status.className = ready ? "special-status ready" : "special-status wait";
      status.textContent = ready
        ? "💦 Splash Attack is READY! (1 of every 3 turns)"
        : `💦 Splash Attack ready in ${wait} turn${wait === 1 ? "" : "s"}…`;
    }
  }

  function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return Math.floor(n).toString();
  }

  function setBtnVisible(el, show) {
    if (!el) return;
    if (show) el.classList.remove("hidden");
    else el.classList.add("hidden");
  }

  function stickyNear(dist, showAt, hideAt, key) {
    if (btnSticky[key]) {
      if (dist > hideAt) btnSticky[key] = false;
    } else if (dist < showAt) {
      btnSticky[key] = true;
    }
    return btnSticky[key];
  }

  function updateActionButtons() {
    const zone = currentZone();
    setBtnVisible(document.getElementById("fight-btn"), playing && !battle);
    const fishBtn = document.getElementById("fight-btn");
    if (fishBtn) fishBtn.textContent = "Fish";
    setBtnVisible(document.getElementById("boss-btn"), btnSticky.boss && !battle);
    setBtnVisible(document.getElementById("sail-btn"), btnSticky.sail && !battle);
    const sailBtn = document.getElementById("sail-btn");
    if (sailBtn) {
      if (edgeTravelDir === "south") {
        sailBtn.textContent = southPortalActive() ? "🌀 Enter Portal" : "🔒 Portal Locked";
      } else if (edgeTravelDir === "north") sailBtn.textContent = "⛵ Prev Island";
      else sailBtn.textContent = "🌀 Portal";
    }
    setBtnVisible(document.getElementById("feed-btn"), btnSticky.feed && !battle && zone.isPier);
    setBtnVisible(
      document.getElementById("breed-btn"),
      btnSticky.breed && !battle && zone.isPier && state.collection.length >= 2
    );
    setBtnVisible(document.getElementById("sell-shop-btn"), btnSticky.sellShop && !battle && !(zone.isLavaReef && state.lavaInterior) && !(zone.isDepthsCave && state.depthsInterior));
    setBtnVisible(
      document.getElementById("pickaxe-shop-btn"),
      btnSticky.pickaxeShop && !battle && zone.isDepthsCave && state.depthsInterior
    );
    setBtnVisible(
      document.getElementById("ride-btn"),
      btnSticky.ride && !battle && !!state.activeBoat && !(zone.isLavaReef && state.lavaInterior) && !(zone.isDepthsCave && state.depthsInterior)
    );
    setBtnVisible(document.getElementById("pvp-btn"), btnSticky.pvp && !battle && zone.isPvp);
    setBtnVisible(document.getElementById("cave-btn"), false);
    const caveBtn = document.getElementById("cave-btn");
    if (caveBtn) {
      if (state.depthsInterior) caveBtn.textContent = "EXIT CAVE";
      else if (state.lavaInterior) caveBtn.textContent = "🚪 Exit Cave";
      else if (zone.isDepthsCave) caveBtn.textContent = "🕳️ Enter Cave";
      else caveBtn.textContent = "🌋 Enter Cave";
    }
    setBtnVisible(document.getElementById("shop-btn"), btnSticky.buyShop && !battle && !(zone.isLavaReef && state.lavaInterior) && !(zone.isDepthsCave && state.depthsInterior));
    const shopBtn = document.getElementById("shop-btn");
    if (shopBtn) {
      shopBtn.textContent = zone.isPier ? "🎣 Fish / Boat Shop" : "🎣 Shop";
    }
    setBtnVisible(
      document.getElementById("go-back-world-btn"),
      btnSticky.goBackWorld && !battle && canGoBackWorld()
    );
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    toastTimer = 2.5;
  }

  function resizeCatchCelebrationCanvas() {
    const canvas = document.getElementById("catch-celebration-canvas");
    if (!canvas || !catchCelebration) return;
    const w = canvas.clientWidth || 280;
    const h = canvas.clientHeight || 160;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    catchCelebration.ctx = canvas.getContext("2d");
    catchCelebration.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawCatchCelebration() {
    if (!catchCelebration?.ctx) return;
    const { ctx, typeKey, mobLevel } = catchCelebration;
    const canvas = document.getElementById("catch-celebration-canvas");
    const w = canvas?.clientWidth || 280;
    const h = canvas?.clientHeight || 160;
    const t = catchCelebration.animT || 0;
    ctx.clearRect(0, 0, w, h);
    const pulse = 0.85 + Math.sin(t * 5) * 0.08;
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.52, 8, w * 0.5, h * 0.52, 90);
    glow.addColorStop(0, `rgba(255, 245, 157, ${0.55 + Math.sin(t * 6) * 0.15})`);
    glow.addColorStop(0.45, "rgba(255, 193, 7, 0.25)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.52, 88, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 10; i++) {
      const ang = t * 2.2 + (i / 10) * Math.PI * 2;
      const dist = 56 + Math.sin(t * 4 + i) * 10;
      const sx = w * 0.5 + Math.cos(ang) * dist;
      const sy = h * 0.52 + Math.sin(ang) * dist * 0.55;
      ctx.fillStyle = i % 2 ? "rgba(255, 235, 59, 0.9)" : "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    FMSprites.drawWildFish(
      ctx,
      w * 0.5,
      h * 0.56,
      FISH_TYPES[typeKey] || FISH_TYPES.guppy,
      t,
      mobLevel,
      { scale: 1.35 * pulse }
    );
  }

  function showCatchCelebration(typeKey, mobLevel) {
    window.GameSFX?.play("capture");
    const overlay = document.getElementById("catch-celebration");
    const nameEl = document.getElementById("catch-fish-name");
    if (!overlay) return;
    const type = FISH_TYPES[typeKey] || FISH_TYPES.guppy;
    if (nameEl) nameEl.textContent = `${type.emoji} ${type.name}`;
    overlay.classList.remove("hidden");
    catchCelebration = {
      typeKey,
      mobLevel: mobLevel || 1,
      animT: 0,
      ctx: null,
    };
    resizeCatchCelebrationCanvas();
    drawCatchCelebration();
  }

  function hideCatchCelebration() {
    document.getElementById("catch-celebration")?.classList.add("hidden");
    catchCelebration = null;
  }

  function updateCatchCelebration(dt) {
    if (!catchCelebration) return;
    catchCelebration.animT += dt;
    drawCatchCelebration();
  }

  function addExp(amount) {
    state.exp += amount;
    while (state.exp >= expToNext(state.level)) {
      state.exp -= expToNext(state.level);
      state.level++;
      state.hp = maxHp();
      checkEvolution();
      showToast(`Level up! 🎣 Lv ${state.level}!`);
      updateLeaderboard();
    }
    updateHud();
    saveState();
  }

  function dockLandOverlap() {
    return DOCK_TILE * 0.65;
  }

  function dockOceanLen(facing, island) {
    island = island || ISLAND;
    const edgeN = island.cy - island.ry;
    const edgeS = island.cy + island.ry;
    const edgeE = island.cx + island.rx;
    const edgeW = island.cx - island.rx;
    let space;
    if (facing === "west") space = edgeW;
    else if (facing === "east") space = WORLD_W - edgeE;
    else if (facing === "north") space = edgeN;
    else space = Math.min(PLAYABLE_H - edgeS, WORLD_H - edgeS - PORTAL_ROW_H);
    return Math.min(DOCK_L, Math.max(DOCK_TILE, space));
  }

  function dockRectForIsland(island, facing) {
    const hw = DOCK_W * 0.5;
    const landOverlap = dockLandOverlap();
    const oceanLen = dockOceanLen(facing, island);
    const edgeN = island.cy - island.ry;
    const edgeS = island.cy + island.ry;
    const edgeE = island.cx + island.rx;
    const edgeW = island.cx - island.rx;
    if (facing === "north") {
      return { x1: island.cx - hw, y1: edgeN - oceanLen, x2: island.cx + hw, y2: edgeN + landOverlap };
    }
    if (facing === "south") {
      return { x1: island.cx - hw, y1: edgeS - landOverlap, x2: island.cx + hw, y2: edgeS + oceanLen };
    }
    if (facing === "east") {
      return { x1: edgeE - landOverlap, y1: island.cy - hw, x2: edgeE + oceanLen, y2: island.cy + hw };
    }
    return { x1: edgeW - oceanLen, y1: island.cy - hw, x2: edgeW + landOverlap, y2: island.cy + hw };
  }

  function dockRect(facing) {
    return dockRectForIsland(ISLAND, facing);
  }

  function dockPortalPosForIsland(island, facing) {
    const r = dockRectForIsland(island, facing);
    if (facing === "north") return { x: (r.x1 + r.x2) * 0.5, y: r.y1 + 10 };
    if (facing === "south") return { x: (r.x1 + r.x2) * 0.5, y: r.y2 - 10 };
    if (facing === "east") return { x: r.x2 - 10, y: (r.y1 + r.y2) * 0.5 };
    return { x: r.x1 + 10, y: (r.y1 + r.y2) * 0.5 };
  }

  function northDockShopPos(zone) {
    return dockPortalPosForIsland(getZoneIsland(zone), "north");
  }

  function southDockBossPos(zone) {
    const island = getZoneIsland(zone);
    const r = dockRectForIsland(island, "south");
    return {
      x: (r.x1 + r.x2) * 0.5,
      y: r.y1 + Math.min(36, Math.max(18, (r.y2 - r.y1) * 0.38)),
    };
  }

  function southDockPortalPos(zone) {
    zone = zone || currentZone();
    return dockPortalPosForIsland(getZoneIsland(zone), "south");
  }

  function southPortalVisible() {
    return !!(boss && boss.beaten && state.zone + 1 < ZONES.length);
  }

  function isOnSouthDock(wx, wy, zone) {
    zone = zone || currentZone();
    const r = dockRectForIsland(getZoneIsland(zone), "south");
    return wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2;
  }

  function isNearSouthDockPortal(wx, wy, zone) {
    if (!southPortalVisible()) return false;
    zone = zone || currentZone();
    if (zone.isLavaReef && state.lavaInterior) return false;
    if (zone.isDepthsCave && state.depthsInterior) return false;
    const p = southDockPortalPos(zone);
    return Math.hypot(wx - p.x, wy - p.y) < 44;
  }

  function refreshBoss(zone) {
    zone = zone || currentZone();
    if (zone.isPvp || (zone.isLavaReef && state.lavaInterior) || (zone.isDepthsCave && state.depthsInterior)) {
      boss = { x: 0, y: 0, beaten: true };
      return;
    }
    const pos = southDockBossPos(zone);
    const beaten = state.bossesBeaten.includes(state.zone);
    boss = { x: pos.x, y: pos.y, beaten };
  }

  function isOnSouthPortal(wx, wy) {
    return isNearSouthDockPortal(wx, wy);
  }

  function southPortalActive() {
    return southPortalVisible() && isZoneUnlocked(state.zone + 1);
  }

  function isOnDockForZone(wx, wy, zone) {
    if (zone.isPier) return isOnDock(wx, wy);
    return ["north", "south", "east", "west"].some((facing) => {
      const r = dockRectForIsland(getZoneIsland(zone), facing);
      return wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2;
    });
  }

  function isOnNorthDock(wx, wy, zone) {
    zone = zone || currentZone();
    if (zone.isLavaReef && state.lavaInterior) return false;
    if (zone.isDepthsCave && state.depthsInterior) return false;
    const r = dockRectForIsland(getZoneIsland(zone), "north");
    return wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2;
  }

  function northDockReturnPos(zone) {
    const shop = northDockShopPos(zone);
    return { x: shop.x, y: shop.y + 36 };
  }

  function isNearNorthDockReturn(wx, wy, zone) {
    if (!canGoBackWorld()) return false;
    zone = zone || currentZone();
    if (isOnNorthDock(wx, wy, zone)) return true;
    const ret = northDockReturnPos(zone);
    return Math.hypot(wx - ret.x, wy - ret.y) < 52;
  }

  function priorWorldZoneId() {
    return state.zone - 1;
  }

  function canGoBackWorld() {
    return state.zone > 0;
  }

  function dockPortalPos(facing) {
    const r = dockRect(facing);
    if (facing === "north") return { x: (r.x1 + r.x2) * 0.5, y: r.y1 + 48 };
    if (facing === "south") return { x: (r.x1 + r.x2) * 0.5, y: r.y2 - 48 };
    if (facing === "east") return { x: r.x2 - 48, y: (r.y1 + r.y2) * 0.5 };
    return { x: r.x1 + 48, y: (r.y1 + r.y2) * 0.5 };
  }

  function isOnDock(wx, wy) {
    return DOCKS.some((d) => {
      const r = dockRect(d.facing);
      return wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2;
    });
  }

  function islandWalkable(wx, wy) {
    if (isOnDock(wx, wy)) return true;
    if (isOnSouthPortal(wx, wy)) return southPortalActive();
    if (wx < WORLD_MARGIN || wy < WORLD_MARGIN || wx > WORLD_W - WORLD_MARGIN || wy >= PLAYABLE_H) {
      return false;
    }
    if (isInPond(wx, wy)) return false;
    if (onIslandLand(wx, wy)) return true;
    return false;
  }

  function shoreDistance(wx, wy) {
    const dx = (wx - ISLAND.cx) / ISLAND.rx;
    const dy = (wy - ISLAND.cy) / ISLAND.ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    return (d - 1) * Math.min(ISLAND.rx, ISLAND.ry);
  }

  function isOnIslandShape(wx, wy) {
    const dx = (wx - ISLAND.cx) / ISLAND.rx;
    const dy = (wy - ISLAND.cy) / ISLAND.ry;
    return dx * dx + dy * dy <= 1;
  }

  function isInPond(wx, wy) {
    const dx = (wx - ISLAND.cx) / ISLAND.pondRx;
    const dy = (wy - ISLAND.cy) / ISLAND.pondRy;
    return dx * dx + dy * dy <= 1;
  }

  function onIslandLand(wx, wy) {
    return isOnIslandShape(wx, wy) && !isInPond(wx, wy);
  }

  function isOnLavaIslandShape(wx, wy) {
    const dx = (wx - LAVA_ISLAND.cx) / LAVA_ISLAND.rx;
    const dy = (wy - LAVA_ISLAND.cy) / LAVA_ISLAND.ry;
    return dx * dx + dy * dy <= 1;
  }

  function isInLavaVolcano(wx, wy) {
    const dx = (wx - LAVA_VOLCANO.cx) / LAVA_VOLCANO.rx;
    const dy = (wy - LAVA_VOLCANO.cy) / LAVA_VOLCANO.ry;
    return dx * dx + dy * dy <= 1;
  }

  function onLavaRockLand(wx, wy) {
    return isOnLavaIslandShape(wx, wy) && !isInLavaVolcano(wx, wy);
  }

  function isOnLavaVolcanoBridge(wx, wy) {
    if (!isOnLavaIslandShape(wx, wy)) return false;
    const target = { x: LAVA_VOLCANO.cx, y: LAVA_VOLCANO.cy };
    for (let i = 0; i < LAVA_BRIDGE_ANCHORS.length; i++) {
      const anchor = LAVA_BRIDGE_ANCHORS[i];
      if (distToSegment(wx, wy, anchor.x, anchor.y, target.x, target.y) < 32) return true;
    }
    return false;
  }

  function onLavaGrass(wx, wy) {
    return onLavaRockLand(wx, wy);
  }

  function lavaExteriorWalkable(wx, wy) {
    if (isOnDockForZone(wx, wy, getZone(LAVA_ZONE_ID))) return true;
    if (isOnSouthPortal(wx, wy)) return southPortalActive();
    if (wx < WORLD_MARGIN || wy < WORLD_MARGIN || wx > WORLD_W - WORLD_MARGIN || wy >= PLAYABLE_H) {
      return false;
    }
    if (isOnLavaVolcanoBridge(wx, wy)) return true;
    if (isInLavaVolcano(wx, wy)) return true;
    if (onLavaRockLand(wx, wy)) return true;
    return false;
  }

  function isInLavaOcean(wx, wy) {
    return !lavaExteriorWalkable(wx, wy);
  }

  function lavaShoreDistance(wx, wy) {
    const dx = (wx - LAVA_ISLAND.cx) / LAVA_ISLAND.rx;
    const dy = (wy - LAVA_ISLAND.cy) / LAVA_ISLAND.ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    return (d - 1) * Math.min(LAVA_ISLAND.rx, LAVA_ISLAND.ry);
  }

  function lavaInteriorWalkable(wx, wy) {
    const b = LAVA_INTERIOR;
    if (
      wx < b.x1 + INTERIOR_WALL ||
      wx > b.x2 - INTERIOR_WALL ||
      wy < b.y1 + INTERIOR_WALL ||
      wy > b.y2 - INTERIOR_WALL
    ) {
      return false;
    }
    if (isInLavaPool(wx, wy)) return false;
    return !LAVA_PILLARS.some((p) => Math.hypot(wx - p.x, wy - p.y) < p.r);
  }

  function depthsInteriorWalkable(wx, wy) {
    const b = DEPTHS_INTERIOR;
    const nearSpawn = Math.hypot(wx - b.spawn.x, wy - b.spawn.y) < 56;
    const nearExit = Math.hypot(wx - b.exit.x, wy - b.exit.y) < 62;
    const nearPickaxeShop = Math.hypot(wx - DEPTHS_PICKAXE_SHOP.x, wy - DEPTHS_PICKAXE_SHOP.y) < 70;
    if (nearSpawn || nearExit || nearPickaxeShop) return true;
    if (
      wx < b.x1 + DEPTHS_WALL ||
      wx > b.x2 - DEPTHS_WALL ||
      wy < b.y1 + DEPTHS_WALL ||
      wy > b.y2 - DEPTHS_WALL
    ) {
      return false;
    }
    if (isInDepthsAbyssPool(wx, wy)) return false;
    return !DEPTHS_PILLARS.some((p) => Math.hypot(wx - p.x, wy - p.y) < p.r);
  }

  function isInDepthsAbyssPool(wx, wy) {
    return DEPTHS_ABYSS_POOLS.some((p) => {
      const dx = (wx - p.x) / p.rx;
      const dy = (wy - p.y) / p.ry;
      return dx * dx + dy * dy <= 1;
    });
  }

  function isInLavaPool(wx, wy) {
    return LAVA_POOLS.some((p) => {
      const dx = (wx - p.x) / p.rx;
      const dy = (wy - p.y) / p.ry;
      return dx * dx + dy * dy <= 1;
    });
  }

  function hurricaneRingDist(wx, wy) {
    const dx = (wx - HURRICANE.cx) / HURRICANE.rx;
    const dy = (wy - HURRICANE.cy) / HURRICANE.ry;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function hurricaneWhiteDist(wx, wy) {
    const dx = (wx - HURRICANE.cx) / HURRICANE.whiteRx;
    const dy = (wy - HURRICANE.cy) / HURRICANE.whiteRy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function isInHurricaneEye(wx, wy) {
    const dx = (wx - HURRICANE.cx) / HURRICANE.eyeRx;
    const dy = (wy - HURRICANE.cy) / HURRICANE.eyeRy;
    return dx * dx + dy * dy <= 1;
  }

  function onHurricaneRing(wx, wy) {
    return hurricaneRingDist(wx, wy) <= 1 && !isInHurricaneEye(wx, wy);
  }

  function isInHurricaneWhiteWater(wx, wy) {
    const ringD = hurricaneRingDist(wx, wy);
    return ringD > 1 && hurricaneWhiteDist(wx, wy) <= 1;
  }

  function hurricaneWalkable(wx, wy) {
    if (isOnDockForZone(wx, wy, getZone(HURRICANE_ZONE_ID))) return true;
    if (isOnSouthPortal(wx, wy)) return southPortalActive();
    if (wx < WORLD_MARGIN || wy < WORLD_MARGIN || wx > WORLD_W - WORLD_MARGIN || wy >= PLAYABLE_H) {
      return false;
    }
    return onHurricaneRing(wx, wy);
  }

  function isInHurricaneVoid(wx, wy) {
    return hurricaneWhiteDist(wx, wy) > 1;
  }

  function hurricaneWhiteShoreDist(wx, wy) {
    const ringD = hurricaneRingDist(wx, wy);
    if (ringD <= 1) return -((1 - ringD) * Math.min(HURRICANE.rx, HURRICANE.ry));
    if (hurricaneWhiteDist(wx, wy) > 1) return 999;
    return (ringD - 1) * Math.min(HURRICANE.rx, HURRICANE.ry);
  }

  function isOnDepthsIslandShape(wx, wy) {
    const dx = (wx - DEPTHS_ISLAND.cx) / DEPTHS_ISLAND.rx;
    const dy = (wy - DEPTHS_ISLAND.cy) / DEPTHS_ISLAND.ry;
    return dx * dx + dy * dy <= 1;
  }

  function onDepthsLand(wx, wy) {
    return isOnDepthsIslandShape(wx, wy);
  }

  function depthsExteriorWalkable(wx, wy) {
    if (isOnDockForZone(wx, wy, getZone(DEPTHS_ZONE_ID))) return true;
    if (isOnSouthPortal(wx, wy)) return southPortalActive();
    if (wx < WORLD_MARGIN || wy < WORLD_MARGIN || wx > WORLD_W - WORLD_MARGIN || wy >= PLAYABLE_H) {
      return false;
    }
    if (onDepthsLand(wx, wy)) return true;
    return false;
  }

  function isInDepthsOcean(wx, wy) {
    const dx = (wx - DEPTHS_ISLAND.cx) / DEPTHS_ISLAND.rx;
    const dy = (wy - DEPTHS_ISLAND.cy) / DEPTHS_ISLAND.ry;
    return dx * dx + dy * dy > 1.02;
  }

  function depthsShoreDistance(wx, wy) {
    const dx = (wx - DEPTHS_ISLAND.cx) / DEPTHS_ISLAND.rx;
    const dy = (wy - DEPTHS_ISLAND.cy) / DEPTHS_ISLAND.ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    return (d - 1) * Math.min(DEPTHS_ISLAND.rx, DEPTHS_ISLAND.ry);
  }

  function isOnZoneIslandShape(wx, wy) {
    const dx = (wx - ZONE_ISLAND.cx) / ZONE_ISLAND.rx;
    const dy = (wy - ZONE_ISLAND.cy) / ZONE_ISLAND.ry;
    return dx * dx + dy * dy <= 1;
  }

  function onZoneIslandLand(wx, wy) {
    return isOnZoneIslandShape(wx, wy);
  }

  function zoneShoreDistance(wx, wy) {
    const dx = (wx - ZONE_ISLAND.cx) / ZONE_ISLAND.rx;
    const dy = (wy - ZONE_ISLAND.cy) / ZONE_ISLAND.ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    return (d - 1) * Math.min(ZONE_ISLAND.rx, ZONE_ISLAND.ry);
  }

  function isInZoneOcean(wx, wy) {
    const dx = (wx - ZONE_ISLAND.cx) / ZONE_ISLAND.rx;
    const dy = (wy - ZONE_ISLAND.cy) / ZONE_ISLAND.ry;
    return dx * dx + dy * dy > 1.02;
  }

  function isInCoralPond(wx, wy) {
    const dx = (wx - CORAL_POND.cx) / CORAL_POND.rx;
    const dy = (wy - CORAL_POND.cy) / CORAL_POND.ry;
    return dx * dx + dy * dy <= 1;
  }

  function isInEllipse(wx, wy, pond) {
    const dx = (wx - pond.cx) / pond.rx;
    const dy = (wy - pond.cy) / pond.ry;
    return dx * dx + dy * dy <= 1;
  }

  function getZonePonds(zone) {
    if (!zone) return [];
    if (zone.isLavaReef) return [];
    if (zone.id === 1) return [CORAL_POND];
    const island = getZoneIsland(zone);
    if (!island) return [];
    return [{ cx: island.cx, cy: island.cy, rx: CENTER_POND_RX, ry: CENTER_POND_RY }];
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function isOnArcticIslandShape(wx, wy) {
    const dx = (wx - ARCTIC_ISLAND.cx) / ARCTIC_ISLAND.rx;
    const dy = (wy - ARCTIC_ISLAND.cy) / ARCTIC_ISLAND.ry;
    return dx * dx + dy * dy <= 1;
  }

  function isInArcticPond(wx, wy) {
    const dx = (wx - ARCTIC_ISLAND.cx) / ARCTIC_ISLAND.pondRx;
    const dy = (wy - ARCTIC_ISLAND.cy) / ARCTIC_ISLAND.pondRy;
    return dx * dx + dy * dy <= 1;
  }

  function onArcticLand(wx, wy) {
    return isOnArcticIslandShape(wx, wy) && !isInArcticPond(wx, wy);
  }

  function isOnArcticIcePath(wx, wy) {
    if (!onArcticLand(wx, wy)) return false;
    const cx = ARCTIC_ISLAND.cx;
    const cy = ARCTIC_ISLAND.cy;
    if (Math.abs(wx - cx) < 34 && Math.abs(wy - cy) < ARCTIC_ISLAND.ry * 0.92) return true;
    if (Math.abs(wy - cy) < 34 && Math.abs(wx - cx) < ARCTIC_ISLAND.rx * 0.92) return true;
    for (let i = 0; i < ARCTIC_TREES.length; i++) {
      const tree = ARCTIC_TREES[i];
      if (distToSegment(wx, wy, tree.x, tree.y, cx, cy) < 32) return true;
    }
    return false;
  }

  function arcticShoreDistance(wx, wy) {
    const dx = (wx - ARCTIC_ISLAND.cx) / ARCTIC_ISLAND.rx;
    const dy = (wy - ARCTIC_ISLAND.cy) / ARCTIC_ISLAND.ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    return (d - 1) * Math.min(ARCTIC_ISLAND.rx, ARCTIC_ISLAND.ry);
  }

  function isInArcticOcean(wx, wy) {
    const dx = (wx - ARCTIC_ISLAND.cx) / ARCTIC_ISLAND.rx;
    const dy = (wy - ARCTIC_ISLAND.cy) / ARCTIC_ISLAND.ry;
    return dx * dx + dy * dy > 1.02;
  }

  function arcticExteriorWalkable(wx, wy) {
    const zone = getZone(ARCTIC_ZONE_ID);
    if (isOnDockForZone(wx, wy, zone)) return true;
    if (isOnSouthPortal(wx, wy)) return southPortalActive();
    if (wx < WORLD_MARGIN || wy < WORLD_MARGIN || wx > WORLD_W - WORLD_MARGIN || wy >= PLAYABLE_H) {
      return false;
    }
    return onArcticLand(wx, wy);
  }

  function zoneDockRect(zone) {
    if (!zone || (zone.isLavaReef && state.lavaInterior) || (zone.isDepthsCave && state.depthsInterior)) return null;
    return Object.assign(dockRectForIsland(getZoneIsland(zone), "south"), { facing: "south" });
  }

  function drawZoneDocks(camX, camY, zone, animT) {
    if (zone.isPier || (zone.isLavaReef && state.lavaInterior) || (zone.isDepthsCave && state.depthsInterior)) return;
    const island = getZoneIsland(zone);
    ["north", "south", "east", "west"].forEach((facing) => {
      const r = dockRectForIsland(island, facing);
      const sx = r.x1 - camX;
      const sy = r.y1 - camY;
      const dw = r.x2 - r.x1;
      const dh = r.y2 - r.y1;
      if (sx + dw < -80 || sx > w + 80 || sy + dh < -80 || sy > h + 80) return;
      FMSprites.drawDock(ctx, sx, sy, dw, dh, facing, animT, r.x1, r.y1);
    });
  }

  function zoneDockTip(zone) {
    const r = zoneDockRect(zone);
    if (!r) return null;
    return dockPortalPosForIsland(getZoneIsland(zone), "south");
  }

  function zoneDockSpawn(zone) {
    const r = zoneDockRect(zone);
    const tip = zoneDockTip(zone);
    if (!r || !tip) return { x: WORLD_W / 2, y: WORLD_MARGIN + 20 };
    return { x: tip.x, y: r.y1 + 16 };
  }

  function bossPosition(zone) {
    if (zone.isLavaReef && state.lavaInterior) return { x: 0, y: 0 };
    return southDockBossPos(zone);
  }

  function zoneEntrySpawn(zone, entryEdge) {
    if (entryEdge === "north") {
      const shop = northDockShopPos(zone);
      return { x: shop.x, y: shop.y + 18 };
    }
    if (entryEdge === "south") {
      return { x: WORLD_W / 2, y: PLAYABLE_H - 18 };
    }
    if (zone.isPier) return { x: ISLAND_SPAWN.x, y: ISLAND_SPAWN.y };
    if (zone.isLavaReef && state.lavaInterior) {
      return { x: LAVA_INTERIOR.spawn.x, y: LAVA_INTERIOR.spawn.y };
    }
    if (zone.isLavaReef) return { x: LAVA_SPAWN.x, y: LAVA_SPAWN.y };
    if (zone.isDepthsCave) return { x: DEPTHS_SPAWN.x, y: DEPTHS_SPAWN.y };
    if (zone.isHurricane) return { x: HURRICANE_SPAWN.x, y: HURRICANE_SPAWN.y };
    if (zone.isArctic) return { x: ARCTIC_SPAWN.x, y: ARCTIC_SPAWN.y };
    if (!zone.isPier && !zone.isLavaReef && !zone.isHurricane && !zone.isDepthsCave && !zone.isArctic) {
      return { x: ZONE_SPAWN.x, y: ZONE_SPAWN.y };
    }
    return zoneDockSpawn(zone);
  }

  function getNearWorldEdge() {
    if (player.y >= PLAYABLE_H - PLAYER_R) return "south";
    if (player.y <= WORLD_EDGE) return "north";
    return null;
  }

  function drawSouthDockPortal(zone, animT) {
    if (zone.isLavaReef && state.lavaInterior) return;
    if (zone.isDepthsCave && state.depthsInterior) return;
    if (zone.isPvp) return;
    if (!southPortalVisible()) return;
    const pos = southDockPortalPos(zone);
    const s = worldToScreen(pos.x, pos.y);
    if (s.x < -100 || s.x > w + 100 || s.y < -100 || s.y > h + 100) return;
    const nextZone = getZone(state.zone + 1);
    const active = southPortalActive();
    const label = active ? `→ ${nextZone.name}` : `🔒 Lv ${nextZone.reqLevel}`;
    FMSprites.drawZonePortal(ctx, s.x, s.y, label, animT, active);
    if (active) {
      FMSprites.drawLabel(ctx, "🌀 South Dock Portal", s.x, s.y - 52);
    }
  }

  function drawNorthBoatShopMarker(zone, animT) {
    if (zone.isLavaReef && state.lavaInterior) return;
    if (zone.isDepthsCave && state.depthsInterior) return;
    const shop = northDockShopPos(zone);
    const s = worldToScreen(shop.x, shop.y);
    if (s.x < -80 || s.x > w + 80) return;
    FMSprites.drawShopBuilding(ctx, s.x, s.y, "boat", animT);
    FMSprites.drawLabel(ctx, "🚤 Boat Shop", s.x, s.y - 14);
  }

  function drawNorthGoBackPortal(zone, animT) {
    if (zone.isLavaReef && state.lavaInterior) return;
    if (zone.isDepthsCave && state.depthsInterior) return;
    if (!canGoBackWorld()) return;
    const ret = northDockReturnPos(zone);
    const s = worldToScreen(ret.x, ret.y);
    if (s.x < -100 || s.x > w + 100 || s.y < -100 || s.y > h + 100) return;
    const prevZone = getZone(priorWorldZoneId());
    FMSprites.drawZonePortal(ctx, s.x, s.y, `← ${prevZone.name}`, animT, true);
    FMSprites.drawLabel(ctx, "🌀 Return Portal", s.x, s.y - 52);
  }

  function zoneMobLevel(zone) {
    if (zone.isLavaReef && state.lavaInterior) return zone.interiorMobLevel || 20;
    if (zone.isDepthsCave && state.depthsInterior) return zone.interiorMobLevel || 35;
    return zone.mobLevel;
  }

  function zoneMobList(zone) {
    if (zone.isLavaReef && state.lavaInterior) return zone.interiorMobs || zone.mobs;
    if (zone.isDepthsCave && state.depthsInterior) return zone.interiorMobs || ["lavaFish"];
    return zone.mobs;
  }

  function enterLavaVolcano() {
    if (state.zone !== LAVA_ZONE_ID || state.lavaInterior || battle) return;
    state.lavaInterior = true;
    const spawn = resolveSafeSpawn(LAVA_INTERIOR.spawn);
    player.x = spawn.x;
    player.y = spawn.y;
    cam.x = player.x;
    cam.y = player.y;
    spawnMobs();
    updateHud();
    showToast("Inside the volcano! Fish Lv 20 in the lava pools 🌋");
    if (window.GameMP) GameMP.setSubroom(mpSubroom());
    saveState();
  }

  function exitLavaVolcano() {
    if (state.zone !== LAVA_ZONE_ID || !state.lavaInterior || battle) return;
    state.lavaInterior = false;
    player.x = LAVA_CAVE.x;
    player.y = LAVA_CAVE.y + 28;
    cam.x = player.x;
    cam.y = player.y;
    spawnMobs();
    updateHud();
    showToast("Back on Lava Reef island 🏝️");
    if (window.GameMP) GameMP.setSubroom(mpSubroom());
    saveState();
  }

  function enterDepthsCave() {
    if (state.zone !== DEPTHS_ZONE_ID || state.depthsInterior || battle) return;
    state.depthsInterior = true;
    const spawn = resolveSafeSpawn(DEPTHS_INTERIOR.spawn);
    player.x = spawn.x;
    player.y = spawn.y;
    cam.x = player.x;
    cam.y = player.y;
    spawnMobs();
    updateHud();
    showToast("Inside the Depths Mineral Cave! New layout + exit tunnel active 💎");
    if (window.GameMP) GameMP.setSubroom(mpSubroom());
    saveState();
  }

  function exitDepthsCave() {
    if (state.zone !== DEPTHS_ZONE_ID || !state.depthsInterior || battle) return;
    state.depthsInterior = false;
    document.getElementById("pickaxe-overlay")?.classList.add("hidden");
    player.x = DEPTHS_CAVE.x;
    player.y = DEPTHS_CAVE.y + 36;
    cam.x = player.x;
    cam.y = player.y;
    spawnMobs();
    updateHud();
    showToast("Back on The Depths island 🌀");
    if (window.GameMP) GameMP.setSubroom(mpSubroom());
    saveState();
  }

  function spawnMobs() {
    mobs = [];
    pondRespawnTimer = 0;
    const zone = currentZone();
    if (zone.isPvp) {
      boss = { x: 0, y: 0, beaten: true };
      return;
    }
    if (zone.isLavaReef && state.lavaInterior) {
      for (let i = 0; i < 12; i++) {
      mobs.push(createMob(i, zone));
    }
      boss = { x: 0, y: 0, beaten: true };
      return;
    }
    if (zone.isDepthsCave && state.depthsInterior) {
      for (let i = 0; i < 12; i++) {
        mobs.push(createMob(i, zone));
      }
      boss = { x: 0, y: 0, beaten: true };
      return;
    }
    const mobCount =
      zone.isPier || zone.isLavaReef || zone.isHurricane || zone.isDepthsCave ? 12 : 14;
    for (let i = 0; i < mobCount; i++) {
      mobs.push(createMob(i, zone));
    }
    addPondFish(zone);
    refreshBoss(zone);
  }

  function travelToZone(zoneId, entryEdge, opts) {
    opts = opts || {};
    if (battle || zoneId === state.zone) return;
    if (!opts.returnTrip && zoneId > state.zone) {
      if (!boss.beaten) {
        showToast("Beat this island's boss first!");
        return;
      }
    if (!isZoneUnlocked(zoneId)) {
      const z = getZone(zoneId);
        showToast(`Need Lv ${z.reqLevel} to reach ${z.name}!`);
      return;
    }
    }
    state.previousZone = state.zone;
    state.zone = zoneId;
    state.lavaInterior = false;
    state.depthsInterior = false;
    const zone = getZone(zoneId);
    const spawn = resolveSafeSpawn(zoneEntrySpawn(zone, entryEdge));
    player.x = spawn.x;
    player.y = spawn.y;
    cam.x = player.x;
    cam.y = player.y;
    spawnMobs();
    updateHud();
    if (opts.returnTrip) {
      showToast(`Returned to ${zone.name}`);
    } else {
      const detail = zone.isPier ? "home base" : zone.isPvp ? "PvP battles" : `Wild Lv ${zone.mobLevel}`;
      showToast(`Sailed to ${zone.name} · ${detail}`);
    }
    edgeTravelDir = null;
    btnSticky.sail = false;
    btnSticky.goBackWorld = false;
    if (window.GameMP) GameMP.setSubroom(mpSubroom());
    saveState();
  }

  function goBackWorld() {
    if (battle || !canGoBackWorld()) return;
    travelToZone(priorWorldZoneId(), "north", { returnTrip: true });
  }

  function updateEdgeTravel(zone) {
    edgeTravelDir = null;
    nearSailDock = false;
    btnSticky.sail = false;
    if (battle || zone.isPvp || (zone.isLavaReef && state.lavaInterior) || (zone.isDepthsCave && state.depthsInterior)) return;

    if (southPortalVisible()) {
      const portal = southDockPortalPos(zone);
      const dist = Math.hypot(portal.x - player.x, portal.y - player.y);
      if (stickyNear(dist, 54, 82, "sail")) {
        edgeTravelDir = "south";
        nearSailDock = true;
      }
    }

    const edge = getNearWorldEdge();
    if (edge === "north" && state.zone > 0) {
      edgeTravelDir = "north";
      nearSailDock = true;
      btnSticky.sail = true;
    }
  }

  function tryEnterSouthDockPortal() {
    if (battle || !southPortalVisible()) return false;
    if (!southPortalActive()) {
      const nextZone = getZone(state.zone + 1);
      showToast(`Need Lv ${nextZone.reqLevel} to enter the portal!`);
      return false;
    }
    travelToZone(state.zone + 1, "north");
    return true;
  }

  function sailViaEdge() {
    if (!edgeTravelDir || battle) return;
    if (edgeTravelDir === "south") {
      tryEnterSouthDockPortal();
    } else {
      travelToZone(state.zone - 1, "south");
    }
  }

  function collides(wx, wy, r) {
    const zone = currentZone();
    if (zone.isLavaReef && state.lavaInterior) {
      for (let a = 0; a < 8; a++) {
        const px = wx + Math.cos((a * Math.PI) / 4) * r;
        const py = wy + Math.sin((a * Math.PI) / 4) * r;
        if (!lavaInteriorWalkable(px, py)) return true;
      }
      return false;
    }
    if (zone.isDepthsCave && state.depthsInterior) {
      for (let a = 0; a < 8; a++) {
        const px = wx + Math.cos((a * Math.PI) / 4) * r;
        const py = wy + Math.sin((a * Math.PI) / 4) * r;
        if (!depthsInteriorWalkable(px, py)) return true;
      }
      return false;
    }
    if (zone.isLavaReef) {
      for (let a = 0; a < 8; a++) {
        const px = wx + Math.cos((a * Math.PI) / 4) * r;
        const py = wy + Math.sin((a * Math.PI) / 4) * r;
        if (!lavaExteriorWalkable(px, py)) return true;
      }
      return false;
    }
    if (zone.isHurricane) {
      for (let a = 0; a < 8; a++) {
        const px = wx + Math.cos((a * Math.PI) / 4) * r;
        const py = wy + Math.sin((a * Math.PI) / 4) * r;
        if (!hurricaneWalkable(px, py)) return true;
      }
      return false;
    }
    if (zone.isDepthsCave) {
      for (let a = 0; a < 8; a++) {
        const px = wx + Math.cos((a * Math.PI) / 4) * r;
        const py = wy + Math.sin((a * Math.PI) / 4) * r;
        if (!depthsExteriorWalkable(px, py)) return true;
      }
      return false;
    }
    if (zone.isArctic) {
      for (let a = 0; a < 8; a++) {
        const px = wx + Math.cos((a * Math.PI) / 4) * r;
        const py = wy + Math.sin((a * Math.PI) / 4) * r;
        if (!arcticExteriorWalkable(px, py)) return true;
      }
      return false;
    }
    if (zone.isPier) {
      for (let a = 0; a < 8; a++) {
        const px = wx + Math.cos((a * Math.PI) / 4) * r;
        const py = wy + Math.sin((a * Math.PI) / 4) * r;
        if (!islandWalkable(px, py)) return true;
      }
      return false;
    }
    for (let a = 0; a < 8; a++) {
      const px = wx + Math.cos((a * Math.PI) / 4) * r;
      const py = wy + Math.sin((a * Math.PI) / 4) * r;
      if (!tileZoneWalkable(px, py)) return true;
    }
    return false;
  }

  function resolveSafeSpawn(spawn) {
    const clampX = (x) => Math.max(WORLD_MARGIN + PLAYER_R, Math.min(WORLD_W - WORLD_MARGIN - PLAYER_R, x));
    const clampY = (y) => Math.max(WORLD_MARGIN + PLAYER_R, Math.min(PLAYABLE_H - WORLD_MARGIN - PLAYER_R, y));
    const base = { x: clampX(spawn.x), y: clampY(spawn.y) };
    if (!collides(base.x, base.y, PLAYER_R)) return base;

    const step = 16;
    for (let radius = step; radius <= 220; radius += step) {
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        const tx = clampX(base.x + Math.cos(ang) * radius);
        const ty = clampY(base.y + Math.sin(ang) * radius);
        if (!collides(tx, ty, PLAYER_R)) return { x: tx, y: ty };
      }
    }
    return base;
  }

  function isOnZoneDock(wx, wy) {
    return isOnDockForZone(wx, wy, currentZone());
  }

  function tileZoneWalkable(wx, wy) {
    const zone = currentZone();
    if (isOnDockForZone(wx, wy, zone)) return true;
    if (isOnSouthPortal(wx, wy)) return southPortalActive();
    if (wx < WORLD_MARGIN || wy < WORLD_MARGIN || wx > WORLD_W - WORLD_MARGIN || wy >= PLAYABLE_H) {
      return false;
    }
    if (onZoneIslandLand(wx, wy)) {
      if (zone.id === 1 && isInCoralPond(wx, wy)) return false;
      return true;
    }
    return false;
  }

  function pierRenderBounds() {
    let xMin = 0;
    let yMin = 0;
    let xMax = WORLD_W;
    let yMax = WORLD_H;
    DOCKS.forEach((d) => {
      const r = dockRect(d.facing);
      xMin = Math.min(xMin, r.x1);
      yMin = Math.min(yMin, r.y1);
      xMax = Math.max(xMax, r.x2);
      yMax = Math.max(yMax, r.y2);
    });
    return { xMin, yMin, xMax, yMax };
  }

  function drawIslandTerrain(camX, camY, zone, animT) {
    const tile = TERRAIN_TILE;
    const bounds = pierRenderBounds();
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx + tile < bounds.xMin || ty + tile < bounds.yMin) continue;
        if (tx > bounds.xMax || ty > bounds.yMax) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        const seed = tx + ty;
        if (isInPond(wx, wy)) {
          FMSprites.drawPondPatch(ctx, sx, sy, tile, tile, animT, seed);
        } else if (onIslandLand(wx, wy)) {
          FMSprites.drawIslandGrass(ctx, sx, sy, tile, tile, seed, shoreDistance(wx, wy));
        } else {
          const shore = shoreDistance(wx, wy);
          FMSprites.drawOceanTile(ctx, sx, sy, tile, tile, animT, seed, shore);
        }
      }
    }

    DOCKS.forEach((d) => {
      const r = dockRect(d.facing);
      const sx = r.x1 - camX;
      const sy = r.y1 - camY;
      const dw = r.x2 - r.x1;
      const dh = r.y2 - r.y1;
      if (sx + dw < -120 || sx > w + 120 || sy + dh < -120 || sy > h + 120) return;
      FMSprites.drawDock(ctx, sx, sy, dw, dh, d.facing, animT, r.x1, r.y1);
    });


    ISLAND_TREES.forEach((t) => {
      const s = worldToScreen(t.x, t.y);
      if (s.x < -80 || s.x > w + 80 || s.y < -100 || s.y > h + 40) return;
      FMSprites.drawOakTree(ctx, s.x, s.y, 1.15, animT);
    });
  }

  function drawDepthsCave(camX, camY, zone, animT) {
    const tile = TERRAIN_TILE;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty >= PLAYABLE_H) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        const seed = tx + ty;
        if (onDepthsLand(wx, wy)) {
          FMSprites.drawCaveGround(ctx, sx, sy, tile, tile, seed, animT);
        } else {
          const shore = depthsShoreDistance(wx, wy);
          FMSprites.drawOceanTile(ctx, sx, sy, tile, tile, animT, seed, shore, "green");
        }
      }
    }

    drawZoneDocks(camX, camY, zone, animT);

  }

  function drawDepthsInterior(camX, camY, zone, animT) {
    const tile = 30;
    const b = DEPTHS_INTERIOR;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        if (wx < b.x1 || wy < b.y1 || wx > b.x2 || wy > b.y2) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const seed = tx + ty;
        const nearWall =
          wx < b.x1 + DEPTHS_WALL ||
          wx > b.x2 - DEPTHS_WALL ||
          wy < b.y1 + DEPTHS_WALL ||
          wy > b.y2 - DEPTHS_WALL;
        if (nearWall) {
          FMSprites.drawDepthsChamberWall(ctx, sx, sy, tile, tile, seed, animT);
        } else {
          FMSprites.drawCaveGround(ctx, sx, sy, tile, tile, seed, animT);
        }
      }
    }

    DEPTHS_PILLARS.forEach((p, i) => {
      const ps = worldToScreen(p.x, p.y);
      if (ps.x < -80 || ps.x > w + 80 || ps.y < -80 || ps.y > h + 80) return;
      FMSprites.drawDepthsStalactite(ctx, ps.x, ps.y, 1.05, animT + i * 0.5);
    });

    DEPTHS_ABYSS_POOLS.forEach((pool, i) => {
      const ps = worldToScreen(pool.x, pool.y);
      if (ps.x < -160 || ps.x > w + 160 || ps.y < -120 || ps.y > h + 120) return;
      FMSprites.drawAbyssPool(ctx, ps.x, ps.y, pool.rx, pool.ry, animT, i + 40);
    });
    DEPTHS_MINERALS.forEach((m, i) => {
      const ms = worldToScreen(m.x, m.y);
      if (ms.x < -80 || ms.x > w + 80 || ms.y < -80 || ms.y > h + 80) return;
      FMSprites.drawCrystalCluster(ctx, ms.x, ms.y, m.scale, animT + i * 0.4, m.hue);
    });

    const ps = worldToScreen(DEPTHS_PICKAXE_SHOP.x, DEPTHS_PICKAXE_SHOP.y);
    if (ps.x > -100 && ps.x < w + 100 && ps.y > -100 && ps.y < h + 60) {
      FMSprites.drawShopBuilding(ctx, ps.x, ps.y, "pickaxe", animT);
      FMSprites.drawLabel(ctx, "⛏️ Pickaxe Shop", ps.x, ps.y - 18);
    }

    const tunnelS = worldToScreen(b.spawn.x, b.spawn.y);
    if (tunnelS.x > -120 && tunnelS.x < w + 120) {
      FMSprites.drawCaveEntrance(ctx, tunnelS.x, tunnelS.y, animT, false);
      FMSprites.drawLabel(ctx, "🕳️ Depths Tunnel", tunnelS.x, tunnelS.y + 38);
    }

    const es = worldToScreen(b.exit.x, b.exit.y);
    if (es.x > -80 && es.x < w + 80) {
      FMSprites.drawCaveEntrance(ctx, es.x, es.y, animT, true);
      FMSprites.drawLabel(ctx, "🔥 Lava Fish · Lv 35", es.x, es.y - 52);
    }
  }

  function drawHurricaneDespair(camX, camY, zone, animT) {
    const tile = 30;
    FMSprites.drawHurricaneUnderclouds(ctx, camX, camY, w, h, HURRICANE, animT);

    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty > WORLD_H) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        const seed = tx + ty;

        if (isInHurricaneVoid(wx, wy)) {
          FMSprites.drawFloatingVoid(ctx, sx, sy, tile, tile, animT, seed, camY);
        } else if (isInHurricaneWhiteWater(wx, wy)) {
          FMSprites.drawWhiteWaterTile(ctx, sx, sy, tile, tile, animT, seed, hurricaneWhiteShoreDist(wx, wy));
        } else if (isInHurricaneEye(wx, wy)) {
          FMSprites.drawHurricaneEye(ctx, sx, sy, tile, tile, animT, seed);
        } else if (onHurricaneRing(wx, wy)) {
          FMSprites.drawStormGround(ctx, sx, sy, tile, tile, seed);
        } else {
          FMSprites.drawFloatingVoid(ctx, sx, sy, tile, tile, animT, seed, camY);
        }
      }
    }

    HURRICANE_TREES.forEach((t) => {
      const s = worldToScreen(t.x, t.y);
      if (s.x < -80 || s.x > w + 80 || s.y < -100 || s.y > h + 40) return;
      FMSprites.drawStormTree(ctx, s.x, s.y, 1.1, animT + t.x * 0.001);
    });

    const eyeS = worldToScreen(HURRICANE.cx, HURRICANE.cy);
    if (eyeS.x > -120 && eyeS.x < w + 120) {
      FMSprites.drawLabel(ctx, "🎣 Hurricane Eye Pond", eyeS.x, eyeS.y - HURRICANE.eyeRy - 8);
    }

    drawZoneDocks(camX, camY, zone, animT);
  }

  function drawLavaReefExterior(camX, camY, zone, animT) {
    const tile = 30;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty > WORLD_H) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        const seed = tx + ty;
        if (isOnLavaVolcanoBridge(wx, wy)) {
          FMSprites.drawLavaBridge(ctx, sx, sy, tile, tile, seed, animT);
        } else if (isInLavaVolcano(wx, wy)) {
          FMSprites.drawLavaVolcanoGround(ctx, sx, sy, tile, tile, seed, animT);
        } else if (onLavaRockLand(wx, wy)) {
          FMSprites.drawLavaRockGround(ctx, sx, sy, tile, tile, seed, lavaShoreDistance(wx, wy), animT);
        } else {
          const shore = lavaShoreDistance(wx, wy);
          FMSprites.drawOceanTile(ctx, sx, sy, tile, tile, animT, seed, shore);
        }
      }
    }

    drawZoneDocks(camX, camY, zone, animT);

    LAVA_BRIDGE_ANCHORS.forEach((anchor, i) => {
      const from = worldToScreen(anchor.x, anchor.y);
      const to = worldToScreen(LAVA_VOLCANO.cx, LAVA_VOLCANO.cy);
      if (from.x < -120 && to.x < -120) return;
      if (from.x > w + 120 && to.x > w + 120) return;
      FMSprites.drawLavaBridgeSpan(ctx, from.x, from.y, to.x, to.y, animT + i * 0.7);
    });

    const vs = worldToScreen(LAVA_VOLCANO.cx, LAVA_VOLCANO.cy);
    if (vs.x > -200 && vs.x < w + 200 && vs.y > -200 && vs.y < h + 200) {
      FMSprites.drawVolcano(ctx, vs.x, vs.y, 1.35, animT, true);
    }

  }

  function drawLavaInterior(camX, camY, zone, animT) {
    const tile = 30;
    const b = LAVA_INTERIOR;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        if (wx < b.x1 || wy < b.y1 || wx > b.x2 || wy > b.y2) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const seed = tx + ty;
        const nearWall =
          wx < b.x1 + INTERIOR_WALL ||
          wx > b.x2 - INTERIOR_WALL ||
          wy < b.y1 + INTERIOR_WALL ||
          wy > b.y2 - INTERIOR_WALL;
        if (nearWall) {
          let edge = "side";
          if (wy < b.y1 + INTERIOR_WALL) edge = "top";
          else if (wx < b.x1 + INTERIOR_WALL) edge = "left";
          FMSprites.drawVolcanoChamberWall(ctx, sx, sy, tile, tile, seed, animT, edge);
        } else {
          FMSprites.drawVolcanicRock(ctx, sx, sy, tile, tile, seed, animT);
        }
      }
    }

    LAVA_PILLARS.forEach((p, i) => {
      const ps = worldToScreen(p.x, p.y);
      if (ps.x < -80 || ps.x > w + 80 || ps.y < -80 || ps.y > h + 80) return;
      FMSprites.drawMagmaPillar(ctx, ps.x, ps.y, 1.1, animT + i * 0.6);
    });

    LAVA_POOLS.forEach((pool, i) => {
      const ps = worldToScreen(pool.x, pool.y);
      if (ps.x < -160 || ps.x > w + 160 || ps.y < -120 || ps.y > h + 120) return;
      FMSprites.drawLavaPool(ctx, ps.x, ps.y, pool.rx, pool.ry, animT, i);
    });

    const tunnelS = worldToScreen(b.spawn.x, b.spawn.y);
    if (tunnelS.x > -120 && tunnelS.x < w + 120) {
      FMSprites.drawCaveEntrance(ctx, tunnelS.x, tunnelS.y, animT, false);
      FMSprites.drawLabel(ctx, "🌋 Magma Tunnel", tunnelS.x, tunnelS.y + 38);
    }

    const es = worldToScreen(b.exit.x, b.exit.y);
    if (es.x > -80 && es.x < w + 80) {
      FMSprites.drawCaveEntrance(ctx, es.x, es.y, animT, true);
      FMSprites.drawLabel(ctx, "🌋 Exit Volcano", es.x, es.y - 48);
    }
  }

  function drawArcticIsland(camX, camY, zone, animT) {
    const tile = TERRAIN_TILE;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty >= PLAYABLE_H) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        const seed = tx + ty;
        if (isInArcticPond(wx, wy)) {
          FMSprites.drawIcePondPatch(ctx, sx, sy, tile, tile, animT, seed);
        } else if (onArcticLand(wx, wy)) {
          if (isOnArcticIcePath(wx, wy)) {
            FMSprites.drawIcePath(ctx, sx, sy, tile, tile, seed, arcticShoreDistance(wx, wy));
          } else {
            FMSprites.drawIceGround(ctx, sx, sy, tile, tile, seed, arcticShoreDistance(wx, wy));
          }
        } else {
          const shore = arcticShoreDistance(wx, wy);
          FMSprites.drawOceanTile(ctx, sx, sy, tile, tile, animT, seed, shore, "ice");
        }
      }
    }

    ARCTIC_TREES.forEach((t, i) => {
      const s = worldToScreen(t.x, t.y);
      if (s.x < -80 || s.x > w + 80 || s.y < -100 || s.y > h + 40) return;
      FMSprites.drawIceTree(ctx, s.x, s.y, 1.1, animT + i * 0.32);
    });

    const pondS = worldToScreen(ARCTIC_ISLAND.cx, ARCTIC_ISLAND.cy);
    if (pondS.x > -120 && pondS.x < w + 120) {
      FMSprites.drawLabel(ctx, "🎣 Ice Pond", pondS.x, pondS.y - ARCTIC_ISLAND.pondRy - 10);
    }

    drawZoneDocks(camX, camY, zone, animT);
  }

  function drawGenericZoneIsland(camX, camY, zone, animT) {
    const tile = TERRAIN_TILE;
    const isHorror = zone.decor === "horror";
    const terrainStyle = isHorror ? "horror" : null;
    const waterStyle = isHorror ? "horror" : undefined;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty >= PLAYABLE_H) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        const seed = tx + ty;
        if (onZoneIslandLand(wx, wy)) {
          FMSprites.drawIslandGrass(ctx, sx, sy, tile, tile, seed, zoneShoreDistance(wx, wy), terrainStyle);
        } else {
          const shore = zoneShoreDistance(wx, wy);
          FMSprites.drawOceanTile(ctx, sx, sy, tile, tile, animT, seed, shore, waterStyle);
        }
      }
    }

    if (isHorror) {
      HORROR_TREES.forEach((t, i) => {
        const s = worldToScreen(t.x, t.y);
        if (s.x < -80 || s.x > w + 80 || s.y < -100 || s.y > h + 40) return;
        FMSprites.drawHauntedTree(ctx, s.x, s.y, 1.08, animT + i * 0.35);
      });
    }

    drawZoneDocks(camX, camY, zone, animT);
  }

  function drawCenterWorldPond(zone, animT) {
    if (!zone) return;
    if (zone.id === 1) return; // Coral Island has its own custom center coral pond.
    if (zone.isLavaReef) return;
    const island = getZoneIsland(zone);
    if (!island) return;
    const c = worldToScreen(island.cx, island.cy);
    if (c.x < -220 || c.x > w + 220 || c.y < -180 || c.y > h + 180) return;
    FMSprites.drawPondPatch(
      ctx,
      c.x - CENTER_POND_RX,
      c.y - CENTER_POND_RY,
      CENTER_POND_RX * 2,
      CENTER_POND_RY * 2,
      animT,
      Math.floor(island.cx + island.cy)
    );
  }

  function drawCoralIsland(camX, camY, zone, animT) {
    const tile = TERRAIN_TILE;
    for (let tx = Math.floor(camX / tile) * tile; tx < camX + w + tile; tx += tile) {
      for (let ty = Math.floor(camY / tile) * tile; ty < camY + h + tile; ty += tile) {
        if (tx < 0 || ty < 0 || tx > WORLD_W || ty >= PLAYABLE_H) continue;
        const sx = tx - camX;
        const sy = ty - camY;
        const wx = tx + tile * 0.5;
        const wy = ty + tile * 0.5;
        const seed = tx + ty;
        if (onZoneIslandLand(wx, wy)) {
          if (isInCoralPond(wx, wy)) FMSprites.drawPondPatch(ctx, sx, sy, tile, tile, animT, seed);
          else FMSprites.drawSandGround(ctx, sx, sy, tile, tile, seed, zoneShoreDistance(wx, wy));
        } else {
          const shore = zoneShoreDistance(wx, wy);
          FMSprites.drawOceanTile(ctx, sx, sy, tile, tile, animT, seed, shore);
        }
      }
    }

    drawZoneDocks(camX, camY, zone, animT);
  }

  function resize() {
    const wrap = document.getElementById("game-wrap");
    if (!canvas || !wrap) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (battleCanvas && battleCtx) {
      const bw = battleCanvas.clientWidth || 320;
      const bh = battleCanvas.clientHeight || 140;
      battleCanvas.width = Math.round(bw * dpr);
      battleCanvas.height = Math.round(bh * dpr);
      battleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (catchCelebration) resizeCatchCelebrationCanvas();
  }

  function worldToScreen(wx, wy) {
    return { x: wx - cam.x + w * 0.5, y: wy - cam.y + h * 0.52 };
  }

  function screenToWorld(sx, sy) {
    return { x: sx + cam.x - w * 0.5, y: sy + cam.y - h * 0.52 };
  }

  function drawCastLinePreview() {
    if (!castLine.active) return;
    const start = worldToScreen(player.x, player.y - 8);
    const endX = castLine.endScreenX;
    const endY = castLine.endScreenY;
    const len = Math.hypot(endX - start.x, endY - start.y);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.fillStyle = "#ffe082";
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "700 11px system-ui,sans-serif";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 3;
    const tx = (start.x + endX) * 0.5;
    const ty = (start.y + endY) * 0.5 - 8;
    const label = `${Math.round(len)} cast`;
    ctx.strokeText(label, tx, ty);
    ctx.fillText(label, tx, ty);
    ctx.restore();
  }

  function castIntoPond(sx, sy) {
    if (battle) return;
    const zone = currentZone();
    const ponds = getZonePonds(zone);
    if (!ponds.length) {
      showToast("No pond in this world to cast into.");
      return;
    }
    const targetW = screenToWorld(sx, sy);
    const pondIndex = ponds.findIndex((p) => isInEllipse(targetW.x, targetW.y, p));
    if (pondIndex < 0) {
      showToast("Cast into the pond to hook a fish!");
      return;
    }
    const pondFish = mobs.filter((m) => m.pondId === pondIndex);
    if (!pondFish.length) {
      showToast("This pond is empty. Fish will respawn soon.");
      if (!pondRespawnTimer) pondRespawnTimer = performance.now() + POND_RESPAWN_MS;
      return;
    }
    let hooked = pondFish[0];
    let best = Infinity;
    pondFish.forEach((m) => {
      const d = Math.hypot(m.x - targetW.x, m.y - targetW.y);
      if (d < best) {
        best = d;
        hooked = m;
      }
    });
    startBattle(hooked, false);
  }

  function drawWorld() {
    const camX = cam.x - w * 0.5;
    const camY = cam.y - h * 0.52;
    const zone = currentZone();

    ctx.fillStyle = zone.skyTop || "#87ceeb";
    ctx.fillRect(0, 0, w, h);

    FMSprites.drawZoneSky(ctx, w, h, camX, camY, zone, animT);

    if (zone.isPier) {
      drawIslandTerrain(camX, camY, zone, animT);
    } else if (zone.isLavaReef) {
      drawLavaReefExterior(camX, camY, zone, animT);
    } else if (zone.isDepthsCave) {
      drawDepthsCave(camX, camY, zone, animT);
    } else if (zone.isHurricane) {
      drawHurricaneDespair(camX, camY, zone, animT);
    } else if (zone.isArctic) {
      drawArcticIsland(camX, camY, zone, animT);
    } else if (zone.id === 1) {
      drawCoralIsland(camX, camY, zone, animT);
    } else {
      drawGenericZoneIsland(camX, camY, zone, animT);
    }

    drawCenterWorldPond(zone, animT);
    drawCastLinePreview();

    drawZoneFishShop(zone, animT);
    drawSouthDockPortal(zone, animT);
    drawNorthGoBackPortal(zone, animT);

    if (boss && !boss.beaten && !(zone.isLavaReef && state.lavaInterior) && !(zone.isDepthsCave && state.depthsInterior)) {
      const bs = worldToScreen(boss.x, boss.y);
      if (bs.x > -120 && bs.x < w + 120 && bs.y > -100 && bs.y < h + 80) {
        const bossLv = zoneMobLevel(zone) + 3;
        FMSprites.drawMythicFish(ctx, bs.x, bs.y, animT, zone, bossLv);
        FMSprites.drawLabel(ctx, "👑 South Dock Boss", bs.x, bs.y - 28);
      }
    }

    mobs.forEach((m) => {
      const s = worldToScreen(m.x, m.y);
      if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
      FMSprites.drawWildFish(ctx, s.x, s.y, FISH_TYPES[m.typeKey], animT + m.id, m.mobLevel);
    });

    if (zone.isPier) {
      const fs = worldToScreen(FEED_STATION.x, FEED_STATION.y);
      FMSprites.drawLabel(ctx, "🍤 Bait Station", fs.x, fs.y - 18);
      ctx.fillStyle = "#ffb74d";
      ctx.strokeStyle = "#37474f";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fs.x - 26, fs.y - 8, 52, 22, 8);
      ctx.fill();
      ctx.stroke();

      const bs = worldToScreen(BREED_STATION.x, BREED_STATION.y);
      FMSprites.drawLabel(ctx, "🧬 Fusion Tank", bs.x, bs.y - 52);
      ctx.fillStyle = "rgba(123,31,162,0.35)";
      ctx.strokeStyle = "#4a148c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bs.x - 34, bs.y - 28, 68, 56, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(178,235,242,0.55)";
      ctx.fillRect(bs.x - 26, bs.y - 18, 52, 28);
      ctx.strokeStyle = "#7b1fa2";
      ctx.strokeRect(bs.x - 26, bs.y - 18, 52, 28);
      ctx.fillStyle = "#ce93d8";
      ctx.beginPath();
      ctx.ellipse(bs.x, bs.y + 22, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      state.collection.forEach((d, i) => {
        const px = ISLAND.cx - ISLAND.rx * 0.35 + (i % 4) * (ISLAND.rx * 0.2);
        const py = ISLAND.cy + ISLAND.ry * 0.45 + Math.floor(i / 4) * (ISLAND.ry * 0.25);
        const s = worldToScreen(px, py);
        if (s.x < -60 || s.x > w + 60 || s.y < -60 || s.y > h + 60) return;
        FMSprites.drawWildFish(ctx, s.x, s.y, FISH_TYPES[d.typeKey] || FISH_TYPES.guppy, animT + i, state.level);
        if (d.id === state.activeDino) {
          ctx.font = "600 9px system-ui,sans-serif";
          ctx.fillStyle = "#ffeb3b";
          ctx.fillText("★ Active", s.x, s.y - 36);
        }
      });
    }

    const entities = [];
    remotePlayers.forEach((p) => {
      const st = p.state || {};
      if (st.battle) return;
      const wx = typeof st.x === "number" ? st.x : WORLD_W / 2;
      const wy = typeof st.y === "number" ? st.y : PLAYABLE_H / 2;
      entities.push({ type: "remote", y: wy, p, st, wx, wy });
    });
    entities.push({ type: "player", y: player.y });
    entities.sort((a, b) => a.y - b.y);

    entities.forEach((e) => {
      if (e.type === "remote") {
        const s = worldToScreen(e.wx, e.wy);
        if (s.x < -80 || s.x > w + 80 || s.y < -80 || s.y > h + 80) return;
        FMSprites.drawTrainer(ctx, s.x, s.y, 0.85, e.st.style || "cute", e.st.facing || 1, animT + (e.p.id || 0), {
          bounce: true,
          upgrades: e.st.equipped || e.st.expansions || e.st.upgrades || [],
          riding: !!e.st.riding,
          dinoType: FISH_TYPES[e.st.activeDino || "guppy"],
        });
        drawNameLabel(s.x, s.y - 42, e.p.name, "#90caf9");
      } else {
        const ps = worldToScreen(player.x, player.y);
        const activeType = FISH_TYPES[(getActiveFish() || {}).typeKey || "guppy"];
        FMSprites.drawTrainer(ctx, ps.x, ps.y, 0.85, state.style, player.facing, animT, {
          bounce: true,
          upgrades: state.equipped,
          riding,
          dinoType: activeType,
          hideCompanion: riding,
        });
        drawNameLabel(ps.x, ps.y - 42, state.name, "#e1bee7");
      }
    });

    const ps = worldToScreen(player.x, player.y);
    FMSprites.drawPostFX(ctx, w, h, animT, ps.x, ps.y, zone);
  }

  function updateWorld(dt) {
    if (battle) return;
    const zone = currentZone();

    let dx = joy.dx;
    let dy = joy.dy;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;
    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      const spd = PLAYER_SPEED * boatSpeedMult() * dt;
      const nx = player.x + dx * spd;
      const ny = player.y + dy * spd;
      if (!collides(nx, player.y, PLAYER_R)) player.x = nx;
      if (!collides(player.x, ny, PLAYER_R)) player.y = ny;
      player.facing = dx >= 0 ? 1 : -1;
    }

    // Lock camera while moving — laggy follow made the player drift on screen.
    if (len > 0) {
      cam.x = player.x;
      cam.y = player.y;
    } else {
      const follow = Math.min(1, dt * 12);
      cam.x += (player.x - cam.x) * follow;
      cam.y += (player.y - cam.y) * follow;
    }

    if (zone.isPier) {
      state.coins += parkIncomeRate() * dt;
      parkCoinTimer += dt;
      if (parkCoinTimer > 4) {
        parkCoinTimer = 0;
        updateHud();
      }
      nearFeed = stickyNear(
        Math.hypot(FEED_STATION.x - player.x, FEED_STATION.y - player.y),
        38,
        50,
        "feed"
      );
      nearBreed = stickyNear(
        Math.hypot(BREED_STATION.x - player.x, BREED_STATION.y - player.y),
        38,
        50,
        "breed"
      );
      nearBuyShop = stickyNear(
        Math.hypot(BUY_SHOP.x - player.x, BUY_SHOP.y - player.y),
        64,
        90,
        "buyShop"
      );
      nearSellShop = stickyNear(
        Math.hypot(SELL_SHOP.x - player.x, SELL_SHOP.y - player.y),
        52,
        76,
        "sellShop"
      );
    } else {
      nearFeed = false;
      nearBreed = false;
      btnSticky.feed = false;
      btnSticky.breed = false;
      if ((zone.isLavaReef && state.lavaInterior) || (zone.isDepthsCave && state.depthsInterior)) {
        nearBuyShop = false;
        nearSellShop = false;
        btnSticky.buyShop = false;
        btnSticky.sellShop = false;
      } else {
        const shop = zoneFishShopPos(zone);
        nearBuyShop = stickyNear(
          Math.hypot(shop.x - player.x, shop.y - player.y),
          52,
          76,
          "buyShop"
        );
        const sellShop = zoneSellShopPos(zone);
        nearSellShop = stickyNear(
          Math.hypot(sellShop.x - player.x, sellShop.y - player.y),
          52,
          76,
          "sellShop"
        );
      }
    }

    if (zone.isDepthsCave && state.depthsInterior) {
      nearPickaxeShop = stickyNear(
        Math.hypot(DEPTHS_PICKAXE_SHOP.x - player.x, DEPTHS_PICKAXE_SHOP.y - player.y),
        42,
        56,
        "pickaxeShop"
      );
    } else {
      nearPickaxeShop = false;
      btnSticky.pickaxeShop = false;
    }

    if ((zone.isLavaReef && state.lavaInterior) || (zone.isDepthsCave && state.depthsInterior)) {
      nearBoatShop = false;
      btnSticky.boatShop = false;
      btnSticky.ride = false;
      btnSticky.goBackWorld = false;
      riding = false;
    } else {
      const northShop = northDockShopPos(zone);
      nearBoatShop = stickyNear(
        Math.hypot(northShop.x - player.x, northShop.y - player.y),
        34,
        46,
        "boatShop"
      );
      if (state.activeBoat) {
        btnSticky.ride = riding || isOnDockForZone(player.x, player.y, zone);
      } else {
        btnSticky.ride = false;
        riding = false;
      }
      if (canGoBackWorld() && !battle) {
        if (isNearNorthDockReturn(player.x, player.y, zone)) {
          btnSticky.goBackWorld = true;
        } else {
          const ret = northDockReturnPos(zone);
          const retDist = Math.hypot(ret.x - player.x, ret.y - player.y);
          stickyNear(retDist, 40, 64, "goBackWorld");
        }
      } else {
        btnSticky.goBackWorld = false;
      }
    }

    mobs.forEach((m) => {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.pondId != null) {
        const pond = getZonePonds(zone)[m.pondId];
        if (!pond || !isInEllipse(m.x, m.y, pond)) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (zone.isPier) {
        if (!isInOcean(m.x, m.y)) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (zone.isLavaReef && state.lavaInterior && m.poolId != null) {
        const pool = LAVA_POOLS[m.poolId];
        const dx = (m.x - pool.x) / pool.rx;
        const dy = (m.y - pool.y) / pool.ry;
        if (dx * dx + dy * dy > 0.8) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (zone.isDepthsCave && state.depthsInterior && m.poolId != null) {
        const pool = DEPTHS_ABYSS_POOLS[m.poolId];
        const dx = (m.x - pool.x) / pool.rx;
        const dy = (m.y - pool.y) / pool.ry;
        if (dx * dx + dy * dy > 0.8) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (zone.isHurricane) {
        if (!isInHurricaneWhiteWater(m.x, m.y) && !isInHurricaneEye(m.x, m.y)) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (zone.isLavaReef) {
        if (!isInLavaOcean(m.x, m.y)) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (zone.isDepthsCave && !state.depthsInterior) {
        if (!isInDepthsOcean(m.x, m.y)) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (zone.isArctic) {
        const inPond = isInArcticPond(m.x, m.y);
        if (inPond) {
          if (!isInArcticPond(m.x + m.vx * 0.08, m.y + m.vy * 0.08)) {
            m.vx *= -1;
            m.vy *= -1;
            m.x += m.vx * dt * 2;
            m.y += m.vy * dt * 2;
          }
        } else if (!onArcticLand(m.x, m.y)) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else if (!zone.isPier && !zone.isLavaReef && !zone.isHurricane && !zone.isDepthsCave && !zone.isArctic) {
        if (isInZoneOcean(m.x, m.y)) {
          m.vx *= -1;
          m.vy *= -1;
          m.x += m.vx * dt * 2;
          m.y += m.vy * dt * 2;
        }
      } else {
        if (m.x < WORLD_MARGIN || m.x > WORLD_W - WORLD_MARGIN) m.vx *= -1;
        if (m.y < WORLD_MARGIN || m.y > PLAYABLE_H - WORLD_MARGIN) m.vy *= -1;
      }
      const dist = Math.hypot(m.x - player.x, m.y - player.y);
      if (dist < 120) {
        m.vx += (player.x - m.x) / dist * 20 * dt;
        m.vy += (player.y - m.y) / dist * 20 * dt;
      }
    });

    if (!pondRespawnTimer && getZonePonds(zone).length && !mobs.some((m) => m.pondId != null)) {
      pondRespawnTimer = performance.now() + POND_RESPAWN_MS;
    }
    if (pondRespawnTimer && performance.now() >= pondRespawnTimer) {
      addPondFish(zone);
      pondRespawnTimer = 0;
      showToast("Pond fish have respawned! 🎣");
    }

    nearMob = null;
    let nearestMobDist = Infinity;
    mobs.forEach((m) => {
      const d = Math.hypot(m.x - player.x, m.y - player.y);
      if (d < nearestMobDist) {
        nearestMobDist = d;
        nearMob = m;
      }
    });
    if (!stickyNear(nearestMobDist, 70, 92, "mob")) nearMob = null;

    updateEdgeTravel(zone);

    if (
      !battle &&
      !catchCelebration &&
      southPortalActive() &&
      isNearSouthDockPortal(player.x, player.y, zone)
    ) {
      const portal = southDockPortalPos(zone);
      if (Math.hypot(portal.x - player.x, portal.y - player.y) < 26) {
        tryEnterSouthDockPortal();
      }
    }

    // Caves removed: no cave enter/exit triggers.

    const onSouthDock = isOnSouthDock(player.x, player.y, zone);
    const needsBossForPortal =
      onSouthDock &&
      boss &&
      !boss.beaten &&
      state.zone + 1 < ZONES.length &&
      !battle &&
      !(zone.isLavaReef && state.lavaInterior) &&
      !(zone.isDepthsCave && state.depthsInterior);
    if (needsBossForPortal && !edgeBossHintShown) {
      showToast("Beat the South Dock boss — a portal will open here!");
      edgeBossHintShown = true;
    } else if (!needsBossForPortal) {
      edgeBossHintShown = false;
    }

    const bossDist = Math.hypot(boss.x - player.x, boss.y - player.y);
    if (!boss || boss.beaten || zone.isPvp || (zone.isLavaReef && state.lavaInterior) || (zone.isDepthsCave && state.depthsInterior)) {
      btnSticky.boss = false;
    } else {
      stickyNear(bossDist, 100, 130, "boss");
    }

    if (zone.isPvp) btnSticky.mob = false;

    nearCave = false;
    btnSticky.cave = false;

    nearPvp = null;
    if (zone.isPvp) {
      let nearestPvpDist = Infinity;
      remotePlayers.forEach((p) => {
        const st = p.state || {};
        if (st.battle) return;
        const wx = typeof st.x === "number" ? st.x : WORLD_W / 2;
        const wy = typeof st.y === "number" ? st.y : PLAYABLE_H / 2;
        const d = Math.hypot(wx - player.x, wy - player.y);
        if (d < nearestPvpDist) {
          nearestPvpDist = d;
          nearPvp = p;
        }
      });
      if (!stickyNear(nearestPvpDist, 100, 120, "pvp")) nearPvp = null;
    } else {
      btnSticky.pvp = false;
    }

    updateActionButtons();

    updateCatchCelebration(dt);

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) document.getElementById("toast")?.classList.add("hidden");
    }
  }

  function startPvpBattle(peer) {
    const st = peer.state || {};
    const lv = st.level || 5;
    const typeKey = st.activeDino || "guppy";
    const type = FISH_TYPES[typeKey] || FISH_TYPES.guppy;
    const stats = getMobStats(typeKey, lv, false);

    battle = {
      mob: { typeKey, mobLevel: lv },
      isBoss: false,
      isPvp: true,
      mobLevel: lv,
      foeName: `${peer.name || "Trainer"} Lv ${lv}`,
      foeHp: stats.hp,
      foeMaxHp: stats.hp,
      foeAtk: stats.atk,
      youHp: state.hp,
      youMaxHp: maxHp(),
      expReward: Math.floor(stats.exp * 1.5),
      coinReward: Math.floor(stats.coins * 2),
      foeTimer: 0,
      playerTurn: 1,
    };

    document.getElementById("battle-overlay").classList.remove("hidden");
    document.getElementById("battle-banner").textContent = `⚔️ PvP vs ${peer.name || "Trainer"}!`;
    document.getElementById("battle-you-name").textContent = state.name;
    document.getElementById("battle-foe-name").textContent = battle.foeName;
    updateBattleSpecialBtn();
    updateBattleHud();
    drawBattleScene(true);
  }

  function feedFish() {
    if (!currentZone().isPier) return;
    if (state.coins < FEED_COST) {
      showToast(`Need ${FEED_COST} coins to feed! 🪙`);
      return;
    }
    state.coins -= FEED_COST;
    addExp(FEED_EXP);
    showToast(`Fed your fish! +${FEED_EXP} EXP 🍤`);
    updateHud();
    saveState();
  }

  function toggleRide() {
    if (!state.activeBoat || battle) return;
    riding = !riding;
    const boat = getActiveBoat();
    showToast(riding ? `${boat?.emoji || "🚤"} Under way!` : "Docked your boat.");
  }

  function renderBoatShop() {
    const list = document.getElementById("boat-list");
    const wallet = document.getElementById("boat-wallet");
    if (wallet) {
      wallet.textContent = `Wallet: 🪙 ${fmt(state.coins)} · 🔮 ${fmt(state.pearls)} pearls`;
    }
    if (!list) return;
    list.innerHTML = BOATS.map((boat) => {
      const owned = state.boatsOwned.includes(boat.id);
      const equipped = state.activeBoat === boat.id;
      let btnLabel = boatPriceLabel(boat);
      let btnAction = "buy";
      let btnDisabled = !canAffordBoat(boat);
      if (owned) {
        if (equipped) {
          btnLabel = "Equipped";
          btnDisabled = true;
        } else {
          btnLabel = "Equip";
          btnAction = "equip";
          btnDisabled = false;
        }
      }
      const rowClass = equipped ? "equipped" : owned ? "owned" : "";
      const curLabel = boat.currency === "pearls" ? "pearls" : "coins";
      return `
        <div class="upgrade-item ${rowClass}">
          <span class="icon">${boat.emoji}</span>
          <div class="info">
            <div class="title">${boat.name}${equipped ? " ★" : ""}</div>
            <div class="desc">${boat.desc} · ${curLabel}</div>
          </div>
          <button type="button" data-id="${boat.id}" data-action="${btnAction}" ${btnDisabled ? "disabled" : ""}>
            ${btnLabel}
          </button>
        </div>`;
    }).join("");
    list.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.action === "equip") equipBoat(btn.dataset.id);
        else buyBoat(btn.dataset.id);
      });
    });
  }

  function buyBoat(id) {
    const boat = getBoat(id);
    if (!boat || state.boatsOwned.includes(id)) return;
    if (!canAffordBoat(boat)) {
      showToast(boat.currency === "pearls" ? "Need more pearls! 🔮" : "Need more coins! 🪙");
      return;
    }
    if (boat.currency === "pearls") state.pearls -= boat.cost;
    else state.coins -= boat.cost;
    state.boatsOwned.push(id);
    state.activeBoat = id;
    showToast(`Bought ${boat.emoji} ${boat.name}!`);
    renderBoatShop();
    updateHud();
    saveState();
  }

  function equipBoat(id) {
    const boat = getBoat(id);
    if (!boat || !state.boatsOwned.includes(id)) return;
    state.activeBoat = id;
    showToast(`Equipped ${boat.emoji} ${boat.name}!`);
    renderBoatShop();
    updateHud();
    saveState();
  }

  let fusionPickA = null;
  let fusionPickB = null;

  function fishPower(typeKey) {
    const t = FISH_TYPES[typeKey];
    if (!t) return 0;
    return (t.hp || 40) + (t.atk || 8) * 2.8;
  }

  function fishKind(typeKey) {
    return FISH_TYPES[typeKey]?.kind || "mid";
  }

  function normalizePair(a, b) {
    return a <= b ? [a, b] : [b, a];
  }

  function findFusionRecipe(keyA, keyB) {
    const [x, y] = normalizePair(keyA, keyB);
    return FUSION_RECIPES.find((r) => {
      const [p0, p1] = normalizePair(r.parents[0], r.parents[1]);
      return p0 === x && p1 === y;
    });
  }

  function evolvedForm(typeKey) {
    const t = FISH_TYPES[typeKey];
    return t?.evolve && FISH_TYPES[t.evolve] ? t.evolve : null;
  }

  function bestEvolution(keys) {
    let best = null;
    let bestP = -1;
    keys.forEach((k) => {
      const ev = evolvedForm(k);
      if (ev && fishPower(ev) > bestP) {
        best = ev;
        bestP = fishPower(ev);
      }
    });
    return best;
  }

  function computeFusionResult(keyA, keyB) {
    if (keyA === keyB) {
      const ev = evolvedForm(keyA);
      if (!ev) {
        return { typeKey: null, reason: "Pick two different fish — or fuse a species that can evolve." };
      }
      return { typeKey: ev, reason: "Same species fused into its evolution!" };
    }

    const recipe = findFusionRecipe(keyA, keyB);
    if (recipe) return { typeKey: recipe.result, reason: "Special fusion recipe!" };

    const powA = fishPower(keyA);
    const powB = fishPower(keyB);
    const maxPow = Math.max(powA, powB);
    const minPow = Math.min(powA, powB);
    const total = powA + powB;
    const kinds = new Set([fishKind(keyA), fishKind(keyB)]);

    if (maxPow < 72) {
      if (kinds.has("small")) {
        if (
          keyA.includes("clown") ||
          keyB.includes("clown") ||
          keyA.includes("guppy") ||
          keyB.includes("guppy")
        ) {
          return { typeKey: "fusionClown", reason: "Weak small fish merged into a Fusion Clown!" };
        }
      }
      const ev = bestEvolution([keyA, keyB]);
      if (ev) return { typeKey: ev, reason: "Weak pair upgraded to an evolution!" };
      return { typeKey: "neonGuppy", reason: "Weak fish fused into a stronger fighter!" };
    }

    if (minPow >= 100) {
      if (kinds.has("mythic") || total >= 380) {
        return { typeKey: "fusionTitan", reason: "Elite monsters fused into a Fusion Titan!" };
      }
      if (kinds.has("lava") || keyA === "lavaFish" || keyB === "lavaFish") {
        return { typeKey: "fusionInferno", reason: "Volcanic power unleashed!" };
      }
      if (kinds.has("horror") || kinds.has("deep")) {
        return { typeKey: "fusionAbyss", reason: "Deep horrors merged into Fusion Abyss!" };
      }
      if (kinds.has("storm") || kinds.has("ice")) {
        return { typeKey: "fusionStorm", reason: "Storm and ice fused into Fusion Storm!" };
      }
      if (kinds.has("shark") && kinds.has("fast")) {
        return { typeKey: "fusionHammer", reason: "Speed and strength combined!" };
      }
      if (kinds.has("legend")) {
        return { typeKey: "fusionInferno", reason: "Legendary fish fused into Fusion Inferno!" };
      }
      return { typeKey: "fusionHammer", reason: "Strong pair fused into a powerhouse!" };
    }

    const ev = bestEvolution([keyA, keyB]);
    if (ev) return { typeKey: ev, reason: "Traits blended into an upgrade!" };
    if (maxPow >= 80) return { typeKey: "fusionClown", reason: "Unusual blend created a hybrid!" };
    return { typeKey: "largemouthBass", reason: "Fish merged into a mid-tier fighter!" };
  }

  function fusionPreview() {
    if (!fusionPickA || !fusionPickB) return null;
    const fishA = state.collection.find((f) => f.id === fusionPickA);
    const fishB = state.collection.find((f) => f.id === fusionPickB);
    if (!fishA || !fishB) return null;
    return computeFusionResult(fishA.typeKey, fishB.typeKey);
  }

  function renderFusionTank() {
    const wallet = document.getElementById("fusion-wallet");
    const preview = document.getElementById("fusion-preview");
    const list = document.getElementById("fusion-list");
    const slotA = document.getElementById("fusion-slot-a");
    const slotB = document.getElementById("fusion-slot-b");
    const fuseBtn = document.getElementById("fusion-do-btn");
    if (!list) return;

    if (wallet) wallet.textContent = `Fusion cost: 🪙 ${BREED_COST} · You have 🪙 ${state.coins}`;

    const slotFish = (id) => state.collection.find((f) => f.id === id);
    const renderSlot = (el, id) => {
      if (!el) return;
      const fish = slotFish(id);
      if (!fish) {
        el.innerHTML = `<span class="fusion-slot-empty">Tap a fish below</span>`;
        return;
      }
      const type = FISH_TYPES[fish.typeKey] || FISH_TYPES.guppy;
      el.innerHTML = `<span class="icon">${type.emoji}</span><span>${fish.nickname || type.name}</span>`;
    };
    renderSlot(slotA, fusionPickA);
    renderSlot(slotB, fusionPickB);

    const result = fusionPreview();
    if (preview) {
      if (!fusionPickA || !fusionPickB) {
        preview.textContent = "Pick two fish — weak + weak upgrades, strong + strong creates powerhouses!";
      } else if (!result?.typeKey) {
        preview.textContent = result?.reason || "These fish cannot fuse.";
      } else {
        const out = FISH_TYPES[result.typeKey];
        preview.textContent = `→ ${out.emoji} ${out.name} (HP ${out.hp}, ATK ${out.atk}) — ${result.reason}`;
      }
    }

    if (fuseBtn) {
      fuseBtn.disabled =
        !result?.typeKey ||
        state.coins < BREED_COST ||
        state.collection.length < 2 ||
        !fusionPickA ||
        !fusionPickB ||
        fusionPickA === fusionPickB;
    }

    list.innerHTML = state.collection
      .map((f) => {
        const type = FISH_TYPES[f.typeKey] || FISH_TYPES.guppy;
        const picked = f.id === fusionPickA || f.id === fusionPickB;
        const power = Math.round(fishPower(f.typeKey));
        return `
        <div class="upgrade-item ${picked ? "equipped" : ""}">
          <span class="icon">${type.emoji}</span>
          <div class="info">
            <div class="title">${f.nickname || type.name}${picked ? " ★" : ""}</div>
            <div class="desc">Power ${power} · HP ${type.hp} ATK ${type.atk}</div>
          </div>
          <button type="button" data-fusion-id="${f.id}">${picked ? "Clear" : "Pick"}</button>
        </div>`;
      })
      .join("");

    list.querySelectorAll("button[data-fusion-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.fusionId;
        if (fusionPickA === id) fusionPickA = null;
        else if (fusionPickB === id) fusionPickB = null;
        else if (!fusionPickA) fusionPickA = id;
        else if (!fusionPickB) fusionPickB = id;
        else {
          fusionPickB = id;
        }
        renderFusionTank();
      });
    });
  }

  function openFusionTank() {
    if (!currentZone().isPier || state.collection.length < 2) return;
    fusionPickA = null;
    fusionPickB = null;
    renderFusionTank();
    document.getElementById("fusion-overlay")?.classList.remove("hidden");
  }

  function confirmFusion() {
    if (!currentZone().isPier || state.collection.length < 2) return;
    if (state.coins < BREED_COST) {
      showToast(`Need ${BREED_COST} coins to fuse! 🪙`);
      return;
    }
    if (!fusionPickA || !fusionPickB || fusionPickA === fusionPickB) {
      showToast("Pick two different fish in the Fusion Tank!");
      return;
    }
    const fishA = state.collection.find((f) => f.id === fusionPickA);
    const fishB = state.collection.find((f) => f.id === fusionPickB);
    if (!fishA || !fishB) return;

    const result = computeFusionResult(fishA.typeKey, fishB.typeKey);
    if (!result?.typeKey) {
      showToast(result?.reason || "These fish cannot fuse.");
      return;
    }

    state.coins -= BREED_COST;
    const removedIds = new Set([fishA.id, fishB.id]);
    state.collection = state.collection.filter((f) => !removedIds.has(f.id));
    if (removedIds.has(state.activeDino)) {
      state.activeDino = state.collection[0]?.id || null;
      state.hp = maxHp();
    }

    const outType = FISH_TYPES[result.typeKey];
    state.collection.push({
      id: "d" + Date.now(),
      typeKey: result.typeKey,
      nickname: outType.name,
    });
    fusionPickA = null;
    fusionPickB = null;
    showToast(`Fused ${outType.emoji} ${outType.name}! 🧬`);
    renderFusionTank();
    updateHud();
    saveState();
  }

  function fuseFish() {
    openFusionTank();
  }

  function startBattle(mob, isBoss) {
    castLine.active = false;
    castLine.pointerId = null;
    const zone = currentZone();
    const mobLevel = isBoss ? zoneMobLevel(zone) + 3 : mob.mobLevel;
    const typeKey = isBoss ? (zone.bossType || zone.mobs[0]) : mob.typeKey;
    const type = FISH_TYPES[typeKey];
    const stats = getMobStats(typeKey, mobLevel, isBoss);
    const fish = getActiveFish();
    const attackBtn = document.getElementById("attack-btn");

    battle = {
      mob,
      isBoss,
      mobLevel,
      fishId: fish?.id || state.activeDino,
      foeName: isBoss ? `${FISH_TYPES[typeKey]?.name || "Mythic Boss"}` : `${type.name} Lv ${mobLevel}`,
      foeHp: stats.hp,
      foeMaxHp: stats.hp,
      foeAtk: stats.atk,
      youHp: isBoss ? fishMaxHp(fish) : state.hp,
      youMaxHp: isBoss ? fishMaxHp(fish) : maxHp(),
      expReward: stats.exp,
      coinReward: stats.coins,
      hitCoinsEarned: 0,
      foeTimer: 0,
      playerTurn: 1,
    };

    document.getElementById("battle-overlay").classList.remove("hidden");
    window.GameSFX?.play("battle");
    if (isBoss) {
      const fishType = FISH_TYPES[fish?.typeKey] || FISH_TYPES.guppy;
      document.getElementById("battle-you-name").textContent =
        `${fishType.emoji} ${fish?.nickname || fishType.name}`;
      if (attackBtn) attackBtn.textContent = "🐟 Attack";
      updateBossBattleBanner();
    } else {
      document.getElementById("battle-banner").textContent =
        `Wild ${type.name} Lv ${mobLevel} — catch to capture!`;
    document.getElementById("battle-you-name").textContent = state.name;
      if (attackBtn) attackBtn.textContent = "🎣 Reel";
    }
    document.getElementById("battle-foe-name").textContent = battle.foeName;
    updateBossFishUi();
    updateBattleSpecialBtn();
    updateBattleHud();
    drawBattleScene(true);
  }

  function updateBattleHud() {
    if (!battle) return;
    const youPct = Math.max(0, (battle.youHp / battle.youMaxHp) * 100);
    const foePct = Math.max(0, (battle.foeHp / battle.foeMaxHp) * 100);
    document.getElementById("battle-you-hp").style.width = youPct + "%";
    document.getElementById("battle-foe-hp").style.width = foePct + "%";
    document.getElementById("battle-you-hp-text").textContent =
      `${Math.max(0, Math.floor(battle.youHp))} / ${battle.youMaxHp}`;
    document.getElementById("battle-foe-hp-text").textContent =
      `${Math.max(0, Math.floor(battle.foeHp))} / ${battle.foeMaxHp}`;
    updateBattleSpecialBtn();
  }

  function drawBattleScene(playerAttack) {
    if (!battleCtx) return;
    const zone = currentZone();
    const bw = battleCanvas.clientWidth || 320;
    const bh = battleCanvas.clientHeight || 140;
    battleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    battleCtx.clearRect(0, 0, bw, bh);
    FMSprites.drawBattleArena(battleCtx, bw, bh, zone, animT);
    const shake = playerAttack ? Math.sin(animT * 40) * 4 : 0;
    if (battle.isBoss) {
      const fish = getBattleFish(battle.fishId);
      const fishType = FISH_TYPES[fish?.typeKey || "guppy"] || FISH_TYPES.guppy;
      FMSprites.drawWildFish(
        battleCtx,
        80 + shake,
        80,
        fishType,
        animT,
        state.level
      );
    } else {
    FMSprites.drawTrainer(battleCtx, 80 + shake, 80, 1.1, state.style, 1, animT, {
      panicked: true,
        upgrades: state.equipped,
    });
    }
    if (battle.isBoss) {
      FMSprites.drawMythicFish(battleCtx, 240 - shake, 75, animT, zone, battle.mobLevel);
    } else {
      FMSprites.drawWildFish(
        battleCtx,
        240 - shake,
        80,
        FISH_TYPES[battle.mob?.typeKey || "guppy"],
        animT,
        battle.mobLevel
      );
    }
    window.GameRealism?.postFrame(battleCtx, bw, bh, {
      animT,
      focusX: bw * 0.5,
      focusY: bh * 0.55,
      vignette: 0.26,
      grainCount: 70,
      decor: zone.decor,
    });
  }

  function endBattle(won) {
    document.getElementById("battle-overlay").classList.add("hidden");
    window.GameSFX?.play(won ? "win" : "lose");
    document.getElementById("boss-fish-switch")?.classList.add("hidden");
    const attackBtn = document.getElementById("attack-btn");
    if (attackBtn) attackBtn.textContent = "🎣 Reel";
    if (won) {
      addExp(battle.expReward);
      state.coins += battle.coinReward;
      if (battle.isBoss) {
        const hitCoins = battle.hitCoinsEarned || 0;
        if (!state.bossesBeaten.includes(state.zone)) {
          state.bossesBeaten.push(state.zone);
        }
        boss.beaten = true;
        state.pearls += 5;
        const next = state.zone + 1;
        let portalMsg = "You conquered every zone! 👑";
        if (next < ZONES.length) {
          const nextZone = getZone(next);
          portalMsg = isZoneUnlocked(next)
            ? `Portal opened on the South Dock → ${nextZone.name}`
            : `Portal opened! Need Lv ${nextZone.reqLevel} to enter`;
        }
        showToast(
          `Boss defeated! +${battle.coinReward} 🪙` +
            (hitCoins ? ` (+${hitCoins} 🪙 from attacks)` : "") +
            ` · +${battle.expReward} EXP · +5 🔮 · ${portalMsg}`
        );
      } else if (battle.isPvp) {
        showToast(`PvP win vs ${battle.foeName}! 🏆 · +${battle.expReward} EXP, +${battle.coinReward} 🪙`);
        } else {
        showToast(`Victory! +${battle.expReward} EXP, +${battle.coinReward} 🪙`);
        if (battle.mob) {
        const z = currentZone();
          if (!z.isPvp && (!z.isPier || z.mobs.length)) {
          const typeKey = battle.mob.typeKey;
          const already = state.collection.some((c) => c.typeKey === typeKey);
          if (!already) {
            state.collection.push({
              id: "d" + Date.now(),
              typeKey,
              nickname: FISH_TYPES[typeKey].name,
            });
          } else {
            state.coins += 8;
          }
            showCatchCelebration(typeKey, battle.mobLevel);
        }
        mobs = mobs.filter((m) => m.id !== battle.mob.id);
        if (battle.mob.pondId != null) {
          if (!mobs.some((m) => m.pondId != null) && !pondRespawnTimer) {
            pondRespawnTimer = performance.now() + POND_RESPAWN_MS;
            showToast("Pond is empty... fish will respawn soon.");
          }
        } else {
          setTimeout(() => {
            mobs.push(createMob(Date.now(), currentZone()));
          }, 1500);
        }
      }
      }
      state.hp = battle.isBoss ? maxHp() : Math.min(maxHp(), battle.youHp);
    } else {
      if (battle.isBoss) {
        showToast("Your fish got knocked out — try another fish! 🐟");
      } else {
      showToast("You got knocked out... but healed up!");
      }
      state.hp = maxHp();
    }
    battle = null;
    updateHud();
    saveState();
  }

  function doAttack(special) {
    if (!battle) return;
    if (special && !canUseRockSmash()) {
      const wait = specialTurnsLeft();
      const status = document.getElementById("special-status");
      if (status) {
        status.textContent = `💦 Splash Attack ready in ${wait} turn${wait === 1 ? "" : "s"}…`;
      }
      return;
    }
    const fish = getBattleFish(battle.fishId);
    const powerFn = battle.isBoss ? fishAttackPower : attackPower;
    const specialFn = battle.isBoss ? fishSpecialPower : () => specialPower();
    const dmgMult = battle.isBoss ? 1 : catchMultiplier();
    const dmg = Math.floor((special ? specialFn(fish) : powerFn(fish)) * dmgMult);
    window.GameSFX?.play(special ? "level" : "attack");
    battle.foeHp -= dmg + Math.floor(Math.random() * 4);
    battle.playerTurn++;
    if (battle.isBoss) {
      const hitCoins = bossHitCoins();
      state.coins += hitCoins;
      battle.hitCoinsEarned = (battle.hitCoinsEarned || 0) + hitCoins;
      updateHud();
      updateBossBattleBanner();
    }
    drawBattleScene(true);
    updateBattleHud();
    if (battle.foeHp <= 0) {
      setTimeout(() => endBattle(true), 400);
      return;
    }
    setTimeout(() => {
      if (!battle) return;
      battle.youHp -= battle.foeAtk + Math.floor(Math.random() * 3);
      drawBattleScene(false);
      updateBattleHud();
      if (battle.youHp <= 0) setTimeout(() => endBattle(false), 400);
    }, 350);
  }

  function worldDisplayLevel(zone) {
    if (zone.isLavaReef && zone.interiorMobLevel) {
      return `Lv ${zone.mobLevel} · Cave Lv ${zone.interiorMobLevel}`;
    }
    if (zone.isDepthsCave && zone.interiorMobLevel) {
      return `Lv ${zone.mobLevel} · Cave Lv ${zone.interiorMobLevel}`;
    }
    return `Lv ${zone.mobLevel}`;
  }

  function renderWorldsList() {
    const list = document.getElementById("worlds-list");
    if (!list) return;
    const unlocked = ZONES.filter((z) => isZoneUnlocked(z.id));
    if (!unlocked.length) {
      list.innerHTML = '<p class="worlds-empty">No worlds unlocked yet.</p>';
      return;
    }
    list.innerHTML = unlocked
      .map(
        (z) =>
          `<div class="world-row${state.zone === z.id ? " current" : ""}">` +
          `<span class="world-name">${z.name}${state.zone === z.id ? " · here" : ""}</span>` +
          `<span class="world-lv">${worldDisplayLevel(z)}</span>` +
          `</div>`
      )
      .join("");
  }

  function updateHud() {
    const zone = currentZone();
    document.getElementById("level-display").textContent = `🎣 Lv ${state.level}`;
    document.getElementById("exp-display").textContent =
      `✨ ${fmt(state.exp)} / ${fmt(expToNext(state.level))}`;
    document.getElementById("coin-display").textContent = `🪙 ${fmt(state.coins)}`;
    const pearlEl = document.getElementById("pearl-display");
    if (pearlEl) pearlEl.textContent = `🔮 ${fmt(state.pearls)}`;
    const dino = getActiveFish();
    const fishName = dino ? FISH_TYPES[dino.typeKey]?.name : "Guppy";
    const mobLabel = zone.isPier
      ? `${state.collection.length} fish · wild Lv ${zone.mobLevel} · ${parkIncomeRate()}/sec`
      : zone.isLavaReef && state.lavaInterior
        ? `Magma Chamber · wild Lv ${zone.interiorMobLevel || 20}`
        : zone.isDepthsCave && state.depthsInterior
          ? `Abyss Cavern · Lava Fish Lv ${zone.interiorMobLevel || 35}`
          : zone.isLavaReef
            ? `Lava island · ocean Lv ${zone.mobLevel}`
            : zone.isPvp
              ? "PvP battles"
              : `Wild Lv ${zone.mobLevel}`;
    const areaName =
      zone.isLavaReef && state.lavaInterior
        ? "🌋 Volcano Interior"
        : zone.isDepthsCave && state.depthsInterior
          ? "🕳️ Depths Cave"
          : zone.name;
    document.getElementById("world-label").textContent = `${areaName} · ${mobLabel} · ${fishName}`;
    if (state.hp < maxHp()) state.hp = maxHp();
    if (!document.getElementById("worlds-overlay")?.classList.contains("hidden")) {
      renderWorldsList();
    }
  }

  function renderExpansions() {
    const list = document.getElementById("upgrade-list");
    if (!list) return;
    const gearRows = GEAR.map((u) => {
      const owned = state.expansions.includes(u.id);
      const equipped = isEquipped(u.id);
      const locked = u.req && !state.expansions.includes(u.req);
      let btnLabel = `🪙 ${u.cost}`;
      let btnAction = "buy";
      let btnDisabled = state.coins < u.cost || locked;
      if (owned) {
        if (equipped) {
          btnLabel = "Equipped";
          btnDisabled = true;
        } else {
          btnLabel = "Equip";
          btnAction = "equip";
          btnDisabled = false;
        }
      } else if (locked) {
        btnLabel = "Locked";
      }
      const rowClass = equipped ? "equipped" : owned ? "owned" : "";
      return `
        <div class="upgrade-item ${rowClass}">
          <span class="icon">${u.emoji}</span>
          <div class="info">
            <div class="title">${u.name}${equipped ? " ★" : ""}</div>
            <div class="desc">${u.desc}</div>
          </div>
          <button type="button" data-id="${u.id}" data-action="${btnAction}" ${btnDisabled ? "disabled" : ""}>
            ${btnLabel}
          </button>
        </div>`;
    }).join("");

    const coinBoats = BOATS.filter((b) => b.currency === "coins");
    const boatRows = coinBoats.map((boat) => {
      const owned = state.boatsOwned.includes(boat.id);
      const equipped = state.activeBoat === boat.id;
      let btnLabel = `🪙 ${boat.cost}`;
      let btnAction = "buyBoat";
      let btnDisabled = state.coins < boat.cost;
      if (owned) {
        if (equipped) {
          btnLabel = "Equipped";
          btnDisabled = true;
        } else {
          btnLabel = "Equip";
          btnAction = "equipBoat";
          btnDisabled = false;
        }
      }
      const rowClass = equipped ? "equipped" : owned ? "owned" : "";
      return `
        <div class="upgrade-item ${rowClass}">
          <span class="icon">${boat.emoji}</span>
          <div class="info">
            <div class="title">${boat.name}${equipped ? " ★" : ""}</div>
            <div class="desc">${boat.desc} · coins</div>
          </div>
          <button type="button" data-id="${boat.id}" data-action="${btnAction}" ${btnDisabled ? "disabled" : ""}>
            ${btnLabel}
          </button>
        </div>`;
    }).join("");

    list.innerHTML = `
      <p class="sub">Gear</p>
      ${gearRows}
      <p class="sub">Boat Picks (Money)</p>
      ${boatRows}
    `;

    list.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.action === "equip") equipGear(btn.dataset.id);
        else if (btn.dataset.action === "buy") buyExpansion(btn.dataset.id);
        else if (btn.dataset.action === "equipBoat") equipBoat(btn.dataset.id);
        else if (btn.dataset.action === "buyBoat") buyBoat(btn.dataset.id);
      });
    });
  }

  const ROD_GEAR_IDS = ["rod1", "rod2"];

  function equipGear(id) {
    const u = GEAR.find((x) => x.id === id);
    if (!u || !state.expansions.includes(id)) return;
    if (ROD_GEAR_IDS.includes(id)) {
      state.equipped = state.equipped.filter((x) => !ROD_GEAR_IDS.includes(x));
    }
    if (!state.equipped.includes(id)) state.equipped.push(id);
    state.hp = maxHp();
    showToast(`Equipped ${u.name}! ${u.emoji}`);
    updateHud();
    renderExpansions();
    saveState();
  }

  function sellFishPrice(typeKey) {
    const base = FISH_TYPES[typeKey] || FISH_TYPES.guppy;
    return Math.max(10, Math.floor((base.coins || 5) * 10));
  }

  function renderSellShop() {
    const list = document.getElementById("sell-list");
    if (!list) return;
    if (state.collection.length <= 1) {
      list.innerHTML = `<p class="sub">Keep at least one fish on your team!</p>`;
      return;
    }
    list.innerHTML = state.collection
      .map((f) => {
        const type = FISH_TYPES[f.typeKey] || FISH_TYPES.guppy;
        const price = sellFishPrice(f.typeKey);
        const active = f.id === state.activeDino;
        return `
        <div class="upgrade-item ${active ? "owned" : ""}">
          <span class="icon">${type.emoji}</span>
          <div class="info">
            <div class="title">${f.nickname || type.name}${active ? " ★" : ""}</div>
            <div class="desc">Sell for 🪙 ${price}</div>
          </div>
          <button type="button" data-sell-id="${f.id}" ${state.collection.length <= 1 ? "disabled" : ""}>
            Sell
          </button>
        </div>`;
      })
      .join("");
    list.querySelectorAll("button[data-sell-id]").forEach((btn) => {
      btn.addEventListener("click", () => sellFish(btn.dataset.sellId));
    });
  }

  function sellFish(fishId) {
    if (state.collection.length <= 1) {
      showToast("Keep at least one fish!");
      return;
    }
    const fish = state.collection.find((c) => c.id === fishId);
    if (!fish) return;
    const price = sellFishPrice(fish.typeKey);
    state.coins += price;
    state.collection = state.collection.filter((c) => c.id !== fishId);
    if (state.activeDino === fishId) {
      state.activeDino = state.collection[0].id;
    }
    showToast(`Sold ${fish.nickname || FISH_TYPES[fish.typeKey]?.name} for 🪙 ${price}!`);
    updateHud();
    renderSellShop();
    saveState();
  }

  function getPickaxe(id) {
    return PICKAXES.find((p) => p.id === id) || null;
  }

  function renderPickaxeShop() {
    const wallet = document.getElementById("pickaxe-wallet");
    const list = document.getElementById("pickaxe-list");
    if (!list) return;
    if (wallet) wallet.textContent = `Wallet: 🪙 ${fmt(state.coins)}`;
    list.innerHTML = PICKAXES.map((p) => {
      const owned = state.pickaxesOwned.includes(p.id);
      const equipped = state.activePickaxe === p.id;
      const locked = p.req && !state.pickaxesOwned.includes(p.req);
      let label = `Buy 🪙 ${fmt(p.cost)}`;
      let action = "buy";
      let disabled = state.coins < p.cost || locked;
      if (owned) {
        action = equipped ? "equipped" : "equip";
        label = equipped ? "Equipped" : "Equip";
        disabled = equipped;
      } else if (locked) {
        label = "Locked";
      }
      const rowClass = equipped ? "equipped" : owned ? "owned" : "";
      return `
        <div class="upgrade-item ${rowClass}">
          <span class="icon">${p.emoji}</span>
          <div class="info">
            <div class="title">${p.name}${equipped ? " ★" : ""}</div>
            <div class="desc">${p.desc}</div>
          </div>
          <button type="button" data-pickaxe-id="${p.id}" data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>
        </div>`;
    }).join("");
    list.querySelectorAll("button[data-pickaxe-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.pickaxeId;
        if (btn.dataset.action === "buy") buyPickaxe(id);
        else if (btn.dataset.action === "equip") equipPickaxe(id);
      });
    });
  }

  function buyPickaxe(id) {
    const p = getPickaxe(id);
    if (!p || state.pickaxesOwned.includes(id) || state.coins < p.cost) return;
    if (p.req && !state.pickaxesOwned.includes(p.req)) {
      showToast("Buy earlier pickaxes first.");
      return;
    }
    state.coins -= p.cost;
    state.pickaxesOwned.push(id);
    state.activePickaxe = id;
    showToast(`Bought ${p.emoji} ${p.name}!`);
    updateHud();
    renderPickaxeShop();
    saveState();
  }

  function equipPickaxe(id) {
    const p = getPickaxe(id);
    if (!p || !state.pickaxesOwned.includes(id)) return;
    state.activePickaxe = id;
    showToast(`Equipped ${p.emoji} ${p.name}!`);
    renderPickaxeShop();
    saveState();
  }

  function buyExpansion(id) {
    const u = GEAR.find((x) => x.id === id);
    if (!u || state.expansions.includes(id) || state.coins < u.cost) return;
    if (u.req && !state.expansions.includes(u.req)) {
      showToast("Buy Pro Rod Mk1 first!");
      return;
    }
    state.coins -= u.cost;
    state.expansions.push(id);
    showToast(`Bought ${u.name}! Press Equip to use it. ${u.emoji}`);
    updateHud();
    renderExpansions();
    saveState();
  }

  function setupJoystick() {
    if (window.AllOutControls) {
      AllOutControls.bindJoystick(joy, keys);
      return;
    }
    const base = document.getElementById("joystick-base");
    const knob = document.getElementById("joystick-knob");
    if (!base || !knob) return;
    let pid = null;
    base.addEventListener("pointerdown", (e) => {
      pid = e.pointerId;
      base.setPointerCapture(pid);
      joy.active = true;
    });
    base.addEventListener("pointermove", (e) => {
      if (!joy.active || e.pointerId !== pid) return;
      const r = base.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const max = r.width * 0.35;
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      joy.dx = dx / max;
      joy.dy = dy / max;
    });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      joy.active = false;
      joy.dx = 0;
      joy.dy = 0;
      knob.style.transform = "translate(0,0)";
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
  }

  function gameLoop(now) {
    if (!playing) return;
    const t = typeof now === "number" ? now : performance.now();
    let dt = (t - lastFrame) / 1000;
    if (!Number.isFinite(dt) || dt <= 0) {
      requestAnimationFrame(gameLoop);
      return;
    }
    dt = Math.min(0.05, dt);
    lastFrame = t;
    animT += dt;
    updateWorld(dt);
    drawWorld();
    if (battle) drawBattleScene(false);
    lbTimer += dt;
    if (lbTimer >= 2) {
      lbTimer = 0;
      updateLeaderboard();
    }
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    state.name = document.getElementById("name-input").value.trim().slice(0, 14) || "Angler";
    removeRodShopButton();
    document.getElementById("start-overlay").classList.add("hidden");
    document.getElementById("app").classList.add("playing");
    playing = true;
    state.hp = maxHp();
    riding = false;
    state.zone = 0;
    state.lavaInterior = false;
    state.depthsInterior = false;
    const zone = getZone(state.zone);
    const spawn = resolveSafeSpawn(zoneEntrySpawn(zone));
    player.x = spawn.x;
    player.y = spawn.y;
    cam.x = player.x;
    cam.y = player.y;
    spawnMobs();
    updateHud();
    showToast(LOADING_TIPS[tipIndex % LOADING_TIPS.length]);
    tipIndex++;
    lastFrame = performance.now();
    resize();
    gameLoop();
    initMultiplayer();
    setInterval(() => {
      if (playing && !battle) {
        showToast(LOADING_TIPS[tipIndex % LOADING_TIPS.length]);
        tipIndex++;
      }
    }, 18000);
  }

  function bindEvents() {
    document.getElementById("play-btn").addEventListener("click", startGame);
    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".style-pick").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.style = btn.dataset.style;
        saveState();
      });
    });

    const fishBtn = document.getElementById("fight-btn");
    fishBtn?.addEventListener("pointerdown", (e) => {
      if (!playing || battle) return;
      castLine.active = true;
      castLine.pointerId = e.pointerId;
      castLine.endScreenX = e.clientX;
      castLine.endScreenY = e.clientY;
      fishBtn.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    window.addEventListener("pointermove", (e) => {
      if (!castLine.active || e.pointerId !== castLine.pointerId) return;
      castLine.endScreenX = e.clientX;
      castLine.endScreenY = e.clientY;
    });
    const endCast = (e) => {
      if (!castLine.active || e.pointerId !== castLine.pointerId) return;
      castLine.endScreenX = e.clientX;
      castLine.endScreenY = e.clientY;
      castLine.active = false;
      castLine.pointerId = null;
      castIntoPond(e.clientX, e.clientY);
    };
    window.addEventListener("pointerup", endCast);
    window.addEventListener("pointercancel", endCast);
    document.getElementById("boss-btn").addEventListener("click", () => {
      startBattle(null, true);
    });
    document.getElementById("boss-fish-prev")?.addEventListener("click", () => cycleBossFish(-1));
    document.getElementById("boss-fish-next")?.addEventListener("click", () => cycleBossFish(1));
    document.getElementById("sail-btn").addEventListener("click", sailViaEdge);
    document.getElementById("go-back-world-btn")?.addEventListener("click", goBackWorld);
    document.getElementById("travel-close-btn")?.addEventListener("click", () => {
      document.getElementById("travel-overlay")?.classList.add("hidden");
    });
    document.getElementById("feed-btn")?.addEventListener("click", feedFish);
    document.getElementById("breed-btn")?.addEventListener("click", fuseFish);
    document.getElementById("ride-btn")?.addEventListener("click", toggleRide);
    document.getElementById("pvp-btn")?.addEventListener("click", () => {
      if (nearPvp) startPvpBattle(nearPvp);
    });
    document.getElementById("attack-btn").addEventListener("click", () => doAttack(false));
    document.getElementById("special-btn").addEventListener("click", () => doAttack(true));
    document.getElementById("flee-btn").addEventListener("click", () => endBattle(false));
    document.getElementById("catch-celebration")?.addEventListener("click", hideCatchCelebration);

    document.getElementById("cave-btn")?.addEventListener("click", () => {
      // Caves removed.
    });
    document.getElementById("shop-btn")?.addEventListener("click", () => {
      renderExpansions();
      document.getElementById("upgrade-overlay").classList.remove("hidden");
    });
    document.getElementById("sell-shop-btn")?.addEventListener("click", () => {
      renderSellShop();
      document.getElementById("sell-overlay").classList.remove("hidden");
    });
    document.getElementById("pickaxe-shop-btn")?.addEventListener("click", () => {
      if (!(currentZone().isDepthsCave && state.depthsInterior && nearPickaxeShop)) return;
      renderPickaxeShop();
      document.getElementById("pickaxe-overlay")?.classList.remove("hidden");
    });
    document.getElementById("upgrade-close-btn").addEventListener("click", () => {
      document.getElementById("upgrade-overlay").classList.add("hidden");
    });
    document.getElementById("sell-close-btn")?.addEventListener("click", () => {
      document.getElementById("sell-overlay").classList.add("hidden");
    });
    document.getElementById("pickaxe-close-btn")?.addEventListener("click", () => {
      document.getElementById("pickaxe-overlay")?.classList.add("hidden");
    });
    document.getElementById("fusion-do-btn")?.addEventListener("click", confirmFusion);
    document.getElementById("fusion-close-btn")?.addEventListener("click", () => {
      document.getElementById("fusion-overlay")?.classList.add("hidden");
    });

    document.getElementById("settings-btn").addEventListener("click", () => {
      document.getElementById("worlds-overlay").classList.add("hidden");
      document.getElementById("settings-overlay").classList.remove("hidden");
    });
    document.getElementById("close-settings-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.add("hidden");
    });
    document.getElementById("worlds-btn").addEventListener("click", () => {
      document.getElementById("settings-overlay").classList.add("hidden");
      renderWorldsList();
      document.getElementById("worlds-overlay").classList.remove("hidden");
    });
    document.getElementById("close-worlds-btn").addEventListener("click", () => {
      document.getElementById("worlds-overlay").classList.add("hidden");
    });
    document.getElementById("leave-game-btn").addEventListener("click", () => {
      if (window.GameMP) GameMP.stop();
      window.location.href = "../../index.html";
    });

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", (e) => { keys[e.key] = true; });
    window.addEventListener("keyup", (e) => { keys[e.key] = false; });
    setupJoystick();
  }

  function removeRodShopButton() {
    document.getElementById("upgrade-btn")?.remove();
    document.querySelectorAll(".shop-stack > button, .upgrade-float, .zone-btn.zone-util, [data-zone='upgrades']").forEach((el) => {
      el.remove();
    });
  }

  function init() {
    removeRodShopButton();
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    if (canvas) canvas.dataset.grSkipAuto = "1";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    battleCanvas = document.getElementById("battle-canvas");
    battleCtx = battleCanvas ? battleCanvas.getContext("2d") : null;
    if (battleCtx) {
      battleCtx.imageSmoothingEnabled = true;
      battleCtx.imageSmoothingQuality = "high";
    }
    state = loadState();
    document.getElementById("name-input").value = state.name;
    document.querySelectorAll(".style-pick").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.style === state.style);
    });
    bindEvents();
    resize();
  }

  init();
})();
