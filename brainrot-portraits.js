/** Renders StealBrainrotModels into cached 2D portraits (same look as 3D in-game). */
(function () {
  "use strict";

  const SIZE = 96;
  let renderer, scene, camera;
  const cache = new Map();

  function rarityColor(def) {
    const r = window.StealBrainrotCatalog?.RARITY?.[def?.rarity];
    return r?.color || "#9e9e9e";
  }

  function ensure() {
    if (!window.THREE || !window.StealBrainrotModels) return false;
    if (renderer) return true;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(SIZE, SIZE);
      renderer.setPixelRatio(1);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
      camera.position.set(0.15, 1.38, 3.35);
      camera.lookAt(0, 0.88, 0);
      scene.add(new THREE.HemisphereLight(0xddeeff, 0x3d4a38, 1.0));
      const sun = new THREE.DirectionalLight(0xfff5e6, 1.05);
      sun.position.set(2.5, 5, 3);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0x8899bb, 0.35);
      fill.position.set(-2, 2, -2);
      scene.add(fill);
      return true;
    } catch (_) {
      return false;
    }
  }

  function portraitCanvas(def) {
    const id = def.id;
    const color = rarityColor(def);
    const key = `${id}:${color}`;
    if (cache.has(key)) return cache.get(key);

    const mesh = StealBrainrotModels.build(id, color);
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    mesh.position.sub(center);
    mesh.position.y += 0.9;
    scene.add(mesh);
    renderer.render(scene, camera);
    scene.remove(mesh);

    const out = document.createElement("canvas");
    out.width = SIZE;
    out.height = SIZE;
    out.getContext("2d").drawImage(renderer.domElement, 0, 0);
    cache.set(key, out);
    return out;
  }

  function drawEmojiFallback(ctx, x, y, def, size) {
    ctx.save();
    ctx.font = `${Math.round(size * 0.62)}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def?.emoji || "🧠", x, y);
    ctx.restore();
  }

  window.BrainrotPortraits = {
    draw(ctx, x, y, def, size, opts) {
      opts = opts || {};
      if (!def) return false;
      const s = size || 36;
      if (def.id && ensure()) {
        try {
          const tex = portraitCanvas(def);
          const bob = opts.bob === false ? 0 : Math.sin(performance.now() * 0.004 + x * 0.02) * 2;
          const rc = window.StealBrainrotCatalog?.RARITY?.[def.rarity];
          ctx.save();
          if (rc?.glow) {
            ctx.shadowColor = rc.glow;
            ctx.shadowBlur = def.rarity === "og" ? 14 : def.rarity === "secret" ? 10 : 6;
          }
          ctx.drawImage(tex, x - s / 2, y - s / 2 + bob, s, s);
          ctx.restore();
          return true;
        } catch (_) { /* fall through */ }
      }
      drawEmojiFallback(ctx, x, y, def, s);
      return false;
    },

    clearCache() {
      cache.clear();
    },
  };
})();
