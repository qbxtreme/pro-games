(function () {
  "use strict";

  const SCALE = 0.045;

  let scene, camera, renderer, clock, container;
  let ground, entityMap = new Map();
  let renderMode = null;
  let camTarget = new THREE.Vector3();
  let animId = null;
  let running = false;

  function hexColor(c) {
    if (typeof c === "number") return c;
    if (!c || c[0] !== "#") return 0x5a8f48;
    return parseInt(c.slice(1), 16);
  }

  function buildModel(type, color) {
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

    renderMode = "entities";
    const seen = new Set();
    if (state.player) {
      const id = "player";
      seen.add(id);
      const ent = ensureEntity(id, state.player.model || state.defaultModel || "trainer", state.player.color);
      const p = toWorld(state.player.x, state.player.y, ww, wh);
      ent.mesh.position.set(p.x, 0, p.z);
      ent.mesh.rotation.y = state.player.rot ?? (state.player.facing === -1 ? Math.PI : 0);
      ent.mesh.scale.setScalar(1);
    }

    (state.entities || []).forEach((e, i) => {
      const id = e.id ?? `e${i}`;
      seen.add(id);
      const ent = ensureEntity(id, e.model || "mob", e.color);
      const p = toWorld(e.x, e.y, ww, wh);
      ent.mesh.position.set(p.x, 0, p.z);
      ent.mesh.rotation.y = e.rot || 0;
      ent.mesh.scale.setScalar(e.scale || 1);
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
        new THREE.Vector3(camTarget.x, camTarget.y + 22, camTarget.z + 20),
        0.1
      );
      camera.lookAt(camTarget);
      entityMap.forEach((ent) => {
        ent.mesh.position.y = Math.sin(performance.now() * 0.003 + ent.mesh.id) * 0.04;
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      parent.appendChild(renderer.domElement);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x3d5c34, 0.9);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffffff, 1);
      sun.position.set(30, 50, 20);
      sun.castShadow = true;
      scene.add(sun);

      ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x5a8f48, roughness: 0.95 })
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
