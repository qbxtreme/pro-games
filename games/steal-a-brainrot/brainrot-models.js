/** Per-character Roblox Steal a Brainrot–style voxel models (original 3D art) */
(function () {
  "use strict";

  function hex(c) {
    if (typeof c === "number") return c;
    if (!c || c[0] !== "#") return 0xffffff;
    return parseInt(c.slice(1), 16);
  }

  function mat(color, opts) {
    const o = opts || {};
    const c = hex(color);
    return new THREE.MeshStandardMaterial({
      color: c,
      roughness: o.roughness ?? 0.42,
      metalness: o.metalness ?? 0.12,
      emissive: o.emissive != null ? hex(o.emissive) : c,
      emissiveIntensity: o.emissiveIntensity ?? 0,
    });
  }

  function box(g, w, h, d, m, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  }

  function sphere(g, r, m, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m);
    mesh.position.set(x, y, z);
    if (sx) mesh.scale.set(sx, sy ?? sx, sz ?? sx);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  }

  function cyl(g, rt, rb, h, m, x, y, z, rx, rz) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12), m);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  }

  function finish(g, accent) {
    const a = mat(accent, { emissiveIntensity: 0.18 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 24), a);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    g.add(ring);
    return g;
  }

  function buildNoobPizza() {
    const g = new THREE.Group();
    const yellow = mat(0xfdd835);
    const blue = mat(0x1565c0);
    const skin = mat(0xffcc80);
    box(g, 0.22, 0.55, 0.22, blue, -0.18, 0.28, 0);
    box(g, 0.22, 0.55, 0.22, blue, 0.18, 0.28, 0);
    box(g, 0.62, 0.72, 0.34, blue, 0, 0.88, 0);
    box(g, 0.48, 0.48, 0.48, yellow, 0, 1.52, 0);
    box(g, 0.14, 0.14, 0.04, mat(0x111111), -0.12, 1.56, 0.22);
    box(g, 0.14, 0.14, 0.04, mat(0x111111), 0.12, 1.56, 0.22);
    const pizza = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.22, 3), mat(0xff9800));
    pizza.rotation.x = Math.PI;
    pizza.position.set(0, 1.82, 0);
    pizza.castShadow = true;
    g.add(pizza);
    box(g, 0.08, 0.08, 0.08, mat(0xc62828), 0.08, 1.78, 0.08);
    return g;
  }

  function buildGiraffe() {
    const g = new THREE.Group();
    const spots = mat(0x8d6e63);
    const body = mat(0xffb74d);
    box(g, 0.55, 0.55, 0.85, body, 0, 0.72, 0);
    cyl(g, 0.12, 0.14, 1.05, body, 0, 1.45, 0);
    box(g, 0.38, 0.38, 0.42, body, 0, 2.05, 0);
    sphere(g, 0.08, spots, -0.1, 1.2, 0.2);
    sphere(g, 0.08, spots, 0.12, 0.85, 0.25);
    cyl(g, 0.04, 0.04, 0.35, mat(0x5d4037), -0.12, 2.28, 0);
    cyl(g, 0.04, 0.04, 0.35, mat(0x5d4037), 0.12, 2.28, 0);
    return g;
  }

  function buildCheese() {
    const g = new THREE.Group();
    const cheese = mat(0xffeb3b);
    const wedge = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 3), cheese);
    wedge.rotation.y = Math.PI / 6;
    wedge.position.y = 0.55;
    wedge.castShadow = true;
    g.add(wedge);
    box(g, 0.12, 0.12, 0.04, mat(0x111111), -0.12, 0.72, 0.28);
    box(g, 0.12, 0.12, 0.04, mat(0x111111), 0.12, 0.72, 0.28);
    return g;
  }

  function buildTungTung() {
    const g = new THREE.Group();
    const wood = mat(0x6d4c41);
    const drum = mat(0x8d6e63);
    cyl(g, 0.28, 0.32, 1.15, wood, 0, 0.72, 0);
    sphere(g, 0.42, drum, 0, 1.55, 0);
    box(g, 0.55, 0.08, 0.55, mat(0xefebe9), 0, 1.55, 0);
    cyl(g, 0.05, 0.05, 0.85, wood, 0.45, 0.95, 0, 0, -0.6);
    box(g, 0.16, 0.16, 0.04, mat(0x111111), -0.12, 1.62, 0.36);
    box(g, 0.16, 0.16, 0.04, mat(0x111111), 0.12, 1.62, 0.36);
    return g;
  }

  function buildCappuccinoAssassino() {
    const g = new THREE.Group();
    const cup = mat(0xffffff);
    const coffee = mat(0x4e342e);
    cyl(g, 0.42, 0.32, 0.75, cup, 0, 0.62, 0);
    cyl(g, 0.35, 0.35, 0.08, coffee, 0, 0.98, 0);
    cyl(g, 0.06, 0.06, 0.45, mat(0xeeeeee), 0.38, 0.72, 0, 0, Math.PI / 2);
    box(g, 0.52, 0.12, 0.52, mat(0x212121), 0, 1.05, 0);
    box(g, 0.14, 0.14, 0.04, mat(0xff1744), -0.1, 1.08, 0.24);
    box(g, 0.14, 0.14, 0.04, mat(0xff1744), 0.1, 1.08, 0.24);
    return g;
  }

  function buildSharkShoes() {
    const g = new THREE.Group();
    const shark = mat(0x42a5f5);
    box(g, 0.85, 0.42, 0.55, shark, 0, 0.72, 0);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 4), shark);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(0.62, 0.78, 0);
    snout.castShadow = true;
    g.add(snout);
    box(g, 0.22, 0.08, 0.35, mat(0x212121), -0.22, 0.08, 0.12);
    box(g, 0.22, 0.08, 0.35, mat(0x212121), 0.22, 0.08, 0.12);
    box(g, 0.18, 0.12, 0.28, mat(0xf44336), -0.22, 0.14, 0.12);
    box(g, 0.18, 0.12, 0.28, mat(0xf44336), 0.22, 0.14, 0.12);
    return g;
  }

  function buildBombardiro() {
    const g = new THREE.Group();
    const green = mat(0x388e3c);
    const plane = mat(0x90a4ae);
    box(g, 1.05, 0.32, 0.42, green, 0, 0.62, 0);
    box(g, 0.55, 0.28, 0.28, green, 0.72, 0.72, 0);
    box(g, 0.85, 0.12, 1.05, plane, 0, 1.05, 0);
    box(g, 0.55, 0.06, 0.35, plane, -0.55, 1.05, 0);
    box(g, 0.55, 0.06, 0.35, plane, 0.55, 1.05, 0);
    box(g, 0.14, 0.14, 0.04, mat(0x111111), -0.18, 0.72, 0.18);
    return g;
  }

  function buildFrigoCamelo() {
    const g = new THREE.Group();
    const fridge = mat(0xeceff1);
    box(g, 0.72, 1.05, 0.52, fridge, 0, 1.05, 0);
    box(g, 0.62, 0.04, 0.02, mat(0x78909c), 0, 1.05, 0.27);
    [-0.28, 0.28].forEach((x) => {
      cyl(g, 0.1, 0.12, 0.65, mat(0xd7ccc8), x, 0.32, 0.18);
      box(g, 0.14, 0.08, 0.22, mat(0x8d6e63), x, 0.04, 0.28);
    });
    cyl(g, 0.08, 0.08, 0.55, mat(0xd7ccc8), 0, 1.55, 0.32);
    return g;
  }

  function buildSkibidiToilet() {
    const g = new THREE.Group();
    const porcelain = mat(0xf5f5f5);
    cyl(g, 0.42, 0.48, 0.55, porcelain, 0, 0.42, 0);
    box(g, 0.52, 0.35, 0.48, porcelain, 0, 0.82, 0);
    box(g, 0.38, 0.38, 0.38, mat(0xffcc80), 0, 1.18, 0);
    box(g, 0.12, 0.12, 0.04, mat(0x111111), -0.1, 1.22, 0.18);
    box(g, 0.12, 0.12, 0.04, mat(0x111111), 0.1, 1.22, 0.18);
    return g;
  }

  function buildStrawberryElephant() {
    const g = new THREE.Group();
    const pink = mat(0xf48fb1);
    box(g, 0.95, 0.72, 0.75, pink, 0, 0.82, 0);
    sphere(g, 0.42, pink, 0.62, 1.05, 0);
    cyl(g, 0.08, 0.12, 0.55, pink, 0.72, 0.55, 0.15, 0.4);
    cyl(g, 0.08, 0.12, 0.55, pink, 0.72, 0.55, -0.15, -0.4);
    sphere(g, 0.06, mat(0x2e7d32), 0.35, 1.35, 0.1);
    return g;
  }

  function buildSigmaStatue(accent) {
    const g = new THREE.Group();
    const stone = mat(accent || 0x78909c, { roughness: 0.55, metalness: 0.05 });
    box(g, 0.28, 0.75, 0.28, stone, -0.2, 0.38, 0);
    box(g, 0.28, 0.75, 0.28, stone, 0.2, 0.38, 0);
    box(g, 0.72, 0.85, 0.38, stone, 0, 0.95, 0);
    box(g, 0.52, 0.52, 0.48, stone, 0, 1.62, 0);
    box(g, 0.65, 0.12, 0.42, stone, 0, 1.92, 0);
    return g;
  }

  function buildQuadruped(bodyColor, headColor) {
    const g = new THREE.Group();
    const body = mat(bodyColor);
    const head = mat(headColor || bodyColor);
    box(g, 0.75, 0.45, 0.42, body, 0, 0.62, 0);
    box(g, 0.38, 0.38, 0.38, head, 0.52, 0.78, 0);
    [[-0.28, 0.18], [0.28, 0.18], [-0.28, -0.18], [0.28, -0.18]].forEach(([x, z]) => {
      cyl(g, 0.07, 0.08, 0.42, body, x, 0.21, z);
    });
    return g;
  }

  function buildFish() {
    const g = new THREE.Group();
    const fish = mat(0xff7043);
    box(g, 0.65, 0.38, 0.42, fish, 0, 0.55, 0);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.45, 4), fish);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.52, 0.55, 0);
    tail.castShadow = true;
    g.add(tail);
    return g;
  }

  function buildFruit(color) {
    const g = new THREE.Group();
    sphere(g, 0.42, mat(color), 0, 0.55, 0);
    cyl(g, 0.04, 0.04, 0.18, mat(0x33691e), 0, 1.05, 0);
    return g;
  }

  function buildDrumSahur() {
    const g = buildTungTung();
    box(g, 0.35, 0.35, 0.35, mat(0xff5722), 0, 1.75, 0);
    return g;
  }

  function buildVaccaSaturn() {
    const g = new THREE.Group();
    box(g, 0.72, 0.52, 0.42, mat(0xffffff), 0, 0.62, 0);
    sphere(g, 0.32, mat(0xffffff), 0.52, 0.78, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 24), mat(0xffd54f, { emissiveIntensity: 0.2 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.95;
    g.add(ring);
    return g;
  }

  function buildToasterRhino() {
    const g = new THREE.Group();
    box(g, 0.82, 0.55, 0.48, mat(0xb0bec5), 0, 0.62, 0);
    box(g, 0.22, 0.22, 0.35, mat(0x78909c), 0.52, 0.72, 0);
    cyl(g, 0.12, 0.12, 0.35, mat(0xffcc80), 0.62, 0.72, 0);
    return g;
  }

  function buildHumanoid(accent) {
    const g = new THREE.Group();
    const cloth = mat(accent);
    const skin = mat(0xffcc80);
    box(g, 0.22, 0.55, 0.22, cloth, -0.18, 0.28, 0);
    box(g, 0.22, 0.55, 0.22, cloth, 0.18, 0.28, 0);
    box(g, 0.62, 0.72, 0.34, cloth, 0, 0.88, 0);
    box(g, 0.48, 0.48, 0.48, skin, 0, 1.52, 0);
    return g;
  }

  const BUILDERS = {
    noob_pizza: buildNoobPizza,
    giraffe: buildGiraffe,
    cheese: buildCheese,
    tung_tung: buildTungTung,
    drum_sahur: buildDrumSahur,
    cappuccino: buildCappuccinoAssassino,
    shark_shoes: buildSharkShoes,
    bombardiro: buildBombardiro,
    frigo_camel: buildFrigoCamelo,
    skibidi_toilet: buildSkibidiToilet,
    strawberry_elephant: buildStrawberryElephant,
    sigma: buildSigmaStatue,
    fish: buildFish,
    fruit: () => buildFruit(0x8bc34a),
    fruit_kiwi: () => buildFruit(0x689f38),
    fruit_corn: () => buildFruit(0xffeb3b),
    fruit_avocado: () => buildFruit(0x33691e),
    fruit_pineapple: () => buildFruit(0xffa000),
    fruit_strawberry: () => buildFruit(0xe53935),
    fruit_lemon: () => buildFruit(0xffee58),
    fruit_watermelon: () => buildFruit(0xef5350),
    quadruped_pig: () => buildQuadruped(0xf48fb1),
    quadruped_mole: () => buildQuadruped(0x8d6e63),
    quadruped_raccoon: () => buildQuadruped(0x757575, 0x424242),
    quadruped_turtle: () => buildQuadruped(0x66bb6a),
    quadruped_camel: () => buildQuadruped(0xd7ccc8),
    quadruped_elephant: () => buildQuadruped(0x90a4ae),
    quadruped_orangutan: () => buildQuadruped(0xff8a65),
    quadruped_goat: () => buildQuadruped(0xeeeeee),
    quadruped_panda: () => buildQuadruped(0xffffff, 0x212121),
    quadruped_flamingo: () => buildQuadruped(0xf48fb1),
    quadruped_croc: () => buildQuadruped(0x388e3c),
    cactus_hippo: () => {
      const g = buildQuadruped(0x66bb6a);
      sphere(g, 0.08, mat(0x2e7d32), 0.2, 0.85, 0.22);
      sphere(g, 0.08, mat(0x2e7d32), -0.15, 0.72, 0.18);
      return g;
    },
    penguin: () => {
      const g = new THREE.Group();
      box(g, 0.52, 0.72, 0.38, mat(0x212121), 0, 0.72, 0);
      box(g, 0.38, 0.38, 0.32, mat(0xffffff), 0, 1.22, 0);
      return g;
    },
    owl: () => {
      const g = new THREE.Group();
      sphere(g, 0.42, mat(0x558b2f), 0, 0.72, 0);
      sphere(g, 0.32, mat(0x33691e), 0, 1.15, 0);
      box(g, 0.22, 0.22, 0.04, mat(0xffeb3b), -0.12, 1.18, 0.28);
      box(g, 0.22, 0.22, 0.04, mat(0xffeb3b), 0.12, 1.18, 0.28);
      return g;
    },
    vacuum_cow: buildVaccaSaturn,
    toaster_rhino: buildToasterRhino,
    octopus: () => {
      const g = new THREE.Group();
      sphere(g, 0.45, mat(0xab47bc), 0, 0.85, 0);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        cyl(g, 0.05, 0.06, 0.55, mat(0x8e24aa), Math.cos(a) * 0.35, 0.35, Math.sin(a) * 0.35, 0.5, 0);
      }
      return g;
    },
    demon: () => buildHumanoid(0xc62828),
    meowl: () => {
      const g = buildQuadruped(0xffffff, 0xffcc80);
      sphere(g, 0.18, mat(0x42a5f5), 0.45, 1.05, 0.15);
      return g;
    },
    horseman: () => {
      const g = buildQuadruped(0x424242);
      cyl(g, 0.18, 0.18, 0.35, mat(0xff6f00), 0, 1.35, 0);
      return g;
    },
    john_pork: () => buildQuadruped(0xf8bbd0),
    nuclear_dino: () => {
      const g = buildQuadruped(0x76ff03);
      sphere(g, 0.22, mat(0xffeb3b, { emissiveIntensity: 0.45 }), 0, 1.05, 0);
      return g;
    },
    job_sahur: () => {
      const g = buildHumanoid(0x37474f);
      box(g, 0.42, 0.28, 0.12, mat(0x795548), 0, 1.05, 0.32);
      return g;
    },
    humanoid: buildHumanoid,
  };

  const ARCHETYPE = {
    noobini_pizzanini: "noob_pizza",
    lirili_larila: "giraffe",
    tim_cheese: "cheese",
    fluriflura: "fruit",
    talpa_di_fero: "quadruped_mole",
    svinina_bombardino: "quadruped_pig",
    raccooni_jandelini: "quadruped_raccoon",
    pipi_kiwi: "fruit_kiwi",
    pipi_corni: "fruit_corn",
    tartaragno: "quadruped_turtle",
    trippi_troppi: "fish",
    tung_tung_sahur: "tung_tung",
    gangster_footera: "humanoid",
    bandito_bobritto: "humanoid",
    boneca_ambalabu: "humanoid",
    cacto_hipopotamo: "cactus_hippo",
    ta_ta_ta_sahur: "drum_sahur",
    tric_trac_baraboom: "humanoid",
    pipi_avocado: "fruit_avocado",
    cupcake_koala: "humanoid",
    pinealotto: "fruit_pineapple",
    cappuccino_assassino: "cappuccino",
    brr_brr_patapim: "humanoid",
    trulimero: "humanoid",
    bambini_crostini: "humanoid",
    bananita_dolphinita: "fish",
    perochello: "fruit_lemon",
    brri_brri: "humanoid",
    avocadini_guffo: "owl",
    salamino_penguino: "penguin",
    ti_ti_ti_sahur: "drum_sahur",
    avocadini_antilopini: "quadruped_camel",
    wombo_rollo: "humanoid",
    sigma_boy: "sigma",
    chimpazini: "quadruped_orangutan",
    burbaloni: "humanoid",
    glorbo: "fruit_watermelon",
    pandaccini: "quadruped_panda",
    strawberelli: "quadruped_flamingo",
    sigma_girl: "sigma",
    lionel_cactusoli: "cactus_hippo",
    frigo_camelo: "frigo_camel",
    orangutini: "quadruped_orangutan",
    bombardiro: "bombardiro",
    rhino_toasterino: "toaster_rhino",
    te_te_te_sahur: "drum_sahur",
    cocofanto: "quadruped_elephant",
    odin_din: "humanoid",
    trippi_troppa: "octopus",
    girafa_celestre: "giraffe",
    tralalero: "shark_shoes",
    pakrahmatmamat: "demon",
    la_vacca: "vacuum_cow",
    job_job_job: "job_sahur",
    nuclearo: "nuclear_dino",
    blackhole_goat: "quadruped_goat",
    fragola_lala: "fruit_strawberry",
    strawberry_elephant: "strawberry_elephant",
    meowl: "meowl",
    skibidi_toilet: "skibidi_toilet",
    headless_horseman: "horseman",
    john_pork: "john_pork",
  };

  window.StealBrainrotModels = {
    modelId(brainrotId) {
      return `br_${brainrotId}`;
    },
    build(brainrotId, accent) {
      const key = ARCHETYPE[brainrotId] || "humanoid";
      const fn = BUILDERS[key] || BUILDERS.humanoid;
      const g = fn.length ? fn(accent) : fn();
      return finish(g, accent || "#ffffff");
    },
  };
})();
