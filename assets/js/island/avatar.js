/* Characters.
   People: properly proportioned figures (shaped torso, knees, elbows, hands,
   shoes, hair, real eyes) with a walk cycle, built from smooth primitives so
   there is nothing to download. VY-01: the animated "RobotExpressive" model
   (CC0, from the three.js examples) with idle / walk / run / wave / thumbs-up;
   a simple procedural robot stands in until it has loaded. */
import * as THREE from "/assets/vendor/three.module.min.js";
import { RoundedBoxGeometry } from "/assets/vendor/jsm/geometries/RoundedBoxGeometry.js";
import { mat, toy } from "./materials.js";
export { mat };

const S = (c) => mat(c, { smooth: true });
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const G = {
  torso: lathe([[0.001, 0], [0.19, 0.02], [0.2, 0.12], [0.18, 0.28], [0.215, 0.5], [0.225, 0.6], [0.17, 0.68], [0.07, 0.72], [0.001, 0.73]]),
  hips: new THREE.CylinderGeometry(0.2, 0.19, 0.2, 24),
  neck: new THREE.CylinderGeometry(0.06, 0.07, 0.12, 14),
  head: new THREE.SphereGeometry(0.24, 36, 28),
  ear: new THREE.SphereGeometry(0.05, 12, 10),
  upperLeg: new THREE.CapsuleGeometry(0.088, 0.34, 6, 16),
  lowerLeg: new THREE.CapsuleGeometry(0.072, 0.34, 6, 16),
  shoe: new RoundedBoxGeometry(0.16, 0.1, 0.3, 3, 0.045),
  upperArm: new THREE.CapsuleGeometry(0.068, 0.22, 6, 14),
  foreArm: new THREE.CapsuleGeometry(0.056, 0.2, 6, 14),
  hand: new THREE.SphereGeometry(0.065, 16, 12),
  sclera: new THREE.SphereGeometry(0.042, 16, 12),
  iris: new THREE.SphereGeometry(0.024, 14, 10),
  brow: new RoundedBoxGeometry(0.09, 0.022, 0.03, 2, 0.01),
  nose: new THREE.SphereGeometry(0.03, 12, 10),
  smile: new THREE.TorusGeometry(0.05, 0.011, 8, 18, Math.PI),
  open: new THREE.SphereGeometry(0.035, 14, 10),
  hair: new THREE.SphereGeometry(0.255, 32, 20, 0, Math.PI * 2, 0, 1.75),
  fringe: new THREE.SphereGeometry(0.2, 24, 12, -1.1, 2.2, 0.9, 0.55),
  capTop: new THREE.SphereGeometry(0.265, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
  brim: new THREE.CylinderGeometry(0.2, 0.2, 0.025, 24, 1, false, -Math.PI / 2, Math.PI),
  ring: new THREE.CylinderGeometry(0.38, 0.38, 0.03, 32),
  pom: new THREE.SphereGeometry(0.07, 14, 10),
  band: new THREE.TorusGeometry(0.27, 0.025, 10, 28, Math.PI),
  cup: new THREE.CylinderGeometry(0.085, 0.085, 0.07, 20),
  crown: new THREE.CylinderGeometry(0.17, 0.15, 0.14, 10, 1, true),
  pack: new RoundedBoxGeometry(0.34, 0.4, 0.16, 3, 0.05),
  scarf: new THREE.TorusGeometry(0.11, 0.045, 10, 24),
  cape: new THREE.PlaneGeometry(0.5, 0.82, 1, 6),
  glasses: new RoundedBoxGeometry(0.26, 0.06, 0.03, 2, 0.012),
  shadow: new THREE.CircleGeometry(0.75, 28),
};
const SHADOW = new THREE.MeshBasicMaterial({ color: 0x0b2a3a, transparent: true, opacity: 0.24, depthWrite: false });
const DARK = new THREE.MeshStandardMaterial({ color: 0x17142e, roughness: 0.35 });
const WHITE = new THREE.MeshStandardMaterial({ color: 0xf7f7fb, roughness: 0.3 });
const shade = (hex, k) => "#" + new THREE.Color(hex).multiplyScalar(k).getHexString();

export function blobShadow(scale = 1) {
  const m = new THREE.Mesh(G.shadow, SHADOW);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.scale.setScalar(scale); m.renderOrder = 1;
  return m;
}

/* A person. look = { body (shirt), skin, hair, hat, hatColor, face, extra } */
export function makePerson(look) {
  look = { hair: "#2b1d14", ...look };
  const root = new THREE.Group();
  const rig = new THREE.Group(); root.add(rig);
  root.add(blobShadow(0.62));
  const P = (geo, m, x = 0, y = 0, z = 0, parent = rig) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
  const pivot = (x, y, z, parent) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  const pelvis = pivot(0, 1.02, 0, rig);
  const hips = P(G.hips, null, 0, 0, 0, pelvis);
  const chest = pivot(0, 0.08, 0, pelvis);
  const torso = P(G.torso, null, 0, 0, 0, chest); torso.scale.set(1, 1, 0.74);
  const neck = P(G.neck, null, 0, 0.76, 0, chest);
  const headPivot = pivot(0, 0.86, 0.01, chest);
  const head = P(G.head, null, 0, 0.2, 0, headPivot); head.scale.set(0.94, 1.04, 0.98);
  const ears = [-1, 1].map((s) => P(G.ear, null, s * 0.225, 0.19, -0.01, headPivot));
  const face = pivot(0, 0.2, 0, headPivot);
  const hat = pivot(0, 0.2, 0, headPivot);
  const hairG = pivot(0, 0.2, 0, headPivot);
  const legs = [-1, 1].map((s) => {
    const hip = pivot(s * 0.1, -0.06, 0, pelvis);
    const up = P(G.upperLeg, null, 0, -0.24, 0, hip);
    const knee = pivot(0, -0.48, 0, hip);
    const low = P(G.lowerLeg, null, 0, -0.22, 0, knee);
    const ankle = pivot(0, -0.45, 0, knee);
    const shoe = P(G.shoe, null, 0, -0.01, 0.06, ankle);
    return { hip, knee, ankle, up, low, shoe };
  });
  const arms = [-1, 1].map((s) => {
    const sh = pivot(s * 0.255, 0.6, 0, chest);
    const up = P(G.upperArm, null, 0, -0.17, 0, sh);
    const el = pivot(0, -0.34, 0, sh);
    const fo = P(G.foreArm, null, 0, -0.15, 0, el);
    const hand = P(G.hand, null, 0, -0.32, 0.01, el);
    sh.rotation.z = s * 0.12;
    return { sh, el, up, fo, hand, s };
  });
  const extras = new THREE.Group(); chest.add(extras);
  const eyes = [];

  function setLook(l) {
    Object.assign(look, l);
    const skin = S(look.skin), shirt = S(look.body), pants = S(shade(look.body, 0.38)), shoes = S(look.extra === "cape" ? "#1d1a4f" : "#f2f2f5"), hairM = S(look.hair);
    torso.material = shirt; neck.material = skin; head.material = skin; ears.forEach((e) => (e.material = skin)); hips.material = pants;
    legs.forEach((g) => { g.up.material = pants; g.low.material = pants; g.shoe.material = shoes; });
    arms.forEach((a) => { a.up.material = shirt; a.fo.material = skin; a.hand.material = skin; });
    face.clear(); hat.clear(); hairG.clear(); extras.clear(); eyes.length = 0;
    // face (looking down +z)
    if (look.face === "cool") { P(G.glasses, DARK, 0, 0.03, 0.225, face); }
    else [-0.085, 0.085].forEach((x) => {
      const sc = P(G.sclera, WHITE, x, 0.03, 0.205, face); sc.scale.set(1, look.face === "wow" ? 1.25 : 1.05, 0.55);
      const ir = P(G.iris, DARK, x, 0.03, 0.228, face); ir.scale.set(1, 1.1, 0.5); eyes.push(sc, ir);
    });
    [-0.085, 0.085].forEach((x) => { const b = P(G.brow, hairM, x, 0.1, 0.215, face); b.rotation.z = x < 0 ? 0.08 : -0.08; });
    P(G.nose, skin, 0, -0.03, 0.235, face).scale.set(1, 1.1, 0.8);
    if (look.face === "wow") { const o = P(G.open, DARK, 0, -0.1, 0.212, face); o.scale.set(1, 1.2, 0.45); }
    else { const m = P(G.smile, DARK, 0, -0.085, 0.214, face); m.rotation.z = Math.PI; m.scale.setScalar(look.face === "grin" ? 1.3 : 1); }
    // hair (tucked under hats)
    if (look.hat !== "beanie" && look.hat !== "hardhat") {
      const h = P(G.hair, hairM, 0, 0.012, -0.012, hairG); h.rotation.x = -0.32;
      const f = P(G.fringe, hairM, 0, 0.06, 0.06, hairG); f.rotation.x = -0.15;
    }
    // hats
    const hc = S(look.hatColor);
    if (look.hat === "cap") { P(G.capTop, hc, 0, 0.03, 0, hat); P(G.brim, hc, 0, 0.04, 0.2, hat); }
    if (look.hat === "beanie") { const t = P(G.capTop, hc, 0, -0.01, 0, hat); t.scale.set(1.02, 1.15, 1.02); P(G.pom, S("#ffffff"), 0, 0.3, 0, hat); }
    if (look.hat === "hardhat") { P(G.capTop, hc, 0, 0.03, 0, hat); P(G.ring, hc, 0, 0.04, 0.02, hat).scale.set(0.82, 1, 0.82); }
    if (look.hat === "headphones") { P(G.band, hc, 0, 0.01, 0, hat); [-1, 1].forEach((s) => { const c = P(G.cup, hc, s * 0.26, -0.02, 0, hat); c.rotation.z = Math.PI / 2; }); }
    if (look.hat === "crown") P(G.crown, toy({ color: "#ffd23f", metalness: 0.85, roughness: 0.25 }), 0, 0.27, 0, hat);
    // extras
    if (look.extra === "backpack") P(G.pack, S(look.hatColor === "#ffffff" ? "#ff6a3d" : look.hatColor), 0, 0.42, -0.2, extras);
    if (look.extra === "scarf") { const s = P(G.scarf, S("#e53935"), 0, 0.7, 0.01, extras); s.rotation.x = Math.PI / 2; s.scale.set(1.25, 1.05, 1); }
    if (look.extra === "cape") { const c = P(G.cape, toy({ color: "#e0284f", side: THREE.DoubleSide }), 0, 0.3, -0.19, extras); c.rotation.x = 0.1; }
  }
  setLook(look);

  let walk = 0, blink = 2 + Math.random() * 3, talk = 0;
  const ease = (cur, to, k) => cur + (to - cur) * k;
  return {
    root, look, setLook,
    set talking(v) { talk = v ? 1 : 0; },
    update(dt, t, speed) {
      const moving = speed > 0.2, run = Math.min(1, speed / 11), k = Math.min(1, dt * 14);
      walk += dt * (moving ? 7 + speed * 0.55 : 0);
      const s = Math.sin(walk), c = Math.cos(walk), amp = moving ? 0.55 + run * 0.25 : 0;
      legs.forEach((g, i) => {
        const ph = i ? -s : s;
        g.hip.rotation.x = ease(g.hip.rotation.x, ph * amp, k);
        g.knee.rotation.x = ease(g.knee.rotation.x, moving ? Math.max(0, (i ? c : -c)) * (0.9 + run * 0.5) : 0.02, k);
        g.ankle.rotation.x = ease(g.ankle.rotation.x, moving ? -g.knee.rotation.x * 0.35 : 0, k);
      });
      arms.forEach((a, i) => {
        const ph = i ? s : -s;
        const gesture = talk && i === 1;
        a.sh.rotation.x = ease(a.sh.rotation.x, gesture ? -1.1 + Math.sin(t * 7) * 0.25 : ph * amp * 0.85, k);
        a.el.rotation.x = ease(a.el.rotation.x, gesture ? -1.2 : moving ? -0.35 - Math.max(0, -ph) * 0.5 : -0.12, k);
        a.sh.rotation.z = ease(a.sh.rotation.z, a.s * (gesture ? 0.35 : 0.12 + Math.sin(t * 1.6 + i) * 0.015), k);
      });
      pelvis.position.y = 1.02 + (moving ? Math.abs(c) * 0.045 * (1 + run) - 0.02 : Math.sin(t * 2) * 0.006);
      pelvis.rotation.y = moving ? s * 0.1 : 0;
      chest.rotation.y = moving ? -s * 0.16 : Math.sin(t * 0.7) * 0.03;
      chest.rotation.x = moving ? 0.06 + run * 0.12 : 0;
      chest.scale.y = 1 + (moving ? 0 : Math.sin(t * 2) * 0.008);
      headPivot.rotation.y = moving ? s * 0.06 : Math.sin(t * 0.6) * 0.12;
      headPivot.rotation.x = talk ? Math.sin(t * 9) * 0.05 : moving ? -0.05 : 0;
      blink -= dt;
      const closed = blink < 0.12;
      eyes.forEach((e, i) => (e.scale.y = closed ? 0.12 : i % 2 ? 1.1 : look.face === "wow" ? 1.25 : 1.05));
      if (blink < 0) blink = 2 + Math.random() * 4;
      if (look.extra === "cape" && extras.children[0]) extras.children[0].rotation.x = 0.12 + (moving ? 0.35 + run * 0.4 : Math.sin(t * 2) * 0.04);
    },
  };
}

/* VY-01. Starts as a small procedural robot; upgrade(gltf) swaps in the animated model. */
export function makeBot() {
  const root = new THREE.Group();
  const rig = new THREE.Group(); root.add(rig);
  root.add(blobShadow(0.8));
  const shell = S("#f4f6ff");
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 22), shell); head.scale.set(1.2, 0.92, 1); head.position.y = 1.75;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.58, 32, 22, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.26, Math.PI * 0.46), DARK);
  visor.scale.set(1.18, 0.9, 1.04); visor.position.copy(head.position); visor.position.z += 0.04;
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3ef2ff });
  const eyes = [-0.24, 0.24].map((x) => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.1, 6, 12), eyeMat); e.position.set(x, 1.78, 0.62); return e; });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 28, 20), shell); body.scale.set(1, 0.85, 1); body.position.y = 1.0;
  rig.add(head, visor, ...eyes, body);
  let model = null, mixer = null, current = null, talk = 0, blink = 2, emoteT = 0;
  const actions = {};
  const play = (name, fade = 0.3) => {
    const a = actions[name]; if (!a || current === a) return;
    a.reset().setEffectiveWeight(1).fadeIn(fade).play(); if (current) current.fadeOut(fade); current = a;
  };
  return {
    root, bot: true,
    get upgraded() { return !!model; },
    set talking(v) { talk = v ? 1 : 0; },
    /* swap in the animated robot */
    upgrade(gltf) {
      model = gltf.scene;
      model.scale.setScalar(0.6); // the model is about 3.5 units tall at scale 1 (its FBX bones confuse automatic bounds)
      model.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; if (o.material) o.material.envMapIntensity = 0.9; } });
      rig.visible = false; root.add(model);
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const a = mixer.clipAction(clip); actions[clip.name] = a;
        if (["Wave", "ThumbsUp", "Yes", "Jump"].includes(clip.name)) { a.clampWhenFinished = true; a.loop = THREE.LoopOnce; }
      });
      mixer.addEventListener("finished", () => { emoteT = 0; current = null; play("Idle"); });
      play("Idle", 0);
    },
    emote(name = "ThumbsUp") { if (!mixer || !actions[name]) return; emoteT = 1.6; current = null; play(name, 0.2); },
    update(dt, t, speed) {
      if (model) {
        mixer.update(dt);
        if (emoteT > 0) { emoteT -= dt; return; }
        if (speed > 5.5) play("Running"); else if (speed > 0.5) play("Walking"); else if (talk) play("Wave"); else play("Idle");
        return;
      }
      rig.position.y = 0.3 + Math.sin(t * 2.4) * 0.15;
      rig.rotation.x = Math.min(speed, 8) * 0.03;
      blink -= dt; const c = blink < 0.12; eyes.forEach((e) => (e.scale.y = c ? 0.2 : 1)); if (blink < 0) blink = 2 + Math.random() * 3;
    },
  };
}

/* A hat on its own (head radius 0.24, centred on the head), for any character. */
export function buildHat(look) {
  const g = new THREE.Group(), hc = S(look.hatColor || "#ffffff");
  const P = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  if (look.hat === "cap") { P(G.capTop, hc, 0, 0.03, 0); P(G.brim, hc, 0, 0.04, 0.2); }
  if (look.hat === "beanie") { P(G.capTop, hc, 0, -0.01, 0).scale.set(1.02, 1.15, 1.02); P(G.pom, S("#ffffff"), 0, 0.3, 0); }
  if (look.hat === "hardhat") { P(G.capTop, hc, 0, 0.03, 0); P(G.ring, hc, 0, 0.04, 0.02).scale.set(0.82, 1, 0.82); }
  if (look.hat === "headphones") { P(G.band, hc, 0, 0.01, 0); [-1, 1].forEach((s) => (P(G.cup, hc, s * 0.26, -0.02, 0).rotation.z = Math.PI / 2)); }
  if (look.hat === "crown") P(G.crown, toy({ color: "#ffd23f", metalness: 0.85, roughness: 0.25 }), 0, 0.27, 0);
  return g;
}
