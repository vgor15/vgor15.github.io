/* MEMORY VAULT (/work): an impossible archive.
   An endless corridor of hexagonal gates spiralling away from the camera.
   Each project is a memory cell: a translucent crystal holding a slow
   pulse of light. Scrolling the page flies the camera down the corridor;
   hovering a project card wakes its cell. */
import { voidScene } from "./void.js";

export function vaultScene(engine) {
  const { THREE, camera, tier } = engine;
  const base = voidScene(engine);
  const root = base.root;
  const world = new THREE.Group(); root.add(world);
  const projects = ((window.SITE && window.SITE.work) || []).filter((w) => !w.hidden);
  const N = Math.max(projects.length, 3), GAP = 14, LEN = GAP * (N + 2);

  /* gates: hexagonal rings rotating against each other, an impossible twist */
  const gateMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFocus: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.); }`,
    fragmentShader: `uniform float uTime; uniform float uFocus; varying vec3 vP;
      void main(){ float flow = .5 + .5 * sin(vP.z * .35 + uTime * 1.6 + atan(vP.y, vP.x) * 3.);
        vec3 col = mix(vec3(.35, .22, .9), vec3(.2, .9, 1.), flow); float fade = smoothstep(-${LEN.toFixed(1)}, 0., vP.z);
        gl_FragColor = vec4(col, (.18 + .35 * flow) * (.35 + .65 * fade)); }` });
  const gates = [];
  const GATES = Math.round((tier === "low" ? 1.5 : 3) * (N + 2));
  for (let i = 0; i < GATES; i++) {
    const g = new THREE.Mesh(new THREE.TorusGeometry(9 + (i % 3) * .6, .05 + (i % 4 === 0 ? .06 : 0), 6, 6), gateMat);
    g.position.z = -i * (LEN / GATES); g.rotation.z = i * .21;
    world.add(g); gates.push(g);
  }

  /* memory cells: one crystal per project, alternating sides of the corridor */
  const cells = projects.map((p, i) => {
    const side = i % 2 ? 1 : -1, z = -(i + 1) * GAP;
    const grp = new THREE.Group(); grp.position.set(side * 4.6, (i % 3 - 1) * 1.4, z);
    const shell = new THREE.Mesh(new THREE.OctahedronGeometry(1.7, 0), new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uOn: { value: 0 }, uSeed: { value: i * 1.7 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalMatrix * normal; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uTime; uniform float uOn; uniform float uSeed; varying vec3 vN; varying vec3 vV;
        void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.8); float pulse = .5 + .5 * sin(uTime * 2. + uSeed);
          vec3 col = mix(vec3(.5, .35, 1.), vec3(.25, .95, 1.), f) * (f * 1.1 + pulse * .12) + vec3(1., .72, .3) * uOn * f * .8;
          gl_FragColor = vec4(col, f * .85 + .06 + uOn * .2); }` }));
    const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 1), new THREE.MeshBasicMaterial({ color: 0x9ff8ff, transparent: true, opacity: .9 }));
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(2.3, 0)), new THREE.LineBasicMaterial({ color: 0x3ef2ff, transparent: true, opacity: .25 }));
    grp.add(shell, heart, wire); world.add(grp);
    return { grp, shell, heart, wire, on: 0, target: 0 };
  });

  /* data streams: particles flowing down the corridor */
  const S = tier === "low" ? 500 : 1400, sp = new Float32Array(S * 3), sv = new Float32Array(S);
  for (let i = 0; i < S; i++) { const a = Math.random() * 6.283, r = 6 + Math.random() * 3; sp.set([Math.cos(a) * r, Math.sin(a) * r, -Math.random() * LEN], i * 3); sv[i] = .5 + Math.random(); }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const sMat = new THREE.PointsMaterial({ color: 0x8b5cff, size: .08, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false });
  const stream = new THREE.Points(sGeo, sMat); world.add(stream);

  /* hovering a project card wakes its cell */
  const onHover = (e) => { const card = e.target.closest && e.target.closest(".js-work article"); const idx = card ? [...card.parentElement.children].indexOf(card) : -1; cells.forEach((c, i) => (c.target = i === idx ? 1 : 0)); };
  document.addEventListener("pointerover", onHover);

  let camZ = 6;
  return {
    root,
    resize: base.resize,
    update(dt, s) {
      base.update(dt, s);
      gateMat.uniforms.uTime.value = s.time;
      gates.forEach((g, i) => (g.rotation.z += dt * (i % 2 ? .05 : -.04)));
      cells.forEach((c, i) => {
        c.on += (c.target - c.on) * Math.min(1, dt * 4);
        c.shell.material.uniforms.uTime.value = s.time; c.shell.material.uniforms.uOn.value = c.on;
        c.grp.rotation.y += dt * (.25 + c.on); c.grp.rotation.x = Math.sin(s.time * .4 + i) * .2;
        c.heart.scale.setScalar(1 + .15 * Math.sin(s.time * 3 + i) + c.on * .6);
        c.wire.material.opacity = .2 + c.on * .5;
      });
      const pos = sGeo.attributes.position.array;
      for (let i = 0; i < S; i++) { pos[i * 3 + 2] += dt * sv[i] * 6; if (pos[i * 3 + 2] > 8) pos[i * 3 + 2] -= LEN; }
      sGeo.attributes.position.needsUpdate = true;
      const target = 6 - s.scroll * (LEN - GAP * 1.5);
      camZ += (target - camZ) * Math.min(1, dt * 2.5);
      camera.position.set(s.pointer.x * 1.2, s.pointer.y * .8, camZ);
      camera.lookAt(s.pointer.x * 2, s.pointer.y * 1.2, camZ - 20);
    },
    dispose() { document.removeEventListener("pointerover", onHover); camera.position.set(0, 0, 30); camera.lookAt(0, 0, 0); base.dispose(); world.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose(); }); },
  };
}
