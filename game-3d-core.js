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

  function buildEntity() {
    if (window.ProGameDragon?.build) return window.ProGameDragon.build();
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), mat);
    body.position.y = 1;
    g.add(body);
    return g;
  }

  function toWorld(x, y, worldW, worldH) {
    const wx = (x - (worldW || 0) * 0.5) * SCALE;
    const wz = (y - (worldH || 0) * 0.5) * SCALE;
    return { x: wx, z: wz };
  }

  function clearEntities() {
    entityMap.forEach((ent) => {
      scene.remove(ent.mesh);
    });
    entityMap.clear();
  }

  function ensureEntity(id, scale) {
    if (!entityMap.has(id)) {
      const mesh = buildEntity();
      mesh.scale.setScalar(scale || 1);
      scene.add(mesh);
      entityMap.set(id, { mesh, baseScale: scale || 1 });
    }
    return entityMap.get(id);
  }

  function syncEntityState(state) {
    const ww = state.worldW || 2000;
    const wh = state.worldH || 2000;
    const gSize = Math.max(ww, wh) * SCALE * 1.2;

    if (ground) {
      ground.visible = true;
      ground.position.y = 0;
      ground.scale.set(1, 1, 1);
      ground.material.color.setHex(hexColor(state.ground || "#5a8f48"));
      ground.scale.set(gSize / 100, gSize / 100, 1);
    }

    renderMode = "entities";
    const seen = new Set();
    if (state.player) {
      const id = "player";
      seen.add(id);
      const ent = ensureEntity(id, 1);
      const p = toWorld(state.player.x, state.player.y, ww, wh);
      ent.mesh.position.set(p.x, 0, p.z);
      ent.mesh.rotation.y = state.player.rot ?? (state.player.facing === -1 ? Math.PI : 0);
      ent.mesh.scale.setScalar(ent.baseScale);
    }

    (state.entities || []).forEach((e, i) => {
      const id = e.id ?? `e${i}`;
      seen.add(id);
      const s = e.scale || 1;
      const ent = ensureEntity(id, s);
      const p = toWorld(e.x, e.y, ww, wh);
      ent.mesh.position.set(p.x, 0, p.z);
      ent.mesh.rotation.y = e.rot || 0;
      ent.mesh.scale.setScalar(ent.baseScale);
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
  }

  function syncState(state) {
    if (!scene || !state) return null;
    clearEntities();
    syncEntityState(state);
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
