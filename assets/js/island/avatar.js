/* Characters: round, chunky, toy-like people and VY-01 the robot guide.
   All built from simple shapes at runtime, so there are no model files to download. */
import * as THREE from "/assets/vendor/three.module.min.js";

const mats = new Map();
export const mat = (color, opts = {}) => {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshLambertMaterial({ color, flatShading: !opts.smooth, ...(opts.emissive ? { emissive: opts.emissive, emissiveIntensity: opts.ei ?? 1 } : {}) }));
  return mats.get(key);
};
const G = {
  head: new THREE.SphereGeometry(0.62, 20, 14),
  body: new THREE.CapsuleGeometry(0.42, 0.42, 6, 14),
  limb: new THREE.CapsuleGeometry(0.13, 0.36, 4, 8),
  eye: new THREE.SphereGeometry(0.075, 10, 8),
  shine: new THREE.SphereGeometry(0.025, 6, 4),
  blush: new THREE.CircleGeometry(0.09, 12),
  smile: new THREE.TorusGeometry(0.13, 0.03, 6, 14, Math.PI),
  open: new THREE.SphereGeometry(0.08, 10, 8),
  capTop: new THREE.SphereGeometry(0.66, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  brim: new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18, 1, false, -Math.PI / 2, Math.PI),
  ring: new THREE.CylinderGeometry(0.98, 0.98, 0.07, 22),
  pom: new THREE.SphereGeometry(0.17, 10, 8),
  band: new THREE.TorusGeometry(0.68, 0.06, 6, 20, Math.PI),
  cup: new THREE.CylinderGeometry(0.2, 0.2, 0.16, 14),
  crown: new THREE.CylinderGeometry(0.42, 0.36, 0.34, 8, 1, true),
  pack: new THREE.BoxGeometry(0.62, 0.66, 0.3),
  scarf: new THREE.TorusGeometry(0.4, 0.11, 8, 18),
  cape: new THREE.PlaneGeometry(0.9, 1.05, 1, 4),
  glasses: new THREE.BoxGeometry(0.62, 0.13, 0.06),
  shadow: new THREE.CircleGeometry(0.75, 20),
};
const SHADOW = new THREE.MeshBasicMaterial({ color: 0x0b2a3a, transparent: true, opacity: 0.22, depthWrite: false });
const BLACK = new THREE.MeshBasicMaterial({ color: 0x15122e });
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff });
const BLUSH = new THREE.MeshBasicMaterial({ color: 0xff7aa8, transparent: true, opacity: 0.55 });

export function blobShadow(scale = 1) {
  const m = new THREE.Mesh(G.shadow, SHADOW);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.scale.setScalar(scale); m.renderOrder = 1;
  return m;
}

