(function () {
  "use strict";

  const SCALE = 0.045;

  let scene, camera, renderer, clock, container;
  let ground, entityMap = new Map();
  let renderMode = null;
  let camTarget = new THREE.Vector3();
  let animId = null;
  let running = false;
  let camConfig = { height: 22, distance: 20, fov: 50, fogFar: 220, lookAtY: 1.5 };

  function hexColor(c) {
    if (typeof c === "number") return c;
    if (!c || c[0] !== "#") return 0x5a8f48;
    return parseInt(c.slice(1), 16);
  }

  function buildModel(type, color) {
    if (type.indexOf("br_") === 0 && window.StealBrainrotModels) {
      return window.StealBrainrotModels.build(type.slice(3), color);
    }

    if (type === "dragon" && window.ProGameDragon?.build) {
      return window.ProGameDragon.build();
    }

    const g = new THREE.Group();
    const col = hexColor(color);
    const mat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.55,
      metalness: type === "dragon" ? 0.75 : 0.25,
    });
    const emissive = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: type === "dragon" ? 0.35 : 0.08,
      roughness: 0.45,
      metalness: 0.4,
    });

    if (type === "dragon") {
      const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), emissive);
      body.scale.set(1.3, 0.8, 1.5);
      body.position.y = 1;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), emissive);
      head.position.set(0, 1.2, 0.9);
      g.add(head);
      [-1, 1].forEach((s) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 1.4), emissive);
        wing.position.set(s * 0.9, 1.1, 0);
        wing.rotation.z = s * 0.5;
        g.add(wing);
      });
    } else if (type === "snake") {
      for (let i = 0; i < 5; i++) {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(0.55 - i * 0.06, 8, 6), mat);
        seg.position.set(0, 0.45, -i * 0.65);
        g.add(seg);
      }
    } else if (type === "brawler") {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1.2, 10), mat);
      body.position.y = 0.85;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), mat);
      head.position.y = 1.55;
      g.add(head);
    } else if (type === "fish") {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat);
      body.scale.set(1.4, 0.7, 0.8);
      body.position.y = 0.4;
      g.add(body);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 6), mat);
      tail.rotation.z = Math.PI / 2;
      tail.position.set(-0.75, 0.4, 0);
      g.add(tail);
    } else if (type === "worm") {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.8, 8), mat);
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.35;
      g.add(body);
    } else if (type === "lifter") {
      [-0.22, 0.22].forEach((x) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.75, 8), mat);
        leg.position.set(x, 0.38, 0);
        g.add(leg);
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 0.38), mat);
      torso.position.y = 1.02;
      g.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat);
      head.position.y = 1.55;
      g.add(head);
      [-0.55, 0.55].forEach((x) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.65, 8), mat);
        arm.position.set(x, 1.05, 0);
        arm.rotation.z = x > 0 ? -0.35 : 0.35;
        g.add(arm);
      });
    } else if (type === "tree") {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.9, 8), mat);
      trunk.position.y = 0.45;
      g.add(trunk);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8), emissive);
      leaves.position.y = 1.15;
      g.add(leaves);
    } else if (type === "brainrot") {
      const skin = new THREE.MeshStandardMaterial({ color: 0xffcc80, roughness: 0.38, metalness: 0.05 });
      const cloth = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.32,
        metalness: 0.18,
        emissive: col,
        emissiveIntensity: 0.12,
      });
      const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
      [-0.22, 0.22].forEach((x) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.58, 0.24), cloth);
        leg.position.set(x, 0.29, 0);
        g.add(leg);
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.34), dark);
        shoe.position.set(x, 0.05, 0.04);
        g.add(shoe);
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.82, 0.42), cloth);
      torso.position.y = 0.98;
      g.add(torso);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.56), skin);
      head.position.y = 1.58;
      g.add(head);
      [-0.14, 0.14].forEach((x) => {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), dark);
        eye.position.set(x, 1.62, 0.26);
        g.add(eye);
      });
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.04), dark);
      mouth.position.set(0, 1.42, 0.26);
      g.add(mouth);
      [-0.5, 0.5].forEach((x) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.62, 0.2), cloth);
        arm.position.set(x, 0.98, 0);
        g.add(arm);
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), skin);
        hand.position.set(x, 0.62, 0);
        g.add(hand);
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 10, 28), emissive);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.04;
      g.add(ring);
      const aura = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: 0.14,
        emissive: col,
        emissiveIntensity: 0.35,
        depthWrite: false,
      }));
      aura.position.y = 0.95;
      g.add(aura);
    } else if (type === "tunnel") {
      const stone = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.82, metalness: 0.08 });
      const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 1.4), stone);
      pillarL.position.set(-1.35, 1.2, 0);
      g.add(pillarL);
      const pillarR = pillarL.clone();
      pillarR.position.x = 1.35;
      g.add(pillarR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 1.4), stone);
      lintel.position.y = 2.45;
      g.add(lintel);
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.1), new THREE.MeshBasicMaterial({
        color: 0xef5350,
        transparent: true,
        opacity: 0.75,
      }));
      inner.position.set(0, 1.15, 0.55);
      g.add(inner);
      const frame = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 24, Math.PI), stone);
      frame.rotation.z = Math.PI;
      frame.position.set(0, 2.1, 0);
      g.add(frame);
    } else if (type === "conveyor") {
      const beltMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.55, metalness: 0.12 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.4, metalness: 0.35 });
      const belt = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 10), beltMat);
      belt.position.y = 0.12;
      g.add(belt);
      [-0.95, 0.95].forEach((x) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 10), railMat);
        rail.position.set(x, 0.22, 0);
        g.add(rail);
      });
      for (let i = -4; i <= 4; i++) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.55, 10), railMat);
        roller.rotation.z = Math.PI / 2;
        roller.position.set(0, 0.08, i * 1.1);
        g.add(roller);
      }
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.65 });
      for (let i = -4; i < 4; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.45), stripeMat);
        stripe.position.set(0, 0.2, i * 1.1 + 0.55);
        g.add(stripe);
      }
    } else if (type === "base_floor") {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 2.4), mat);
      pad.position.y = 0.08;
      pad.receiveShadow = true;
      g.add(pad);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.45, metalness: 0.2 });
      [[-1.55, 0, -1.05], [1.55, 0, -1.05], [-1.55, 0, 1.05], [1.55, 0, 1.05]].forEach(([x, , z]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), wallMat);
        post.position.set(x, 0.35, z);
        g.add(post);
      });
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.06), wallMat);
      rail.position.set(0, 0.58, 1.12);
      g.add(rail);
    } else if (type === "base") {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 2.6), mat);
      pad.position.y = 0.09;
      pad.receiveShadow = true;
      g.add(pad);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.45, metalness: 0.2 });
      [[-1.7, 0, 0], [1.7, 0, 0], [0, 0, -1.1], [0, 0, 1.1]].forEach(([x, , z]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.14), wallMat);
        post.position.set(x, 0.42, z);
        g.add(post);
      });
      const gate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.08), new THREE.MeshStandardMaterial({
        color: 0xef5350,
        emissive: 0xef5350,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.85,
      }));
      gate.position.set(0, 0.38, 1.22);
      g.add(gate);
    } else if (type === "wall") {
      const stone = new THREE.MeshStandardMaterial({ color: 0x616161, roughness: 0.88, metalness: 0.06 });
      const cap = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.75, metalness: 0.1 });
      const segment = new THREE.Mesh(new THREE.BoxGeometry(1, 2.4, 0.5), stone);
      segment.position.y = 1.2;
      segment.castShadow = true;
      g.add(segment);
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.18, 0.54), cap);
      top.position.y = 2.45;
      g.add(top);
    } else if (type === "grass_clump") {
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.92, metalness: 0 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.95, metalness: 0 });
      [[0, 0], [-0.14, 0.08], [0.12, -0.06], [-0.08, -0.1], [0.16, 0.1]].forEach(([x, z], i) => {
        const m = i % 2 === 0 ? bladeMat : darkMat;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32 + i * 0.05, 5), m);
        blade.position.set(x, 0.16 + i * 0.02, z);
        blade.rotation.x = (i - 2) * 0.08;
        blade.rotation.z = (i - 2) * 0.06;
        g.add(blade);
      });
    } else {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 10), mat);
      body.position.y = 0.65;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat);
      head.position.y = 1.15;
      g.add(head);
    }
    g.traverse((c) => {
      if (c.isMesh) c.castShadow = true;
    });
    return g;
  }

  function toWorld(x, y, worldW, worldH) {
    const wx = (x - (worldW || 0) * 0.5) * SCALE;
    const wz = (y - (worldH || 0) * 0.5) * SCALE;
    return { x: wx, z: wz };
  }

  function projectWorld(x, y, worldW, worldH, yLift) {
    if (!camera || !container) return null;
    const p = toWorld(x, y, worldW, worldH);
    const v = new THREE.Vector3(p.x, yLift != null ? yLift : 1.1, p.z);
    v.project(camera);
    if (v.z > 1) return { visible: false };
    const w = container.clientWidth;
    const h = container.clientHeight;
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
      visible: true,
    };
  }

  function ensureEntity(id, model, color) {
    if (!entityMap.has(id)) {
      const mesh = buildModel(model || "mob", color);
      scene.add(mesh);
      entityMap.set(id, { mesh, model, color });
    }
    return entityMap.get(id);
  }

  function syncState(state) {
    if (!scene || !state) return null;
    const ww = state.worldW || 2000;
    const wh = state.worldH || 2000;
    const gSize = Math.max(ww, wh) * SCALE * 1.2;

    if (ground) {
      ground.material.color.setHex(hexColor(state.ground || "#5a8f48"));
      ground.scale.set(gSize / 100, gSize / 100, 1);
    }

    if (state.camera) {
      camConfig = { ...camConfig, ...state.camera };
      if (camera && state.camera.fov != null) {
        camera.fov = state.camera.fov;
        camera.updateProjectionMatrix();
      }
      if (scene?.fog && state.camera.fogFar != null) {
        scene.fog.far = state.camera.fogFar;
      }
    }

    renderMode = "entities";
    const seen = new Set();
    if (state.player) {
      const id = "player";
      seen.add(id);
      const ent = ensureEntity(id, state.player.model || state.defaultModel || "trainer", state.player.color);
      const p = toWorld(state.player.x, state.player.y, ww, wh);
      const yLift = state.player.yLift || 0;
      ent.mesh.position.set(p.x, yLift, p.z);
      ent.mesh.rotation.y = state.player.rot ?? (state.player.facing === -1 ? Math.PI : 0);
      ent.mesh.scale.setScalar(state.player.scale || 1);
      ent.mesh.userData.baseY = yLift;
    }

    (state.props || []).forEach((p, i) => {
      const id = p.id || `prop${i}`;
      seen.add(id);
      const ent = ensureEntity(id, p.model || "prop", p.color || "#795548");
      const pos = toWorld(p.x, p.y, ww, wh);
      const propY = p.yLift != null ? p.yLift : 0.4;
      ent.mesh.position.set(pos.x, propY, pos.z);
      if (p.scaleX != null || p.scaleZ != null) {
        ent.mesh.scale.set(p.scaleX ?? p.scale ?? 1, p.scale ?? 1, p.scaleZ ?? p.scale ?? 1);
      } else {
        ent.mesh.scale.setScalar(p.scale || 1);
      }
      ent.mesh.rotation.y = p.rot ?? 0;
      ent.mesh.userData.baseY = propY;
    });

    (state.entities || []).forEach((e, i) => {
      const id = e.id ?? `e${i}`;
      seen.add(id);
      const ent = ensureEntity(id, e.model || "mob", e.color);
      const p = toWorld(e.x, e.y, ww, wh);
      const eLift = e.yLift || 0;
      ent.mesh.position.set(p.x, eLift, p.z);
      ent.mesh.rotation.y = e.rot ?? (e.facing === -1 ? Math.PI : 0);
      ent.mesh.scale.setScalar(e.scale || 1);
      ent.mesh.userData.baseY = eLift;
    });

    entityMap.forEach((ent, id) => {
      if (!seen.has(id)) {
        scene.remove(ent.mesh);
        entityMap.delete(id);
      }
    });

    if (state.player) {
      const p = toWorld(state.player.x, state.player.y, ww, wh);
      camTarget.set(p.x, 1.5, p.z);
    }
    return "entities";
  }

  function resize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function loop() {
    if (!running) return;
    clock.getDelta();

    if (camera && camTarget) {
      camera.position.lerp(
        new THREE.Vector3(camTarget.x, camTarget.y + camConfig.height, camTarget.z + camConfig.distance),
        0.1
      );
      camera.lookAt(camTarget.x, camConfig.lookAtY ?? 1.5, camTarget.z);
      entityMap.forEach((ent) => {
        const baseY = ent.mesh.userData.baseY ?? 0;
        ent.mesh.position.y = baseY + Math.sin(performance.now() * 0.003 + ent.mesh.id) * 0.04;
      });
    }

    renderer.render(scene, camera);
    animId = requestAnimationFrame(loop);
  }

  window.Game3DCore = {
    init(parent) {
      if (!window.THREE || !parent) return false;
      container = parent;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.Fog(0x87ceeb, 40, 220);

      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
      camera.position.set(0, 22, 20);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
      }
      parent.appendChild(renderer.domElement);

      const hemi = new THREE.HemisphereLight(0xddeeff, 0x3d4a38, 1.0);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff5e6, 1.15);
      sun.position.set(35, 55, 25);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 2048;
      sun.shadow.mapSize.height = 2048;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 120;
      sun.shadow.camera.left = -40;
      sun.shadow.camera.right = 40;
      sun.shadow.camera.top = 40;
      sun.shadow.camera.bottom = -40;
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0x8899bb, 0.35);
      fill.position.set(-20, 18, -15);
      scene.add(fill);

      ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.95 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      clock = new THREE.Clock();
      resize();
      running = true;
      loop();
      return true;
    },

    syncState,
    projectWorld,
    getRenderMode() {
      return renderMode;
    },
    resize,

    stop() {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
    },
  };
})();
