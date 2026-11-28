/* The island: sky, sea, land, paths, the seven places, trees, lamps, clouds,
   the CAN bus and day/night. Everything is built from simple shapes. */
import * as THREE from "/assets/vendor/three.module.min.js";
import { ZONES } from "./data.js";
import { mat, blobShadow } from "./avatar.js";

export const R0 = 44, ROAD = 35;
export const islandR = (a) => R0 * (1 + 0.07 * Math.sin(3 * a + 0.5) + 0.04 * Math.sin(7 * a + 2) + 0.025 * Math.sin(13 * a));
const rand = (() => { let s = 1337; return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
const pick = (a) => a[Math.floor(rand() * a.length)];

/* text on a canvas, for signs and kiosk screens */
export function textTexture(lines, { w = 512, h = 256, bg = "#ffffff", fg = "#1d1a4f", font = 64, sub = 30, emoji = "" } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  const [a, b] = Array.isArray(lines) ? lines : [lines];
  let y = h / 2 - (b ? sub * 0.7 : 0) + (emoji ? font * 0.35 : 0);
  if (emoji) { g.font = `${font * 1.1}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; g.fillText(emoji, w / 2, y - font * 1.05); }
  g.font = `800 ${font}px Unbounded, "Arial Black", sans-serif`;
  let fs = font; while (g.measureText(a).width > w * 0.9 && fs > 18) { fs -= 4; g.font = `800 ${fs}px Unbounded, "Arial Black", sans-serif`; }
  g.fillText(a, w / 2, y);
  if (b) { g.font = `600 ${sub}px Geist, Arial, sans-serif`; g.globalAlpha = 0.75; g.fillText(b, w / 2, y + fs * 0.62 + sub * 0.6); g.globalAlpha = 1; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function buildWorld(renderer, tier) {
  const scene = new THREE.Scene();
  const colliders = [], anchors = {}, clickables = [], night = { k: 0 }, nightMats = [], updaters = [];
  const add = (o, parent = scene) => (parent.add(o), o);
  const mesh = (geo, m, x = 0, y = 0, z = 0, parent = scene, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o; };
  const between = (a, b, r, m, parent) => { const d = new THREE.Vector3().subVectors(b, a); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.castShadow = true; parent.add(o); return o; };

  /* ---------- light ---------- */
  const hemi = add(new THREE.HemisphereLight(0xdff4ff, 0x6fbf5a, 1.15));
  const sun = add(new THREE.DirectionalLight(0xfff1d6, 1.9));
  sun.position.set(-40, 70, 35);
  if (tier !== "low") {
    sun.castShadow = true;
    const s = tier === "high" ? 2048 : 1024; sun.shadow.mapSize.set(s, s);
    Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 10, far: 180 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  }
  scene.fog = new THREE.Fog(0xcdefff, 120, 330);

  /* ---------- sky dome ---------- */
  const skyU = { uTop: { value: new THREE.Color("#4fb6ff") }, uBot: { value: new THREE.Color("#d9f6ff") }, uNight: { value: 0 }, uTime: { value: 0 } };
  const sky = add(new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uBot; uniform float uNight; uniform float uTime; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      void main(){ float y = clamp(vP.y * 1.4 + .15, 0., 1.); vec3 c = mix(uBot, uTop, pow(y, .8));
        vec3 g = floor(vP * 240.); float s = step(.9965, h(g)) * smoothstep(.05, .4, vP.y) * uNight; s *= .6 + .4 * sin(uTime * 2. + h(g + 1.) * 40.);
        gl_FragColor = vec4(c + s, 1.); }` })));
  sky.renderOrder = -1;
  const sunBall = add(new THREE.Mesh(new THREE.SphereGeometry(9, 20, 12), new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false })));
  sunBall.position.set(-150, 120, -260);
  const moon = add(new THREE.Mesh(new THREE.SphereGeometry(7, 20, 12), new THREE.MeshBasicMaterial({ color: 0xf3f0ff, fog: false, transparent: true, opacity: 0 })));
  moon.position.set(160, 110, -250);

  /* ---------- sea ---------- */
  const seaU = { uTime: { value: 0 }, uDeep: { value: new THREE.Color("#1f9fd6") }, uShallow: { value: new THREE.Color("#6fe3f0") }, uFoam: { value: new THREE.Color("#ffffff") }, uFar: { value: new THREE.Color("#cdefff") }, uNight: { value: 0 } };
  const sea = add(new THREE.Mesh(new THREE.PlaneGeometry(900, 900, tier === "low" ? 60 : 120, tier === "low" ? 60 : 120), new THREE.ShaderMaterial({
    uniforms: seaU, fog: false,
    vertexShader: `uniform float uTime; varying vec3 vW; void main(){ vec3 p = position; vec4 w = modelMatrix * vec4(p,1.);
        w.y += sin(w.x*.12 + uTime*1.2)*.25 + cos(w.z*.1 + uTime)*.22; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFoam; uniform vec3 uFar; uniform float uNight; varying vec3 vW;
      float r(float a){ return ${R0.toFixed(1)} * (1. + .07*sin(3.*a+.5) + .04*sin(7.*a+2.) + .025*sin(13.*a)) + 4.5; }
      void main(){ float a = atan(vW.z, vW.x); float d = length(vW.xz) - r(a);
        vec3 c = mix(uShallow, uDeep, smoothstep(0., 26., d));
        float band = smoothstep(.0, 1.4, d) * (1. - smoothstep(1.4, 3.2, d));
        float ring = step(.82, fract(d * .22 - uTime * .35)) * (1. - smoothstep(4., 16., d));
        float spark = step(.985, fract(sin(dot(floor(vW.xz*.7), vec2(12.9,78.2)))*43758.5) ) * .5 * (.5+.5*sin(uTime*3.+vW.x));
        c = mix(c, uFoam, max(band * .9, ring * .35)) + spark * (1. - uNight) * .25;
        float far = smoothstep(120., 330., length(vW.xz)); c = mix(c, uFar, far);
        gl_FragColor = vec4(c, 1.); }` })));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -1.05;

  /* ---------- land ---------- */
  const disc = (scale, y, grow) => {
    const g = new THREE.RingGeometry(0.0001, 1, 128, 14); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i); const a = Math.atan2(-yy, x); const R = islandR(a) * scale + grow; p.setXY(i, x * R, yy * R); }
    g.rotateX(-Math.PI / 2); g.translate(0, y, 0); g.computeVertexNormals(); return g;
  };
  const skirt = (scale, grow, y0, y1, flare) => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 128, 3, true); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), yy = p.getY(i) + 0.5; const a = Math.atan2(z, x); const R = islandR(a) * scale + grow + (1 - yy) * flare + Math.sin(a * 23) * 0.25 * (1 - yy); p.setXYZ(i, Math.cos(a) * R, y0 + (y1 - y0) * (1 - yy), Math.sin(a) * R); }
    g.computeVertexNormals(); return g;
  };
  // grass top with gentle colour patches
  const gGeo = disc(1, 0, 0); const gc = []; const gp = gGeo.attributes.position; const cA = new THREE.Color("#72d65e"), cB = new THREE.Color("#5cc456"), cC = new THREE.Color("#8ee06a"), tmp = new THREE.Color();
  for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i); const n = 0.5 + 0.5 * Math.sin(x * 0.18) * Math.cos(z * 0.16) + 0.2 * Math.sin((x + z) * 0.4); tmp.copy(cA).lerp(n > 0.6 ? cC : cB, Math.abs(n - 0.6)); gc.push(tmp.r, tmp.g, tmp.b); }
  gGeo.setAttribute("color", new THREE.Float32BufferAttribute(gc, 3));
  const grass = mesh(gGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 0, 0, 0, scene, false);
  mesh(skirt(1, 0, 0, -0.9, 0.6), mat("#4fae49"), 0, 0, 0, scene, false);
  mesh(disc(1, -0.55, 5.5), mat("#f6dfa0", { smooth: true }), 0, 0, 0, scene, false);
  mesh(skirt(1, 5.5, -0.55, -6, 5), mat("#e8c87f"), 0, 0, 0, scene, false);
  // under-rock so the island has weight
  


  /* ---------- roads and paths ---------- */
  const pathMat = mat("#f8edd2", { smooth: true }), roadMat = mat("#5f6f8f", { smooth: true });
  const ribbon = (pts, w, m, y) => {
    const curve = new THREE.CatmullRomCurve3(pts), N = Math.max(12, Math.round(curve.getLength() * 1.5)), pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const p = curve.getPoint(i / N), t = curve.getTangent(i / N); const nx = -t.z, nz = t.x, l = Math.hypot(nx, nz) || 1; pos.push(p.x + nx / l * w / 2, y, p.z + nz / l * w / 2, p.x - nx / l * w / 2, y, p.z - nz / l * w / 2); if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const o = new THREE.Mesh(g, m); o.receiveShadow = true; scene.add(o); return curve;
  };
  const paths = [];
  ZONES.slice(1).forEach((z, i) => {
    const [x, zz] = z.pos, d = Math.hypot(x, zz), ux = x / d, uz = zz / d, bend = (i % 2 ? 1 : -1) * 2.5;
    const pts = [new THREE.Vector3(ux * 7.5, 0, uz * 7.5), new THREE.Vector3(ux * d * 0.5 - uz * bend, 0, uz * d * 0.5 + ux * bend), new THREE.Vector3(x - ux * 2, 0, zz - uz * 2)];
    paths.push(ribbon(pts, 2.4, pathMat, 0.04).getPoints(40));
  });
  const ringPts = []; for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(a) * ROAD, 0, Math.sin(a) * ROAD)); }
  const ringCurve = new THREE.CatmullRomCurve3(ringPts, true);
  { const N = 256, pos = [], idx = []; for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(c * (ROAD - 1.6), 0.05, s * (ROAD - 1.6), c * (ROAD + 1.6), 0.05, s * (ROAD + 1.6)); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const o = new THREE.Mesh(g, roadMat); o.receiveShadow = true; scene.add(o);
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.02, 1.1), mat("#ffffff", { smooth: true }), 80); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < 80; i++) { const a = (i / 80) * Math.PI * 2; q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a); m4.compose(new THREE.Vector3(Math.cos(a) * ROAD, 0.07, Math.sin(a) * ROAD), q, new THREE.Vector3(1, 1, 1)); dash.setMatrixAt(i, m4); }
    scene.add(dash); }
  const nearPath = (x, z, pad) => paths.some((ps) => ps.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < pad * pad)) || Math.abs(Math.hypot(x, z) - ROAD) < 2.6 + pad * 0.3;

  /* ---------- shared bits ---------- */
  const windowMat = new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0xffc861, emissiveIntensity: 0 });
  const lampMat = new THREE.MeshLambertMaterial({ color: 0xfff6d8, emissive: 0xffd27a, emissiveIntensity: 0.1 });
  const neonMats = [];
  nightMats.push((k) => { windowMat.emissiveIntensity = k * 0.9; windowMat.color.setStyle(k > 0.5 ? "#ffe2a0" : "#9fd8ff"); lampMat.emissiveIntensity = 0.1 + k * 1.4; neonMats.forEach((m) => (m.emissiveIntensity = 0.5 + k * 1.2)); });
  const zoneGroup = (z) => { const g = new THREE.Group(); g.position.set(z.pos[0], 0, z.pos[1]); g.rotation.y = Math.atan2(-z.pos[0], -z.pos[1]); scene.add(g); return g; };
  const toWorld = (g, x, z) => new THREE.Vector3(x, 0, z).applyMatrix4(g.matrixWorld);
  const collide = (g, x, z, r) => { g.updateMatrixWorld(true); const p = toWorld(g, x, z); colliders.push({ x: p.x, z: p.z, r }); };
  const sign = (parent, text, sub, color, x, y, z, w = 4.4, h = 1.5) => {
    const board = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.25), mat(color)); board.position.set(x, y, z); board.castShadow = true; parent.add(board);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTexture(sub ? [text, sub] : text, { w: 512, h: Math.round(512 * h / w), font: 70, sub: 30 }) }));
    face.position.set(x, y, z + 0.14); parent.add(face); return board;
  };

  /* ---------- PLAZA + signal tower ---------- */
  const plaza = zoneGroup(ZONES[0]);
  mesh(new THREE.CylinderGeometry(8.4, 8.6, 0.3, 40), mat("#fbf1dc", { smooth: true }), 0, 0.1, 0, plaza, false);
  mesh(new THREE.TorusGeometry(6, 0.18, 6, 48), mat("#ff6a3d", { smooth: true }), 0, 0.26, 0, plaza, false).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.6, 8), mat("#e6dcc8"), 0, 0.4, 0, plaza);
  const tower = new THREE.Group(); plaza.add(tower);
  const steel = mat("#ff6a3d"), white = mat("#ffffff");
  const H = 15, legs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  legs.forEach(([a, b]) => between(new THREE.Vector3(a * 1.7, 0.6, b * 1.7), new THREE.Vector3(a * 0.28, H, b * 0.28), 0.12, steel, tower));
  for (let k = 0; k < 6; k++) {
    const y0 = 0.6 + k * (H / 6.4), y1 = y0 + H / 6.4, w0 = 1.7 - (1.42 * (y0 - 0.6)) / H, w1 = 1.7 - (1.42 * (y1 - 0.6)) / H, m = k % 2 ? white : steel;
    for (let s = 0; s < 4; s++) { const [a, b] = legs[[0, 1, 3, 2][s]], [c, d] = legs[[0, 1, 3, 2][(s + 1) % 4]]; between(new THREE.Vector3(a * w0, y0, b * w0), new THREE.Vector3(c * w1, y1, d * w1), 0.05, m, tower); }
  }
  const dish = mesh(new THREE.SphereGeometry(1.3, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.6), mat("#ffffff", { smooth: true }), 0, H - 1.5, 0.6, tower); dish.rotation.x = 1.25; dish.material.side = THREE.DoubleSide;
  const beacon = mesh(new THREE.SphereGeometry(0.35, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff3b3b }), 0, H + 0.35, 0, tower, false);
  const waves = [0, 1, 2].map(() => { const w = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); w.rotation.x = Math.PI / 2; w.position.y = H + 0.3; tower.add(w); return w; });
  collide(plaza, 0, 0, 3.2);
  clickables.push({ obj: tower, kind: "tower" });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const b = new THREE.Group(); b.position.set(Math.cos(a) * 6.8, 0, Math.sin(a) * 6.8); b.rotation.y = -a + Math.PI / 2; plaza.add(b); mesh(new THREE.BoxGeometry(2.4, 0.18, 0.7), mat("#c9874a"), 0, 0.62, 0, b); mesh(new THREE.BoxGeometry(2.4, 0.6, 0.14), mat("#c9874a"), 0, 1.0, -0.3, b); [-1, 1].forEach((s) => mesh(new THREE.BoxGeometry(0.14, 0.55, 0.6), mat("#4b4f6b"), s * 1, 0.3, 0, b)); }
  anchors.plaza = new THREE.Vector3(0, H + 2.4, 0);
  updaters.push((dt, t) => { beacon.material.color.setHSL(0, 1, 0.45 + 0.25 * Math.max(0, Math.sin(t * 4))); waves.forEach((w, i) => { const k = (t * 0.45 + i / 3) % 1; w.scale.setScalar(0.5 + k * 6); w.material.opacity = (1 - k) * 0.55; }); });

  /* ---------- WORKSHOP ---------- */
  const ws = zoneGroup(ZONES[1]);
  mesh(new THREE.BoxGeometry(9, 3.4, 6), mat("#eef2fb"), 0, 1.7, -3.5, ws);
  const roof = mesh(new THREE.CylinderGeometry(3.3, 3.3, 9.4, 18, 1, false, 0, Math.PI), mat("#ffb21e"), 0, 3.4, -3.5, ws); roof.rotation.z = Math.PI / 2;
  mesh(new THREE.BoxGeometry(4.4, 2.8, 0.1), mat("#3a3f63"), 0, 1.4, -0.48, ws, false);
  for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(4.4, 0.06, 0.12), mat("#5a6088"), 0, 0.3 + i * 0.45, -0.42, ws, false);
  [-3.4, 3.4].forEach((x) => mesh(new THREE.BoxGeometry(1.4, 1, 0.1), windowMat, x, 2.1, -0.47, ws, false));
  sign(ws, "WORKSHOP", "things vyom built", "#ffb21e", 0, 5.6, -0.6, 5.2, 1.5);
  collide(ws, 0, -3.5, 5.2); collide(ws, -3, -3.5, 3.6); collide(ws, 3, -3.5, 3.6);
  const projects = ((window.SITE && window.SITE.work) || []).filter((w) => !w.hidden).slice(0, 5);
  const ICONS = { can: "🚗", cell: "🐚", test: "🧪", lcd: "📟", tree: "🌳", grid: "#️⃣", chip: "🔌" };
  projects.forEach((p, i) => {
    const n = projects.length, a = (i - (n - 1) / 2) * 0.62, R = 6.6;
    const k = new THREE.Group(); k.position.set(Math.sin(a) * R, 0, -1 + Math.cos(a) * R * 0.55 + 1.2); k.rotation.y = a * 0.8; ws.add(k);
    mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.5, 8), mat("#4b4f6b"), 0, 0.75, 0, k);
    const scr = mesh(new THREE.BoxGeometry(1.9, 1.25, 0.16), mat(["#ffb21e", "#3d7bff", "#35c46a", "#ff5d8f", "#a35cff"][i % 5]), 0, 1.95, 0, k); scr.rotation.x = -0.2;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 1.08), new THREE.MeshBasicMaterial({ map: textTexture([p.title, p.year], { w: 384, h: 240, font: 44, sub: 26, emoji: ICONS[p.icon] || "✨" }) }));
    face.position.set(0, 0, 0.09); scr.add(face);
    collide(ws, k.position.x, k.position.z, 0.7);
    clickables.push({ obj: k, kind: "project", data: p });
  });
  anchors.workshop = new THREE.Vector3(); ws.updateMatrixWorld(true); anchors.workshop.copy(toWorld(ws, 0, -3.5)).setY(8.4);

  /* ---------- SKILL GARDEN (a circuit-board garden) ---------- */
  const gd = zoneGroup(ZONES[2]);
  mesh(new THREE.BoxGeometry(9, 0.5, 7), mat("#2d6a4a"), 0, 0.25, -2.6, gd);
  const pinM = mat("#ffd23f", { smooth: true });
  for (let i = 0; i < 9; i++) { mesh(new THREE.BoxGeometry(0.35, 0.18, 0.9), pinM, -4 + i, 0.12, -6.4, gd, false); mesh(new THREE.BoxGeometry(0.35, 0.18, 0.9), pinM, -4 + i, 0.12, 1.2, gd, false); }
  for (let i = 0; i < 7; i++) { mesh(new THREE.BoxGeometry(0.9, 0.18, 0.35), pinM, -4.9, 0.12, -5.6 + i, gd, false); mesh(new THREE.BoxGeometry(0.9, 0.18, 0.35), pinM, 4.9, 0.12, -5.6 + i, gd, false); }
  for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(i % 2 ? 6 : 0.12, 0.02, i % 2 ? 0.12 : 5), mat("#7ff0b0", { smooth: true }), -1.5 + (i % 3), 0.51, -2.6 + (i % 2 ? i - 3 : 0), gd, false);
  const skills = ((window.SITE && window.SITE.bench && window.SITE.bench.skills) || []).slice(0, 6);
  const bloomCols = ["#ff5d8f", "#ffd23f", "#3d7bff", "#a35cff", "#ff6a3d", "#20c5c5"];
  const plants = [];
  skills.forEach((s, i) => {
    const x = -3 + (i % 3) * 3, z = -4.3 + Math.floor(i / 3) * 3.2, h = 1.2 + Math.min(7, (s.items || []).length) * 0.35;
    const p = new THREE.Group(); p.position.set(x, 0.5, z); gd.add(p);
    mesh(new THREE.CylinderGeometry(0.08, 0.12, h, 6), mat("#2f9e4f"), 0, h / 2, 0, p);
    for (let l = 0; l < 3; l++) { const leaf = mesh(new THREE.SphereGeometry(0.32, 8, 6), mat("#47c463"), 0, h * (0.3 + l * 0.2), 0, p); leaf.scale.set(1.4, 0.3, 0.7); leaf.position.x = l % 2 ? 0.35 : -0.35; leaf.rotation.z = l % 2 ? -0.5 : 0.5; }
    const bloom = mesh(new THREE.IcosahedronGeometry(0.55, 0), mat(bloomCols[i % 6]), 0, h + 0.4, 0, p);
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(s.group, { w: 320, h: 100, font: 40, bg: "#ffffff" }), depthWrite: false })); tag.scale.set(2.2, 0.7, 1); tag.position.y = h + 1.5; p.add(tag);
    plants.push({ p, bloom, h, phase: i });
    clickables.push({ obj: p, kind: "skill", data: s });
  });
  const greenhouse = mesh(new THREE.BoxGeometry(9.2, 5.6, 7.2), new THREE.MeshLambertMaterial({ color: 0xbff7ff, transparent: true, opacity: 0.16, depthWrite: false }), 0, 3.1, -2.6, gd, false);
  greenhouse.receiveShadow = false;
  const frameM = mat("#ffffff");
  [[-4.6, -6.2], [4.6, -6.2], [-4.6, 1], [4.6, 1]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(0.16, 5.6, 0.16), frameM, x, 3.1, z, gd));
  [-6.2, 1].forEach((z) => mesh(new THREE.BoxGeometry(9.3, 0.16, 0.16), frameM, 0, 5.9, z, gd));
  [-4.6, 4.6].forEach((x) => mesh(new THREE.BoxGeometry(0.16, 0.16, 7.3), frameM, x, 5.9, -2.6, gd));
  sign(gd, "SKILL GARDEN", "watch them grow", "#35c46a", 0, 6.9, 1.05, 5.2, 1.4);
  collide(gd, 0, -2.6, 5.4); collide(gd, -3, -2.6, 4.2); collide(gd, 3, -2.6, 4.2);
  anchors.garden = toWorld(gd, 0, -2.6).setY(9.4);
  updaters.push((dt, t) => plants.forEach((pl) => { pl.bloom.rotation.y += dt * 0.6; pl.bloom.position.y = pl.h + 0.4 + Math.sin(t * 2 + pl.phase) * 0.1; pl.p.rotation.z = Math.sin(t * 1.3 + pl.phase) * 0.04; }));

  /* ---------- CAN BUS STOP + the bus ---------- */
  const bs = zoneGroup(ZONES[3]);
  [[-2, -2.5], [2, -2.5]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(0.18, 3, 0.18), mat("#3d7bff"), x, 1.5, z, bs));
  mesh(new THREE.BoxGeometry(5, 0.22, 2.4), mat("#3d7bff"), 0, 3.05, -2, bs);
  mesh(new THREE.BoxGeometry(4.6, 2.4, 0.08), new THREE.MeshLambertMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.45 }), 0, 1.6, -3.1, bs, false);
  mesh(new THREE.BoxGeometry(3.4, 0.16, 0.7), mat("#ffb21e"), 0, 0.62, -2.7, bs);
  const pole = mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8), mat("#4b4f6b"), 3.2, 1.8, -1, bs);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ map: textTexture("🚌", { w: 128, h: 128, font: 80, bg: "#3d7bff" }) })); disk.position.set(3.2, 3.5, -0.92); bs.add(disk);
  sign(bs, "CAN BUS STOP", "rides every minute", "#3d7bff", 0, 4.3, -2.1, 4.4, 1.2);
  collide(bs, 0, -2.5, 2.8); collide(bs, 3.2, -1, 0.5);
  anchors.busstop = toWorld(bs, 0, -2).setY(6.8);
  // the bus
  const bus = new THREE.Group(); scene.add(bus);
  const busBody = new THREE.Group(); bus.add(busBody);
  mesh(new THREE.BoxGeometry(2.4, 2.1, 5.6), mat("#3d7bff"), 0, 1.55, 0, busBody);
  mesh(new THREE.BoxGeometry(2.42, 0.7, 5.0), windowMat, 0, 2.05, -0.1, busBody, false);
  mesh(new THREE.BoxGeometry(2.3, 0.25, 5.4), mat("#ffffff"), 0, 2.72, 0, busBody);
  [-1, 1].forEach((s) => { const side = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.6), new THREE.MeshBasicMaterial({ map: textTexture("CAN BUS", { w: 512, h: 90, font: 62, bg: "#3d7bff", fg: "#ffffff" }), transparent: false })); side.position.set(s * 1.215, 1.05, 0); side.rotation.y = s * Math.PI / 2; busBody.add(side); });
  [[-1.1, 1.8], [1.1, 1.8], [-1.1, -1.8], [1.1, -1.8]].forEach(([x, z]) => { const w = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.4, 14), mat("#22223a"), x, 0.5, z, bus); w.rotation.z = Math.PI / 2; });
  [-0.7, 0.7].forEach((x) => mesh(new THREE.SphereGeometry(0.16, 8, 6), lampMat, x, 1.0, 2.81, busBody, false));
  bus.add(blobShadow(3.4)); bus.children[bus.children.length - 1].scale.set(2.2, 4, 1);
  const busStopAngle = Math.atan2(ZONES[3].pos[1], ZONES[3].pos[0]);
  const busState = { a: busStopAngle + 0.4, speed: 0.11, riding: false, rideStart: 0 };
  const busPos = (a) => new THREE.Vector3(Math.cos(a) * ROAD, 0, Math.sin(a) * ROAD);
  updaters.push((dt, t) => {
    busState.a += dt * busState.speed * (busState.riding ? 1.9 : 1);
    const p = busPos(busState.a); bus.position.copy(p); bus.rotation.y = -busState.a; busBody.position.y = Math.abs(Math.sin(t * 9)) * 0.05;
  });

  /* ---------- ARCADE ---------- */
  const ar = zoneGroup(ZONES[4]);
  mesh(new THREE.BoxGeometry(8, 4.6, 6), mat("#6b3df0"), 0, 2.3, -3.6, ar);
  mesh(new THREE.BoxGeometry(8.4, 0.5, 6.4), mat("#ff2d95"), 0, 4.85, -3.6, ar);
  mesh(new THREE.BoxGeometry(2.2, 3, 0.1), mat("#1b1240"), 0, 1.5, -0.55, ar, false);
  const neonTex = textTexture("ARCADE", { w: 512, h: 160, font: 96, bg: "#1b1240", fg: "#7ff8ff" });
  const neon = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, map: neonTex, emissiveMap: neonTex }); neonMats.push(neon);
  mesh(new THREE.BoxGeometry(5.6, 1.6, 0.2), neon, 0, 6.0, -0.9, ar, false);
  const cabCols = ["#ff2d95", "#3ef2ff", "#ffd23f"];
  [-2.8, 2.8].forEach((x, i) => {
    const c = new THREE.Group(); c.position.set(x, 0, 1.4); c.rotation.y = x < 0 ? 0.3 : -0.3; ar.add(c);
    mesh(new THREE.BoxGeometry(1.2, 2.3, 1), mat(cabCols[i]), 0, 1.15, 0, c);
    const sm = new THREE.MeshLambertMaterial({ color: 0x111133, emissive: i ? 0x35ff8a : 0xff5d8f, emissiveIntensity: 0.7 }); neonMats.push(sm);
    const scr = mesh(new THREE.BoxGeometry(0.9, 0.7, 0.06), sm, 0, 1.75, 0.52, c, false); scr.rotation.x = -0.25;
    mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), mat("#22223a"), 0, 1.18, 0.6, c);
    collide(ar, x, 1.4, 0.9);
    clickables.push({ obj: c, kind: "game", data: i ? "bits" : "packets" });
  });
  collide(ar, 0, -3.6, 4.8); collide(ar, -2.8, -3.6, 3.4); collide(ar, 2.8, -3.6, 3.4);
  anchors.arcade = toWorld(ar, 0, -3.6).setY(8.8);

  /* ---------- VYOM'S HOUSE ---------- */
  const hs = zoneGroup(ZONES[5]);
  mesh(new THREE.BoxGeometry(6.4, 3.2, 5.2), mat("#fff3e0"), 0, 1.6, -3.2, hs);
  const roofH = mesh(new THREE.CylinderGeometry(3.9, 3.9, 6.9, 3, 1), mat("#ff5d8f"), 0, 4.25, -3.2, hs);
  roofH.rotation.order = "YXZ"; roofH.rotation.set(-Math.PI / 2, Math.PI / 2, 0); roofH.scale.set(1, 1, 0.55);
  mesh(new THREE.BoxGeometry(1.2, 2, 0.12), mat("#8a5a3b"), 0, 1, -0.55, hs, false);
  mesh(new THREE.SphereGeometry(0.08, 6, 4), mat("#ffd23f"), 0.4, 1, -0.45, hs, false);
  [-2, 2].forEach((x) => { mesh(new THREE.BoxGeometry(1.1, 1.1, 0.1), windowMat, x, 1.7, -0.55, hs, false); mesh(new THREE.BoxGeometry(1.3, 0.12, 0.25), mat("#ffffff"), x, 1.1, -0.5, hs, false); });
  const chim = mesh(new THREE.BoxGeometry(0.8, 2, 0.8), mat("#c9674a"), 1.8, 5, -4, hs);
  const smoke = [0, 1, 2, 3].map(() => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); hs.add(s); return s; });
  const mailbox = mesh(new THREE.BoxGeometry(0.5, 0.4, 0.7), mat("#3d7bff"), 3.6, 1.2, 0.4, hs); mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 6), mat("#4b4f6b"), 3.6, 0.5, 0.4, hs);
  // garden fence
  for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), mat("#ffffff"), -4 + i, 0.45, 0.9, hs).position.x = i < 4 ? -4.4 + i * 0.7 : 1.9 + (i - 4) * 0.7;
  sign(hs, "VYOM'S HOUSE", "", "#ff5d8f", 0, 2.75, -0.5, 3.2, 0.6);
  collide(hs, 0, -3.2, 4.2); collide(hs, -2.2, -3.2, 3); collide(hs, 2.2, -3.2, 3);
  anchors.house = toWorld(hs, 0, -3.2).setY(8.6);
  updaters.push((dt, t) => smoke.forEach((s, i) => { const k = (t * 0.25 + i / 4) % 1; s.position.set(1.8 + Math.sin(k * 6 + i) * 0.3, 6.1 + k * 3.4, -4 - k * 0.6); s.scale.setScalar(0.5 + k * 1.4); s.material.opacity = (1 - k) * 0.75; }));

  /* ---------- POST OFFICE ---------- */
  const po = zoneGroup(ZONES[6]);
  mesh(new THREE.BoxGeometry(7, 3.6, 5.4), mat("#ffffff"), 0, 1.8, -3.4, po);
  mesh(new THREE.BoxGeometry(7.6, 0.6, 6), mat("#ff3b3b"), 0, 3.9, -3.4, po);
  mesh(new THREE.BoxGeometry(5.6, 0.6, 4.6), mat("#ff3b3b"), 0, 4.5, -3.4, po);
  mesh(new THREE.BoxGeometry(1.6, 2.4, 0.1), mat("#2b3b8f"), 0, 1.2, -0.65, po, false);
  [-2.4, 2.4].forEach((x) => mesh(new THREE.BoxGeometry(1.2, 1.1, 0.1), windowMat, x, 2, -0.66, po, false));
  sign(po, "POST OFFICE", "say hello", "#ff3b3b", 0, 5.9, -1.2, 4.6, 1.3);
  const mb = new THREE.Group(); mb.position.set(3.6, 0, 1.6); po.add(mb);
  mesh(new THREE.BoxGeometry(1.3, 2, 1.1), mat("#ff3b3b"), 0, 1, 0, mb);
  const mbTop = mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.3, 16, 1, false, 0, Math.PI), mat("#ff3b3b"), 0, 2, 0, mb); mbTop.rotation.z = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.8, 0.1, 0.06), mat("#1b1240"), 0, 1.6, 0.56, mb, false);
  collide(po, 3.6, 1.6, 1); collide(po, 0, -3.4, 4.4); collide(po, -2.4, -3.4, 3.2); collide(po, 2.4, -3.4, 3.2);
  clickables.push({ obj: mb, kind: "letter" });
  anchors.post = toWorld(po, 0, -3.4).setY(8.4);

  /* ---------- trees, bushes, flowers, rocks ---------- */
  const okSpot = (x, z, pad) => {
    const a = Math.atan2(z, x), d = Math.hypot(x, z);
    if (d > islandR(a) - 2.5 || d < 15.5) return false;
    if (ZONES.some((zz) => Math.hypot(x - zz.pos[0], z - zz.pos[1]) < zz.r + 3)) return false;
    if (nearPath(x, z, pad)) return false;
    return true;
  };
  const place = (n, pad, tries = 30) => { const out = []; for (let i = 0; i < n; i++) for (let k = 0; k < tries; k++) { const a = rand() * Math.PI * 2, d = 10 + Math.sqrt(rand()) * 36, x = Math.cos(a) * d, z = Math.sin(a) * d; if (okSpot(x, z, pad) && !out.some((o) => (o.x - x) ** 2 + (o.z - z) ** 2 < 4.5)) { out.push({ x, z, s: 0.75 + rand() * 0.6, r: rand() * 6.28 }); break; } } return out; };
  const nTrees = tier === "low" ? 70 : 120;
  const spots = place(nTrees, 2.4);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.32, 1.8, 6), mat("#9a6a43"), spots.length);
  const rounds = spots.filter((_, i) => i % 3 !== 0), pines = spots.filter((_, i) => i % 3 === 0);
  const roundM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5, 0), new THREE.MeshLambertMaterial({ flatShading: true }), rounds.length * 2);
  const pineM = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 2.6, 7), new THREE.MeshLambertMaterial({ flatShading: true }), pines.length * 2);
  const greens = ["#3fbf5a", "#55d36b", "#2fa64e", "#7fdc5c", "#9be36a"], pinks = ["#ff9cc2", "#ffc4dd"];
  spots.forEach((s, i) => { q.setFromAxisAngle(up, s.r); m4.compose(new THREE.Vector3(s.x, 0.9 * s.s, s.z), q, new THREE.Vector3(s.s, s.s, s.s)); trunks.setMatrixAt(i, m4); colliders.push({ x: s.x, z: s.z, r: 0.7 * s.s }); });
  rounds.forEach((s, i) => { const blossom = rand() < 0.14;
    q.setFromAxisAngle(up, s.r); m4.compose(new THREE.Vector3(s.x, 2.6 * s.s, s.z), q, new THREE.Vector3(s.s, s.s * 0.95, s.s)); roundM.setMatrixAt(i * 2, m4); roundM.setColorAt(i * 2, col.setStyle(blossom ? pick(pinks) : pick(greens)));
    m4.compose(new THREE.Vector3(s.x + 0.5 * s.s, 3.6 * s.s, s.z - 0.3 * s.s), q, new THREE.Vector3(s.s * 0.62, s.s * 0.6, s.s * 0.62)); roundM.setMatrixAt(i * 2 + 1, m4); roundM.setColorAt(i * 2 + 1, col.setStyle(blossom ? pick(pinks) : pick(greens))); });
  pines.forEach((s, i) => { q.setFromAxisAngle(up, s.r);
    m4.compose(new THREE.Vector3(s.x, 2.5 * s.s, s.z), q, new THREE.Vector3(s.s, s.s, s.s)); pineM.setMatrixAt(i * 2, m4); pineM.setColorAt(i * 2, col.setStyle("#2f9e6a"));
    m4.compose(new THREE.Vector3(s.x, 3.7 * s.s, s.z), q, new THREE.Vector3(s.s * 0.72, s.s * 0.8, s.s * 0.72)); pineM.setMatrixAt(i * 2 + 1, m4); pineM.setColorAt(i * 2 + 1, col.setStyle("#3fb57a")); });
  [trunks, roundM, pineM].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  const bushSpots = place(tier === "low" ? 40 : 70, 1.6);
  const bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.75, 0), new THREE.MeshLambertMaterial({ flatShading: true }), bushSpots.length);
  bushSpots.forEach((s, i) => { q.setFromAxisAngle(up, s.r); m4.compose(new THREE.Vector3(s.x, 0.45 * s.s, s.z), q, new THREE.Vector3(s.s * 1.2, s.s * 0.85, s.s * 1.2)); bushes.setMatrixAt(i, m4); bushes.setColorAt(i, col.setStyle(pick(greens))); });
  bushes.castShadow = true; scene.add(bushes);
  const flowerN = tier === "low" ? 120 : 260, flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.17, 0), new THREE.MeshLambertMaterial({ flatShading: true }), flowerN);
  const fc = ["#ff5d8f", "#ffd23f", "#ffffff", "#a35cff", "#ff6a3d", "#5ec4ff"];
  for (let i = 0; i < flowerN; i++) { let x = 0, z = 0; for (let k = 0; k < 20; k++) { const a = rand() * 6.28, d = 9 + Math.sqrt(rand()) * 37; x = Math.cos(a) * d; z = Math.sin(a) * d; if (d < islandR(a) - 1.5 && !nearPath(x, z, 1.4) && !ZONES.some((zz) => Math.hypot(x - zz.pos[0], z - zz.pos[1]) < zz.r)) break; }
    m4.compose(new THREE.Vector3(x, 0.18, z), q.identity(), new THREE.Vector3(1, 1, 1)); flowers.setMatrixAt(i, m4); flowers.setColorAt(i, col.setStyle(fc[i % fc.length])); }
  scene.add(flowers);
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.8, 0), new THREE.MeshLambertMaterial({ flatShading: true, color: 0xa7a3b8 }), 26);
  for (let i = 0; i < 26; i++) { const a = rand() * 6.28, d = islandR(a) + 2 + rand() * 3; q.setFromAxisAngle(up, rand() * 6); const s = 0.5 + rand() * 1.1; m4.compose(new THREE.Vector3(Math.cos(a) * d, -0.5, Math.sin(a) * d), q, new THREE.Vector3(s, s * 0.7, s)); rocks.setMatrixAt(i, m4); }
  rocks.castShadow = true; scene.add(rocks);

  /* ---------- lamps along the paths ---------- */
  const lampSpots = [];
  paths.forEach((ps) => { for (let i = 8; i < ps.length - 4; i += 12) { const p = ps[i], n = ps[i + 1]; const tx = n.x - p.x, tz = n.z - p.z, l = Math.hypot(tx, tz) || 1; lampSpots.push([p.x - tz / l * 1.8, p.z + tx / l * 1.8]); } });
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), mat("#3a3f63"), lampSpots.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 10, 8), lampMat, lampSpots.length);
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,220,140,1)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  lampSpots.forEach(([x, z], i) => { m4.compose(new THREE.Vector3(x, 1.5, z), q.identity(), new THREE.Vector3(1, 1, 1)); poles.setMatrixAt(i, m4); m4.compose(new THREE.Vector3(x, 3.1, z), q, new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(i, m4); const g = new THREE.Sprite(glowMat); g.position.set(x, 3.1, z); g.scale.setScalar(4); scene.add(g); colliders.push({ x, z, r: 0.35 }); });
  poles.castShadow = true; scene.add(poles, heads);
  nightMats.push((k) => (glowMat.opacity = k * 0.9));

  /* ---------- clouds, birds, fireflies ---------- */
  const clouds = [];
  const cloudM = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0.25 });
  for (let i = 0; i < (tier === "low" ? 7 : 12); i++) {
    const c = new THREE.Group(); const n = 3 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + rand() * 2.2, 0), cloudM); b.position.set(k * 2.6 - n * 1.2, rand() * 1.2, rand() * 1.5); b.scale.y = 0.7; c.add(b); }
    const a = rand() * 6.28, d = 30 + rand() * 70; c.position.set(Math.cos(a) * d, 24 + rand() * 16, Math.sin(a) * d); c.userData.v = 0.6 + rand() * 0.8; scene.add(c); clouds.push(c);
  }
  updaters.push((dt) => clouds.forEach((c) => { c.position.x += dt * c.userData.v; if (c.position.x > 120) c.position.x = -120; }));
  const FF = tier === "low" ? 60 : 140, ffPos = new Float32Array(FF * 3), ffSeed = [];
  for (let i = 0; i < FF; i++) { const a = rand() * 6.28, d = 10 + rand() * 32; ffPos.set([Math.cos(a) * d, 0.6 + rand() * 3, Math.sin(a) * d], i * 3); ffSeed.push(rand() * 10); }
  const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
  const ffMat = new THREE.PointsMaterial({ color: 0xfff3a0, size: 0.35, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const ff = new THREE.Points(ffGeo, ffMat); scene.add(ff);
  updaters.push((dt, t) => { if (night.k < 0.05) return; const p = ffGeo.attributes.position.array; for (let i = 0; i < FF; i++) { p[i * 3] += Math.sin(t * 0.7 + ffSeed[i]) * dt * 0.6; p[i * 3 + 1] += Math.cos(t * 1.1 + ffSeed[i]) * dt * 0.3; p[i * 3 + 2] += Math.cos(t * 0.6 + ffSeed[i] * 2) * dt * 0.6; } ffGeo.attributes.position.needsUpdate = true; ffMat.opacity = night.k * (0.65 + 0.35 * Math.sin(t * 3)); });

  /* ---------- day / night ---------- */
  const DAY = { top: new THREE.Color("#4fb6ff"), bot: new THREE.Color("#d9f6ff"), hemiS: new THREE.Color("#dff4ff"), hemiG: new THREE.Color("#6fbf5a"), sun: new THREE.Color("#fff1d6"), deep: new THREE.Color("#1f9fd6"), shallow: new THREE.Color("#6fe3f0"), fog: new THREE.Color("#cdefff") };
  const NIGHT = { top: new THREE.Color("#0a0f3a"), bot: new THREE.Color("#3b2f86"), hemiS: new THREE.Color("#6a74d8"), hemiG: new THREE.Color("#33457a"), sun: new THREE.Color("#a9b6ff"), deep: new THREE.Color("#0c2a66"), shallow: new THREE.Color("#2b6fae"), fog: new THREE.Color("#2b2a6e") };
  const setNight = (k) => {
    night.k = k;
    skyU.uTop.value.copy(DAY.top).lerp(NIGHT.top, k); skyU.uBot.value.copy(DAY.bot).lerp(NIGHT.bot, k); skyU.uNight.value = k;
    hemi.color.copy(DAY.hemiS).lerp(NIGHT.hemiS, k); hemi.groundColor.copy(DAY.hemiG).lerp(NIGHT.hemiG, k); hemi.intensity = 1.15 - k * 0.4;
    sun.color.copy(DAY.sun).lerp(NIGHT.sun, k); sun.intensity = 1.9 - k * 1.45;
    seaU.uDeep.value.copy(DAY.deep).lerp(NIGHT.deep, k); seaU.uShallow.value.copy(DAY.shallow).lerp(NIGHT.shallow, k); seaU.uFar.value.copy(DAY.fog).lerp(NIGHT.fog, k); seaU.uNight.value = k;
    scene.fog.color.copy(DAY.fog).lerp(NIGHT.fog, k);
    sunBall.material.opacity = 1 - k; sunBall.material.transparent = true; moon.material.opacity = k;
    cloudM.emissiveIntensity = 0.25 - k * 0.2;
    nightMats.forEach((f) => f(k));
    renderer.shadowMap.needsUpdate = true;
  };

  return {
    scene, colliders, anchors, clickables, sun, bus, busState, busPos, busStopAngle, tower, beacon,
    setNight, night,
    update(dt, t) { skyU.uTime.value = t; seaU.uTime.value = t; updaters.forEach((f) => f(dt, t)); },
    /* where a zone's character stands, where a visitor stands to talk, and which way they face */
    npcSpot(z) { const g = new THREE.Group(); g.position.set(z.pos[0], 0, z.pos[1]); g.rotation.y = z.id === "plaza" ? 0 : Math.atan2(-z.pos[0], -z.pos[1]); g.updateMatrixWorld(true); const [x, zz] = z.npc.at; return { pos: new THREE.Vector3(x, 0, zz).applyMatrix4(g.matrixWorld), stand: new THREE.Vector3(x, 0, zz + 2.6).applyMatrix4(g.matrixWorld), face: g.rotation.y }; },
  };
}