/* A person. look = { body, skin, hat, hatColor, face, extra } */
export function makePerson(look) {
  const root = new THREE.Group();
  const rig = new THREE.Group(); root.add(rig);
  root.add(blobShadow());
  const body = new THREE.Mesh(G.body, mat(look.body)); body.position.y = 0.98; body.castShadow = true; rig.add(body);
  const headPivot = new THREE.Group(); headPivot.position.y = 1.62; rig.add(headPivot);
  const head = new THREE.Mesh(G.head, mat(look.skin, { smooth: true })); head.position.y = 0.42; head.castShadow = true; headPivot.add(head);
  const face = new THREE.Group(); face.position.set(0, 0.42, 0); headPivot.add(face);
  const legL = limb(look.body, -0.2, 0.52), legR = limb(look.body, 0.2, 0.52);
  const armL = limb(look.skin, -0.55, 1.3), armR = limb(look.skin, 0.55, 1.3);
  armL.rotation.z = 0.25; armR.rotation.z = -0.25;
  rig.add(legL, legR, armL, armR);
  const extras = new THREE.Group(); rig.add(extras);
  const hat = new THREE.Group(); hat.position.y = 0.42; headPivot.add(hat);

  function limb(color, x, y) {
    const pivot = new THREE.Group(); pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(G.limb, mat(color, { smooth: true })); m.position.y = -0.26; m.castShadow = true;
    pivot.add(m); return pivot;
  }
  const eyes = [];
  function setLook(l) {
    Object.assign(look, l);
    body.material = mat(look.body); head.material = mat(look.skin, { smooth: true });
    legL.children[0].material = legR.children[0].material = mat(look.body, { smooth: true });
    armL.children[0].material = armR.children[0].material = mat(look.skin, { smooth: true });
    face.clear(); eyes.length = 0; hat.clear(); extras.clear();
    // face, looking down +z
    const eyeY = 0.08;
    if (look.face === "cool") {
      const g = new THREE.Mesh(G.glasses, BLACK); g.position.set(0, eyeY, 0.6); face.add(g);
    } else {
      [-0.2, 0.2].forEach((x) => {
        const e = new THREE.Mesh(G.eye, BLACK); e.position.set(x, eyeY, 0.585); e.scale.set(1, look.face === "wow" ? 1.5 : 1.25, 0.6); face.add(e); eyes.push(e);
        const s = new THREE.Mesh(G.shine, WHITE); s.position.set(x + 0.025, eyeY + 0.04, 0.63); face.add(s);
      });
    }
    [-0.33, 0.33].forEach((x) => { const b = new THREE.Mesh(G.blush, BLUSH); b.position.set(x, -0.06, 0.53); b.lookAt(x * 3, -0.2, 3); face.add(b); });
    if (look.face === "wow") { const o = new THREE.Mesh(G.open, BLACK); o.position.set(0, -0.15, 0.58); o.scale.set(1, 1.2, 0.5); face.add(o); }
    else { const m = new THREE.Mesh(G.smile, BLACK); m.position.set(0, -0.1, 0.58); m.rotation.z = Math.PI; m.scale.setScalar(look.face === "grin" ? 1.35 : 1); face.add(m); }
    // hats
    const hc = mat(look.hatColor, { smooth: true });
    if (look.hat === "cap") { const t = new THREE.Mesh(G.capTop, hc); t.position.y = 0.05; const b = new THREE.Mesh(G.brim, hc); b.position.set(0, 0.06, 0.45); b.rotation.y = 0; hat.add(t, b); }
    if (look.hat === "beanie") { const t = new THREE.Mesh(G.capTop, hc); t.scale.set(1.02, 1.15, 1.02); const p = new THREE.Mesh(G.pom, mat("#ffffff", { smooth: true })); p.position.y = 0.78; hat.add(t, p); }
    if (look.hat === "hardhat") { const t = new THREE.Mesh(G.capTop, hc); t.position.y = 0.08; const r = new THREE.Mesh(G.ring, hc); r.position.y = 0.1; r.scale.set(0.85, 1, 0.85); hat.add(t, r); }
    if (look.hat === "headphones") { const b = new THREE.Mesh(G.band, hc); b.position.y = 0.02; const l = new THREE.Mesh(G.cup, hc), r = new THREE.Mesh(G.cup, hc); l.rotation.z = r.rotation.z = Math.PI / 2; l.position.set(-0.64, -0.04, 0); r.position.set(0.64, -0.04, 0); hat.add(b, l, r); }
    if (look.hat === "crown") { const c = new THREE.Mesh(G.crown, mat("#ffd23f", { emissive: "#7a5200", ei: 0.4 })); c.position.y = 0.66; hat.add(c); }
    hat.children.forEach((m) => (m.castShadow = true));
    // extras
    if (look.extra === "backpack") { const p = new THREE.Mesh(G.pack, mat(look.hatColor === "#ffffff" ? "#ff6a3d" : look.hatColor)); p.position.set(0, 1.05, -0.42); extras.add(p); }
    if (look.extra === "scarf") { const s = new THREE.Mesh(G.scarf, mat("#ff3b3b", { smooth: true })); s.rotation.x = Math.PI / 2; s.position.y = 1.52; extras.add(s); }
    if (look.extra === "cape") { const c = new THREE.Mesh(G.cape, new THREE.MeshLambertMaterial({ color: "#ff2d55", side: THREE.DoubleSide })); c.position.set(0, 1.0, -0.46); c.rotation.x = 0.12; extras.add(c); }
  }
  setLook(look);

  let walk = 0, blink = 2 + Math.random() * 3, talk = 0;
  return {
    root, look, setLook,
    set talking(v) { talk = v ? 1 : 0; },
    update(dt, t, speed) {
      const moving = speed > 0.2;
      walk += dt * (moving ? 11 : 0);
      const sw = moving ? Math.sin(walk) * 0.75 : 0;
      legL.rotation.x += (sw - legL.rotation.x) * Math.min(1, dt * 14);
      legR.rotation.x += (-sw - legR.rotation.x) * Math.min(1, dt * 14);
      armL.rotation.x += (-sw * 0.9 - armL.rotation.x) * Math.min(1, dt * 14);
      armR.rotation.x += ((talk ? Math.sin(t * 8) * 0.4 - 0.6 : sw * 0.9) - armR.rotation.x) * Math.min(1, dt * 10);
      rig.position.y = moving ? Math.abs(Math.sin(walk)) * 0.14 : Math.sin(t * 2.2) * 0.025;
      body.scale.y = 1 + (moving ? 0 : Math.sin(t * 2.2) * 0.025);
      headPivot.rotation.z = moving ? Math.sin(walk) * 0.06 : Math.sin(t * 1.3) * 0.04;
      headPivot.rotation.x = talk ? Math.sin(t * 9) * 0.08 : 0;
      blink -= dt;
      const closed = blink < 0.12;
      eyes.forEach((e) => (e.scale.y = closed ? 0.15 : (look.face === "wow" ? 1.5 : 1.25)));
      if (blink < 0) blink = 2 + Math.random() * 4;
      if (look.extra === "cape") extras.children[0] && (extras.children[0].rotation.x = 0.15 + (moving ? 0.5 : Math.sin(t * 2) * 0.05));
    },
  };
}

