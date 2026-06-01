(function () {
  "use strict";

  /** Blackwood Mansion — grand manor for Murder Mystery */
  const TILE = 40;
  const COLS = 42;
  const ROWS = 32;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;

  const ROOM_DEFS = [
    {
      id: "foyer",
      label: "Grand Foyer",
      c0: 16,
      r0: 23,
      c1: 25,
      r1: 29,
      floor: "#d7ccc8",
      accent: "#5d4037",
      props: "foyer",
      floorPattern: "marble",
      accentGlow: "rgba(93,64,55,0.14)",
    },
    {
      id: "stairhall",
      label: "Staircase Hall",
      c0: 17,
      r0: 19,
      c1: 24,
      r1: 22,
      floor: "#bcaaa4",
      accent: "#4e342e",
      props: "stair",
      floorPattern: "wood",
      accentGlow: "rgba(78,52,46,0.12)",
    },
    {
      id: "main_hall",
      label: "Main Hall",
      c0: 17,
      r0: 12,
      c1: 24,
      r1: 18,
      floor: "#8d6e63",
      accent: "#3e2723",
      props: "hall",
      floorPattern: "wood",
      accentGlow: "rgba(62,39,35,0.15)",
    },
    {
      id: "ballroom",
      label: "Ballroom",
      c0: 14,
      r0: 3,
      c1: 27,
      r1: 10,
      floor: "#ce93d8",
      accent: "#ffd54f",
      props: "ballroom",
      floorPattern: "marble",
      accentGlow: "rgba(255,213,79,0.14)",
    },
    {
      id: "library",
      label: "Library",
      c0: 3,
      r0: 3,
      c1: 12,
      r1: 10,
      floor: "#6d4c41",
      accent: "#3e2723",
      props: "library",
      floorPattern: "wood",
      accentGlow: "rgba(62,39,35,0.12)",
    },
    {
      id: "study",
      label: "Murder Study",
      c0: 29,
      r0: 3,
      c1: 38,
      r1: 10,
      floor: "#5d4037",
      accent: "#bf360c",
      props: "study",
      floorPattern: "wood",
      accentGlow: "rgba(191,54,12,0.12)",
    },
    {
      id: "lounge",
      label: "Smoking Lounge",
      c0: 3,
      r0: 12,
      c1: 11,
      r1: 18,
      floor: "#a1887f",
      accent: "#4e342e",
      props: "lounge",
      floorPattern: "carpet",
      accentGlow: "rgba(78,52,46,0.1)",
    },
    {
      id: "conservatory",
      label: "Conservatory",
      c0: 30,
      r0: 12,
      c1: 38,
      r1: 18,
      floor: "#a5d6a7",
      accent: "#2e7d32",
      props: "conservatory",
      floorPattern: "tile",
      accentGlow: "rgba(46,125,50,0.12)",
    },
    {
      id: "dining",
      label: "Dining Room",
      c0: 3,
      r0: 20,
      c1: 13,
      r1: 28,
      floor: "#ffcc80",
      accent: "#e65100",
      props: "dining",
      floorPattern: "wood",
      accentGlow: "rgba(230,81,0,0.1)",
    },
    {
      id: "kitchen",
      label: "Kitchen",
      c0: 14,
      r0: 20,
      c1: 25,
      r1: 22,
      floor: "#fff9c4",
      accent: "#f57f17",
      props: "kitchen",
      floorPattern: "tile",
      accentGlow: "rgba(245,127,23,0.1)",
    },
    {
      id: "gallery",
      label: "Portrait Gallery",
      c0: 28,
      r0: 20,
      c1: 38,
      r1: 28,
      floor: "#b39ddb",
      accent: "#512da8",
      props: "gallery",
      floorPattern: "wood",
      accentGlow: "rgba(81,45,168,0.12)",
    },
    {
      id: "servants",
      label: "Servants' Passage",
      c0: 14,
      r0: 11,
      c1: 16,
      r1: 18,
      floor: "#9e9e9e",
      accent: "#616161",
      props: "servants",
      floorPattern: "tile",
      accentGlow: "rgba(97,97,97,0.08)",
    },
  ];

  const DOORS = [
    { c0: 19, c1: 22, r0: 22, r1: 23 },
    { c0: 19, c1: 22, r0: 18, r1: 19 },
    { c0: 19, c1: 22, r0: 10, r1: 11 },
    { c0: 12, c1: 13, r0: 14, r1: 15 },
    { c0: 28, c1: 29, r0: 14, r1: 15 },
    { c0: 13, c1: 14, r0: 6, r1: 7 },
    { c0: 27, c1: 28, r0: 6, r1: 7 },
    { c0: 7, c1: 8, r0: 10, r1: 11 },
    { c0: 33, c1: 34, r0: 10, r1: 11 },
    { c0: 7, c1: 8, r0: 18, r1: 19 },
    { c0: 16, c1: 17, r0: 18, r1: 19 },
    { c0: 25, c1: 26, r0: 18, r1: 19 },
    { c0: 33, c1: 34, r0: 18, r1: 19 },
    { c0: 19, c1: 22, r0: 20, r1: 21 },
    { c0: 26, c1: 27, r0: 22, r1: 23 },
    { c0: 16, c1: 17, r0: 14, r1: 15 },
  ];

  const PUZZLE_SPOTS = {
    safe: { c: 20, r: 6, emoji: "🔐", label: "Ballroom Safe", room: "Ballroom" },
    ledger: { c: 7, r: 6, emoji: "📒", label: "Library Ledger", room: "Library" },
    dagger: { c: 33, r: 6, emoji: "🗡️", label: "Study Weapon", room: "Murder Study" },
    wine: { c: 7, r: 24, emoji: "🍷", label: "Poisoned Wine", room: "Dining Room" },
    portrait: { c: 33, r: 24, emoji: "🖼️", label: "Hidden Portrait", room: "Portrait Gallery" },
  };

  const ESCAPE_SPOT = { c: 20, r: 27, emoji: "🚪", label: "Front Gates", room: "Grand Foyer" };

  let tiles = [];
  let spawnPoints = [];

  function idx(c, r) {
    return r * COLS + c;
  }

  function inBounds(c, r) {
    return c >= 0 && c < COLS && r >= 0 && r < ROWS;
  }

  function buildTiles() {
    tiles = new Array(COLS * ROWS).fill(0);

    ROOM_DEFS.forEach((room) => {
      for (let r = room.r0; r <= room.r1; r++) {
        for (let c = room.c0; c <= room.c1; c++) {
          if (inBounds(c, r)) tiles[idx(c, r)] = 1;
        }
      }
    });

    DOORS.forEach((d) => {
      for (let r = d.r0; r <= d.r1; r++) {
        for (let c = d.c0; c <= d.c1; c++) {
          if (inBounds(c, r)) tiles[idx(c, r)] = 2;
        }
      }
    });

    spawnPoints = [
      tileCenter(20, 26),
      tileCenter(20, 15),
      tileCenter(20, 6),
      tileCenter(7, 6),
      tileCenter(33, 6),
      tileCenter(7, 15),
      tileCenter(33, 15),
      tileCenter(7, 24),
      tileCenter(33, 24),
    ];
  }

  function roomWalkableTiles(room) {
    const pts = [];
    for (let r = room.r0; r <= room.r1; r++) {
      for (let c = room.c0; c <= room.c1; c++) {
        if (tiles[idx(c, r)] >= 1) pts.push({ c, r });
      }
    }
    return pts;
  }

  function tileCenter(c, r) {
    return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
  }

  function tileAt(px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (!inBounds(c, r)) return 0;
    return tiles[idx(c, r)];
  }

  function isWalkable(px, py) {
    return tileAt(px, py) >= 1;
  }

  function collidesCircle(px, py, radius) {
    if (px < radius || py < radius || px > WORLD_W - radius || py > WORLD_H - radius) return true;
    const samples = [
      [px, py],
      [px - radius * 0.7, py],
      [px + radius * 0.7, py],
      [px, py - radius * 0.7],
      [px, py + radius * 0.7],
    ];
    return samples.some(([x, y]) => !isWalkable(x, y));
  }

  function getPuzzleStations() {
    return Object.entries(PUZZLE_SPOTS).map(([id, t]) => ({
      id,
      x: t.c * TILE + TILE / 2,
      y: t.r * TILE + TILE / 2,
      emoji: t.emoji,
      label: t.label,
      room: t.room,
    }));
  }

  function getEscapeGate() {
    const t = ESCAPE_SPOT;
    return {
      x: t.c * TILE + TILE / 2,
      y: t.r * TILE + TILE / 2,
      emoji: t.emoji,
      label: t.label,
      room: t.room,
    };
  }

  function getRoomAt(px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    return ROOM_DEFS.find((room) => c >= room.c0 && c <= room.c1 && r >= room.r0 && r <= room.r1) || null;
  }

  function isExteriorWall(c, r) {
    if (tileAt(c * TILE + TILE / 2, r * TILE + TILE / 2) >= 1) return false;
    const neighbors = [
      [c - 1, r],
      [c + 1, r],
      [c, r - 1],
      [c, r + 1],
      [c - 1, r - 1],
      [c + 1, r + 1],
      [c - 1, r + 1],
      [c + 1, r - 1],
    ];
    return neighbors.some(([nc, nr]) => inBounds(nc, nr) && tiles[idx(nc, nr)] >= 1);
  }

  buildTiles();

  window.MMMap = {
    TILE,
    COLS,
    ROWS,
    WORLD_W,
    WORLD_H,
    ROOM_DEFS,
    PUZZLE_SPOTS,
    ESCAPE_SPOT,
    tiles,
    spawnPoints,
    tileCenter,
    tileAt,
    isWalkable,
    collidesCircle,
    getPuzzleStations,
    getEscapeGate,
    getRoomAt,
    roomWalkableTiles,
    buildTiles,
    isExteriorWall,
  };
})();
