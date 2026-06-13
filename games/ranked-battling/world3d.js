(function () {
  "use strict";

  const MAP = 140;
  const CORE = 38;
  const MOVE = 7.5;
  const ROLL_TIME = 0.45;
  const ROLL_CD = 2.2;
  const BURST_CD = 4.5;
  const ROAR_CD = 6;
  const DRAGON_RADIUS = 1.35;
  const CAM_HEIGHT = 24;
  const CAM_DIST = 22;

  let scene, camera, renderer, dragon, dragonGroup;
  let bushes = [];
  let colliders = [];
  let rivals = [];
  let biomeMeshes = [];
  let waterMesh = null;
  let volcanoGlow = null;
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
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * (MAP - 8);
      const z = (Math.random() - 0.5) * (MAP - 8);
      if (!dragon || dragon.position.distanceTo(new THREE.Vector3(x, 0, z)) > 10) {
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

  const goldMat = () =>
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa22,
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.18,
    });

  function buildDivineDragon() {
    const g = new THREE.Group();
    const mat = goldMat();
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

  function buildRivalDragon(color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.4,
      roughness: 0.55,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10), mat);
    body.scale.set(1.2, 0.75, 1.4);
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), mat);
    head.position.set(0, 1.05, 0.85);
    g.add(head);
    return g;
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
      x: Math.max(-MAP + 2, Math.min(MAP - 2, x)),
      z: Math.max(-MAP + 2, Math.min(MAP - 2, z)),
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

  function buildWorldTerrain() {
    const full = MAP * 2;
    addGroundPatch(full, full, 0, 0, 0x5a8f48);

    const band = MAP - CORE;
    addGroundPatch(full, band, 0, CORE + band * 0.5, 0x4e342e, 0.02);
    addGroundPatch(full, band, 0, -CORE - band * 0.5, 0xe8f4fc, 0.02);
    addGroundPatch(band, full, CORE + band * 0.5, 0, 0x0288d1, 0.015);
    addGroundPatch(band, full, -CORE - band * 0.5, 0, 0xc5cae9, 0.025);

    addGroundPatch(full, 10, 0, CORE + 2, 0xc4a574, 0.03);
    addGroundPatch(10, full, CORE + 2, 0, 0xc4a574, 0.03);
    addGroundPatch(full, 10, 0, -CORE - 2, 0xdcedc8, 0.03);
    addGroundPatch(10, full, -CORE - 2, 0, 0xdcedc8, 0.03);

    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(10, CORE * 1.6),
      new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 1 })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.04;
    scene.add(path);
    const path2 = path.clone();
    path2.rotation.z = Math.PI / 2;
    scene.add(path2);
  }

  function buildVolcanoLand() {
    const group = new THREE.Group();
    const baseZ = CORE + (MAP - CORE) * 0.55;

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
    volcanoGlow = crater;

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
        (Math.random() - 0.5) * (MAP - CORE) * 1.6,
        0.6 + Math.random() * 1.5,
        CORE + 8 + Math.random() * (MAP - CORE - 10)
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      group.add(rock);
      addCollider(rock.position.x, rock.position.z, rockSize * 0.85);
    }

    scene.add(group);
    biomeMeshes.push(group);
    addCollider(0, baseZ, 17);
  }

  function buildFrostLand() {
    const group = new THREE.Group();
    const baseZ = -CORE - (MAP - CORE) * 0.5;

    for (let i = 0; i < 16; i++) {
      const mound = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random() * 2.5, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })
      );
      mound.scale.y = 0.45;
      mound.position.set(
        (Math.random() - 0.5) * (MAP - CORE) * 1.7,
        0.4,
        -CORE - 6 - Math.random() * (MAP - CORE - 8)
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
        (Math.random() - 0.5) * (MAP - CORE) * 1.4,
        1.5,
        -CORE - 10 - Math.random() * (MAP - CORE - 12)
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

    scene.add(group);
    biomeMeshes.push(group);
  }

  function buildOcean() {
    const group = new THREE.Group();
    const centerX = CORE + (MAP - CORE) * 0.5;

    waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP - CORE + 4, MAP * 2, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0277bd,
        transparent: true,
        opacity: 0.82,
        roughness: 0.15,
        metalness: 0.45,
      })
    );
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(centerX, 0.08, 0);
    group.add(waterMesh);

    addGroundPatch(MAP - CORE, 14, centerX - 6, 0, 0xf5deb3, 0.05);

    for (let i = 0; i < 5; i++) {
      const island = new THREE.Mesh(
        new THREE.CylinderGeometry(4 + Math.random() * 3, 5 + Math.random() * 2, 1.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 })
      );
      island.position.set(
        CORE + 18 + Math.random() * (MAP - CORE - 22),
        0.5,
        (Math.random() - 0.5) * (MAP - 20)
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
      addCollider(island.position.x, island.position.z, island.geometry.parameters.radiusTop + 1);
      addCollider(palm.position.x, palm.position.z, 0.9);
    }

    scene.add(group);
    biomeMeshes.push(group);
  }

  function buildSkyIslands() {
    const group = new THREE.Group();
    const centerX = -CORE - (MAP - CORE) * 0.5;

    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(4 + Math.random() * 5, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.55,
          roughness: 1,
        })
      );
      cloud.scale.set(1.6, 0.55, 1.1);
      cloud.position.set(
        -CORE - 10 - Math.random() * (MAP - CORE - 12),
        6 + Math.random() * 10,
        (Math.random() - 0.5) * MAP * 1.4
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

  function scatterTrees() {
    for (let i = 0; i < 28; i++) {
      const x = (Math.random() - 0.5) * CORE * 1.7;
      const z = (Math.random() - 0.5) * CORE * 1.7;
      if (Math.hypot(x, z) < 8) continue;
      addTree(x, z, 0.85 + Math.random() * 0.55);
    }
    for (let i = 0; i < 10; i++) {
      addTree(
        (Math.random() - 0.5) * (MAP - CORE) * 1.2,
        CORE + 14 + Math.random() * (MAP - CORE - 20),
        0.75 + Math.random() * 0.35
      );
    }
    for (let i = 0; i < 10; i++) {
      addTree(
        (Math.random() - 0.5) * (MAP - CORE) * 1.2,
        -CORE - 14 - Math.random() * (MAP - CORE - 20),
        0.75 + Math.random() * 0.35
      );
    }
  }

  function scatterBushes() {
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * CORE * 1.8;
      const z = (Math.random() - 0.5) * CORE * 1.8;
      addBush(x, z, 1.8 + Math.random() * 2.2);
    }
    for (let i = 0; i < 8; i++) {
      addBush(
        (Math.random() - 0.5) * (MAP - CORE) * 1.2,
        CORE + 10 + Math.random() * (MAP - CORE - 14),
        1.4 + Math.random() * 1.2
      );
    }
    for (let i = 0; i < 8; i++) {
      addBush(
        (Math.random() - 0.5) * (MAP - CORE) * 1.2,
        -CORE - 10 - Math.random() * (MAP - CORE - 14),
        1.2 + Math.random() * 1
      );
    }
  }

  function getBiome(x, z) {
    if (z > CORE) return "volcano";
    if (z < -CORE) return "frost";
    if (x > CORE) return "ocean";
    if (x < -CORE) return "sky";
    return "plains";
  }

  function updateBiomeFeel() {
    if (!dragon || !scene) return;
    const biome = getBiome(dragon.position.x, dragon.position.z);
    const labels = {
      volcano: "🌋 Volcano Land",
      frost: "❄️ Frost Land",
      ocean: "🌊 Ocean",
      sky: "☁️ Sky Island",
      plains: "🌿 Dragon Plains",
    };
    const hint = document.getElementById("biome-hint");
    if (hint) hint.textContent = labels[biome] || labels.plains;

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

    if (waterMesh) {
      waterMesh.position.y = 0.08 + Math.sin(tick * 1.6) * 0.06;
    }
    if (volcanoGlow) {
      volcanoGlow.material.emissiveIntensity = 0.65 + Math.sin(tick * 3) * 0.25;
    }
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

  function createRival(x, z) {
    const colors = [0xef5350, 0x42a5f5, 0x66bb6a, 0xab47bc, 0xff9800];
    const elements = ["fire", "water", "earth", "air"];
    const mesh = buildRivalDragon(colors[Math.floor(Math.random() * colors.length)]);
    mesh.position.set(x, 0, z);
    mesh.userData.vx = (Math.random() - 0.5) * 2;
    mesh.userData.vz = (Math.random() - 0.5) * 2;
    mesh.userData.name = ["Blaze", "Torrent", "Gale", "Shadow", "Storm", "Ember", "Frost"][
      Math.floor(Math.random() * 7)
    ];
    mesh.userData.rankIndex = Math.floor(Math.random() * 8);
    mesh.userData.element = elements[Math.floor(Math.random() * elements.length)];
    mesh.userData.stunned = 0;
    mesh.userData.revealed = 0;
    scene.add(mesh);
    rivals.push(mesh);
    return mesh;
  }

  function spawnRivals(count) {
    const zones = [
      () => ({ x: (Math.random() - 0.5) * CORE * 1.6, z: (Math.random() - 0.5) * CORE * 1.6 }),
      () => ({ x: (Math.random() - 0.5) * (MAP - CORE), z: CORE + 12 + Math.random() * (MAP - CORE - 16) }),
      () => ({ x: (Math.random() - 0.5) * (MAP - CORE), z: -CORE - 12 - Math.random() * (MAP - CORE - 16) }),
      () => ({ x: CORE + 12 + Math.random() * (MAP - CORE - 16), z: (Math.random() - 0.5) * (MAP - CORE) }),
      () => ({ x: -CORE - 12 - Math.random() * (MAP - CORE - 16), z: (Math.random() - 0.5) * (MAP - CORE) }),
    ];
    for (let i = 0; i < count; i++) {
      const pos = zones[i % zones.length]();
      createRival(pos.x, pos.z);
    }
  }

  function initScene(container) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 70, 340);

    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 450);
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
    sun.shadow.camera.far = 320;
    sun.shadow.camera.left = -MAP;
    sun.shadow.camera.right = MAP;
    sun.shadow.camera.top = MAP;
    sun.shadow.camera.bottom = -MAP;
    scene.add(sun);

    buildWorldTerrain();
    buildVolcanoLand();
    buildFrostLand();
    buildOcean();
    buildSkyIslands();
    scatterTrees();
    scatterBushes();

    dragonGroup = buildDivineDragon();
    dragonGroup.position.set(0, 0, 0);
    scene.add(dragonGroup);
    dragon = dragonGroup;

    spawnRivals(14);
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
    const rival = createRival(dragon.position.x, dragon.position.z);
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
      r.scale.setScalar(1);
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
      if (r.userData.fled) {
        if (r.userData.fleeTimer > 0) {
          r.userData.fleeTimer -= dt;
          r.position.x += (r.userData.fleeVx || 0) * dt;
          r.position.z += (r.userData.fleeVz || 0) * dt;
          r.position.x = Math.max(-MAP + 3, Math.min(MAP - 3, r.position.x));
          r.position.z = Math.max(-MAP + 3, Math.min(MAP - 3, r.position.z));
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
      if (Math.abs(r.position.x) > MAP - 3) r.userData.vx *= -1;
      if (Math.abs(r.position.z) > MAP - 3) r.userData.vz *= -1;
      r.rotation.y = Math.atan2(r.userData.vx, r.userData.vz);
      if (r.userData.revealed > 0) {
        r.userData.revealed -= dt;
        r.scale.setScalar(1 + Math.sin(tick * 10) * 0.08);
      } else {
        r.scale.setScalar(1);
      }
      if (
        encounterCooldown <= 0 &&
        !r.userData.fled &&
        dragon.position.distanceTo(r.position) < 2.2 &&
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