/* VY-01: a small flying robot with a screen face, an antenna and a thruster glow. */
export function makeBot() {
  const root = new THREE.Group();
  const rig = new THREE.Group(); root.add(rig);
  root.add(blobShadow(0.8));
  const shell = mat("#f4f6ff", { smooth: true });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16), shell); head.scale.set(1.25, 0.92, 1); head.position.y = 2.2; head.castShadow = true;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.26, Math.PI * 0.46), new THREE.MeshBasicMaterial({ color: 0x15123a }));
  visor.scale.set(1.2, 0.9, 1.02); visor.position.copy(head.position); visor.position.z += 0.06;
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3ef2ff });
  const eyes = [-0.32, 0.32].map((x) => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.14, 4, 8), eyeMat); e.position.set(x, 2.24, 0.86); return e; });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12, Math.PI), eyeMat); mouth.rotation.z = Math.PI; mouth.position.set(0, 2.02, 0.86);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), mat("#c9cde0")); stalk.position.y = 3.15;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff6a3d })); tip.position.y = 3.45;
  const ears = [-1, 1].map((s) => { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14), mat("#ff6a3d", { smooth: true })); e.rotation.z = Math.PI / 2; e.position.set(s * 1.07, 2.2, 0); return e; });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), shell); body.scale.set(1, 0.8, 1); body.position.y = 1.25; body.castShadow = true;
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.06, 6, 20), mat("#3d7bff", { smooth: true })); belt.rotation.x = Math.PI / 2; belt.position.y = 1.25;
  const glow = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0x7ff8ff, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.rotation.x = Math.PI; glow.position.y = 0.62;
  const arms = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.52, 1.35, 0); const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 8), shell); a.position.y = -0.22; p.add(a); p.rotation.z = s * 0.5; return p; });
  rig.add(head, visor, ...eyes, mouth, stalk, tip, ...ears, body, belt, glow, ...arms);
  let blink = 2, talk = 0;
  return {
    root, bot: true,
    set talking(v) { talk = v ? 1 : 0; },
    update(dt, t, speed) {
      rig.position.y = 0.35 + Math.sin(t * 2.4) * 0.18;
      rig.rotation.z = Math.sin(t * 1.7) * 0.05 - Math.min(speed, 8) * 0.0;
      rig.rotation.x = Math.min(speed, 8) * 0.03;
      glow.scale.y = 0.8 + Math.sin(t * 30) * 0.15 + speed * 0.05;
      tip.material.color.setHSL(0.05, 1, 0.5 + 0.25 * Math.sin(t * 5));
      arms[1].rotation.z = talk ? -1.8 + Math.sin(t * 9) * 0.5 : 0.5;
      arms[0].rotation.z = -0.5 - Math.sin(t * 2) * 0.1;
      mouth.scale.y = talk ? 0.6 + Math.abs(Math.sin(t * 14)) * 1.2 : 1;
      blink -= dt; const c = blink < 0.12; eyes.forEach((e) => (e.scale.y = c ? 0.2 : 1)); if (blink < 0) blink = 2 + Math.random() * 3;
    },
  };
}
