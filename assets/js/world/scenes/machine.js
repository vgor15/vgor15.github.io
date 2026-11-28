/* MACHINE (/machine): computer anatomy.
   A lattice core (the CPU) with seven modules in orbit: C, Linux, Embedded,
   systemd, Networking, Git and Debugging. Each has its own form; data links
   pulse between the core and every module. Hovering a skill card brightens
   the matching module and speeds its link. */
import { voidScene } from "./void.js";

const MODULES = [
  ["C", "box"], ["Linux", "tetra"], ["Embedded", "chip"], ["systemd", "ring"], ["Networking", "ico"], ["Git", "branch"], ["Debugging", "octa"],
];

export function machineScene(engine) {
  const { THREE, camera } = engine;
  const base = voidScene(engine);
  const root = base.root;
  const rig = new THREE.Group(); root.add(rig);

  const core = new THREE.Group(); rig.add(core);
  core.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.2, 1)), new THREE.LineBasicMaterial({ color: 0x3ef2ff, transparent: true, opacity: .55 })));
  core.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.1, 0)), new THREE.LineBasicMaterial({ color: 0xa98bff, transparent: true, opacity: .7 })));
  const heart = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), new THREE.MeshBasicMaterial({ color: 0x9ff8ff }));
  core.add(heart);

  const shape = (kind) => {
    switch (kind) {
      case "box": return new THREE.BoxGeometry(1.6, 1.6, 1.6);
      case "tetra": return new THREE.TetrahedronGeometry(1.3);
      case "chip": return new THREE.BoxGeometry(2, .35, 2);
      case "ring": return new THREE.TorusGeometry(1, .28, 12, 32);
      case "ico": return new THREE.IcosahedronGeometry(1.1, 0);
      case "branch": return new THREE.CylinderGeometry(.25, .25, 2.2, 8);
      default: return new THREE.OctahedronGeometry(1.2);
    }
  };
  const mods = MODULES.map(([name, kind], i) => {
    const grp = new THREE.Group();
    const geo = shape(kind);
    const solid = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x1a1240, transparent: true, opacity: .55 }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: i % 2 ? 0xa98bff : 0x3ef2ff, transparent: true, opacity: .9 }));
    grp.add(solid, edges); rig.add(grp);
    const linkGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const link = new THREE.Line(linkGeo, new THREE.LineDashedMaterial({ color: 0x3ef2ff, dashSize: .5, gapSize: .45, transparent: true, opacity: .45 }));
    rig.add(link);
    return { name, grp, solid, edges, link, angle: (i / MODULES.length) * Math.PI * 2, radius: 9 + (i % 3) * 1.6, tilt: (i % 2 ? .35 : -.25), on: 0, target: 0 };
  });

  const norm = (s) => String(s).toLowerCase();
  const onHover = (e) => {
    const card = e.target.closest && e.target.closest(".js-skills section, .js-toys article");
    const text = card ? norm(card.textContent) : "";
    mods.forEach((m) => (m.target = card && text.includes(norm(m.name).slice(0, 5)) ? 1 : 0));
    if (card && !mods.some((m) => m.target)) mods[2].target = 1; // anything embedded-ish lights the chip
  };
  document.addEventListener("pointerover", onHover);

  return {
    root,
    resize: base.resize,
    update(dt, s) {
      base.update(dt, s);
      core.rotation.y += dt * .3; core.rotation.x += dt * .12;
      heart.scale.setScalar(1 + .08 * Math.sin(s.time * 3));
      mods.forEach((m) => {
        m.on += (m.target - m.on) * Math.min(1, dt * 4);
        m.angle += dt * (.12 + m.on * .5);
        const x = Math.cos(m.angle) * m.radius, z = Math.sin(m.angle) * m.radius, y = Math.sin(m.angle * 2 + m.tilt * 5) * 2.4 + m.tilt * 3;
        m.grp.position.set(x, y, z);
        m.grp.rotation.x += dt * .4; m.grp.rotation.y += dt * (.5 + m.on * 2);
        m.grp.scale.setScalar(1 + m.on * .35);
        m.edges.material.opacity = .55 + m.on * .45; m.solid.material.opacity = .45 + m.on * .3;
        const p = m.link.geometry.attributes.position; p.setXYZ(1, x, y, z); p.needsUpdate = true; m.link.computeLineDistances();
        m.link.material.opacity = .25 + m.on * .6; m.link.material.dashSize = .5 + .3 * Math.sin(s.time * (3 + m.on * 6));
      });
      const small = innerWidth < 700;
      rig.position.set(small ? 0 : 8, small ? 4 : 0, 0);
      rig.rotation.x = s.pointer.y * .15 + .25; rig.rotation.z = -s.pointer.x * .1;
      camera.position.z = (small ? 46 : 34) - s.scroll * 6;
    },
    dispose() { document.removeEventListener("pointerover", onHover); base.dispose(); rig.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose(); }); },
  };
}
