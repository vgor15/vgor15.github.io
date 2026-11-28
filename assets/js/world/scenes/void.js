/* VOID: the deep-space backdrop shared by every environment.
   A dim procedural nebula plus three parallax star layers in bone,
   bio-cyan and synapse violet. Later phases mount their worlds on top. */
export function voidScene(engine) {
  const { THREE, cfg, camera } = engine;
  const root = new THREE.Scene();

  // nebula: one fullscreen quad with fbm noise, drawn behind everything
  const neb = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false, transparent: true,
    uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uAspect: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform float uTime; uniform vec2 uPointer; uniform float uAspect;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * n(p); p *= 2.03; a *= .5; } return v; }
      void main(){
        vec2 p = (vUv - .5) * vec2(uAspect, 1.) * 2.2 + uPointer * .06;
        float t = uTime * .018;
        float a = fbm(p + vec2(t, -t * .6));
        float b = fbm(p * 1.7 - vec2(t * .8, t) + a);
        vec3 violet = vec3(.33, .2, .78), cyan = vec3(.08, .62, .72);
        vec3 col = violet * smoothstep(.45, .95, b) * .22 + cyan * smoothstep(.55, 1., a * b * 1.6) * .16;
        float vig = smoothstep(1.35, .2, length((vUv - .5) * vec2(uAspect, 1.)));
        gl_FragColor = vec4(col * vig, (col.r + col.g + col.b) * vig);
      }`,
  }));
  neb.frustumCulled = false; neb.renderOrder = -10; root.add(neb);

  // stars: three depth layers
  const layers = [];
  const COLORS = [0xe9ecf2, 0x3ef2ff, 0xa98bff];
  [[900, 60, 1.6], [500, 35, 2.2], [180, 18, 3.2]].forEach(([count, depth, size], li) => {
    const n = Math.round(count * cfg.particles), pos = new Float32Array(n * 3), tw = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * depth * 3.2; pos[i * 3 + 1] = (Math.random() - .5) * depth * 2.2; pos[i * 3 + 2] = -depth + Math.random() * 10; tw[i] = Math.random() * 6.283; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aTw", new THREE.BufferAttribute(tw, 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(COLORS[li]) }, uSize: { value: size * engine.renderer.getPixelRatio() } },
      vertexShader: `attribute float aTw; uniform float uTime; uniform float uSize; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; vA = .55 + .45 * sin(uTime * 1.3 + aTw); gl_PointSize = uSize * (90. / -mv.z) * (.7 + .3 * vA); }`,
      fragmentShader: `uniform vec3 uColor; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(uColor, a * vA * .85); }` });
    const pts = new THREE.Points(g, m); root.add(pts); layers.push({ pts, m, depth });
  });

  const look = new THREE.Vector2();
  return {
    root,
    resize(w, h) { neb.material.uniforms.uAspect.value = w / Math.max(1, h); },
    update(dt, s) {
      look.x += (s.pointer.x - look.x) * Math.min(1, dt * 1.5); look.y += (s.pointer.y - look.y) * Math.min(1, dt * 1.5);
      neb.material.uniforms.uTime.value = s.time; neb.material.uniforms.uPointer.value.copy(look);
      layers.forEach((l, i) => { l.m.uniforms.uTime.value = s.time; l.pts.position.x = -look.x * (i + 1) * .9; l.pts.position.y = -look.y * (i + 1) * .6 + s.scroll * (i + 1) * 6; l.pts.rotation.z = s.time * .004 * (i + 1); });
      camera.position.z = 30;
    },
    dispose() { root.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); },
  };
}
