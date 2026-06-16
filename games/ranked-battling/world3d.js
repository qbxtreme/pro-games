(function () {
  "use strict";

  const RANKS = window.RankedRanks.RANKS;
  const WORLD_MAP = 200;
  const CORE = 54;
  const WORLD_GAP = 60;
  const WORLD_STEP = WORLD_MAP * 2 + WORLD_GAP;
  const GRID_COLS = 7;
  const GRID_ROWS = 6;
  const SPAWN_RANK = window.RankedRanks.MAX_INDEX;
  const MEGA_HALF_X = (GRID_COLS * WORLD_STEP) / 2;
  const MEGA_HALF_Z = (GRID_ROWS * WORLD_STEP) / 2;
  const MOVE = 7.5;
  const ROLL_TIME = 0.45;
  const ROLL_CD = 2.2;
  const BURST_CD = 4.5;
  const ROAR_CD = 6;
  const DRAGON_RADIUS = 1.35;
  const GIANT_SCALE = 2.65;
  const PLAINS_QUADRANT_INSET = 8;
  const CAM_HEIGHT = 24;
  const CAM_DIST = 22;

  let scene, camera, renderer, dragon, dragonGroup;
  let bushes = [];
  let colliders = [];
  let rivals = [];
  let biomeMeshes = [];
  let waterMeshes = [];
  let volcanoGlows = [];
  let animId = null;
  let running = false;
  let clock;
  let rollTimer = 0;
  let rollCd = 0;
  let burstCd = 0;
  let roarCd = 0;
  let tick = 0;
  let inBush = false;
  let encounterCooldown = 0;
  let callbacks = {};
  let keys = {};
  const joy = { dx: 0, dy: 0 };

  function resetInput() {
    joy.dx = 0;
    joy.dy = 0;
    Object.keys(keys).forEach((k) => { keys[k] = false; });
    const knob = document.getElementById("joystick-knob");
    if (knob) knob.style.transform = "translate(-50%, -50%)";
  }

  function relocateRival(rival) {
    if (!rival || rival.userData.fled) return;
    const ox = rival.userData.worldOx ?? 0;
    const oz = rival.userData.worldOz ?? 0;
    for (let i = 0; i < 16; i++) {
      let x;
      let z;
      if (rival.userData.giant && rival.userData.quadrantIndex != null) {
        ({ x, z } = randomPointInQuadrant(ox, oz, rival.userData.quadrantIndex));
      } else {
        x = ox + (Math.random() - 0.5) * (WORLD_MAP - 8);
        z = oz + (Math.random() - 0.5) * (WORLD_MAP - 8);
      }
      if (!dragon || dragon.position.distanceTo(new THREE.Vector3(x, 0, z)) > 12) {
        rival.position.set(x, 0, z);
        break;
      }
    }
    rival.userData.stunned = 1.5;
  }

  function fleeRival(rival) {
    if (!rival || rival.userData.fled) return;
    rival.userData.fled = true;
    rival.userData.vx = 0;
    rival.userData.vz = 0;
    rival.userData.stunned = 0;
    rival.userData.revealed = 0;
    rival.userData.fleeTimer = 1.2;
    if (dragon) {
      const dx = rival.position.x - dragon.position.x;
      const dz = rival.position.z - dragon.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      rival.userData.fleeVx = (dx / dist) * 50;
      rival.userData.fleeVz = (dz / dist) * 50;
    } else {
      rival.userData.fleeVx = (Math.random() - 0.5) * 50;
      rival.userData.fleeVz = (Math.random() - 0.5) * 50;
    }
    rival.traverse((c) => {
      if (c.isMesh && c.material) {
        c.material.transparent = true;
        c.material.opacity = 0.4;
      }
    });
    showWorldToast(`🏃 ${rival.userData.name} fled — no rematch!`);
  }

  let pendingBattleResult = null;

  function worldCenterForRank(rankIndex) {
    const col = rankIndex % GRID_COLS;
    const row = Math.floor(rankIndex / GRID_COLS);
    return {
      x: (col - (GRID_COLS - 1) / 2) * WORLD_STEP,
      z: (row - (GRID_ROWS - 1) / 2) * WORLD_STEP,
    };
  }

  function getWorldAt(x, z) {
    for (let i = 0; i < RANKS.length; i++) {
      const c = worldCenterForRank(i);
      if (Math.abs(x - c.x) <= WORLD_MAP && Math.abs(z - c.z) <= WORLD_MAP) {
        return {
          rankIndex: i,
          rank: RANKS[i],
          lx: x - c.x,
          lz: z - c.z,
          ox: c.x,
          oz: c.z,
        };
      }
    }
    return null;
  }

  function rankColor(rankIndex) {
    return window.RankedRanks.rankColorIndex(rankIndex);
  }

  function makeRankSignTexture(rank) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#ffffff";
    const fontSize = rank.length > 5 ? 28 : rank.length > 4 ? 34 : rank.length > 2 ? 48 : 80;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rank, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function addRankMonument(ox, oz, rankIndex) {
    const rank = RANKS[rankIndex];
    const color = rankColor(rankIndex);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, 14, 10),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.25,
        metalness: 0.5,
        roughness: 0.35,
      })
    );
    pillar.position.set(ox, 7, oz);
    pillar.castShadow = true;
    scene.add(pillar);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({
        map: makeRankSignTexture(rank),
        transparent: true,
        side: THREE.DoubleSide,
      })
    );
    sign.position.set(ox, 16, oz);
    scene.add(sign);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(7, 0.35, 8, 32),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(ox, 0.15, oz);
    scene.add(ring);
  }

  function buildMegaBase() {
    addGroundPatch(
      GRID_COLS * WORLD_STEP + 40,
      GRID_ROWS * WORLD_STEP + 40,
      0,
      0,
      0x455a64,
      0.005
    );
  }

  function buildCompleteRankWorld(ox, oz, rankIndex) {
    buildWorldTerrain(ox, oz);
    buildVolcanoLand(ox, oz);
    buildFrostLand(ox, oz);
    buildOcean(ox, oz);
    buildSkyIslands(ox, oz);
    scatterTrees(ox, oz);
    scatterBushes(ox, oz);
    spawnGiantRivalsForWorld(ox, oz, rankIndex);
  }

  function buildDivineDragon() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa22,
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.18,
    });
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e1,
      emissive: 0xffffff,
      emissiveIntensity: 0.25,
      metalness: 1,
      roughness: 0.1,
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), mat);
    body.scale.set(1.35, 0.85, 1.6);
    body.position.y = 1.1;
    body.castShadow = true;
    g.add(body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), mat);
    chest.position.set(0, 1.35, 0.75);
    chest.castShadow = true;
    g.add(chest);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 12), mat);
    head.position.set(0, 1.55, 1.35);
    head.castShadow = true;
    g.add(head);

    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 8), mat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 1.45, 1.85);
    g.add(snout);

    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 1.8), mat);
      wing.position.set(side * 1.15, 1.45, 0.1);
      wing.rotation.z = side * 0.55;
      wing.castShadow = true;
      g.add(wing);
      const wingTip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 1.1), mat);
      wingTip.position.set(side * 1.55, 1.75, 0.35);
      wingTip.rotation.z = side * 0.85;
      g.add(wingTip);
    });

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 8), mat);
    tail.rotation.x = -Math.PI / 2.3;
    tail.position.set(0, 1.0, -1.45);
    g.add(tail);

    [-0.22, 0.22].forEach((x) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 6), hornMat);
      horn.position.set(x, 2.05, 1.25);
      g.add(horn);
    });

    [-0.35, 0.35].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.55, 8), mat);
      leg.position.set(x, 0.28, 0.35);
      leg.castShadow = true;
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat);
      foot.position.set(x, 0.02, 0.42);
      g.add(foot);
    });

    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.08 })
    );
    aura.position.y = 1.2;
    g.add(aura);
    g.userData.aura = aura;

    return g;
  }

  function buildGiantRivalDragon() {
    const g = buildDivineDragon();
    g.scale.setScalar(GIANT_SCALE);
    g.userData.baseScale = GIANT_SCALE;
    return g;
  }

  function plainsQuadrantCenters(ox, oz) {
    const d = (CORE - PLAINS_QUADRANT_INSET) * 0.52;
    return [
      { x: ox + d, z: oz + d, quadrantIndex: 0 },
      { x: ox - d, z: oz + d, quadrantIndex: 1 },
      { x: ox + d, z: oz - d, quadrantIndex: 2 },
      { x: ox - d, z: oz - d, quadrantIndex: 3 },
    ];
  }

  function quadrantBounds(ox, oz, quadrantIndex) {
    const edge = CORE - 3;
    const path = PLAINS_QUADRANT_INSET;
    if (quadrantIndex === 0) {
      return { minX: ox + path, maxX: ox + edge, minZ: oz + path, maxZ: oz + edge };
    }
    if (quadrantIndex === 1) {
      return { minX: ox - edge, maxX: ox - path, minZ: oz + path, maxZ: oz + edge };
    }
    if (quadrantIndex === 2) {
      return { minX: ox + path, maxX: ox + edge, minZ: oz - edge, maxZ: oz - path };
    }
    return { minX: ox - edge, maxX: ox - path, minZ: oz - edge, maxZ: oz - path };
  }

  function randomPointInQuadrant(ox, oz, quadrantIndex) {
    const b = quadrantBounds(ox, oz, quadrantIndex);
    for (let i = 0; i < 16; i++) {
      const x = b.minX + Math.random() * (b.maxX - b.minX);
      const z = b.minZ + Math.random() * (b.maxZ - b.minZ);
      if (!blockedAt(x, z)) return { x, z };
    }
    return {
      x: (b.minX + b.maxX) / 2,
      z: (b.minZ + b.maxZ) / 2,
    };
  }

  function addCollider(x, z, radius) {
    colliders.push({ x, z, radius, type: "circle" });
  }

  function addBoxCollider(x, z, halfW, halfD) {
    colliders.push({ x, z, halfW, halfD, type: "box" });
  }

  function blockedAt(x, z) {
    for (const b of bushes) {
      const dx = x - b.position.x;
      const dz = z - b.position.z;
      if (Math.hypot(dx, dz) < b.userData.radius + DRAGON_RADIUS - 0.1) return true;
    }
    for (const c of colliders) {
      if (c.type === "circle") {
        const dx = x - c.x;
        const dz = z - c.z;
        if (Math.hypot(dx, dz) < c.radius + DRAGON_RADIUS) return true;
      } else {
        const dx = Math.abs(x - c.x);
        const dz = Math.abs(z - c.z);
        if (dx < c.halfW + DRAGON_RADIUS && dz < c.halfD + DRAGON_RADIUS) return true;
      }
    }
    return false;
  }

  function resolveCollisions(fromX, fromZ, toX, toZ) {
    if (!blockedAt(toX, toZ)) return { x: toX, z: toZ };
    if (!blockedAt(toX, fromZ)) return { x: toX, z: fromZ };
    if (!blockedAt(fromX, toZ)) return { x: fromX, z: toZ };
    return { x: fromX, z: fromZ };
  }

  function clampMap(x, z) {
    return {
      x: Math.max(-MEGA_HALF_X + 2, Math.min(MEGA_HALF_X - 2, x)),
      z: Math.max(-MEGA_HALF_Z + 2, Math.min(MEGA_HALF_Z - 2, z)),
    };
  }

  function addGroundPatch(w, d, x, z, color, y) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d, 1, 1),
      new THREE.MeshStandardMaterial({ color, roughness: 0.92 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y || 0.01, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function buildWorldTerrain(ox, oz) {
    const full = WORLD_MAP * 2;
    addGroundPatch(full, full, ox, oz, 0x5a8f48);

    const band = WORLD_MAP - CORE;
    addGroundPatch(full, band, ox, oz + CORE + band * 0.5, 0x4e342e, 0.02);
    addGroundPatch(full, band, ox, oz - CORE - band * 0.5, 0xe8f4fc, 0.02);
    addGroundPatch(band, full, ox + CORE + band * 0.5, oz, 0x0288d1, 0.015);
    addGroundPatch(band, full, ox - CORE - band * 0.5, oz, 0xc5cae9, 0.025);

    addGroundPatch(full, 10, ox, oz + CORE + 2, 0xc4a574, 0.03);
    addGroundPatch(10, full, ox + CORE + 2, oz, 0xc4a574, 0.03);
    addGroundPatch(full, 10, ox, oz - CORE - 2, 0xdcedc8, 0.03);
    addGroundPatch(10, full, ox - CORE - 2, oz, 0xdcedc8, 0.03);

    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(10, CORE * 1.6),
      new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 1 })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(ox, 0.04, oz);
    scene.add(path);
    const path2 = path.clone();
    path2.rotation.z = Math.PI / 2;
    path2.position.set(ox, 0.04, oz);
    scene.add(path2);
  }

  function buildVolcanoLand(ox, oz) {
    const group = new THREE.Group();
    const baseZ = CORE + (WORLD_MAP - CORE) * 0.55;

    const volcano = new THREE.Mesh(
      new THREE.ConeGeometry(18, 28, 16),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 })
    );
    volcano.position.set(0, 14, baseZ);
    volcano.castShadow = true;
    group.add(volcano);

    const crater = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 6, 2, 12),
      new THREE.MeshStandardMaterial({
        color: 0xff5722,
        emissive: 0xff3d00,
        emissiveIntensity: 0.85,
      })
    );
    crater.position.set(0, 27, baseZ);
    group.add(crater);

    [[-22, baseZ - 18], [24, baseZ + 12], [-14, baseZ + 22], [18, baseZ - 8]].forEach(([x, z]) => {
      const lava = new THREE.Mesh(
        new THREE.CircleGeometry(3 + Math.random() * 2, 12),
        new THREE.MeshStandardMaterial({
          color: 0xff6f00,
          emissive: 0xff3d00,
          emissiveIntensity: 0.7,
        })
      );
      lava.rotation.x = -Math.PI / 2;
      lava.position.set(x, 0.06, z);
      group.add(lava);
    });

    for (let i = 0; i < 14; i++) {
      const rockSize = 1.2 + Math.random() * 2.2;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rockSize, 0),
        new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 1 })
      );
      rock.position.set(
        (Math.random() - 0.5) * (WORLD_MAP - CORE) * 1.6,
        0.6 + Math.random() * 1.5,
        CORE + 8 + Math.random() * (WORLD_MAP - CORE - 10)
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      group.add(rock);
      addCollider(ox + rock.position.x, oz + rock.position.z, rockSize * 0.85);
    }

    group.position.set(ox, 0, oz);
    scene.add(group);
    biomeMeshes.push(group);
    addCollider(ox, oz + baseZ, 17);
    volcanoGlows.push(crater);
  }

  function buildFrostLand(ox, oz) {
    const group = new THREE.Group();
    const baseZ = -CORE - (WORLD_MAP - CORE) * 0.5;

    for (let i = 0; i < 16; i++) {
      const mound = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random() * 2.5, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })
      );
      mound.scale.y = 0.45;
      mound.position.set(
        (Math.random() - 0.5) * (WORLD_MAP - CORE) * 1.7,
        0.4,
        -CORE - 6 - Math.random() * (WORLD_MAP - CORE - 8)
      );
      mound.castShadow = true;
      group.add(mound);
    }

    for (let i = 0; i < 10; i++) {
      const ice = new THREE.Mesh(
        new THREE.ConeGeometry(0.8 + Math.random(), 3 + Math.random() * 4, 6),
        new THREE.MeshStandardMaterial({
          color: 0x81d4fa,
          transparent: true,
          opacity: 0.82,
          roughness: 0.15,
          metalness: 0.35,
        })
      );
      ice.position.set(
        (Math.random() - 0.5) * (WORLD_MAP - CORE) * 1.4,
        1.5,
        -CORE - 10 - Math.random() * (WORLD_MAP - CORE - 12)
      );
      group.add(ice);
    }

    const glacier = new THREE.Mesh(
      new THREE.BoxGeometry(36, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0xb3e5fc, roughness: 0.4, metalness: 0.2 })
    );
    glacier.position.set(0, 4, baseZ);
    glacier.castShadow = true;
    group.add(glacier);

    group.position.set(ox, 0, oz);
    scene.add(group);
    biomeMeshes.push(group);
  }

  function buildOcean(ox, oz) {
    const group = new THREE.Group();
    const centerX = CORE + (WORLD_MAP - CORE) * 0.5;

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_MAP - CORE + 4, WORLD_MAP * 2, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0277bd,
        transparent: true,
        opacity: 0.82,
        roughness: 0.15,
        metalness: 0.45,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(centerX, 0.08, 0);
    group.add(water);
    waterMeshes.push(water);

    addGroundPatch(WORLD_MAP - CORE, 14, ox + centerX - 6, oz, 0xf5deb3, 0.05);

    for (let i = 0; i < 5; i++) {
      const island = new THREE.Mesh(
        new THREE.CylinderGeometry(4 + Math.random() * 3, 5 + Math.random() * 2, 1.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 })
      );
      island.position.set(
        CORE + 18 + Math.random() * (WORLD_MAP - CORE - 22),
        0.5,
        (Math.random() - 0.5) * (WORLD_MAP - 20)
      );
      island.receiveShadow = true;
      group.add(island);
      const palm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x6d4c41 })
      );
      palm.position.copy(island.position);
      palm.position.y += 1.8;
      group.add(palm);
      addCollider(ox + island.position.x, oz + island.position.z, island.geometry.parameters.radiusTop + 1);
      addCollider(ox + palm.position.x, oz + palm.position.z, 0.9);
    }

    group.position.set(ox, 0, oz);
    scene.add(group);
    biomeMeshes.push(group);
  }

  function buildSkyIslands(ox, oz) {
    const group = new THREE.Group();
    const centerX = -CORE - (WORLD_MAP - CORE) * 0.5;

    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(4 + Math.random() * 5, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.28,
          roughness: 1,
          depthWrite: false,
        })
      );
      cloud.renderOrder = -5;
      cloud.raycast = () => {};
      cloud.scale.set(1.6, 0.55, 1.1);
      cloud.position.set(
        -CORE - 10 - Math.random() * (WORLD_MAP - CORE - 12),
        34 + Math.random() * 18,
        (Math.random() - 0.5) * WORLD_MAP * 1.4
      );
      group.add(cloud);
    }

    const islands = [
      [centerX, 0, 0, 22, 16],
      [centerX - 18, 5, -28, 14, 12],
      [centerX + 8, 8, 32, 16, 11],
      [centerX - 8, 12, 18, 12, 10],
    ];
    islands.forEach(([x, y, z, w, d]) => {
      const island = new THREE.Mesh(
        new THREE.BoxGeometry(w, 3, d),
        new THREE.MeshStandardMaterial({ color: 0x9fa8da, roughness: 0.75 })
      );
      island.position.set(x, y + 1.2, z);
      island.castShadow = true;
      island.receiveShadow = true;
      group.add(island);

      const top = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 1, d - 1),
        new THREE.MeshStandardMaterial({ color: 0xe1bee7, roughness: 0.9 })
      );
      top.rotation.x = -Math.PI / 2;
      top.position.set(x, y + 2.75, z);
      group.add(top);

      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.2, 0),
        new THREE.MeshStandardMaterial({
          color: 0xce93d8,
          emissive: 0xab47bc,
          emissiveIntensity: 0.35,
          metalness: 0.6,
          roughness: 0.2,
        })
      );
      crystal.position.set(x, y + 4.2, z);
      group.add(crystal);
    });

    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(CORE + 8, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xb39ddb, roughness: 0.8 })
    );
    bridge.position.set(-CORE * 0.55, 1.8, 0);
    bridge.castShadow = true;
    group.add(bridge);

    group.position.set(ox, 0, oz);
    scene.add(group);
    biomeMeshes.push(group);
  }

  function addTree(x, z, scale) {
    const g = new THREE.Group();
    const s = scale || 1;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 2.2 * s, 8),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95 })
    );
    trunk.position.y = 1.1 * s;
    trunk.castShadow = true;
    g.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.4 * s, 3.2 * s, 8),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 })
    );
    leaves.position.y = 3.1 * s;
    leaves.castShadow = true;
    g.add(leaves);

    const leaves2 = new THREE.Mesh(
      new THREE.ConeGeometry(1.1 * s, 2.6 * s, 8),
      new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.9 })
    );
    leaves2.position.y = 4.4 * s;
    leaves2.castShadow = true;
    g.add(leaves2);

    g.position.set(x, 0, z);
    scene.add(g);
    addCollider(x, z, 1.5 * s);
    return g;
  }

  function scatterTrees(ox, oz) {
    const quadCenters = plainsQuadrantCenters(ox, oz);
    const nearGiant = (x, z) => quadCenters.some((q) => Math.hypot(x - q.x, z - q.z) < 20);
    for (let i = 0; i < 28; i++) {
      const x = ox + (Math.random() - 0.5) * CORE * 1.7;
      const z = oz + (Math.random() - 0.5) * CORE * 1.7;
      if (Math.hypot(x - ox, z - oz) < 8 || nearGiant(x, z)) continue;
      addTree(x, z, 0.85 + Math.random() * 0.55);
    }
    for (let i = 0; i < 10; i++) {
      addTree(
        ox + (Math.random() - 0.5) * (WORLD_MAP - CORE) * 1.2,
        oz + CORE + 14 + Math.random() * (WORLD_MAP - CORE - 20),
        0.75 + Math.random() * 0.35
      );
    }
    for (let i = 0; i < 10; i++) {
      addTree(
        ox + (Math.random() - 0.5) * (WORLD_MAP - CORE) * 1.2,
        oz - CORE - 14 - Math.random() * (WORLD_MAP - CORE - 20),
        0.75 + Math.random() * 0.35
      );
    }
  }

  function scatterBushes(ox, oz) {
    const quadCenters = plainsQuadrantCenters(ox, oz);
    const nearGiant = (x, z) => quadCenters.some((q) => Math.hypot(x - q.x, z - q.z) < 18);
    for (let i = 0; i < 40; i++) {
      const x = ox + (Math.random() - 0.5) * CORE * 1.8;
      const z = oz + (Math.random() - 0.5) * CORE * 1.8;
      if (nearGiant(x, z)) continue;
      addBush(x, z, 1.8 + Math.random() * 2.2);
    }
    for (let i = 0; i < 8; i++) {
      addBush(
        ox + (Math.random() - 0.5) * (WORLD_MAP - CORE) * 1.2,
        oz + CORE + 10 + Math.random() * (WORLD_MAP - CORE - 14),
        1.4 + Math.random() * 1.2
      );
    }
    for (let i = 0; i < 8; i++) {
      addBush(
        ox + (Math.random() - 0.5) * (WORLD_MAP - CORE) * 1.2,
        oz - CORE - 10 - Math.random() * (WORLD_MAP - CORE - 14),
        1.2 + Math.random() * 1
      );
    }
  }

  function getBiome(x, z) {
    const w = getWorldAt(x, z);
    if (!w) return "travel";
    const { lx, lz } = w;
    if (lz > CORE) return "volcano";
    if (lz < -CORE) return "frost";
    if (lx > CORE) return "ocean";
    if (lx < -CORE) return "sky";
    return "plains";
  }

  function updateBiomeFeel() {
    if (!dragon || !scene) return;
    const biome = getBiome(dragon.position.x, dragon.position.z);
    const world = getWorldAt(dragon.position.x, dragon.position.z);
    const labels = {
      volcano: "🌋 Volcano Land",
      frost: "❄️ Frost Land",
      ocean: "🌊 Ocean",
      sky: "☁️ Sky Island",
      plains: "🌿 Dragon Plains",
      travel: "🗺️ Between Worlds",
    };
    const worldTag = world ? ` · ${world.rank} Rank World` : "";
    const hint = document.getElementById("biome-hint");
    if (hint) hint.textContent = (labels[biome] || labels.plains) + worldTag;

    const worldLabel = document.getElementById("world-rank-label");
    if (worldLabel) {
      worldLabel.textContent = world ? `${world.rank} World` : "Between Worlds";
      worldLabel.className = "world-rank-label" + (world ? ` rank-${world.rank}` : "");
    }

    const playerRankEl = document.getElementById("player-rank-label");
    if (playerRankEl && callbacks.playerRankIndex != null) {
      const pr = RANKS[callbacks.playerRankIndex] || RANKS[0];
      playerRankEl.textContent = `Your rank: ${pr}`;
      playerRankEl.className = "player-rank-label rank-" + pr;
    }

    if (biome === "volcano") {
      scene.background.set(0x4e342e);
      scene.fog.color.set(0x4e342e);
    } else if (biome === "frost") {
      scene.background.set(0xb3e5fc);
      scene.fog.color.set(0xb3e5fc);
    } else if (biome === "ocean") {
      scene.background.set(0x4fc3f7);
      scene.fog.color.set(0x4fc3f7);
    } else if (biome === "sky") {
      scene.background.set(0xede7f6);
      scene.fog.color.set(0xede7f6);
    } else {
      scene.background.set(0x87ceeb);
      scene.fog.color.set(0x87ceeb);
    }

    waterMeshes.forEach((wm) => {
      wm.position.y = 0.08 + Math.sin(tick * 1.6) * 0.06;
    });
    volcanoGlows.forEach((g) => {
      g.material.emissiveIntensity = 0.65 + Math.sin(tick * 3) * 0.25;
    });
  }

  function addBush(x, z, size) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.95 });
    for (let i = 0; i < 5 + Math.floor(Math.random() * 4); i++) {
      const s = size * (0.35 + Math.random() * 0.45);
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), i % 2 ? mat : dark);
      m.position.set((Math.random() - 0.5) * size, s * 0.55, (Math.random() - 0.5) * size);
      m.castShadow = true;
      g.add(m);
    }
    g.position.set(x, 0, z);
    g.userData.radius = size * 0.85;
    scene.add(g);
    bushes.push(g);
  }

  function createGiantRival(x, z, rankIndex, ox, oz, quadrantIndex) {
    const rank = RANKS[rankIndex];
    const elements = ["fire", "water", "earth", "air"];
    const mesh = buildGiantRivalDragon();
    mesh.position.set(x, 0, z);
    mesh.userData.vx = (Math.random() - 0.5) * 0.9;
    mesh.userData.vz = (Math.random() - 0.5) * 0.9;
    const names = window.RankedRanks.giantNames(rank);
    mesh.userData.name = names[quadrantIndex] || `${rank}-Giant`;
    mesh.userData.rankIndex = rankIndex;
    mesh.userData.worldOx = ox;
    mesh.userData.worldOz = oz;
    mesh.userData.quadrantIndex = quadrantIndex;
    mesh.userData.giant = true;
    mesh.userData.element = elements[quadrantIndex % elements.length];
    mesh.userData.stunned = 0;
    mesh.userData.revealed = 0;
    scene.add(mesh);
    rivals.push(mesh);
    return mesh;
  }

  function spawnGiantRivalsForWorld(ox, oz, rankIndex) {
    plainsQuadrantCenters(ox, oz).forEach(({ x, z, quadrantIndex }) => {
      createGiantRival(x, z, rankIndex, ox, oz, quadrantIndex);
    });
  }

  function rivalBounds(rival) {
    const ox = rival.userData.worldOx ?? 0;
    const oz = rival.userData.worldOz ?? 0;
    if (rival.userData.giant && rival.userData.quadrantIndex != null) {
      return quadrantBounds(ox, oz, rival.userData.quadrantIndex);
    }
    return {
      minX: ox - WORLD_MAP + 3,
      maxX: ox + WORLD_MAP - 3,
      minZ: oz - WORLD_MAP + 3,
      maxZ: oz + WORLD_MAP - 3,
    };
  }

  function goToRankWorld(rankIndex) {
    if (!dragon) return;
    const c = worldCenterForRank(rankIndex);
    dragon.position.set(c.x, 0, c.z);
  }

  function initScene(container) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 260, 1700);

    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 4000);
    camera.position.set(0, CAM_HEIGHT, CAM_DIST);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xfff8e1, 0x3d5c34, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(40, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 2800;
    sun.shadow.camera.left = -MEGA_HALF_X;
    sun.shadow.camera.right = MEGA_HALF_X;
    sun.shadow.camera.top = MEGA_HALF_Z;
    sun.shadow.camera.bottom = -MEGA_HALF_Z;
    scene.add(sun);

    buildMegaBase();
    for (let i = 0; i < RANKS.length; i++) {
      const c = worldCenterForRank(i);
      buildCompleteRankWorld(c.x, c.z, i);
    }

    const spawn = worldCenterForRank(0);
    dragonGroup = buildDivineDragon();
    dragonGroup.position.set(spawn.x, 0, spawn.z);
    scene.add(dragonGroup);
    dragon = dragonGroup;

    clock = new THREE.Clock();
  }

  function resize() {
    const wrap = document.getElementById("game-wrap");
    if (!wrap || !renderer || !camera) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function checkBush() {
    inBush = false;
    for (const b of bushes) {
      const dx = dragon.position.x - b.position.x;
      const dz = dragon.position.z - b.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < b.userData.radius + DRAGON_RADIUS + 0.15) {
        inBush = true;
        break;
      }
    }
    dragonGroup.userData.aura.material.opacity = inBush ? 0.04 : 0.08 + Math.sin(tick * 2) * 0.03;
    dragonGroup.traverse((c) => {
      if (c.isMesh && c.material && c !== dragonGroup.userData.aura) {
        c.material.transparent = inBush;
        c.material.opacity = inBush ? 0.45 : 1;
      }
    });
    const hint = document.getElementById("bush-hint");
    if (hint) hint.classList.toggle("hidden", !inBush);
  }

  function doRoll() {
    if (rollCd > 0 || rollTimer > 0) return;
    rollTimer = ROLL_TIME;
    rollCd = ROLL_CD;
  }

  function doBurst() {
    if (burstCd > 0 || callbacks._busy || !dragon) return;
    burstCd = BURST_CD;
    const world = getWorldAt(dragon.position.x, dragon.position.z);
    const rankIndex = world?.rankIndex ?? SPAWN_RANK;
    const ox = world?.ox ?? dragon.position.x;
    const oz = world?.oz ?? dragon.position.z;
    const quadrantIndex = world
      ? (world.lx >= 0 ? (world.lz >= 0 ? 0 : 2) : (world.lz >= 0 ? 1 : 3))
      : 0;
    const rival = createGiantRival(
      dragon.position.x,
      dragon.position.z,
      rankIndex,
      ox,
      oz,
      quadrantIndex
    );
    rival.position.set(dragon.position.x, 0, dragon.position.z);
    rival.userData.vx = 0;
    rival.userData.vz = 0;
    callbacks._busy = true;
    callbacks.onEncounter({
      name: rival.userData.name,
      rankIndex: rival.userData.rankIndex,
      element: rival.userData.element,
      rivalRef: rival,
    });
  }

  function doRoar() {
    if (roarCd > 0 || !dragon) return;
    roarCd = ROAR_CD;
    encounterCooldown = 0;
    rivals.forEach((r, i) => {
      if (r.userData.fled) return;
      const angle = (i / Math.max(1, rivals.length)) * Math.PI * 2;
      r.position.set(
        dragon.position.x + Math.sin(angle) * 1.8,
        0,
        dragon.position.z + Math.cos(angle) * 1.8
      );
      r.userData.vx = 0;
      r.userData.vz = 0;
      r.userData.stunned = 0;
      r.userData.revealed = 0;
      r.scale.setScalar(r.userData.baseScale || 1);
      r.rotation.y = Math.atan2(dragon.position.x - r.position.x, dragon.position.z - r.position.z);
    });
    showWorldToast("👑 Golden Roar — rivals rush to you!");
  }

  function showWorldToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(showWorldToast._t);
    showWorldToast._t = setTimeout(() => el.classList.add("hidden"), 1800);
  }

  function update(dt) {
    if (!running || !dragon) return;
    tick += dt;
    if (rollCd > 0) rollCd -= dt;
    if (burstCd > 0) burstCd -= dt;
    if (roarCd > 0) roarCd -= dt;
    if (rollTimer > 0) rollTimer -= dt;
    if (encounterCooldown > 0) encounterCooldown -= dt;

    let mx = joy.dx;
    let mz = joy.dy;
    if (keys.KeyW || keys.ArrowUp) mz -= 1;
    if (keys.KeyS || keys.ArrowDown) mz += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len;
      mz /= len;
      dragon.rotation.y = Math.atan2(mx, mz);
    }

    const speed = MOVE;
    const prevX = dragon.position.x;
    const prevZ = dragon.position.z;
    let nextX = prevX + mx * speed * dt;
    let nextZ = prevZ + mz * speed * dt;
    const clamped = clampMap(nextX, nextZ);
    nextX = clamped.x;
    nextZ = clamped.z;
    const resolved = resolveCollisions(prevX, prevZ, nextX, nextZ);
    dragon.position.x = resolved.x;
    dragon.position.z = resolved.z;

    const biome = getBiome(dragon.position.x, dragon.position.z);
    const skyLift = biome === "sky" ? 2.8 : biome === "ocean" ? 0.35 : 0;

    if (rollTimer > 0) {
      dragonGroup.rotation.x = Math.sin(tick * 18) * 0.55;
      dragonGroup.rotation.z = Math.cos(tick * 14) * 0.35;
      dragonGroup.position.y = skyLift + Math.sin(tick * 18) * 0.15;
    } else {
      dragonGroup.rotation.x *= 0.85;
      dragonGroup.rotation.z *= 0.85;
      dragonGroup.position.y = skyLift + Math.sin(tick * 4) * 0.06;
    }

    const wingFlap = Math.sin(tick * (rollTimer > 0 ? 14 : 6)) * 0.12;
    dragonGroup.children.forEach((c, i) => {
      if (i >= 4 && i <= 7) c.rotation.y = wingFlap * (i % 2 ? 1 : -1);
    });

    rivals.forEach((r) => {
      const bounds = rivalBounds(r);
      if (r.userData.fled) {
        if (r.userData.fleeTimer > 0) {
          r.userData.fleeTimer -= dt;
          r.position.x += (r.userData.fleeVx || 0) * dt;
          r.position.z += (r.userData.fleeVz || 0) * dt;
          r.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, r.position.x));
          r.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, r.position.z));
          r.rotation.y = Math.atan2(r.userData.fleeVx, r.userData.fleeVz);
        }
        return;
      }
      if (r.userData.stunned > 0) {
        r.userData.stunned -= dt;
        return;
      }
      r.position.x += r.userData.vx * dt;
      r.position.z += r.userData.vz * dt;
      if (r.position.x < bounds.minX || r.position.x > bounds.maxX) r.userData.vx *= -1;
      if (r.position.z < bounds.minZ || r.position.z > bounds.maxZ) r.userData.vz *= -1;
      r.rotation.y = Math.atan2(r.userData.vx, r.userData.vz);
      if (r.userData.revealed > 0) {
        r.userData.revealed -= dt;
        const base = r.userData.baseScale || 1;
        r.scale.setScalar(base * (1 + Math.sin(tick * 10) * 0.08));
      } else {
        r.scale.setScalar(r.userData.baseScale || 1);
      }
      const encounterDist = r.userData.giant ? 5.5 : 2.2;
      if (
        encounterCooldown <= 0 &&
        !r.userData.fled &&
        dragon.position.distanceTo(r.position) < encounterDist &&
        callbacks.onEncounter &&
        !callbacks._busy
      ) {
        callbacks._busy = true;
        callbacks.onEncounter({
          name: r.userData.name,
          rankIndex: r.userData.rankIndex,
          element: r.userData.element || "fire",
          rivalRef: r,
        });
      }
    });

    checkBush();
    updateBiomeFeel();

    const camTarget = dragon.position.clone();
    camTarget.y += 2;
    const desiredCam = new THREE.Vector3(
      camTarget.x,
      camTarget.y + CAM_HEIGHT,
      camTarget.z + CAM_DIST
    );
    camera.position.lerp(desiredCam, 0.12);
    camera.lookAt(camTarget);

    updateAbilityHud();
    renderer.render(scene, camera);
  }

  function updateAbilityHud() {
    const rollBtn = document.getElementById("roll-btn");
    const burstBtn = document.getElementById("burst-btn");
    const roarBtn = document.getElementById("roar-btn");
    if (rollBtn) rollBtn.disabled = rollCd > 0 || rollTimer > 0;
    if (burstBtn) burstBtn.disabled = burstCd > 0;
    if (roarBtn) roarBtn.disabled = roarCd > 0;
    if (rollBtn) rollBtn.textContent = rollCd > 0 ? `🌀 ${rollCd.toFixed(1)}s` : "🌀 Roll";
    if (burstBtn) burstBtn.textContent = burstCd > 0 ? `✨ ${burstCd.toFixed(1)}s` : "✨ Burst";
    if (roarBtn) roarBtn.textContent = roarCd > 0 ? `👑 ${roarCd.toFixed(1)}s` : "👑 Roar";
  }

  function loop() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt);
    animId = requestAnimationFrame(loop);
  }

  function bindControls() {
    if (bindControls._done) return;
    bindControls._done = true;
    window.addEventListener("keydown", (e) => { keys[e.code] = true; });
    window.addEventListener("keyup", (e) => { keys[e.code] = false; });
    if (window.AllOutControls) AllOutControls.bindJoystick(joy, keys);

    document.getElementById("roll-btn")?.addEventListener("click", doRoll);
    document.getElementById("burst-btn")?.addEventListener("click", doBurst);
    document.getElementById("roar-btn")?.addEventListener("click", doRoar);
    document.getElementById("roll-btn")?.addEventListener("pointerdown", (e) => e.preventDefault());
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && running) { e.preventDefault(); doRoll(); }
      if (e.code === "KeyQ" && running) doBurst();
      if (e.code === "KeyE" && running) doRoar();
    });
  }

  window.RankedWorld = {
    start(cb) {
      callbacks = cb || {};
      const container = document.getElementById("world3d");
      if (!scene && container) initScene(container);
      if (callbacks.playerRankIndex != null) {
        goToRankWorld(callbacks.playerRankIndex);
      }
      running = true;
      if (clock) clock.getDelta();
      resize();
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      loop();
    },
    stop() {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      resetInput();
    },
    resumeAfterBattle(rival) {
      encounterCooldown = 2.5;
      callbacks._busy = false;
      resetInput();
      const result = pendingBattleResult;
      pendingBattleResult = null;
      const r = rival || result?.rival;
      if (result && !result.won && !result.forfeited) {
        fleeRival(r);
      } else if (r) {
        relocateRival(r);
        if (dragon && result?.won) {
          const away = dragon.position.clone().sub(r.position).normalize().multiplyScalar(3);
          if (away.lengthSq() > 0.01) dragon.position.add(away);
        }
      }
      running = true;
      if (clock) clock.getDelta();
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      loop();
    },
    onBattleEnd(result) {
      pendingBattleResult = result || null;
    },
    goToPlayerRank(rankIndex) {
      callbacks.playerRankIndex = window.RankedRanks.clampRankIndex(rankIndex);
      goToRankWorld(callbacks.playerRankIndex);
    },
    syncPlayerRank(rankIndex) {
      callbacks.playerRankIndex = window.RankedRanks.clampRankIndex(rankIndex);
    },
    resize,
    bindControls,
    show: () => {
      document.getElementById("world3d")?.classList.remove("hidden");
      document.getElementById("world-hud")?.classList.remove("hidden");
      document.getElementById("game-canvas")?.classList.add("hidden");
    },
    hide: () => {
      document.getElementById("world3d")?.classList.add("hidden");
      document.getElementById("world-hud")?.classList.add("hidden");
      document.getElementById("game-canvas")?.classList.remove("hidden");
    },
  };
})();
