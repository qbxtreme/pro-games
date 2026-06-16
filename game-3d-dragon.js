(function () {
  "use strict";

  function goldMat() {
    return new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa22,
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.18,
    });
  }

  function buildProDragon() {
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

    g.traverse((c) => {
      if (c.isMesh) c.castShadow = true;
    });
    return g;
  }

  window.ProGameDragon = { build: buildProDragon };
})();
