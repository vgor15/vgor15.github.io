/* ============================================================
   VYOM GOR: board.js, drive the site from the CAN board
   The HTML buttons are the real controls (keyboard and screen-reader
   friendly); the 3D board mirrors them and is clickable too.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  "use strict";
  const V = window.V, D = document;
  const PAGES = { 1: ["ABOUT", "/about"], 2: ["LAB", "/lab"], 3: ["WRITING", "/writing"], 4: ["BENCH", "/bench"], 5: ["CONTACT", "/contact"], 6: ["RESUME", "/resume"], 7: ["NOW", "/now"], 8: ["NOTES", "/notes"], 9: ["HOME", "/"], 10: ["LOG", "/changelog"] };
  const codes = Object.keys(PAGES).map(Number);
  let code = 1, sending = false;
  const l1 = V.qs(".js-l1"), l2 = V.qs(".js-l2"), dips = V.qsa(".dip");
  const bin = (n) => n.toString(2).padStart(4, "0");
  let onChange = () => {};
  const render = () => {
    const p = PAGES[code];
    l1.textContent = p ? `> ${p[0]}` : code === 0 ? "> ALL OFF" : "> EMPTY";
    l2.textContent = `SW ${bin(code)} · ${p ? p[1] : "try another"}`;
    dips.forEach((b) => b.setAttribute("aria-pressed", String(!!(code & (1 << +b.dataset.bit)))));
    onChange();
  };
  const flip = (bit) => { code ^= 1 << bit; V.sfx && V.sfx("click"); render(); };
  const turn = (dir) => { const i = codes.indexOf(code); code = i < 0 ? codes[0] : codes[(i + dir + codes.length) % codes.length]; V.sfx && V.sfx("tick"); render(); };
  const send = () => {
    const p = PAGES[code]; if (!p || sending) { V.toast && V.toast("Nothing there", "Try another switch combination."); return; }
    sending = true; l1.textContent = "> SENDING..."; l2.textContent = "OK · going to " + p[0]; V.sfx && V.sfx("relay");
    setTimeout(() => V.navigate(p[1]), 650);
  };
  dips.forEach((b) => b.addEventListener("click", () => flip(+b.dataset.bit)));
  V.qs(".js-prev").addEventListener("click", () => turn(-1));
  V.qs(".js-next").addEventListener("click", () => turn(1));
  V.qs(".js-send").addEventListener("click", send);
  D.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA/.test(D.activeElement.tagName)) return;
    if (e.key === "ArrowLeft") turn(-1); else if (e.key === "ArrowRight") turn(1);
    else if (e.key === "Enter" && !D.activeElement.closest("button,a")) send();
    else if ("1234".includes(e.key)) flip(4 - +e.key);
  });
  render();

  /* ---------- 3D mirror ---------- */
  const cv = V.qs(".boardpg__cv");
  if (!window.THREE || !cv) return;
  let R;
  try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); } catch (e) { return; }
  R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); R.setClearColor(0x0b0d0c, 1);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x101410, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(4, 10, 6); scene.add(sun);
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const box = (w, h, d, m, x, y, z, parent = scene) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; };
  box(12, 0.3, 7, mat(0x0f2a1c), 0, -0.15, 0);
  const gold = mat(0xc9a24a, { metalness: 0.85, roughness: 0.3 });
  [[-5, -2.4, 10], [-5, 2.6, 10], [-5, 0, 3]].forEach(([x, z, w]) => box(w, 0.02, 0.08, gold, x + w / 2, 0.02, z));
  box(2.6, 0.32, 2.6, mat(0x151515), -3.4, 0.16, -0.6);
  const lcdC = D.createElement("canvas"); lcdC.width = 512; lcdC.height = 160;
  const lcdT = new THREE.CanvasTexture(lcdC); lcdT.colorSpace = THREE.SRGBColorSpace;
  box(5, 0.3, 1.9, mat(0x151515), 1.8, 0.15, -1.6);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.4), new THREE.MeshBasicMaterial({ map: lcdT })); face.rotation.x = -Math.PI / 2; face.position.set(1.8, 0.31, -1.6); scene.add(face);
  const levers = [0, 1, 2, 3].map((i) => { box(0.6, 0.3, 1, mat(0x2a4fb5), -0.9 + i * 0.75, 0.15, 1.7); const l = box(0.3, 0.2, 0.4, mat(0xf3efe4), -0.9 + i * 0.75, 0.38, 1.7); l.userData.bit = 3 - i; return l; });
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.45, 32), mat(0x222222, { metalness: 0.4 })); knob.position.set(2.6, 0.25, 1.7); scene.add(knob);
  box(0.08, 0.05, 0.35, mat(0xd9bc72), 0, 0.25, -0.2, knob);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 24), mat(0xc2563a)); btn.position.set(4.3, 0.2, 1.7); scene.add(btn);
  onChange = () => {
    const g = lcdC.getContext("2d"); g.fillStyle = "#9fd24a"; g.fillRect(0, 0, 512, 160); g.fillStyle = "#1f2a12"; g.font = "700 50px 'Geist Mono', monospace";
    g.fillText(l1.textContent.slice(0, 16), 20, 66); g.font = "600 34px 'Geist Mono', monospace"; g.fillText(l2.textContent.slice(0, 22), 20, 128); lcdT.needsUpdate = true;
    levers.forEach((l) => { l.position.z = 1.7 + ((code >> l.userData.bit) & 1 ? -0.25 : 0.25); });
    knob.rotation.y = -codes.indexOf(code) * 0.6;
  };
  onChange();
  const fit = () => { const w = cv.clientWidth, h = cv.clientHeight; R.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.position.set(0, w < 700 ? 13 : 8.5, w < 700 ? 9 : 7); cam.lookAt(0.4, 0, 0.3); cam.updateProjectionMatrix(); };
  fit(); new ResizeObserver(fit).observe(cv);
  const ray = new THREE.Raycaster();
  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect(); ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, cam);
    const hit = ray.intersectObjects([...levers, knob, btn], true)[0]; if (!hit) return;
    let o = hit.object; while (o.parent && o.parent !== scene) o = o.parent;
    if (levers.includes(o)) flip(o.userData.bit); else if (o === knob) turn(e.clientX > r.left + r.width * 0.5 ? 1 : -1); else if (o === btn) send();
  });
  const loop = (t) => { scene.rotation.y = Math.sin(t / 4000) * 0.04; btn.position.y = sending ? 0.12 : 0.2; R.render(scene, cam); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
