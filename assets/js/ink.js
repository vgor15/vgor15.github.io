/* ============================================================
   VYOM GOR: ink.js, gold ink behind the Contact letter
   A real fluid simulation (stable fluids: advection, vorticity,
   pressure projection) on the GPU. Moving the pointer anywhere stirs
   the ink. Needs WebGL2 with float buffers; otherwise nothing runs.
   Stops when the tab is hidden; off for reduced motion.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  "use strict";
  if (window.V.REDUCED) return;
  const cv = document.createElement("canvas");
  cv.className = "ink"; cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const gl = cv.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl || !(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float"))) { cv.remove(); return; }
  gl.getExtension("OES_texture_float_linear");

  const VS = `#version 300 es
in vec2 aPos; out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB; uniform vec2 texel;
void main(){ vUv=aPos*.5+.5; vL=vUv-vec2(texel.x,0.); vR=vUv+vec2(texel.x,0.); vT=vUv+vec2(0.,texel.y); vB=vUv-vec2(0.,texel.y); gl_Position=vec4(aPos,0.,1.); }`;
  const H = `#version 300 es
precision highp float; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; out vec4 o;`;
  const FS = {
    splat: H + `uniform sampler2D uTarget; uniform float aspect; uniform vec3 color; uniform vec2 point; uniform float radius;
void main(){ vec2 p=vUv-point; p.x*=aspect; o=vec4(texture(uTarget,vUv).xyz+exp(-dot(p,p)/radius)*color,1.); }`,
    advect: H + `uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texel; uniform float dt; uniform float dissipation;
void main(){ vec2 c=vUv-dt*texture(uVelocity,vUv).xy*texel; o=texture(uSource,c)/(1.+dissipation*dt); }`,
    curl: H + `uniform sampler2D uVelocity; void main(){ float L=texture(uVelocity,vL).y,R=texture(uVelocity,vR).y,T=texture(uVelocity,vT).x,B=texture(uVelocity,vB).x; o=vec4(.5*(R-L-T+B),0.,0.,1.); }`,
    vort: H + `uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float strength; uniform float dt;
void main(){ float L=texture(uCurl,vL).x,R=texture(uCurl,vR).x,T=texture(uCurl,vT).x,B=texture(uCurl,vB).x,C=texture(uCurl,vUv).x;
 vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L)); f/=length(f)+1e-4; f*=strength*C; f.y*=-1.; o=vec4(clamp(texture(uVelocity,vUv).xy+f*dt,-1000.,1000.),0.,1.); }`,
    div: H + `uniform sampler2D uVelocity; void main(){ float L=texture(uVelocity,vL).x,R=texture(uVelocity,vR).x,T=texture(uVelocity,vT).y,B=texture(uVelocity,vB).y; vec2 C=texture(uVelocity,vUv).xy;
 if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y; o=vec4(.5*(R-L+T-B),0.,0.,1.); }`,
    clear: H + `uniform sampler2D uTexture; uniform float value; void main(){ o=value*texture(uTexture,vUv); }`,
    press: H + `uniform sampler2D uPressure; uniform sampler2D uDivergence; void main(){ float L=texture(uPressure,vL).x,R=texture(uPressure,vR).x,T=texture(uPressure,vT).x,B=texture(uPressure,vB).x; o=vec4((L+R+B+T-texture(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
    grad: H + `uniform sampler2D uPressure; uniform sampler2D uVelocity; void main(){ float L=texture(uPressure,vL).x,R=texture(uPressure,vR).x,T=texture(uPressure,vT).x,B=texture(uPressure,vB).x; o=vec4(texture(uVelocity,vUv).xy-vec2(R-L,T-B),0.,1.); }`,
    show: H + `uniform sampler2D uDye; uniform vec3 paper; uniform vec3 gold; uniform vec3 deep;
void main(){ float d=texture(uDye,vUv).r; vec3 c=mix(paper,gold,smoothstep(0.,.9,d)); c=mix(c,deep,smoothstep(1.,2.6,d)); o=vec4(c,1.); }`,
  };
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  let P;
  try {
    const vs = sh(gl.VERTEX_SHADER, VS);
    P = Object.fromEntries(Object.entries(FS).map(([k, src]) => {
      const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, src)); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
      return [k, { p, u }];
    }));
  } catch (e) { console.warn("[ink]", e); cv.remove(); return; }
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const fbo = (w, h, ifmt, fmt) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.HALF_FLOAT, null); const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT); return { t, f, w, h }; };
  const dbl = (w, h, i, f) => { let a = fbo(w, h, i, f), b = fbo(w, h, i, f); return { get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; }, w, h }; };
  const coarse = matchMedia("(pointer: coarse)").matches;
  let vel, dye, divg, curlT, pres;
  const init = () => {
    const ar = innerWidth / Math.max(1, innerHeight), S = coarse ? 80 : 112, DY = coarse ? 320 : 512;
    const sw = Math.round(ar >= 1 ? S * ar : S), sh2 = Math.round(ar >= 1 ? S : S / ar), dw = Math.round(ar >= 1 ? DY * ar : DY), dh = Math.round(ar >= 1 ? DY : DY / ar);
    vel = dbl(sw, sh2, gl.RG16F, gl.RG); dye = dbl(dw, dh, gl.R16F, gl.RED); divg = fbo(sw, sh2, gl.R16F, gl.RED); curlT = fbo(sw, sh2, gl.R16F, gl.RED); pres = dbl(sw, sh2, gl.R16F, gl.RED);
  };
  const size = () => { cv.width = Math.round(innerWidth * Math.min(devicePixelRatio || 1, 1.25)); cv.height = Math.round(innerHeight * Math.min(devicePixelRatio || 1, 1.25)); init(); };
  size(); let rT; addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(size, 200); });
  const draw = (t) => { if (t) { gl.viewport(0, 0, t.w, t.h); gl.bindFramebuffer(gl.FRAMEBUFFER, t.f); } else { gl.viewport(0, 0, cv.width, cv.height); gl.bindFramebuffer(gl.FRAMEBUFFER, null); } gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const use = (pr, tx) => { gl.useProgram(pr.p); if (pr.u.texel) gl.uniform2f(pr.u.texel, 1 / tx.w, 1 / tx.h); return pr.u; };
  const bind = (unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t.t); return unit; };
  const splat = (x, y, dx, dy, amt) => {
    let u = use(P.splat, vel.read); gl.uniform1i(u.uTarget, bind(0, vel.read)); gl.uniform1f(u.aspect, innerWidth / Math.max(1, innerHeight)); gl.uniform2f(u.point, x, y); gl.uniform3f(u.color, dx, dy, 0); gl.uniform1f(u.radius, 0.0018); draw(vel.write); vel.swap();
    u = use(P.splat, dye.read); gl.uniform1i(u.uTarget, bind(0, dye.read)); gl.uniform3f(u.color, amt, 0, 0); gl.uniform1f(u.radius, 0.0012); draw(dye.write); dye.swap();
  };
  const theme = () => document.documentElement.getAttribute("data-theme") === "dark"
    ? { paper: [0.082, 0.078, 0.071], gold: [0.62, 0.5, 0.24], deep: [0.85, 0.74, 0.45] }
    : { paper: [0.953, 0.945, 0.922], gold: [0.71, 0.54, 0.18], deep: [0.36, 0.26, 0.07] };
  let colors = theme();
  document.addEventListener("vg:theme", () => (colors = theme()));
  const step = (dt) => {
    let u = use(P.curl, vel.read); gl.uniform1i(u.uVelocity, bind(0, vel.read)); draw(curlT);
    u = use(P.vort, vel.read); gl.uniform1i(u.uVelocity, bind(0, vel.read)); gl.uniform1i(u.uCurl, bind(1, curlT)); gl.uniform1f(u.strength, 20); gl.uniform1f(u.dt, dt); draw(vel.write); vel.swap();
    u = use(P.div, vel.read); gl.uniform1i(u.uVelocity, bind(0, vel.read)); draw(divg);
    u = use(P.clear, pres.read); gl.uniform1i(u.uTexture, bind(0, pres.read)); gl.uniform1f(u.value, 0.8); draw(pres.write); pres.swap();
    u = use(P.press, pres.read); gl.uniform1i(u.uDivergence, bind(1, divg));
    for (let i = 0; i < 18; i++) { gl.uniform1i(u.uPressure, bind(0, pres.read)); draw(pres.write); pres.swap(); }
    u = use(P.grad, pres.read); gl.uniform1i(u.uPressure, bind(0, pres.read)); gl.uniform1i(u.uVelocity, bind(1, vel.read)); draw(vel.write); vel.swap();
    u = use(P.advect, vel.read); gl.uniform1i(u.uVelocity, bind(0, vel.read)); gl.uniform1i(u.uSource, bind(0, vel.read)); gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, 0.25); draw(vel.write); vel.swap();
    u = use(P.advect, vel.read); gl.uniform1i(u.uVelocity, bind(0, vel.read)); gl.uniform1i(u.uSource, bind(1, dye.read)); gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, 0.45); draw(dye.write); dye.swap();
    u = use(P.show, dye.read); gl.uniform1i(u.uDye, bind(0, dye.read)); gl.uniform3fv(u.paper, colors.paper); gl.uniform3fv(u.gold, colors.gold); gl.uniform3fv(u.deep, colors.deep); draw(null);
  };
  const ptr = { x: 0, y: 0, px: 0, py: 0, moved: false, has: false };
  addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth, y = 1 - e.clientY / innerHeight;
    if (!ptr.has) { ptr.px = x; ptr.py = y; ptr.has = true; }
    ptr.x = x; ptr.y = y; ptr.moved = true; wake();
  }, { passive: true });
  for (let i = 0; i < 4; i++) splat(0.15 + i * 0.24, 0.25 + (i % 2) * 0.45, (i % 2 ? -1 : 1) * 700, 400, 1.8);
  let raf = 0, last = 0, idle = 0;
  const frame = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
    if (ptr.moved) { splat(ptr.x, ptr.y, (ptr.x - ptr.px) * 5000, (ptr.y - ptr.py) * 5000, 1.2); ptr.px = ptr.x; ptr.py = ptr.y; ptr.moved = false; idle = 0; } else idle += dt;
    step(dt);
    // the ink settles after a few quiet seconds; then the loop sleeps until the pointer moves again
    raf = idle < 6 && !document.hidden ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener("visibilitychange", wake);
  wake();
});
