/* SIGNAL: the living core on the home page.
   A procedural organic heart (noise-displaced sphere with fresnel rim and
   fake subsurface glow) breathing at ~0.3 Hz, wrapped in neural filaments
   that carry pulses outward, inside a halo of drifting spores.
   The cursor is a probe: the core leans toward it and its surface ripples there. */
import { voidScene } from "./void.js";

const NOISE = `
vec4 permute(vec4 x){ return mod(((x*34.)+1.)*x, 289.); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - .85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1./6., 1./3.); const vec4 D = vec4(0., .5, 1., 2.);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1. - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + 2. * C.xxx; vec3 x3 = x0 - 1. + 3. * C.xxx;
  i = mod(i, 289.);
  vec4 p = permute(permute(permute(i.z + vec4(0., i1.z, i2.z, 1.)) + i.y + vec4(0., i1.y, i2.y, 1.)) + i.x + vec4(0., i1.x, i2.x, 1.));
  float n_ = 1./7.; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49. * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7. * x_);
  vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1. - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2. + 1.; vec4 s1 = floor(b1) * 2. + 1.; vec4 sh = -step(h, vec4(0.));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.); m = m * m;
  return 42. * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

export function signalScene(engine) {
  const { THREE, cfg, camera, tier } = engine;
  const base = voidScene(engine);
  const root = base.root;
  const core = new THREE.Group(); root.add(core);
  const R = 5.2;

  /* ---- organic core ---- */
  const coreMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uProbe: { value: new THREE.Vector3(0, 0, 10) }, uExcite: { value: 0 } },
    vertexShader: NOISE + `
      uniform float uTime; uniform vec3 uProbe; uniform float uExcite;
      varying vec3 vN; varying vec3 vView; varying float vDisp; varying vec3 vPos;
      void main(){
        vec3 p = position; vec3 n = normalize(normal);
        float breathe = sin(uTime * 1.9) * .5 + .5;
        float d = snoise(n * 1.35 + vec3(0., uTime * .22, uTime * .12)) * .55
                + snoise(n * 3.1 - vec3(uTime * .3)) * .18;
        float probe = smoothstep(1.4, 0., distance(normalize(uProbe), n)) * (.35 + uExcite * .5);
        d += probe * (.6 + .4 * sin(uTime * 7. - distance(normalize(uProbe), n) * 10.));
        d += breathe * .22;
        p += n * d;
        vDisp = d; vN = normalMatrix * n; vec4 mv = modelViewMatrix * vec4(p, 1.); vView = -mv.xyz; vPos = p;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform float uExcite; varying vec3 vN; varying vec3 vView; varying float vDisp; varying vec3 vPos;
      void main(){
        vec3 n = normalize(vN), v = normalize(vView);
        float fres = pow(1. - max(dot(n, v), 0.), 2.4);
        vec3 deep = vec3(.03, .02, .09), violet = vec3(.45, .28, 1.), cyan = vec3(.24, .95, 1.), amber = vec3(1., .71, .28);
        float bands = .5 + .5 * sin(vDisp * 9. + uTime * .8 + vPos.y * 1.4);
        vec3 col = mix(deep, violet * .55, smoothstep(-.2, .9, vDisp));
        col += cyan * fres * (1.1 + uExcite);
        col += violet * pow(bands, 6.) * .35;
        col += amber * pow(max(vDisp - .7, 0.), 2.) * 1.4;   // hot spots, rare
        float alpha = .78 + fres * .22;
        gl_FragColor = vec4(col, alpha);
      }`,
  });
  const detail = tier === "high" ? 96 : tier === "mid" ? 64 : 36;
  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(R, detail), coreMat);
  core.add(sphere);

  // inner glow
  const glow = new THREE.Mesh(new THREE.SphereGeometry(R * 1.9, 32, 32), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalMatrix * normal; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(max(dot(normalize(vN), normalize(vV)), 0.), 3.); gl_FragColor = vec4(vec3(.25, .55, 1.) * f * (.35 + .1 * sin(uTime * 1.9)), f * .55); }`,
  }));
  core.add(glow);

  /* ---- neural filaments ---- */
  const F = Math.round((tier === "high" ? 140 : tier === "mid" ? 90 : 50)), SEG = 40;
  const fPos = new Float32Array(F * SEG * 3), fT = new Float32Array(F * SEG), fSeed = new Float32Array(F * SEG);
  const idx = [];
  const rnd = (() => { let s = 1337; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let f = 0; f < F; f++) {
    const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const len = 6 + rnd() * 14, curl = (rnd() - .5) * 1.6, seed = rnd();
    for (let s = 0; s < SEG; s++) {
      const t = s / (SEG - 1), r = R * .92 + t * len;
      const p = dir.clone().multiplyScalar(r).addScaledVector(side, Math.sin(t * 3.14 * (1 + seed)) * curl * t * 4).add(new THREE.Vector3(0, -t * t * 2.5 * (seed - .5), 0));
      const i = f * SEG + s; fPos.set([p.x, p.y, p.z], i * 3); fT[i] = t; fSeed[i] = seed;
      if (s < SEG - 1) idx.push(i, i + 1);
    }
  }
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3)); fGeo.setAttribute("aT", new THREE.BufferAttribute(fT, 1)); fGeo.setAttribute("aSeed", new THREE.BufferAttribute(fSeed, 1)); fGeo.setIndex(idx);
  const fMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uExcite: { value: 0 } },
    vertexShader: `attribute float aT; attribute float aSeed; uniform float uTime; varying float vT; varying float vSeed;
      void main(){ vT = aT; vSeed = aSeed; vec3 p = position; p += normalize(position) * sin(uTime * 1.9 + aSeed * 6.) * .15 * aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: `uniform float uTime; uniform float uExcite; varying float vT; varying float vSeed;
      void main(){ float head = fract(uTime * (.12 + vSeed * .18) + vSeed);
        float pulse = smoothstep(.06, 0., abs(vT - head)) ;
        float fade = (1. - vT) * .55;
        vec3 col = mix(vec3(.55, .36, 1.), vec3(.25, .95, 1.), vT) * (fade * .35 + pulse * (1.2 + uExcite));
        gl_FragColor = vec4(col, fade * .45 + pulse); }` });
  core.add(new THREE.LineSegments(fGeo, fMat));

  /* ---- spores ---- */
  const S = Math.round(2200 * cfg.particles), sp = new Float32Array(S * 3), ss = new Float32Array(S);
  for (let i = 0; i < S; i++) { const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().multiplyScalar(R * 1.4 + Math.pow(rnd(), 2) * 22); sp.set([v.x, v.y, v.z], i * 3); ss[i] = rnd(); }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3)); sGeo.setAttribute("aS", new THREE.BufferAttribute(ss, 1));
  const sMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uPx: { value: engine.renderer.getPixelRatio() } },
    vertexShader: `attribute float aS; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec3 p = position; float a = uTime * (.02 + aS * .05); p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz; p.y += sin(uTime * .5 + aS * 20.) * .4;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; vA = .35 + .65 * aS; gl_PointSize = uPx * (1. + aS * 2.2) * (40. / -mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(mix(vec3(.6, .45, 1.), vec3(.4, .95, 1.), vA), smoothstep(.5, 0., d) * vA * .7); }` });
  core.add(new THREE.Points(sGeo, sMat));

  /* ---- behaviour ---- */
  const probe = new THREE.Vector3(0, 0, 10), target = new THREE.Vector3();
  let excite = 0;
  addEventListener("pointerdown", () => (excite = 1), { passive: true });
  const small = () => innerWidth < 700;
  return {
    root,
    resize: base.resize,
    update(dt, s) {
      base.update(dt, s);
      excite = Math.max(0, excite - dt * .8);
      target.set(s.pointer.x * 12, s.pointer.y * 8, 8);
      probe.lerp(target, Math.min(1, dt * 3));
      coreMat.uniforms.uTime.value = fMat.uniforms.uTime.value = sMat.uniforms.uTime.value = glow.material.uniforms.uTime.value = s.time;
      coreMat.uniforms.uProbe.value.copy(probe); coreMat.uniforms.uExcite.value = fMat.uniforms.uExcite.value = excite;
      core.rotation.y += dt * .06; core.rotation.x = s.pointer.y * .18; core.rotation.z = -s.pointer.x * .08;
      core.position.set(small() ? 0 : 7, small() ? 5 : 0, 0);
      core.position.y += Math.sin(s.time * .6) * .25;
      camera.position.z = (small() ? 40 : 30) - s.scroll * 8;
    },
    dispose() { base.dispose(); core.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); },
  };
}
